
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gzjzeywhqbwppfxqkptf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6anpleXdocWJ3cHBmeHFrcHRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MTg5NTMsImV4cCI6MjA3OTE5NDk1M30.y8xbJ06Mr17O4Y0KZH_MlozxlOma92wjIpH4ers8zeI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function triggerChallenge() {
    console.log("🚀 Triggering One Dollar Challenge...");

    // 1. Find the active meeting
    const { data: meetings, error: meetingError } = await supabase
        .from('board_meetings')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

    if (meetingError || !meetings || meetings.length === 0) {
        console.error("❌ No active meeting found. Please create a meeting in the Board Room first.");
        return;
    }

    const meeting = meetings[0];
    console.log(`✅ Found active meeting: "${meeting.title}" (${meeting.id})`);

    // 1.5 Clear previous messages (Reset Memory)
    const { error: deleteError } = await supabase
        .from('board_messages')
        .delete()
        .eq('meeting_id', meeting.id);

    if (deleteError) console.error("Failed to clear history:", deleteError);
    else console.log("🧹 Cleared previous meeting history.");

    // 2. Insert the trigger message
    const prompt = "Start the One Dollar Challenge. FOCUS ON REVENUE. Do not analyze the UI yet. Your goal is to sell a 'Verified Badge' for $1. STRATEGY: 1) CEO: Define the offer. 2) Sales: Create a Stripe Payment Link using your tools. 3) Output the link here. GO.";

    const { error: msgError } = await supabase
        .from('board_messages')
        .insert([{
            meeting_id: meeting.id,
            agent_id: 'HUMAN_USER',
            content: prompt,
            type: 'text'
        }]);

    if (msgError) {
        console.error("❌ Failed to insert message:", msgError);
    } else {
        console.log("✅ Trigger message sent successfully!");
        console.log("👉 Watch the Board Room for the agents' response.");
    }
}

triggerChallenge();
