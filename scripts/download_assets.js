import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ASSETS_DIR = path.join(__dirname, '../public/assets');
const CATEGORY_DIR = path.join(ASSETS_DIR, 'categories');

// Ensure directories exist
if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true });
if (!fs.existsSync(CATEGORY_DIR)) fs.mkdirSync(CATEGORY_DIR, { recursive: true });

// Map of category names to Unsplash Image IDs (Placeholder high quality images)
const CATEGORIES = {
    'cleaning': 'https://images.unsplash.com/photo-1581578731117-104f2a417954?w=400&q=80',
    'plumbing': 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400&q=80',
    'electrician': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80',
    'gardening': 'https://images.unsplash.com/photo-1558904541-efa843a96f01?w=400&q=80',
    'moving': 'https://images.unsplash.com/photo-1600518464441-9154a4dea21b?w=400&q=80',
    'pest_control': 'https://images.unsplash.com/photo-1587573273820-24430f87893a?w=400&q=80',
    'painting': 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&q=80',
    'ac_repair': 'https://images.unsplash.com/photo-1563456000-84cb262a67bc?w=400&q=80',
    'locksmith': 'https://images.unsplash.com/photo-1563297775-81201d41c880?w=400&q=80',
    'handyman': 'https://images.unsplash.com/photo-1540339832862-437f8fa5cc40?w=400&q=80'
};

const downloadImage = (url, filename) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filename);
        https.get(url, (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                // Handle redirect
                downloadImage(response.headers.location, filename).then(resolve).catch(reject);
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                console.log(`✅ Downloaded: ${path.basename(filename)}`);
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(filename, () => { }); // Delete the file async. (But we don't check the result) - fixed for simplicity
            console.error(`❌ Failed: ${path.basename(filename)}`, err.message);
            reject(err);
        });
    });
};

console.log("🚀 Starting Asset Restoration...");

const downloads = Object.entries(CATEGORIES).map(([key, url]) => {
    const dest = path.join(CATEGORY_DIR, `${key}.jpg`);
    return downloadImage(url, dest);
});

Promise.allSettled(downloads).then(() => {
    console.log("✨ All downloads completed.");
});
