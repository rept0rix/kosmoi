import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

async function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function takeScreenshot() {
    // Filter out flags from positional arguments
    const args = process.argv.slice(2).filter(arg => !arg.startsWith('--'));
    const autoServer = process.argv.includes('--auto-server');

    let url = args[0] || 'http://localhost:5173';
    const outputPath = args[1] || 'screenshot.png';

    // If only a path is provided (e.g. "yacht-tours"), turn it into a full URL
    if (!url.startsWith('http')) {
        url = `http://localhost:5173/${url.replace(/^\//, '')}`;
    }

    console.log(`📸 Target URL: ${url}`);
    console.log(`📂 Output: ${outputPath}`);

    let serverProcess = null;

    if (autoServer) {
        console.log("🚀 Starting temporary dev server...");
        serverProcess = spawn('npm', ['run', 'dev'], {
            stdio: 'inherit',
            shell: true
        });

        // Wait for Vite to be ready
        console.log("⏳ Waiting 10 seconds for server to initialize...");
        await wait(10000);
    }

    try {
        const browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });

        // Log basic console messages for tracing
        page.on('console', msg => {
            console.log(`PAGE LOG: ${msg.text()}`);
        });

        console.log(`📡 Navigating to ${url}...`);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        // Wait for content (h1) to ensure the page isn't blank (especially for lazy routes)
        console.log("⏳ Waiting for content (h1)...");
        try {
            await page.waitForSelector('h1', { timeout: 15000 });
        } catch (e) {
            console.warn("⚠️ Warning: h1 not found, proceding anyway.");
        }

        // Final settle for animations and lazy loading
        await wait(3000);

        await page.screenshot({ path: outputPath, fullPage: true });
        await browser.close();

        console.log(`✅ Screenshot saved to ${outputPath}`);
    } catch (error) {
        console.error(`❌ Screenshot Error: ${error.message}`);
    } finally {
        if (serverProcess) {
            console.log("🛑 Killing temporary server...");
            // Use process.kill with minus to kill the whole group if shell/npm spawned
            try { process.kill(-serverProcess.pid, 'SIGTERM'); } catch (e) {
                serverProcess.kill('SIGTERM');
            }
        }
    }
}

takeScreenshot();
