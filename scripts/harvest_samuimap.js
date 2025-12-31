
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
const START_URL = 'https://samui-map.info/explore/';

// Storage Paths
const DOWNLOAD_DIR = path.join(__dirname, '../downloads/samui_map');
const IMAGES_DIR = path.join(DOWNLOAD_DIR, 'images');
const DATA_FILE = path.join(DOWNLOAD_DIR, 'harvested_data.json');

// Ensure directories exist
if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// Credentials (Optional - provided by user)
const CREDS = {
    username: 'rept0rix',
    password: '0mgna0ryank0'
};

// Global State
const VISITED = new Set();
const QUEUE = [START_URL];
const RESULTS = [];

/**
 * Downloads an image and saves it locally
 */
async function downloadImage(url, prefix) {
    if (!url) return null;

    // Handle relative URLs
    if (url.startsWith('/')) url = BASE_URL + url;

    try {
        const filename = `${prefix}_${path.basename(url).split('?')[0]}`.replace(/[^a-z0-9._-]/gi, '_');
        const filepath = path.join(IMAGES_DIR, filename);

        if (fs.existsSync(filepath)) return filename; // Skip if exists

        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream'
        });

        const writer = fs.createWriteStream(filepath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => resolve(filename));
            writer.on('error', reject);
        });
    } catch (err) {
        console.error(`⚠️ Failed to download image: ${url}`, err.message);
        return null;
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
        const isCategory = url.includes('/explore/') || url.includes('/koh-samui-cities/') || url.includes('/koh-samui-beaches/');

        // 1. Extract Links (if it's a category/list page)
        if (isCategory) {
            $('a').each((i, el) => {
                const href = $(el).attr('href');
                if (href && href.startsWith(BASE_URL) && !VISITED.has(href)) {
                    // Heuristic to stay within content
                    if (href.includes('/info/')) {
                        QUEUE.push(href);
                    }
                }
            });
        }

        // 2. Extract Data (if it's a content page)
        if (url.includes('/info/')) {
            const title = $('h1').first().text().trim();
            const description = $('meta[name="description"]').attr('content') || '';
            const content = $('.entry-content').text().trim() || $('article').text().trim();

            // Image Extraction
            const images = [];
            const imgElements = $('img'); // Select all images

            for (let i = 0; i < imgElements.length; i++) {
                const src = $(imgElements[i]).attr('src');
                if (src && !src.includes('logo') && !src.includes('icon')) {
                    const localFile = await downloadImage(src, title.substring(0, 10));
                    if (localFile) images.push(localFile);
                }
            }

            const pageData = {
                url,
                title,
                description,
                content_snippet: content.substring(0, 200),
                images
            };

            RESULTS.push(pageData);
            console.log(`✅ Harvested: ${title} (${images.length} images)`);
        }

    } catch (err) {
        console.error(`❌ Error on ${url}:`, err.message);
    }
}

/**
 * Main Loop
 */
async function run() {
    console.log("🚜 Starting Harvest Mission...");
    console.log(`🎯 Target: ${START_URL}`);
    console.log(`📂 Saving to: ${DOWNLOAD_DIR}`);

    // Breadth-First Search / Queue Processing
    while (QUEUE.length > 0) {
        const currentUrl = QUEUE.shift();
        await processPage(currentUrl);

        // Politeness Delay
        await new Promise(r => setTimeout(r, 200)); // Slightly faster 200ms

        // Periodic Save (Safety Checkpoint)
        if (RESULTS.length % 25 === 0 && RESULTS.length > 0) {
            console.log(`� Checkpoint: Saved ${RESULTS.length} items so far...`);
            fs.writeFileSync(DATA_FILE, JSON.stringify(RESULTS, null, 2));
        }

        // NO LIMIT - FULL HARVEST MODE
        // if (VISITED.size >= 50) break; 
    }

    // Create final object with metadata
    const output = {
        metadata: {
            harvest_date: new Date().toISOString(),
            item_count: RESULTS.length,
            target: START_URL
        },
        data: RESULTS
    };

    // Save final JSON
    fs.writeFileSync(DATA_FILE, JSON.stringify(output, null, 2));
    console.log(`\n🎉 Mission Complete! Saved ${RESULTS.length} items.`);
    console.log(`📁 Validated JSON at: ${DATA_FILE}`);
}

run();
