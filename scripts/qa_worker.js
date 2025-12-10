
/**
 * QA AUDIT WORKER
 * ===============
 * Role: Visual Regression & Stability Check.
 * Agent: qa-agent
 * 
 * Logic:
 * 1. Crawls Main Routes (Home, Team, BoardRoom, Command Center).
 * 2. Takes Screenshots (Desktop & Mobile).
 * 3. Saves to /qa_audits/[timestamp]/
 * 4. Logs Console Errors.
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUDIT_DIR = path.join(__dirname, '../qa_audits');
const BASE_URL = 'http://localhost:5173';

const ROUTES = [
    { name: 'Home', path: '/' },
    { name: 'Team', path: '/team' },
    { name: 'BoardRoom', path: '/board-room' },
    { name: 'CommandCenter', path: '/command-center' },
    { name: 'Explore', path: '/explore' } // Assuming this exists or redirects
];

async function runAudit() {
    console.log("🕵️ QA AGENT: Starting Visual Audit...");

    // Create Session Directory
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const sessionDir = path.join(AUDIT_DIR, timestamp);
    fs.mkdirSync(sessionDir, { recursive: true });

    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    const report = { timestamp, routes: [], errors: [] };

    // Capture Loop
    for (const route of ROUTES) {
        console.log(`📸 Capturing: ${route.name} (${route.path})`);
        try {
            await page.goto(BASE_URL + route.path, { waitUntil: 'networkidle2', timeout: 30000 });

            // 1. Desktop View
            await page.setViewport({ width: 1920, height: 1080 });
            await page.screenshot({ path: path.join(sessionDir, `${route.name}_desktop.png`) });

            // 2. Mobile View
            await page.setViewport({ width: 375, height: 812 });
            await page.screenshot({ path: path.join(sessionDir, `${route.name}_mobile.png`) });

            report.routes.push({ name: route.name, status: 'PASS' });

        } catch (err) {
            console.error(`❌ FAILED: ${route.name}`, err.message);
            report.routes.push({ name: route.name, status: 'FAIL', error: err.message });
            report.errors.push({ route: route.name, error: err.message });
        }
    }

    await browser.close();

    // Generate Report JSON
    fs.writeFileSync(path.join(sessionDir, 'report.json'), JSON.stringify(report, null, 2));

    // Update "LATEST" symlink/copy (Simulated)
    const latestDir = path.join(AUDIT_DIR, 'LATEST');
    if (fs.existsSync(latestDir)) fs.rmSync(latestDir, { recursive: true, force: true });
    fs.cpSync(sessionDir, latestDir, { recursive: true });

    console.log(`✅ Audit Complete. Saved to: ${sessionDir}`);
    console.log(`📂 LATEST snapshot updated.`);
}

runAudit();
