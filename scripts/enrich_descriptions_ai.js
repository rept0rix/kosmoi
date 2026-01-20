import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const geminiKey = process.env.VITE_GEMINI_API_KEY;

if (!geminiKey) {
    console.error("❌ Missing VITE_GEMINI_API_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenerativeAI(geminiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Configuration
const BATCH_SIZE = 100;
const DRY_RUN = false;

async function enrichContent() {
    console.log("🚀 Starting Full AI Content Enrichment (Gemini + Templates)...");

    let totalUpdated = 0;
    let hasMore = true;

    while (hasMore) {
        // Query candidates with "bad" descriptions
        const { data: candidates, error } = await supabase
            .from('service_providers')
            .select('id, business_name, description, google_reviews, sub_category, location, super_category, category')
            .or('description.ilike.%Imported from Google%,description.is.null,description.eq.""')
            .limit(BATCH_SIZE);

        if (error) {
            console.error("Supabase Error:", error);
            break;
        }

        if (!candidates || candidates.length === 0) {
            console.log("✅ No more candidates pending enrichment.");
            hasMore = false;
            break;
        }

        console.log(`Processing batch of ${candidates.length}...`);

        for (const item of candidates) {
            // console.log(`Processing: ${item.business_name}`);
            let newDescription = "";
            let source = "";

            const reviews = item.google_reviews;

            // --- STRATEGY 1: AI Summary (If reviews exist) ---
            if (reviews && reviews.length > 0) {
                const reviewText = reviews.slice(0, 5).map(r => `"${r.text}"`).join("\n");
                const prompt = `
                 Based on the following reviews for "${item.business_name}" in Koh Samui, write a compelling, 2-sentence "About" description. 
                 Focus on what makes it special (e.g. food, atmosphere, service). 
                 Do not use quotes. Write in an inviting, professional tone.
                 
                 Reviews:
                 ${reviewText}
                 `;

                try {
                    const result = await model.generateContent(prompt);
                    const response = await result.response;
                    newDescription = response.text().trim();
                    source = 'gemini_reviews';
                } catch (err) {
                    console.error(`AI Error for ${item.business_name}:`, err.message);
                    // Fallback to template if AI fails
                }
            }

            // --- STRATEGY 2: Template Fallback (If no reviews or AI failed) ---
            if (!newDescription) {
                const type = item.sub_category || item.category || item.super_category || "Business";
                const locParts = (item.location || "").split(',');
                const area = locParts.length > 1 ? locParts[1].trim() : "Koh Samui";

                // Capitalize
                const prettyType = type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ');

                newDescription = `${item.business_name} is a premier ${prettyType} located in ${area}. Visit us for a great local experience in Koh Samui.`;
                source = 'template_fallback';
            }

            // Update DB
            if (newDescription && !DRY_RUN) {
                const { error: updateError } = await supabase
                    .from('service_providers')
                    .update({
                        description: newDescription,
                        metadata: {
                            enrichment_source: source,
                            enrichment_date: new Date().toISOString()
                        }
                    })
                    .eq('id', item.id);

                if (updateError) console.error(`Failed update ${item.business_name}:`, updateError.message);
                else {
                    totalUpdated++;
                    // console.log(`✅ [${source}] ${item.business_name}`);
                }
            }

            // Rate limit safety
            if (source === 'gemini_reviews') await new Promise(r => setTimeout(r, 1000));
        }
        console.log(`Batch complete. Total updated so far: ${totalUpdated}`);
    }
    console.log("🎉 Enrichment Complete!");
}

enrichContent();
