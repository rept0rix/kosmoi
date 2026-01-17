
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

dotenv.config();

const VITE_SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const VITE_SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!VITE_SUPABASE_URL || !VITE_SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing Environment Variables!");
    process.exit(1);
}

const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_SERVICE_ROLE_KEY);

/**
 * EVOLUTION PROTOCOL:
 * This script is designed to be run by the worker or the scheduler to "advance" the company.
 * It reads the roadmap and generates a Daily Protocol for the next day.
 */
async function runEvolution() {
    console.log("🧬 Running Evolution Protocol...");

    // 1. Load context
    const roadmapPath = './JANUARY_2026_ROADMAP.md';
    const tomorrowTasksPath = './TOMORROW_TASKS.md';

    const roadmap = fs.readFileSync(roadmapPath, 'utf-8');
    const tomorrowTasks = fs.readFileSync(tomorrowTasksPath, 'utf-8');

    // 2. Find the Board Meeting
    const { data: meetings } = await supabase
        .from('board_meetings')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

    if (!meetings || meetings.length === 0) {
        console.log("No active meeting. Skipping autonomous planning.");
        return;
    }

    const meeting = meetings[0];
    console.log(`📡 Board Room Active: "${meeting.title}"`);

    // 3. Inject "Planning" Task for CEO
    const now = new Date();
    const nextDay = new Date(now);
    nextDay.setDate(now.getDate() + 1);
    const dateStr = nextDay.toISOString().split('T')[0];

    const prompt = `
Roadmap Context:
${roadmap}

Tomorrow's Carry Over:
${tomorrowTasks}

Target Date: ${dateStr}

Task:
You are the CEO and Board Chairman. 
1. Look at the roadmap and tomorrow's carry over.
2. Create a new file 'planner/2026/${dateStr}.md' following the Daily Protocol format.
3. Populate it with the REAL next steps for the company evolution (Swarm expansion, Revenue, R&D).
4. Assign tasks to the agents via 'create_task' tool immediately.

EXECUTE NOW.
`;

    const { error: msgError } = await supabase
        .from('board_messages')
        .insert([{
            meeting_id: meeting.id,
            agent_id: 'HUMAN_USER', // Or a 'SYSTEM' id
            content: prompt,
            type: 'text'
        }]);

    if (msgError) console.error("Failed to trigger evolution:", msgError);
    else console.log(`✅ Evolution Triggered for ${dateStr}. Check Board Room!`);
}

runEvolution();
