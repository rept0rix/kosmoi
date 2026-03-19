#!/usr/bin/env node
/**
 * 💰 Stripe Alert
 * ─────────────────────────────────────────
 * רץ כל שעה
 * בודק עסקאות Stripe חדשות מהשעה האחרונה
 * שולח התראת טלגרם על כל תשלום חדש
 */

import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const STATE_FILE = path.join(ROOT, '.agent', 'stripe_last_seen.json');

// ─── Load ENV ────────────────────────────────────────────────────────────────
function loadEnv() {
  const env = {};
  const envPath = path.join(ROOT, '.env');
  if (!fs.existsSync(envPath)) return env;
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [key, ...rest] = line.split('=');
    if (key && rest.length) env[key.trim()] = rest.join('=').trim();
  });
  return env;
}

const ENV = loadEnv();
const STRIPE_KEY     = ENV.STRIPE_SECRET_KEY;
const TELEGRAM_TOKEN = ENV.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT  = ENV.TELEGRAM_CHAT_ID;

// ─── State: מה ראינו כבר ────────────────────────────────────────────────────
function loadLastSeen() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    }
  } catch {}
  return { lastChargeId: null, lastChecked: null };
}

function saveLastSeen(state) {
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// ─── Stripe: שלוף עסקאות מהשעה האחרונה ─────────────────────────────────────
async function fetchRecentCharges() {
  if (!STRIPE_KEY) throw new Error('STRIPE_SECRET_KEY חסר ב-.env');

  const since = Math.floor(Date.now() / 1000) - 3600; // שעה אחורה
  const url = `https://api.stripe.com/v1/charges?created[gte]=${since}&limit=10&expand[]=data.customer`;

  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${STRIPE_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Stripe API שגיאה: ${err.error?.message}`);
  }

  const data = await res.json();
  return data.data || [];
}

// ─── טלגרם ────────────────────────────────────────────────────────────────
async function sendTelegram(text) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT) return;
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT, text, parse_mode: 'Markdown' })
  });
}

function formatCharge(charge) {
  const amount   = (charge.amount / 100).toFixed(0);
  const currency = charge.currency.toUpperCase();
  const name     = charge.billing_details?.name || charge.customer?.name || 'לא ידוע';
  const email    = charge.billing_details?.email || charge.customer?.email || '';
  const status   = charge.status === 'succeeded' ? '✅ הצליח' : '❌ נכשל';
  const time     = new Date(charge.created * 1000).toLocaleTimeString('he-IL');

  return [
    `💰 *תשלום חדש!*`,
    ``,
    `👤 *לקוח:* ${name}`,
    email ? `📧 ${email}` : '',
    `💵 *סכום:* ${amount} ${currency}`,
    `🕐 *שעה:* ${time}`,
    `${status}`,
    ``,
    `_ID: \`${charge.id}\`_`
  ].filter(Boolean).join('\n');
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('💰 Stripe Alert בודק...');

  const state = loadLastSeen();
  let charges;

  try {
    charges = await fetchRecentCharges();
  } catch (e) {
    console.error('❌', e.message);
    await sendTelegram(`⚠️ *Stripe Alert נכשל*\n${e.message}`);
    process.exit(1);
  }

  // סנן רק עסקאות שלא ראינו
  const newCharges = state.lastChargeId
    ? charges.filter(c => c.id !== state.lastChargeId && c.created > (state.lastChecked || 0))
    : charges.filter(c => c.status === 'succeeded');

  console.log(`📊 סה"כ עסקאות בשעה האחרונה: ${charges.length}`);
  console.log(`🆕 עסקאות חדשות: ${newCharges.length}`);

  if (newCharges.length === 0) {
    console.log('✅ אין עסקאות חדשות.');
  } else {
    for (const charge of newCharges) {
      const msg = formatCharge(charge);
      console.log('\n' + msg.replace(/\*/g, '').replace(/`/g, ''));
      await sendTelegram(msg);
    }
  }

  // שמור סטייט
  saveLastSeen({
    lastChargeId: charges[0]?.id || state.lastChargeId,
    lastChecked: Math.floor(Date.now() / 1000)
  });

  console.log('✅ Stripe Alert סיים.');
}

main().catch(err => {
  console.error('❌ Stripe Alert נכשל:', err);
  process.exit(1);
});
