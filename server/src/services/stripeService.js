import prisma from '../lib/prisma.js';
import { topupSchema } from 'shared';
import { getClientUrl, getStripeClient } from '../lib/stripe.js';

function dollarsFromCents(amountCents) {
  return amountCents / 100;
}

export async function createWalletCheckoutSession(userId, userEmail, amountRaw) {
  const amount = typeof amountRaw === 'string' ? Number(amountRaw) : amountRaw;
  topupSchema.parse({ amount });

  const amountCents = Math.round(amount * 100);
  const stripe = getStripeClient();
  const clientUrl = getClientUrl();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (!user) {
    throw { httpCode: 404, httpMessage: 'User not found' };
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: userEmail || user.email,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'FlashNow wallet top-up',
            description: `Add ${amount.toFixed(2)} USD to your bidding wallet`,
          },
          unit_amount: amountCents,
        },
        quantity: 1,
      },
    ],
    metadata: {
      userId,
      amountCents: String(amountCents),
      purpose: 'wallet_topup',
    },
    success_url: `${clientUrl}/wallet?topup=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${clientUrl}/wallet?topup=cancelled`,
  });

  await prisma.stripePayment.create({
    data: {
      userId,
      stripeSessionId: session.id,
      amountCents,
      status: 'pending',
    },
  });

  return {
    url: session.url,
    sessionId: session.id,
  };
}

async function creditWalletFromCheckoutSession(session) {
  if (session.metadata?.purpose !== 'wallet_topup') {
    return { handled: false };
  }

  if (session.payment_status !== 'paid') {
    return { handled: true, skipped: true, reason: 'not_paid' };
  }

  const userId = session.metadata?.userId;
  const amountCents = Number(session.metadata?.amountCents);

  if (!userId || !Number.isFinite(amountCents) || amountCents <= 0) {
    throw new Error('Checkout session missing wallet top-up metadata');
  }

  const amount = dollarsFromCents(amountCents);

  const result = await prisma.$transaction(async (tx) => {
    const payment = await tx.stripePayment.findUnique({
      where: { stripeSessionId: session.id },
    });

    if (!payment) {
      throw new Error(`Stripe payment record not found for session ${session.id}`);
    }

    if (payment.status === 'succeeded') {
      return { alreadyProcessed: true, payment };
    }

    if (payment.userId !== userId) {
      throw new Error('Checkout session user mismatch');
    }

    if (payment.amountCents !== amountCents) {
      throw new Error('Checkout session amount mismatch');
    }

    const wallet = await tx.wallet.upsert({
      where: { userId },
      update: { balance: { increment: amount } },
      create: { userId, balance: amount, heldBalance: 0 },
    });

    const walletTransaction = await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'topup',
        amount,
        description: 'Stripe top-up',
      },
    });

    const updatedPayment = await tx.stripePayment.update({
      where: { id: payment.id },
      data: {
        status: 'succeeded',
        stripePaymentIntentId:
          typeof session.payment_intent === 'string'
            ? session.payment_intent
            : session.payment_intent?.id ?? payment.stripePaymentIntentId,
        walletTransactionId: walletTransaction.id,
      },
    });

    return { alreadyProcessed: false, payment: updatedPayment, walletTransaction };
  });

  return { handled: true, ...result };
}

export async function handleStripeWebhook(rawBody, signature) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    throw { httpCode: 500, httpMessage: 'Stripe webhook secret is not configured' };
  }

  const stripe = getStripeClient();
  const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

  switch (event.type) {
    case 'checkout.session.completed':
      return creditWalletFromCheckoutSession(event.data.object);
    case 'checkout.session.expired': {
      const session = event.data.object;
      await prisma.stripePayment.updateMany({
        where: { stripeSessionId: session.id, status: 'pending' },
        data: { status: 'expired' },
      });
      return { handled: true, expired: true };
    }
    default:
      return { handled: false, type: event.type };
  }
}

export async function getCheckoutSessionStatus(sessionId, userId) {
  if (!sessionId) {
    throw { httpCode: 400, httpMessage: 'session_id is required' };
  }

  const payment = await prisma.stripePayment.findUnique({
    where: { stripeSessionId: sessionId },
  });

  if (!payment || payment.userId !== userId) {
    throw { httpCode: 404, httpMessage: 'Checkout session not found' };
  }

  if (payment.status === 'succeeded') {
    return { status: 'succeeded', amountCents: payment.amountCents };
  }

  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status === 'paid') {
    await creditWalletFromCheckoutSession(session);
    const refreshed = await prisma.stripePayment.findUnique({
      where: { stripeSessionId: sessionId },
    });
    if (refreshed?.status === 'succeeded') {
      return { status: 'succeeded', amountCents: refreshed.amountCents };
    }
  }

  return { status: payment.status, amountCents: payment.amountCents };
}
