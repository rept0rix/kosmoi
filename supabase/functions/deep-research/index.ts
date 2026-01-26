
// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
// @ts-ignore
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { query, lat, lng } = await req.json()
        const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY')
        const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')

        if (!GEMINI_API_KEY) throw new Error('Missing GEMINI_API_KEY')
        if (!GOOGLE_MAPS_API_KEY) throw new Error('Missing GOOGLE_MAPS_API_KEY')

        console.log(`🧠 Deep Research Started: "${query}"`)

        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // 1. PLANNING PHASE
        const planPrompt = `
      You are a Deep Research Agent for Koh Samui.
      User Query: "${query}"
      User Location: ${lat}, ${lng}

      Your goal is to find the BEST answer by searching for specific businesses or places.
      Identify 3 distinct search queries to run on Google Maps to get comprehensive data.
      Return ONLY a JSON array of strings. Example: ["best italian food chaweng", "top rated pizza koh samui"]
    `;

        const planResult = await model.generateContent(planPrompt);
        const planText = planResult.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        const searchQueries = JSON.parse(planText);

        console.log("📋 Research Plan:", searchQueries);

        // 2. EXECUTION PHASE (Parallel Search)
        const allPlaces: any[] = [];

        for (const q of searchQueries) {
            console.log(`🔍 Searching: ${q}`);
            const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(q)}&key=${GOOGLE_MAPS_API_KEY}`;
            const resp = await fetch(url);
            const data = await resp.json();

            if (data.results) {
                // Take top 3 from each query
                allPlaces.push(...data.results.slice(0, 3));
            }
        }

        // Deduplicate by place_id
        const uniquePlaces = Array.from(new Map(allPlaces.map(item => [item.place_id, item])).values());
        console.log(`📍 Found ${uniquePlaces.length} unique places`);

        // 3. SYNTHESIS PHASE
        const context = uniquePlaces.map((p: any) => `
      Name: ${p.name}
      Address: ${p.formatted_address}
      Rating: ${p.rating} (${p.user_ratings_total} reviews)
      Types: ${p.types.join(', ')}
    `).join('\n---\n');

        const synthesisPrompt = `
      You are The Scout, a local expert.
      User Query: "${query}"

      Here is the real-time data found:
      ${context}

      Synthesize a helpful, detailed answer recommending the absolute best options from this list.
      Explain WHY they are good based on the data.
      Format in Markdown.
    `;

        const finalResult = await model.generateContent(synthesisPrompt);
        const answer = finalResult.response.text();

        return new Response(JSON.stringify({
            success: true,
            plan: searchQueries,
            places: uniquePlaces,
            answer: answer
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error: any) {
        console.error("Deep Research Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
