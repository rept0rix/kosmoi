
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY; 
// meaningful comment: strictly using service role for admin tasks would be better, 
// but reusing existing env vars for simplicity if they work. 
// If RLS blocks, user might need SERVICE_ROLE from somewhere else.
// Checking .env usually has SERVICE_ROLE_KEY or similar. 
// Let's assume passed via env or use standard keys.
// For now, will try standard key, if fails, will ask user or check other scripts.
// Actually, looking at other scripts (scripts/verify_db_connection.js), they often use process.env.SUPABASE_SERVICE_ROLE_KEY.
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false }
});

const BASE_URL = 'https://samui-map.info';
const START_URL = 'https://samui-map.info/explore/';
const VISITED = new Set();
const QUEUE = [START_URL];
const MAX_CONCURRENCY = 3;
const DELAY_MS = 1000;

// Helper: Sleep
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function upsertProvider(data) {
    console.log(`💾 Upserting: ${data.business_name}...`);
    
    // 1. Try to find existing provider by name (normalized)
    const { data: existing } = await supabase
        .from('service_providers')
        .select('id, description, phone, website')
        .ilike('business_name', data.business_name)
        .maybeSingle();

    if (existing) {
        console.log(`   Found existing: ${existing.id}`);
        // Update only fields that are missing or empty
        const updates = {};
        if (!existing.description && data.description) updates.description = data.description;
        if (!existing.phone && data.phone) updates.phone = data.phone;
        if (!existing.website && data.website) updates.website = data.website;
        
        // Always update metadata with source
        updates.source_url = data.source_url;
        updates.metadata = { 
            last_scraped: new Date().toISOString(),
            source: 'samui-map.info'
        };

        if (Object.keys(updates).length > 0) {
            const { error } = await supabase
                .from('service_providers')
                .update(updates)
                .eq('id', existing.id);
            
            if (error) console.error(`   ❌ Update failed: ${error.message}`);
            else console.log(`   ✅ Updated fields: ${Object.keys(updates).join(', ')}`);
        } else {
            console.log(`   ℹ️ No updates needed.`);
        }
    } else {
        // New Insert
        console.log(`   🆕 New Provider found! Inserting...`);
        const newProvider = {
            business_name: data.business_name,
            description: data.description,
            phone: data.phone,
            website: data.website,
            location: data.address, // mapping address to location
            category: data.category,
            source_url: data.source_url,
            images: data.images,
            opening_hours: data.opening_hours, // Ensure DB supports jsonb for this, schema says yes
            status: 'pending',    // Default status (valid values: pending, active, verified, suspended, rejected)
            metadata: { 
                last_scraped: new Date().toISOString(),
                source: 'samui-map.info'
            }
        };

        const { error } = await supabase.from('service_providers').insert(newProvider);
        if (error) console.error(`   ❌ Insert failed: ${error.message}`);
        else console.log(`   ✅ Inserted successfully.`);
    }
}

async function processPage(url) {
    if (VISITED.has(url)) return;
    VISITED.add(url);
    
    try {
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' }
        });
        const $ = cheerio.load(data);

        // 1. Extract Links (Categories & Listings)
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            if (href && href.startsWith(BASE_URL)) {
                if ((href.includes('/info/') || href.includes('/listing/') || href.includes('/category/')) && !VISITED.has(href)) {
                     QUEUE.push(href);
                }
            }
        });

        // 2. Extract Data if Listing Page
        if (url.includes('/info/') || url.includes('/listing/')) {
            const title = $('h1').first().text().trim();
            const description = $('meta[name="description"]').attr('content') || $('.entry-content').text().substring(0, 500);
            
            let phone = '';
            let website = '';
            let address = '';
            let images = [];
            let openingHours = [];

            // JSON-LD Extraction
            $('script[type="application/ld+json"]').each((i, el) => {
                try {
                    const json = JSON.parse($(el).html());
                    const graph = json['@graph'] || [json];
                    graph.forEach(item => {
                        if (item.telephone) phone = item.telephone;
                        if (item.url && !item.url.includes('samui-map')) website = item.url;
                        if (item.address) address = typeof item.address === 'string' ? item.address : item.address?.streetAddress;
                        if (item.image) images = Array.isArray(item.image) ? item.image : [item.image];
                    });
                } catch(e) {}
            });

            // Extract category
            const category = $('.category-name').first().text().trim() || 'Uncategorized';

            const providerData = {
                business_name: title,
                description: description,
                phone: phone,
                website: website,
                address: address,
                category: category,
                source_url: url,
                images: images,
                opening_hours: openingHours // Usually complex to parse from HTML if not in JSON-LD
            };

            await upsertProvider(providerData);
        }

    } catch (err) {
        console.error(`❌ Error on ${url}: ${err.message}`);
    }
}

async function run() {
    console.log("🚜 Starting Enrichment Engine...");
    
    while (QUEUE.length > 0) {
        // Simple batching
        const batch = QUEUE.splice(0, MAX_CONCURRENCY);
        await Promise.all(batch.map(url => processPage(url)));
        await sleep(DELAY_MS);
    }
    
    console.log("🎉 Enrichment Complete.");
}

run();
