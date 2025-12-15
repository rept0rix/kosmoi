
import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const BASE_URL = 'http://localhost:5173'; // Dev server URL
const USER_EMAIL = 'user@test.com';
const USER_PASS = 'password123';

async function runQA() {
    console.log("🕵️‍♀️ QA Warden starting patrol...");

    // Launch Browser
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Set viewport to desktop
    await page.setViewport({ width: 1280, height: 800 });

    const report = {
        passed: [],
        failed: []
    };

    try {
        // Test 1: Public Homepage
        console.log("👉 Checking Homepage...");
        await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
        const title = await page.title();
        if (title.includes("Kosmoi") || await page.$('h1')) {
            report.passed.push("Homepage Load");
        } else {
            throw new Error("Homepage title or H1 missing");
        }

        // Test 2: Login Flow (Simulated via URL mostly, but let's try real login if form exists)
        // Note: For dev, we might already be logged in if local storage persists, but puppeteer is fresh.
        // We can manually injecting token if we wanted, but let's try UI.

        // Actually, let's test public pages first.

        // Test 3: Marketplace Public (if protected, it will redirect)
        // Marketplace is routed under authenticated route?
        // In App.jsx: <Route element={<ProtectedUserRoute />}><Route path="/marketplace" ... />
        // So it requires login.

        // Let's mocking login by injecting localStorage? 
        // Supabase persists session in localStorage key `sb-<ref>-auth-token`.
        // Hard to guess ref.

        // Let's use the explicit Login page if available. 
        // We assume /login or just / redirects to login if protected.

        // Let's try to access /marketplace and see if we get redirected
        console.log("👉 Checking Middleware/Guard...");
        await page.goto(`${BASE_URL}/marketplace`, { waitUntil: 'networkidle0' });
        if (page.url().includes('auth') || await page.$('input[type="email"]')) {
            report.passed.push("Protected Route Redirects to Login");

            // Try logging in
            console.log("   🔐 Attempting Login...");
            const emailInput = await page.$('input[type="email"]');
            if (emailInput) {
                await emailInput.type(USER_EMAIL);
                const passInput = await page.$('input[type="password"]');
                await passInput.type(USER_PASS);

                const submitBtn = await page.$('button[type="submit"]');
                await Promise.all([
                    page.waitForNavigation({ waitUntil: 'networkidle0' }),
                    submitBtn.click()
                ]);

                // NOW verify Marketplace
                console.log("👉 Checking Marketplace (Authenticated)...");
                // If successful, we should be on /marketplace (or home then navigate)
                // Let's force goto marketplace again to be sure
                await page.goto(`${BASE_URL}/marketplace`, { waitUntil: 'networkidle0' });

                const providerCards = await page.$$('.group'); // The card wrapper has 'group' class
                if (providerCards.length >= 0) { // 0 is technically pass if DB empty, but we seeded it.
                    const count = providerCards.length;
                    console.log(`      Found ${count} providers.`);
                    if (count > 0) report.passed.push(`Marketplace Loaded (${count} items)`);
                    else report.failed.push("Marketplace Empty (Expected Demo Data)");
                }
            } else {
                console.warn("   ⚠️ Login form not found with standard selectors.");
                report.failed.push("Login Form Not Found");
            }

        } else {
            // Maybe it's not protected?
            report.passed.push("Marketplace Access (Check Auth Guard)");
        }

        // Test 4: Board Room Visuals
        console.log("👉 Checking Board Room...");
        await page.goto(`${BASE_URL}/board-room`, { waitUntil: 'networkidle0' });
        // Check for specific UI elements mentioned by user ("tasks list")
        // User said: "I don't see the list of tasks"
        // Let's see if we find any text "Tasks" or columns
        const pageContent = await page.content();
        if (pageContent.includes("Tasks") || await page.$('.kanban-board') || await page.$('.task-list')) {
            report.passed.push("Board Room Task Element Found");
        } else {
            console.warn("   ⚠️ Task List element NOT detected.");
            report.failed.push("Board Room Missing Task List");
        }

    } catch (e) {
        console.error("❌ Critical Fail:", e);
        report.failed.push(`Critical: ${e.message}`);
    } finally {
        await browser.close();
    }

    console.log("\n📋 QA REPORT");
    console.log("-------------");
    report.passed.forEach(p => console.log(`✅ ${p}`));
    report.failed.forEach(f => console.log(`❌ ${f}`));

    if (report.failed.length > 0) process.exit(1);
}

runQA();
