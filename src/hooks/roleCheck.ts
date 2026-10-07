import { useEffect, useState } from 'react';
import { supabase } from '../components/supabase';
import { useAuth } from './useAuth';

// One shared role check for the whole app.
//
// Before: main.tsx, App.tsx and each dashboard page called `check-volunteer`
// separately, one after another, and the public homepage was rendered while
// they waited -> the 1-2s "normal user screen" flash.
//
// Now:
//  - the role is fetched ONCE per login (concurrent callers share one request)
//  - it's cached in localStorage, so a refresh opens the right page instantly
//    and re-verifies in the background
//  - while the role is still unknown for a logged-in user we show a neutral
//    splash instead of the public site
//
// The cache only decides which SCREEN to show first. All data is still
// protected by Supabase RLS / the Edge Function, so a tampered cache can at
// most show an empty shell.

export interface RoleInfo {
  isAdmin: boolean;
  isVolunteer: boolean;
  role: string | null; // 'gate' or a committee name, for volunteers
}

interface CacheEntry {
  userId: string;
  info: RoleInfo;
}

const CACHE_KEY = 'mosaic-role-v1';
const NO_ROLE: RoleInfo = { isAdmin: false, isVolunteer: false, role: null };
const inflight = new Map<string, Promise<RoleInfo>>();

function readCache(): CacheEntry | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry;
    return parsed?.userId && parsed.info ? parsed : null;
  } catch {
    return null;
  }
}

function writeCache(entry: CacheEntry) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    /* storage unavailable - fine, just no instant refresh */
  }
}

function clearCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    /* ignore */
  }
}

// True if this browser probably has a logged-in session (or is mid-OAuth
// redirect), so it's worth holding the splash instead of flashing the site.
function hasStoredSession(): boolean {
  try {
    if (/access_token=|[?&]code=/.test(window.location.hash + window.location.search)) return true;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && /^sb-.+-auth-token$/.test(key)) return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

async function invokeOnce(): Promise<RoleInfo> {
  const { data, error } = await supabase.functions.invoke('check-volunteer');
  if (error) throw error;
  const isVolunteer = data?.isVolunteer === true;
  return {
    isAdmin: data?.isAdmin === true,
    isVolunteer,
    role: isVolunteer ? (data?.role ?? 'gate') : null,
  };
}

function fetchRole(userId: string): Promise<RoleInfo> {
  let p = inflight.get(userId);
  if (!p) {
    p = (async () => {
      try {
        return await invokeOnce();
      } catch {
        // one quick retry - event-day wifi is flaky
        await new Promise((r) => setTimeout(r, 700));
        return await invokeOnce();
      }
    })()
      .then((info) => {
        writeCache({ userId, info });
        return info;
      })
      .finally(() => {
        inflight.delete(userId);
      });
    inflight.set(userId, p);
  }
  return p;
}

export function useRole() {
  const { user, loading } = useAuth();
  const [entry, setEntry] = useState<CacheEntry | null>(readCache);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      clearCache();
      setEntry(null);
      setFailed(false);
      return;
    }
    let cancelled = false;
    setFailed(false);
    fetchRole(user.id)
      .then((info) => {
        if (!cancelled) setEntry({ userId: user.id, info });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id, loading]);

  // While auth is still resolving we trust the cache (optimistic); once it
  // resolves the cached role must belong to the logged-in user.
  const matches = !!entry && (loading || user?.id === entry.userId);
  const info: RoleInfo | null = matches ? entry!.info : failed ? NO_ROLE : null;
  const pending = info === null && (loading ? hasStoredSession() : !!user);

  return { user, loading, info, pending };
}