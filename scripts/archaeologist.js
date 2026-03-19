#!/usr/bin/env node
/**
 * 🔍 The Archaeologist
 * ─────────────────────────────────────────
 * רץ כל ראשון
 * סורק את scripts/ ומזהה קבצים ישנים / debug / לא בשימוש
 * כותב CLEANUP_REPORT.md ושולח סיכום לטלגרם
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

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
const TELEGRAM_TOKEN = ENV.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT  = ENV.TELEGRAM_CHAT_ID;

// ─── קבועים ──────────────────────────────────────────────────────────────────
const STALE_DAYS = 30;
const SCRIPTS_DIR = path.join(ROOT, 'scripts');

const DEBUG_PATTERNS = [
  /^debug_/i, /^test_/i, /^check_/i, /^verify_/i,
  /^diagnose_/i, /^temp_/i, /^tmp_/i, /^old_/i,
  /^analyze_/i, /^capture_/i, /^bootstrap_/i,
  /_test\.(js|ts)$/i, /\.bak$/i
];

const SAFE_FILES = new Set([
  'morning_sentinel.js',
  'stripe_alert.js',
  'archaeologist.js',
  'weekly_retro.js',
  'bridge_daily_tasks.js',
  'agent_worker.js',
  'agent_worker_v2.js',
  'WorkflowTools.js',
  'VerifyConnection.js',
  'content_curator.js'
]);

// ─── בדוק מתי נגעו בקובץ לאחרונה ───────────────────────────────────────────
function daysSinceModified(filePath) {
  try {
    const stat = fs.statSync(filePath);
    const ms = Date.now() - stat.mtimeMs;
    return Math.floor(ms / (1000 * 60 * 60 * 24));
  } catch {
    return 999;
  }
}

// ─── בנה אינדקס של כל ה-imports פעם אחת ────────────────────────────────────
let _importIndex = null;
function buildImportIndex() {
  if (_importIndex) return _importIndex;
  try {
    const result = execSync(
      `grep -r "require\\|import" ${ROOT}/src ${ROOT}/scripts --include="*.js" --include="*.ts" -h 2>/dev/null || true`,
      { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
    );
    _importIndex = result;
  } catch { _importIndex = ''; }
  return _importIndex;
}

function isReferencedInCode(filename) {
  const basename = path.basename(filename, path.extname(filename));
  const index = buildImportIndex();
  return index.includes(basename);
}

// ─── סרוק קבצים ─────────────────────────────────────────────────────────────
function scanFiles() {
  const results = {
    staleDebug: [],    // ישנים + שם debug-י
    staleOnly: [],     // ישנים בלבד
    debugOnly: [],     // שם debug-י אבל לא ישן
    total: 0
  };

  if (!fs.existsSync(SCRIPTS_DIR)) return results;

  const files = fs.readdirSync(SCRIPTS_DIR).filter(f =>
    f.endsWith('.js') || f.endsWith('.ts') || f.endsWith('.mjs')
  );

  results.total = files.length;

  for (const file of files) {
    if (SAFE_FILES.has(file)) continue;

    const filePath = path.join(SCRIPTS_DIR, file);
    const days = daysSinceModified(filePath);
    const isDebugName = DEBUG_PATTERNS.some(p => p.test(file));
    const isStale = days >= STALE_DAYS;
    const isReferenced = isReferencedInCode(file);

    const entry = { file, days, isReferenced };

    if (isStale && isDebugName && !isReferenced) {
      results.staleDebug.push(entry);
    } else if (isStale && !isReferenced) {
      results.staleOnly.push(entry);
    } else if (isDebugName && !isReferenced) {
      results.debugOnly.push(entry);
    }
  }

  return results;
}

// ─── כתוב דוח ────────────────────────────────────────────────────────────────
function writeReport(results) {
  const date = new Date().toISOString().split('T')[0];
  const reportPath = path.join(ROOT, 'CLEANUP_REPORT.md');

  const safeToDelete = results.staleDebug.length;
  const reviewNeeded = results.staleOnly.length + results.debugOnly.length;

  const lines = [
    `# 🔍 Cleanup Report — ${date}`,
    `> נוצר ע"י הארכיאולוג | סה"כ קבצים נסרקו: ${results.total}`,
    '',
    `## 🗑️ בטוח למחיקה (${safeToDelete} קבצים)`,
    '_ישנים 30+ יום + שם debug-י + לא מוזכרים בקוד_',
    '',
    results.staleDebug.length === 0
      ? '_אין קבצים לאחר הסרה_ 🎉'
      : results.staleDebug.map(f =>
          `- [ ] \`scripts/${f.file}\` — לא נגעת ${f.days} ימים`
        ).join('\n'),
    '',
    `## ⚠️ כדאי לבדוק (${reviewNeeded} קבצים)`,
    '',
    results.staleOnly.length > 0 ? '### ישנים אבל שם רגיל:' : '',
    ...results.staleOnly.map(f =>
      `- \`scripts/${f.file}\` — ${f.days} ימים ללא שינוי`
    ),
    '',
    results.debugOnly.length > 0 ? '### שם debug-י אבל חדש יחסית:' : '',
    ...results.debugOnly.map(f =>
      `- \`scripts/${f.file}\` — ${f.days} ימים (שם נראה זמני)`
    ),
    '',
    '---',
    `_הארכיאולוג רץ ב-${new Date().toLocaleString('he-IL')}_`
  ].filter(l => l !== null);

  fs.writeFileSync(reportPath, lines.join('\n'), 'utf8');
  return reportPath;
}

// ─── טלגרם ────────────────────────────────────────────────────────────────
async function sendTelegram(results) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT) return;

  const safeToDelete = results.staleDebug.length;
  const reviewNeeded = results.staleOnly.length + results.debugOnly.length;

  const lines = [
    `🔍 *הארכיאולוג — דוח שבועי*`,
    ``,
    `📂 סה"כ קבצים ב-scripts/: *${results.total}*`,
    `🗑️ בטוח למחיקה: *${safeToDelete}*`,
    `⚠️ כדאי לבדוק: *${reviewNeeded}*`,
  ];

  if (safeToDelete > 0) {
    lines.push('', '*מומלץ למחוק:*');
    results.staleDebug.slice(0, 5).forEach(f =>
      lines.push(`  • \`${f.file}\` (${f.days}d)`)
    );
    if (safeToDelete > 5) lines.push(`  _...ועוד ${safeToDelete - 5}_`);
  } else {
    lines.push('', '✅ _הפרויקט נקי!_');
  }

  lines.push('', '_פרטים ב-\`CLEANUP_REPORT.md\`_');

  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT,
      text: lines.join('\n'),
      parse_mode: 'Markdown'
    })
  });
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🔍 הארכיאולוג מתחיל לחפור...');

  const results = scanFiles();

  console.log(`📂 קבצים נסרקו: ${results.total}`);
  console.log(`🗑️  בטוח למחיקה: ${results.staleDebug.length}`);
  console.log(`⚠️  כדאי לבדוק: ${results.staleOnly.length + results.debugOnly.length}`);

  const reportPath = writeReport(results);
  console.log(`✅ דוח נכתב: ${reportPath}`);

  await sendTelegram(results);
  console.log('✅ הארכיאולוג סיים.');
}

main().catch(err => {
  console.error('❌ הארכיאולוג נכשל:', err);
  process.exit(1);
});
