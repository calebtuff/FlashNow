function patchAuction(auction, patch) {
  if (!auction || auction.id !== patch.auctionId) return auction;
  const next = { ...auction, ...patch.fields };
  if (patch.incrementBidCount) {
    const prev = auction._count?.bids ?? 0;
    next._count = { ...auction._count, bids: prev + 1 };
  }
  return next;
}

function patchAuctionList(list, patch) {
  if (!Array.isArray(list)) return list;
  let changed = false;
  const next = list.map((auction) => {
    const updated = patchAuction(auction, patch);
    if (updated !== auction) changed = true;
    return updated;
  });
  return changed ? next : list;
}

export function applyFeedBidPatch(queryClient, payload) {
  const { auctionId, currentBid, currentWinnerId, endsAt } = payload;
  if (!auctionId) return;

  const fields = {
    currentBid,
    currentWinnerId,
    ...(endsAt ? { endsAt } : {}),
    status: 'live',
  };
  const patch = { auctionId, fields, incrementBidCount: true };

  queryClient.setQueryData(['auctions'], (old) => {
    if (!old?.auctions) return old;
    const auctions = patchAuctionList(old.auctions, patch);
    return auctions === old.auctions ? old : { ...old, auctions };
  });

  queryClient.setQueriesData({ queryKey: ['search'] }, (old) => {
    if (!old?.results) return old;
    const results = patchAuctionList(old.results, patch);
    return results === old.results ? old : { ...old, results };
  });

  queryClient.setQueriesData({ queryKey: ['my-bids'] }, (old) => {
    if (!old?.bids) return old;
    let changed = false;
    const bids = old.bids.map((bid) => {
      if (bid.auction?.id !== auctionId) return bid;
      changed = true;
      return {
        ...bid,
        auction: patchAuction(bid.auction, patch),
      };
    });
    return changed ? { ...old, bids } : old;
  });

  queryClient.setQueriesData({ queryKey: ['my-selling'] }, (old) => {
    if (!old?.auctions) return old;
    const auctions = patchAuctionList(old.auctions, patch);
    return auctions === old.auctions ? old : { ...old, auctions };
  });

  queryClient.setQueriesData({ queryKey: ['favorites'] }, (old) => {
    if (!old?.favorites) return old;
    let changed = false;
    const favorites = old.favorites.map((row) => {
      if (row.auction?.id !== auctionId) return row;
      changed = true;
      return { ...row, auction: patchAuction(row.auction, patch) };
    });
    return changed ? { ...old, favorites } : old;
  });

  queryClient.setQueriesData({ queryKey: ['profile-listings'] }, (old) => {
    if (!old?.auctions) return old;
    const auctions = patchAuctionList(old.auctions, patch);
    return auctions === old.auctions ? old : { ...old, auctions };
  });

  queryClient.setQueryData(['auction', auctionId], (old) => {
    if (!old?.auction) return old;
    return {
      ...old,
      auction: patchAuction(old.auction, { auctionId, fields, incrementBidCount: false }),
    };
  });
}

export function applyFeedAuctionEndPatch(queryClient, payload) {
  const { auctionId, status, currentBid, currentWinnerId } = payload;
  if (!auctionId) return;

  const fields = {
    status,
    ...(currentBid != null ? { currentBid } : {}),
    ...(currentWinnerId != null ? { currentWinnerId } : {}),
  };
  const patch = { auctionId, fields, incrementBidCount: false };

  queryClient.setQueryData(['auctions'], (old) => {
    if (!old?.auctions) return old;
    const auctions = patchAuctionList(old.auctions, patch);
    return auctions === old.auctions ? old : { ...old, auctions };
  });

  queryClient.setQueriesData({ queryKey: ['search'] }, (old) => {
    if (!old?.results) return old;
    const results = patchAuctionList(old.results, patch);
    return results === old.results ? old : { ...old, results };
  });

  queryClient.setQueriesData({ queryKey: ['my-bids'] }, (old) => {
    if (!old?.bids) return old;
    let changed = false;
    const bids = old.bids.map((bid) => {
      if (bid.auction?.id !== auctionId) return bid;
      changed = true;
      return { ...bid, auction: patchAuction(bid.auction, patch) };
    });
    return changed ? { ...old, bids } : old;
  });

  queryClient.setQueriesData({ queryKey: ['my-selling'] }, (old) => {
    if (!old?.auctions) return old;
    const auctions = patchAuctionList(old.auctions, patch);
    return auctions === old.auctions ? old : { ...old, auctions };
  });

  queryClient.setQueriesData({ queryKey: ['favorites'] }, (old) => {
    if (!old?.favorites) return old;
    let changed = false;
    const favorites = old.favorites.map((row) => {
      if (row.auction?.id !== auctionId) return row;
      changed = true;
      return { ...row, auction: patchAuction(row.auction, patch) };
    });
    return changed ? { ...old, favorites } : old;
  });

  queryClient.setQueriesData({ queryKey: ['profile-listings'] }, (old) => {
    if (!old?.auctions) return old;
    const auctions = patchAuctionList(old.auctions, patch);
    return auctions === old.auctions ? old : { ...old, auctions };
  });

  queryClient.setQueryData(['auction', auctionId], (old) => {
    if (!old?.auction) return old;
    return {
      ...old,
      auction: patchAuction(old.auction, patch),
    };
  });
}
