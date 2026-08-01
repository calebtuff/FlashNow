import { useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { SOCKET_EVENTS } from 'shared/constants';
import { connectSocket } from '../services/socket.js';
import { getCurrentUserId } from '../services/currentUser.js';
import { applyFeedAuctionEndPatch, applyFeedBidPatch } from '../utils/liveAuctionCache.js';

/**
 * App-wide listener for live auction feed events.
 * Mount once in Layout so Home, Search, My Bids, etc. stay in sync.
 */
export default function useLiveAuctionSync() {
  const queryClient = useQueryClient();

  const onFeedBid = useCallback(
    (payload) => {
      applyFeedBidPatch(queryClient, payload);

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
    [queryClient]
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
