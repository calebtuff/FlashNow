export const NOTIFICATION_TYPES = {
  OUTBID: 'outbid',
  AUCTION_WON: 'auction_won',
  AUCTION_SOLD: 'auction_sold',
  ENDING_SOON: 'ending_soon',
};

export const NOTIFICATION_TYPE_VALUES = Object.values(NOTIFICATION_TYPES);

/** Notify the current high bidder when an auction ends within this window. */
export const ENDING_SOON_WINDOW_MS = 15 * 60 * 1000;
