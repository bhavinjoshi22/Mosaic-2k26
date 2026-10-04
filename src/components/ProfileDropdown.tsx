import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { useAuth } from '../hooks/useAuth';

function useOutsideClick(ref: React.RefObject<HTMLElement>, onOutside: () => void) {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, onOutside]);
}

interface RegistrationInfo {
  ticket_id: string;
  entry_code: string;
  name: string;
  category: string;
}

// Registrations are looked up by the college email the person registered
// with — the registrations table has no user_id column, so this is the
// only reliable link between a Google-logged-in user and their ticket.
async function fetchRegistration(user: User): Promise<RegistrationInfo | null> {
  if (!user.email) return null;

  const { data, error } = await supabase
    .from('registrations')
    .select('ticket_id, entry_code, name, category')
    .eq('college_email', user.email)
    .maybeSingle();

  if (error || !data) return null;
  return data as RegistrationInfo;
}

export default function ProfileDropdown() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [registration, setRegistration] = useState<RegistrationInfo | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrChecked, setQrChecked] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useOutsideClick(ref, () => setOpen(false));

  if (!user) return null;

  const displayName =
    (user.user_metadata?.full_name as string) ||
    (user.user_metadata?.name as string) ||
    user.email ||
    'Account';
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;

  const handleShowQr = async () => {
    if (!qrChecked) {
      setQrLoading(true);
      const info = await fetchRegistration(user);
      setRegistration(info);
      setQrLoading(false);
      setQrChecked(true);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-[#D7E2EA]/15 bg-[#151515] px-2 py-1.5 pr-3 transition-colors hover:bg-[#D7E2EA]/10"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={displayName} className="h-7 w-7 rounded-full object-cover" />
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#D7E2EA]/15 text-xs font-semibold text-[#D7E2EA]">
            {displayName.charAt(0).toUpperCase()}
          </span>
        )}
        <span className="hidden max-w-[110px] truncate text-sm text-[#D7E2EA] sm:inline">{displayName}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-2xl border border-[#D7E2EA]/15 bg-[#0C0C0C] shadow-xl"
          >
            <div className="border-b border-[#D7E2EA]/15 px-4 py-3">
              <p className="truncate text-sm font-medium text-[#D7E2EA]">{displayName}</p>
              <p className="truncate text-xs text-[#D7E2EA]/50">{user.email}</p>
            </div>

            <button
              onClick={handleShowQr}
              className="flex w-full items-center justify-between px-4 py-3 text-sm text-[#D7E2EA] transition-colors hover:bg-[#D7E2EA]/10"
            >
              My Registration QR <span aria-hidden>›</span>
            </button>

            {qrChecked && (
              <div className="border-t border-[#D7E2EA]/15 px-4 py-4 text-center">
                {qrLoading ? (
                  <p className="text-xs text-[#D7E2EA]/50">Loading…</p>
                ) : registration ? (
                  <>
                    <div className="mx-auto inline-block rounded-2xl bg-white p-3">
                      <QRCodeSVG value={registration.entry_code} size={160} />
                    </div>
                    <p className="mt-3 font-mono text-sm tracking-[0.2em] text-[#D7E2EA]/70">
                      {registration.entry_code}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-widest text-[#D7E2EA]/50">
                      {registration.name} · {registration.category}
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-[#D7E2EA]/50">
                    No registration found for {user.email}. Register first to get your QR code.
                  </p>
                )}
              </div>
            )}

            <button
              onClick={signOut}
              className="flex w-full items-center justify-between border-t border-[#D7E2EA]/15 px-4 py-3 text-sm text-red-400 transition-colors hover:bg-[#D7E2EA]/10"
            >
              Log out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}