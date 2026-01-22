
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const TELEGRAM_BOT_TOKEN = process.env.VITE_TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = "7224939578";

// --- Configuration ---
const DAILY_BUDGET_PER_CAMPAIGN = 1000; // THB
const CAMPAIGNS = [
    { name: 'Boat Rentals', keyword: 'Boat', target_cpa: 300 },
    { name: 'Luxury Villas', keyword: 'Villa', target_cpa: 800 } // Higher tolerance for luxury
];

if (!SUPABASE_URL || !SUPABASE_KEY || !TELEGRAM_BOT_TOKEN) {
    console.error("❌ Missing configuration.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function sendTelegram(message) {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    try {
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'Markdown'
            })
        });
    } catch (e) {
        console.error("Telegram Error:", e);
    }
}

async function runCFOAnalysis() {
    console.log("💰 CFO Agent: Starting Analysis...");

    // 1. Get Leads from last 24h
    // For DEMO purposes, we'll just check ALL leads to show data, 
    // since we just created them today. In production, use: .gte('created_at', new Date(Date.now() - 86400000).toISOString())
    const { data: leads, error } = await supabase
        .from('crm_leads')
        .select('business_type, created_at');

    if (error) {
        console.error("DB Error:", error);
        return;
    }

    let report = `💰 **CFO Daily Briefing**\n_(Analyzing all-time data for demo)_\n\n`;
    let totalSpend = 0;
    let totalLeads = 0;

    for (const campaign of CAMPAIGNS) {
        // Count leads for this campaign
        const campaignLeads = leads.filter(l => l.business_type && l.business_type.includes(campaign.keyword)).length;

        // Calculate Math
        const spend = DAILY_BUDGET_PER_CAMPAIGN; // Simulating 1 day spend
        totalSpend += spend;
        totalLeads += campaignLeads;

        let cpa = campaignLeads > 0 ? (spend / campaignLeads).toFixed(0) : "∞";
        let status = "⚪ No Data";

        if (campaignLeads > 0) {
            if (cpa < campaign.target_cpa) status = "🟢 SCALE UP";
            else if (cpa < (campaign.target_cpa * 1.5)) status = "🟡 MONITOR";
            else status = "🔴 PAUSE / FIX";
        } else {
            status = "🔴 BURNING CASH (0 Leads)";
        }

        report += `**${campaign.name}**\n`;
        report += `   • Leads: ${campaignLeads}\n`;
        report += `   • Spend: ฿${spend.toLocaleString()}\n`;
        report += `   • CPA: **฿${cpa}** (Target: ฿${campaign.target_cpa})\n`;
        report += `   • Verdict: ${status}\n\n`;
    }

    report += `-----------------------------\n`;
    report += `📉 Total Spend: ฿${totalSpend.toLocaleString()}\n`;
    report += `📈 Total Leads: ${totalLeads}\n`;

    console.log(report);
    await sendTelegram(report);
    console.log("✅ Report Sent.");
}

runCFOAnalysis();
