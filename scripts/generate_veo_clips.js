import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

/**
 * Generate a video clip using Veo 2 API
 * @param {string} name - Clip identifier
 * @param {string} prompt - Video generation prompt
 * @param {object} config - Video configuration
 */
async function generateVeoClip(name, prompt, config = {}) {
    console.log(`🎬 Generating Veo 2 clip: ${name}...`);

    const url = 'https://generativelanguage.googleapis.com/v1beta/models/veo-2-generate:generateContent';

    const requestBody = {
        contents: [{
            parts: [{ text: prompt }]
        }],
        generationConfig: {
            aspect_ratio: config.aspectRatio || "16:9",
            duration: parseInt(config.duration) || 8,  // Integer, seconds
            resolution: config.resolution || "720p",   // Veo 2 supports 720p
            sampleCount: 1,
            enhancePrompt: true
        }
    };

    try {
        console.log(`   Prompt: "${prompt}"`);
        console.log(`   Config: ${requestBody.generationConfig.resolution}, ${requestBody.generationConfig.aspect_ratio}, ${requestBody.generationConfig.duration}s`);

        const response = await fetch(url + `?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Veo API Error for ${name}:`, errorText);
            return null;
        }

        const data = await response.json();

        // Extract video data from response
        const responseParts = data?.candidates?.[0]?.content?.parts ?? [];
        const videoInline = responseParts.find((p) => p.videoData || p.video_data);
        const base64Video = videoInline?.videoData?.data ?? videoInline?.video_data?.data ?? null;

        if (!base64Video) {
            console.error(`❌ No video data returned for ${name}`);
            console.log("Response:", JSON.stringify(data, null, 2));
            return null;
        }

        // Save video file
        const buffer = Buffer.from(base64Video, 'base64');
        const outputPath = path.join(__dirname, '../video-engine/clips', `${name}.mp4`);

        // Ensure clips directory exists
        const clipsDir = path.dirname(outputPath);
        if (!fs.existsSync(clipsDir)) {
            fs.mkdirSync(clipsDir, { recursive: true });
        }

        fs.writeFileSync(outputPath, buffer);
        console.log(`✅ Saved ${name}.mp4 (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);

        return outputPath;
    } catch (e) {
        console.error(`❌ Fetch Error for ${name}:`, e.message);
        return null;
    }
}

async function run() {
    if (!API_KEY) {
        console.error("❌ Missing GEMINI_API_KEY in .env");
        return;
    }

    console.log("🎥 Starting Veo 2 Video Generation Pipeline\n");

    // Test with one yacht clip first
    const testClips = [
        {
            name: 'y001_drone',
            prompt: 'Cinematic drone shot slowly flying over a 70-foot luxury motor yacht cruising through crystal clear turquoise ocean waters near Samui, Thailand. The yacht has a sleek white hull with modern design. Golden hour lighting, smooth camera movement, professional cinematography.',
            config: { resolution: '4K', duration: '8s', aspectRatio: '16:9' }
        },
        {
            name: 'y001_lifestyle',
            prompt: 'Elegant close-up of champagne glasses clinking on the deck of a luxury yacht. Sunset background with ocean views. Luxurious teak wood deck, sophisticated atmosphere. Slow motion, warm golden lighting, ultra premium lifestyle aesthetic.',
            config: { resolution: '720p', duration: 8, aspectRatio: '16:9' }
        }
    ];

    for (const clip of testClips) {
        await generateVeoClip(clip.name, clip.prompt, clip.config);
        console.log(''); // spacing
    }

    console.log("\n🚀 VEO CLIP GENERATION COMPLETE");
}

run();
