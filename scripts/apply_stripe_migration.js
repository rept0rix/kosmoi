
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import fs from 'fs';

// Load .env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { Client } = pg;

// Use the clean connection string
const CONNECTION_STRING = "postgres://postgres.kgnuutevrytqrirgybla:rvJRbFTrZ4CfiF4N@aws-1-us-east-1.pooler.supabase.com:6543/postgres";

async function run() {
    console.log("🔌 Connecting to DB to apply Stripe migration...");
    const client = new Client({
        connectionString: CONNECTION_STRING,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        const migrationPath = path.join(__dirname, '../supabase/migrations/20260105_add_stripe_columns.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log("🚀 Executing SQL...");
        await client.query(sql);
        console.log("✅ Migration Applied: Stripe columns added.");

    } catch (err) {
        console.error("❌ Error:", err);
    } finally {
        await client.end();
    }
}

run();
