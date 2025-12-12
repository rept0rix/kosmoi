import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.join(__dirname, '../public');
const ICONS = [
    { name: 'favicon.ico', url: 'https://via.placeholder.com/32' },
    { name: 'logo.png', url: 'https://via.placeholder.com/150' },
];

console.log("📦 Starting Asset Download...");

if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

const downloadFile = (url, dest) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                console.log(`✅ Downloaded: ${path.basename(dest)}`);
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => { }); // Delete the file async. (But we don't check the result)
            console.error(`❌ Error downloading ${path.basename(dest)}:`, err.message);
            reject(err);
        });
    });
};

const main = async () => {
    for (const icon of ICONS) {
        const dest = path.join(PUBLIC_DIR, icon.name);
        if (!fs.existsSync(dest)) {
            await downloadFile(icon.url, dest);
        } else {
            console.log(`⏭️  Skipped (Exists): ${icon.name}`);
        }
    }
    console.log("✨ Asset Check Complete.");
};

main();
