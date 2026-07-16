import { Server } from 'socket.io';
import { verifyAccessToken } from '../middleware/auth.js';
import { setIo, userRoomId } from '../lib/socket.js';
import { registerAuctionHandlers } from './auctionRoom.js';

export function initSocket(httpServer, { allowedOrigins }) {
  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  setIo(io);

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (token) {
        socket.data.user = await verifyAccessToken(token);
      }
    } catch {
      // Allow anonymous viewers; user-specific features need a valid token
    }
    next();
  });

  io.on('connection', (socket) => {
    const userId = socket.data.user?.id;
    if (userId) {
      socket.join(userRoomId(userId));
    }
    registerAuctionHandlers(socket);
  });

  return io;
}
