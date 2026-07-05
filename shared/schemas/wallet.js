import { z } from 'zod';

export const TRANSACTION_TYPE = {
  TOPUP: 'topup',
  HOLD: 'hold',
  RELEASE: 'release',
  DEBIT: 'debit',
  CREDIT: 'credit',
  REFUND: 'refund',
  WITHDRAW: 'withdraw',
};

export const transactionTypeSchema = z.enum([
  TRANSACTION_TYPE.TOPUP,
  TRANSACTION_TYPE.HOLD,
  TRANSACTION_TYPE.RELEASE,
  TRANSACTION_TYPE.DEBIT,
  TRANSACTION_TYPE.CREDIT,
  TRANSACTION_TYPE.REFUND,
  TRANSACTION_TYPE.WITHDRAW,
]);

export const walletSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  balance: z.number().min(0),
  heldBalance: z.number().min(0),
  updatedAt: z.coerce.date(),
});

export const walletTransactionSchema = z.object({
  id: z.string().uuid(),
  walletId: z.string().uuid(),
  type: transactionTypeSchema,
  amount: z.number().positive(),
  description: z.string().optional(),
  auctionId: z.string().uuid().nullable().optional(),
  createdAt: z.coerce.date(),
});

export const topupSchema = z.object({
  amount: z.number().positive().min(5).max(10000),
});

export const withdrawSchema = z.object({
  amount: z.number().positive(),
});
