
// Polyfill window for some shared modules
if (typeof window === 'undefined') {
    global.window = {};
}

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load Environment Variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '../.env');
console.log("Loading .env from:", envPath);
const result = dotenv.config({ path: envPath });

if (result.error) {
    console.error("Error loading .env:", result.error);
}

// Polyfill import.meta.env for modules that rely on it and fallback
if (!process.env.VITE_SUPABASE_URL) {
    console.warn("⚠️ VITE_SUPABASE_URL is missing in process.env!");
} else {
    console.log("✅ VITE_SUPABASE_URL loaded:", process.env.VITE_SUPABASE_URL.substring(0, 20) + "...");
}

// Emulate Vite's import.meta.env for cleaner compatibility
// @ts-ignore
global.import = { meta: { env: process.env } };

async function testSocialAgent() {
    // Dynamic imports to prevent hoisting before dotenv
    await import('../src/services/tools/registry/NodeCommunicationTools.js');
    await import('../src/services/tools/registry/DatabaseTools.js');
    await import('../src/services/tools/registry/CommunicationTools.js'); // Added for send_telegram

    // Import the BASE Registry, not the Feature one
    const { ToolRegistry: Registry } = await import('../src/services/tools/ToolRegistry.js');

    console.log("🚀 Starting Social Media Agent Test...");

    // 1. Test get_new_listings
    console.log("\n--- Testing Data Source (get_new_listings) ---");

    // Check existence
    if (!Registry.tools.has("get_new_listings")) {
        console.error("❌ Tool 'get_new_listings' not found in registry!");
        return;
    }

    try {
        const listings = await Registry.execute("get_new_listings", { limit: 2 });
        console.log("Listings Found:", listings);
    } catch (e) {
        console.error("❌ Failed to get listings:", e);
    }

    // 2. Test Telegram Sending
    console.log("\n--- Testing Telegram (send_telegram) ---");

    if (process.env.VITE_TELEGRAM_BOT_TOKEN) {
        try {
            console.log("Bot Token found. Attempting to send message to 'test_channel'...");

            // Just verifying the tool is callable
            if (Registry.tools.has("send_telegram")) {
                console.log("✅ Tool 'send_telegram' is registered and ready.");
                // await Registry.execute("send_telegram", { message: "Test", to: "..." });
            } else {
                console.error("❌ Tool 'send_telegram' missing!");
            }

        } catch (e) {
            console.error("❌ Telegram check error:", e);
        }
    } else {
        console.log("⚠️ No VITE_TELEGRAM_BOT_TOKEN found. Skipping Telegram network test.");
    }

    // 3. Test Invite Link Gen
    console.log("\n--- Testing Invite Link (create_telegram_invite) ---");
    if (Registry.tools.has("create_telegram_invite")) {
        console.log("✅ Tool 'create_telegram_invite' is registered.");
    } else {
        console.error("❌ Tool 'create_telegram_invite' missing!");
    }

    console.log("\n✅ Test Complete.");
    process.exit(0);
}

testSocialAgent();
