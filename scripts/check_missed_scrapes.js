
import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkQuality() {
    console.log("📊 Analyzing Data Quality (Full Scan)...");

    let total = 0;
    let missingImages = 0;
    let missingLocation = 0;
    let missingPhone = 0;
    let failedStatus = 0;
    let criticallyEmpty = 0;

    let from = 0;
    const step = 1000;
    let hasMore = true;

    while (hasMore) {
        process.stdout.write(`Scanning ${from}... `);
        const { data: batch, error } = await supabase
            .from('service_providers')
            .select('images, latitude, longitude, status, phone')
            .range(from, from + step - 1);

        if (error) {
            console.error(error);
            break;
        }

        if (!batch || batch.length === 0) {
            hasMore = false;
            break;
        }

        total += batch.length;
        batch.forEach(item => {
            if (!item.images || item.images.length === 0) missingImages++;
            if (!item.latitude || !item.longitude) missingLocation++;
            if (!item.phone) missingPhone++;
            if (item.status && item.status !== 'active') failedStatus++;
            if (!item.images && !item.phone && !item.latitude) criticallyEmpty++;
        });

        if (batch.length < step) {
            hasMore = false;
        }
        from += step;
        console.log("Done.");
    }

    console.log(`\n\n--- Final Results (Total: ${total}) ---`);
    if (total > 0) {
        console.log(`Missing Images: ${missingImages} (${(missingImages / total * 100).toFixed(1)}%)`);
        console.log(`Missing Location: ${missingLocation} (${(missingLocation / total * 100).toFixed(1)}%)`);
        console.log(`Missing Phone: ${missingPhone} (${(missingPhone / total * 100).toFixed(1)}%)`);
        console.log(`Non-Active Status: ${failedStatus}`);
        console.log(`Critically Empty (No img/phone/lat): ${criticallyEmpty}`);
    }
}

checkQuality();
