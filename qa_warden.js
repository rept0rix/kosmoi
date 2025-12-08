
// import fetch from 'node-fetch'; // Native in Node 18+
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Configuration
const CHECK_INTERVAL_MS = 10000; // Check every 10 seconds
const TARGET_URL = 'http://localhost:5173';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const AGENT_ROLE = 'tech-lead-agent'; // Who fixes the bugs?

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ Missing Supabase credentials.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
let lastStatus = 'ok';

console.log(`🛡️ QA Warden Active. Monitoring ${TARGET_URL}...`);

async function checkHealth() {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

        const res = await fetch(TARGET_URL, { signal: controller.signal });
        clearTimeout(timeout);

        if (res.ok) {
            if (lastStatus !== 'ok') {
                console.log(`✅ Site recovered! Status: ${res.status}`);
                lastStatus = 'ok';
            } else {
                process.stdout.write('.'); // Heartbeat
            }
        } else {
            console.error(`\n🚨 Health Check Failed: HTTP ${res.status}`);
            await reportIssue(`HTTP Error ${res.status}`, `The site returned status code ${res.status} at ${new Date().toISOString()}`);
        }

        // Optional: Check body content for specific error overlays (like Vite error overlay)
        // const body = await res.text();
        // if (body.includes("ErrorOverlay") || body.includes("Build failed")) { ... }

    } catch (error) {
        console.error(`\n🚨 Connection Error: ${error.message}`);
        if (error.code === 'ECONNREFUSED') {
            await reportIssue('Site Down (Connection Refused)', `The dev server seems to be down. Error: ${error.message}. Please restart the server or fix the crash.`);
        } else {
            await reportIssue('Health Check Error', `Unknown error probing site: ${error.message}`);
        }
    }
}

async function reportIssue(title, description) {
    if (lastStatus === 'error') return; // Don't spam tasks if already broken
    lastStatus = 'error';

    console.log("⚡ Summoning Agent to fix...");

    const { data: existingTasks } = await supabase.from('agent_tasks')
        .select('*')
        .eq('status', 'in_progress')
        .eq('title', `URGENT: ${title}`)
        .limit(1);

    if (existingTasks && existingTasks.length > 0) {
        console.log("⚠️ Fix task already in progress. Skipping.");
        return;
    }

    const { error } = await supabase.from('agent_tasks').insert([{
        title: `URGENT: ${title}`,
        description: description + "\n\nDetected by QA Warden.",
        assigned_to: AGENT_ROLE,
        priority: 'emergency',
        status: 'pending'
    }]);

    if (error) console.error("Failed to create task:", error);
    else console.log("✅ Emergency Task Created for Tech Lead.");
}

setInterval(checkHealth, CHECK_INTERVAL_MS);
checkHealth(); // First run immediately
