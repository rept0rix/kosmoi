import fs from 'fs';

const DRAFTS_FILE = 'draft_emails.json';
const INTERACTIONS_FILE = 'interactions.json';

try {
  if (!fs.existsSync(DRAFTS_FILE)) {
    console.error('Drafts file not found.');
    process.exit(1);
  }

  const drafts = JSON.parse(fs.readFileSync(DRAFTS_FILE, 'utf8'));
  
  let interactions = [];
  if (fs.existsSync(INTERACTIONS_FILE)) {
    interactions = JSON.parse(fs.readFileSync(INTERACTIONS_FILE, 'utf8'));
  }

  const newInteractions = drafts.map(draft => ({
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    lead_email: draft.lead_email,
    type: draft.interaction_type,
    content: draft.content,
    metadata: draft.metadata
  }));

  interactions.push(...newInteractions);

  fs.writeFileSync(INTERACTIONS_FILE, JSON.stringify(interactions, null, 2));
  console.log(`Successfully logged ${newInteractions.length} interactions to ${INTERACTIONS_FILE}`);

} catch (error) {
  console.error('Error logging interactions:', error);
}