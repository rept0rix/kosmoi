import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import https from 'https';

const require = createRequire(import.meta.url);
const yachtData = require('../src/data/yacht_listings.json');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Google TTS Helper ---
const downloadTTS = (text, outputPath) => {
    return new Promise((resolve, reject) => {
        const encodedText = encodeURIComponent(text);
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=en&client=tw-ob`;

        const file = fs.createWriteStream(outputPath);
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`TTS Failed with status: ${response.statusCode}`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                console.log("🎙️  Voiceover generated!");
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(outputPath, () => { });
            reject(err);
        });
    });
};

const yachtId = process.argv[2];
if (!yachtId) { console.error("Missing Yacht ID"); process.exit(1); }
const yacht = yachtData.find(y => y.id === yachtId);
if (!yacht) { console.error("Yacht not found"); process.exit(1); }

// Dirs
const outputDir = path.join(__dirname, '../public/videos/tours');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
const videoEnginePath = path.join(__dirname, '../video-engine');
const voiceoverPath = path.join(videoEnginePath, 'public/assets/voiceover.mp3');
const musicPath = path.join(videoEnginePath, 'public/assets/music.mp3');

// Viral / Value-Driven Description
const description = `This is the ${yacht.name}. Your private floating palace. Price includes captain, fuel, and champagne. Don't just rent a boat, own the ocean. Book Kosmoi.`;

(async () => {
    try {
        if (!fs.existsSync(voiceoverPath)) {
            await downloadTTS(description, voiceoverPath);
        }
    } catch (e) {
        console.warn("TTS Error:", e.message);
    }

    // Determine Theme based on Category
    // "Ultra Luxury" -> Royal (Gold/Classic)
    // Others -> Vibe (Neon/Party)
    let theme = 'vibe';
    if (yacht.category === 'Ultra Luxury') {
        theme = 'royal';
    }

    // Props
    // We pass undefined if we want the component to use its default staticFile('assets/...')
    // Or we pass the RELATIVE string 'assets/voiceover.mp3' which staticFile will resolve correctly in the component
    // IF we wrap it in staticFile inside the component.
    const inputProps = {
        name: yacht.name,
        price: yacht.price_thb.toString(),
        images: yacht.image ? [yacht.image] : [],
        theme: theme,
        inc1: yacht.features[0] || "PRIVATE CAPTAIN", // Dynamic features from JSON
        inc2: yacht.features[1] || "ALL INCLUSIVE",
        inc3: yacht.features[2] || "BEST PRICE"
    };

    // Explicitly set if we want to override defaults with dynamic paths, 
    // but here sticking to fixed assets is safer for verification.

    const outputFile = path.join(outputDir, `${yachtId}.mp4`);

    try {
        const cmd = `npx remotion render src/index.tsx CinemaTour "${outputFile}" --props='${JSON.stringify(inputProps)}' --concurrency=2 --overwrite`;

        console.log(`⚙️  Rendering to ${outputFile}...`);
        execSync(cmd, { cwd: videoEnginePath, stdio: 'inherit' });
        console.log(`✅ Success!`);

    } catch (error) {
        console.error("❌ Render Failed");
        process.exit(1);
    }
})();
