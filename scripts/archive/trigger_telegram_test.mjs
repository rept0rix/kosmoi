
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gzjzeywhqbwppfxqkptf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6anpleXdocWJ3cHBmeHFrcHRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MTg5NTMsImV4cCI6MjA3OTE5NDk1M30.y8xbJ06Mr17O4Y0KZH_MlozxlOma92wjIpH4ers8zeI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function triggerTelegramTest() {
    console.log("👉 Triggering Telegram Test...");

    const { data: meetings } = await supabase
        .from('board_meetings')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

    if (!meetings || !meetings.length) {
        console.log("❌ No active meeting found.");
        return;
    }
    const meeting = meetings[0];
    console.log(`Found meeting: ${meeting.id}`);

    const { error } = await supabase.from('board_messages').insert([{
        meeting_id: meeting.id,
        agent_id: 'HUMAN_USER',
        content: "@CEO Please use the 'send_telegram' tool IMMEDIATELY to send a test message to my Telegram. Do not create a task, just do it.",
        type: 'text'
    }]);

    if (error) {
        console.error("❌ Insert Error:", error);
    } else {
        console.log("✅ Test trigger sent.");
    }
}

triggerTelegramTest();
