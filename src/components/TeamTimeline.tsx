import { useMemo, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

// TODO: replace with actual faculty names once ready
const FACULTY_LABELS = ['Faculty 1', 'Faculty 2', 'Faculty 3', 'Faculty 4'];

// TODO: replace "Name" placeholders with actual member names once ready
const CORE_TEAM_ROLES = [
  'President',
  'General Secretary',
  'Lady Representative',
  'Technical Secretary',
  'Joint Technical Secretary',
  'NSS Representative',
  'Cultural Secretary',
  'Joint Cultural Secretary',
  'Sports Secretary',
  'Joint Sports Secretary',
];

const IMAGE_PLACEHOLDER = 'https://placehold.co/600x600/151515/D7E2EA?text=Replace+Photo';

type Entry =
  | { type: 'header'; label: string }
  | {
      type: 'card';
      title: string;
      subtitle: string;
      phone: string;
      email: string;
      image: string;
      side: 'left' | 'right';
    };

function buildEntries(includeFaculty: boolean): Entry[] {
  const entries: Entry[] = [];
  let cardCount = 0;

  if (includeFaculty) {
    entries.push({ type: 'header', label: 'Faculty' });
    FACULTY_LABELS.forEach((label) => {
      entries.push({
        type: 'card',
        title: 'Name',
        subtitle: label,
        phone: '+91 00000 00000',
        email: 'faculty@mosaic-2k26.com',
        image: IMAGE_PLACEHOLDER,
        side: cardCount % 2 === 0 ? 'left' : 'right',
      });
      cardCount += 1;
    });
  }

  entries.push({ type: 'header', label: 'Core Team' });
  CORE_TEAM_ROLES.forEach((role) => {
    entries.push({
      type: 'card',
      title: 'Name',
      subtitle: role,
      phone: '+91 00000 00000',
      email: `${role.toLowerCase().replace(/ /g, '.')}@mosaic-2k26.com`,
      image: IMAGE_PLACEHOLDER,
      side: cardCount % 2 === 0 ? 'left' : 'right',
    });
    cardCount += 1;
  });

  return entries;
}

function Card({
  title,
  subtitle,
  phone,
  email,
  image,
}: {
  title: string;
  subtitle: string;
  phone: string;
  email: string;
  image: string;
}) {
  return (
    <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[#D7E2EA]/20 bg-[#151515] shadow-[0_12px_40px_rgba(0,0,0,0.24)]">
      <div className="group aspect-[4/3] overflow-hidden border-b border-[#D7E2EA]/15 bg-[#0C0C0C]">
        <img
          src={image}
          alt={`${title} ${subtitle} profile`}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />
      </div>
      <div className="space-y-2 p-5 sm:p-6">
        <span className="block text-xl font-semibold uppercase tracking-wide text-[#D7E2EA]/90 sm:text-2xl">
          {title}
        </span>
        <span className="block text-sm uppercase tracking-widest text-[#D7E2EA]/50 sm:text-base">
          {subtitle}
        </span>
        <a className="text-xs text-[#D7E2EA]/65 transition-colors hover:text-[#BE4C00] sm:text-sm" href={`tel:${phone}`}>
          {phone}
        </a>
        <a className="break-all text-xs text-[#D7E2EA]/65 transition-colors hover:text-[#BE4C00] sm:text-sm" href={`mailto:${email}`}>
          {email}
        </a>
      </div>
    </div>
  );
}

function StageMember({ entry, index, total, progress }: { entry: Extract<Entry, { type: 'card' }>; index: number; total: number; progress: ReturnType<typeof useScroll>['scrollYProgress'] }) {
  const start = index / total;
  const end = (index + 1) / total;
  const fade = Math.min(0.035, (end - start) / 3);
  const inputRange = index === 0
    ? [0, fade, end - fade, end]
    : [start - fade, start, end - fade, end];
  const opacity = useTransform(progress, inputRange, index === 0 ? [1, 1, 1, 0] : [0, 1, 1, 0]);
  const rotateY = useTransform(progress, inputRange, index === 0 ? [0, 0, 0, -70] : [70, 0, 0, -70]);
  const x = useTransform(progress, inputRange, index === 0 ? [0, 0, 0, -100] : [100, 0, 0, -100]);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center [perspective:1200px]"
      style={{ opacity, rotateY, x, transformStyle: 'preserve-3d' }}
    >
      <div className="relative w-full max-w-6xl px-5">
        <div className="mx-auto mb-8 flex h-36 w-36 items-center justify-center rounded-full border-2 border-[#D7E2EA]/35 bg-[#07101a]/95 text-center shadow-[0_0_50px_rgba(16,120,190,0.35)] sm:h-48 sm:w-48">
          <div>
            <span className="block text-[10px] uppercase tracking-[0.3em] text-[#BE4C00]">Mosaic</span>
            <span className="mt-2 block text-lg font-bold uppercase tracking-widest text-[#D7E2EA] sm:text-2xl">Core Members</span>
          </div>
        </div>
        <div className="mx-auto h-px w-24 bg-gradient-to-r from-transparent via-[#BE4C00] to-transparent" />
        <p className="mt-5 text-center text-xs uppercase tracking-[0.35em] text-[#BE4C00]">Current post</p>
        <h4 className="mt-3 text-center text-2xl font-bold uppercase tracking-widest text-[#D7E2EA] sm:text-4xl">{entry.subtitle}</h4>
        <div className="mx-auto mt-8 w-full max-w-sm md:absolute md:right-0 md:top-1/2 md:mt-0 md:w-[min(32vw,360px)] md:-translate-y-1/2">
          <Card title={entry.title} subtitle={entry.subtitle} phone={entry.phone} email={entry.email} image={entry.image} />
        </div>
      </div>
    </motion.div>
  );
}

function ScrollTeamDirectory({ entries }: { entries: Entry[] }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardEntries = entries.filter((entry): entry is Extract<Entry, { type: 'card' }> => entry.type === 'card');
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] });

  return (
    <div ref={sectionRef} className="relative min-h-screen">
      <div className="relative flex min-h-screen items-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,120,190,0.12),transparent_48%)]" />
        {cardEntries.map((entry, index) => (
          <StageMember key={`${entry.subtitle}-${index}`} entry={entry} index={index} total={cardEntries.length} progress={scrollYProgress} />
        ))}
        <div className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 text-center text-[10px] uppercase tracking-[0.3em] text-[#D7E2EA]/40">
          Scroll to view next member
        </div>
      </div>
    </div>
  );
}

export default function TeamTimeline({ includeFaculty = true, orbit = false }: { includeFaculty?: boolean; orbit?: boolean }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const entries = useMemo(() => buildEntries(includeFaculty), [includeFaculty]);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start 0.8', 'end 0.3'],
  });

  if (orbit) {
    return <ScrollTeamDirectory entries={entries} />;
  }

  return (
    <div ref={sectionRef} className="relative mx-auto w-full max-w-4xl">
      {/* base line */}
      <div className="absolute left-8 top-0 h-full w-[3px] -translate-x-1/2 rounded-full bg-[#D7E2EA]/15 md:left-1/2" />
      {/* glowing traced line */}
      <motion.div
        className="absolute left-8 top-0 w-[3px] origin-top -translate-x-1/2 rounded-full md:left-1/2"
        style={{
          height: '100%',
          scaleY: scrollYProgress,
          background: 'linear-gradient(180deg, #B600A8 0%, #7621B0 55%, #BE4C00 100%)',
          boxShadow: '0 0 14px 3px rgba(182, 0, 168, 0.6)',
        }}
      />

      <div className="flex flex-col gap-8">
        {entries.map((entry, i) => {
          if (entry.type === 'header') {
            return (
              <motion.div
                key={`header-${i}`}
                className="relative flex justify-center pt-4"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 0.4 }}
              >
                <h3 className="rounded-full bg-[#0C0C0C] px-4 text-lg font-semibold uppercase tracking-widest text-[#D7E2EA]/80 sm:text-xl">
                  {entry.label}
                </h3>
              </motion.div>
            );
          }

          const isLeft = entry.side === 'left';

          return (
            <motion.div
              key={`card-${i}`}
              className="relative flex w-full pl-20 md:grid md:grid-cols-2 md:gap-10 md:pl-0"
              initial={{ opacity: 0, x: isLeft ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.4 }}
            >
              <div className={`hidden md:flex ${isLeft ? 'justify-end' : 'invisible'}`}>
                {isLeft && <Card title={entry.title} subtitle={entry.subtitle} phone={entry.phone} email={entry.email} image={entry.image} />}
              </div>
              <div className={`hidden md:flex ${!isLeft ? 'justify-start' : 'invisible'}`}>
                {!isLeft && <Card title={entry.title} subtitle={entry.subtitle} phone={entry.phone} email={entry.email} image={entry.image} />}
              </div>
              <div className="md:hidden">
                <Card title={entry.title} subtitle={entry.subtitle} phone={entry.phone} email={entry.email} image={entry.image} />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}