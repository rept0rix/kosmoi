import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const leadIds = process.argv.slice(2, 4);
  const targetStageId = process.argv[4];

  for (const leadId of leadIds) {
    try {
      // Generate personalized email (replace with actual logic)
      const emailContent = `Hello, Lead ${leadId}! This is a personalized outreach email.`;

      // Log the email interaction
      const { data: interactionData, error: interactionError } = await supabase
        .from('interactions')
        .insert([
          {
            lead_id: leadId,
            type: 'email',
            content: emailContent,
            created_at: new Date().toISOString(),
          },
        ]);

      if (interactionError) {
        console.error('Error inserting interaction:', interactionError);
        continue;
      }

      // Update the lead's stage_id
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .update({ stage_id: targetStageId })
        .eq('id', leadId);

      if (leadError) {
        console.error('Error updating lead:', leadError);
        continue;
      }

      console.log(`Successfully processed lead ${leadId}`);
    } catch (error) {
      console.error(`Error processing lead ${leadId}:`, error);
    }
  }
}

main();