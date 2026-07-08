import { SOCKET_EVENTS } from 'shared/constants';
import { auctionRoomId } from '../lib/socket.js';

export function registerAuctionHandlers(socket) {
  socket.on(SOCKET_EVENTS.JOIN_AUCTION, ({ auctionId, userId } = {}) => {
    if (!auctionId) return;
    socket.join(auctionRoomId(auctionId));
    if (userId) socket.join(`user:${userId}`);
  });

  socket.on(SOCKET_EVENTS.LEAVE_AUCTION, ({ auctionId, userId } = {}) => {
    if (auctionId) socket.leave(auctionRoomId(auctionId));
    if (userId) socket.leave(`user:${userId}`);
  });
}
