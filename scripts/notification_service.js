import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const TELEGRAM_BOT_TOKEN = process.env.VITE_TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const TELEGRAM_CHAT_ID = "7224939578";

if (!SUPABASE_URL || !SUPABASE_KEY || !TELEGRAM_BOT_TOKEN || !GEMINI_API_KEY) {
    console.error("❌ Missing configuration. Please check .env file.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log("🔔 Notification Service Started.");
console.log(`Target Chat ID: ${TELEGRAM_CHAT_ID}`);

async function sendTelegram(message) {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'Markdown'
            })
        });

        if (!res.ok) {
            const err = await res.json();
            console.error("Failed to send Telegram:", err);
            return false;
        }
        return true;
    } catch (e) {
        console.error("Telegram Network Error:", e);
        return false;
    }
}

async function generateAutoReply(lead) {
    console.log("🧠 Generating AI Auto-Reply...");
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

    // Customize prompt based on category
    let promptContext = "You are an elite Sales Concierge for 'Kosmoi Luxury Estates'.";
    if (String(lead.business_type).includes('Boat')) promptContext = "You are a VIP Boat Charter Captain.";
    if (String(lead.business_type).includes('Villa')) promptContext = "You are a Luxury Villa Concierge.";

    const prompt = `
    ${promptContext}
    A new lead has just arrived via our website. 
    Draft a SHORT, casual but professional initial response (WhatsApp/Email) to acknowledge them.

    **Lead Details:**
    - Name: ${lead.first_name || 'Valued Guest'}
    - Interest: ${lead.business_type}
    - Details: ${lead.notes || 'N/A'}

    **Goal:** 
    1. Acknowledge the request.
    2. Confirm we are checking availability for their specific dates/needs.
    3. Ask 1 qualifying question if details are missing.
    4. Sign off as 'Kosmoi Concierge'.
    
    **Tone:** Premium, Exclusive, Helpful, Short.
    **Output:** Just the message body text.
    `;

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        return text ? text.trim() : "Error generating reply.";
    } catch (e) {
        console.error("Gemini Error:", e);
        return "Could not generate AI reply.";
    }
}

// Function to handle new leads
async function handleNewLead(payload) {
    const { new: lead } = payload;
    console.log("🆕 New Lead Detected:", lead.id);

    // Generate AI Draft
    let aiDraft = "_Generating AI Response..._";
    try {
        aiDraft = await generateAutoReply(lead);
    } catch (err) {
        console.error("AI Generation Failed:", err);
        aiDraft = "Failed to generate.";
    }

    const message = `
🚀 **New Lead Received!**

**Category:** ${lead.business_type || 'General'}
**Name:** ${lead.first_name || lead.last_name || 'N/A'}
**Contact:** \`${lead.email || lead.phone || 'N/A'}\`

-------------
🧠 **AI Suggested Reply:**
\`\`\`
${aiDraft}
\`\`\`
    `;

    // 1. Send Notification
    const sent = await sendTelegram(message);

    if (sent) {
        console.log("✅ Alert with AI Draft sent to Admin.");
    }
}

// Subscribe to Realtime changes on 'crm_leads' table
const channel = supabase
    .channel('realtime_leads')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'crm_leads' }, handleNewLead)
    .subscribe((status) => {
        console.log(`🔌 Subscription status: ${status}`);
    });

// Keep process alive
setInterval(() => {
    // Heartbeat
}, 60000);
