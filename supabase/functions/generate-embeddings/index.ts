// @ts-ignore - Deno is available in Supabase Edge Functions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// @ts-ignore
const GEMINI_API_KEY = Deno.env.get("VITE_GEMINI_API_KEY") || Deno.env.get("GEMINI_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();

    if (!text) {
      return new Response(JSON.stringify({ error: "Text is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    if (!GEMINI_API_KEY) {
      throw new Error("Missing GEMINI_API_KEY environment variable. Add it to the Edge Function secrets.");
    }

    // Call Google Gemini Embeddings API (gemini-embedding-001)
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GEMINI_API_KEY}`;

    // We create the request body expected by Google's API
    const requestBody = {
      model: "models/gemini-embedding-001",
      content: {
        parts: [{ text: text }],
      },
      outputDimensionality: 768,
    };

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API Error:", errText);
      throw new Error(`Google Embeddings API failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const embedding = data.embedding?.values;

    if (!embedding) {
      throw new Error("No embedding returned from Gemini API");
    }

    // Return the generated vector
    return new Response(JSON.stringify({ embedding }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: any) {
    console.error("Edge Function Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
