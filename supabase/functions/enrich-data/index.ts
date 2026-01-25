// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // 1. Init Config
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!; // Use Service Role for DB writes
        const geminiKey = Deno.env.get('GEMINI_API_KEY')!;

        if (!supabaseUrl || !supabaseKey || !geminiKey) {
            throw new Error("Missing Env Vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or GEMINI_API_KEY");
        }

        const supabase = createClient(supabaseUrl, supabaseKey);
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Switched to 1.5-flash per user notice

        console.log("🤖 Enrichment Function Started");

        // 2. Fetch Batch (Small batch for Edge Function timeout safety)
        const BATCH_SIZE = 5;
        const { data: businesses, error } = await supabase
            .from("service_providers")
            .select("id, business_name, category, location, description")
            .or('description.is.null,description.eq.""')
            .limit(BATCH_SIZE);

        if (error) throw error;

        if (!businesses || businesses.length === 0) {
            return new Response(JSON.stringify({ message: "No businesses need enrichment." }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            });
        }

        const results = [];

        // 3. Process Batch
        for (const biz of businesses) {
            try {
                console.log(`Processing: ${biz.business_name}`);
                const prompt = `
            Write a short, engaging, and professional description (approx 100-150 words) for a business in Koh Samui, Thailand.
            
            Business Name: ${biz.business_name}
            Category: ${biz.category || "Local Business"}
            Location: ${biz.location || "Koh Samui"}
            
            Focus on:
            - Welcoming tone.
            - Highlighting likely amenities for this category.
            - SEO keywords related to Koh Samui and ${biz.category}.
            
            Return ONLY the raw text description. No markdown headers.
            `;

                const result = await model.generateContent(prompt);
                const response = result.response;
                const description = response.text().trim();

                if (description) {
                    const { error: updateError } = await supabase
                        .from("service_providers")
                        .update({ description })
                        .eq("id", biz.id);

                    if (updateError) throw updateError;
                    results.push({ id: biz.id, status: "updated", name: biz.business_name });
                } else {
                    results.push({ id: biz.id, status: "empty_response", name: biz.business_name });
                }
            } catch (e) {
                console.error(`Error processing ${biz.business_name}:`, e);
                results.push({ id: biz.id, status: "error", error: e.message });
            }
        }

        return new Response(JSON.stringify({
            message: `Processed ${businesses.length} items`,
            results
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        console.error("Enrichment Error:", error);
        return new Response(JSON.stringify({ error: (error as Error).message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
