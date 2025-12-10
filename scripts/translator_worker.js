
/**
 * TRANSLATOR WORKER
 * =================
 * Role: Localization Enforcer.
 * Agent: translator-agent
 * 
 * Logic:
 * 1. Scans `src/pages` and `src/components`.
 * 2. Identifies hardcoded text strings (simple heuristic: text inside JSX tags).
 * 3. Generates a `translation_audit.json` report of what needs fixing.
 * 4. (Phase 2) Will auto-generate translation files (en.json, he.json, etc.).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_DIR = path.join(__dirname, '../src');
const REPORT_PATH = path.join(__dirname, '../translation_audit.json');

const EXCLUDE_DIRS = ['knowledge', 'assets', 'api', 'services']; // Focus on UI only

function scanDirectory(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            if (!EXCLUDE_DIRS.includes(file)) {
                scanDirectory(filePath, fileList);
            }
        } else {
            if (file.endsWith('.jsx') || file.endsWith('.js')) {
                fileList.push(filePath);
            }
        }
    });
    return fileList;
}

function extractText(content) {
    // Very basic heuristic to find text between tags: >Some Text<
    // This is not perfect but good for an audit.
    const regex = />([^<>{}\n]+)</g;
    const matches = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
        const text = match[1].trim();
        if (text && text.length > 1) { // Ignore single chars
            matches.push(text);
        }
    }
    return matches;
}

async function runAudit() {
    console.log("🌍 TRANSLATOR AGENT: Scanning for hardcoded text...");

    const files = scanDirectory(SRC_DIR);
    const audit = {};

    files.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');
        const textNodes = extractText(content);
        if (textNodes.length > 0) {
            const relPath = path.relative(SRC_DIR, file);
            audit[relPath] = textNodes;
        }
    });

    const totalFiles = Object.keys(audit).length;
    let totalStrings = 0;
    Object.values(audit).forEach(list => totalStrings += list.length);

    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            files_scanned: files.length,
            files_with_text: totalFiles,
            total_hardcoded_strings: totalStrings
        },
        details: audit
    };

    fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));

    console.log(`✅ Scan Complete. Found ${totalStrings} strings in ${totalFiles} files.`);
    console.log(`📂 Report saved to: ${REPORT_PATH}`);
}

runAudit();
