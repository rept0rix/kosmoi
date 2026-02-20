
import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://gzjzeywhqbwppfxqkptf.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6anpleXdocWJ3cHBmeHFrcHRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MTg5NTMsImV4cCI6MjA3OTE5NDk1M30.y8xbJ06Mr17O4Y0KZH_MlozxlOma92wjIpH4ers8zeI');

async function checkMessages() {
    const { data: meetings } = await supabase.from('board_meetings').select('*').eq('status', 'active').order('created_at', { ascending: false }).limit(1);
    if (!meetings || !meetings.length) {
        console.log("No active meeting found.");
        return;
    }
    const meetingId = meetings[0].id;
    console.log(`Checking meeting: ${meetings[0].title} (${meetingId})`);

    const { data: messages } = await supabase.from('board_messages').select('*').eq('meeting_id', meetingId).order('created_at', { ascending: false }).limit(5);
    console.log(JSON.stringify(messages, null, 2));
}
checkMessages();
