import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { SOCKET_EVENTS } from 'shared/constants';
import { connectSocket } from '../services/socket.js';
import { getCurrentUserId } from '../services/currentUser.js';

export default function useAuctionSocket(auctionId) {
  const queryClient = useQueryClient();
  const userId = getCurrentUserId();
  const [outbidMessage, setOutbidMessage] = useState('');

  const patchFromBidUpdate = useCallback(
    (payload) => {
      if (!payload?.auctionId || payload.auctionId !== auctionId) return;

      queryClient.setQueryData(['auction', auctionId], (old) => {
        if (!old?.auction) return old;

        const prevBids = old.auction.bids ?? [];
        const incoming = payload.bid;
        const alreadyListed = incoming && prevBids.some((b) => b.id === incoming.id);
        const bids =
          incoming && !alreadyListed
            ? [{ ...incoming, amount: incoming.amount }, ...prevBids].slice(0, 20)
            : prevBids;

        const prevCount = old.auction._count?.bids ?? prevBids.length;
        const bidCount = incoming && !alreadyListed ? prevCount + 1 : prevCount;

        return {
          ...old,
          auction: {
            ...old.auction,
            currentBid: payload.currentBid,
            currentWinnerId: payload.currentWinnerId,
            endsAt: payload.endsAt ?? old.auction.endsAt,
            status: 'live',
            bids,
            _count: { ...old.auction._count, bids: bidCount },
          },
        };
      });

      if (userId && payload.previousWinnerId === userId && payload.currentWinnerId !== userId) {
        setOutbidMessage("You've been outbid!");
        queryClient.invalidateQueries({ queryKey: ['wallet'] });
      } else if (userId && payload.currentWinnerId === userId) {
        setOutbidMessage('');
        queryClient.invalidateQueries({ queryKey: ['wallet'] });
      }
    },
    [auctionId, queryClient, userId]
  );

  const patchFromAuctionEnd = useCallback(
    (payload) => {
      if (!payload?.auctionId || payload.auctionId !== auctionId) return;

      queryClient.setQueryData(['auction', auctionId], (old) => {
        if (!old?.auction) return old;
        return {
          ...old,
          auction: {
            ...old.auction,
            status: payload.status,
            currentBid: payload.currentBid ?? old.auction.currentBid,
            currentWinnerId: payload.currentWinnerId ?? old.auction.currentWinnerId,
          },
        };
      });
    },
    [auctionId, queryClient]
  );

  useEffect(() => {
    if (!auctionId) return undefined;

    let active = true;
    let socket;

    (async () => {
      socket = await connectSocket();
      if (!active) return;
      socket.emit(SOCKET_EVENTS.JOIN_AUCTION, { auctionId });
      socket.on(SOCKET_EVENTS.BID_UPDATE, patchFromBidUpdate);
      socket.on(SOCKET_EVENTS.AUCTION_END, patchFromAuctionEnd);
    })();

    return () => {
      active = false;
      if (socket) {
        socket.emit(SOCKET_EVENTS.LEAVE_AUCTION, { auctionId });
        socket.off(SOCKET_EVENTS.BID_UPDATE, patchFromBidUpdate);
        socket.off(SOCKET_EVENTS.AUCTION_END, patchFromAuctionEnd);
      }
    };
  }, [auctionId, patchFromBidUpdate, patchFromAuctionEnd]);

  return { outbidMessage };
}
