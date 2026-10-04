import { useEffect, useRef, useState } from 'react';

const COMMITTEES = [
  { name: 'CSI' },
  { name: 'ITSA', src: '/ITSA%20TeamPhoto.jpeg' },
  { name: 'ISTE', src: '/ISTE%20TeamPhoto.jpeg' },
  { name: 'IEEE' },
  { name: 'IETE', src: '/IETE%20TeamPhoto.jpeg' },
  { name: 'ADG', src: '/ADG%20teamPhoto.jpg' },
  { name: 'RAW' },
  { name: 'GATEE X TEJAS' },
  { name: 'EESA' },
  { name: 'MESA', src: '/MESA%20TeamPhoto.jpeg' },
  { name: 'CODEX', src: '/CODEX%20TeamPhoto.jpeg' },
  { name: 'E-TAN', src: '/E-TAN%20TeamPhoto.jpeg' },
  { name: 'ECSSA' },
];

const ROWS = [
  COMMITTEES.slice(0, 5),
  COMMITTEES.slice(5, 10),
  [...COMMITTEES.slice(10), ...COMMITTEES.slice(0, 2)],
];

function PhotoTile({ name, src }: { name: string; src?: string }) {
  return (
    <div className="relative flex aspect-[4/3] w-full min-w-0 items-end overflow-hidden rounded-2xl border border-dashed border-[#D7E2EA]/30 bg-[#151515]">
      {src ? (
        <img
          src={src}
          alt={`${name} team photo`}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          draggable={false}
        />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-medium uppercase tracking-[0.2em] text-[#D7E2EA]/45">
          Photo coming soon
        </span>
      )}
      <span className="relative w-full bg-gradient-to-t from-black/85 to-transparent px-4 pb-3 pt-8 text-sm font-semibold uppercase tracking-wider text-white">
        {name}
      </span>
    </div>
  );
}

export default function MarqueeSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const section = sectionRef.current;
      if (!section) return;

      const sectionTop = section.getBoundingClientRect().top + window.scrollY;
      const scrollProgress = window.scrollY - sectionTop;
      setOffset(Math.max(-80, Math.min(80, scrollProgress * 0.24)));
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section ref={sectionRef} className="w-full overflow-hidden bg-[#0C0C0C] pb-10 pt-24 sm:pt-32 md:pt-40">
      <div className="flex flex-col gap-3">
        {ROWS.map((row, rowIndex) => (
          <div
            key={`row-${rowIndex}`}
            className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5"
            style={{
              transform: `translateX(${rowIndex % 2 === 0 ? -offset : offset}px)`,
              willChange: 'transform',
            }}
          >
            {row.map((committee, index) => (
              <PhotoTile key={`${committee.name}-${index}`} {...committee} />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}