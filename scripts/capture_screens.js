import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:5173';
const OUTPUT_DIR = path.join(__dirname, '../public/screens');

// Define Routes manually to avoid import issues with React files in Node
const ROUTES = [
    { name: 'Home', path: '/' },
    { name: 'Business', path: '/business' },
    { name: 'App', path: '/app' },
    { name: 'TripPlanner', path: '/tripPlanner' },
    { name: 'AIChat', path: '/aiChat' },
    { name: 'BusinessInfo', path: '/business-info' },
    { name: 'Blog', path: '/blog' },
    { name: 'Login', path: '/login' },
    { name: 'ServiceProviders', path: '/serviceProviders' },
];

async function captureScreens() {
    console.log(`📸 Starting Screen Capture to ${OUTPUT_DIR}...`);

    // Ensure directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const browser = await puppeteer.launch({
        headless: "new",
        defaultViewport: { width: 1440, height: 900 } // Desktop view
    });

    const page = await browser.newPage();

    for (const route of ROUTES) {
        const url = `${BASE_URL}${route.path}`;
        const filePath = path.join(OUTPUT_DIR, `${route.name}.png`);

        try {
            console.log(`   👉 Navigating to ${route.name} (${url})...`);
            await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

            // Optional: Wait for specific elements if needed
            // await page.waitForSelector('body');

            await page.screenshot({ path: filePath, fullPage: false });
            console.log(`   ✅ Captured: ${route.name}.png`);
        } catch (error) {
            console.error(`   ❌ Failed to capture ${route.name}:`, error.message);
        }
    }

    await browser.close();
    console.log('✨ Screen capture complete!');
}

captureScreens();
