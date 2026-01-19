
import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkQuality() {
    console.log("📊 Analyzing Data Quality...");

    const { data: all, error } = await supabase
        .from('service_providers')
        .select('id, business_name, google_place_id, images, latitude, longitude, status, phone, category');

    if (error) {
        console.error(error);
        return;
    }

    const total = all.length;
    let missingImages = 0;
    let missingLocation = 0;
    let missingPhone = 0;
    let failedStatus = 0; // status != active?

    all.forEach(item => {
        if (!item.images || item.images.length === 0) missingImages++;
        if (!item.latitude || !item.longitude) missingLocation++;
        if (!item.phone) missingPhone++;
        if (item.status && item.status !== 'active') failedStatus++;
    });

    console.log(`Total Records: ${total}`);
    console.log(`Missing Images: ${missingImages} (${(missingImages / total * 100).toFixed(1)}%)`);
    console.log(`Missing Location: ${missingLocation} (${(missingLocation / total * 100).toFixed(1)}%)`);
    console.log(`Missing Phone: ${missingPhone} (${(missingPhone / total * 100).toFixed(1)}%)`);
    console.log(`Non-Active Status: ${failedStatus}`);

    // Check for potential "failed" scrapes based on empty metadata
    const potentiallyFailed = all.filter(i => !i.images && !i.phone && !i.latitude).length;
    console.log(`Critically Empty (No img/phone/lat): ${potentiallyFailed}`);
}

checkQuality();
