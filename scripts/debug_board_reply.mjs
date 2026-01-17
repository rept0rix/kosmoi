import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const VITE_SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const VITE_SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!VITE_SUPABASE_URL || !VITE_SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing Environment Variables!");
    process.exit(1);
}

const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_SERVICE_ROLE_KEY);

async function runReply() {
    console.log("🔗 Polling for Board Room messages...");

    // Dynamic import to ensure env vars are loaded before supabase initializes in these modules
    const { AgentService } = await import('../src/features/agents/services/AgentService.js');
    const { agents } = await import('../src/features/agents/services/AgentRegistry.js');

    // 1. Get the latest meeting
    const { data: meetings } = await supabase
        .from('board_meetings')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

    if (!meetings || meetings.length === 0) {
        console.log("No active meeting.");
        return;
    }
    const meeting = meetings[0];

    // 2. Get the latest message
    const { data: messages } = await supabase
        .from('board_messages')
        .select('*')
        .eq('meeting_id', meeting.id)
        .order('created_at', { ascending: false })
        .limit(10);

    if (!messages || messages.length === 0) {
        console.log("No messages in meeting.");
        return;
    }

    const lastMsg = messages[0];
    if (lastMsg.agent_id !== 'HUMAN_USER' && !lastMsg.content.includes('EXECUTE NOW')) {
        console.log("Last message was from an agent. Waiting for human/system input or forced trigger.");
        // For debugging, we'll force a reply if it's the 'Evolution' trigger
    }

    console.log(`💬 Last Message: [${lastMsg.agent_id}] ${lastMsg.content.substring(0, 50)}...`);

    // 3. Pick an agent to respond (Default to CEO)
    const ceoConfig = agents.find(a => a.id === 'ceo-agent');
    const ceoService = new AgentService(ceoConfig, { userId: 'SYSTEM_BOT' });

    console.log(`🤖 CEO thinking...`);

    // Format history for AgentBrain
    const history = messages.reverse().map(m => ({
        agent_id: m.agent_id,
        content: m.content,
        created_at: m.created_at
    }));

    const responseRaw = await ceoService.sendMessage(lastMsg.content, history);
    const responseText = responseRaw.text || JSON.stringify(responseRaw);

    console.log(`✅ CEO Response: ${responseText}`);

    // 4. Save to DB
    const { error } = await supabase
        .from('board_messages')
        .insert([{
            meeting_id: meeting.id,
            agent_id: 'ceo-agent',
            content: responseText,
            type: 'text'
        }]);

    if (error) console.error("Failed to post response:", error);
    else console.log("🚀 Posted to Board Room!");

    // 5. If there's an action, the worker will pick it up via agent_tasks anyway.
}

runReply();
