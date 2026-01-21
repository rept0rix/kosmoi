// @ts-ignore
import { createClient } from 'npm:@supabase/supabase-js@2';
// @ts-ignore
import { Bot, GrammyError, HttpError } from 'npm:grammy@1.21.1'; // Optional if we use Telegram later, but typical for bots. 
// For now, we stick to pure logic.

// Import maps are managed by functions/deno.json
// But we need to ensure the shared logic is accessible. 
// Since we cannot easily import from src/ in Edge Functions without a build step or symlink,
// we will duplicate the minimalist Orchestrator logic here for reliability.
// PRO-TIP: Long term, move shared logic to a shared `_shared` folder in `supabase/functions`.

console.log("Hello from Agent Worker!");

// @ts-ignore
Deno.serve(async (req: Request) => {
  try {
    // 1. Verify Webhook / Request
    // In production, verify the request comes from Supabase Database Webhook
    
    const { record } = await req.json();
    
    if (!record || !record.content || !record.meeting_id) {
        return new Response("No record found in body", { status: 200 }); // Return 200 to acknowledge webhook
    }

    // Only respond to HUMAN_USER messages (prevent infinite loops)
    if (record.agent_id !== 'HUMAN_USER') {
        return new Response("Ignored: Not from human", { status: 200 });
    }

    console.log(`Processing message from meeting: ${record.meeting_id}`);

    // 2. Initialize Supabase Client
    // @ts-ignore
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    // @ts-ignore
    const supabaseKey = Deno.env.get('APP_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 3. Fetch Meeting Context (Agents involved)
    const { data: meeting } = await supabase
        .from('board_meetings')
        .select('*')
        .eq('id', record.meeting_id)
        .single();

    if (!meeting) {
        console.error("Meeting not found");
        return new Response("Meeting not found", { status: 404 });
    }

    // 4. Determine Agent (Simple Routing based on Meeting Title or Config)
    // For now, we support 'Receptionist', 'Consultant', 'Scout'
    let targetAgentId = null; 
    const title = meeting.title ? meeting.title.toLowerCase() : '';

    if (title.includes('onboarding') || title.includes('register')) targetAgentId = 'receptionist';
    else if (title.includes('consult') || title.includes('advice')) targetAgentId = 'consultant';
    else if (title.includes('scout') || title.includes('search')) targetAgentId = 'scout';
    else targetAgentId = 'receptionist'; // Default

    // 5. Call LLM (We need to implement the Agent Logic here)
    // To keep it simple and robust, we will call the Gemini API directly here
    // rather than relying on complex local imports.
    
    // @ts-ignore
    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiKey) {
        console.error("GEMINI_API_KEY not set");
        return new Response("Server Config Error", { status: 500 });
    }

    // Fetch History
    const { data: history } = await supabase
        .from('board_messages')
        .select('*')
        .eq('meeting_id', meeting.id)
        .order('created_at', { ascending: true });

    // Construct Prompt
    const prompt = `
      You are an AI Agent named ${targetAgentId}.
      Context: ${title}.
      
      Chat History:
      ${history?.map((m: any) => `${m.agent_id}: ${m.content}`).join('\n')}
      
      Respond as ${targetAgentId}. Keep it helpful and concise.
    `;

    // Call Gemini
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiKey}`;
    console.log("Calling Gemini:", geminiUrl);

    const geminiResp = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
        })
    });

    const geminiData = await geminiResp.json();
    console.log("Gemini Response:", JSON.stringify(geminiData));

    const replyText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "I'm having trouble thinking right now.";

    // 6. Save Reply
    await supabase.from('board_messages').insert({
        meeting_id: meeting.id,
        agent_id: targetAgentId.toUpperCase(),
        content: replyText,
        type: 'text'
    });

    return new Response(JSON.stringify({ success: true, reply: replyText }), {
        headers: { "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Worker Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
