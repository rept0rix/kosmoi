import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env BEFORE imports
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function run() {
    // Dynamic import to ensure env vars are loaded first
    const { performDeepAudit } = await import("../src/workflows/steps/auditSteps");

    const testUrl = "https://www.google.com";
    console.log(`🧪 Testing MCP Deep Audit on: ${testUrl}`);

    try {
        const result = await performDeepAudit(testUrl);
        console.log("✅ Deep Audit Result:", JSON.stringify(result, null, 2));

        // Test Social
        const { performSocialCheck } = await import("../src/workflows/steps/auditSteps");
        const socialUrl = "https://www.facebook.com";
        console.log(`\n🧪 Testing MCP Social Pulse on: ${socialUrl}`);
        const socialResult = await performSocialCheck("facebook", socialUrl);
        console.log("✅ Social Result:", JSON.stringify(socialResult, null, 2));

    } catch (error) {
        console.error("❌ Failed:", error);
    }
}

run();
