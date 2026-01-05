
import { createClient } from "@supabase/supabase-js";
import { FatalError } from "workflow";

// Initialize Supabase Client for Steps
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function fetchBusinessData(businessId: string) {
    "use step";
    const { data, error } = await supabase
        .from('service_providers')
        .select('*')
        .eq('id', businessId)
        .single();

    if (error) throw new Error(`DB Error: ${error.message}`);
    return data;
}

export async function analyzeQuality(business: any) {
    "use step";
    let score = 0;
    const missing = [];

    // Scoring Logic
    if (business.business_name) score += 10; else missing.push("name");
    if (business.description) score += 10; else missing.push("description");
    if (business.phone) score += 15; else missing.push("phone");
    if (business.website) score += 15; else missing.push("website");
    if (business.images && business.images.length > 0) score += 20; else missing.push("images");
    if (business.location) score += 10; else missing.push("location");
    if (business.google_reviews) score += 10; else missing.push("reviews");
    if (business.opening_hours) score += 10; else missing.push("opening_hours");

    return {
        score,
        grade: score > 80 ? 'A' : score > 50 ? 'B' : 'C',
        missing
    };
}

export async function triggerEnrichment(googlePlaceId: string) {
    "use step";
    console.log(`Triggering enrichment for ${googlePlaceId}`);
    // In a real scenario, this would call the Google API directly or trigger the remote script.
    // For now, we'll log it as a placeholder for the agent to connect to the existing script logic later.
    return { triggered: true };
}
