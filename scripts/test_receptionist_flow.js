
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { ReceptionistAgent } from '../src/features/agents/services/ReceptionistAgent.js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in environment.');
    console.error('Available keys:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testReceptionistFlow() {
    console.log('🧪 Starting Receptionist Flow Test...');

    // 1. Setup: Ensure we have a test provider with auto-reply enabled
    // We need a provider_id. Let's find one.
    const { data: config, error: configError } = await supabase
        .from('agent_configurations')
        .select('*')
        .eq('agent_type', 'receptionist')
        .eq('is_active', true)
        .limit(1)
        .single();

    if (configError || !config) {
        console.error('❌ No active receptionist config found. Please enable it in the dashboard first.');
        if (configError) console.error(configError);
        return;
    }

    const providerId = config.provider_id;
    console.log(`👤 Testing with Provider ID: ${providerId}`);

    // 2. Create a test meeting (if not exists)
    // Based on schema: id, title, status, provider_id (no participants or type)
    // Let database generate UUID for ID
    const { data: meeting, error: meetingError } = await supabase
        .from('board_meetings')
        .insert({
            title: 'Test Customer Chat',
            provider_id: providerId,
            status: 'active'
        })
        .select()
        .single();

    if (meetingError) {
        console.error('❌ Failed to create test meeting:', meetingError.message);
        return;
    }
    const testMeetingId = meeting.id;
    console.log(`📅 Created Test Meeting: ${testMeetingId}`);

    // 3. Insert a customer message
    // Based on schema: id, meeting_id, agent_id, content, type (no sender_id or role)
    // We use agent_id='HUMAN_USER' for customer messages as per useServiceProviderChat.js
    const { data: message, error: messageError } = await supabase
        .from('board_messages')
        .insert({
            meeting_id: testMeetingId,
            agent_id: 'HUMAN_USER',
            content: 'Hello, what are your opening hours today?',
            type: 'text',
            created_at: new Date().toISOString()
        })
        .select()
        .single();

    if (messageError) {
        console.error('❌ Failed to send test message:', messageError.message);
        return;
    }
    console.log(`💬 Sent Customer Message: "${message.content}"`);

    // 4. Trigger the Receptionist Logic (Simulation of Worker)
    console.log('🤖 Invoking Receptionist Agent...');

    // In the real worker, we poll. Here we call the logic directly.
    try {
        const response = await ReceptionistAgent.handleIncomingMessage(message, providerId, supabase);

        if (response) {
            console.log(`✅ Agent Generated Reply: "${response}"`);

            // Simulate Worker Insertion
            const { error: replyError } = await supabase
                .from('board_messages')
                .insert({
                    meeting_id: testMeetingId,
                    agent_id: 'receptionist-agent', // Use correct agent ID
                    content: response,
                    type: 'text'
                    // metadata: { agent: 'ReceptionistAgent' } // REMOVED: Not in schema
                });

            if (replyError) console.error('❌ Failed to save agent reply:', replyError);
            else console.log('💾 Agent reply saved to database.');

        } else {
            console.log('⚠️ Agent did not return a response (maybe auto-reply is off or tone mismatch).');
        }

    } catch (err) {
        console.error('❌ Error executing agent:', err);
    }
}

testReceptionistFlow();
