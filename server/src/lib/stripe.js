import Stripe from 'stripe';

let stripeClient;

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function isDevTopupAllowed() {
  if (!isStripeConfigured()) return true;
  return process.env.ENABLE_DEV_WALLET_TOPUP === 'true';
}

export function getStripeClient() {
  if (!isStripeConfigured()) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }

  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY.trim());
  }

  return stripeClient;
}

export function getClientUrl() {
  const raw = process.env.CLIENT_URL?.trim();
  if (raw) {
    return raw.split(',')[0].trim().replace(/\/$/, '');
  }
  return 'http://localhost:5173';
}
