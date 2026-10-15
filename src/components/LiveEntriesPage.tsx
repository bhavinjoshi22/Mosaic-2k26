import { useEffect, useRef, useState } from 'react';
import { supabase } from './supabase'; // adjust path if this file lives elsewhere
import { useAuth } from '../hooks/useAuth';
import { useRole } from '../hooks/roleCheck';

interface LiveCheckin {
  id: string;
  name: string;
  year: string | null;
  branch: string | null;
  div: string | null;
  category: string;
  checked_in_at: string;
  payment_method: 'cash' | 'upi' | null;
  note: string | null;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

// One table row. Payment and Note are editable here. The database function
// update_checkin_details only lets committee volunteers change rows that
// belong to their own committee, so this is enforced server-side as well.
function CheckinRow({
  c,
  index,
  total,
  flash,
  onSaved,
}: {
  c: LiveCheckin;
  index: number;
  total: number;
  flash: boolean;
  onSaved: (id: string, payment: 'cash' | 'upi' | null, note: string | null) => void;
}) {
  const [payment, setPayment] = useState<string>(c.payment_method ?? '');
  const [note, setNote] = useState<string>(c.note ?? '');
  const [savedNote, setSavedNote] = useState<string>(c.note ?? '');
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const editingNote = useRef(false);

  // Pick up edits made by another volunteer of the same committee (via
  // realtime), but never overwrite what this person is typing right now.
  useEffect(() => {
    setPayment(c.payment_method ?? '');
    if (!editingNote.current) {
      setNote(c.note ?? '');
      setSavedNote(c.note ?? '');
    }
  }, [c.payment_method, c.note]);

  async function save(nextPayment: string, nextNote: string) {
    setStatus('saving');
    setErrorMsg(null);

    const cleanNote = nextNote.trim() || null;
    const cleanPayment = (nextPayment || null) as 'cash' | 'upi' | null;

    const { error } = await supabase.rpc('update_checkin_details', {
      p_id: c.id,
      p_payment_method: cleanPayment,
      p_note: cleanNote,
    });

    if (error) {
      setStatus('error');
      setErrorMsg(error.message);
      return;
    }

    setSavedNote(nextNote);
    onSaved(c.id, cleanPayment, cleanNote);
    setStatus('saved');
    setTimeout(() => setStatus((s) => (s === 'saved' ? 'idle' : s)), 1500);
  }

  return (
    <tr style={flash ? styles.trFlash : undefined}>
      <td style={styles.tdMuted}>{total - index}</td>
      <td style={styles.tdName}>{c.name}</td>
      <td style={styles.td}>{c.category}</td>
      <td style={styles.td}>{c.year ?? '—'}</td>
      <td style={styles.td}>{c.branch ?? '—'}</td>
      <td style={styles.td}>{c.div ?? '—'}</td>
      <td style={styles.tdMuted}>
        {new Date(c.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </td>
      <td style={styles.td}>
        <select
          value={payment}
          onChange={(e) => {
            setPayment(e.target.value);
            void save(e.target.value, note);
          }}
          style={styles.select}
        >
          <option value="">Not set</option>
          <option value="cash">Cash</option>
          <option value="upi">UPI</option>
        </select>
      </td>
      <td style={styles.td}>
        <input
          type="text"
          value={note}
          maxLength={500}
          placeholder="Add a note…"
          onFocus={() => {
            editingNote.current = true;
          }}
          onChange={(e) => setNote(e.target.value)}
          onBlur={() => {
            editingNote.current = false;
            if (note !== savedNote) void save(payment, note);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          }}
          style={styles.noteInput}
        />
        <div style={styles.saveStatus}>
          {status === 'saving' && 'Saving…'}
          {status === 'saved' && 'Saved ✓'}
          {status === 'error' && <span style={{ color: '#f87171' }}>{errorMsg ?? 'Save failed'}</span>}
        </div>
      </td>
    </tr>
  );
}

export default function LiveEntriesPage() {
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const { info, pending } = useRole();
  const role: string | null = info?.isVolunteer ? (info.role ?? null) : null;
  const roleChecked = !!info || !pending;
  const [checkins, setCheckins] = useState<LiveCheckin[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [flashId, setFlashId] = useState<string | null>(null);

  useEffect(() => {
    if (!role || role === 'gate' || !user) return;

    let cancelled = false;

    supabase
      .from('event_checkins')
      .select('id, name, year, category, branch, div, checked_in_at, payment_method, note')
      .eq('committee', role)
      .order('checked_in_at', { ascending: false })
      .limit(1000)
      .then(({ data }) => {
        if (cancelled || !data) return;
        setCheckins(data as LiveCheckin[]);
        setLoaded(true);
      });

    const channel = supabase
      .channel(`event_checkins-live-${role}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'event_checkins', filter: `committee=eq.${role}` },
        (payload) => {
          const row = payload.new as LiveCheckin;
          setCheckins((prev) => (prev.some((c) => c.id === row.id) ? prev : [row, ...prev]));
          setFlashId(row.id);
          setTimeout(() => setFlashId((cur) => (cur === row.id ? null : cur)), 1800);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'event_checkins', filter: `committee=eq.${role}` },
        (payload) => {
          const row = payload.new as LiveCheckin;
          setCheckins((prev) => prev.map((c) => (c.id === row.id ? { ...c, ...row } : c)));
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [role, user?.id]);

  function handleSaved(id: string, payment: 'cash' | 'upi' | null, note: string | null) {
    setCheckins((prev) =>
      prev.map((c) => (c.id === id ? { ...c, payment_method: payment, note } : c))
    );
  }

  // ---------- auth / role gates ----------

  if ((authLoading && !info) || !roleChecked) {
    return <div style={styles.centered}>Loading…</div>;
  }

  if (!user && !authLoading) {
    return (
      <div style={styles.centered}>
        <h1 style={styles.gateTitle}>Login Required</h1>
        <p style={styles.gateText}>Log in with your committee volunteer Google account.</p>
        <button onClick={signInWithGoogle} style={styles.loginButton}>
          Continue with Google
        </button>
      </div>
    );
  }

  if (!role) {
    return (
      <div style={styles.centered}>
        <h1 style={styles.gateTitle}>Not Authorized</h1>
        <p style={styles.gateText}>This Google account isn't on the volunteer list.</p>
      </div>
    );
  }

  if (role === 'gate') {
    return (
      <div style={styles.centered}>
        <h1 style={styles.gateTitle}>No Registration List for Gate</h1>
        <p style={styles.gateText}>Gate volunteers don't have a committee registration list.</p>
      </div>
    );
  }

  // ---------- committee table (committee volunteers only) ----------

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.liveDot} />
          <span style={styles.liveLabel}>LIVE</span>
        </div>
        <h1 style={styles.committeeName}>{role} — Registrations</h1>
        <span style={styles.countBadge}>{loaded ? checkins.length : '…'}</span>
      </div>

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>#</th>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Category</th>
              <th style={styles.th}>Year</th>
              <th style={styles.th}>Branch</th>
              <th style={styles.th}>Division</th>
              <th style={styles.th}>Checked in</th>
              <th style={styles.th}>Payment</th>
              <th style={styles.th}>Note</th>
            </tr>
          </thead>
          <tbody>
            {loaded && checkins.length === 0 && (
              <tr>
                <td style={styles.tdEmpty} colSpan={9}>
                  Waiting for the first check-in…
                </td>
              </tr>
            )}
            {checkins.map((c, i) => (
              <CheckinRow
                key={c.id}
                c={c}
                index={i}
                total={checkins.length}
                flash={flashId === c.id}
                onSaved={handleSaved}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#0C0C0C',
    color: '#EAEAEA',
    fontFamily: 'system-ui, sans-serif',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '18px 24px',
    borderBottom: '1px solid #262626',
    position: 'sticky',
    top: 0,
    background: '#0C0C0C',
    zIndex: 1,
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 8 },
  liveDot: {
    width: 9,
    height: 9,
    borderRadius: 999,
    background: '#4ade80',
    boxShadow: '0 0 0 4px rgba(74,222,128,0.18)',
  },
  liveLabel: { fontSize: 11, fontWeight: 800, letterSpacing: 2, color: '#4ade80' },
  committeeName: { flex: 1, fontSize: 18, fontWeight: 700, textTransform: 'uppercase', margin: 0, letterSpacing: 0.3 },
  countBadge: {
    fontSize: 13,
    fontWeight: 800,
    color: '#0C0C0C',
    background: '#E3A24C',
    borderRadius: 999,
    padding: '3px 12px',
  },
  tableWrap: { flex: 1, overflow: 'auto', padding: '0 24px 40px' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  th: {
    textAlign: 'left',
    padding: '10px 12px',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: '#A3A3A3',
    borderBottom: '1px solid #2a2a2a',
    position: 'sticky',
    top: 0,
    background: '#0C0C0C',
  },
  td: { padding: '10px 12px', borderBottom: '1px solid #1a1a1a', verticalAlign: 'top' },
  tdName: { padding: '10px 12px', borderBottom: '1px solid #1a1a1a', fontWeight: 600, verticalAlign: 'top' },
  tdMuted: {
    padding: '10px 12px',
    borderBottom: '1px solid #1a1a1a',
    color: '#737373',
    fontVariantNumeric: 'tabular-nums',
    verticalAlign: 'top',
  },
  tdEmpty: { padding: '40px 12px', textAlign: 'center', color: '#737373' },
  trFlash: { backgroundColor: 'rgba(227,162,76,0.12)', transition: 'background-color 0.6s ease' },
  select: {
    background: '#151515',
    border: '1px solid #333',
    borderRadius: 8,
    padding: '7px 10px',
    color: '#EAEAEA',
    fontSize: 13,
  },
  noteInput: {
    width: '100%',
    minWidth: 200,
    background: '#151515',
    border: '1px solid #333',
    borderRadius: 8,
    padding: '7px 10px',
    color: '#EAEAEA',
    fontSize: 13,
  },
  saveStatus: { fontSize: 11, color: '#737373', marginTop: 4, minHeight: 14 },
  centered: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 20,
    textAlign: 'center',
    background: '#0C0C0C',
    color: '#EAEAEA',
    fontFamily: 'system-ui, sans-serif',
  },
  gateTitle: { fontSize: 22, fontWeight: 700 },
  gateText: { fontSize: 14, color: '#A3A3A3', maxWidth: 360 },
  loginButton: {
    background: '#E3A24C',
    color: '#0C0C0C',
    border: 'none',
    borderRadius: 8,
    padding: '12px 24px',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
  },
};