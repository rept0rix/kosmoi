
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const frontendUrl = 'http://localhost:5173';

const COLORS = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    reset: '\x1b[0m'
};

function log(status, message) {
    const color = status === 'PASS' ? COLORS.green : status === 'FAIL' ? COLORS.red : COLORS.yellow;
    console.log(`${color}[${status}] ${message}${COLORS.reset}`);
}

async function checkDatabase() {
    if (!supabaseUrl || !supabaseAnonKey) {
        log('FAIL', 'Missing Supabase Credentials');
        return false;
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        const start = Date.now();
        const { data, error } = await supabase.from('service_providers').select('count', { count: 'exact', head: true });
        const latency = Date.now() - start;

        if (error) {
            log('FAIL', `Database Connection: ${error.message}`);
            return false;
        }

        log('PASS', `Database Connected (${latency}ms)`);
        return true;
    } catch (e) {
        log('FAIL', `Database Exception: ${e.message}`);
        return false;
    }
}

async function checkFrontendParams(path = '/') {
    try {
        const start = Date.now();
        const res = await fetch(`${frontendUrl}${path}`);
        const latency = Date.now() - start;

        if (res.ok) {
            log('PASS', `Frontend '${path}' is UP (${latency}ms)`);
            return true;
        } else {
            log('FAIL', `Frontend '${path}' returned ${res.status}`);
            return false;
        }
    } catch (e) {
        log('FAIL', `Frontend '${path}' unreachable: ${e.message}`);
        return false;
    }
}

async function run() {
    console.log(`\n🔎  Running Kosmoi System Smoke Test...\n`);

    const db = await checkDatabase();
    const home = await checkFrontendParams('/');
    const login = await checkFrontendParams('/login');
    const dashboard = await checkFrontendParams('/admin/dashboard');

    console.log('\n----------------------------------------');
    if (db && home && login && dashboard) {
        console.log(`${COLORS.green}✅ SYSTEM HEALTHY: All Critical Paths Operational${COLORS.reset}`);
        process.exit(0);
    } else {
        console.log(`${COLORS.red}❌ SYSTEM FAILURE: Automated Intervention Required${COLORS.reset}`);
        process.exit(1);
    }
}

run();
