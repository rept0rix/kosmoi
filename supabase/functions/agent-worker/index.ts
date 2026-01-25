// @ts-ignore
import { createClient } from 'npm:@supabase/supabase-js@2';

// --------------------------------------------------------------------------------
// CONFIGURATION
// --------------------------------------------------------------------------------
const GEMINI_MODEL = "gemini-2.0-flash";

// --------------------------------------------------------------------------------
// MAIN WORKER
// --------------------------------------------------------------------------------
console.log("Agent Worker v2.0 (The Synapse) Starting...");

// @ts-ignore
Deno.serve(async (req: Request) => {
    try {
        // 1. Parse & Validate Payload
        const payload = await req.json();
        const { type, table, record, schema } = payload;

        console.log(`Received Event: ${type} on ${table}`);

        // 2. Initialize Clients
        // @ts-ignore
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        // @ts-ignore
        const supabaseKey = Deno.env.get('APP_SERVICE_ROLE_KEY') ?? '';
        const supabase = createClient(supabaseUrl, supabaseKey);

        // @ts-ignore
        const geminiKeyRaw = Deno.env.get('GEMINI_API_KEY');
        if (!geminiKeyRaw) throw new Error("GEMINI_API_KEY not set");
        const geminiKey = geminiKeyRaw.trim(); // TRIM WHITESPACE just in case

        // --------------------------------------------------------------------------------
        // ROUTER: Decide which synapse to fire
        // --------------------------------------------------------------------------------

        // CASE A: NEW BUSINESS FOUND (Scout -> Sales)
        if (table === 'service_providers' && type === 'INSERT') {
            return await handleNewBusiness(record, supabase, geminiKey);
        }

        // CASE B: CHAT MESSAGE (Board Room)
        if (table === 'board_messages' && type === 'INSERT') {
            if (record.agent_id !== 'HUMAN_USER') {
                return new Response("Ignored: Bot message", { status: 200 });
            }
            return await handleChatMessage(record, supabase, geminiKey);
        }

        return new Response("Event ignored", { status: 200 });

    } catch (error: any) {
        console.error("Worker Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});

// --------------------------------------------------------------------------------
// CONTROLLERS
// --------------------------------------------------------------------------------

async function handleNewBusiness(business: any, supabase: any, geminiKey: string) {
    console.log(`Analyzing new business: ${business.business_name}`);

    // Trigger Sales Agent
    const prompt = `
        You are the 'Sales Scout Agent' for Samui Service Hub.
        A new business has been discovered: "${business.business_name}" (${business.category}).
        Location: ${business.location || "Samui"}.
        
        TASK:
        Draft a short, friendly, high-energy cold email to this business.
        Goal: Invite them to claim their profile on Samui Service Hub to get more customers.
        Tone: Professional, Excited, concise (max 100 words).
        
        Output only the email body text.
    `;

    const aiResponse = await callGemini(prompt, geminiKey);

    // Save as LEAD
    const { error } = await supabase.from('leads').insert({
        business_id: business.id,
        status: 'new',
        type: 'cold_email',
        email: business.email || 'unknown@example.com',
        content: aiResponse
    });

    if (error) {
        console.error("Failed to save lead:", error);
        throw error;
    }

    return new Response(JSON.stringify({ success: true, action: "lead_created" }), {
        headers: { "Content-Type": "application/json" }
    });
}

async function handleChatMessage(message: any, supabase: any, geminiKey: string) {
    console.log(`Processing chat for meeting: ${message.meeting_id}`);

    const { data: meeting } = await supabase.from('board_meetings').select('*').eq('id', message.meeting_id).single();
    if (!meeting) return new Response("Meeting not found", { status: 404 });

    const title = meeting.title ? meeting.title.toLowerCase() : '';
    let agentId = 'RECEPTIONIST';
    if (title.includes('sales')) agentId = 'SALES_AGENT';
    if (title.includes('tech')) agentId = 'CTO';

    const { data: history } = await supabase.from('board_messages').select('*').eq('meeting_id', message.meeting_id).order('created_at', { ascending: true }).limit(10);

    const prompt = `
        You are ${agentId}. 
        Context: ${title}.
        Chat History:
        ${history?.map((m: any) => `${m.agent_id}: ${m.content}`).join('\n')}
        
        Respond to the last message. Be helpful and concise.
    `;

    const reply = await callGemini(prompt, geminiKey);

    await supabase.from('board_messages').insert({
        meeting_id: message.meeting_id,
        agent_id: agentId,
        content: reply,
        type: 'text'
    });

    return new Response(JSON.stringify({ success: true, reply }), {
        headers: { "Content-Type": "application/json" }
    });
}

// --------------------------------------------------------------------------------
// UTILS
// --------------------------------------------------------------------------------

async function callGemini(text: string, key: string) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;

    try {
        const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text }] }] })
        });

        const data = await resp.json();

        if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
            return data.candidates[0].content.parts[0].text;
        }

        return `DEBUG_API_FAIL: Code=${resp.status} Body=${JSON.stringify(data)}`;

    } catch (e: any) {
        return `DEBUG_CRITICAL_FAIL: ${e.message}`;
    }
}
