export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',

  JOIN_AUCTION: 'auction:join',
  LEAVE_AUCTION: 'auction:leave',
  AUCTION_UPDATE: 'auction:update',
  AUCTION_END: 'auction:end',
  AUCTION_COUNTDOWN: 'auction:countdown',

  BID_PLACE: 'bid:place',
  BID_UPDATE: 'bid:update',
  BID_ERROR: 'bid:error',
  OUTBID: 'bid:outbid',

  CHAT_SEND: 'chat:send',
  CHAT_RECEIVE: 'chat:receive',
  CHAT_HISTORY: 'chat:history',
  CHAT_USER_MUTED: 'chat:user_muted',

  NOTIFICATION: 'notification',
};

export const API_ROUTES = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me',
  },
  USERS: {
    BASE: '/api/users',
    BY_ID: id => `/api/users/${id}`,
    PROFILE: '/api/users/profile',
  },
  AUCTIONS: {
    BASE: '/api/auctions',
    BY_ID: id => `/api/auctions/${id}`,
    MY_AUCTIONS: '/api/auctions/my',
    MY_BIDS: '/api/auctions/my-bids',
  },
  WALLET: {
    BASE: '/api/wallet',
    TOPUP: '/api/wallet/topup',
    WITHDRAW: '/api/wallet/withdraw',
    TRANSACTIONS: '/api/wallet/transactions',
  },
  CATEGORIES: {
    BASE: '/api/categories',
  },
  FEED: {
    BASE: '/api/feed',
  },
  SEARCH: {
    BASE: '/api/search',
  },
};

export const AUCTION_DURATIONS = [5, 10, 15];

export const MIN_BID_INCREMENT = 1;

/** If a bid lands within this window before endsAt, the auction is extended. */
export const BID_EXTENSION_WINDOW_MS = 60_000;

/** How long to extend the auction when anti-snipe triggers. */
export const BID_EXTENSION_MS = 60_000;

export const WALLET_LIMITS = {
  MIN_TOPUP: 5,
  MAX_TOPUP: 10000,
  MIN_WITHDRAW: 10,
};
