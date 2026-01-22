
import dotenv from 'dotenv';
dotenv.config();

async function testPayment() {
    console.log("💳 Testing Stripe Integration...");

    // Dynamic import to ensure environment variables are loaded FIRST
    const { CreatePaymentLink } = await import('./src/api/integrations.js');

    const result = await CreatePaymentLink({
        name: "Banana AI Premium Service",
        amount: 35.00, // 35 THB
        currency: "thb"
    });

    console.log("Result:", result);
}

testPayment();
