import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';
import { createClient } from '@supabase/supabase-js';

const token = process.env.VITE_TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

if (!token) {
    console.error("❌ TELEGRAM_BOT_TOKEN missing!");
    process.exit(1);
}

const bot = new TelegramBot(token, { polling: false }); // Disabled to prevent conflict with telegram_hub.js

console.log("⚠️ This bot script is DEPRECATED in favor of telegram_hub.js. Polling disabled.");
process.exit(0);

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    console.log(`📩 Received from ${chatId}: ${text}`);

    if (!text) return;

    if (text === '/start') {
        bot.sendMessage(chatId, "היי! אני הבוט של Kosmoi. שלח לי בקשה ואני אצור משימה לאחד הסוכנים שלי.");
        return;
    }

    try {
        // 1. Create a task in agent_tasks
        const taskData = {
            title: `Telegram Request: ${text.slice(0, 50)}...`,
            description: `User requested via Telegram: "${text}"\nChatID: ${chatId}`,
            assigned_to: 'tech-lead-agent', // Default to tech lead to triage
            priority: 'medium',
            status: 'pending',
            created_by: 'telegram-bot'
        };

        const { data, error } = await supabase
            .from('agent_tasks')
            .insert([taskData])
            .select()
            .single();

        if (error) throw error;

        console.log(`✅ Created Task: ${data.id}`);
        bot.sendMessage(chatId, "קיבלתי! יצרתי משימה עבור הסוכנים שלי. אעדכן אותך כשיסיימו. 🤖");

    } catch (e) {
        console.error("❌ Failed to process Telegram message:", e.message);
        bot.sendMessage(chatId, "מצטער, הייתה לי תקלה קטנה בעיבוד הבקשה שלך. נסה שוב מאוחר יותר.");
    }
});

bot.on('polling_error', (error) => {
    console.error("⚠️ Polling Error:", error.code, error.message);
});
