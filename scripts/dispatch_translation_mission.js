
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Initialize Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY; // Changed from SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function dispatchMissions() {
    console.log("🚀 Dispatching Localization Missions...");

    // 1. Read Audit
    const auditPath = path.resolve(process.cwd(), 'translation_audit.json');
    if (!fs.existsSync(auditPath)) {
        console.error("❌ translation_audit.json not found.");
        return;
    }

    const audit = JSON.parse(fs.readFileSync(auditPath, 'utf-8'));
    const filesToTranslate = Object.keys(audit.details);

    console.log(`📋 Found ${filesToTranslate.length} files to localize.`);

    // 2. Dispatch Tasks - FULL SCALE
    console.log(`🎯 Dispatching ALL ${filesToTranslate.length} files to worker queue.`);

    const alreadyDispatched = ['components/LandingHero.jsx', 'pages/AboutUs.jsx', 'pages/BusinessInfo.jsx'];

    for (const file of filesToTranslate) {
        if (alreadyDispatched.includes(file)) {
            console.log(`⏩ Skipping ${file} (already dispatched)`);
            continue;
        }

        const hardcodedStrings = audit.details[file];

        const taskPayload = {
            assigned_to: 'translator-agent', // Target the specific worker we just spawned
            title: `Localize ${path.basename(file)}`,
            description: `
            MISSION: Localize the file '${file}'.
            
            CONTEXT:
            The file contains the following hardcoded strings detected by audit:
            ${JSON.stringify(hardcodedStrings, null, 2)}

            INSTRUCTIONS:
            1. Read the file: src/${file}
            2. Replace hardcoded strings with t('section.key') hooks.
            3. Use the 'file_search' or 'read_file' tool.
            4. Use 'replace_content' to update the code.
            5. IMPORTANT: You must also update 'src/i18n.js' to include the new keys for 'en' and 'he'.
            
            Use your 'write_file' or 'replace_content' tools for this.
            `,
            status: 'pending',
            priority: 'high',
            created_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('agent_tasks')
            .insert(taskPayload)
            .select();

        if (error) {
            console.error(`❌ Failed to dispatch task for ${file}:`, error.message);
        } else {
            console.log(`✅ Task dispatched: Localize ${file} (ID: ${data[0].id})`);
        }
    }
}

dispatchMissions();
