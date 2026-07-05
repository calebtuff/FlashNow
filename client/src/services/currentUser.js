// Temporary current-user accessor until Supabase auth is added.
// In local dev, falls back to the seeded demo buyer so wallet/bid pages work without .env setup.
// Override with VITE_DEV_USER_ID in client/.env if you want a different user.
const DEMO_BUYER_ID = '00000000-0000-0000-0000-000000000002';

export function getCurrentUserId() {
  const fromEnv = import.meta.env.VITE_DEV_USER_ID;
  if (fromEnv && String(fromEnv).trim() !== '') {
    return String(fromEnv).trim();
  }
  if (import.meta.env.DEV) {
    return DEMO_BUYER_ID;
  }
  return null;
}
