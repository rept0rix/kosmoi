// filename: create_stripe_payment_link.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function createPaymentLink(productName, amount, currency) {
  try {
    const product = await stripe.products.create({
      name: productName,
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: amount, // Amount in cents
      currency: currency,
    });

    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      after_completion: {
        type: 'redirect',
        redirect: {
          url: 'https://example.com/success?session_id={CHECKOUT_SESSION_ID}',
        },
      },
    });

    console.log("Payment Link: ", paymentLink.url);
    return paymentLink.url;
  } catch (error) {
    console.error("Error creating payment link:", error);
    throw error;
  }
}

// Example usage:
createPaymentLink("One Dollar Insight", 100, "usd")
  .then(paymentLinkUrl => {
    console.log('Payment Link URL:', paymentLinkUrl);
  })
  .catch(error => {
    console.error('Error:', error);
  });
