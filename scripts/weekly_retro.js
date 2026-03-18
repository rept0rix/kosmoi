#!/usr/bin/env node
/**
 * 📊 Weekly Retro
 * ─────────────────────────────────────────
 * רץ כל שישי ב-18:00
 * מסכם את השבוע: commits, משימות שנסגרו, מה תקוע
 * שולח סיכום לטלגרם
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

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
const TELEGRAM_TOKEN = ENV.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT  = ENV.TELEGRAM_CHAT_ID;

// ─── Git: commits השבוע ──────────────────────────────────────────────────────
function getWeekCommits() {
  try {
    const raw = execSync(
      'git log --since="7 days ago" --oneline --no-merges',
      { cwd: ROOT, encoding: 'utf8' }
    ).trim();
    if (!raw) return [];
    return raw.split('\n').map(line => {
      const [hash, ...msg] = line.split(' ');
      return { hash: hash.substring(0, 7), msg: msg.join(' ') };
    });
  } catch { return []; }
}

// ─── TASKS.md: סטטיסטיקות ──────────────────────────────────────────────────
function getTaskStats() {
  const tasksPath = path.join(ROOT, 'TASKS.md');
  if (!fs.existsSync(tasksPath)) return { open: 0, done: 0, highPriority: 0, stuckTasks: [] };

  const content = fs.readFileSync(tasksPath, 'utf8');
  const lines = content.split('\n');

  let open = 0, done = 0, highPriority = 0;
  let inHighSection = false;
  const stuckTasks = [];

  lines.forEach(line => {
    if (line.includes('עדיפות גבוהה') || line.includes('High Priority')) inHighSection = true;
    else if (line.includes('עדיפות בינונית') || line.includes('Medium Priority')) inHighSection = false;

    if (line.match(/^- \[ \]/)) {
      open++;
      if (inHighSection) {
        highPriority++;
        const task = line.replace('- [ ]', '').replace(/\*\*/g, '').trim().split(':')[0];
        stuckTasks.push(task);
      }
    }
    if (line.match(/^- \[x\]/i)) done++;
  });

  return { open, done, highPriority, stuckTasks };
}

// ─── Planner: כמה ימים היו לנו בריפינג השבוע ──────────────────────────────
function getPlannerDays() {
  const plannerDir = path.join(ROOT, 'planner', '2026');
  if (!fs.existsSync(plannerDir)) return 0;

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return fs.readdirSync(plannerDir).filter(f => {
    const stat = fs.statSync(path.join(plannerDir, f));
    return stat.mtimeMs > weekAgo && f.endsWith('.md');
  }).length;
}

// ─── כתוב קובץ retro ──────────────────────────────────────────────────────
function writeRetroFile(commits, tasks, plannerDays) {
  const date = new Date().toISOString().split('T')[0];
  const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString().split('T')[0];
  const retroPath = path.join(ROOT, 'planner', '2026', `${date}-retro.md`);

  const topCommits = commits.slice(0, 8);
  const velocity = commits.length >= 10 ? '🔥 גבוה' :
                   commits.length >= 5  ? '✅ בינוני' :
                   commits.length >= 2  ? '🐢 נמוך' : '😴 כמעט כלום';

  const lines = [
    `# 📊 Weekly Retro — ${weekStart} עד ${date}`,
    '',
    '## 📈 מדדי השבוע',
    `| מדד | ערך |`,
    `|-----|-----|`,
    `| Commits | ${commits.length} |`,
    `| Velocity | ${velocity} |`,
    `| ימי בריפינג | ${plannerDays}/7 |`,
    `| משימות פתוחות | ${tasks.open} |`,
    `| הושלמו (ב-TASKS.md) | ${tasks.done} |`,
    `| דחופות שתקועות | ${tasks.highPriority} |`,
    '',
    '## 📦 Commits השבוע',
    topCommits.length === 0
      ? '_לא היו commits השבוע_'
      : topCommits.map(c => `- \`${c.hash}\` ${c.msg}`).join('\n'),
    '',
    '## 🔴 מה תקוע (עדיפות גבוהה)',
    tasks.stuckTasks.length === 0
      ? '_אין! כל הדחוף טופל_ 🎉'
      : tasks.stuckTasks.map(t => `- [ ] ${t}`).join('\n'),
    '',
    '## 🎯 מוקד לשבוע הבא',
    tasks.stuckTasks.slice(0, 3).map((t, i) => `${i + 1}. ${t}`).join('\n'),
    '',
    '---',
    `_נוצר ע"י Weekly Retro ב-${new Date().toLocaleString('he-IL')}_`
  ];

  fs.mkdirSync(path.dirname(retroPath), { recursive: true });
  fs.writeFileSync(retroPath, lines.join('\n'), 'utf8');
  return retroPath;
}

// ─── טלגרם ────────────────────────────────────────────────────────────────
async function sendTelegram(commits, tasks, plannerDays) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT) return;

  const velocity = commits.length >= 10 ? '🔥 גבוה' :
                   commits.length >= 5  ? '✅ בינוני' :
                   commits.length >= 2  ? '🐢 נמוך' : '😴 כמעט כלום';

  const lines = [
    `📊 *Weekly Retro — סיכום שבועי*`,
    ``,
    `📦 Commits: *${commits.length}* | Velocity: ${velocity}`,
    `📅 ימי בריפינג: *${plannerDays}/7*`,
    `📋 משימות פתוחות: *${tasks.open}* | הושלמו: *${tasks.done}*`,
    ``,
  ];

  if (tasks.highPriority > 0) {
    lines.push(`🔴 *עדיין תקוע (דחוף):*`);
    tasks.stuckTasks.slice(0, 3).forEach(t => lines.push(`  • ${t}`));
  } else {
    lines.push(`✅ _כל המשימות הדחופות טופלו!_`);
  }

  if (commits.length > 0) {
    lines.push(``, `*3 commits אחרונים:*`);
    commits.slice(0, 3).forEach(c => lines.push(`  • \`${c.hash}\` ${c.msg}`));
  }

  lines.push(``, `_שבוע טוב! 🙌_`);

  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT,
      text: lines.join('\n'),
      parse_mode: 'Markdown'
    })
  });

  console.log('✅ Telegram נשלח');
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('📊 Weekly Retro מתחיל...');

  const commits    = getWeekCommits();
  const tasks      = getTaskStats();
  const plannerDays = getPlannerDays();

  console.log(`📦 Commits השבוע: ${commits.length}`);
  console.log(`📋 משימות פתוחות: ${tasks.open} | הושלמו: ${tasks.done}`);
  console.log(`🔴 דחופות תקועות: ${tasks.highPriority}`);

  const retroPath = writeRetroFile(commits, tasks, plannerDays);
  console.log(`✅ Retro נכתב: ${retroPath}`);

  await sendTelegram(commits, tasks, plannerDays);
  console.log('✅ Weekly Retro סיים.');
}

main().catch(err => {
  console.error('❌ Weekly Retro נכשל:', err);
  process.exit(1);
});
