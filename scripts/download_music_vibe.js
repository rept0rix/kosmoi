import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// "Summer House / Beach Club" vibe
const url = "https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_curator/KieLoKaz/Free_Ganymed/KieLoKaz_-_03_-_Hau_Rock_Kielokaz_ID_119.mp3";
const dest = path.join(__dirname, '../video-engine/public/assets/music_vibe.mp3');

console.log(`Downloading Vibe music to ${dest}...`);

const file = fs.createWriteStream(dest);
const options = {
    headers: {
        'User-Agent': 'Mozilla/5.0'
    }
};

https.get(url, options, (response) => {
    if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        // simple redirect handle
        https.get(response.headers.location, options, (res) => {
            res.pipe(file);
            file.on('finish', () => { file.close(); console.log("✅ Music Vibe Downloaded."); });
        });
        return;
    }
    response.pipe(file);
    file.on('finish', () => {
        file.close();
        console.log("✅ Music Vibe Downloaded.");
    });
}).on('error', (err) => {
    console.error("Error:", err.message);
});
