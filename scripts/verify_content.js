
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

// Load .env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { Client } = pg;

// Use the clean connection string from ingest_via_postgres.js
const CONNECTION_STRING = "postgres://postgres.kgnuutevrytqrirgybla:rvJRbFTrZ4CfiF4N@aws-1-us-east-1.pooler.supabase.com:6543/postgres";

async function run() {
    console.log("🔌 Connecting to DB to verify content...");
    const client = new Client({
        connectionString: CONNECTION_STRING,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        // 1. Check Total Count
        const countRes = await client.query('SELECT COUNT(*) FROM public.service_providers');
        console.log(`📊 Total Businesses: ${countRes.rows[0].count}`);

        // 2. Sample Data (Check Images & Categories)
        const sampleRes = await client.query(`
            SELECT business_name, category, images, source_url 
            FROM public.service_providers 
            LIMIT 5
        `);

        console.log("\n🧪 Sample Data:");
        sampleRes.rows.forEach(row => {
            const imgCount = row.images ? row.images.length : 0;
            console.log(`- [${row.category}] ${row.business_name}: ${imgCount} images`);
            if (imgCount === 0) console.warn(`  ⚠️  No images! Source: ${row.source_url}`);
        });

        // 3. Category Distribution
        const catRes = await client.query(`
            SELECT category, COUNT(*) 
            FROM public.service_providers 
            GROUP BY category
        `);
        console.log("\n📈 Category Distribution:");
        catRes.rows.forEach(row => {
            console.log(`  ${row.category}: ${row.count}`);
        });

    } catch (err) {
        console.error("❌ Error:", err);
    } finally {
        await client.end();
    }
}

run();
