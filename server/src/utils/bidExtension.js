import { BID_EXTENSION_MS, BID_EXTENSION_WINDOW_MS } from 'shared/constants';

/**
 * Anti-snipe: extend endsAt when a bid lands in the final window.
 * Returns the (possibly new) end time.
 */
export function computeExtendedEndsAt(endsAt, now = new Date()) {
  const end = new Date(endsAt);
  const msRemaining = end.getTime() - now.getTime();
  if (msRemaining > 0 && msRemaining <= BID_EXTENSION_WINDOW_MS) {
    return new Date(now.getTime() + BID_EXTENSION_MS);
  }
  return end;
}
