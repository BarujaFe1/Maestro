import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, SUPABASE_AUTH_STORAGE_KEY } from '../lib/supabase';
import { getMyProfile, upsertMyProfileName } from '../services/db';
import { logError, logInfo, logWarn } from '../utils/logger';

const AuthContext = createContext(null);
const DEFAULT_ORG_CODE = process.env.EXPO_PUBLIC_ORG_JOIN_CODE || 'GEMVGS-2026';

function isInvalidRefreshError(errorLike) {
  const text = String(errorLike?.message || errorLike || '').toLowerCase();
  return text.includes('invalid refresh token') || (text.includes('refresh token') && text.includes('already used'));
}

async function clearLegacySupabaseSessions() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const legacyKeys = keys.filter((key) => {
      if (key === SUPABASE_AUTH_STORAGE_KEY) return true;
      return /^sb-.*-auth-token$/.test(key);
    });
    if (legacyKeys.length) {
      await AsyncStorage.multiRemove(legacyKeys);
      await logWarn('Auth storage cleaned', { keys: legacyKeys });
    }
  } catch (e) {
    await logError('Auth storage cleanup failed', e);
  }
}

async function ensureOrgMembership() {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const uid = authData?.user?.id;
    if (!uid) return;

    const { data: prof, error: e1 } = await supabase
      .from('profiles')
      .select('org_id')
      .eq('id', uid)
      .single();

    if (e1) return;
    if (prof?.org_id) return;

    if (DEFAULT_ORG_CODE) {
      const { error } = await supabase.rpc('join_org_by_code', { p_code: DEFAULT_ORG_CODE });
      if (error) {
        await logError('Auto join org failed', error, { code: DEFAULT_ORG_CODE });
      } else {
        await logInfo('Auto join org ok', { code: DEFAULT_ORG_CODE });
      }
    }
  } catch (e) {
    await logError('ensureOrgMembership failed', e);
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const ensureRef = useRef(null);

  const hydrateProfile = async () => {
    try {
      const p = await getMyProfile();
      setProfile(p || null);
      return p || null;
    } catch (e) {
      await logError('refreshProfile failed', e);
      setProfile(null);
      return null;
    }
  };

  const recoverInvalidSession = async (reason) => {
    await logWarn('Recovering invalid auth session', { reason: String(reason?.message || reason || '') });
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      // noop
    }
    await clearLegacySupabaseSessions();
    setSession(null);
    setProfile(null);
    ensureRef.current = null;
  };

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          if (isInvalidRefreshError(error)) {
            await recoverInvalidSession(error);
          } else {
            await logError('Auth getSession failed', error);
          }
        }

        if (!active) return;

        const nextSession = data?.session || null;
        setSession(nextSession);

        if (nextSession?.user) {
          await hydrateProfile();
          if (ensureRef.current !== nextSession.user.id) {
            ensureRef.current = nextSession.user.id;
            await ensureOrgMembership();
          }
        } else {
          setProfile(null);
        }
      } catch (e) {
        if (isInvalidRefreshError(e)) {
          await recoverInvalidSession(e);
        } else {
          await logError('Auth bootstrap failed', e);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      try {
        setSession(nextSession || null);

        if (event === 'SIGNED_OUT' || !nextSession?.user) {
          setProfile(null);
          ensureRef.current = null;
          return;
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') {
          await hydrateProfile();
          if (ensureRef.current !== nextSession.user.id) {
            ensureRef.current = nextSession.user.id;
            await ensureOrgMembership();
          }
        }
      } catch (e) {
        if (isInvalidRefreshError(e)) {
          await recoverInvalidSession(e);
        } else {
          await logError('Auth state change failed', e, { event });
        }
      }
    });

    return () => {
      active = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: String(email || '').trim(),
      password: String(password || ''),
    });
    if (error) throw error;
    setSession(data?.session || null);
    await hydrateProfile();
    await ensureOrgMembership();
    await logInfo('Auth signIn ok', { email: String(email || '').trim() });
    return data;
  };

  const signUp = async (email, password, fullName) => {
    const cleanEmail = String(email || '').trim();
    const cleanPassword = String(password || '');
    const cleanFullName = String(fullName || '').trim();

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: cleanPassword,
      options: {
        data: { full_name: cleanFullName || null },
      },
    });

    if (error) throw error;

    if (data?.session?.user) {
      setSession(data.session);
      if (cleanFullName) {
        try {
          await upsertMyProfileName(cleanFullName);
        } catch {
          // noop
        }
      }
      await hydrateProfile();
      await ensureOrgMembership();
    }

    await logInfo('Auth signUp ok', {
      email: cleanEmail,
      hasSession: !!data?.session,
    });

    return data;
  };

  const signInAnonymous = async () => {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;

    setSession(data?.session || null);
    await hydrateProfile();
    await ensureOrgMembership();
    await logInfo('Auth signInAnonymous ok', { hasSession: !!data?.session });
    return data;
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } finally {
      setSession(null);
      setProfile(null);
      ensureRef.current = null;
    }
  };

  const refreshProfile = async () => hydrateProfile();

  const saveProfileName = async (fullName) => {
    await upsertMyProfileName(fullName);
    return refreshProfile();
  };

  const value = useMemo(() => ({
    session,
    user: session?.user || null,
    profile,
    loading,
    signIn,
    signUp,
    signInAnonymous,
    signOut,
    refreshProfile,
    saveProfileName,
  }), [session, profile, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
