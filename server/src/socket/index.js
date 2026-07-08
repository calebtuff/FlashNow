import { Server } from 'socket.io';
import { setIo } from '../lib/socket.js';
import { registerAuctionHandlers } from './auctionRoom.js';

export function initSocket(httpServer, { allowedOrigins }) {
  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  setIo(io);

  io.on('connection', (socket) => {
    registerAuctionHandlers(socket);
  });

  return io;
}
