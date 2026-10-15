import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { supabase } from './supabase'; // adjust path if this file lives elsewhere
import { useAuth } from '../hooks/useAuth'; // same hook the rest of the app uses
import { useRole } from '../hooks/roleCheck';

// This page is completely self-contained — it doesn't import or touch any
// other component in the app (SideNav, HeroSection, RegisterSection, etc.),
// and nothing else in the app imports this file, other than reusing the
// existing useAuth hook for Google login. Wire it in via a path check in
// main.tsx (see the setup notes) so it can't affect anything else.
//
// NOTE: logging in with Google here does NOT make someone a volunteer —
// the scan-lookup Edge Function separately checks their email against the
// `volunteers` allow-list table. Anyone can reach this page and log in,
// but only allow-listed emails can actually look up a registration.

interface ScanResult {
  registration: {
    name: string;
    college_email: string;
    mobile: string;
    category: string;
    year: string | null;
    div: string | null;
  branch: string | null;
    ticket_id: string;
    entry_code: string;

  };
  collegeIdPhotoUrl: string | null;
  personPhotoUrl: string | null;
  alreadyCheckedIn: boolean;
  // 'gate' for main-entrance volunteers, or a committee name (e.g. 'CODEX')
  scannerRole: string;
  // Whether this person has already passed the main gate — informational
  // only for committee volunteers, never blocks their own scan.
  enteredAtGate: boolean;
}

const SCANNER_ELEMENT_ID = 'volunteer-qr-reader';

interface LiveCheckin {
  id: string;
  name: string;
  year: string | null;
  category: string;
  checked_in_at: string;
}

export default function VolunteerScanPage() {
  const { user, loading: authLoading, signInWithGoogle, signOut } = useAuth();

  // Role comes from the shared, cached check (see hooks/useRole.ts) —
  // no second check-volunteer round trip, and refreshes open instantly.
  const { info, pending } = useRole();
  const isVolunteer: boolean | null = info ? info.isVolunteer : pending ? null : false;
  // 'gate' or a committee name
  const role: string | null = info?.isVolunteer ? (info.role ?? 'gate') : null;

  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [manualTicketId, setManualTicketId] = useState('');

  // Live, realtime list of this committee's own check-ins — empty/unused
  // for the gate role (RLS wouldn't return any rows for it anyway).
  const [liveCheckins, setLiveCheckins] = useState<LiveCheckin[]>([]);
  const [liveLoaded, setLiveLoaded] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);

  async function cleanupScanner(scanner: Html5Qrcode) {
    await scanner.stop().catch(() => {});
    try {
      scanner.clear();
    } catch {
      // The scanner may already be cleared by another cleanup path.
    }
  }

  // Logged out: reset everything tied to the previous session.
  useEffect(() => {
    if (authLoading || user) return;
    setResult(null);
    setLookupError(null);
    setLiveCheckins([]);
    setLiveLoaded(false);
  }, [user, authLoading]);

  // Logged in but not on the volunteer list: nothing to offer here, send
  // them to the normal site.
  useEffect(() => {
    if (!authLoading && user && info && !info.isVolunteer) {
      window.location.href = '/';
    }
  }, [user, authLoading, info]);

  // Once we know this volunteer's committee, load their existing
  // check-ins and then subscribe to new ones live. RLS (see
  // add-live-committee-feed.sql) guarantees this only ever returns rows
  // for THIS committee — gate volunteers' `role` matches no committee, so
  // this naturally fetches/streams nothing for them.
  useEffect(() => {
    if (!role || role === 'gate' || !user) return;

    let cancelled = false;

    supabase
      .from('event_checkins')
      .select('id, name, year, category, checked_in_at')
      .eq('committee', role)
      .order('checked_in_at', { ascending: false })
      .limit(200)
      .then(({ data }) => {
        if (cancelled || !data) return;
        setLiveCheckins(data as LiveCheckin[]);
        setLiveLoaded(true);
      });

    const channel = supabase
      .channel(`event_checkins-${role}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'event_checkins', filter: `committee=eq.${role}` },
        (payload) => {
          const row = payload.new as LiveCheckin;
          setLiveCheckins((prev) => (prev.some((c) => c.id === row.id) ? prev : [row, ...prev]));
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [role, user?.id]);

  async function handleLogout() {
    stopScanner();
    await signOut();
  }

  function startScanner() {
    setResult(null);
    setLookupError(null);
    setScanning(true);
  }

  async function stopScanner() {
    const scanner = scannerRef.current;
    if (scanner) {
      await cleanupScanner(scanner);
      if (scannerRef.current === scanner) scannerRef.current = null;
    }
    setScanning(false);
  }

  // Mount/unmount the actual camera scanner whenever `scanning` toggles on.
  useEffect(() => {
    if (!scanning) return;

    const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
    scannerRef.current = scanner;
    let disposed = false;

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 260, height: 260 } },
        async (decodedText) => {
          if (disposed) return;
          // Stop immediately on first successful read so it doesn't keep
          // firing while the result is being looked up / displayed.
          await cleanupScanner(scanner);
          if (scannerRef.current === scanner) scannerRef.current = null;
          setScanning(false);
          await lookupTicket(decodedText);
        },
        () => {
          // Fires continuously while no QR is in frame — intentionally
          // ignored, this isn't an error worth surfacing.
        }
      )
      .catch((err) => {
        if (disposed) return;
        setLookupError(`Camera error: ${err}`);
        setScanning(false);
      });

    return () => {
      disposed = true;
      if (scannerRef.current === scanner) scannerRef.current = null;
      void cleanupScanner(scanner);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanning]);

  async function lookupTicket(ticketId: string) {
    setLookupError(null);
    const { data, error } = await supabase.functions.invoke('scan-lookup', {
      body: { ticketId, markCheckedIn: false },
    });
    if (error) {
      setLookupError(error.message);
      return;
    }
    if (data?.error) {
      setLookupError(data.error);
      return;
    }
    setResult(data as ScanResult);
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!manualTicketId.trim()) return;
    setResult(null);
    await lookupTicket(manualTicketId.trim());
  }

  const confirmationLockRef = useRef(false);

async function confirmEntry() {
  if (!result || confirming || confirmationLockRef.current) return;

  confirmationLockRef.current = true;
  setConfirming(true);
  setLookupError(null);

  try {
    const { data, error } = await supabase.functions.invoke(
      'scan-lookup',
      {
        body: {
          ticketId: result.registration.entry_code,
          markCheckedIn: true,
        },
      }
    );

    if (error) {
      throw new Error(error.message);
    }

    if (!data || data.error) {
      throw new Error(data?.error || 'Check-in failed. Please try again.');
    }

    // Fetch the latest status after the check-in request.
    const { data: refreshed, error: refreshError } =
      await supabase.functions.invoke('scan-lookup', {
        body: {
          ticketId: result.registration.entry_code,
          markCheckedIn: false,
        },
      });

    if (refreshError) {
      // The check-in request succeeded; keep its response visible.
      setResult(data as ScanResult);
      setLookupError(
        'Check-in request succeeded, but status could not be refreshed. Please verify before retrying.'
      );
      return;
    }

    if (!refreshed || refreshed.error) {
      setResult(data as ScanResult);
      setLookupError(
        'Please verify the entry status before retrying.'
      );
      return;
    }

    setResult(refreshed as ScanResult);

    if (!refreshed.alreadyCheckedIn) {
      setLookupError(
        'The check-in was not confirmed. Please check the backend response.'
      );
    }
  } catch (err) {
    setLookupError(
      err instanceof Error
        ? err.message
        : 'Unable to complete check-in. Please try again.'
    );
  } finally {
    confirmationLockRef.current = false;
    setConfirming(false);
  }
}
  // ---------- render ----------

  if (authLoading && !info) {
    return <div style={styles.centered}>Loading…</div>;
  }

  if (!user && !authLoading) {
    return (
      <div style={styles.centered}>
        <h1 style={styles.title}>Volunteer Login</h1>
        <p style={styles.detail}>Log in with the Google account that's been authorized for entry scanning.</p>
        <button onClick={signInWithGoogle} style={styles.button}>
          Continue with Google
        </button>
      </div>
    );
  }

  if (isVolunteer !== true) {
    // Either still checking, or check-volunteer already kicked off the
    // redirect to '/' for a non-volunteer — either way, nothing to show.
    return <div style={styles.centered}>Loading…</div>;
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <span style={styles.headerText}>
          {role === 'gate' ? 'Gate Entry Scanner' : `${role} · Committee Scanner`}
        </span>
        <button onClick={handleLogout} style={styles.logoutButton}>
          Log out
        </button>
      </div>

      <div style={styles.mainArea}>
        {role && role !== 'gate' && (
          <div style={styles.liveBox}>
            <button
              type="button"
              onClick={() => window.open(`${window.location.origin}/live`, '_blank', 'noopener')}
              style={styles.liveHeader}
            >
              <span style={styles.liveDot} />
              <span style={styles.liveTitle}>Live · {role} check-ins</span>
              <span style={styles.liveCount}>{liveLoaded ? liveCheckins.length : '…'}</span>
              <span style={styles.liveOpenHint}>View Registrations →</span>
            </button>
            <div style={styles.liveList}>
              {liveLoaded && liveCheckins.length === 0 && (
                <p style={styles.liveEmpty}>No one checked in yet</p>
              )}
              {liveCheckins.slice(0, 8).map((c) => (
                <div key={c.id} style={styles.liveRow}>
                  <div>
                    <div style={styles.liveName}>{c.name}</div>
                    <div style={styles.liveMeta}>
                      {c.category}
                      {c.year ? ` · ${c.year}` : ''}
                    </div>
                  </div>
                  <span style={styles.liveTime}>
                    {new Date(c.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Camera view replaces this spot while actively scanning */}
        {scanning ? (
          <div style={styles.scannerWrap}>
            <div id={SCANNER_ELEMENT_ID} style={styles.scannerBox} />
            <div style={styles.actionRow}>
              <button onClick={stopScanner} style={styles.secondaryButton}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div style={styles.scanButtonWrap}>
            <button onClick={startScanner} style={styles.scanButton}>
              <span style={styles.scanButtonIcon}>▢</span>
              {result ? 'Scan Next' : 'Start Scanning'}
            </button>
            {lookupError && <p style={styles.error}>{lookupError}</p>}

            {/* Permanent fallback for when scanning is unreliable (bad
                lighting, camera lag, glare) — the code is exactly what's
                encoded in the QR, so both paths hit the same lookup. */}
            <form onSubmit={handleManualSubmit} style={styles.manualForm}>
              <p style={styles.manualLabel}>Or enter their code</p>
              <div style={styles.manualRow}>
                <input
                  type="text"
                  value={manualTicketId}
                  onChange={(e) => setManualTicketId(e.target.value.toUpperCase())}
                  placeholder="e.g. 4F7B9K"
                  style={styles.manualInput}
                  maxLength={8}
                  autoCapitalize="characters"
                />
                <button type="submit" style={styles.secondaryButton}>
                  Look up
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Registration details — only once we have a result */}
        {result && (
          <div style={styles.detailsBox}>
            {result.alreadyCheckedIn && (
              <p style={styles.warning}>
                {result.scannerRole === 'gate'
                  ? '⚠ ALREADY CHECKED IN'
                  : `⚠ ALREADY MARKED PRESENT FOR ${result.scannerRole}`}
              </p>
            )}
            {/* Informational only — a committee volunteer can still mark
                attendance even if gate hasn't scanned this person yet
                (e.g. gate queue was backed up). Never shown for gate itself. */}
            {result.scannerRole !== 'gate' && !result.enteredAtGate && (
              <p style={styles.notice}>Not yet scanned at the main gate</p>
            )}
            <p style={styles.name}>{result.registration.name}</p>
<p style={styles.detail}>
  {result.registration.category}
  {result.registration.year ? ` · ${result.registration.year}` : ''}
  {result.registration.branch ? ` · ${result.registration.branch}` : ''}
  {result.registration.div ? ` · Div ${result.registration.div}` : ''}
</p>
<p style={styles.detail}>{result.registration.mobile}</p>
<p style={styles.detail}>{result.registration.college_email}</p>
          </div>
        )}

        {/* Photo boxes are always on screen — blank placeholders until a
            scan resolves, then the fetched photos fade into these exact
            same boxes rather than the layout jumping around. */}
        <div style={styles.photoRow}>
          <PhotoBox label="College ID" url={result?.collegeIdPhotoUrl ?? null} />
          <PhotoBox label="Person" url={result?.personPhotoUrl ?? null} />
        </div>

        {result && !result.alreadyCheckedIn && (
          <div style={styles.actionRow}>
            <button onClick={confirmEntry} disabled={confirming} style={styles.button}>
              {confirming
                ? 'Confirming…'
                : role === 'gate'
                  ? 'Confirm & Check In'
                  : `Mark Present · ${role}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function PhotoBox({ label, url }: { label: string; url: string | null }) {
  return (
    <div style={styles.photoBox}>
      <p style={styles.photoLabel}>{label}</p>
      <div style={styles.photoFrame}>
        {url ? (
          <img src={url} alt={label} style={styles.photo} />
        ) : (
          <span style={styles.photoPlaceholderIcon}>👤</span>
        )}
      </div>
    </div>
  );
}

// Plain inline styles on purpose — this page is deliberately minimal and
// isolated, no shared classNames/CSS from the rest of the site.
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#0C0C0C',
    color: '#EAEAEA',
    fontFamily: 'system-ui, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #262626',
  },
  headerText: { fontSize: 16, fontWeight: 600, letterSpacing: 1 },
  logoutButton: {
    background: 'transparent',
    border: '1px solid #444',
    color: '#EAEAEA',
    borderRadius: 8,
    padding: '6px 14px',
    cursor: 'pointer',
  },
  mainArea: {
    maxWidth: 480,
    margin: '0 auto',
    padding: '32px 20px 40px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 28,
  },
  centered: {
    minHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 20,
    textAlign: 'center',
  },
  title: { fontSize: 20, fontWeight: 700, marginBottom: 8, textAlign: 'center' },
  scanButtonWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  scanButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    background: '#E3A24C',
    color: '#0C0C0C',
    border: 'none',
    borderRadius: 16,
    padding: '18px 28px',
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: 0.5,
    cursor: 'pointer',
    width: '100%',
  },
  scanButtonIcon: { fontSize: 18 },
  manualForm: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    width: '100%',
  },
  manualLabel: { fontSize: 11, color: '#737373', textTransform: 'uppercase', letterSpacing: 0.5 },
  manualRow: { display: 'flex', gap: 8, width: '100%' },
  manualInput: {
    flex: 1,
    background: '#151515',
    border: '1px solid #333',
    borderRadius: 8,
    padding: '10px 12px',
    color: '#EAEAEA',
    fontSize: 13,
  },
  scannerWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
    width: '100%',
  },
  scannerBox: {
    width: 360,
    maxWidth: '94vw',
    borderRadius: 16,
    overflow: 'hidden',
    border: '1px solid #333',
  },
  button: {
    background: '#E3A24C',
    color: '#0C0C0C',
    border: 'none',
    borderRadius: 8,
    padding: '12px 20px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  secondaryButton: {
    background: 'transparent',
    border: '1px solid #444',
    color: '#EAEAEA',
    borderRadius: 8,
    padding: '10px 18px',
    fontSize: 14,
    cursor: 'pointer',
  },
  error: { color: '#f87171', fontSize: 13, textAlign: 'center' },
  warning: {
    color: '#fbbf24',
    fontWeight: 700,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  notice: {
    color: '#A3A3A3',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
  detailsBox: {
    width: '100%',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  name: { fontSize: 20, fontWeight: 700, marginBottom: 2 },
  detail: { fontSize: 13, color: '#A3A3A3' },
  photoRow: { display: 'flex', gap: 16, width: '100%' },
  photoBox: { flex: 1, textAlign: 'center' },
  photoLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#737373',
    marginBottom: 8,
  },
  photoFrame: {
    aspectRatio: '1',
    width: '100%',
    borderRadius: 14,
    border: '1.5px dashed #333',
    background: '#141414',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    transition: 'border-color 0.3s ease',
  },
  photoPlaceholderIcon: { fontSize: 36, opacity: 0.25 },
  photo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    animation: 'none',
  },
  actionRow: { display: 'flex', gap: 10, justifyContent: 'center', width: '100%' },
  liveBox: {
    width: '100%',
    border: '1px solid #262626',
    borderRadius: 14,
    background: '#121212',
    overflow: 'hidden',
  },
  liveHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 14px',
    borderBottom: '1px solid #222',
    width: '100%',
    background: 'transparent',
    border: 'none',
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: '#222',
    cursor: 'pointer',
    textAlign: 'left',
  },
  liveOpenHint: { fontSize: 10, color: '#737373', whiteSpace: 'nowrap' },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    background: '#4ade80',
    boxShadow: '0 0 0 3px rgba(74,222,128,0.18)',
  },
  liveTitle: { fontSize: 12, fontWeight: 600, letterSpacing: 0.4, color: '#D4D4D4', flex: 1 },
  liveCount: {
    fontSize: 12,
    fontWeight: 700,
    color: '#0C0C0C',
    background: '#E3A24C',
    borderRadius: 999,
    padding: '2px 9px',
    minWidth: 20,
    textAlign: 'center',
  },
  liveList: { maxHeight: 180, overflowY: 'auto' },
  liveEmpty: { fontSize: 12, color: '#737373', textAlign: 'center', padding: '14px 0' },
  liveRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 14px',
    borderBottom: '1px solid #1a1a1a',
  },
  liveName: { fontSize: 13, color: '#EAEAEA' },
  liveMeta: { fontSize: 11, color: '#737373', marginTop: 1 },
  liveTime: { fontSize: 11, color: '#737373' },
};