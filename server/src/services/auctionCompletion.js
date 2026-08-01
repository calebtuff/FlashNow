export async function creditSellerWallet(
  tx,
  { sellerId, amount, auctionId, description = 'Sale proceeds' }
) {
  let sellerWallet = await tx.wallet.findUnique({ where: { userId: sellerId } });
  if (!sellerWallet) {
    sellerWallet = await tx.wallet.create({
      data: { userId: sellerId, balance: 0, heldBalance: 0 },
    });
  }

  await tx.wallet.update({
    where: { id: sellerWallet.id },
    data: { balance: { increment: amount } },
  });

  await tx.walletTransaction.create({
    data: {
      walletId: sellerWallet.id,
      type: 'credit',
      amount,
      auctionId,
      description,
    },
  });
}

export async function releaseBidHold(
  tx,
  { userId, amount, auctionId, description = 'Outbid release' }
) {
  if (!userId || amount == null) return;

  const wallet = await tx.wallet.findUnique({ where: { userId } });
  if (!wallet) return;

  const held = Number(wallet.heldBalance);
  if (held < amount) return;

  await tx.wallet.update({
    where: { id: wallet.id },
    data: { heldBalance: { decrement: amount } },
  });

  await tx.walletTransaction.create({
    data: {
      walletId: wallet.id,
      type: 'release',
      amount,
      auctionId,
      description,
    },
  });
}

export async function debitBuyerFromHeldFunds(
  tx,
  { userId, amount, auctionId, description = 'Auction payment' }
) {
  const wallet = await tx.wallet.findUnique({ where: { userId } });
  if (!wallet) {
    return { ok: false, reason: 'wallet_missing' };
  }

  const balance = Number(wallet.balance);
  const held = Number(wallet.heldBalance);
  if (held < amount || balance < amount) {
    return { ok: false, reason: 'insufficient_funds' };
  }

  await tx.wallet.update({
    where: { id: wallet.id },
    data: {
      balance: { decrement: amount },
      heldBalance: { decrement: amount },
    },
  });

  await tx.walletTransaction.create({
    data: {
      walletId: wallet.id,
      type: 'debit',
      amount,
      auctionId,
      description,
    },
  });

  return { ok: true };
}

export async function debitBuyerDirect(
  tx,
  { userId, amount, auctionId, description = 'Buy now purchase' }
) {
  let wallet = await tx.wallet.findUnique({ where: { userId } });
  if (!wallet) {
    wallet = await tx.wallet.create({
      data: { userId, balance: 0, heldBalance: 0 },
    });
  }

  const available = Number(wallet.balance) - Number(wallet.heldBalance);
  if (available < amount) {
    return { ok: false, reason: 'insufficient_funds' };
  }

  await tx.wallet.update({
    where: { id: wallet.id },
    data: { balance: { decrement: amount } },
  });

  await tx.walletTransaction.create({
    data: {
      walletId: wallet.id,
      type: 'debit',
      amount,
      auctionId,
      description,
    },
  });

  return { ok: true };
}
