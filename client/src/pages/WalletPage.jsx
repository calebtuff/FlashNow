import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Icon from '../components/Icon.jsx';
import { api } from '../services/api.js';
import { getCurrentUserId } from '../services/currentUser.js';
import { money } from '../utils/auction.js';

const TOPUP_MIN = 5;
const TOPUP_MAX = 10000;
const QUICK_AMOUNTS = [25, 50, 100];

const TYPE_LABELS = {
  topup: 'Top-up',
  hold: 'Bid hold',
  release: 'Outbid release',
  debit: 'Payment',
  credit: 'Sale proceeds',
  refund: 'Refund',
  withdraw: 'Withdrawal',
};

const CREDIT_TYPES = new Set(['topup', 'release', 'refund', 'credit']);

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function BalanceCard({ label, value, hint, highlight }) {
  return (
    <div
      className={[
        'rounded-2xl border p-5',
        highlight ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-200 bg-white',
      ].join(' ')}
    >
      <p className={`text-xs font-bold uppercase tracking-wide ${highlight ? 'text-neutral-300' : 'text-neutral-500'}`}>
        {label}
      </p>
      <p className={`mt-2 font-display text-2xl font-bold tracking-tight ${highlight ? 'text-white' : 'text-neutral-900'}`}>
        {money(value)}
      </p>
      {hint && (
        <p className={`mt-1 text-xs ${highlight ? 'text-neutral-400' : 'text-neutral-500'}`}>{hint}</p>
      )}
    </div>
  );
}

function BalanceSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {[1, 2, 3].map((k) => (
        <div key={k} className="h-28 animate-pulse rounded-2xl bg-neutral-200/80" />
      ))}
    </div>
  );
}

function TransactionRow({ tx }) {
  const isCredit = CREDIT_TYPES.has(tx.type);
  const label = TYPE_LABELS[tx.type] ?? tx.type;

  return (
    <div className="flex items-start gap-3 border-b border-neutral-100 py-4 last:border-0">
      <div
        className={[
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
          isCredit ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-600',
        ].join(' ')}
      >
        <Icon name={isCredit ? 'arrow_downward' : 'arrow_upward'} className="text-[20px]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-neutral-900">{label}</p>
        {tx.description && <p className="text-xs text-neutral-500">{tx.description}</p>}
        {tx.auction && (
          <Link
            to={`/auctions/${tx.auction.id}`}
            className="mt-0.5 block truncate text-xs font-semibold text-neutral-700 no-underline hover:underline"
          >
            {tx.auction.title}
          </Link>
        )}
        <p className="mt-1 text-xs text-neutral-400">{formatDate(tx.createdAt)}</p>
      </div>
      <p className={`shrink-0 font-display text-sm font-bold ${isCredit ? 'text-emerald-700' : 'text-neutral-900'}`}>
        {isCredit ? '+' : '−'}
        {money(tx.amount)}
      </p>
    </div>
  );
}

function FundForm({ title, hint, amount, onAmountChange, onSubmit, isPending, error, submitLabel, disabled }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <h2 className="font-headline text-lg font-extrabold text-neutral-900">{title}</h2>
      {hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
      <form
        className="mt-4 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <div>
          <label htmlFor={`${title}-amount`} className="block text-xs font-bold uppercase tracking-wide text-neutral-500">
            Amount (USD)
          </label>
          <input
            id={`${title}-amount`}
            type="number"
            min="1"
            step="1"
            inputMode="decimal"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            placeholder="0"
            className="mt-1.5 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm font-medium text-neutral-900 outline-none transition-colors focus:border-neutral-900"
          />
        </div>
        {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={disabled || isPending}
          className="w-full rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? 'Processing…' : submitLabel}
        </button>
      </form>
    </div>
  );
}

export default function WalletPage() {
  const userId = getCurrentUserId();
  const queryClient = useQueryClient();

  const [topupAmount, setTopupAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [topupError, setTopupError] = useState('');
  const [withdrawError, setWithdrawError] = useState('');

  const walletQuery = useQuery({
    queryKey: ['wallet', userId],
    queryFn: () => api.get('/wallet', { query: { userId } }),
    enabled: !!userId,
  });

  const transactionsQuery = useQuery({
    queryKey: ['wallet-transactions', userId],
    queryFn: () => api.get('/wallet/transactions', { query: { userId } }),
    enabled: !!userId,
  });

  const wallet = walletQuery.data?.wallet;
  const transactions = transactionsQuery.data?.transactions ?? [];

  const topup = useMutation({
    mutationFn: (amount) => api.post('/wallet/topup', { userId, amount }),
    onSuccess: () => {
      setTopupAmount('');
      setTopupError('');
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
    },
    onError: (err) => setTopupError(err?.message || 'Top-up failed.'),
  });

  const withdraw = useMutation({
    mutationFn: (amount) => api.post('/wallet/withdraw', { userId, amount }),
    onSuccess: () => {
      setWithdrawAmount('');
      setWithdrawError('');
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
    },
    onError: (err) => setWithdrawError(err?.message || 'Withdrawal failed.'),
  });

  function handleTopup() {
    setTopupError('');
    const amount = Number(topupAmount);
    if (topupAmount === '' || Number.isNaN(amount)) {
      setTopupError('Enter a valid amount.');
      return;
    }
    if (amount < TOPUP_MIN) {
      setTopupError(`Minimum top-up is ${money(TOPUP_MIN)}.`);
      return;
    }
    if (amount > TOPUP_MAX) {
      setTopupError(`Maximum top-up is ${money(TOPUP_MAX)}.`);
      return;
    }
    topup.mutate(amount);
  }

  function handleWithdraw() {
    setWithdrawError('');
    const amount = Number(withdrawAmount);
    const available = wallet?.availableBalance ?? 0;
    if (withdrawAmount === '' || Number.isNaN(amount)) {
      setWithdrawError('Enter a valid amount.');
      return;
    }
    if (amount <= 0) {
      setWithdrawError('Amount must be greater than 0.');
      return;
    }
    if (amount > available) {
      setWithdrawError('Amount exceeds your available balance.');
      return;
    }
    withdraw.mutate(amount);
  }

  const available = wallet?.availableBalance ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline text-3xl font-extrabold text-neutral-900">Wallet</h1>
        <p className="mt-1 text-sm text-neutral-600">Manage your balance for bidding on live auctions.</p>
      </div>

      {walletQuery.isError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
              {walletQuery.error?.message || 'Could not load wallet.'}
            </div>
          )}

          {walletQuery.isPending ? (
            <BalanceSkeleton />
          ) : wallet ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <BalanceCard label="Total balance" value={wallet.balance} />
              <BalanceCard
                label="Held for bids"
                value={wallet.heldBalance}
                hint="Reserved while you are the highest bidder"
              />
              <BalanceCard label="Available" value={wallet.availableBalance} highlight />
            </div>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3">
              <FundForm
                title="Add funds"
                hint="Dev top-up — Stripe payments coming later. Minimum $5."
                amount={topupAmount}
                onAmountChange={(v) => {
                  setTopupAmount(v);
                  setTopupError('');
                }}
                onSubmit={handleTopup}
                isPending={topup.isPending}
                error={topupError}
                submitLabel="Top up"
                disabled={topup.isPending}
              />
              <div className="flex flex-wrap gap-2 px-1">
                {QUICK_AMOUNTS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => {
                      setTopupAmount(String(a));
                      setTopupError('');
                    }}
                    className="rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-800 transition-colors hover:border-neutral-900"
                  >
                    {money(a)}
                  </button>
                ))}
              </div>
            </div>

            <FundForm
              title="Withdraw"
              hint="Withdraw from available balance only (not held funds)."
              amount={withdrawAmount}
              onAmountChange={(v) => {
                setWithdrawAmount(v);
                setWithdrawError('');
              }}
              onSubmit={handleWithdraw}
              isPending={withdraw.isPending}
              error={withdrawError}
              submitLabel="Withdraw"
              disabled={withdraw.isPending || available <= 0}
            />
          </div>

          <section className="rounded-2xl border border-neutral-200 bg-white p-5">
            <h2 className="font-headline text-lg font-extrabold text-neutral-900">Recent activity</h2>
            <p className="mt-1 text-xs text-neutral-500">Last 50 wallet transactions</p>

            {transactionsQuery.isError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
                {transactionsQuery.error?.message || 'Could not load transactions.'}
              </div>
            )}

            {transactionsQuery.isPending ? (
              <div className="mt-4 space-y-4">
                {[1, 2, 3, 4].map((k) => (
                  <div key={k} className="h-16 animate-pulse rounded-xl bg-neutral-100" />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="mt-8 rounded-xl border border-dashed border-neutral-200 px-6 py-12 text-center">
                <Icon name="receipt_long" className="text-[36px] text-neutral-300" />
                <p className="mt-2 font-headline text-base font-bold text-neutral-800">No activity yet</p>
                <p className="mt-1 text-sm text-neutral-600">Top up to start bidding on live auctions.</p>
              </div>
            ) : (
              <div className="mt-2">
                {transactions.map((tx) => (
                  <TransactionRow key={tx.id} tx={tx} />
                ))}
              </div>
            )}
          </section>
    </div>
  );
}
