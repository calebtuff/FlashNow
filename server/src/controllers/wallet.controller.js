import { ZodError } from 'zod';
import prisma from '../lib/prisma.js';
import { topupSchema, withdrawSchema } from 'shared';
import { isDevTopupAllowed, isStripeConfigured } from '../lib/stripe.js';
import {
  createWalletCheckoutSession,
  getCheckoutSessionStatus,
} from '../services/stripeService.js';

function getUserIdFromRequest(req) {
  return req.user?.id ?? null;
}

function formatWallet(wallet) {
  return {
    id: wallet.id,
    userId: wallet.userId,
    balance: parseFloat(wallet.balance),
    heldBalance: parseFloat(wallet.heldBalance),
    availableBalance: parseFloat(wallet.balance) - parseFloat(wallet.heldBalance),
    updatedAt: wallet.updatedAt,
  };
}

export const getWallet = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    let wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { userId, balance: 0, heldBalance: 0 },
      });
    }

    return res.json({
      success: true,
      wallet: formatWallet(wallet),
      payments: {
        mode: isStripeConfigured() ? 'stripe' : 'dev',
        devTopupAllowed: isDevTopupAllowed(),
      },
    });
  } catch (error) {
    console.error('getWallet error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch wallet' });
  }
};

export const getWalletTransactions = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      return res.json({ success: true, transactions: [] });
    }

    const transactions = await prisma.walletTransaction.findMany({
      where: { walletId: wallet.id },
      include: {
        auction: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return res.json({
      success: true,
      transactions: transactions.map(t => ({
        ...t,
        amount: parseFloat(t.amount),
      })),
    });
  } catch (error) {
    console.error('getWalletTransactions error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch transactions' });
  }
};

export const topupWallet = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    if (isStripeConfigured() && !isDevTopupAllowed()) {
      return res.status(403).json({
        success: false,
        message: 'Use Stripe checkout to add funds.',
      });
    }

    // Accept amount as number or numeric string (common from forms)
    const amountRaw = req.body?.amount;
    const amount = typeof amountRaw === 'string' ? Number(amountRaw) : amountRaw;

    topupSchema.parse({ amount });

    const wallet = await prisma.wallet.upsert({
      where: { userId },
      update: { balance: { increment: amount } },
      create: { userId, balance: amount, heldBalance: 0 },
    });

    await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'topup',
        amount,
        description: 'Wallet top-up',
      },
    });

    return res.json({ success: true, wallet: formatWallet(wallet) });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors,
      });
    }
    console.error('topupWallet error:', error);
    return res.status(500).json({ success: false, message: 'Failed to top up wallet' });
  }
};

export const withdrawWallet = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const amountRaw = req.body?.amount;
    const amount = typeof amountRaw === 'string' ? Number(amountRaw) : amountRaw;

    withdrawSchema.parse({ amount });

    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      return res.status(400).json({ success: false, message: 'Wallet not found' });
    }

    const available = parseFloat(wallet.balance) - parseFloat(wallet.heldBalance);
    if (amount > available) {
      return res.status(400).json({ success: false, message: 'Insufficient available balance' });
    }

    const updatedWallet = await prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: { decrement: amount } },
    });

    await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'withdraw',
        amount,
        description: 'Withdrawal',
      },
    });

    return res.json({ success: true, wallet: formatWallet(updatedWallet) });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors,
      });
    }
    console.error('withdrawWallet error:', error);
    return res.status(500).json({ success: false, message: 'Failed to withdraw funds' });
  }
};

export const createCheckoutSession = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    if (!isStripeConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Stripe is not configured on this server.',
      });
    }

    const amountRaw = req.body?.amount;
    const session = await createWalletCheckoutSession(userId, req.user?.email, amountRaw);

    return res.json({
      success: true,
      url: session.url,
      sessionId: session.sessionId,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors,
      });
    }
    if (error?.httpCode) {
      return res.status(error.httpCode).json({ success: false, message: error.httpMessage });
    }
    console.error('createCheckoutSession error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create checkout session' });
  }
};

export const getTopupSessionStatus = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    if (!isStripeConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Stripe is not configured on this server.',
      });
    }

    const sessionId = req.query.session_id;
    const status = await getCheckoutSessionStatus(sessionId, userId);

    return res.json({ success: true, ...status });
  } catch (error) {
    if (error?.httpCode) {
      return res.status(error.httpCode).json({ success: false, message: error.httpMessage });
    }
    console.error('getTopupSessionStatus error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch checkout status' });
  }
};

