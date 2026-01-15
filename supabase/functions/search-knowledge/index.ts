
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai"

serve(async (req) => {
    try {
        const { query } = await req.json()
        if (!query) return new Response("Missing query", { status: 400 })

        // 1. Init
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        // Using Service Role for embedding generation? No, just API Key.
        // Using Service Role for RPC? 'match_knowledge' is public.

        const geminiKey = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('VITE_GEMINI_API_KEY')
        if (!geminiKey) return new Response("Missing AI Key", { status: 500 })

        // 2. Embed Query
        const genAI = new GoogleGenerativeAI(geminiKey)
        const model = genAI.getGenerativeModel({ model: "text-embedding-004" })

        const result = await model.embedContent(query)
        const embedding = result.embedding.values

        // 3. Search via RPC
        const { data: documents, error } = await supabaseClient.rpc('match_knowledge', {
            query_embedding: embedding,
            match_threshold: 0.5, // Adjust threshold
            match_count: 5
        })

        if (error) throw error

        return new Response(JSON.stringify({ documents }), { headers: { "Content-Type": "application/json" } })

    } catch (error) {
        console.error(error)
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } })
    }
})
