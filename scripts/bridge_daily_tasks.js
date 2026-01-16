import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv'; // Note: You might need to install dotenv if not present, or simpler regex parsing for .env

// Setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');

// Load Env manually to avoid dependency hell if dotenv isn't installed
const envPath = path.join(ROOT_DIR, '.env');
const envConfig = {};
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) envConfig[key.trim()] = value.trim();
    });
}

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_SERVICE_ROLE_KEY || envConfig.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing VITE_SUPABASE_URL or Key in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function bridgeDailyTasks() {
    const today = new Date().toISOString().split('T')[0];
    const plannerPath = path.join(ROOT_DIR, 'planner', '2026', `${today}.md`);

    if (!fs.existsSync(plannerPath)) {
        console.log(`⚠️ No planner file found for today (${today}).`);
        return;
    }

    console.log(`📂 Reading planner: ${plannerPath}`);
    const content = fs.readFileSync(plannerPath, 'utf8');

    // Regex to find the Task Table
    // Looks for the table header and captures rows until end of table
    const tableRegex = /\| Task ID \| Description \| Assigned Agent \| Dependencies \| Status \|\n\|[\s:-|]*\|\n((?:\|.*\|\n)+)/;
    const match = content.match(tableRegex);

    if (!match || !match[1]) {
        console.log('ℹ️ No task table found or table is empty.');
        return;
    }

    const rows = match[1].trim().split('\n');
    let newTasksCount = 0;

    for (const row of rows) {
        // Parse row: | T-001 | Desc | Agent | Deps | Status |
        const cols = row.split('|').map(c => c.trim()).filter(c => c !== '');
        if (cols.length < 5) continue;

        const [taskId, description, assignedAgentName, dependencies, status] = cols;

        // Skip placeholder rows
        if (description.includes('[Auto-generated') || description === '...') continue;
        // Skip already done or pending in text (we only want to valid "Actionable" ones, or we sync all and let DB handle dupes)
        // For this V1, let's just insert if description is valid and not generic.

        // Map Agent Name to ID (Simple Mapping)
        let agentId = 'tech-lead-agent'; // Default
        if (assignedAgentName.toLowerCase().includes('sales')) agentId = 'sales-pitch-agent';
        if (assignedAgentName.toLowerCase().includes('human')) agentId = 'human_manager';

        // Check if task exists to prevent duplicates (by title/desc checksum or similar)
        // For simplicity, we check if title matches exactly for today
        const { data: existing } = await supabase.from('agent_tasks')
            .select('id')
            .eq('title', description)
            .eq('status', 'pending')
            .single();

        if (!existing) {
            const { error } = await supabase.from('agent_tasks').insert({
                title: description,
                description: `Imported from Daily Planner ${today}. Dependencies: ${dependencies}`,
                assigned_to: agentId,
                priority: 'medium',
                status: 'pending',
                created_by: 'daily_bridge'
            });

            if (error) {
                console.error(`❌ Failed to insert: ${description}`, error.message);
            } else {
                console.log(`✅ Bridge Created Task: "${description}" -> [${agentId}]`);
                newTasksCount++;
            }
        } else {
            // console.log(`⏭️ Task already queued: "${description}"`);
        }
    }

    if (newTasksCount === 0) {
        console.log('✨ System synced. No new tasks to bridge.');
    } else {
        console.log(`🚀 Successfully bridged ${newTasksCount} tasks to the AI Workforce.`);
    }
}

bridgeDailyTasks();
