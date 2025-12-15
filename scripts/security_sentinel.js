import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

function getAllSqlFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (file === 'node_modules' || file === '.git' || file === '.gemini') continue;
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            getAllSqlFiles(filePath, fileList);
        } else if (file.endsWith('.sql')) {
            fileList.push(filePath);
        }
    }
    return fileList;
}

function scanSecurity() {
    console.log('🛡️  SECURITY SENTINEL: Starting Deep Scan...\n');

    const sqlFiles = getAllSqlFiles(ROOT_DIR);
    console.log(`📂 Found ${sqlFiles.length} SQL definition files.`);

    const tables = new Set();
    const securedTables = new Set();
    const tableSources = {}; // map table -> file it was defined in

    // Regex
    // Matches: create table [if not exists] [public.]table_name
    const tableRegex = /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?([a-z0-9_]+)/gi;

    // Matches: alter table [only] [public.]table_name enable row level security
    const rlsRegex = /alter\s+table\s+(?:only\s+)?(?:public\.)?([a-z0-9_]+)\s+enable\s+row\s+level\s+security/gi;

    for (const file of sqlFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        let match;

        // Find Tables
        while ((match = tableRegex.exec(content)) !== null) {
            const tableName = match[1];
            tables.add(tableName);
            if (!tableSources[tableName]) tableSources[tableName] = [];
            tableSources[tableName].push(path.relative(ROOT_DIR, file));
        }

        // Find RLS
        while ((match = rlsRegex.exec(content)) !== null) {
            securedTables.add(match[1]);
        }
    }

    // Report
    const unsecured = [];
    tables.forEach(table => {
        if (!securedTables.has(table)) {
            unsecured.push(table);
        }
    });

    console.log(`📊 Discovered ${tables.size} unique tables across project.`);

    if (unsecured.length === 0) {
        console.log('\n✅ SYSTEM SECURE: All tables have RLS enabled.');
    } else {
        console.log(`\n⚠️  SECURITY RISK: Found ${unsecured.length} tables WITHOUT explicit RLS in SQL files:`);
        unsecured.forEach(t => {
            const sources = tableSources[t] ? `(defined in ${tableSources[t][0]})` : '';
            console.log(`  - ${t} ${sources} ❌`);
        });
        console.log('\nNOTE: If these tables were secured in the dashboard/migrations but not in code, you are safe but out of sync.');
    }
}

scanSecurity();
