import { useEffect, useMemo, useState } from 'react';
import { supabase } from './supabase'; // adjust path if this file lives elsewhere
import { useAuth } from '../hooks/useAuth';
import { useRole } from '../hooks/UseRole';

function useIsMobile(max = 640) {
  const [m, setM] = useState(() => typeof window !== 'undefined' && window.innerWidth < max);
  useEffect(() => {
    const on = () => setM(window.innerWidth < max);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, [max]);
  return m;
}

// Owner-only view: every committee's check-ins AND gate entries, live, in
// one place — plus full manual override controls (add, edit, delete a
// check-in; flip gate status). A committee volunteer's own screen only
// ever shows and can only ever write to THEIR OWN committee, through the
// scan-lookup Edge Function. This page is the one exception: direct, full
// read/write access, gated entirely by the `is_admin` column on this
// account's own `volunteers` row (see make-admin-only.sql) — not by
// anything in this component. It also opens automatically the moment this
// account logs in anywhere on the site (see the RootRoute change in
// main.tsx), not just at /admin.

const GATE_KEY = '__GATE__';

interface CheckinRow {
  id: string;
  name: string;
  committee: string;
  year: string | null;
  category: string;
  checked_in_at: string;
}

interface GateRow {
  entry_code: string;
  name: string;
  year: string | null;
  category: string;
  checked_in_at: string | null;
}

export default function AdminDashboardPage() {
  const { user, loading: authLoading, signInWithGoogle, signOut } = useAuth();
  const { info, pending } = useRole();
  const isAdmin: boolean | null = info ? info.isAdmin : pending ? null : false;
  const isMobile = useIsMobile();
  const S = (key: string, mobile?: React.CSSProperties): React.CSSProperties =>
    isMobile && mobile ? { ...styles[key], ...mobile } : styles[key];

  const [rows, setRows] = useState<CheckinRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [gateRows, setGateRows] = useState<GateRow[]>([]);
  const [gateLoaded, setGateLoaded] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);

  // manual "add a check-in" form
  const [addCode, setAddCode] = useState('');
  const [addCommittee, setAddCommittee] = useState('');
  const [addBusy, setAddBusy] = useState(false);
  const [addMessage, setAddMessage] = useState<string | null>(null);

  // inline edit of an existing check-in
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCommittee, setEditCommittee] = useState('');
  const [editYear, setEditYear] = useState('');
  const [editBusy, setEditBusy] = useState(false);

  // quick gate lookup by code (handy alongside the GATE tab's full list)
  const [gateCode, setGateCode] = useState('');
  const [gateLookup, setGateLookup] = useState<{ entry_code: string; name: string; checked_in: boolean } | null>(
    null
  );
  const [gateBusy, setGateBusy] = useState(false);
  const [gateMessage, setGateMessage] = useState<string | null>(null);

  // ───────── committee check-ins: initial load + live stream ─────────
  useEffect(() => {
    if (!isAdmin || !user) return;
    let cancelled = false;

    supabase
      .from('event_checkins')
      .select('id, name, committee, year, category, checked_in_at')
      .order('checked_in_at', { ascending: false })
      .limit(1000)
      .then(({ data }) => {
        if (cancelled || !data) return;
        setRows(data as CheckinRow[]);
        setLoaded(true);
      });

    const channel = supabase
      .channel('event_checkins-admin-all')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'event_checkins' }, (payload) => {
        const row = payload.new as CheckinRow;
        setRows((prev) => (prev.some((r) => r.id === row.id) ? prev : [row, ...prev]));
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'event_checkins' }, (payload) => {
        const row = payload.new as CheckinRow;
        setRows((prev) => prev.map((r) => (r.id === row.id ? row : r)));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'event_checkins' }, (payload) => {
        const oldRow = payload.old as { id: string };
        setRows((prev) => prev.filter((r) => r.id !== oldRow.id));
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [isAdmin, user?.id]);

  // ───────── gate entries: initial load + live stream ─────────
  // Needs `alter publication supabase_realtime add table public.registrations;`
  // (see enable-gate-realtime.sql) for the live part to work.
  useEffect(() => {
    if (!isAdmin || !user) return;
    let cancelled = false;

    supabase
      .from('registrations')
      .select('entry_code, name, year, category, checked_in, checked_in_at')
      .eq('checked_in', true)
      .order('checked_in_at', { ascending: false })
      .limit(1000)
      .then(({ data }) => {
        if (cancelled || !data) return;
        setGateRows(data as GateRow[]);
        setGateLoaded(true);
      });

    const channel = supabase
      .channel('registrations-admin-gate')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'registrations' }, (payload) => {
        const row = payload.new as GateRow & { checked_in: boolean };
        setGateRows((prev) => {
          const withoutRow = prev.filter((r) => r.entry_code !== row.entry_code);
          return row.checked_in ? [row, ...withoutRow] : withoutRow;
        });
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [isAdmin, user?.id]);

  async function handleLogout() {
    await signOut();
    window.location.href = '/';
  }

  const committeeCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rows) map.set(r.committee, (map.get(r.committee) ?? 0) + 1);
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const visibleRows = useMemo(
    () => (filter && filter !== GATE_KEY ? rows.filter((r) => r.committee === filter) : rows),
    [rows, filter]
  );

  // ───────── CRUD: committee check-ins ─────────

  async function handleDelete(id: string) {
    if (!confirm('Remove this check-in? This cannot be undone.')) return;
    const { error } = await supabase.from('event_checkins').delete().eq('id', id);
    if (error) {
      alert(`Couldn't delete: ${error.message}`);
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  function startEdit(row: CheckinRow) {
    setEditingId(row.id);
    setEditCommittee(row.committee);
    setEditYear(row.year ?? '');
  }

  async function handleSaveEdit(id: string) {
    setEditBusy(true);
    const { error } = await supabase
      .from('event_checkins')
      .update({ committee: editCommittee.trim(), year: editYear.trim() || null })
      .eq('id', id);

    if (error) {
      alert(`Couldn't save: ${error.message}`);
    } else {
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, committee: editCommittee.trim(), year: editYear.trim() || null } : r))
      );
      setEditingId(null);
    }
    setEditBusy(false);
  }

  async function handleManualAdd(e: React.FormEvent) {
    e.preventDefault();
    const entryCode = addCode.trim().toUpperCase();
    const committee = addCommittee.trim();
    if (!entryCode || !committee) return;

    setAddBusy(true);
    setAddMessage(null);

    const { data: reg, error: regError } = await supabase
      .from('registrations')
      .select('name, year, category')
      .eq('entry_code', entryCode)
      .maybeSingle();

    if (regError || !reg) {
      setAddMessage('No registration found for that code.');
      setAddBusy(false);
      return;
    }

    const { error: insertError } = await supabase.from('event_checkins').insert({
      entry_code: entryCode,
      committee,
      checked_in_by: user?.email ?? 'admin',
      name: reg.name,
      year: reg.year,
      category: reg.category,
    });

    if (insertError) {
      setAddMessage(
        insertError.code === '23505' ? 'Already checked into that committee.' : `Couldn't add: ${insertError.message}`
      );
    } else {
      setAddMessage(`✓ ${reg.name} added to ${committee}.`);
      setAddCode('');
    }
    setAddBusy(false);
  }

  // ───────── gate: lookup-by-code + toggle (also works from the GATE tab) ─────────

  async function handleGateLookup(e: React.FormEvent) {
    e.preventDefault();
    const entryCode = gateCode.trim().toUpperCase();
    if (!entryCode) return;

    setGateBusy(true);
    setGateMessage(null);
    setGateLookup(null);

    const { data, error } = await supabase
      .from('registrations')
      .select('entry_code, name, checked_in')
      .eq('entry_code', entryCode)
      .maybeSingle();

    if (error || !data) {
      setGateMessage('No registration found for that code.');
    } else {
      setGateLookup(data as { entry_code: string; name: string; checked_in: boolean });
    }
    setGateBusy(false);
  }

  async function toggleGate(entryCode: string, currentlyIn: boolean) {
    const next = !currentlyIn;
    const { error } = await supabase
      .from('registrations')
      .update({ checked_in: next, checked_in_at: next ? new Date().toISOString() : null })
      .eq('entry_code', entryCode);

    if (error) {
      alert(`Couldn't update: ${error.message}`);
      return;
    }
    if (gateLookup?.entry_code === entryCode) {
      setGateLookup({ ...gateLookup, checked_in: next });
      setGateMessage(next ? '✓ Marked as entered.' : '✓ Gate entry undone.');
    }
  }

  // ---------- auth gates ----------

  if (authLoading && !info) return <div style={styles.centered}>Loading…</div>;

  if (!user && !authLoading) {
    return (
      <div style={styles.centered}>
        <h1 style={styles.gateTitle}>Admin Login</h1>
        <button onClick={signInWithGoogle} style={styles.loginButton}>
          Continue with Google
        </button>
      </div>
    );
  }

  if (isAdmin === null) return <div style={styles.centered}>Loading…</div>;

  if (!isAdmin) {
    return (
      <div style={styles.centered}>
        <h1 style={styles.gateTitle}>Not Authorized</h1>
        <p style={styles.gateText}>This account doesn't have admin access.</p>
      </div>
    );
  }

  // ---------- dashboard ----------

  const showingGate = filter === GATE_KEY;

  return (
    <div style={S('page', { padding: '16px 12px 60px' })}>
      <div style={S('header', { marginBottom: 14 })}>
        <div>
          <h1 style={S('title', { fontSize: 18 })}>Mosaic 2K26 · Admin</h1>
          <span style={styles.totalBadge}>
            {loaded ? rows.length : '…'} committee check-ins · {gateLoaded ? gateRows.length : '…'} gate entries
          </span>
        </div>
        <div style={S('headerRight', { width: '100%', justifyContent: 'space-between' })}>
          <span style={S('adminEmail', { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 })}>{user?.email}</span>
          <button onClick={handleLogout} style={styles.logoutButton}>
            Log out
          </button>
        </div>
      </div>

      {/* ───────── manual overrides ───────── */}
      <div style={S('overridePanel', { gridTemplateColumns: '1fr', gap: 10 })}>
        <form onSubmit={handleManualAdd} style={styles.overrideForm}>
          <p style={styles.overrideLabel}>Manually add a check-in</p>
          <div style={S('overrideRow', { flexWrap: 'wrap' })}>
            <input value={addCode} onChange={(e) => setAddCode(e.target.value)} placeholder="Entry code" style={S('input', { flex: '1 1 130px' })} />
            <input
              value={addCommittee}
              onChange={(e) => setAddCommittee(e.target.value)}
              placeholder="Committee (e.g. CODEX)"
              style={S('input', { flex: '1 1 130px' })}
            />
            <button type="submit" disabled={addBusy} style={styles.actionButton}>
              {addBusy ? '…' : 'Add'}
            </button>
          </div>
          {addMessage && <p style={styles.overrideMessage}>{addMessage}</p>}
        </form>

        <form onSubmit={handleGateLookup} style={styles.overrideForm}>
          <p style={styles.overrideLabel}>Look up / override by entry code</p>
          <div style={S('overrideRow', { flexWrap: 'wrap' })}>
            <input value={gateCode} onChange={(e) => setGateCode(e.target.value)} placeholder="Entry code" style={S('input', { flex: '1 1 130px' })} />
            <button type="submit" disabled={gateBusy} style={styles.actionButton}>
              {gateBusy ? '…' : 'Look up'}
            </button>
          </div>
          {gateLookup && (
            <div style={S('gateResultRow', { flexWrap: 'wrap' })}>
              <span>
                {gateLookup.name} — currently{' '}
                <strong style={{ color: gateLookup.checked_in ? '#4ade80' : '#f87171' }}>
                  {gateLookup.checked_in ? 'ENTERED' : 'NOT ENTERED'}
                </strong>
              </span>
              <button
                type="button"
                onClick={() => toggleGate(gateLookup.entry_code, gateLookup.checked_in)}
                style={styles.actionButtonSmall}
              >
                {gateLookup.checked_in ? 'Undo entry' : 'Mark entered'}
              </button>
            </div>
          )}
          {gateMessage && <p style={styles.overrideMessage}>{gateMessage}</p>}
        </form>
      </div>

      {/* ───────── jump to a committee ───────── */}
      <div style={styles.selectRow}>
        <label style={styles.selectLabel} htmlFor="committee-select">
          Jump to:
        </label>
        <select
          id="committee-select"
          value={filter ?? ''}
          onChange={(e) => setFilter(e.target.value === '' ? null : e.target.value)}
          style={S('select', { flex: 1, minWidth: 0 })}
        >
          <option value="">All committees</option>
          <option value={GATE_KEY}>GATE ({gateRows.length})</option>
          {committeeCounts.map(([committee, count]) => (
            <option key={committee} value={committee}>
              {committee} ({count})
            </option>
          ))}
        </select>
      </div>

      {/* ───────── tabs: GATE + each committee ───────── */}
      <div style={S('chipRow', { display: 'none' })}>
        <button onClick={() => setFilter(null)} style={{ ...styles.chip, ...(filter === null ? styles.chipActive : null) }}>
          All committees ({rows.length})
        </button>
        <button
          onClick={() => setFilter(GATE_KEY)}
          style={{ ...styles.chip, ...styles.chipGate, ...(showingGate ? styles.chipActive : null) }}
        >
          GATE ({gateRows.length})
        </button>
        {committeeCounts.map(([committee, count]) => (
          <button
            key={committee}
            onClick={() => setFilter(committee)}
            style={{ ...styles.chip, ...(filter === committee ? styles.chipActive : null) }}
          >
            {committee} ({count})
          </button>
        ))}
      </div>

      {/* ───────── list: gate or committees ───────── */}
      <div style={styles.listWrap}>
        {showingGate ? (
          <>
            {gateLoaded && gateRows.length === 0 && <p style={styles.empty}>No gate entries yet</p>}
            {gateRows.map((r) => (
              <div key={r.entry_code} style={S('row', { flexWrap: 'wrap', padding: '10px 8px', gap: 8 })}>
                <span style={{ ...styles.rowCommittee, ...styles.rowCommitteeGate }}>GATE</span>
                <div style={S('rowMain', { flex: '1 1 140px' })}>
                  <span style={styles.rowName}>{r.name}</span>
                  <span style={styles.rowMeta}>
                    {r.category}
                    {r.year ? ` · ${r.year}` : ''}
                  </span>
                </div>
                <span style={styles.rowTime}>
                  {r.checked_in_at
                    ? new Date(r.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : ''}
                </span>
                <button onClick={() => toggleGate(r.entry_code, true)} style={styles.actionButtonSmall}>
                  Undo
                </button>
              </div>
            ))}
          </>
        ) : (
          <>
            {loaded && visibleRows.length === 0 && <p style={styles.empty}>No check-ins yet</p>}
            {visibleRows.map((r) =>
              editingId === r.id ? (
                <div key={r.id} style={S('row', { flexWrap: 'wrap', padding: '10px 8px', gap: 8 })}>
                  <input value={editCommittee} onChange={(e) => setEditCommittee(e.target.value)} style={styles.inputSmall} />
                  <input
                    value={editYear}
                    onChange={(e) => setEditYear(e.target.value)}
                    placeholder="Year"
                    style={{ ...styles.inputSmall, width: 70 }}
                  />
                  <span style={{ ...styles.rowMain, fontSize: 12, color: '#737373' }}>{r.name}</span>
                  <button onClick={() => handleSaveEdit(r.id)} disabled={editBusy} style={styles.actionButtonSmall}>
                    Save
                  </button>
                  <button onClick={() => setEditingId(null)} style={styles.actionButtonSmall}>
                    Cancel
                  </button>
                </div>
              ) : (
                <div key={r.id} style={S('row', { flexWrap: 'wrap', padding: '10px 8px', gap: 8 })}>
                  <span style={styles.rowCommittee}>{r.committee}</span>
                  <div style={S('rowMain', { flex: '1 1 140px' })}>
                    <span style={styles.rowName}>{r.name}</span>
                    <span style={styles.rowMeta}>
                      {r.category}
                      {r.year ? ` · ${r.year}` : ''}
                    </span>
                  </div>
                  <span style={styles.rowTime}>
                    {new Date(r.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <button onClick={() => startEdit(r)} style={styles.actionButtonSmall}>
                    Edit
                  </button>
                  <button onClick={() => handleDelete(r.id)} style={styles.deleteButton} title="Remove this check-in">
                    ✕
                  </button>
                </div>
              )
            )}
          </>
        )}
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
    padding: '28px 24px 60px',
    maxWidth: 880,
    margin: '0 auto',
  },
  header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 },
  headerRight: { display: 'flex', alignItems: 'center', gap: 10 },
  adminEmail: { fontSize: 12, color: '#737373' },
  logoutButton: {
    background: 'transparent',
    border: '1px solid #3a2020',
    color: '#f87171',
    borderRadius: 7,
    padding: '6px 12px',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },
  title: { fontSize: 22, fontWeight: 800, margin: 0 },
  totalBadge: { fontSize: 12, color: '#A3A3A3' },
  selectRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 },
  selectLabel: { fontSize: 12, color: '#A3A3A3' },
  select: {
    background: '#131315',
    border: '1px solid #2a2a2a',
    color: '#EAEAEA',
    borderRadius: 8,
    padding: '7px 10px',
    fontSize: 13,
    outline: 'none',
    cursor: 'pointer',
  },

  overridePanel: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 22 },
  overrideForm: { background: '#131315', border: '1px solid #262626', borderRadius: 12, padding: 14 },
  overrideLabel: { fontSize: 11, fontWeight: 700, letterSpacing: 0.4, color: '#A3A3A3', margin: '0 0 8px' },
  overrideRow: { display: 'flex', gap: 8 },
  overrideMessage: { fontSize: 12, color: '#A3A3A3', marginTop: 8 },
  gateResultRow: { marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, fontSize: 13 },
  input: {
    flex: 1,
    minWidth: 0,
    background: '#0C0C0C',
    border: '1px solid #2a2a2a',
    color: '#EAEAEA',
    borderRadius: 8,
    padding: '8px 10px',
    fontSize: 13,
    outline: 'none',
  },
  inputSmall: {
    background: '#0C0C0C',
    border: '1px solid #2a2a2a',
    color: '#EAEAEA',
    borderRadius: 6,
    padding: '6px 8px',
    fontSize: 12,
    outline: 'none',
    width: 110,
  },
  actionButton: {
    background: '#E3A24C',
    color: '#0C0C0C',
    border: 'none',
    borderRadius: 8,
    padding: '8px 14px',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  actionButtonSmall: {
    background: '#1f1f1f',
    color: '#EAEAEA',
    border: '1px solid #333',
    borderRadius: 7,
    padding: '6px 10px',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },

  chipRow: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  chip: {
    background: '#151515',
    border: '1px solid #2a2a2a',
    color: '#D4D4D4',
    borderRadius: 999,
    padding: '6px 14px',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },
  chipGate: { borderColor: '#3a2f20' },
  chipActive: { background: '#E3A24C', color: '#0C0C0C', borderColor: '#E3A24C' },
  listWrap: { display: 'flex', flexDirection: 'column', gap: 2 },
  empty: { fontSize: 14, color: '#737373', textAlign: 'center', marginTop: 60 },
  row: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderBottom: '1px solid #1a1a1a', borderRadius: 8 },
  rowCommittee: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 0.6,
    color: '#0C0C0C',
    background: '#E3A24C',
    borderRadius: 6,
    padding: '4px 8px',
    whiteSpace: 'nowrap',
  },
  rowCommitteeGate: { background: '#D7E2EA' },
  rowMain: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
  rowName: { fontSize: 14, fontWeight: 600 },
  rowMeta: { fontSize: 12, color: '#737373', marginTop: 1 },
  rowTime: { fontSize: 12, color: '#737373', fontVariantNumeric: 'tabular-nums' },
  deleteButton: {
    background: 'transparent',
    border: '1px solid #3a2020',
    color: '#f87171',
    borderRadius: 6,
    width: 26,
    height: 26,
    fontSize: 13,
    cursor: 'pointer',
    flexShrink: 0,
  },

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
  gateTitle: { fontSize: 24, fontWeight: 700 },
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