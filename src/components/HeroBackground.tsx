import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * Faceted "mosaic-glass" background.
 *
 * Signature moment (spent once, on load): the low-poly facets fly in from
 * scattered offsets and lock into place, like the mosaic assembling itself.
 * After that reveal, the mesh settles into a quieter ambient state: tiles
 * breathe softly, circuit traces carry light pulses, and the whole plate
 * tilts gently toward the cursor like glass catching light.
 */

const COLS = 9;
const ROWS = 7;
const VB_W = 1000;
const VB_H = 780;

const TILE_COLORS = ['#59C7E8', '#B600A8', '#7621B0', '#BE4C00', '#D7E2EA'];
const TRACE_COLORS = ['#59C7E8', '#B600A8'];

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Tri {
  id: string;
  points: string;
  color: string;
  baseOpacity: number;
  duration: number;
  delay: number;
  dx: number;
  dy: number;
  rot: number;
  entryDelay: number;
}

interface MeshData {
  tris: Tri[];
  edgeLines: string[];
  traces: { id: string; d: string; duration: number; delay: number; color: string }[];
  nodes: { x: number; y: number; color: string }[];
}

function buildMesh(): MeshData {
  const rand = mulberry32(2026);
  const grid: { x: number; y: number }[][] = [];
  const cx = VB_W / 2;
  const cy = VB_H / 2;
  const maxDist = Math.hypot(cx, cy);

  for (let r = 0; r <= ROWS; r++) {
    const row: { x: number; y: number }[] = [];
    for (let c = 0; c <= COLS; c++) {
      const jitterX = (rand() - 0.5) * (VB_W / COLS) * 0.55;
      const jitterY = (rand() - 0.5) * (VB_H / ROWS) * 0.55;
      row.push({ x: (c / COLS) * VB_W + jitterX, y: (r / ROWS) * VB_H + jitterY });
    }
    grid.push(row);
  }

  const tris: Tri[] = [];
  const edgeSet = new Set<string>();
  const edgeLines: string[] = [];

  const addEdge = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
    const key = [p1.x.toFixed(1), p1.y.toFixed(1), p2.x.toFixed(1), p2.y.toFixed(1)].join(',');
    if (edgeSet.has(key)) return;
    edgeSet.add(key);
    edgeLines.push(`M${p1.x.toFixed(1)},${p1.y.toFixed(1)} L${p2.x.toFixed(1)},${p2.y.toFixed(1)}`);
  };

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const a = grid[r][c];
      const b = grid[r][c + 1];
      const d = grid[r + 1][c];
      const e = grid[r + 1][c + 1];
      const splitA = rand() > 0.5;
      const triA = splitA ? [a, b, d] : [a, b, e];
      const triB = splitA ? [b, e, d] : [a, e, d];

      [triA, triB].forEach((t, i) => {
        const ctx = (t[0].x + t[1].x + t[2].x) / 3;
        const cty = (t[0].y + t[1].y + t[2].y) / 3;
        const dist = Math.hypot(ctx - cx, cty - cy);
        const dirX = (ctx - cx) / (dist || 1);
        const dirY = (cty - cy) / (dist || 1);

        tris.push({
          id: `t-${r}-${c}-${i}`,
          points: t.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '),
          color: TILE_COLORS[Math.floor(rand() * TILE_COLORS.length)],
          baseOpacity: 0.025 + rand() * 0.05,
          duration: 5 + rand() * 7,
          delay: rand() * 6,
          dx: dirX * (60 + rand() * 90),
          dy: dirY * (60 + rand() * 90),
          rot: (rand() - 0.5) * 50,
          entryDelay: (dist / maxDist) * 0.75 + rand() * 0.5,
        });
      });

      addEdge(a, b);
      addEdge(a, d);
      addEdge(b, d);
      addEdge(b, e);
      addEdge(d, e);
    }
  }

  const traceRows = [1, 3, 5];
  const traces = traceRows.map((r, i) => {
    const pts = grid[r];
    const d = pts.map((p, idx) => `${idx === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    return {
      id: `trace-${r}`,
      d,
      duration: 9 + i * 3.5,
      delay: i * 1.8,
      color: TRACE_COLORS[i % TRACE_COLORS.length],
    };
  });

  // PCB-style via nodes at trace vertices
  const nodes = traceRows.flatMap((r, i) =>
    grid[r].map((p) => ({ x: p.x, y: p.y, color: TRACE_COLORS[i % TRACE_COLORS.length] })),
  );

  return { tris, edgeLines, traces, nodes };
}

export default function HeroBackground() {
  const { tris, edgeLines, traces, nodes } = useMemo(buildMesh, []);
  const [assembled, setAssembled] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setAssembled(true), 1500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (frameRef.current !== null) return;
      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;
        const el = containerRef.current;
        const tilt = tiltRef.current;
        if (!el || !tilt) return;
        const rect = el.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        tilt.style.transform = `rotateX(${(-py * 4.5).toFixed(2)}deg) rotateY(${(px * 6).toFixed(2)}deg) scale(1.03)`;
      });
    };
    window.addEventListener('mousemove', handleMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMove);
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-[#0C0C0C]">
      <style>{`
        @keyframes tileBreathe {
          0%, 100% { opacity: var(--base-op); }
          50% { opacity: calc(var(--base-op) * 2.6); }
        }
        @keyframes assemble {
          from { opacity: 0; transform: translate(var(--dx), var(--dy)) rotate(var(--rot)) scale(0.2); }
          to { opacity: var(--base-op); transform: translate(0, 0) rotate(0deg) scale(1); }
        }
        @keyframes nodeGlow {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.5; }
        }
        .tri-entering {
          animation: assemble 1.15s cubic-bezier(0.22, 1, 0.36, 1) var(--entry-delay) both;
        }
        .tri-idle {
          animation: tileBreathe var(--dur) ease-in-out var(--delay) infinite;
        }
        .via-node { animation: nodeGlow 4.5s ease-in-out infinite; }
        .tilt-plate {
          transform-style: preserve-3d;
          transition: transform 0.5s ease-out;
          will-change: transform;
        }
      `}</style>

      {/* base color field */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(120% 90% at 50% 0%, #16121c 0%, #0c0c0c 55%, #0a0a0a 100%)' }}
      />

      {/* the mosaic mesh — tilts toward the cursor like glass catching light */}
      <div style={{ perspective: '1400px' }} className="absolute inset-0">
        <div ref={tiltRef} className="tilt-plate absolute inset-0">
          <svg
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            preserveAspectRatio="xMidYMid slice"
            className="absolute inset-0 h-full w-full"
          >
            <defs>
              <radialGradient id="focusFade" cx="50%" cy="58%" r="55%">
                <stop offset="0%" stopColor="#0C0C0C" stopOpacity="0.75" />
                <stop offset="45%" stopColor="#0C0C0C" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#0C0C0C" stopOpacity="0" />
              </radialGradient>
              <filter id="traceGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3.2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="nodeGlowFilter" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="2.4" />
              </filter>
            </defs>

            <g>
              {tris.map((t) => (
                <polygon
                  key={t.id}
                  points={t.points}
                  fill={t.color}
                  className={assembled ? 'tri-idle' : 'tri-entering'}
                  style={
                    {
                      '--base-op': t.baseOpacity,
                      '--dur': `${t.duration}s`,
                      '--delay': `${t.delay}s`,
                      '--dx': `${t.dx}px`,
                      '--dy': `${t.dy}px`,
                      '--rot': `${t.rot}deg`,
                      '--entry-delay': `${t.entryDelay}s`,
                    } as React.CSSProperties
                  }
                />
              ))}
            </g>

            <g stroke="#D7E2EA" strokeWidth="1" fill="none" opacity="0.07">
              {edgeLines.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </g>

            <g fill="none" filter="url(#traceGlow)">
              {traces.map((tr) => (
                <path key={tr.id} d={tr.d} stroke={tr.color} strokeWidth="1.1" opacity="0.22" />
              ))}
              {traces.map((tr) => (
                <circle key={`${tr.id}-pulse`} r="3.5" fill={tr.color}>
                  <animateMotion dur={`${tr.duration}s`} begin={`${tr.delay + 1.6}s`} repeatCount="indefinite">
                    <mpath href={`#${tr.id}`} />
                  </animateMotion>
                </circle>
              ))}
              {traces.map((tr) => (
                <path key={`${tr.id}-def`} id={tr.id} d={tr.d} opacity="0" />
              ))}
            </g>

            {/* PCB via nodes — small fixed solder points along the traces */}
            <g filter="url(#nodeGlowFilter)">
              {nodes.map((n, i) => (
                <circle
                  key={i}
                  cx={n.x}
                  cy={n.y}
                  r="2.6"
                  fill={n.color}
                  className="via-node"
                  style={{ animationDelay: `${(i % 7) * 0.6}s` }}
                />
              ))}
            </g>

            <rect x="0" y="0" width={VB_W} height={VB_H} fill="url(#focusFade)" />
          </svg>
        </div>
      </div>

      {/* fine grain for a premium, non-flat finish */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.05]">
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>

      <div className="absolute inset-x-6 top-5 h-px bg-gradient-to-r from-transparent via-[#D7E2EA]/30 to-transparent md:inset-x-10" />
      <div className="absolute inset-x-6 bottom-5 h-px bg-gradient-to-r from-transparent via-[#BE4C00]/30 to-transparent md:inset-x-10" />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(12,12,12,0.35)_75%,#0C0C0C_100%)]" />
    </div>
  );
}