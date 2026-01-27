// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper: Extract text content from HTML
async function extractContent(url: string): Promise<string> {
    try {
        const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; KosmoiBot/1.0)' }
        });

        if (!response.ok) return "";

        const html = await response.text();

        // Basic HTML stripping (production would use cheerio/jsdom but Deno Edge has limits)
        const text = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        // Limit to 3000 chars to avoid token overflow
        return text.substring(0, 3000);
    } catch (e) {
        console.error(`Failed to extract ${url}:`, e);
        return "";
    }
}

// Helper: Search the web using Serper
async function searchWeb(query: string, serperKey: string): Promise<any[]> {
    try {
        const response = await fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: {
                'X-API-KEY': serperKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                q: query,
                num: 5  // Get top 5 results
            })
        });

        const data = await response.json();
        return data.organic || [];
    } catch (e) {
        console.error('Serper search failed:', e);
        return [];
    }
}

// Helper: Send SSE event
function sendEvent(controller: ReadableStreamDefaultController, event: string, data: any) {
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    controller.enqueue(new TextEncoder().encode(message));
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { query } = await req.json()
        const SERPER_API_KEY = Deno.env.get('SERPER_API_KEY')
        const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')

        if (!GEMINI_API_KEY) throw new Error('Missing GEMINI_API_KEY')
        if (!SERPER_API_KEY) throw new Error('Missing SERPER_API_KEY - Get one free at serper.dev')

        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

        // Create streaming response
        const stream = new ReadableStream({
            async start(controller) {
                sendEvent(controller, 'status', { step: 'planning', message: 'Analyzing your query...' });

                // PHASE 1: PLANNING
                const planPrompt = `You are a Deep Research Agent.
User Query: "${query}"

Your task: Generate 3 diverse, specific search queries to gather comprehensive information.
Think strategically - what aspects need to be covered?

Return ONLY a JSON array of 3 strings. Example: ["query 1", "query 2", "query 3"]`;

                const planResult = await model.generateContent(planPrompt);
                const planText = planResult.response.text().replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
                const searchQueries = JSON.parse(planText);

                sendEvent(controller, 'plan', { queries: searchQueries });

                // PHASE 2: ITERATIVE RESEARCH (Max 2 iterations)
                let allFindings: any[] = [];
                const MAX_ITERATIONS = 2;

                for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
                    sendEvent(controller, 'status', {
                        step: 'searching',
                        iteration: iteration + 1,
                        message: `Research cycle ${iteration + 1}/${MAX_ITERATIONS}...`
                    });

                    // Execute searches
                    for (const q of searchQueries) {
                        sendEvent(controller, 'search', { query: q });
                        const results = await searchWeb(q, SERPER_API_KEY);

                        // Read top 2 URLs per query
                        const topResults = results.slice(0, 2);
                        for (const result of topResults) {
                            sendEvent(controller, 'reading', { url: result.link, title: result.title });
                            const content = await extractContent(result.link);

                            if (content) {
                                allFindings.push({
                                    query: q,
                                    title: result.title,
                                    url: result.link,
                                    snippet: result.snippet,
                                    content: content
                                });
                            }
                        }
                    }

                    // REFLECTION: Do we need more info?
                    sendEvent(controller, 'status', { step: 'reflecting', message: 'Analyzing gathered information...' });

                    const reflectionPrompt = `You are analyzing research findings.
Original Query: "${query}"
Findings Count: ${allFindings.length}

Based on the data collected so far, is there enough information to provide a comprehensive answer?
Consider: depth, diverse perspectives, concrete details.

Respond with JSON: { "sufficient": true/false, "reason": "brief explanation", "newQuery": "if insufficient, suggest ONE more focused search query" }`;

                    const reflectionResult = await model.generateContent(reflectionPrompt);
                    const reflectionText = reflectionResult.response.text().replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
                    const reflection = JSON.parse(reflectionText);

                    sendEvent(controller, 'reflection', reflection);

                    if (reflection.sufficient || iteration === MAX_ITERATIONS - 1) {
                        break; // Exit loop
                    } else {
                        // Add new query for next iteration
                        searchQueries.push(reflection.newQuery);
                    }
                }

                // PHASE 3: SYNTHESIS
                sendEvent(controller, 'status', { step: 'synthesizing', message: 'Crafting your answer...' });

                const context = allFindings.map((f, i) => `
[Source ${i + 1}] ${f.title}
URL: ${f.url}
Content: ${f.content}
        `).join('\n---\n');

                const synthesisPrompt = `You are The Scout, a premium local expert for Koh Samui.
User Query: "${query}"

Research Findings:
${context}

Task: Provide a comprehensive, well-structured answer in Markdown.
- Be specific and actionable
- Include details like prices, locations, contact info if available
- Cite sources naturally (e.g., "According to [Source]...")
- Use emojis for readability 🌴
- Format beautifully with headers, lists, bold text

Deliver a premium, magazine-quality response.`;

                const finalResult = await model.generateContent(synthesisPrompt);
                const answer = finalResult.response.text();

                sendEvent(controller, 'answer', {
                    answer,
                    sources: allFindings.map(f => ({ title: f.title, url: f.url })),
                    queriesUsed: searchQueries.length,
                    sourcesRead: allFindings.length
                });

                sendEvent(controller, 'done', {});
                controller.close();
            }
        });

        return new Response(stream, {
            headers: {
                ...corsHeaders,
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });

    } catch (error: any) {
        console.error("Deep Research Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
