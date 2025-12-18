// update_leads.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL and key are required as environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateLead(leadId, stageId) {
  const { data, error } = await supabase
    .from('leads')
    .update({ stage_id: stageId })
    .eq('id', leadId);

  if (error) {
    console.error('Error updating lead:', leadId, error);
    return false;
  }
  console.log('Lead updated:', leadId);
  return true;
}

async function insertInteraction(leadId, content) {
  const { data, error } = await supabase
    .from('interactions')
    .insert([{
      lead_id: leadId,
      type: 'email',
      content: content
    }]);

  if (error) {
    console.error('Error inserting interaction:', leadId, error);
    return false;
  }
  console.log('Interaction inserted:', leadId);
  return true;
}

async function main() {
  const targetStageId = 'e0fde43c-d102-455c-8580-29b86959fa77';
  const leadIds = ['d06d4176-6f5b-4dae-bf02-19e90c536cf5', '720a0465-0a3b-45f7-83f8-c9bec56cbff2'];

  for (const leadId of leadIds) {
    const emailContent = `Hello, Lead ${leadId}! This is a personalized email.`;

    const updated = await updateLead(leadId, targetStageId);
    if (updated) {
      await insertInteraction(leadId, emailContent);
    }
  }
  console.log('Script completed.');
}

main();