
import { createClient } from '@supabase/supabase-js';
import { WebSocket } from 'ws';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load .env manually to ensure VITE_ vars are present for sub-modules
// We do this BEFORE any other imports that might depend on env vars.
try {
    const envConfig = dotenv.parse(fs.readFileSync('.env'));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
} catch (e) {
    console.warn("Could not load .env file manually:", e.message);
    dotenv.config();
}

// Polyfills for Node.js
global.WebSocket = WebSocket;

// Dynamic Imports to ensure Environment Variables are loaded FIRST
const { agents } = await import('./src/services/agents/AgentRegistry.js');
const { BoardOrchestrator } = await import('./src/services/agents/BoardOrchestrator.js');
const { getAgentReply } = await import('./src/services/agents/AgentBrain.js');
const { toolRouter } = await import('./src/services/agents/AgentService.js');


// Set Environment Variables for AgentService
if (!process.env.VITE_GEMINI_API_KEY) {
    console.log("⚠️  VITE_GEMINI_API_KEY not found in environment. Please run with: VITE_GEMINI_API_KEY=your_key node run_agents_terminal.mjs");
}

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://gzjzeywhqbwppfxqkptf.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
    console.warn("⚠️  SUPABASE_SERVICE_ROLE_KEY not found (checked VITE_ prefix too). Agents might fail if RLS is enabled.");
}

// Use Service Key if available, otherwise Anon Key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY);

// State
let activeMeeting = null;
let lastMessageId = null;
let isProcessing = false;

async function fetchActiveMeeting() {
    const { data, error } = await supabase
        .from('board_meetings')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

    if (data && data.length > 0) {
        return data[0];
    }
    return null;
}

async function fetchNewMessages(meetingId) {
    let query = supabase
        .from('board_messages')
        .select('*')
        .eq('meeting_id', meetingId)
        .order('created_at', { ascending: true });

    const { data } = await query;
    return data || [];
}

async function runLoop() {
    console.log("🤖 Agent Terminal Runner Started");
    console.log("Waiting for active meeting...");

    setInterval(async () => {
        if (isProcessing) return;
        isProcessing = true;

        try {
            // 1. Get Meeting
            if (!activeMeeting) {
                activeMeeting = await fetchActiveMeeting();
                if (activeMeeting) {
                    console.log(`✅ Connected to meeting: "${activeMeeting.title}"`);
                } else {
                    process.stdout.write('.'); // Heartbeat
                    isProcessing = false;
                    return;
                }
            }

            // 2. Get Messages
            const messages = await fetchNewMessages(activeMeeting.id);
            if (messages.length === 0) {
                isProcessing = false;
                return;
            }

            const lastMsg = messages[messages.length - 1];

            // Check if we already processed this message
            if (lastMsg.id === lastMessageId) {
                isProcessing = false;
                return;
            }

            // New message detected!
            lastMessageId = lastMsg.id;
            console.log(`\n[${lastMsg.agent_id}] ${lastMsg.content.substring(0, 50)}...`);

            // 3. Orchestrator Decision
            const orchestrator = new BoardOrchestrator(agents);

            // We need to map messages to the format expected by Orchestrator
            const history = messages.map(m => ({
                role: m.agent_id === 'HUMAN_USER' ? 'user' : 'assistant',
                agentId: m.agent_id,
                content: m.content
            }));

            // Decide who speaks next
            const decision = await orchestrator.getNextSpeaker(
                activeMeeting.title,
                history,
                true, // Auto-discuss ON
                {}, // Company state (mock)
                agents.map(a => a.id) // All agents active
            );

            if (decision.nextSpeakerId && decision.nextSpeakerId !== 'TERMINATE') {
                const speakerId = decision.nextSpeakerId;
                const agent = agents.find(a => a.id === speakerId);

                if (agent) {
                    console.log(`\n🎤 Next Speaker: ${agent.role} (${agent.id})`);
                    console.log(`   Reason: ${decision.reason}`);

                    // 4. Generate Reply
                    console.log(`   Thinking...`);
                    const response = await getAgentReply(agent, messages, {
                        meetingTitle: activeMeeting.title,
                        config: {}
                    });

                    console.log(`   💡 Reply: ${response.message}`);

                    // 5. Execute Action (Generic)
                    if (response.action) {
                        let actionType = response.action.type || response.action.name;
                        let actionPayload = response.action.payload || response.action;

                        // Unwrap specific 'tool_call' wrapper if present
                        if (actionType === 'tool_call') {
                            actionType = response.action.name;
                            actionPayload = response.action.payload;
                        }

                        console.log(`   ⚡ Executing Action: ${actionType}`);

                        // 1. Log Tool Start to DB
                        await supabase.from('board_messages').insert([{
                            meeting_id: activeMeeting.id,
                            agent_id: 'SYSTEM',
                            content: `**Executing Tool**: ${agent.role} is using \`${actionType}\`...`,
                            type: 'system'
                        }]);

                        try {
                            const result = await toolRouter(actionType, actionPayload, {
                                userId: 'terminal-user',
                                agentId: agent.id
                            });
                            console.log(`   ✅ Result: ${result.substring(0, 100)}...`);

                            // 2. Log Tool Result to DB
                            await supabase.from('board_messages').insert([{
                                meeting_id: activeMeeting.id,
                                agent_id: 'SYSTEM',
                                content: `**Tool Result (${actionType})**:\n\`\`\`\n${result}\n\`\`\``,
                                type: 'system'
                            }]);

                        } catch (err) {
                            console.error(`   ❌ Action Failed: ${err.message}`);

                            // Log Failure
                            await supabase.from('board_messages').insert([{
                                meeting_id: activeMeeting.id,
                                agent_id: 'SYSTEM',
                                content: `**Tool Failed (${actionType})**:\n${err.message}`,
                                type: 'system'
                            }]);
                        }
                    }

                    // 6. Save Message to DB
                    let content = response.message;
                    if (response.action && (response.action.type === 'write_code' || response.action.code)) {
                        content += `\n\n\`\`\`${response.action.language || 'javascript'}\n${response.action.code}\n\`\`\``;
                    }

                    await supabase.from('board_messages').insert([{
                        meeting_id: activeMeeting.id,
                        agent_id: agent.id,
                        content: content,
                        type: response.action ? 'action' : 'text'
                    }]);
                }
            } else {
                console.log("   (Silence)");
                // If orchestrator says terminate, we might want to log it once
                if (decision.nextSpeakerId === 'TERMINATE') {
                    console.log("   (Mission/Conversation Terminated by Orchestrator)");
                }
            }

        } catch (e) {
            console.error("Error in loop:", e);
        }

        isProcessing = false;
    }, 3000); // Poll every 3 seconds
}

runLoop();
