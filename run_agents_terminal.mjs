
import { createClient } from '@supabase/supabase-js';
import { WebSocket } from 'ws';
import { agents } from './src/services/agents/AgentRegistry.js';
import { BoardOrchestrator } from './src/services/agents/BoardOrchestrator.js';
import { getAgentReply } from './src/services/agents/AgentBrain.js';
import { toolRouter } from './src/services/agents/AgentService.js';

// Polyfills for Node.js
global.WebSocket = WebSocket;

// Set Environment Variables for AgentService
// Set Environment Variables for AgentService
if (!process.env.VITE_GEMINI_API_KEY) {
    console.log("⚠️  VITE_GEMINI_API_KEY not found in environment. Please run with: VITE_GEMINI_API_KEY=your_key node run_agents_terminal.mjs");
}

// Configuration
const SUPABASE_URL = 'https://gzjzeywhqbwppfxqkptf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6anpleXdocWJ3cHBmeHFrcHRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MTg5NTMsImV4cCI6MjA3OTE5NDk1M30.y8xbJ06Mr17O4Y0KZH_MlozxlOma92wjIpH4ers8zeI';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
    console.warn("⚠️  SUPABASE_SERVICE_ROLE_KEY not found. Agents might fail if RLS is enabled.");
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

    // In a real polling loop, we'd filter by > lastMessageId, but for simplicity we fetch all and slice locally or rely on distinct
    // Actually, let's just fetch the last 20 and process any we haven't seen?
    // Better: fetch all for context, but only "process" the last one if it's new.

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
                // Nothing new.
                // Check if we should auto-discuss (if last was agent, maybe wait? But BoardRoom handles auto-discuss via UI)
                // Here we want to simulate the "Backend" agents.
                // If the last message was from a USER, we MUST reply.
                // If the last message was from an AGENT, we might reply if auto-discuss is on.
                // For this script, let's assume we ALWAYS reply if the last message was NOT from us (the runner) 
                // BUT we need to coordinate.

                // SIMPLIFICATION: We only reply if the last message was from 'HUMAN_USER'.
                // The agents in the browser (BoardRoom) might be running too. We don't want double replies.
                // User asked to "open terminals of the bots".
                // If BoardRoom is open, it will reply.
                // If BoardRoom is closed, this script should reply.

                // Let's assume this script is the PRIMARY runner now.
                // But we need to avoid infinite loops if we reply to ourselves.

                // We will rely on the Orchestrator to decide if we should speak.
                // But Orchestrator needs to know who "we" are.
                // We are ALL the agents.

                // Let's use a simple trigger:
                // If last message is USER -> Trigger Orchestrator.
                // If last message is AGENT -> Trigger Orchestrator (Auto-Discuss).

                // To avoid spam, we'll wait a bit.
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
            // We pass 'true' for autoDiscuss to keep the conversation going
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
                    if (response.action) {
                        console.log(`   ⚡ Action: ${response.action.type}`);
                    }

                    // 5. Execute Action (Write Code, etc.)
                    if (response.action && response.action.type === 'write_code') {
                        console.log(`   💾 Writing code to ${response.action.title}...`);
                        await toolRouter('write_code', {
                            path: response.action.title,
                            content: response.action.code
                        }, { userId: 'terminal-user', agentId: agent.id });
                    }

                    // 6. Save Message to DB
                    // We append the code to the message for visibility
                    let content = response.message;
                    if (response.action && response.action.type === 'write_code') {
                        content += `\n\n\`\`\`${response.action.language}\n${response.action.code}\n\`\`\``;
                    }

                    await supabase.from('board_messages').insert([{
                        meeting_id: activeMeeting.id,
                        agent_id: agent.id,
                        content: content,
                        type: response.action ? 'action' : 'text'
                    }]);

                    // Update lastMessageId so we don't process our own message immediately as a trigger (wait for next poll)
                    // Actually, fetching again in next loop will get it.
                }
            } else {
                console.log("   (Silence)");
            }

        } catch (e) {
            console.error("Error in loop:", e);
        }

        isProcessing = false;
    }, 3000); // Poll every 3 seconds
}

runLoop();
