import 'dotenv/config';
import { SkillService } from '../src/services/agents/SkillService.js';
import { getAgentReply } from '../src/services/agents/AgentBrain.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- SETUP ADMIN CLIENT FOR SCRIPT ---
import { createClient } from '@supabase/supabase-js';
import { supabase as defaultClient } from '../src/api/supabaseClient.js';

let supabase = defaultClient;
if (process.env.VITE_SUPABASE_SERVICE_ROLE_KEY) {
    console.log("🔐 Using Service Role Key for Admin Access");
    supabase = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
    );
    // MONKEY PATCH the exported client in SkillService locally for this script
    SkillService.saveSkill = async function (skillData, userId) {
        if (!skillData || !skillData.name) throw new Error("Invalid skill data.");
        try {
            const payload = {
                category: 'imported',
                trigger_tags: [skillData.name.toLowerCase().replace(/\s+/g, '_')],
                problem_pattern: skillData.description,
                solution_pattern: skillData.instructions,
                confidence: 1.0,
                created_by: userId
            };
            const { data, error } = await supabase.from('agent_skills').insert([payload]).select();
            if (error) throw error;
            return data[0];
        } catch (e) {
            console.error("SkillService Patch Error", e);
            throw e;
        }
    };
    SkillService.findRelevantSkills = async function (query) {
        if (!query) return [];
        try {
            const { data, error } = await supabase
                .from('agent_skills')
                .select('*')
                .or(`problem_pattern.ilike.%${query}%`)
                .limit(3);
            if (error) throw error;
            return data.map(s => ({
                name: (s.metadata && s.metadata.name) ? s.metadata.name : (s.trigger_tags ? s.trigger_tags[0] : "Skill"),
                instructions: s.solution_pattern,
                description: s.problem_pattern
            }));
        } catch (e) {
            console.error("SkillService Search Patch Error", e);
            return [];
        }
    };
}
// -------------------------------------

async function runDemo() {
    console.log("🧪 Starting Skill System Experiment...");

    // 1. Load the Skill Content
    const skillPath = path.join(__dirname, '../skills/growth_hacker.md');
    const markdown = fs.readFileSync(skillPath, 'utf8');
    console.log("📂 Loaded Skill Markdown: Viral Growth Specialist");

    // 2. Parse & Save
    console.log("⚙️ Parsing and Saving Skill...");
    const parsed = SkillService.parseSkill(markdown);

    // Mock User ID for demo
    const userId = '2ff0dcb1-37f2-4338-bb3b-f71fb6dd444e';

    try {
        const saved = await SkillService.saveSkill(parsed, userId);
        console.log(`✅ Skill Saved to DB! ID: ${saved.id}`);
        console.log(`   Pattern: "${saved.problem_pattern}"`);
    } catch (e) {
        console.error("❌ Failed to save skill (might already exist, continuing...)", e.message);
    }

    // 3. Trigger the Agent
    console.log("\n🤖 Simulating Chat Interaction...");
    console.log("user: 'How do I get more users for my app?'");

    const agentConfig = {
        id: 'DEMO_AGENT',
        model: 'gemini-2.0-flash-exp', // Known working model
        systemPrompt: 'You are a helpful assistant.' // Generic prompt, should be overridden/enhanced by skill
    };

    const history = [
        { agent_id: 'HUMAN_USER', role: 'user', content: 'How do I get more users for my app? I need rapid growth.' }
    ];

    // 3.1 PRE-FETCH SKILLS (Simulate Brain Logic but with Admin Client)
    let fetchedSkillsText = "";
    try {
        const skills = await SkillService.findRelevantSkills('viral');
        if (skills.length > 0) {
            fetchedSkillsText = `\nActive Skills Instructions ENVJ:\n${skills.map(s => `[${s.name}]: ${s.instructions}`).join('\n')}\n`;
            console.log("✅ Pre-fetched skills for injection:", skills.map(s => s.name));
        } else {
            console.log("⚠️ No skills found for query 'viral'.");
        }
    } catch (e) { console.error("Prefetch failed", e); }

    try {
        const response = await getAgentReply(agentConfig, history, {
            meetingTitle: 'Growth Strategy Session',
            skillOverride: fetchedSkillsText
        });

        console.log("\n💬 Agent Response:");
        console.log("---------------------------------------------------");
        console.log(response.message);
        console.log("---------------------------------------------------");

        if (response.message.includes("🚀 GROWTH MODE ENGAGED")) {
            console.log("✅ SUCCESS: Agent adopted the Growth Hacker persona!");
        } else {
            console.log("⚠️ WARNING: Agent did not use the trigger phrase. Check Skill Context injection.");
        }

    } catch (e) {
        console.error("💥 Agent Brain Failed:", e);
    }

    process.exit(0);
}

runDemo();
