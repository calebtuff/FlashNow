import { useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { SOCKET_EVENTS } from 'shared/constants';
import { connectSocket } from '../services/socket.js';
import { getCurrentUserId } from '../services/currentUser.js';
import { applyFeedAuctionEndPatch, applyFeedBidPatch } from '../utils/liveAuctionCache.js';
import { useLiveTapeStore } from '../stores/liveTapeStore.js';

/**
 * App-wide listener for live auction feed events.
 * Mount once in Layout so Home, Search, My Bids, etc. stay in sync.
 */
export default function useLiveAuctionSync() {
  const queryClient = useQueryClient();
  const pushToTape = useLiveTapeStore((s) => s.push);

  const onFeedBid = useCallback(
    (payload) => {
      applyFeedBidPatch(queryClient, payload);

      // The same event feeds the live tape. It is mounted in Layout, so the
      // buffer fills from whatever page the viewer happens to be on and the
      // tape is already populated by the time they reach the board.
      if (payload.bidId && payload.title) {
        pushToTape({
          bidId: payload.bidId,
          auctionId: payload.auctionId,
          title: payload.title,
          amount: payload.amount,
          placedAt: payload.placedAt,
        });
      }

      const userId = getCurrentUserId();
      if (
        userId &&
        payload.previousWinnerId === userId &&
        payload.currentWinnerId !== userId
      ) {
        queryClient.invalidateQueries({ queryKey: ['wallet'] });
      } else if (userId && payload.currentWinnerId === userId) {
        queryClient.invalidateQueries({ queryKey: ['wallet'] });
      }
    },
    [queryClient, pushToTape]
  );

  const onFeedAuctionEnd = useCallback(
    (payload) => {
      applyFeedAuctionEndPatch(queryClient, payload);
      queryClient.invalidateQueries({ queryKey: ['my-bids'] });
      queryClient.invalidateQueries({ queryKey: ['my-selling'] });
    },
    [queryClient]
  );

  useEffect(() => {
    let active = true;
    let socket;

    (async () => {
      socket = await connectSocket();
      if (!active) return;
      socket.on(SOCKET_EVENTS.FEED_BID_UPDATE, onFeedBid);
      socket.on(SOCKET_EVENTS.FEED_AUCTION_END, onFeedAuctionEnd);
    })();

    return () => {
      active = false;
      if (socket) {
        socket.off(SOCKET_EVENTS.FEED_BID_UPDATE, onFeedBid);
        socket.off(SOCKET_EVENTS.FEED_AUCTION_END, onFeedAuctionEnd);
      }
    };
  }, [onFeedBid, onFeedAuctionEnd]);
}
