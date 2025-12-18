const leads = [{"company":"Samui Elite Villas","first_name":"Marcus","last_name":"Thorne","email":"marcus@samuielitevillas.com","value":"High","source":"ai_prospecting"},{"company":"Lotus Wellness Retreat","first_name":"Sarah","last_name":"Jenkins","email":"sarah.j@lotuswellness-samui.com","value":"Medium","source":"ai_prospecting"},{"company":"Blue Horizon Diving","first_name":"Somchai","last_name":"Rattana","email":"bookings@bluehorizondiving.th","value":"Medium","source":"ai_prospecting"}];

async function createLead(lead) {
  const payload = JSON.stringify(lead);
  const command = `curl -X POST -H "Content-Type: application/json" -d '${payload}' /api/leads`;
  try {
    const result = await execute_command(command);
    console.log(`Lead creation result: ${result}`);
  } catch (error) {
    console.error(`Error creating lead: ${error}`);
  }
}

async function main() {
  for (const lead of leads) {
    await createLead(lead);
  }
  console.log("Lead creation process completed.");
}

main();