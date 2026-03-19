import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env
dotenv.config({ path: resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function main() {
  console.log("Starting Bulk Embedding Generation...");

  // Fetch providers that don't have an embedding yet
  const { data: providers, error: fetchError } = await supabase
    .from('service_providers')
    .select('id, business_name, category, description')
    .is('embedding', null);

  if (fetchError) {
    console.error("Error fetching providers:", fetchError);
    return;
  }

  console.log(`Found ${providers.length} providers needing embeddings.`);

  for (let i = 0; i < providers.length; i++) {
    const provider = providers[i];
    
    // Create a rich text snippet describing the business
    const textToEmbed = `
      Business Name: ${provider.business_name || ""}
      Category: ${provider.category || ""}
      Description: ${provider.description || ""}
    `.trim();

    console.log(`[${i+1}/${providers.length}] Generating for: ${provider.business_name}...`);

    try {
      // Hit our newly deployed edge function
      const { data: embedData, error: embedError } = await supabase.functions.invoke(
        'generate-embeddings',
        {
          body: { text: textToEmbed }
        }
      );

      if (embedError) throw embedError;
      
      const embedding = embedData?.embedding;
      if (!embedding) throw new Error("No embedding returned.");

      // Update the database row directly via service role
      const { error: updateError } = await supabase
        .from('service_providers')
        .update({ embedding })
        .eq('id', provider.id);

      if (updateError) throw updateError;
      
      console.log(`✅ Success for ${provider.business_name}`);
      
    } catch (err) {
      console.error(`❌ Failed for ${provider.business_name}:`, err.message || err);
    }

    // Rate limiting: Google Gemini free tier allows ~15 RPM. Let's wait 4 seconds.
    await delay(4000);
  }

  console.log("Done generating embeddings!");
}

main();
