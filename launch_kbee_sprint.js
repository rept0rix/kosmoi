
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
    console.log("🚀 Launching 'KBee Documentation Sprint' Mission...");

    // 1. Create Meeting
    const { data: meeting, error: meetingError } = await supabase
        .from('board_meetings')
        .insert([{
            title: "Mission: KBee Knowledge Base Generation",
            status: "active"
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
@system-mapping-agent @onboarding-agent @support-agent @tech-lead-agent

**MISSION DIRECTIVE: Generate KBee Knowledge Base**

We are integrating with **KBee**, a new Knowledge Base tool. We need to auto-generate the content for our Help Center.

**Objectives:**
1.  **System Mapper**: Scan the codebase and create a high-level \`system_map.json\` of our features (Auth, Service Map, Bookings).
2.  **Onboarding Agent**: Using the map, write 3 key "How-to" articles:
    - "How to find a service provider"
    - "How to book a service"
    - "How to become a verified pro"
3.  **Support Agent**: Write a FAQ section with 5 common questions.
4.  **Tech Lead (Final Step)**: 
    - Compile ALL the above content into a single JSON file named \`kbee_import.json\`.
    - **Notification**: Use the \`send_telegram\` tool to notify the user: "KBee Import File is Ready!".

\`\`\`json
{
  "brand": { "name": "Kosmoi Help Center" },
  "categories": [
    {
      "name": "Getting Started",
      "articles": [
        { "title": "How to find...", "body": "..." }
      ]
    },
    {
      "name": "FAQ",
      "articles": [ ... ]
    }
  ]
}
\`\`\`

**Protocol:**
- **System Mapper** goes first.
- **Onboarding & Support** work in parallel (or sequential).
- **Tech Lead** consolidates everything at the end.

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
