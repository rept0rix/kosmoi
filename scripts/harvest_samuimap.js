
/**
 * SAMUI MAP HARVESTER MISSION
 * ===========================
 * Goal: "Download Everything". structured data + images.
 * Target: https://samui-map.info/explore/
 *
 * Usage: node scripts/harvest_samuimap.js
 */

import fs from 'fs';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = 'https://samui-map.info';
// Storage Paths
const DOWNLOAD_DIR = path.join(__dirname, '../downloads/samui_map');
const IMAGES_DIR = path.join(DOWNLOAD_DIR, 'images');
const DATA_FILE = path.join(DOWNLOAD_DIR, 'harvested_data.json');

// Category Support
const args = process.argv.slice(2);
const categoryArg = args.find(arg => arg.startsWith('--category='))?.split('=')[1];

let START_URL = 'https://samui-map.info/explore/';
if (categoryArg) {
    if (categoryArg.includes('/')) {
        START_URL = `${BASE_URL}/${categoryArg}/`.replace(/([^:]\/)\/+/g, "$1");
    } else {
        START_URL = `https://samui-map.info/info/${categoryArg}/`;
    }
}

if (categoryArg) {
    console.log(`🎯 Category Override: ${categoryArg}`);
    console.log(`🔗 Target URL: ${START_URL}`);
}

// Ensure directories exist
if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// Credentials (Optional - provided by user)
const CREDS = {
    username: process.env.SAMUIMAP_USERNAME,
    password: process.env.SAMUIMAP_PASSWORD
};

// Global State
const VISITED = new Set();
const QUEUE = [START_URL];
const RESULTS = [];

/**
 * Fetches all listing URLs from XML sitemaps
 */
async function fetchSitemaps() {
    console.log("🔍 Fetching sitemaps for listing discovery...");
    const sitemapIndexUrl = `${BASE_URL}/sitemap_index.xml`;
    try {
        const { data: indexData } = await axios.get(sitemapIndexUrl);
        const sitemaps = indexData.match(/https:\/\/samui-map.info\/job_listing-sitemap\d*.xml/g) || [];

        console.log(`Found ${sitemaps.length} job_listing sitemaps.`);

        for (const sitemapUrl of sitemaps) {
            console.log(`  Reading sitemap: ${sitemapUrl}`);
            const { data: sitemapData } = await axios.get(sitemapUrl);
            const urls = sitemapData.match(/https:\/\/samui-map.info\/listing\/[^/"]*\//g) || [];
            urls.forEach(url => {
                if (!VISITED.has(url)) QUEUE.push(url);
            });
        }
        console.log(`📡 Sitemap discovery complete. Queue size: ${QUEUE.length}`);
    } catch (err) {
        console.error("⚠️ Sitemap fetch failed, falling back to sequential crawl.", err.message);
    }
}



/**
 * Parses a single page
 */
async function processPage(url) {
    if (VISITED.has(url)) return;
    VISITED.add(url);

    console.log(`🕷️ Crawling: ${url}`);

    try {
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const $ = cheerio.load(data);

        // 1. Extract Links
        // We follow anything that stays on the same domain and looks like a category or listing
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            if (href && href.startsWith(BASE_URL)) {
                const isRelevant = href.includes('/info/') ||
                    href.includes('/listing/') ||
                    href.includes('/category/') ||
                    href.includes('/explore/');

                if (isRelevant && !VISITED.has(href)) {
                    QUEUE.push(href);
                }
            }
        });

        // 2. Extract Data
        const isContent = url.includes('/info/') || url.includes('/listing/');
        if (isContent) {
            const title = $('h1').first().text().trim();
            const description = $('meta[name="description"]').attr('content') || '';
            const content = $('.entry-content').text().trim() || $('article').text().trim();

            // Try to extract rich data from JSON-LD
            let phone = '';
            let address = '';
            let category = '';
            let email = '';
            let website = '';
            let openingHours = [];
            let jsonDescription = '';
            let jsonImages = [];

            $('script[type="application/ld+json"]').each((i, el) => {
                try {
                    const json = JSON.parse($(el).html());
                    const graph = json['@graph'] || [json];
                    graph.forEach(item => {
                        if (item.telephone) phone = item.telephone;
                        if (item.email) email = item.email;
                        if (item.url && item.url !== url && !item.url.includes('samui-map.info')) website = item.url;

                        if (item.address) {
                            if (typeof item.address === 'string') address = item.address;
                            else if (item.address.streetAddress) address = item.address.streetAddress;
                        }

                        if (item.openingHours) {
                            openingHours = Array.isArray(item.openingHours) ? item.openingHours : [item.openingHours];
                        }

                        if (item.description) jsonDescription = item.description;

                        if (item.image && typeof item.image === 'string') jsonImages.push(item.image);
                        if (item.photo && typeof item.photo === 'string') jsonImages.push(item.photo);
                        if (item.photos) {
                            if (typeof item.photos === 'string') jsonImages.push(item.photos);
                            else if (Array.isArray(item.photos)) jsonImages.push(...item.photos.filter(p => typeof p === 'string'));
                        }
                    });
                } catch (e) { }
            });

            // Fallback phone extraction from content
            if (!phone) {
                const phoneMatch = content.match(/\+?\d{1,4}[-\s]?\d{1,4}[-\s]?\d{4,10}/);
                if (phoneMatch) phone = phoneMatch[0];
            }

            // Fallback website extraction from DOM
            if (!website) {
                website = $('a:contains("Website"), a.website-link').attr('href');
            }

            // Prefer JSON description if available (often cleaner)
            const finalDescription = jsonDescription || description || content;

            // Category from breadcrumbs or tags
            category = $('.category-name').first().text().trim() ||
                url.split('/')[4] || 'other';

            // Filter by Category if requested
            if (categoryArg) {
                const targetCat = categoryArg.split('/').pop() || categoryArg;
                const matches = category.toLowerCase().includes(targetCat.toLowerCase()) ||
                    url.toLowerCase().includes(targetCat.toLowerCase());

                if (!matches) return;
            }

            // Image Extraction - SKIPPED (Source provides unusable watermarked/logo images)
            // We will fetch images from Google Maps/Places API in a separate pass.
            const images = [];

            const pageData = {
                url,
                title,
                description: finalDescription,
                phone,
                address,
                category,
                email,
                website,
                opening_hours: openingHours,
                content_snippet: content.substring(0, 300),
                images: [...new Set([...images, ...jsonImages])] // Merge and dedup
            };

            RESULTS.push(pageData);
            console.log(`✅ Harvested: [${category}] ${title} (${images.length} images)`);
        }

    } catch (err) {
        console.error(`❌ Error on ${url}:`, err.message);
    }
}

const limitArg = args.find(arg => arg.startsWith('--limit='))?.split('=')[1];
const HARVEST_LIMIT = limitArg ? parseInt(limitArg) : 1000;

/**
 * Helper to save data with metadata
 */
function saveData(isFinal = false) {
    const output = {
        metadata: {
            harvest_date: new Date().toISOString(),
            item_count: RESULTS.length,
            target: START_URL,
            status: isFinal ? 'complete' : 'in-progress'
        },
        data: RESULTS
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(output, null, 2));
}

/**
 * Main Loop
 */
async function run() {
    console.log("🚜 Starting Harvest Mission...");
    console.log(`🎯 Seed Target: ${START_URL}`);
    console.log(`📂 Saving to: ${DOWNLOAD_DIR}`);
    if (limitArg) console.log(`🛑 Harvest Limit: ${HARVEST_LIMIT}`);

    // Sitemap Discovery (Optional but recommended for Full Mode)
    // If we are looking for a specific category, sitemaps are the fastest way to find them
    if (!categoryArg) await fetchSitemaps();

    // Breadth-First Search / Queue Processing
    while (QUEUE.length > 0 && RESULTS.length < HARVEST_LIMIT) {
        const currentUrl = QUEUE.shift();
        await processPage(currentUrl);

        // Politeness Delay
        await new Promise(r => setTimeout(r, 200));

        // Periodic Save
        if (RESULTS.length % 10 === 0 && RESULTS.length > 0) {
            console.log(`💾 Checkpoint: Saved ${RESULTS.length} items so far...`);
            saveData(false);
        }
    }

    // Save final JSON
    saveData(true);
    console.log(`\n🎉 Mission Complete! Saved ${RESULTS.length} items.`);
    console.log(`📁 Validated JSON at: ${DATA_FILE}`);
}

run();
