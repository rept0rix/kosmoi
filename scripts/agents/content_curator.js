import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { samuiKnowledge } from '../../src/data/samuiKnowledge.js';

// Initialize Supabase (Service Role for writing)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize Gemini
const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("❌ Missing VITE_GEMINI_API_KEY in .env");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function generateBlogPost() {
    console.log("🤖 Content Curator Agent: Starting generation...");

    // 1. Pick a Topic Strategy (Random for now)
    const categories = ['beaches', 'transport', 'culture', 'activities'];
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];

    let topic, contextData;

    if (Array.isArray(samuiKnowledge[randomCategory])) {
        const item = samuiKnowledge[randomCategory][Math.floor(Math.random() * samuiKnowledge[randomCategory].length)];
        topic = item.name;
        contextData = JSON.stringify(item);
    } else {
        // Handle object like transport/culture
        const keys = Object.keys(samuiKnowledge[randomCategory]);
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        topic = keys === 'culture' ? randomKey : randomKey; // simplify
        contextData = JSON.stringify(samuiKnowledge[randomCategory][randomKey]);
    }

    console.log(`📝 Selected Topic: ${topic} (${randomCategory})`);

    // 2. Generate Content
    const prompt = `
    You are an expert travel writer for "Kosmoi", the intelligent city guide for Koh Samui.
    Write a high-quality, engaging blog post about "${topic}".
    
    Target Audience: Tourists and Digital Nomads.
    Tone: Professional, helpful, inviting, but verified.
    
    Use this source data as the ground truth (do not make up facts contrary to this):
    ${contextData}
    
    Structure the blog post in Markdown format.
    Include a "Frontmatter" block at the start in JSON format describing the post metadata.
    
    Output Format strictly:
    \`\`\`json
    {
        "title": "Catchy Title Here",
        "slug": "kebab-case-slug-here",
        "excerpt": "Short teaser description (1-2 sentences).",
        "tags": ["Tag1", "Tag2"],
        "cover_image_prompt": "A prompt to generate an image for this post"
    }
    \`\`\`
    
    [Markdown Content Here starts with # Title]
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // Parse Output
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
        const contentMatch = text.split(/```json\n[\s\S]*?\n```/)[1]?.trim() || text;

        if (!jsonMatch) {
            console.error("❌ Failed to parse JSON metadata from AI response.");
            console.log("Raw Output:", text.substring(0, 200));
            return;
        }

        const metadata = JSON.parse(jsonMatch[1]);
        const markdownContent = contentMatch.replace(/^```markdown/, '').replace(/```$/, '').trim();

        // 3. Save to Supabase
        const { data, error } = await supabase
            .from('posts')
            .upsert({
                title: metadata.title,
                slug: metadata.slug,
                excerpt: metadata.excerpt,
                content: markdownContent,
                tags: metadata.tags,
                published: true, // Auto-publish for demo
                published_at: new Date().toISOString(),
                // cover_image: "TODO: Generate Image" 
            }, { onConflict: 'slug' })
            .select();

        if (error) {
            console.error("❌ Database Error:", error.message);
        } else {
            console.log(`✅ Post Published: "${metadata.title}"`);
            console.log(`   URL: http://localhost:5173/blog/${metadata.slug}`);
        }

    } catch (e) {
        console.error("❌ Generation Error:", e);
    }
}

// Run
generateBlogPost();
