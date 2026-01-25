import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import yachtData from '../src/data/yacht_listings.json' assert { type: "json" };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get Yacht ID from CLI args
const yachtId = process.argv[2];

if (!yachtId) {
    console.error("❌ Usage: node render_property_tour.js <YACHT_ID>");
    console.error("Example: node render_property_tour.js y-001");
    process.exit(1);
}

const yacht = yachtData.find(y => y.id === yachtId);

if (!yacht) {
    console.error(`❌ Yacht with ID ${yachtId} not found.`);
    process.exit(1);
}

console.log(`🎬 Generating Property Tour for: ${yacht.name}`);
console.log(`💰 Price: ${yacht.price_thb} THB`);

// Prepare Props
const inputProps = {
    name: yacht.name,
    price: yacht.price_thb.toString(),
    images: Array.isArray(yacht.images) ? yacht.images : [yacht.image]
};

// Ensure output directory exists
const outputDir = path.join(__dirname, '../public/videos/tours');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const outputFile = path.join(outputDir, `${yachtId}.mp4`);
const videoEnginePath = path.join(__dirname, '../video-engine');

try {
    // Run Remotion Render
    // We pass props as a JSON string to --props
    const cmd = `npx remotion render src/index.tsx PropertyTour "${outputFile}" --props='${JSON.stringify(inputProps)}'`;

    console.log(`⚙️  Running render...`);
    execSync(cmd, { cwd: videoEnginePath, stdio: 'inherit' });

    console.log(`✅ Video generated successfully: ${outputFile}`);

} catch (error) {
    console.error("❌ Failed to render video:", error.message);
    process.exit(1);
}
