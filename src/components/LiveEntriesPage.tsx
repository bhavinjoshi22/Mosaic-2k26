import { useEffect, useRef, useState } from 'react';
import { supabase } from './supabase'; // adjust path if this file lives elsewhere
import { useAuth } from '../hooks/useAuth';
import { useRole } from '../hooks/roleCheck';

interface LiveCheckin {
  id: string;
  entry_code: string;
  name: string;
  year: string | null;
  branch: string | null;
  div: string | null;
  category: string;
  checked_in_at: string;
  payment_method: 'cash' | 'upi' | null;
  note: string | null;
  // Values for the committee's custom columns, keyed by column id.
  extra: Record<string, string> | null;
  stage_done: boolean;
  day: number;
}

interface CommitteeColumn {
  id: string;
  label: string;
  position: number;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

// A text cell that saves itself. It saves when you click away or press Enter,
// shows its own status, and never overwrites what you are typing when another
// volunteer's edit arrives through realtime.
function EditableCell({
  value,
  placeholder,
  onSave,
}: {
  value: string;
  placeholder?: string;
  onSave: (v: string) => Promise<string | null>; // returns an error message or null
}) {
  const [text, setText] = useState(value);
  const [saved, setSaved] = useState(value);
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [err, setErr] = useState<string | null>(null);
  const editing = useRef(false);

  useEffect(() => {
    if (!editing.current) {
      setText(value);
      setSaved(value);
    }
  }, [value]);

  async function commit() {
    editing.current = false;
    if (text === saved) return;
    setStatus('saving');
    setErr(null);
    const e = await onSave(text);
    if (e) {
      setStatus('error');
      setErr(e);
      return;
    }
    setSaved(text);
    setStatus('saved');
    setTimeout(() => setStatus((s) => (s === 'saved' ? 'idle' : s)), 1500);
  }

  return (
    <>
      <input
        type="text"
        value={text}
        maxLength={500}
        placeholder={placeholder}
        onFocus={() => {
          editing.current = true;
        }}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => void commit()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        }}
        style={styles.cellInput}
      />
      <div style={styles.saveStatus}>
        {status === 'saving' && 'Saving…'}
        {status === 'saved' && 'Saved ✓'}
        {status === 'error' && <span style={{ color: '#f87171' }}>{err ?? 'Save failed'}</span>}
      </div>
    </>
  );
}

function CheckinRow({
  c,
  index,
  total,
  flash,
  columns,
  isManager,
  onPatched,
}: {
  c: LiveCheckin;
  index: number;
  total: number;
  flash: boolean;
  columns: CommitteeColumn[];
  isManager: boolean;
  onPatched: (id: string, patch: Partial<LiveCheckin>) => void;
}) {
  const [stageErr, setStageErr] = useState<string | null>(null);
  const [payment, setPayment] = useState<string>(c.payment_method ?? '');
  const [payErr, setPayErr] = useState<string | null>(null);

  useEffect(() => {
    setPayment(c.payment_method ?? '');
  }, [c.payment_method]);

  async function savePayment(next: string) {
    setPayErr(null);
    const p = (next || null) as 'cash' | 'upi' | null;
    const { error } = await supabase.rpc('update_checkin_details', {
      p_id: c.id,
      p_payment_method: p,
      p_note: c.note,
    });
    if (error) {
      setPayErr(error.message);
      setPayment(c.payment_method ?? '');
      return;
    }
    onPatched(c.id, { payment_method: p });
  }

  async function toggleStage(next: boolean) {
    setStageErr(null);
    onPatched(c.id, { stage_done: next }); // show the tick immediately
    const { error } = await supabase.rpc('set_stage_done', { p_id: c.id, p_done: next });
    if (error) {
      onPatched(c.id, { stage_done: !next }); // put it back if the save failed
      setStageErr(error.message);
    }
  }

  return (
    <tr style={flash ? styles.trFlash : undefined}>
      <td style={styles.tdMuted}>{total - index}</td>
      <td style={styles.tdMuted}>Day {c.day}</td>
      <td style={styles.tdName}>{c.name}</td>
      <td style={styles.td}>{c.category}</td>
      <td style={styles.td}>{c.year ?? '—'}</td>
      <td style={styles.td}>{c.branch ?? '—'}</td>
      <td style={styles.td}>{c.div ?? '—'}</td>
      <td style={styles.tdMuted}>
        {new Date(c.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </td>
      <td style={styles.td}>
        <input
          type="checkbox"
          checked={!!c.stage_done}
          onChange={(e) => void toggleStage(e.target.checked)}
          style={styles.checkbox}
        />
        {stageErr && <div style={{ ...styles.saveStatus, color: '#f87171' }}>{stageErr}</div>}
      </td>
      {!isManager && (
        <>
      <td style={styles.td}>
        <select
          value={payment}
          onChange={(e) => {
            setPayment(e.target.value);
            void savePayment(e.target.value);
          }}
          style={styles.select}
        >
          <option value="">Not set</option>
          <option value="cash">Cash</option>
          <option value="upi">UPI</option>
        </select>
        {payErr && <div style={{ ...styles.saveStatus, color: '#f87171' }}>{payErr}</div>}
      </td>
      <td style={styles.td}>
        <EditableCell
          value={c.note ?? ''}
          placeholder="Add a note…"
          onSave={async (v) => {
            const note = v.trim() || null;
            const { error } = await supabase.rpc('update_checkin_details', {
              p_id: c.id,
              p_payment_method: c.payment_method,
              p_note: note,
            });
            if (error) return error.message;
            onPatched(c.id, { note });
            return null;
          }}
        />
      </td>
      {columns.map((col) => (
        <td key={col.id} style={styles.td}>
          <EditableCell
            value={c.extra?.[col.id] ?? ''}
            onSave={async (v) => {
              const { error } = await supabase.rpc('update_checkin_extra', {
                p_id: c.id,
                p_key: col.id,
                p_value: v,
              });
              if (error) return error.message;
              const next = { ...(c.extra ?? {}) };
              if (v.trim()) next[col.id] = v;
              else delete next[col.id];
              onPatched(c.id, { extra: next });
              return null;
            }}
          />
        </td>
      ))}
        </>
      )}
    </tr>
  );
}

function csvCell(v: unknown) {
  let s = String(v ?? '');
  // Stop Excel/Sheets from running text that starts with = + - @ as a formula.
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
}

export default function LiveEntriesPage() {
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const { info, pending } = useRole();
  const volunteerRole: string | null = info?.isVolunteer ? (info.role ?? null) : null;
  // Stage managers are NOT in the volunteers table, so they cannot scan.
  // They are listed in stage_managers and may only view the list and tick Stage.
  const [managerCommittee, setManagerCommittee] = useState<string | null>(null);
  const [managerChecked, setManagerChecked] = useState(false);
  const role: string | null = volunteerRole ?? managerCommittee;
  const isManager = !volunteerRole && !!managerCommittee;
  const roleChecked = !!info || !pending;

  // If the account is not a volunteer, check whether it is a stage manager.
  useEffect(() => {
    if (authLoading || !user || !roleChecked) return;
    if (volunteerRole) {
      setManagerChecked(true);
      return;
    }
    let cancelled = false;
    supabase
      .from('stage_managers')
      .select('committee')
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setManagerCommittee(data?.committee ?? null);
        setManagerChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id, authLoading, roleChecked, volunteerRole]);
  const [checkins, setCheckins] = useState<LiveCheckin[]>([]);
  const [columns, setColumns] = useState<CommitteeColumn[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);
  const [dayFilter, setDayFilter] = useState<number | 'all'>('all');

  async function loadColumns(r: string) {
    const { data } = await supabase
      .from('committee_columns')
      .select('id, label, position')
      .eq('committee', r)
      .order('position', { ascending: true });
    if (data) setColumns(data as CommitteeColumn[]);
  }

  useEffect(() => {
    if (!role || role === 'gate' || !user) return;

    let cancelled = false;

    supabase
      .from('event_checkins')
      .select('id, entry_code, name, year, category, branch, div, checked_in_at, payment_method, note, extra, stage_done, day')
      .eq('committee', role)
      .order('checked_in_at', { ascending: false })
      .limit(1000)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setLoadError(error.message);
          return;
        }
        setLoadError(null);
        setCheckins((data ?? []) as LiveCheckin[]);
        setLoaded(true);
      });

    if (!isManager) void loadColumns(role);

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
      // Any column added, renamed or deleted by a teammate: reload the list.
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'committee_columns', filter: `committee=eq.${role}` },
        () => {
          void loadColumns(role);
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [role, user?.id]);

  function handlePatched(id: string, patch: Partial<LiveCheckin>) {
    setCheckins((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  async function addColumn() {
    const label = window.prompt('New column name (for example: Stage, Round, Score)');
    if (!label || !label.trim() || !role) return;
    const { error } = await supabase.rpc('add_committee_column', { p_label: label.trim() });
    if (error) {
      window.alert(error.message);
      return;
    }
    await loadColumns(role);
  }

  async function deleteColumn(col: CommitteeColumn) {
    if (!role) return;
    if (!window.confirm(`Delete the column "${col.label}" and everything typed in it?`)) return;
    const { error } = await supabase.rpc('delete_committee_column', { p_id: col.id });
    if (error) {
      window.alert(error.message);
      return;
    }
    setCheckins((prev) =>
      prev.map((c) => {
        if (!c.extra || !(col.id in c.extra)) return c;
        const next = { ...c.extra };
        delete next[col.id];
        return { ...c, extra: next };
      })
    );
    await loadColumns(role);
  }

  function downloadCsv() {
    const header = [
      'entry_code', 'day', 'name', 'category', 'year', 'branch', 'division',
      'checked_in', 'payment', 'note', ...columns.map((c) => c.label),
    ];
    const lines = (dayFilter === 'all' ? checkins : checkins.filter((c) => c.day === dayFilter))
      .slice()
      .reverse()
      .map((c) =>
        [
          c.entry_code, c.day, c.name, c.category, c.year, c.branch, c.div,
          new Date(c.checked_in_at).toLocaleString(), c.payment_method, c.note,
          ...columns.map((col) => c.extra?.[col.id] ?? ''),
        ]
          .map(csvCell)
          .join(',')
      );
    const csv = '\ufeff' + [header.map(csvCell).join(','), ...lines].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${role}-registrations-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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

  if (!role && !managerChecked) {
    return <div style={styles.centered}>Loading…</div>;
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

  // ---------- committee table ----------

  const days = Array.from(new Set(checkins.map((c) => c.day))).sort((a, b) => a - b);
  const visible = dayFilter === 'all' ? checkins : checkins.filter((c) => c.day === dayFilter);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.liveDot} />
          <span style={styles.liveLabel}>LIVE</span>
        </div>
        <h1 style={styles.committeeName}>{role} — Registrations</h1>
        {!isManager && (
          <>
            <button onClick={addColumn} style={styles.headerButton}>
              + Column
            </button>
            <button onClick={downloadCsv} style={styles.headerButton}>
              CSV
            </button>
          </>
        )}
        <span style={styles.countBadge}>{loaded ? visible.length : '…'}</span>
      </div>

      {loadError && (
        <p style={{ color: '#f87171', fontSize: 13, padding: '12px 24px', margin: 0 }}>
          Could not load registrations: {loadError}
        </p>
      )}

      <div style={styles.dayTabs}>
        {(['all', ...days] as Array<number | 'all'>).map((d) => (
          <button
            key={String(d)}
            onClick={() => setDayFilter(d)}
            style={dayFilter === d ? styles.dayTabActive : styles.dayTab}
          >
            {d === 'all' ? 'All days' : `Day ${d}`}
          </button>
        ))}
      </div>

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>#</th>
              <th style={styles.th}>Day</th>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Category</th>
              <th style={styles.th}>Year</th>
              <th style={styles.th}>Branch</th>
              <th style={styles.th}>Division</th>
              <th style={styles.th}>Checked in</th>
              <th style={styles.th}>Stage</th>
              {!isManager && (
                <>
              <th style={styles.th}>Payment</th>
              <th style={styles.th}>Note</th>
              {columns.map((col) => (
                <th key={col.id} style={styles.th}>
                  {col.label}
                  <button
                    onClick={() => void deleteColumn(col)}
                    title="Delete column"
                    style={styles.deleteColButton}
                  >
                    ×
                  </button>
                </th>
              ))}
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {loaded && visible.length === 0 && (
              <tr>
                <td style={styles.tdEmpty} colSpan={isManager ? 9 : 11 + columns.length}>
                  Waiting for the first check-in…
                </td>
              </tr>
            )}
            {visible.map((c, i) => (
              <CheckinRow
                key={c.id}
                c={c}
                index={i}
                total={visible.length}
                flash={flashId === c.id}
                columns={columns}
                isManager={isManager}
                onPatched={handlePatched}
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
    gap: 12,
    padding: '18px 24px',
    borderBottom: '1px solid #262626',
    position: 'sticky',
    top: 0,
    background: '#0C0C0C',
    zIndex: 2,
    flexWrap: 'wrap',
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
  headerButton: {
    background: 'transparent',
    border: '1px solid #444',
    color: '#EAEAEA',
    borderRadius: 8,
    padding: '6px 12px',
    fontSize: 12,
    cursor: 'pointer',
  },
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
    whiteSpace: 'nowrap',
  },
  deleteColButton: {
    marginLeft: 8,
    background: 'transparent',
    border: 'none',
    color: '#737373',
    cursor: 'pointer',
    fontSize: 14,
    lineHeight: 1,
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
  cellInput: {
    width: '100%',
    minWidth: 160,
    background: '#151515',
    border: '1px solid #333',
    borderRadius: 8,
    padding: '7px 10px',
    color: '#EAEAEA',
    fontSize: 13,
  },
  saveStatus: { fontSize: 11, color: '#737373', marginTop: 4, minHeight: 14 },
  checkbox: { width: 22, height: 22, cursor: 'pointer', accentColor: '#E3A24C' },
  dayTabs: { display: 'flex', gap: 8, padding: '12px 24px 4px', flexWrap: 'wrap' },
  dayTab: {
    background: 'transparent',
    border: '1px solid #333',
    color: '#A3A3A3',
    borderRadius: 999,
    padding: '5px 14px',
    fontSize: 12,
    cursor: 'pointer',
  },
  dayTabActive: {
    background: '#E3A24C',
    border: '1px solid #E3A24C',
    color: '#0C0C0C',
    borderRadius: 999,
    padding: '5px 14px',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
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