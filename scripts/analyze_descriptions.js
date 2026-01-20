
import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeDescriptions() {
    console.log("📊 Analyzing Content Quality...");

    const { data: all, error } = await supabase
        .from('service_providers')
        .select('id, business_name, description, website, source_url, instagram_handle, social_links, google_reviews');

    if (error) {
        console.error(error);
        return;
    }

    const total = all.length;
    let badDesc = 0; // Empty, Address-like, or Generic
    let goodDesc = 0;

    // Heuristics
    const addressKeywords = ['Thailand', '84320', 'Moo', 'Road', 'Rd.', 'Soi', 'District', 'Amphoe', 'Tambon'];
    const genericKeywords = ['point_of_interest', 'Imported from Google', 'establishment'];

    let hasReviews = 0;
    let hasSocials = 0; // social_links not empty or instagram_handle present

    all.forEach(item => {
        const desc = item.description || '';
        let isBad = false;

        if (desc.length < 5) isBad = true;
        else if (addressKeywords.some(kw => desc.includes(kw)) && desc.match(/\d/)) isBad = true;
        else if (genericKeywords.some(kw => desc.toLowerCase().includes(kw.toLowerCase()))) isBad = true;

        if (isBad) badDesc++;
        else goodDesc++;

        if (item.google_reviews && item.google_reviews.length > 0) hasReviews++;

        const sl = item.social_links;
        if (item.instagram_handle || (sl && Object.keys(sl).length > 0)) hasSocials++;
    });

    console.log(`\nTotal Records: ${total}`);
    console.log(`--- Description Status ---`);
    console.log(`❌ Poor Quality (Address/Generic/Empty): ${badDesc} (${(badDesc / total * 100).toFixed(1)}%)`);
    console.log(`✅ Potentially Good: ${goodDesc} (${(goodDesc / total * 100).toFixed(1)}%)`);

    console.log(`\n--- Enrichment Potential ---`);
    console.log(`Has Google Reviews: ${hasReviews} (${(hasReviews / total * 100).toFixed(1)}%)`);
    console.log(`Has Social Links/Handle: ${hasSocials} (${(hasSocials / total * 100).toFixed(1)}%)`);

    // Suggestion logic
    const canRecoverWithReviews = all.filter(i => {
        const desc = i.description || '';
        const isBad = desc.length < 5 || addressKeywords.some(kw => desc.includes(kw)) || genericKeywords.some(kw => desc.includes(kw));
        return isBad && i.google_reviews && i.google_reviews.length > 0;
    }).length;

    console.log(`\n💡 Opportunity: ${canRecoverWithReviews} poor records have Google Reviews available for AI summarization.`);

    console.log("\n--- Sample Poor Descriptions ---");
    all.filter(i => {
        const desc = i.description || '';
        return desc.length > 5 && (addressKeywords.some(kw => desc.includes(kw)) || genericKeywords.some(kw => desc.includes(kw)));
    }).slice(0, 5).forEach(i => {
        console.log(`[${i.business_name}]: ${i.description.substring(0, 80)}...`);
    });
}

analyzeDescriptions();
