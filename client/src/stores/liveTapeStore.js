import { create } from 'zustand';

/**
 * The last few bids placed anywhere on the site.
 *
 * This is a stream, not cached server state, which is why it lives here rather
 * than in React Query: there is no endpoint behind it to refetch or invalidate,
 * and nothing to reconcile. The socket delivers each bid exactly once and the
 * buffer forgets it a few bids later.
 *
 * The tape only ever fills while a page is open. That is the accepted cost of
 * having no history endpoint: on a quiet board the tape stays hidden rather
 * than showing an empty panel where the activity was supposed to be.
 */

/** Deep enough to read as a feed, shallow enough not to push the board down. */
const TAPE_LIMIT = 6;

export const useLiveTapeStore = create((set) => ({
  entries: [],

  push: (entry) =>
    set((state) => {
      // A reconnect can redeliver, and a bid already on the tape is not news.
      // Returning the same state leaves the reference untouched, so nothing
      // subscribed to the store re-renders.
      if (!entry?.bidId) return state;
      if (state.entries.some((e) => e.bidId === entry.bidId)) return state;

      return { entries: [entry, ...state.entries].slice(0, TAPE_LIMIT) };
    }),
}));
