import fs from 'fs/promises';

async function main() {
  try {
    const leadsRaw = await fs.readFile('leads.json', 'utf8');
    const leads = JSON.parse(leadsRaw);

    const drafts = leads.map(lead => {
      let subject, body;
      
      if (lead.value === 'High') {
        subject = `Exclusive Proposal for ${lead.company}`;
        body = `Dear ${lead.first_name},\n\nI've been following ${lead.company}'s impressive trajectory in Koh Samui. At Samui Service Hub, we specialize in empowering premium businesses like yours.\n\nI've prepared some ideas on how we can further elevate your guest experience. Would you be open to a brief chat?\n\nBest,\n[Your Name]`;
      } else {
        subject = `Collaboration with ${lead.company}`;
        body = `Hi ${lead.first_name},\n\nI noticed ${lead.company} is doing great work in the local scene. I'd love to connect and share how Samui Service Hub is helping local businesses streamline their operations.\n\nAre you free for a quick call next week?\n\nCheers,\n[Your Name]`;
      }

      return {
        lead_email: lead.email,
        interaction_type: 'email_draft',
        content: `Subject: ${subject}\n\n${body}`,
        metadata: { source: lead.source, value: lead.value }
      };
    });

    await fs.writeFile('draft_emails.json', JSON.stringify(drafts, null, 2));
    console.log('Successfully generated ' + drafts.length + ' drafts to draft_emails.json');
  } catch (err) {
    console.error('Error generating drafts:', err);
    process.exit(1);
  }
}

main();