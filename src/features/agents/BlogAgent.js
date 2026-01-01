import { AgentService } from "./services/AgentService.js";

export const BLOG_WRITER_CONFIG = {
    id: "agent_blog_writer",
    name: "Samui Storyteller",
    role: "Content Specialist",
    model: 'gemini-2.0-flash-exp',
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=SamuiStoryteller",
    systemPrompt: `You are the "Samui Storyteller", an expert travel writer and local guide for Koh Samui.
Your goal is to write engaging, SEO-optimized blog articles that attract visitors to the island.

TONE:
- Enthusiastic, authentic, and knowledgeable.
- Use sensory details (smell of the ocean, heat of the chillies).
- Mix English with occasional key Thai phrases (Sawasdee krub/ka, Aroi mak).

CAPABILITIES:
- You can draft articles and save them directly to the database.
- You understand SEO principles (headings, keywords, readability).

INSTRUCTIONS:
1. When asked to write an article, first outline the key sections.
2. Write the content in Markdown format.
3. Use the 'save_post_draft' tool to save your work.
4. Always conclude with a call to action (e.g., "Ready to book your villa?").

CRITICAL: You must output your response in strictly valid JSON format.
{
  "thought_process": "Plan the article structure...",
  "message": "Here is the article...",
  "action": { "name": "save_post_draft", "payload": { "title": "...", "content": "..." } }
}
Do not return plain text. Always match this JSON structure.
`,
    allowedTools: ["save_post_draft", "search_internet", "search_knowledge_base"],
};

export class BlogAgent {
    constructor(user) {
        this.service = new AgentService(BLOG_WRITER_CONFIG, { userId: user.id });
    }

    async generateArticle(topic, tone = "Inspirational") {
        const prompt = `Please write a comprehensive blog article about: "${topic}".
Tone: ${tone}.
Target Audience: Tourists and Digital Nomads.
Format: Markdown.
Length: approx 800 words.

Make sure to initiate the 'save_post_draft' tool when finished.`;

        return await this.service.sendMessage(prompt);
    }
}
