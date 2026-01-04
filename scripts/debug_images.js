
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Load env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '../.env');

if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkImages() {
    console.log("Fetching service providers...");
    const { data: providers, error } = await supabase
        .from('service_providers')
        .select('id, business_name, images, category')
        .limit(20);

    if (error) {
        console.error("Error fetching providers:", error);
        return;
    }

    console.log(`Found ${providers.length} providers. Inspecting images...`);

    providers.forEach(p => {
        console.log(`\n[${p.business_name}] (${p.category})`);
        if (!p.images || p.images.length === 0) {
            console.log("  No images array or empty.");
        } else {
            console.log("  Images:", p.images);
            p.images.forEach((img, i) => {
                const isUrl = img.startsWith('http');
                console.log(`    ${i}: ${img} (Is URL? ${isUrl})`);
            });
        }
    });
}

checkImages();
