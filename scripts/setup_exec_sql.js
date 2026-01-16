
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const { Client } = pg;

// Connection string detected from scripts/init_db_direct.js
const CONNECTION_STRING = "postgres://postgres.kgnuutevrytqrirgybla:rvJRbFTrZ4CfiF4N@aws-1-us-east-1.pooler.supabase.com:6543/postgres";

async function applyRlsDirectly() {
    console.log("🔌 Connecting to Postgres to apply RLS...");
    const client = new Client({
        connectionString: CONNECTION_STRING,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log("✅ Connected.");

        const sqlPath = path.join(__dirname, 'fix_transactions_rls.sql');
        console.log(`Reading SQL from ${sqlPath}...`);
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log("🚀 Executing RLS Migration SQL...");
        await client.query(sql);
        console.log("✅ Transaction RLS Policies Applied Successfully.");

        console.log("🔄 Reloading Supabase Schema Cache...");
        await client.query("NOTIFY pgrst, 'reload schema';");

    } catch (err) {
        console.error("FATAL ERROR:", err);
    } finally {
        await client.end();
    }
}

applyRlsDirectly();
