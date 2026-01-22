import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function createProductAndPrice() {
  try {
    const product = await stripe.products.create({
      name: 'Verified Business',
      description: 'One-dollar hook to onboard a business.',
    });

    const price = await stripe.prices.create({
      unit_amount: 100, // $1.00 in cents
      currency: 'usd',
      product: product.id,
    });

    console.log('Product ID:', product.id);
    console.log('Price ID:', price.id);

  } catch (error) {
    console.error('Error creating product and price:', error);
  }
}

createProductAndPrice();