
import { SendEmail } from './src/api/integrations.js';
import dotenv from 'dotenv';
dotenv.config();

async function testEmail() {
    console.log("📧 Testing Email Integration...");

    const recipient = "naoryanko@gmail.com"; // Default to user's likely email or a placeholder
    // Ideally we'd ask the user for their email, but for a test script we can use a placeholder or try to read from env
    const targetEmail = process.env.TEST_EMAIL_RECIPIENT || "delivered@resend.dev";

    console.log(`Target: ${targetEmail}`);

    const result = await SendEmail({
        to: targetEmail,
        subject: "Banana AI: First Contact 🍌",
        html: "<h1>Hello from the Island!</h1><p>This is a test email from your autonomous agents.</p>"
    });

    console.log("Result:", result);
}

testEmail();
