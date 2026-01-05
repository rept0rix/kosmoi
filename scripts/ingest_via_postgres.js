
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;

// Connection string from user's initial dump (cleaned)
const CONNECTION_STRING = "postgres://postgres.kgnuutevrytqrirgybla:rvJRbFTrZ4CfiF4N@aws-1-us-east-1.pooler.supabase.com:6543/postgres";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HARVEST_FILE = path.join(__dirname, '../downloads/samui_map/harvested_data.json');

async function run() {
    console.log("🔌 Connecting to Postgres directly...");
    const client = new Client({
        connectionString: CONNECTION_STRING,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log("✅ Connected.");

        if (!fs.existsSync(HARVEST_FILE)) {
            throw new Error("Harvest file not found.");
        }

        const rawData = JSON.parse(fs.readFileSync(HARVEST_FILE, 'utf-8'));
        const items = rawData.data || rawData;
        console.log(`📦 Loaded ${items.length} items.`);

        let success = 0;
        let errors = 0;

        for (const item of items) {
            const phone = extractPhone(item.description || '');
            const category = (item.category && item.category !== 'other') ? item.category : guessCategory(item.url);

            const query = `
                INSERT INTO public.service_providers 
                (business_name, description, location, category, source_url, phone, images, status, verified, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', false, NOW())
                ON CONFLICT (source_url) DO UPDATE SET 
                    business_name = EXCLUDED.business_name,
                    description = EXCLUDED.description
                RETURNING id;
            `;

            const values = [
                item.title,
                item.description || item.content_snippet,
                item.address || 'Koh Samui',
                category,
                item.url,
                phone,
                item.images || [], // pg handles array mapping
            ];

            try {
                await client.query(query, values);
                process.stdout.write('.');
                success++;
            } catch (e) {
                console.error(`\n❌ Error inserting ${item.title}:`, e.message);
                errors++;
            }
        }

        console.log(`\n\n🎉 Done! Success: ${success}, Errors: ${errors}`);

    } catch (err) {
        console.error("FATAL ERROR:", err);
    } finally {
        await client.end();
    }
}

function extractPhone(text) {
    const match = text.match(/0\d{1,2}[-\s]?\d{3}[-\s]?\d{3,4}/);
    return match ? match[0] : null;
}

function guessCategory(url) {
    if (url.includes('restaurant')) return 'restaurants';
    if (url.includes('hotel') || url.includes('resort')) return 'accommodation';
    if (url.includes('villa')) return 'villas';
    return 'other';
}

run();
