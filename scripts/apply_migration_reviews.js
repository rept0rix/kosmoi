import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure we have the connection string
const CONNECTION_STRING = process.env.VITE_SUPABASE_CONNECTION_STRING || "postgresql://postgres.ryzbeonmlvawamjcoqen:Supabase2024!@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"; // Fallback for dev

async function applyMigration() {
    console.log("🔌 Connecting to Database...");
    const client = new Client({
        connectionString: CONNECTION_STRING,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log("✅ Connected.");

        const migrationPath = path.join(__dirname, '../supabase/migrations/20260109_reviews_system.sql');
        console.log(`📄 Reading migration from: ${migrationPath}`);

        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log("🚀 Executing Migration...");
        await client.query(sql);
        console.log("✅ Migration applied successfully!");

    } catch (err) {
        console.error("❌ Migration failed:", err);
    } finally {
        await client.end();
        console.log("🔌 Connection closed.");
    }
}

applyMigration();
