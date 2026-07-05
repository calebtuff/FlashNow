import { SOCKET_EVENTS } from 'shared/constants';
import { getIo, auctionRoomId } from '../lib/socket.js';

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
