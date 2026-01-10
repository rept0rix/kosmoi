
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import fs from 'fs';

// Load .env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { Client } = pg;

// Use the clean connection string (Reused from apply_stripe_migration.js as it works)
// Ideally this should be in .env but for now we follow the working pattern.
const CONNECTION_STRING = "postgres://postgres.kgnuutevrytqrirgybla:rvJRbFTrZ4CfiF4N@aws-1-us-east-1.pooler.supabase.com:6543/postgres";

async function run() {
    console.log("🔌 Connecting to DB to apply Vendor Dashboard RLS migration...");
    const client = new Client({
        connectionString: CONNECTION_STRING,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        const migrationPath = path.join(__dirname, '../supabase/migrations/20260109_vendor_dashboard_rls.sql');
        if (!fs.existsSync(migrationPath)) {
            throw new Error(`Migration file not found at: ${migrationPath}`);
        }
        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log("🚀 Executing SQL...");
        await client.query(sql);
        console.log("✅ Migration Applied: RLS updated to use owner_id.");

    } catch (err) {
        console.error("❌ Error:", err);
    } finally {
        await client.end();
    }
}

run();
