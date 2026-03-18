#!/usr/bin/env node
/**
 * ✅ Auto Task Updater
 * ─────────────────────────────────────────
 * רץ אחרי כל git push (או פעמיים ביום)
 * קורא commit messages מ-24 שעות אחרונות
 * מסמן משימות ב-TASKS.md אוטומטית לפי מילות מפתח
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const TASKS_PATH = path.join(ROOT, 'TASKS.md');

// ─── קרא commits ─────────────────────────────────────────────────────────────
function getRecentCommits(hours = 24) {
  try {
    return execSync(
      `git log --since="${hours} hours ago" --format="%s %b" --no-merges`,
      { cwd: ROOT, encoding: 'utf8' }
    ).trim().toLowerCase();
  } catch { return ''; }
}

// ─── מפת מילות מפתח → קטעים ב-TASKS.md ──────────────────────────────────────
const KEYWORD_MAP = [
  {
    keywords: ['ceo agent', 'ceo upgrade', 'ceo model', 'gemini-3-pro-preview'],
    taskPattern: /CEO Agent.*שדרג/
  },
  {
    keywords: ['cto agent', 'cto upgrade', 'cto model'],
    taskPattern: /CTO Agent.*שדרג/
  },
  {
    keywords: ['tech lead', 'tech-lead', 'gemini-3-flash-preview'],
    taskPattern: /Tech Lead.*שדרג/
  },
  {
    keywords: ['agents.md', 'update agents', 'agent model'],
    taskPattern: /עדכן AGENTS\.md/
  },
  {
    keywords: ['soft launch', 'claim profile', 'one dollar', 'operation one dollar'],
    taskPattern: /Soft Launch/
  },
  {
    keywords: ['security audit', 'rotate key', 'revoke key', 'google maps key', 'telegram key'],
    taskPattern: /Security Audit/
  },
  {
    keywords: ['harvest', 'enrichment', 'harvest_log'],
    taskPattern: /ניתוח תוצאות Harvest/
  },
  {
    keywords: ['email template', 'invite email', 'claim email'],
    taskPattern: /תבניות מייל/
  },
  {
    keywords: ['open rate', 'click rate', 'analytics'],
    taskPattern: /Open Rates/
  },
  {
    keywords: ['mobile', 'responsive', 'pricing mobile', 'dashboard mobile'],
    taskPattern: /Pricing.*Dashboard.*מובייל/
  },
];

// ─── עדכן TASKS.md ────────────────────────────────────────────────────────────
function updateTasks(commits) {
  if (!fs.existsSync(TASKS_PATH)) {
    console.log('⚠️  TASKS.md לא נמצא');
    return 0;
  }

  let content = fs.readFileSync(TASKS_PATH, 'utf8');
  let updatedCount = 0;
  const autoUpdated = [];

  for (const { keywords, taskPattern } of KEYWORD_MAP) {
    const matched = keywords.some(kw => commits.includes(kw));
    if (!matched) continue;

    // מצא שורה פתוחה שמתאימה לתבנית
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].match(/^- \[ \]/) && taskPattern.test(lines[i])) {
        lines[i] = lines[i].replace('- [ ]', '- [x]');
        content = lines.join('\n');
        updatedCount++;
        const taskName = lines[i].replace('- [x]', '').replace(/\*\*/g, '').trim().split(':')[0];
        autoUpdated.push(taskName);
        console.log(`  ✅ סומן: ${taskName}`);
        break;
      }
    }
  }

  if (updatedCount > 0) {
    // עדכן תאריך
    content = content.replace(
      /> \*\*עדכון אחרון:\*\* .*/,
      `> **עדכון אחרון:** ${new Date().toLocaleDateString('he-IL')} (auto-updated)`
    );
    fs.writeFileSync(TASKS_PATH, content, 'utf8');
  }

  return { count: updatedCount, tasks: autoUpdated };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('✅ Auto Task Updater רץ...');

  const commits = getRecentCommits(24);
  if (!commits) {
    console.log('📭 אין commits ב-24 שעות האחרונות.');
    return;
  }

  console.log(`📦 בודק ${commits.split('\n').length} commits...`);
  const { count, tasks } = updateTasks(commits);

  if (count === 0) {
    console.log('🔍 לא נמצאו משימות להסמן אוטומטית.');
  } else {
    console.log(`\n🎉 ${count} משימות עודכנו ב-TASKS.md`);
  }

  console.log('✅ Auto Task Updater סיים.');
}

main().catch(err => {
  console.error('❌ Auto Task Updater נכשל:', err);
  process.exit(1);
});
