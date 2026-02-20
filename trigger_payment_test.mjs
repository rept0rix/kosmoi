
import { CreatePaymentLink } from './src/api/integrations.js';
import dotenv from 'dotenv';
dotenv.config();

async function testPayment() {
    console.log("💳 Testing Stripe Integration...");

    const result = await CreatePaymentLink({
        name: "Banana AI Premium Service",
        amount: 1.00, // $1.00
        currency: "usd"
    });

    console.log("Result:", result);
}

testPayment();
