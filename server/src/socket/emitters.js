import { SOCKET_EVENTS } from 'shared/constants';
import { getIo, auctionRoomId, userRoomId } from '../lib/socket.js';

export function emitBidUpdate(auctionId, payload) {
  const io = getIo();
  if (!io) return;
  io.to(auctionRoomId(auctionId)).emit(SOCKET_EVENTS.BID_UPDATE, payload);
}

export function emitAuctionEnd(auctionId, payload) {
  const io = getIo();
  if (!io) return;
  io.to(auctionRoomId(auctionId)).emit(SOCKET_EVENTS.AUCTION_END, payload);
}

export function emitNotificationToUser(userId, notification) {
  const io = getIo();
  if (!io || !userId) return;
  io.to(userRoomId(userId)).emit(SOCKET_EVENTS.NOTIFICATION, notification);
}
