#!/usr/bin/env node
/**
 * 🤖 Worker Health Monitor
 * ─────────────────────────────────────────
 * רץ כל 15 דקות
 * בודק שה-agent_worker חי ועובד
 * שולח התראה אם תקוע או מת
 */

import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// ─── ENV ─────────────────────────────────────────────────────────────────────
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
const supabase = createClient(
  ENV.VITE_SUPABASE_URL,
  ENV.VITE_SUPABASE_SERVICE_ROLE_KEY || ENV.VITE_SUPABASE_ANON_KEY
);

const TELEGRAM_TOKEN  = ENV.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT   = ENV.TELEGRAM_CHAT_ID;
const ALERT_STATE     = path.join(ROOT, '.agent', 'worker_alert_state.json');

// כמה זמן מקסימלי בלי heartbeat לפני שמתריעים (דקות)
const MAX_SILENCE_MINUTES = 30;
// כמה זמן מינימלי בין התראות חוזרות (דקות) — לא להציף
const MIN_BETWEEN_ALERTS_MINUTES = 60;

// ─── טלגרם ────────────────────────────────────────────────────────────────
async function sendTelegram(text) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT) return;
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT, text, parse_mode: 'Markdown' })
  });
}

// ─── מצב התראות — כדי לא לשלוח כל 15 דקות ──────────────────────────────
function loadAlertState() {
  try {
    if (fs.existsSync(ALERT_STATE))
      return JSON.parse(fs.readFileSync(ALERT_STATE, 'utf8'));
  } catch {}
  return { lastAlertAt: null, wasDown: false };
}

function saveAlertState(state) {
  fs.mkdirSync(path.dirname(ALERT_STATE), { recursive: true });
  fs.writeFileSync(ALERT_STATE, JSON.stringify(state, null, 2));
}

// ─── בדוק Worker Heartbeat ───────────────────────────────────────────────
async function checkHeartbeat() {
  const { data, error } = await supabase
    .from('company_knowledge')
    .select('value, updated_at')
    .eq('key', 'WORKER_STATUS')
    .single();

  if (error || !data) return { alive: false, reason: 'אין heartbeat בDB', lastSeen: null };

  const lastSeen = new Date(data.updated_at);
  const minutesSince = (Date.now() - lastSeen.getTime()) / 60000;

  if (minutesSince > MAX_SILENCE_MINUTES) {
    return {
      alive: false,
      reason: `אחרון heartbeat לפני ${Math.round(minutesSince)} דקות`,
      lastSeen,
      minutesSince
    };
  }

  return { alive: true, lastSeen, minutesSince: Math.round(minutesSince), status: data.value };
}

// ─── בדוק משימות תקועות ──────────────────────────────────────────────────
async function checkStuckTasks() {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { data: stuck } = await supabase
    .from('agent_tasks')
    .select('id, title, assigned_to, created_at')
    .eq('status', 'in_progress')
    .lt('created_at', oneHourAgo)
    .limit(5);

  return stuck || [];
}

// ─── בדוק כמה tasks pending מחכות ──────────────────────────────────────
async function checkPendingBacklog() {
  const { count } = await supabase
    .from('agent_tasks')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  return count || 0;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🤖 Worker Health Monitor בודק...');

  const alertState = loadAlertState();
  const now = Date.now();

  const [heartbeat, stuckTasks, pendingCount] = await Promise.all([
    checkHeartbeat(),
    checkStuckTasks(),
    checkPendingBacklog()
  ]);

  console.log(`💓 Worker חי: ${heartbeat.alive ? '✅' : '❌'}`);
  if (heartbeat.lastSeen)
    console.log(`   אחרון heartbeat: ${heartbeat.minutesSince} דקות`);
  console.log(`⏳ Pending tasks: ${pendingCount}`);
  console.log(`🔴 Stuck tasks: ${stuckTasks.length}`);

  // ─── Worker נפל ───────────────────────────────────────────────────────
  if (!heartbeat.alive) {
    const minutesSinceLastAlert = alertState.lastAlertAt
      ? (now - new Date(alertState.lastAlertAt).getTime()) / 60000
      : Infinity;

    if (minutesSinceLastAlert >= MIN_BETWEEN_ALERTS_MINUTES) {
      console.log('🚨 שולח התראת Worker Down...');
      await sendTelegram([
        `🚨 *Worker Down!*`,
        ``,
        `❌ ${heartbeat.reason}`,
        `⏳ Pending tasks: ${pendingCount}`,
        ``,
        `*פעולה נדרשת:* בדוק Railway או הפעל מחדש את ה-worker`,
        `\`npm run worker:universal\``,
      ].join('\n'));

      saveAlertState({ lastAlertAt: new Date().toISOString(), wasDown: true });
    } else {
      console.log(`  (התראה כבר נשלחה לפני ${Math.round(minutesSinceLastAlert)} דקות, מדלג)`);
    }
    return;
  }

  // ─── Worker חזר לאוויר ───────────────────────────────────────────────
  if (alertState.wasDown && heartbeat.alive) {
    console.log('🎉 Worker חזר לאוויר!');
    await sendTelegram([
      `✅ *Worker חזר לאוויר!*`,
      `💓 Heartbeat לפני ${heartbeat.minutesSince} דקות`,
      `⏳ Pending tasks: ${pendingCount}`,
    ].join('\n'));
    saveAlertState({ lastAlertAt: null, wasDown: false });
  }

  // ─── Tasks תקועות ─────────────────────────────────────────────────────
  if (stuckTasks.length >= 3) {
    const minutesSinceLastAlert = alertState.lastAlertAt
      ? (now - new Date(alertState.lastAlertAt).getTime()) / 60000
      : Infinity;

    if (minutesSinceLastAlert >= MIN_BETWEEN_ALERTS_MINUTES) {
      await sendTelegram([
        `⚠️ *${stuckTasks.length} Tasks תקועות מעל שעה*`,
        ``,
        ...stuckTasks.map(t => `• \`${t.assigned_to}\`: ${t.title}`),
        ``,
        `⏳ Pending backlog: ${pendingCount}`
      ].join('\n'));
      saveAlertState({ ...alertState, lastAlertAt: new Date().toISOString() });
    }
  }

  console.log('✅ Worker Health Monitor סיים — הכל תקין.');
}

main().catch(err => {
  console.error('❌ Worker Health Monitor נכשל:', err);
  process.exit(1);
});
