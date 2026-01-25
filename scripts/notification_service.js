import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const TELEGRAM_BOT_TOKEN = process.env.VITE_TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const TELEGRAM_CHAT_ID = "7224939578"; // Hardcoded Founder ID
const VISION_FILE = path.resolve('docs/FOUNDER_VISION.md');

if (!SUPABASE_URL || !SUPABASE_KEY || !TELEGRAM_BOT_TOKEN || !GEMINI_API_KEY) {
    console.error("❌ Missing configuration. Please check .env file.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

console.log("🚀 Founder Relay Service Started.");
console.log(`📡 Listening for Founder (${TELEGRAM_CHAT_ID})...`);

// --- 📥 INCOMING VISION & COMMANDS (FOUNDER -> PROJECT) ---
bot.on('message', async (msg) => {
    const chatId = msg.chat.id.toString();
    const text = msg.text || msg.caption;

    if (chatId !== TELEGRAM_CHAT_ID) {
        console.log(`🚫 Unauthorized message from ${chatId}`);
        return;
    }

    // 0. Handle Media (Photos/Documents)
    let mediaPromptContext = "";
    if (msg.photo || msg.document) {
        console.log("📸 Received media from Founder.");
        const uploadDir = path.resolve('docs/founder_uploads');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

        const fileId = msg.photo ? msg.photo[msg.photo.length - 1].file_id : msg.document.file_id;
        try {
            const fileLink = await bot.getFileLink(fileId);
            const fileName = msg.document ? msg.document.file_name : `photo_${Date.now()}.jpg`;
            const filePath = path.join(uploadDir, fileName);

            const response = await fetch(fileLink);
            const buffer = await response.arrayBuffer();
            fs.writeFileSync(filePath, Buffer.from(buffer));

            mediaPromptContext = `(The founder also uploaded a file: ${fileName})`;
            console.log(`✅ Saved upload to ${filePath}`);
        } catch (e) {
            console.error("Failed to download founder media:", e);
        }
    }

    if (!text && !mediaPromptContext) return;

    const fullInput = `${text || ""}\n${mediaPromptContext}`.trim();
    console.log(`📩 New message from Founder: "${fullInput}"`);

    // 1. COMMAND: /do [Task Description] - Trigger Background Execution
    if (text && (text.startsWith('/do ') || text.toLowerCase().includes('צא לדרך'))) {
        const taskDescription = text.replace('/do ', '').replace('צא לדרך על ', '').trim();
        bot.sendMessage(chatId, `🚀 **Executing Vision...**\nCreating background task for: "_${taskDescription}_"`);
        // ... (Task creation logic preserved below)
    }

    // 2. VISION: Log general directions/ideas
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `The founder just sent a message: "${fullInput}". 
    Summarize this into a single bullet point for the vision log. 
    If a file was attached, mention it briefly. 
    Format: "- [DATE] [SUMMARY]"
    Use Hebrew if the input is Hebrew, English if English.`;

    try {
        const result = await model.generateContent(prompt);
        const summary = result.response.text().trim();

        const obsidianEntry = `\n${summary} (Original: "${fullInput}")\n`;
        fs.appendFileSync(VISION_FILE, obsidianEntry);

        bot.sendMessage(chatId, `✅ **Vision Logged.**\nAdded to \`docs/FOUNDER_VISION.md\`.\n\n"_${summary}_"`);

        // If it was just a command, skip task creation logic below and handle inside the /do block
        if (text && (text.startsWith('/do ') || text.toLowerCase().includes('צא לדרך'))) {
            const taskDescription = text.replace('/do ', '').replace('צא לדרך על ', '').trim();
            try {
                const { data, error } = await supabase.from('agent_tasks').insert([{
                    title: `Founder Request: ${taskDescription.substring(0, 30)}...`,
                    description: taskDescription,
                    status: 'pending',
                    assigned_to: 'tech-lead-agent',
                    priority: 'high'
                }]).select().single();
                if (!error) bot.sendMessage(chatId, `🚀 **Task Deployed.** ID: \`${data.id}\``);
            } catch (e) { }
        }
    } catch (err) {
        console.error("Gemini/Filesystem Error:", err);
    }
});

bot.on('polling_error', (error) => {
    if (error.code !== 'ETELEGRAM') {
        console.error("Telegram Polling Error:", error.code);
    }
});

// --- 📤 OUTGOING ALERTS (PROJECT -> FOUNDER) ---
async function handleNewLead(payload) {
    const { new: lead } = payload;
    console.log("🆕 New Lead Detected:", lead.id);

    // AI suggested reply draft
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `You are an elite Sales Concierge. Draft a VERY SHORT initial response for a lead interested in ${lead.business_type}. Name: ${lead.first_name || 'Guest'}. Notes: ${lead.notes || 'N/A'}.`;

    let aiDraft = "AI Draft failed.";
    try {
        const result = await model.generateContent(prompt);
        aiDraft = result.response.text();
    } catch (e) {
        console.error("AI Generation Error:", e);
    }

    const message = `🚀 **New Lead Received!**\n\n**Category:** ${lead.business_type}\n**Name:** ${lead.first_name || lead.last_name}\n**Contact:** ${lead.email || lead.phone}\n\n---\n🧠 **AI Suggestion:**\n\`${aiDraft}\``;

    bot.sendMessage(TELEGRAM_CHAT_ID, message, { parse_mode: 'Markdown' });
}

// Subscribe to leads
supabase.channel('realtime_leads')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'crm_leads' }, handleNewLead)
    .subscribe();
