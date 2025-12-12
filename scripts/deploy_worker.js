import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { realSupabase } from '../src/api/supabaseClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const WORKER_FILE_PATH = path.join(PROJECT_ROOT, 'scripts', 'agent_worker.js');

async function deployWorker() {
    console.log("🚀 Starting Worker Deployment (OTA Update)...");

    try {
        // 1. Read the current worker code
        const code = fs.readFileSync(WORKER_FILE_PATH, 'utf-8');
        const stats = fs.statSync(WORKER_FILE_PATH);
        const version = stats.mtime.toISOString(); // Use modification time as version

        console.log(`📦 Loaded agent_worker.js`);
        console.log(`   Size: ${stats.size} bytes`);
        console.log(`   Version: ${version}`);

        // 2. Upload to Supabase 'agent_tasks' (Workaround for Schema Cache)
        // We use a specific ID based on the key to act as a "Singleton"
        const UPDATE_ID = '00000000-0000-0000-0000-000000000001'; // Reserved UUID

        const payload = {
            id: UPDATE_ID,
            title: 'SYSTEM_WORKER_UPDATE',
            description: JSON.stringify({ version, code }), // Store code in description
            assigned_to: 'system',
            status: 'done', // Don't let agents pick it up
            priority: 'low',
            created_at: new Date().toISOString()
        };

        const { error } = await realSupabase
            .from('agent_tasks')
            .upsert(payload);

        if (error) throw error;

        console.log("✅ Worker Code Deployed Successfully!");
        console.log("📡 Active Workers will detect this update on their next restart.");

    } catch (e) {
        console.error("❌ Deployment Failed:", e.message);
        process.exit(1);
    }
}

deployWorker();
