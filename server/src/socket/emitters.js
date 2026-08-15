import { SOCKET_EVENTS } from 'shared/constants';
import { getIo, auctionRoomId, userRoomId, liveFeedRoomId } from '../lib/socket.js';

export function emitBidUpdate(auctionId, payload) {
  const io = getIo();
  if (!io) return;
  io.to(auctionRoomId(auctionId)).emit(SOCKET_EVENTS.BID_UPDATE, payload);
  // The feed copy goes to every connected client rather than to the people
  // watching this one lot, so it is built by hand rather than forwarded.
  //
  // The bidder is deliberately not in it. Their identity reaches the auction
  // room above, where it is seen by people already watching that lot; putting
  // it on the site-wide feed would publish who bids on what to everyone,
  // including signed-out visitors. The tape only needs to show that the market
  // is moving, which the amount and the lot say on their own.
  io.to(liveFeedRoomId()).emit(SOCKET_EVENTS.FEED_BID_UPDATE, {
    auctionId: payload.auctionId,
    currentBid: payload.currentBid,
    currentWinnerId: payload.currentWinnerId,
    previousWinnerId: payload.previousWinnerId ?? null,
    endsAt: payload.endsAt ?? null,

    // For the live tape. `bidId` is what lets a client discard a repeat.
    bidId: payload.bid?.id ?? null,
    amount: payload.bid?.amount ?? payload.currentBid ?? null,
    placedAt: payload.bid?.placedAt ? new Date(payload.bid.placedAt).toISOString() : null,
    title: payload.title ?? null,
  });
}

export function emitAuctionEnd(auctionId, payload) {
  const io = getIo();
  if (!io) return;
  io.to(auctionRoomId(auctionId)).emit(SOCKET_EVENTS.AUCTION_END, payload);
  io.to(liveFeedRoomId()).emit(SOCKET_EVENTS.FEED_AUCTION_END, payload);
}

export function emitNotificationToUser(userId, notification) {
  const io = getIo();
  if (!io || !userId) return;
  io.to(userRoomId(userId)).emit(SOCKET_EVENTS.NOTIFICATION, notification);
}
