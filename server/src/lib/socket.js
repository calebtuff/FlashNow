let io = null;

export function setIo(instance) {
  io = instance;
}

export function getIo() {
  return io;
}

export function auctionRoomId(auctionId) {
  return `auction:${auctionId}`;
}

export function userRoomId(userId) {
  return `user:${userId}`;
}
