import fs from 'fs';
import path from 'path';

const ROOT_DIR = path.resolve('.');
const SRC_DIR = path.join(ROOT_DIR, 'src');

const TODO_PATTERN = /\/\/\s*TODO:?(.*)/g;
const FIXME_PATTERN = /\/\/\s*FIXME:?(.*)/g;
const COMING_SOON_PATTERN = /["']Coming Soon["']/i;

const IGNORE_DIRS = ['node_modules', '.git', 'dist', 'build', '.gemini'];

let findings = {
    todos: [],
    fixmes: [],
    emptyFiles: [],
    comingSoon: [],
    totalFilesScanned: 0
};

function scanDirectory(directory) {
    const files = fs.readdirSync(directory);

    for (const file of files) {
        const fullPath = path.join(directory, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (!IGNORE_DIRS.includes(file)) {
                scanDirectory(fullPath);
            }
        } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx')) {
            scanFile(fullPath);
        }
    }
}

function scanFile(filePath) {
    findings.totalFilesScanned++;
    const content = fs.readFileSync(filePath, 'utf-8');
    const relativePath = path.relative(ROOT_DIR, filePath);

    // Check for empty files
    if (content.trim().length === 0) {
        findings.emptyFiles.push(relativePath);
        return;
    }

    // Check lines
    const lines = content.split('\n');
    lines.forEach((line, index) => {
        let match;

        // TODOs
        while ((match = TODO_PATTERN.exec(line)) !== null) {
            findings.todos.push({
                file: relativePath,
                line: index + 1,
                text: match[1].trim()
            });
        }
        // Reset regex
        TODO_PATTERN.lastIndex = 0;

        // FIXMEs
        while ((match = FIXME_PATTERN.exec(line)) !== null) {
            findings.fixmes.push({
                file: relativePath,
                line: index + 1,
                text: match[1].trim()
            });
        }
        FIXME_PATTERN.lastIndex = 0;

        // Coming Soon
        if (COMING_SOON_PATTERN.test(line)) {
            findings.comingSoon.push({
                file: relativePath,
                line: index + 1,
                content: line.trim()
            });
        }
    });
}

function generateReport() {
    console.log('\n🔍 --- JANITOR AGENT REPORT --- 🔍\n');
    console.log(`Files Scanned: ${findings.totalFilesScanned}`);

    if (findings.emptyFiles.length > 0) {
        console.log(`\n⚠️  EMPTY FILES (${findings.emptyFiles.length}):`);
        findings.emptyFiles.forEach(f => console.log(`  - ${f}`));
    }

    if (findings.fixmes.length > 0) {
        console.log(`\n🔥 CRITICAL FIXES (${findings.fixmes.length}):`);
        findings.fixmes.forEach(f => console.log(`  - [${f.file}:${f.line}] ${f.text}`));
    }

    if (findings.todos.length > 0) {
        console.log(`\n📝 TODO ITEMS (${findings.todos.length}):`);
        // Limit output if too many
        const limit = 15;
        findings.todos.slice(0, limit).forEach(t => console.log(`  - [${t.file}:${t.line}] ${t.text}`));
        if (findings.todos.length > limit) {
            console.log(`  ... and ${findings.todos.length - limit} more.`);
        }
    }

    if (findings.comingSoon.length > 0) {
        console.log(`\n🚧 "COMING SOON" PLACEHOLDERS (${findings.comingSoon.length}):`);
        findings.comingSoon.forEach(c => console.log(`  - [${c.file}:${c.line}]`));
    }

    console.log('\n-----------------------------------\n');
}

// Start Scan
console.log(`Starting Janitor Scan in: ${SRC_DIR}`);
scanDirectory(SRC_DIR);
generateReport();
