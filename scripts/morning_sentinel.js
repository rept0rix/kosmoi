#!/usr/bin/env node
/**
 * 🌅 Morning Sentinel
 * ─────────────────────────────────────────
 * רץ כל בוקר ב-08:00
 * קורא: git log + TASKS.md
 * כותב: planner/2026/YYYY-MM-DD.md
 * שולח: Telegram briefing
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// ─── Load ENV ───────────────────────────────────────────────────────────────
function loadEnv() {
  const envPath = path.join(ROOT, '.env');
  const env = {};
  if (!fs.existsSync(envPath)) return env;
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [key, ...rest] = line.split('=');
    if (key && rest.length) env[key.trim()] = rest.join('=').trim();
  });
  return env;
}

const ENV = loadEnv();
const TELEGRAM_TOKEN = ENV.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT  = ENV.TELEGRAM_CHAT_ID;

// ─── Helpers ────────────────────────────────────────────────────────────────
function today() {
  return new Date().toISOString().split('T')[0];
}

function hebrewDate() {
  return new Date().toLocaleDateString('he-IL', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

// ─── Git: מה השתנה ב-24 שעות ─────────────────────────────────────────────
function getRecentCommits() {
  try {
    const raw = execSync(
      'git log --since="24 hours ago" --oneline --no-merges',
      { cwd: ROOT, encoding: 'utf8' }
    ).trim();
    if (!raw) return [];
    return raw.split('\n').map(line => {
      const [hash, ...msg] = line.split(' ');
      return { hash: hash.substring(0, 7), msg: msg.join(' ') };
    });
  } catch {
    return [];
  }
}

// ─── TASKS.md: קרא משימות פתוחות ─────────────────────────────────────────
function getOpenTasks() {
  const tasksPath = path.join(ROOT, 'TASKS.md');
  if (!fs.existsSync(tasksPath)) return { high: [], medium: [], low: [], cleanup: [] };

  const content = fs.readFileSync(tasksPath, 'utf8');
  const open = { high: [], medium: [], low: [], cleanup: [] };

  let currentSection = null;

  content.split('\n').forEach(line => {
    if (line.includes('עדיפות גבוהה') || line.includes('High Priority')) currentSection = 'high';
    else if (line.includes('עדיפות בינונית') || line.includes('Medium Priority')) currentSection = 'medium';
    else if (line.includes('עדיפות נמוכה') || line.includes('R&D')) currentSection = 'low';
    else if (line.includes('ניקוי') || line.includes('Cleanup')) currentSection = 'cleanup';
    else if (line.includes('הושלם') || line.includes('Recently Done')) currentSection = null;

    if (currentSection && line.match(/^- \[ \]/)) {
      const task = line.replace('- [ ]', '').replace(/\*\*/g, '').trim();
      // חתוך אחרי `:` אם יש תיאור ארוך
      const short = task.split(':')[0].trim();
      open[currentSection].push(short);
    }
  });

  return open;
}

// ─── כתוב קובץ יומי ─────────────────────────────────────────────────────
function writeDailyPlanner(date, commits, tasks) {
  const dir = path.join(ROOT, 'planner', date.substring(0, 4));
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${date}.md`);

  const top3 = [
    ...tasks.high.slice(0, 2),
    ...tasks.medium.slice(0, 1)
  ].slice(0, 3);

  const lines = [
    `# 📅 ${date} — Daily Briefing`,
    `> ${hebrewDate()}`,
    '',
    '---',
    '',
    '## ⚡ עדיפויות היום (Top 3)',
    ...top3.map(t => `- [ ] ${t}`),
    '',
    '## 🔴 כל המשימות הדחופות',
    ...tasks.high.map(t => `- [ ] ${t}`),
    tasks.high.length === 0 ? '_אין משימות דחופות_ 🎉' : '',
    '',
    '## 🟡 בינוני',
    ...tasks.medium.map(t => `- [ ] ${t}`),
    '',
    '## 📦 ל-24 שעות האחרונות (git log)',
    commits.length === 0
      ? '_אין commits ב-24 שעות האחרונות_'
      : commits.map(c => `- \`${c.hash}\` ${c.msg}`).join('\n'),
    '',
    '---',
    `_נוצר אוטומטית ע"י Morning Sentinel ב-${new Date().toLocaleTimeString('he-IL')}_`
  ];

  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  return filePath;
}

// ─── שלח לטלגרם ────────────────────────────────────────────────────────────
async function sendTelegram(text) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT) {
    console.log('⚠️  Telegram לא מוגדר, מדלג...');
    return;
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  const body = JSON.stringify({
    chat_id: TELEGRAM_CHAT,
    text,
    parse_mode: 'Markdown'
  });

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    });
    const json = await res.json();
    if (json.ok) console.log('✅ Telegram נשלח');
    else console.warn('⚠️  Telegram שגיאה:', json.description);
  } catch (e) {
    console.warn('⚠️  Telegram נכשל:', e.message);
  }
}

function buildTelegramMessage(date, commits, tasks) {
  const top3 = [
    ...tasks.high.slice(0, 2),
    ...tasks.medium.slice(0, 1)
  ].slice(0, 3);

  const lines = [
    `🌅 *Morning Sentinel — ${date}*`,
    '',
    '⚡ *עדיפויות היום:*',
    ...top3.map((t, i) => `${i + 1}\\. ${t}`),
    '',
  ];

  if (tasks.high.length > top3.length) {
    lines.push(`🔴 עוד ${tasks.high.length - top3.length + tasks.medium.length} משימות פתוחות`);
  }

  if (commits.length > 0) {
    lines.push('', `📦 *Commits אתמול:* ${commits.length}`);
    commits.slice(0, 3).forEach(c => lines.push(`  • \`${c.hash}\` ${c.msg}`));
  } else {
    lines.push('', '💤 _אין commits מ-24 שעות האחרונות_');
  }

  lines.push('', `_פתח \`planner/2026/${date}.md\` לפרטים_`);
  return lines.join('\n');
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🌅 Morning Sentinel מתעורר...');

  const date    = today();
  const commits = getRecentCommits();
  const tasks   = getOpenTasks();

  console.log(`📅 תאריך: ${date}`);
  console.log(`📦 Commits ב-24 שעות: ${commits.length}`);
  console.log(`🔴 משימות דחופות: ${tasks.high.length}`);
  console.log(`🟡 משימות בינוניות: ${tasks.medium.length}`);

  const filePath = writeDailyPlanner(date, commits, tasks);
  console.log(`✅ Daily briefing נכתב: ${filePath}`);

  const telegramMsg = buildTelegramMessage(date, commits, tasks);
  await sendTelegram(telegramMsg);

  console.log('✅ Morning Sentinel סיים.');
}

main().catch(err => {
  console.error('❌ Morning Sentinel נכשל:', err);
  process.exit(1);
});
