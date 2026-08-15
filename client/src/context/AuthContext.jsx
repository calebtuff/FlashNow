import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { api } from '../services/api.js';
import { getAccessToken, setSessionUserId } from '../services/authSession.js';

const AuthContext = createContext(null);

async function syncAppUser(profile = {}) {
  const body = {};
  if (profile.username) body.username = profile.username;
  if (profile.displayName) body.displayName = profile.displayName;
  if (profile.phone !== undefined) body.phone = profile.phone;
  await api.post('/auth/sync', body);
  const res = await api.get('/users/me');
  return res.user;
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [appUser, setAppUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return undefined;
    }

    let mounted = true;

    async function handleSession(nextSession, profile) {
      setSession(nextSession);
      setSessionUserId(nextSession?.user?.id ?? null);

      if (!nextSession) {
        setAppUser(null);
        setLoading(false);
        return;
      }

      try {
        const user = await syncAppUser(profile);
        if (mounted) setAppUser(user);
      } catch (error) {
        console.error('Failed to sync app user:', error);
        if (mounted) setAppUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    supabase.auth.getSession().then(({ data: { session: initial } }) => {
      if (mounted) handleSession(initial);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (mounted) handleSession(nextSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      session,
      appUser,
      loading,
      isAuthenticated: Boolean(session),
      userId: session?.user?.id ?? null,
      async signIn(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setSession(data.session);
        setSessionUserId(data.session?.user?.id ?? null);
        const user = await syncAppUser();
        setAppUser(user);
        return user;
      },
      async signUp(email, password, profile = {}) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: profile.displayName,
              phone: profile.phone,
              username: profile.username,
            },
          },
        });
        if (error) throw error;
        if (!data.session) {
          throw new Error('Check your email to confirm your account, then sign in.');
        }
        setSession(data.session);
        setSessionUserId(data.session.user.id);
        const user = await syncAppUser(profile);
        setAppUser(user);
        return user;
      },
      async signOut() {
        await supabase.auth.signOut();
        setSession(null);
        setAppUser(null);
        setSessionUserId(null);
      },
      async refreshAppUser() {
        const res = await api.get('/users/me');
        setAppUser(res.user);
        return res.user;
      },
      getAccessToken,
    }),
    [session, appUser, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
