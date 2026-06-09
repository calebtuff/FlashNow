// Temporary current-user accessor until Supabase auth is added.
// Set VITE_DEV_USER_ID in client/.env to a real seeded users.id from the database.
// When auth lands, this is the only function that needs to change (read the session instead).
export function getCurrentUserId() {
  const id = import.meta.env.VITE_DEV_USER_ID;
  return id && String(id).trim() !== '' ? String(id) : null;
}
