import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars FIRST
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function test() {
    console.log("Env Loaded. Token:", process.env.TELEGRAM_BOT_TOKEN ? "Found" : "Missing");

    // Dynamic import AFTER env is loaded
    const { sendTelegramNotification } = await import('../services/TelegramService.js');

    console.log("Sending test message...");
    const result = await sendTelegramNotification("👋 System Online: Connection Established with Kosmoi Hub!");

    if (result.success) {
        console.log("✅ Message sent successfully!");
    } else {
        console.error("❌ Failed:", result.error);
    }
}

test();
