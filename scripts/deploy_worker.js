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

        // 2. Upload to Supabase 'company_knowledge'
        const payload = {
            version: version,
            code: code,
            deployed_at: new Date().toISOString()
        };

        const { error } = await realSupabase
            .from('company_knowledge')
            .upsert({
                key: 'WORKER_CODE_LATEST',
                value: payload,
                category: 'system_deployment',
                updated_at: new Date().toISOString()
            });

        if (error) throw error;

        console.log("✅ Worker Code Deployed Successfully!");
        console.log("📡 Active Workers will detect this update on their next restart.");

    } catch (e) {
        console.error("❌ Deployment Failed:", e.message);
        process.exit(1);
    }
}

deployWorker();
