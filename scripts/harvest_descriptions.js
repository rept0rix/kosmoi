import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Supabase URL and Service Key are required in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configuration
const BATCH_SIZE = 2000; // Full batch

const DELAY_BETWEEN_REQUESTS_MS = 3000; // 3 seconds delay to be polite
const MAX_RETRIES = 3;
const LOG_FILE = path.join(__dirname, 'harvest_log.json');
const GENERIC_PATTERN = '%is a premier%Visit us for a great local experience%';

// Logging helper
function log(message, type = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${type}] ${message}`;
    console.log(logEntry);

    // Simple file append for persistent logs
    fs.appendFileSync(path.join(__dirname, 'harvest.log'), logEntry + '\n');
}

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getCandidates() {
    const { data, error } = await supabase
        .from('service_providers')
        .select('id, business_name, description')
        .ilike('description', GENERIC_PATTERN)
        .limit(BATCH_SIZE); // Safety limit for first run

    if (error) {
        log(`Error fetching candidates: ${error.message}`, 'ERROR');
        return [];
    }
    return data;
}

async function scrapeDescription(browser, businessName) {
    const page = await browser.newPage();
    const searchUrl = `https://samui-map.info/explore/?search_keywords=${encodeURIComponent(businessName)}&sort=random`;

    try {
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        log(`Searching for: ${businessName} -> ${searchUrl}`);
        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });

        // Check for results
        // Selector for the first listing item's link
        const firstResultSelector = '.lf-item > a';

        // Wait briefly for results to populate (networkidle2 usually handles this, but just in case)
        try {
            await page.waitForSelector(firstResultSelector, { timeout: 5000 });
        } catch (e) {
            log(`No results found for ${businessName}`, 'WARN');
            await page.close();
            return null;
        }

        // Navigate to the first result
        const listingUrl = await page.$eval(firstResultSelector, el => el.href);
        log(`Found listing: ${listingUrl}. Navigating...`);

        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle2' }),
            page.goto(listingUrl)
        ]);

        // Extract description
        // Selector: .block-field-job_description .pf-body
        const descriptionSelector = '.block-field-job_description .pf-body';

        try {
            await page.waitForSelector(descriptionSelector, { timeout: 5000 });
            const description = await page.$eval(descriptionSelector, el => el.innerText.trim());

            if (description && description.length > 50) {
                log(`Successfully scraped description (${description.length} chars)`);
                return description;
            } else {
                log(`Description found but too short or empty`, 'WARN');
            }
        } catch (e) {
            log(`Description container not found for ${businessName}`, 'WARN');
        }

    } catch (error) {
        log(`Error scraping ${businessName}: ${error.message}`, 'ERROR');
    } finally {
        try {
            if (page && !page.isClosed()) {
                await page.close();
            }
        } catch (e) {
            log(`Error closing page for ${businessName}: ${e.message}`, 'WARN');
        }
    }
    return null;
}

async function updateBusiness(id, description) {
    const { error } = await supabase
        .from('service_providers')
        .update({ description })
        .eq('id', id);

    if (error) {
        log(`Failed to update DB for ${id}: ${error.message}`, 'ERROR');
        return false;
    }
    log(`Database updated for ${id}`, 'SUCCESS');
    return true;
}

async function main() {
    log('Starting harvest process...');

    // 1. Get Candidates
    const candidates = await getCandidates();
    log(`Found ${candidates.length} candidates for enrichment.`);

    if (candidates.length === 0) {
        log('No candidates found. Exiting.');
        process.exit(0);
    }

    // 2. Launch Browser
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    let successCount = 0;
    let failCount = 0;

    // 3. Process loop
    for (const business of candidates) {
        log(`Processing: ${business.business_name} (${business.id})`);

        // Scrape
        const newDescription = await scrapeDescription(browser, business.business_name);

        if (newDescription) {
            // Update DB
            const updated = await updateBusiness(business.id, newDescription);
            if (updated) successCount++;
            else failCount++;
        } else {
            failCount++;
            log(`Skipping update for ${business.business_name} - content not found.`);
        }

        // Polite delay
        log(`Waiting ${DELAY_BETWEEN_REQUESTS_MS}ms...`);
        await delay(DELAY_BETWEEN_REQUESTS_MS);
    }

    await browser.close();
    log(`Harvest complete. Success: ${successCount}, Failed: ${failCount}`);
}

main().catch(console.error);
