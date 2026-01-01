import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. Setup Environment + Globals BEFORE imports
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

// Mock Browser Globals for Supabase
if (typeof localStorage === "undefined" || localStorage === null) {
    global.localStorage = {
        getItem: (key) => null,
        setItem: (key, value) => { },
        removeItem: (key) => { },
        clear: () => { }
    };
}

// Mock User
const MOCK_USER = {
    id: '2ff0dcb1-37f2-4338-bb3b-f71fb6dd444e'
};

async function testBlogAgent() {
    console.log("🚀 Starting Blog Agent Test...");

    try {
        // 2. Dynamic Import (Run after env is loaded)
        const { BlogAgent } = await import('../src/features/agents/BlogAgent.js');
        const { db } = await import('../src/api/supabaseClient.js');

        // 3. Initialize Agent
        const agent = new BlogAgent(MOCK_USER);
        console.log("✅ BlogAgent Initialized");

        // 4. Trigger Generation
        const topic = "Hidden Waterfalls of Koh Samui";
        const tone = "Adventurous";

        console.log(`📝 Requesting article: "${topic}" (Tone: ${tone})`);

        const response = await agent.generateArticle(topic, tone);
        console.log("\n🤖 Agent Response:\n", response.text);

        // 5. Verify Database
        if (response.toolRequest && response.toolRequest.name === 'save_post_draft') {
            // Check if draft exists (Wait a bit for async DB save if needed, though AgentService awaits it)
            const { data: drafts } = await db.from('blog_posts')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(1);

            if (drafts && drafts.length > 0) {
                console.log(`\n✅ Draft found in DB: ${drafts[0].title}`);
                console.log(`ID: ${drafts[0].id}`);
            } else {
                console.error("\n❌ No draft found in DB.");
            }
        } else {
            console.log("\n⚠️ Agent did not request to save a draft.");
            console.log("Tool Request:", response.toolRequest);
        }

    } catch (error) {
        console.error("\n❌ Test Failed:", error);
    }
}

testBlogAgent();
