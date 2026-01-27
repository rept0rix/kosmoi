import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const videos = [
    {
        name: "drone_yacht.mp4",
        url: "https://videos.pexels.com/video-files/855018/855018-hd_1920_1080_30fps.mp4" // Drone shot of boat
    },
    {
        name: "ocean_wake.mp4",
        url: "https://videos.pexels.com/video-files/1409899/1409899-hd_1920_1080_25fps.mp4" // Wake/Ocean close up
    }
];

const downloadFile = (url, filename) => {
    return new Promise((resolve, reject) => {
        const dest = path.join(__dirname, '../video-engine/public/assets', filename);
        console.log(`Downloading ${filename}...`);

        const file = fs.createWriteStream(dest);
        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        };

        https.get(url, options, (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                // Follow Redirect
                downloadFile(response.headers.location, filename).then(resolve).catch(reject);
                return;
            }
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download ${filename}: ${response.statusCode}`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                console.log(`✅ ${filename} Complete.`);
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => { });
            reject(err);
        });
    });
};

(async () => {
    try {
        for (const vid of videos) {
            await downloadFile(vid.url, vid.name);
        }
    } catch (e) {
        console.error("Download failed:", e.message);
        process.exit(1);
    }
})();
