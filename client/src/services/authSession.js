import { supabase } from '../lib/supabase.js';

let cachedUserId = null;

export function setSessionUserId(id) {
  cachedUserId = id && String(id).trim() !== '' ? String(id) : null;
}

export function getSessionUserId() {
  return cachedUserId;
}

export async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
