import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { motion, useInView } from 'framer-motion';
import FadeIn from './FadeIn';
import LiveProjectButton from './LiveProjectButton';

interface Post {
  photo: string;
  video: string;
  room: string;
}

interface Project {
  number: string;
  category: string;
  name: string;
  posts: Post[];
}

// Fill in each committee's actual events: upload photo/video and set
// the room number for each. Every committee should have 3 entries.
const COMMITTEE_DATA: { name: string; posts: Post[] }[] = [
  {
    name: 'CSI',
    posts: [
      { photo: '', video: '', room: 'Room 101' },
      { photo: '', video: '', room: 'Room 102' },
      { photo: '', video: '', room: 'Room 103' },
    ],
  },
  { name: 'ITSA', posts: Array.from({ length: 3 }, () => ({ photo: '', video: '', room: '' })) },
  {
    name: 'ISTE',
    posts: [
      { photo: '/ISTE%20Mosaic%20poster.jpeg', video: '', room: '' },
      { photo: '/ISTE%20MOSAIC1.jpeg', video: '', room: '' },
      { photo: '/ISTE%20Mosaic.jpeg', video: '', room: '' },
    ],
  },
  { name: 'IEEE', posts: Array.from({ length: 3 }, () => ({ photo: '', video: '', room: '' })) },
  { name: 'IETE', posts: Array.from({ length: 3 }, () => ({ photo: '', video: '', room: '' })) },
  {
    name: 'ADG',
    posts: [
      { photo: '/ADG%20Ethical%20Hacking%20workshop.jpg', video: '', room: '' },
      { photo: '/ADG%20Mosaic%20PR%20message%20Poster.jpg', video: '', room: '' },
      { photo: '/ADG%20Printed%20PR%20Poster%20.png', video: '', room: '' },
    ],
  },
  { name: 'RAW', posts: Array.from({ length: 3 }, () => ({ photo: '', video: '', room: '' })) },
  { name: 'GATEE', posts: Array.from({ length: 3 }, () => ({ photo: '', video: '', room: '' })) },
  { name: 'TEJAS', posts: Array.from({ length: 3 }, () => ({ photo: '', video: '', room: '' })) },
  { name: 'MESSA', posts: Array.from({ length: 3 }, () => ({ photo: '', video: '', room: '' })) },
  { name: 'CODEX', posts: Array.from({ length: 3 }, () => ({ photo: '', video: '', room: '' })) },
  {
    name: 'E-TAN',
    posts: [
      { photo: '/E-TAN%20POSTER.jpeg', video: '', room: '' },
      { photo: '/E-TAN%20POSTER1.jpeg', video: '', room: '' },
      { photo: '/E-TAN%20POSTER2.jpeg', video: '', room: '' },
    ],
  },
  { name: 'ECSSA', posts: Array.from({ length: 3 }, () => ({ photo: '', video: '', room: '' })) },
];

const COMMITTEES: Project[] = COMMITTEE_DATA.map((committee, index) => ({
  number: String(index + 1).padStart(2, '0'),
  category: 'Committee',
  name: committee.name,
  posts: committee.posts,
}));

const TOTAL_CARDS = COMMITTEES.length;

// One deliberate, restrained accent — warm amber, the color of a classic
// enterprise terminal readout. Used sparingly: command line, progress fill,
// the status dot. Everything else stays neutral black/white to match the
// site's existing palette instead of introducing a clashing new background.
const ACCENT = '#E3A24C';
const CARD_BG = '#101113'; // a hair lighter than the site's #0C0C0C, reads as a raised panel

// --- Decrypt / boot-text effect ------------------------------------------
// Scrambles through random glyphs before locking each character in place,
// left to right. Renders in a plain solid color (no gradient/clip-text
// tricks) so it is guaranteed to be visible in every browser.

const GLYPHS = '!<>-_\\/[]{}=+*^?#01';

function DecryptText({ text, active, className, style }: { text: string; active: boolean; className?: string; style?: CSSProperties }) {
  const [display, setDisplay] = useState(() => text.replace(/\S/g, () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)]));

  useEffect(() => {
    if (!active) {
      // out of view: reset to scrambled so the next scroll-in replays cleanly
      setDisplay(text.replace(/\S/g, () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)]));
      return;
    }
    const perChar = 5;
    let frame = 0;
    const maxFrames = text.length * perChar + 6;
    const id = setInterval(() => {
      setDisplay(
        text
          .split('')
          .map((ch, i) => {
            if (ch === ' ') return ' ';
            return frame >= i * perChar ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          })
          .join('')
      );
      frame += 1;
      if (frame > maxFrames) clearInterval(id);
    }, 32);
    return () => clearInterval(id);
  }, [active, text]);

  return (
    <span className={className} style={style}>
      {display}
    </span>
  );
}
// --------------------------------------------------------------------------

function PostMedia({ post, alt }: { post: Post; alt: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });

  return (
    <div ref={ref} className="relative h-full w-full bg-black">
      {post.video ? (
        <video src={post.video} controls className="h-full w-full object-cover" />
      ) : post.photo ? (
        <img src={post.photo} alt={alt} className="h-full w-full object-contain" />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <span className="px-3 text-center text-xs font-medium uppercase tracking-[0.2em] text-[#D7E2EA]/50">
            Video / Photo Soon
          </span>
        </div>
      )}

      {/* single clean fade-in, no flashing */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{ background: CARD_BG }}
        initial={{ opacity: 1 }}
        animate={inView ? { opacity: 0 } : { opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />

      {post.room && (
        <span className="absolute bottom-2 right-2 z-10 whitespace-nowrap rounded-full border border-white/15 bg-black/70 px-3 py-1.5 text-xs font-medium text-[#D7E2EA] backdrop-blur-sm">
          {post.room}
        </span>
      )}
    </div>
  );
}

function BootBar({ active }: { active: boolean }) {
  return (
    <div className="mb-2 flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest text-[#D7E2EA]/35 sm:text-[10px]">
      <span>sync</span>
      <span className="relative h-1 w-16 overflow-hidden rounded-full bg-white/10 sm:w-24">
        <motion.span
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: ACCENT }}
          initial={{ width: '0%' }}
          animate={{ width: active ? '100%' : '0%' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </span>
    </div>
  );
}

function TerminalCard({ project }: { project: Project; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.25 });
  const filename = `~/committees/${project.name.toLowerCase()}.sh`;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="relative mb-8 overflow-hidden rounded-2xl border border-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.45)] sm:mb-12"
      style={{ background: CARD_BG }}
    >
      {/* title bar */}
      <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="ml-2 truncate font-mono text-[10px] text-[#D7E2EA]/40 sm:text-[11px]">{filename}</span>
        <span className="ml-auto hidden font-mono text-[9px] tracking-wider text-[#D7E2EA]/35 sm:inline">
          {project.number}/{TOTAL_CARDS}
        </span>
        <motion.span
          className="ml-2 h-2 w-2 rounded-full"
          style={{ background: ACCENT }}
          initial={{ opacity: 0.25 }}
          animate={{ opacity: inView ? 1 : 0.25 }}
          transition={{ duration: 0.4 }}
        />
      </div>

      <div className="p-5 sm:p-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8">
          <div>
            <BootBar active={inView} />
            <div className="font-mono text-[11px] sm:text-xs" style={{ color: ACCENT }}>
              <DecryptText text={`$ ./run --id=${project.number} --unit`} active={inView} />
            </div>
            <h3
              className="mt-2 font-black uppercase text-[#D7E2EA]"
              style={{ fontSize: 'clamp(2.2rem, 7vw, 76px)', lineHeight: 1 }}
            >
              <DecryptText text={project.name} active={inView} />
            </h3>
          </div>
          <LiveProjectButton
            href={
              project.name === 'ADG'
                ? 'https://adg-game-reg.onrender.com/'
                : project.name === 'E-TAN'
                  ? 'https://lightslategrey-koala-269893.hostingersite.com/'
                : project.name === 'IETE'
                ? 'https://mosaic-conjuring-2026.vercel.app/'
                : project.name === 'ECSSA'
                  ? 'https://ecssamosaic.vercel.app/'
                  : project.name === 'CODEX'
                    ? 'https://codexsfit.vercel.app/mosaic'
                    : 'https://csi-sfit-26-27.vercel.app/mosaic'
            }
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {project.posts.map((post, postIndex) => (
            <div
              key={`${project.number}-${postIndex}`}
              className="relative h-[240px] sm:h-[clamp(180px,22vw,340px)] overflow-hidden rounded-2xl border border-white/10 bg-[#111]"
            >
              <PostMedia post={post} alt={`${project.name} post ${postIndex + 1}`} />
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function ProjectsSection() {
  return (
    <section
      id="events"
      className="relative z-10 -mt-10 rounded-t-[40px] bg-[#0C0C0C] px-5 py-20 sm:-mt-12 sm:rounded-t-[50px] sm:px-8 md:-mt-14 md:rounded-t-[60px] md:px-10"
    >
      <FadeIn delay={0} y={40}>
        <h2
          className="hero-heading mb-16 text-center font-black uppercase leading-none tracking-tight sm:mb-20 md:mb-28"
          style={{ fontSize: 'clamp(3rem, 12vw, 160px)' }}
        >
          EVENTS
        </h2>
      </FadeIn>

      <div className="mx-auto max-w-6xl">
        {COMMITTEES.map((project, i) => (
          <TerminalCard key={project.number} project={project} index={i} />
        ))}
      </div>
    </section>
  );
}