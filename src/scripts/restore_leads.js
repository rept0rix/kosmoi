
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Environment setup
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY; // Use Service Role to bypass potential RLS issues during restore

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function restoreLeads() {
    console.log("🔄 Starting Leads Restoration...");

    // 1. Load Backup
    const backupPath = path.join(__dirname, '../../leads_backup.json');
    if (!fs.existsSync(backupPath)) {
        console.error("❌ Backup file not found:", backupPath);
        return;
    }

    const leads = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    console.log(`📦 Found ${leads.length} leads to restore.`);

    // 2. Insert into DB
    const { data, error } = await supabase
        .from('service_providers')
        .insert(leads)
        .select();

    if (error) {
        console.error("❌ Restoration Failed:", error.message);
    } else {
        console.log("✅ SUCCESS! Leads restored:");
        data.forEach(lead => console.log(`   - ${lead.business_name} (${lead.status})`));
    }
}

restoreLeads();
