import { SOCKET_EVENTS } from 'shared/constants';
import { getIo, auctionRoomId, userRoomId, liveFeedRoomId } from '../lib/socket.js';

export function emitBidUpdate(auctionId, payload) {
  const io = getIo();
  if (!io) return;
  io.to(auctionRoomId(auctionId)).emit(SOCKET_EVENTS.BID_UPDATE, payload);
  io.to(liveFeedRoomId()).emit(SOCKET_EVENTS.FEED_BID_UPDATE, {
    auctionId: payload.auctionId,
    currentBid: payload.currentBid,
    currentWinnerId: payload.currentWinnerId,
    previousWinnerId: payload.previousWinnerId ?? null,
    endsAt: payload.endsAt ?? null,
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
