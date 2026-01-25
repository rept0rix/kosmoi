import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Supabase
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
  console.error("❌ Missing PEM_GEMINI_API_KEY in .env");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

async function enrichDescriptions() {
  console.log("🤖 Data Enrichment Agent: Starting Full Scale...");

  const BATCH_SIZE = 10;
  let hasMore = true;
  let totalProcessed = 0;

  while (hasMore) {
    // 1. Fetch businesses with missing descriptions
    const { data: businesses, error } = await supabase
      .from("service_providers")
      .select("id, business_name, category, location, description")
      .or('description.is.null,description.eq.""')
      .limit(BATCH_SIZE);

    if (error) {
      console.error("❌ Error fetching businesses:", error);
      break;
    }

    if (!businesses || businesses.length === 0) {
      console.log("✅ No businesses found needing enrichment! Task Complete.");
      hasMore = false;
      break;
    }

    console.log(
      `Processing batch of ${businesses.length} businesses... (Total so far: ${totalProcessed})`,
    );

    // 2. Loop and Enrich
    for (const biz of businesses) {
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

      try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        const description = response.text().trim();

        if (!description) {
          console.warn(`⚠️ Empty response for ${biz.business_name}`);
          continue;
        }

        // 3. Update Database
        const { error: updateError } = await supabase
          .from("service_providers")
          .update({ description })
          .eq("id", biz.id);

        if (updateError) {
          console.error(
            `❌ Failed to update ${biz.business_name}:`,
            updateError.message,
          );
        } else {
          console.log(`✅ Updated: ${biz.business_name}`);
        }

        totalProcessed++;
        // Rate limiting protection
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (e) {
        console.error(`❌ Error processing ${biz.business_name}:`, e.message);
      }
    }

    // Small pause between batches
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log(
    `🏁 Full enrichment completed. Processed ${totalProcessed} businesses.`,
  );
}

enrichDescriptions();
