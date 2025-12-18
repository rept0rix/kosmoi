// Function to generate welcome email draft
function generateWelcomeEmail(lead) {
  const subject = `Welcome to Our Service, ${lead.name}!`;
  const body = `Dear ${lead.name},

We're excited to welcome you! ... (rest of the email content)`;

  return { leadId: lead.id, subject: subject, body: body };
}

// Example usage (replace with actual lead data)
const leads = [
  { id: 1, name: "John Doe" },
  { id: 2, name: "Jane Smith" }
];

const emailDrafts = leads.map(generateWelcomeEmail);

console.log(JSON.stringify(emailDrafts, null, 2));

// Output the JSON to the console which can then be saved or passed
// to another system for processing.