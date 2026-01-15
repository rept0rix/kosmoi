
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import AgentProtocol from './lib/agent_protocol.js';

// --- CONFIGURATION ---
const AGENT_NAME = 'receptionist_agent';
const POLLING_INTERVAL = 5000; // Check every 5 seconds

// Initialize Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Missing Supabase credentials.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize Gemini
const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

// Initialize Protocol
const protocol = new AgentProtocol(AGENT_NAME);

async function run() {
    console.log(`🤖 ${AGENT_NAME} started...`);
    protocol.updateStatus('IDLE', 'Waiting for messages...');

    while (true) {
        try {
            await processActiveChats();
        } catch (error) {
            console.error("❌ Main Loop Error:", error);
        }
        await new Promise(r => setTimeout(r, POLLING_INTERVAL));
    }
}

async function processActiveChats() {
    // 1. Find active meetings linked to a provider
    const { data: meetings, error } = await supabase
        .from('board_meetings')
        .select(`
            id, 
            provider_id,
            status,
            service_providers ( id, business_name, description, opening_hours, price_range, category, business_settings ( ai_auto_reply, ai_tone, custom_instructions ) )
        `)
        .eq('status', 'active')
        .not('provider_id', 'is', null);

    if (error) throw error;
    if (!meetings || meetings.length === 0) return;

    for (const meeting of meetings) {
        const provider = meeting.service_providers;
        const settings = provider?.business_settings?.[0] || provider?.business_settings; // Handle depending on if it returns array or object (Supabase 1:1 usually array unless single())

        // Skip if AI is disabled
        if (!settings?.ai_auto_reply) continue;

        // 2. Check last message
        const { data: messages } = await supabase
            .from('board_messages')
            .select('*')
            .eq('meeting_id', meeting.id)
            .order('created_at', { ascending: false })
            .limit(1);

        if (!messages || messages.length === 0) continue;

        const lastParams = messages[0];

        // 3. Decide if reply is needed
        // Reply if: Last message is NOT from me (the agent) AND NOT from system AND NOT from the business owner (if they stepped in)
        // Ideally, we check 'agent_id'. User messages usually have agent_id='HUMAN_USER' or null.
        if (lastParams.agent_id !== 'receptionist_agent' && lastParams.agent_id !== provider.id && lastParams.agent_id !== 'SYSTEM') {
            // Avoid double replying: check if I recently replied? 
            // Simplest: Check if the last message is from HUMAN.
            if (lastParams.agent_id === 'HUMAN_USER' || !lastParams.agent_id) {
                await generateAndSendReply(meeting.id, provider, settings, lastParams.content);
            }
        }
    }
}

async function generateAndSendReply(meetingId, provider, settings, userMessage) {
    console.log(`💬 Replying to chat for ${provider.business_name}...`);
    protocol.updateStatus('WORKING', `Replying to user for ${provider.business_name}`);

    // Construct Prompt
    const tone = settings.ai_tone || 'professional';
    const instructions = settings.custom_instructions || 'Be helpful and concise.';

    const prompt = `
    You are the AI Receptionist for "${provider.business_name}".
    Your goal is to assist customers based on the business details below.
    
    BUSINESS DETAILS:
    - Name: ${provider.business_name}
    - Category: ${provider.category}
    - Description: ${provider.description}
    - Hours: ${JSON.stringify(provider.opening_hours)}
    - Price Range: ${provider.price_range}
    
    SETTINGS:
    - Tone: ${tone}
    - Instructions: ${instructions}
    
    CUSTOMER MESSAGE: "${userMessage}"
    
    Reply as the receptionist. Keep it short (under 50 words unless detail is needed).
    DO NOT use markdown or emojis unless the tone is friendly/casual.
    `;

    try {
        const result = await model.generateContent(prompt);
        const replyText = result.response.text();

        // Send Reply
        const { error } = await supabase
            .from('board_messages')
            .insert({
                meeting_id: meetingId,
                agent_id: 'receptionist_agent', // Or use the provider's UUID if we want to masquerade
                content: replyText.trim(),
                type: 'text'
            });

        if (error) console.error("Failed to send reply:", error);
        else console.log(`✅ Sent reply: "${replyText.substring(0, 30)}..."`);

    } catch (e) {
        console.error("AI Generation Error:", e);
    }
}

run();
