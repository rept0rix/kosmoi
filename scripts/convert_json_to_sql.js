
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HARVEST_FILE = path.join(__dirname, '../downloads/samui_map/harvested_data.json');
const OUTPUT_FILE = path.join(__dirname, '../downloads/samui_map/harvest_insert.sql');

function escapeSql(str) {
    if (!str) return 'NULL';
    // Escape single quotes by doubling them
    return "'" + str.replace(/'/g, "''") + "'";
}

function guessCategory(url) {
    if (url.includes('restaurant')) return 'restaurants';
    if (url.includes('hotel') || url.includes('resort')) return 'accommodation';
    if (url.includes('villa')) return 'villas';
    return 'other';
}

function convertToSql() {
    if (!fs.existsSync(HARVEST_FILE)) {
        console.error('File not found:', HARVEST_FILE);
        return;
    }

    const data = JSON.parse(fs.readFileSync(HARVEST_FILE, 'utf-8'));
    let sql = `INSERT INTO service_providers (business_name, description, location, category, source_url, status, verified, imported_at, images)\nVALUES\n`;

    const values = data.map(item => {
        let name = item.title;
        if (!name && item.url) {
            // Extract from URL: .../nathon-beach/ -> "Nathon Beach"
            const parts = item.url.split('/').filter(p => p.length > 0);
            const slug = parts[parts.length - 1];
            name = slug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
        }

        const business_name = escapeSql(name || 'Unknown Business');
        const description = escapeSql(item.description || item.content_snippet);
        const location = escapeSql('Koh Samui');
        const category = escapeSql(guessCategory(item.url));
        const source_url = escapeSql(item.url);
        const status = escapeSql('active');
        const verified = 'FALSE';
        const imported_at = "NOW()";

        let imagesSql = "'{}'";
        if (item.images && item.images.length > 0) {
            // Postgres array format: '{"item1", "item2"}'
            // We need to double-quote each item and escape double quotes inside it if any (though filenames shouldn't have them usually)
            const content = item.images.map(img => `"${img.replace(/"/g, '\\"')}"`).join(',');
            imagesSql = `'{${content}}'`;
        }

        return `(${business_name}, ${description}, ${location}, ${category}, ${source_url}, ${status}, ${verified}, ${imported_at}, ${imagesSql})`;
    });

    sql += values.join(',\n');
    sql += `\nON CONFLICT (source_url) DO UPDATE SET
    business_name = EXCLUDED.business_name,
    description = EXCLUDED.description,
    images = EXCLUDED.images,
    imported_at = NOW();`;

    fs.writeFileSync(OUTPUT_FILE, sql);
    console.log(`✅ SQL generated at: ${OUTPUT_FILE}`);
}

convertToSql();
