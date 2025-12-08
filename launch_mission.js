
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

// Helper to load VITE vars
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Missing Supabase credentials. Check .env file.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function launchMission() {
    console.log("🚀 Launching 'Premium Service Badge' Mission...");

    // 1. Create Meeting
    // Remove 'created_by' as it might not affect the schema or default to null?
    // Actually, let's check if the column exists. The error said 'Could not find the created_by column'.
    // So we remove it.
    const { data: meeting, error: meetingError } = await supabase
        .from('board_meetings')
        .insert([{
            title: "Mission: Premium Service Verification Grid",
            status: "active"
            // created_by removed
        }])
        .select()
        .single();


    if (meetingError) {
        console.error("Failed to create meeting:", meetingError);
        return;
    }
    console.log(`✅ Meeting Created: ${meeting.title} (${meeting.id})`);

    // 2. Seed Initial Prompt
    const prompt = `
@ceo-agent @product-vision-agent @ux-agent @tech-lead-agent 

**MISSION DIRECTIVE: Premium Service Verification System**

We need to implement a system to verify service providers and award them a 'Premium' badge. This is a cross-functional mission.

**Objectives:**
1. **Product**: Define criteria for 'Premium' status (e.g., >4.5 stars, verified documents).
2. **UX**: Design the 'Premium Badge' component and where it appears on the ServiceProviderCard.
3. **Tech**: Plan the database changes (new 'is_premium' column?) and API logic.
4. **Execution**: Implement the changes (Frontend + Backend).
5. **Marketing**: Draft an announcement email to existing providers.

**Protocol:**
- **CEO**: Kick off the session, assign roles, and ensure we stay on track.
- **Product**: Start by defining the logic.
- **UX**: Create the component code.
- **Tech Lead**: Review code and database schema.

GO!
    `.trim();

    const { error: msgError } = await supabase
        .from('board_messages')
        .insert([{
            meeting_id: meeting.id,
            agent_id: "HUMAN_USER",
            content: prompt,
            type: "text"
        }]);

    if (msgError) {
        console.error("Failed to send prompt:", msgError);
    } else {
        console.log("✅ Mission Briefing Sent!");
        console.log("👉 Now run 'node run_agents_terminal.mjs' (or check Board Room) to watch the execution.");
    }
}

launchMission();
