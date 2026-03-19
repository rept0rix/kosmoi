#!/usr/bin/env node
/**
 * 📧 Auto-Outreach Agent
 * ─────────────────────────────────────────
 * רץ כל יום ב-10:00
 * מוצא עסקים ב-Supabase שלא תבעו פרופיל
 * יוצר invitation + מוסיף agent_task לwWorker לשלוח מייל
 * מגביל ל-10 עסקים ביום כדי לא להציף
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
const TELEGRAM_TOKEN = ENV.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT  = ENV.TELEGRAM_CHAT_ID;
const APP_URL        = ENV.VITE_APP_URL || 'https://kosmoi.app';

const DAILY_LIMIT = 10;

// ─── טלגרם ────────────────────────────────────────────────────────────────
async function sendTelegram(text) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT) return;
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT, text, parse_mode: 'Markdown' })
  });
}

// ─── צור token פשוט ───────────────────────────────────────────────────────
function generateToken() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 32 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}

// ─── שלב 1: מצא עסקים לא תבועים ─────────────────────────────────────────
async function findUnclaimedBusinesses() {
  // עסקים ללא בעלים וללא invitation פעיל
  const { data: alreadyInvited } = await supabase
    .from('invitations')
    .select('service_provider_id')
    .in('status', ['pending', 'sent', 'accepted']);

  const invitedIds = (alreadyInvited || []).map(i => i.service_provider_id);

  let query = supabase
    .from('service_providers')
    .select('id, business_name, category, phone, email, claimed')
    .is('user_id', null)          // אין בעלים רשום
    .neq('claimed', true)         // לא claimed
    .eq('status', 'active')       // פעיל
    .limit(DAILY_LIMIT + 20);     // קח יותר כדי שיהיה ממה לסנן

  const { data: providers, error } = await query;
  if (error) throw new Error(`Supabase שגיאה: ${error.message}`);

  // סנן את אלה שכבר הוזמנו
  const fresh = (providers || [])
    .filter(p => !invitedIds.includes(p.id))
    .slice(0, DAILY_LIMIT);

  return fresh;
}

// ─── שלב 2: צור invitation + agent_task לכל עסק ─────────────────────────
async function inviteBusiness(provider) {
  const token = generateToken();
  const claimUrl = `${APP_URL}/claim?token=${token}`;
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 ימים

  // 1. שמור invitation בDB
  const { error: invErr } = await supabase.from('invitations').insert({
    service_provider_id: provider.id,
    token,
    status: 'pending',
    metadata: { source: 'auto_outreach', sent_at: new Date().toISOString() },
    expires_at: expiresAt
  });

  if (invErr) {
    console.warn(`⚠️  invitation נכשל עבור ${provider.business_name}: ${invErr.message}`);
    return false;
  }

  // 2. צור agent_task לworker לשלוח מייל
  const emailTarget = provider.email || ENV.VITE_ADMIN_EMAIL; // fallback למייל שלך אם אין מייל לעסק
  const isTestMode = !provider.email;

  const taskDesc = [
    `Send a professional invitation email to claim a business profile on Kosmoi.`,
    ``,
    `Business: "${provider.business_name}"`,
    `Category: ${provider.category || 'General'}`,
    ``,
    `Use the 'send_email' tool with these details:`,
    `- TO: ${emailTarget}${isTestMode ? ' (TEST MODE - no real email found)' : ''}`,
    `- SUBJECT: "🌴 ${provider.business_name} — תבעו את הפרופיל שלכם ב-Kosmoi"`,
    `- BODY: A warm, professional email in Hebrew inviting them to claim their profile.`,
    `  Include the claim link: ${claimUrl}`,
    `  Mention it's free to start, takes 2 minutes.`,
    `  Mention the link expires in 7 days.`,
    ``,
    `After sending, reply with TASK_COMPLETED and the message ID.`,
    `Interaction Type: 'email_outreach'`,
    `Lead ID: '${provider.id}'`
  ].join('\n');

  const { error: taskErr } = await supabase.from('agent_tasks').insert({
    title: `Auto-Outreach: ${provider.business_name}`,
    description: taskDesc,
    assigned_to: 'sales-pitch',
    status: 'pending',
    priority: 'medium'
  });

  if (taskErr) {
    console.warn(`⚠️  agent_task נכשל: ${taskErr.message}`);
    return false;
  }

  console.log(`  ✅ ${provider.business_name} — invitation + task נוצרו${isTestMode ? ' [TEST MODE]' : ''}`);
  return true;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('📧 Auto-Outreach Agent מתחיל...');

  let businesses;
  try {
    businesses = await findUnclaimedBusinesses();
  } catch (e) {
    console.error('❌', e.message);
    await sendTelegram(`⚠️ *Auto-Outreach נכשל*\n${e.message}`);
    process.exit(1);
  }

  console.log(`🏢 עסקים לא תבועים שנמצאו: ${businesses.length}`);

  if (businesses.length === 0) {
    console.log('✅ אין עסקים חדשים לפנות אליהם היום.');
    return;
  }

  let sent = 0;
  for (const biz of businesses) {
    const ok = await inviteBusiness(biz);
    if (ok) sent++;
  }

  console.log(`\n📊 סיכום: ${sent}/${businesses.length} הזמנות נשלחו`);

  // דוח לטלגרם
  const names = businesses.slice(0, 5).map(b => `• ${b.business_name}`).join('\n');
  await sendTelegram([
    `📧 *Auto-Outreach — סיכום יומי*`,
    ``,
    `🏢 עסקים שנמצאו: *${businesses.length}*`,
    `✅ הזמנות נוצרו: *${sent}*`,
    ``,
    `*דוגמאות:*`,
    names,
    businesses.length > 5 ? `_...ועוד ${businesses.length - 5}_` : '',
    ``,
    `_Worker ישלח את המיילים תוך דקות_`
  ].filter(Boolean).join('\n'));

  console.log('✅ Auto-Outreach Agent סיים.');
}

main().catch(err => {
  console.error('❌ Auto-Outreach נכשל:', err);
  process.exit(1);
});
