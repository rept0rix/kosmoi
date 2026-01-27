import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const url = "https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/Chad_Crouch/Arps/Chad_Crouch_-_Elipsis.mp3"; // Placeholder for 'Upbeat/Lounge' vibe
const dest = path.join(__dirname, '../video-engine/public/assets/music.mp3');

console.log(`Downloading music to ${dest}...`);

const file = fs.createWriteStream(dest);
https.get(url, (response) => {
    if (response.statusCode !== 200) {
        console.error(`Failed to download: ${response.statusCode}`);
        process.exit(1);
    }
    response.pipe(file);
    file.on('finish', () => {
        file.close();
        console.log("✅ Music download complete.");
    });
}).on('error', (err) => {
    fs.unlink(dest, () => { });
    console.error("Error:", err.message);
    process.exit(1);
});
