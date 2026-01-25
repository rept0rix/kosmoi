import 'dotenv/config';
import { sendTelegramNotification } from './src/services/TelegramService.js';

async function test() {
    console.log("Testing Telegram notification...");
    const result = await sendTelegramNotification("🚨 טסט: הבוט מחובר ומצליח לשלוח הודעות!");
    console.log("Result:", result);
    process.exit(result.success ? 0 : 1);
}

test();
