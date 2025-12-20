
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const OUTPUT_DIR = path.join(__dirname, '../public/screens');
const VIEWPORT = { width: 1440, height: 900 };

// Define the screens to capture
const ROUTES = [
    { name: 'Home', path: '/' },
    { name: 'Login', path: '/login' },
    { name: 'Dashboard', path: '/provider-dashboard' },
    { name: 'ServiceProviders', path: '/serviceproviders' },
    { name: 'TripPlanner', path: '/tripplanner' },
    { name: 'ExperiencesHub', path: '/experiences' },
    { name: 'RealEstateHub', path: '/real-estate' },
    { name: 'Marketplace', path: '/marketplace' },
    { name: 'Map', path: '/mapview' },
    { name: 'AIChat', path: '/chat/new' },
    { name: 'AdminCanvas', path: '/admin/canvas' },
    { name: 'AdminKanban', path: '/admin/tasks' },
    { name: 'AdminCRM', path: '/admin/crm' },
    { name: 'BoardRoom', path: '/board-room' },
    { name: 'CommandCenter', path: '/command-center' },
];

async function ensureDirectoryExists(directory) {
    if (!fs.existsSync(directory)) {
        console.log(`Creating directory: ${directory}`);
        fs.mkdirSync(directory, { recursive: true });
    }
}

async function captureScreens() {
    console.log(`📸 Starting Screenshot Agent...`);
    console.log(`Target Base URL: ${BASE_URL}`);
    console.log(`Output Directory: ${OUTPUT_DIR}`);

    await ensureDirectoryExists(OUTPUT_DIR);

    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox'], // Safer for CI/Docker environments
        defaultViewport: VIEWPORT
    });

    const page = await browser.newPage();

    // simulate a user agent to avoid basic bot detection if any
    // Added 'ScreenshotAgent' to allow bypassing auth in DEV mode
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36 ScreenshotAgent');

    // Login Bypass / Mocking (Optional - extend this if needed)
    // For now, we assume public routes or dev mode bypass.
    // Ideally, valid auth cookies could be injected here.

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
    page.on('response', response => {
        if (response.status() >= 400) {
            console.log(`❌ FAILED REQUEST: ${response.status()} ${response.url()}`);
        }
    });

    for (const route of ROUTES) {
        const url = `${BASE_URL}${route.path}`;
        const outputPath = path.join(OUTPUT_DIR, `${route.name}.png`);

        try {
            console.log(`Navigating to: ${url}`);
            await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

            // Wait for the loading spinner to disappear and main content to appear
            try {
                // Wait for a generic layout selector that indicates hydration (e.g. 'main', 'header', or specific id)
                await page.waitForSelector('main', { timeout: 10000 });

                // Add a hard wait to allow images/maps to render
                await new Promise(r => setTimeout(r, 3000));
            } catch (e) {
                console.log(`⚠️ Timeout waiting for hydration on ${route.name}`);
                const bodyText = await page.evaluate(() => document.body.innerText);
                console.log(`Debug Body: ${bodyText.substring(0, 200)}...`);
            }

            const title = await page.title();
            console.log(`📄 Page Title: "${title}"`);

            // Optional: Wait for specific elements if needed
            // await page.waitForSelector('#root'); 

            await page.screenshot({ path: outputPath, fullPage: false });
            console.log(`✅ Captured: ${route.name}`);
        } catch (error) {
            console.error(`❌ Failed to capture ${route.name}:`, error.message);
        }
    }

    await browser.close();
    console.log(`🎉 All screenshots captured! Check public/screens/`);
}

captureScreens().catch(console.error);
