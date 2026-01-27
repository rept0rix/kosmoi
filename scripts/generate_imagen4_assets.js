import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

/**
 * Generate ultra-high quality image using Imagen 4
 */
async function generateImagen4(name, prompt, config = {}) {
    console.log(`🎨 Generating Imagen 4 asset: ${name}...`);

    const url = 'https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:generateContent';

    const fullPrompt = `${prompt}, ultra high quality, professional photography, 8k resolution, cinematic lighting, photorealistic, stunning detail`;

    const requestBody = {
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: {
            temperature: 0.4,
            topK: 40,
            topP: 0.95
        }
    };

    try {
        console.log(`   Prompt: "${prompt}"`);

        const response = await fetch(url + `?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Imagen 4 Error for ${name}:`, errorText);
            return null;
        }

        const data = await response.json();

        // Extract image data
        const responseParts = data?.candidates?.[0]?.content?.parts ?? [];
        const imageInline = responseParts.find((p) => p.inlineData || p.inline_data);
        const base64Image = imageInline?.inlineData?.data ?? imageInline?.inline_data?.data ?? null;

        if (!base64Image) {
            console.error(`❌ No image data returned for ${name}`);
            return null;
        }

        // Save file
        const buffer = Buffer.from(base64Image, 'base64');
        const outputPath = path.join(__dirname, '../video-engine/public/assets', `${name}.png`);
        fs.writeFileSync(outputPath, buffer);

        console.log(`✅ Saved ${name}.png (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);
        return outputPath;
    } catch (e) {
        console.error(`❌ Error for ${name}:`, e.message);
        return null;
    }
}

async function run() {
    if (!API_KEY) {
        console.error("❌ Missing GEMINI_API_KEY in .env");
        return;
    }

    console.log("🎨 Generating Premium Imagen 4 Assets\n");

    const assets = [
        // Yacht 001 - Royal Theme
        {
            name: 'drone_yacht_premium',
            prompt: 'Cinematic aerial drone photograph of luxury 70-foot motor yacht cruising through crystal turquoise ocean near Samui Thailand, white hull with teak deck, golden hour sunset lighting, professional maritime photography'
        },
        {
            name: 'champagne_yacht_premium',
            prompt: 'Elegant photograph of champagne glasses on luxury yacht teak deck at sunset, ocean horizon background, sophisticated premium lifestyle aesthetic, warm golden light'
        },
        // Yacht 002 - Vibe Theme
        {
            name: 'catamaran_exterior_premium',
            prompt: 'Professional photograph of sleek white sailing catamaran anchored near white sand beach, crystal turquoise water, tropical paradise, sunny day, premium travel photography'
        },
        {
            name: 'catamaran_party_premium',
            prompt: 'Vibrant photograph of boat party on modern catamaran deck, neon party lights, people celebrating and toasting, DJ equipment, energetic nightlife atmosphere'
        }
    ];

    for (const asset of assets) {
        await generateImagen4(asset.name, asset.prompt);
        console.log('');
    }

    console.log("\n🚀 IMAGEN 4 ASSETS COMPLETE");
}

run();
