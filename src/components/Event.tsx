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

// Add only the event posters that exist for each committee.
const COMMITTEE_DATA: { name: string; posts: Post[] }[] = [
  {
    name: 'IEEE',
    posts: [{ photo: '/IEEE%20EVENT%20POSTER.jpeg', video: '', room: '620' }],
  },{
    name: 'CSI',
    posts: [{ photo: '/CSI%20GAME%20POSTER.png', video: '', room: 'Room 318' }],
  },{
    name: 'IETE',
    posts: [
      { photo: '/IETE%20EVENT%20POSTER%201.png', video: '', room: '514/515' },
      // { photo: '/IETE%20EVENT%20POSTER%202.pn', video: '', room: '514/515' },
      // { photo: '/IETE%20EVENT%20POSTER%203.png', video: '', room: '514/515' },
    ],
  }, {
    name: 'ISTE',
    posts: [{ photo: '/ISTE%20EVENT%20POSTER.jpeg', video: '', room: '414' }],
  },{
    name: 'ADG',
    posts: [
      { photo: '/ADG%20EVENT%20POSTER.jpeg', video: '', room: '028' },
      { photo: '/ADG%20EVENT%20POSTER%201.jpeg', video: '', room: '028' },
      // { photo: '/ADG%20EVENT%20POSTER%202.jpeg', video: '', room: '028' },
    ],
  },{
    name: 'CODEX',
    posts: [
      { photo: '/CODEX%20EVENT%20POSTER%20web.webp', video: '', room: '421/422' },
      { photo: '/CODEX%20EVENT%20POSTER%201%20web.webp', video: '', room: '421/422' },
      { photo: '/CODEX%20EVENT%20POSTER%202%20web.jpg', video: '', room: '421/422' },
    ],
  },{
    name: 'ECSSA',
    posts: [
      { photo: '/ECSSA%20EVENT%20POSTER.jpeg', video: '', room: '618' },
      { photo: '/ECSSA%20EVENT%20POSTER%201.jpeg', video: '', room: '618' },
      { photo: '/ECSSA%20EVENT%20POSTER%202.jpeg', video: '', room: '618' },
    ],
  },
  {
    name: 'EESA',
    posts: [
      { photo: '/EESA%20EVENT%20POSTER%201.png', video: '', room: '230' },
      { photo: '', video: '/public/EESA VIDEO.mp4', room: '230' },
      // { photo: '/CODEX%20EVENT%20POSTER%202%20web.jpg', video: '', room: '421/422' },
    ],
  },
  {
    name: 'E-TAN',
    posts: [
      { photo: '/E-TAN%20EVENT%20POSTER.jpeg', video: '', room: '128' },
      { photo: '/E-TAN%20EVENT%20POSTER%201.jpeg', video: '', room: '128' },
      { photo: '/E-TAN%20EVENT%20POSTER%202.jpeg', video: '', room: '128' },
    ],
  },
  { name: 'GATEE X TEJAS', posts: Array.from({ length: 3 }, () => ({ photo: '', video: '', room: '' })) },
  {
    name: 'ITSA',
    posts: [
      { photo: '/ITSA%20EVENT%20POSTER.jpeg', video: '', room: '304' },
      { photo: '/ITSA%20EVENT%20POSTER%201.jpeg', video: '', room: '304' },
      { photo: '/ITSA%20EVENT%20POSTER%202.jpeg', video: '', room: '304' },
    ],
  },
 
  { name: 'MESA', posts: [{ photo: '/MESSA%20EVENT%20POSTER.jpeg', video: '', room: '006' }] },
  
  
  
  { name: 'RAW', posts: [{ photo: '/RAW%20EVENT%20POSTER.png', video: '', room: '027' }] },
  
  // { name: 'TEJAS', posts: Array.from({ length: 3 }, () => ({ photo: '', video: '', room: '' })) },
 
  
  
  
];

const COMMITTEES: Project[] = COMMITTEE_DATA.map((committee, index) => ({
  number: String(index + 1).padStart(2, '0'),
  category: 'Committee',
  name: committee.name,
  posts: committee.posts,
}));

const WEBSITE_LINKS: Record<string, string> = {
  CSI: 'https://csi-sfit-26-27.vercel.app/mosaic',
  ITSA: 'https://share.google/7vE0wXBpQSJlY8hux',
  ISTE: 'https://istesfit.vercel.app/mosaic',
  IEEE: 'https://issb.sfit.ac.in/ctrl-freak',
  ADG: 'https://adg-game-reg.onrender.com/',
  EESA: 'https://eesaxsfit.netlify.app/',
  'E-TAN': 'https://lightslategrey-koala-269893.hostingersite.com/',
  IETE: 'https://iete-mosaic.vercel.app/',
  RAW: 'https://rawwebsite-seven.vercel.app/mosaic-26',
  ECSSA: 'https://ecssamosaic.pages.dev/',
  CODEX: 'https://codexsfit.vercel.app/mosaic',
};

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
  return (
    <div className="relative h-full w-full bg-black">
      {post.video ? (
        <video src={post.video} controls className="h-full w-full object-cover" />
      ) : post.photo ? (
        post.photo.toLowerCase().endsWith('.pdf') ? (
          <iframe src={post.photo} title={alt} loading="lazy" className="h-full w-full border-0 bg-white" />
        ) : (
          <img src={post.photo} alt={alt} loading="lazy" decoding="async" className="h-full w-full object-contain" />
        )
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <span className="px-3 text-center text-xs font-medium uppercase tracking-[0.2em] text-[#D7E2EA]/50">
            Video / Photo Soon
          </span>
        </div>
      )}

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
          {WEBSITE_LINKS[project.name] ? (
            <LiveProjectButton href={WEBSITE_LINKS[project.name]} />
          ) : (
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#D7E2EA]/35">
              Website link not provided
            </span>
          )}
        </div>

        <div className={project.posts.length === 1
          ? 'mx-auto grid w-full max-w-4xl grid-cols-1 gap-3'
          : 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'}>
          {project.posts.map((post, postIndex) => (
            <div
              key={`${project.number}-${postIndex}`}
              className={`relative ${project.posts.length === 1 ? 'h-[min(72vh,680px)] min-h-[420px]' : 'h-[240px] sm:h-[clamp(180px,22vw,340px)]'} overflow-hidden rounded-2xl border border-white/10 bg-[#111]`}
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