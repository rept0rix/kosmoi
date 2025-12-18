import { Request, Response } from 'express';

interface OrderRequest {
  productId: string;
  paymentToken: string;
  currency: string;
  amount: number;
}

export const processOrder = async (req: Request, res: Response) => {
  try {
    const { productId, paymentToken, amount } = req.body as OrderRequest;

    // 1. Validate the Product
    if (productId !== 'samui-starter-pack') {
      return res.status(400).json({ error: 'Invalid Product ID' });
    }

    // 2. Validate Amount (Efficiency Check)
    if (amount !== 1) {
      return res.status(400).json({ error: 'Incorrect amount. Price is $1.' });
    }

    // 3. Mock Payment Gateway Interaction
    console.log(`Processing payment for ${productId} with token ${paymentToken}...`);
    // await paymentGateway.charge(token, amount);

    // 4. Delivery
    // In a real scenario, we would email the PDF/Link here.
    
    return res.status(200).json({
      success: true,
      message: 'Transaction verified. Samui Starter Pack delivered.',
      downloadUrl: 'https://kosmoi.com/assets/samui-starter-pack-v1.pdf'
    });

  } catch (error) {
    console.error('Transaction Failed:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};