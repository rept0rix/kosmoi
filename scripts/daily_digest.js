/**
 * daily_digest.js
 * Sends a daily business digest to a Telegram chat.
 *
 * Usage:
 *   node scripts/daily_digest.js
 *
 * Required .env variables (same pattern as agent_worker.js):
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_SERVICE_ROLE_KEY
 *   TELEGRAM_BOT_TOKEN
 *   TELEGRAM_CHAT_ID
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

// --- Supabase Client ---
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// --- Telegram Sender ---
async function sendTelegram(message) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.error("❌ Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID in .env");
    return false;
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: "HTML",
    }),
  });

  const data = await res.json();
  if (!data.ok) {
    console.error("❌ Telegram error:", JSON.stringify(data));
    return false;
  }

  console.log("✅ Digest sent to Telegram.");
  return true;
}

// --- Data Queries ---
async function fetchDigestData() {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // New providers in last 24h
  const { data: newProviders, error: provErr } = await supabase
    .from("service_providers")
    .select("id, business_name, category, created_at")
    .gte("created_at", oneDayAgo)
    .order("created_at", { ascending: false });

  if (provErr) console.warn("⚠️ Providers query error:", provErr.message);

  // New leads in last 24h
  const { data: newLeads, error: leadErr } = await supabase
    .from("crm_leads")
    .select("id, first_name, last_name, company, email, created_at")
    .gte("created_at", oneDayAgo)
    .order("created_at", { ascending: false });

  if (leadErr) console.warn("⚠️ Leads query error:", leadErr.message);

  // Completed agent tasks in last 24h
  const { data: completedTasks, error: taskErr } = await supabase
    .from("agent_tasks")
    .select("id, title, assigned_to, updated_at")
    .eq("status", "completed")
    .gte("updated_at", oneDayAgo)
    .order("updated_at", { ascending: false });

  if (taskErr) console.warn("⚠️ Tasks query error:", taskErr.message);

  // Total revenue in last 7 days — from transactions table
  const { data: revenueRows, error: revErr } = await supabase
    .from("transactions")
    .select("amount, status, created_at")
    .in("status", ["succeeded", "completed"])
    .gte("created_at", sevenDaysAgo);

  let totalRevenue = 0;
  if (!revErr && revenueRows) {
    totalRevenue = revenueRows.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0);
  } else {
    console.warn("⚠️ Revenue query error:", revErr?.message);
  }

  return {
    newProviders: newProviders || [],
    newLeads: newLeads || [],
    completedTasks: completedTasks || [],
    totalRevenue,
    timestamp: now.toISOString(),
  };
}

// --- Message Formatter ---
function formatDigestMessage(data) {
  const { newProviders, newLeads, completedTasks, totalRevenue, timestamp } = data;

  const dateStr = new Date(timestamp).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const timeStr = new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  let msg = `<b>📊 Daily Business Digest</b>\n`;
  msg += `<i>${dateStr} at ${timeStr}</i>\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  // --- New Providers ---
  msg += `<b>🏪 New Providers (last 24h)</b>\n`;
  if (newProviders.length === 0) {
    msg += `  • None registered today\n`;
  } else {
    msg += `  <b>${newProviders.length}</b> new provider(s) joined!\n`;
    newProviders.slice(0, 5).forEach((p) => {
      msg += `  • <b>${p.business_name || "Unnamed"}</b> — ${p.category || "General"}\n`;
    });
    if (newProviders.length > 5) {
      msg += `  ... and ${newProviders.length - 5} more\n`;
    }
  }

  msg += `\n`;

  // --- New Leads ---
  msg += `<b>🎯 New Leads (last 24h)</b>\n`;
  if (newLeads.length === 0) {
    msg += `  • No new leads today\n`;
  } else {
    msg += `  <b>${newLeads.length}</b> new lead(s) captured!\n`;
    newLeads.slice(0, 5).forEach((l) => {
      const name = [l.first_name, l.last_name].filter(Boolean).join(" ") || l.email || "Unknown";
      const company = l.company ? ` @ ${l.company}` : "";
      msg += `  • ${name}${company}\n`;
    });
    if (newLeads.length > 5) {
      msg += `  ... and ${newLeads.length - 5} more\n`;
    }
  }

  msg += `\n`;

  // --- Completed Tasks ---
  msg += `<b>✅ Completed Agent Tasks (last 24h)</b>\n`;
  if (completedTasks.length === 0) {
    msg += `  • No tasks completed today\n`;
  } else {
    msg += `  <b>${completedTasks.length}</b> task(s) completed!\n`;
    completedTasks.slice(0, 5).forEach((t) => {
      msg += `  • ${(t.title || "Untitled").slice(0, 60)}\n`;
    });
    if (completedTasks.length > 5) {
      msg += `  ... and ${completedTasks.length - 5} more\n`;
    }
  }

  msg += `\n`;

  // --- Revenue ---
  msg += `<b>💰 Revenue (last 7 days)</b>\n`;
  msg += `  Total: <b>$${totalRevenue.toFixed(2)} USD</b>\n`;

  msg += `\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `<i>🤖 Samui Service Hub — Automated Digest</i>`;

  return msg;
}

// --- Main ---
async function main() {
  console.log("📊 Generating daily digest...");

  try {
    const data = await fetchDigestData();

    console.log(`  New providers: ${data.newProviders.length}`);
    console.log(`  New leads: ${data.newLeads.length}`);
    console.log(`  Completed tasks: ${data.completedTasks.length}`);
    console.log(`  7-day revenue: $${data.totalRevenue.toFixed(2)}`);

    const message = formatDigestMessage(data);
    console.log("\n--- Message Preview ---");
    console.log(message.replace(/<[^>]+>/g, ""));
    console.log("-----------------------\n");

    const sent = await sendTelegram(message);
    if (!sent) {
      process.exit(1);
    }
  } catch (err) {
    console.error("❌ Digest generation failed:", err.message);
    process.exit(1);
  }
}

main();
