import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
    console.error("Error: TELEGRAM_BOT_TOKEN not found in .env");
    process.exit(1);
}

const bot = new TelegramBot(token, { polling: false });

console.log("Checking for updates (Polling for 30s)...");

async function getChatId() {
    try {
        const me = await bot.getMe();
        console.log(`✅ Token valid! Bot is: @${me.username} (ID: ${me.id})`);

        // Poll for 30 seconds
        const startTime = Date.now();
        while (Date.now() - startTime < 30000) {
            const updates = await bot.getUpdates({ offset: -1 }); // Get latest
            if (updates.length > 0) {
                const lastUpdate = updates[updates.length - 1];
                const chatId = lastUpdate.message?.chat?.id || lastUpdate.my_chat_member?.chat?.id;
                const user = lastUpdate.message?.from?.username || lastUpdate.message?.from?.first_name;

                if (chatId) {
                    console.log(`\n🎉 SUCCESS! Found Chat ID for user @${user}:`);
                    console.log(`CHAT_ID=${chatId}`);
                    // Save to .env logic (simulation)
                    process.exit(0);
                }
            }
            await new Promise(r => setTimeout(r, 2000)); // Wait 2s
            process.stdout.write(".");
        }
        console.log("\nTimeout: No messages received in 30 seconds.");
    } catch (error) {
        console.error("Error fetching updates:", error.message);
    }
}

getChatId();
