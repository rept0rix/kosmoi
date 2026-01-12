
import Stripe from 'stripe';
import dotenv from 'dotenv';
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function testPaymentLink() {
    try {
        console.log('💰 Starting Operation One Dollar Test...');

        // 1. Create a Product
        console.log('Creating Product: One Dollar Verification Badge...');
        const product = await stripe.products.create({
            name: 'Kosmoi Verified Badge (Test)',
            description: 'Verification badge for Kosmoi Service Hub',
        });
        console.log('✅ Product Created:', product.id);

        // 2. Create a Price (35 THB ~ $1)
        console.log('Creating Price: 35 THB...');
        const price = await stripe.prices.create({
            currency: 'thb',
            unit_amount: 3500, // 35.00 THB
            product: product.id,
        });
        console.log('✅ Price Created:', price.id);

        // 3. Create Payment Link
        console.log('Generating Payment Link...');
        const paymentLink = await stripe.paymentLinks.create({
            line_items: [{ price: price.id, quantity: 1 }],
            after_completion: {
                type: 'redirect',
                redirect: { url: 'http://Kar1s-MacBook-Pro.local:5173/admin/success' }
            }
        });

        console.log('\n🎉 SUCCESS! Payment Link Generated:');
        console.log(paymentLink.url);

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testPaymentLink();
