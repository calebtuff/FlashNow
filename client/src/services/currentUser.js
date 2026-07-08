import { getSessionUserId } from './authSession.js';

export function getCurrentUserId() {
  return getSessionUserId();
}
