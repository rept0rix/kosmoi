import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';
import { createClient } from '@supabase/supabase-js';
import { AgentService } from '../src/features/agents/services/AgentService.js';
import { agents } from '../src/features/agents/services/AgentRegistry.js';
import fs from 'fs';
import path from 'path';

// --- CONFIGURATION ---
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const TELEGRAM_BOT_TOKEN = process.env.VITE_TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = "7224939578"; // Founder Chat ID

if (!SUPABASE_URL || !SUPABASE_KEY || !TELEGRAM_BOT_TOKEN) {
    console.error("❌ Missing required environment variables (SUPABASE or TELEGRAM).");
    process.exit(1);
}

// --- INITIALIZATION ---
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

// Identity the "Vision Founder" persona (usually the CEO or a specialized strategist)
const agentConfig = agents.find(a => a.id === 'ceo-agent') || agents[0];
const agent = new AgentService(agentConfig, { userId: '2ff0dcb1-37f2-4338-bb3b-f71fb6dd444e' }); // System Admin ID

console.log("🚀 Kosmoi Telegram Hub Online.");
console.log(`🤖 Persona: ${agentConfig.role}`);
console.log(`📡 Listening for Founder: ${TELEGRAM_CHAT_ID}`);

// --- HELPERS ---
async function sendWithMedia(chatId, text, filePath = null) {
    try {
        if (filePath && fs.existsSync(filePath)) {
            const extension = path.extname(filePath).toLowerCase();
            if (['.jpg', '.jpeg', '.png', '.gif'].includes(extension)) {
                await bot.sendPhoto(chatId, filePath, { caption: text, parse_mode: 'Markdown' });
            } else {
                await bot.sendDocument(chatId, filePath, { caption: text, parse_mode: 'Markdown' });
            }
        } else {
            await bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
        }
    } catch (e) {
        console.error("Telegram Send Error:", e.message);
    }
}

// --- DEDUPLICATION ---
const processedMessages = new Set();
setInterval(() => processedMessages.clear(), 60000); // Clear memory every minute

// --- INCOMING MESSAGE HANDLER ---
bot.on('message', async (msg) => {
    // 1. Anti-Loop: Ignore Bots
    if (msg.from && msg.from.is_bot) return;

    // 2. Anti-Loop: Deduplicate
    if (processedMessages.has(msg.message_id)) return;
    processedMessages.add(msg.message_id);

    const chatId = msg.chat.id.toString();
    const text = msg.text || msg.caption || "";
    const photos = msg.photo;

    // 3. Auth Check
    if (chatId !== TELEGRAM_CHAT_ID) {
        console.log(`🚫 Ignore message from unauthorized user: ${chatId}`);
        return;
    }

    if (!text && !photos) return;

    console.log(`📩 Founder: ${text || "[Photo]"}`);

    // Show 'typing' while brain calculates
    bot.sendChatAction(chatId, 'typing');

    try {
        const images = [];

        // 1. Process Photos if present
        if (photos && photos.length > 0) {
            const fileId = photos[photos.length - 1].file_id; // Get highest resolution
            const fileLink = await bot.getFileLink(fileId);
            const response = await fetch(fileLink);
            const buffer = await response.arrayBuffer();
            const base64 = Buffer.from(buffer).toString('base64');
            images.push({
                base64: base64,
                mimeType: 'image/jpeg'
            });
            console.log("📸 Image attached to request.");
        }

        // 2. Process via AgentService
        const response = await agent.sendMessage(`[Telegram Interaction] User says: "${text}"`, {
            simulateTools: true,
            bypassGuardrails: true,
            images: images
        });

        // 3. Map Agent response to Telegram
        let replyText = response.text || "No response text.";
        let attachment = null;

        // 4. Heuristics for attachments
        if (text.toLowerCase().includes('logo') || replyText.toLowerCase().includes('logo')) {
            const logoPath = path.resolve('public/kosmoi-logo.png');
            if (fs.existsSync(logoPath)) attachment = logoPath;
        }

        const screenshotPath = path.resolve('screenshot.png');
        if (fs.existsSync(screenshotPath)) {
            const stats = fs.statSync(screenshotPath);
            if (Date.now() - stats.mtimeMs < 60000) attachment = screenshotPath;
        }

        // 5. Send Reply (Sanitized)
        // Basic escaping for Markdown to avoid ETELEGRAM: 400
        const sanitizedText = replyText.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1');

        await sendWithMedia(chatId, replyText, attachment); // sendWithMedia handles its own parse_mode

        // 6. Cleanup
        if (attachment === screenshotPath) {
            try { fs.unlinkSync(screenshotPath); } catch (e) { }
        }

    } catch (err) {
        console.error("Agent Processing Error:", err);
        await bot.sendMessage(chatId, `❌ **System Error:** ${err.message}`);
    }
});

// --- REAL-TIME SUBSCRIPTIONS (ALERTS) ---

// Handle New Leads
async function handleNewLead(payload) {
    const { new: lead } = payload;
    console.log("🆕 New Lead:", lead.id);
    const message = `🚀 **New Lead Alert!**\n\n**Type:** ${lead.business_type}\n**Name:** ${lead.first_name || 'N/A'}\n**Context:** ${lead.notes || 'N/A'}`;
    await sendWithMedia(TELEGRAM_CHAT_ID, message);
}

// Monitor crm_leads
supabase.channel('telegram_hub_leads')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'crm_leads' }, handleNewLead)
    .subscribe();

bot.on('polling_error', (error) => {
    if (error.code !== 'ETELEGRAM') console.error("Polling Error:", error.message);
});
