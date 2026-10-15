import { useEffect, useState } from 'react';
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
      .select('id, name, year, category, branch, div, checked_in_at')
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
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [role, user?.id]);

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

  // ---------- committee table ----------

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
            </tr>
          </thead>
          <tbody>
            {loaded && checkins.length === 0 && (
              <tr>
                <td style={styles.tdEmpty} colSpan={5}>
                  Waiting for the first check-in…
                </td>
              </tr>
            )}
            {checkins.map((c, i) => (
              <tr key={c.id} style={flashId === c.id ? styles.trFlash : undefined}>
                <td style={styles.tdMuted}>{checkins.length - i}</td>
                <td style={styles.tdName}>{c.name}</td>
                <td style={styles.td}>{c.category}</td>
                <td style={styles.td}>{c.year ?? '—'}</td>
                <td style={styles.td}>{c.branch ?? '—'}</td>
                <td style={styles.td}>{c.div ?? '—'}</td>
                <td style={styles.tdMuted}>
                  {new Date(c.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </td>
              </tr>
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
  td: { padding: '10px 12px', borderBottom: '1px solid #1a1a1a' },
  tdName: { padding: '10px 12px', borderBottom: '1px solid #1a1a1a', fontWeight: 600 },
  tdMuted: { padding: '10px 12px', borderBottom: '1px solid #1a1a1a', color: '#737373', fontVariantNumeric: 'tabular-nums' },
  tdEmpty: { padding: '40px 12px', textAlign: 'center', color: '#737373' },
  trFlash: { backgroundColor: 'rgba(227,162,76,0.12)', transition: 'background-color 0.6s ease' },
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