import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

async function generateGeminiImage(name, prompt, aspectRatio = "16:9") {
    console.log(`🎨 Generating ${name} with Gemini 3 Pro...`);

    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent';
    const fullPrompt = `${prompt}, ultra high quality, professional photography, 8k resolution, cinematic lighting, photorealistic`;

    const requestBody = {
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: {
            temperature: 1,
            imageConfig: {
                imageSize: "4K",
                aspectRatio: aspectRatio
            },
        },
    };

    try {
        const response = await fetch(url + `?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Gemini API Error for ${name}:`, errorText);
            return;
        }

        const data = await response.json();
        const responseParts = data?.candidates?.[0]?.content?.parts ?? [];
        const inline = responseParts.find((p) => p.inlineData || p.inline_data);
        const base64 = inline?.inlineData?.data ?? inline?.inline_data?.data ?? null;

        if (!base64) {
            console.error(`❌ No image data returned for ${name}`);
            return;
        }

        const buffer = Buffer.from(base64, 'base64');
        const outputPath = path.join(__dirname, '../video-engine/public/assets', `${name}.png`);
        fs.writeFileSync(outputPath, buffer);
        console.log(`✅ Saved ${name} to ${outputPath}`);
    } catch (e) {
        console.error(`❌ Fetch Error for ${name}:`, e.message);
    }
}

async function run() {
    if (!API_KEY) {
        console.error("❌ Missing GEMINI_API_KEY in .env");
        return;
    }

    // Yacht 001
    await generateGeminiImage('drone_yacht_gen', 'Cinematic drone shot flying over a 70ft luxury motor yacht in the blue ocean of Samui, Thailand');
    await generateGeminiImage('champagne_yacht_gen', 'POV of a luxury yacht deck with champagne glasses on a wooden table, sunset background');

    // Yacht 002
    await generateGeminiImage('catamaran_exterior_gen', 'Sleek white sailing catamaran anchored near a white sand beach, turquoise water');
    await generateGeminiImage('catamaran_party_gen', 'Lively boat party on a catamaran deck, neon lights, people toasting, DJ in the background');

    // App Explainer
    await generateGeminiImage('frustrated_broker', 'Stressed man in 1990s office yelling at phone, messy desk, black and white gritty photography', "9:16");
    await generateGeminiImage('kosmoi_logo', '3D gold logo of the letter K shaped like a yacht sail, luxury dark void', "9:16");
    await generateGeminiImage('app_browse', 'Close up of hand holding iPhone 15 showing a luxury yacht rental app, beach background', "9:16");
    await generateGeminiImage('app_book', 'Macro shot of finger pressing a golden INSTANT BOOK button on mobile app UI', "9:16");

    console.log("\n🚀 ASSETS REGENERATED WITH GEMINI 3.");
}

run();
