export const processOneDollarPayment = async (productId: string, currency: string) => {
  console.log(`Processing payment for ${productId} in ${currency}...`);
  // Simulation of Stripe/Payment Gateway interaction
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ status: 'success', transactionId: 'TXN_' + Date.now(), timestamp: new Date().toISOString() });
    }, 800);
  });
};
