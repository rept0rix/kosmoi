// stripe_service.js
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_API_KEY);

async function createProduct(name, price, currency) {
  try {
    const product = await stripe.products.create({
      name: name,
    });

    const stripePrice = await stripe.prices.create({
      product: product.id,
      unit_amount: price * 100, // Prices in cents
      currency: currency,
    });

    console.log('Product created:', product.name, 'Price:', stripePrice.unit_amount / 100, stripePrice.currency);
    return {productId: product.id, priceId: stripePrice.id};
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
}

async function main() {
  if (process.argv[2] === 'create_product') {
    const name = process.argv[4];
    const price = parseFloat(process.argv[6]);
    const currency = process.argv[8];

    if (!name || isNaN(price) || !currency) {
      console.error('Usage: node stripe_service.js create_product --name=<name> --price=<price> --currency=<currency>');
      process.exit(1);
    }

    try {
      await createProduct(name, price, currency);
    } catch (error) {
      console.error('Failed to create product:', error);
      process.exit(1);
    }
  }
}

main();