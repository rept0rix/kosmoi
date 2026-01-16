
import 'dotenv/config';
import { INVITATION_TEMPLATE } from './lib/email_templates.js';

const webhookUrl = process.env.VITE_N8N_EMAIL_WEBHOOK;

if (!webhookUrl || !webhookUrl.startsWith('http')) {
    console.error("❌ Invalid Webhook URL:", webhookUrl);
    process.exit(1);
}

console.log(`🚀 Testing n8n Webhook: ${webhookUrl}`);

const businessName = 'Kosmoi Test Business';
const claimLink = 'https://kosmoi.site/claim?id=TEST_123';
const emailHtml = INVITATION_TEMPLATE(businessName, claimLink);

const mockPayload = {
    to: 'na0ryank0@gmail.com',
    subject: `Invitation for ${businessName} - Kosmoi`,
    html: emailHtml,
    business_name: businessName,
    claim_link: claimLink,
    lead_id: 'test-lead-123',
    from: 'sarah@kosmoi.site'
};

async function testWebhook() {
    try {
        console.log("📨 Sending payload...");
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(mockPayload)
        });

        console.log(`Response Status: ${response.status} ${response.statusText}`);
        const text = await response.text();
        console.log(`Response Body: ${text}`);

        if (response.ok) {
            console.log("✅ Success! Check n8n Executions log.");
        } else {
            console.error("❌ Failed.");
        }
    } catch (e) {
        console.error("❌ Network Error:", e.message);
    }
}

testWebhook();
