import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

import { GenerateImage } from '../src/api/integrations.js';
import fs from 'fs';

async function saveImage(name, prompt, aspectRatio = "16:9") {
    console.log(`🎨 Generating High-Quality [${name}] with Nano Banana Pro...`);
    try {
        const result = await GenerateImage({
            prompt: prompt + ", ultra high quality, professional photography, 8k resolution, cinematic lighting, photorealistic",
            aspectRatio
        });

        if (result.error) {
            console.error(`❌ Error for ${name}:`, result.error);
            return;
        }

        const buffer = Buffer.from(result.base64, 'base64');
        const outputPath = path.join(__dirname, 'video-engine/public/assets', `${name}.png`);
        fs.writeFileSync(outputPath, buffer);
        console.log(`✅ Saved ${name} to ${outputPath}`);
    } catch (e) {
        console.error(`❌ Unexpected error for ${name}:`, e.message);
    }
}

async function run() {
    // 1. Yacht 001 Assets
    await saveImage('drone_yacht_gen', 'Cinematic drone shot flying over a 70ft luxury motor yacht in the blue ocean of Samui, Thailand');
    await saveImage('champagne_yacht_gen', 'POV of a luxury yacht deck with champagne glasses on a wooden table, sunset background, high-end lifestyle');

    // 2. Yacht 002 Assets
    await saveImage('catamaran_exterior_gen', 'Sleek white sailing catamaran anchored near a white sand beach, turquoise water, sunny day');
    await saveImage('catamaran_party_gen', 'Lively boat party on a catamaran deck, neon lights, people toasting, DJ in the background');

    // 3. App Explainer Assets
    await saveImage('frustrated_broker', 'Stressed man in 1990s office yelling at phone, messy desk, black and white gritty photography', "9:16");
    await saveImage('kosmoi_logo', '3D gold logo of the letter K shaped like a yacht sail, floating in a luxury dark void', "9:16");
    await saveImage('app_browse', 'Close up of hand holding iPhone 15 showing a luxury yacht rental app, beach background', "9:16");
    await saveImage('app_book', 'Macro shot of finger pressing a golden INSTANT BOOK button on a sleek mobile app UI', "9:16");

    console.log("\n🚀 ALL PREMIUM ASSETS REGENERATED.");
}

run();
