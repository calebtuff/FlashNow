import { handleStripeWebhook } from '../services/stripeService.js';

export async function stripeWebhook(req, res) {
  const signature = req.headers['stripe-signature'];

  if (!signature) {
    return res.status(400).json({ success: false, message: 'Missing Stripe signature' });
  }

  try {
    const result = await handleStripeWebhook(req.body, signature);
    return res.json({ success: true, received: true, ...result });
  } catch (error) {
    if (error?.httpCode) {
      return res.status(error.httpCode).json({ success: false, message: error.httpMessage });
    }
    console.error('stripeWebhook error:', error);
    return res.status(400).json({ success: false, message: error.message || 'Webhook error' });
  }
}
