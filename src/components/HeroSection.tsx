import { useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import FadeIn from './FadeIn';
import NavAuthSection from './NavAuthSection';
import HeroBackground from './HeroBackground';
import Magnet from './Magnet';

const NAV_LINKS = [
  { label: 'About-us', href: '#about' },
  { label: 'Navigate', href: '#navigate' },
  { label: 'Events', href: '#events' },
  { label: 'Contact', href: '#contact' },
];

const HERO_TITLE = 'MOSAIC-2K26';

function useFitFontSize(text: string) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);
  const [fontSize, setFontSize] = useState(160);

  useLayoutEffect(() => {
    const recalc = () => {
      const container = containerRef.current;
      const textEl = textRef.current;
      if (!container || !textEl) return;
      const baseline = 200;
      textEl.style.fontSize = `${baseline}px`;
      const textWidth = textEl.scrollWidth;
      const containerWidth = container.clientWidth;
      if (textWidth > 0) {
        const size = Math.floor((containerWidth / textWidth) * baseline);
        // set directly too: React skips re-render when the value is unchanged,
        // which would leave the imperative 200px baseline stuck on screen
        textEl.style.fontSize = `${size}px`;
        setFontSize(size);
      }
    };
    recalc();
    document.fonts?.ready.then(recalc); // re-measure once Kanit has loaded
    window.addEventListener('resize', recalc);
    return () => window.removeEventListener('resize', recalc);
  }, [text]);

  return { containerRef, textRef, fontSize };
}

interface HeroSectionProps {
  onRegisterClick: () => void;
}

export default function HeroSection({ onRegisterClick }: HeroSectionProps) {
  const { containerRef, textRef, fontSize } = useFitFontSize(HERO_TITLE);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <section className="relative flex min-h-[100svh] flex-col" style={{ overflowX: 'clip' }}>
      <HeroBackground />
      {/*
        All 5 items (4 links + NavAuthSection) are direct children of this
        `justify-between` flex row, same as before Register was replaced by
        NavAuthSection — that's what spreads them evenly across the full
        width instead of clustering the links together on the left.
      */}
      <nav className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-[#D7E2EA]/20 bg-[#0C0C0C]/80 px-4 py-3 backdrop-blur-md sm:px-6 md:px-10 md:py-5">
        {/* mobile: brand on the left */}
        <a href="#" className="text-sm font-black uppercase tracking-widest text-[#D7E2EA] md:hidden">
          MOSAIC-2K26
        </a>

        {/* md+: links spread across the bar */}
        {NAV_LINKS.map((link, i) => (
          <FadeIn key={link.label} delay={i * 0.05} y={-20} className="hidden md:inline-block">
            <a
              href={link.href}
              className="text-lg font-medium uppercase tracking-wider text-[#D7E2EA] transition-opacity duration-200 hover:opacity-70 lg:text-[1.4rem]"
            >
              {link.label}
            </a>
          </FadeIn>
        ))}

        <div className="flex items-center gap-3">
          <FadeIn delay={NAV_LINKS.length * 0.05} y={-20} className="inline-block">
            <NavAuthSection />
          </FadeIn>

          {/* mobile: hamburger */}
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D7E2EA]/20 bg-[#151515] text-[#D7E2EA] md:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* mobile dropdown */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="absolute inset-x-0 top-full border-b border-[#D7E2EA]/20 bg-[#0C0C0C]/95 backdrop-blur-xl md:hidden"
            >
              <ul className="flex flex-col px-4 py-2 sm:px-6">
                {NAV_LINKS.map((link) => (
                  <li key={link.label} className="border-b border-[#D7E2EA]/10 last:border-b-0">
                    <a
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className="block py-3.5 text-sm font-medium uppercase tracking-widest text-[#D7E2EA]/90 transition-colors active:text-white"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6 px-5 text-center sm:gap-7 md:gap-8">
        <FadeIn delay={0.1} y={16}>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#D7E2EA]/25 bg-[#0C0C0C]/40 px-4 py-1.5 text-[0.65rem] font-medium uppercase tracking-[0.28em] text-[#D7E2EA]/70 backdrop-blur-sm sm:text-xs">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#59C7E8] opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#59C7E8]" />
            </span>
            Registrations Open
          </span>
        </FadeIn>

        <div ref={containerRef} className="w-full overflow-hidden">
          <FadeIn delay={0.2} y={40} as="div">
            <h1
              ref={textRef}
              className="hero-heading inline-block whitespace-nowrap text-center font-black uppercase leading-none tracking-tight"
              style={{ fontSize: `${fontSize}px` }}
            >
              {HERO_TITLE}
            </h1>
          </FadeIn>
        </div>

        <FadeIn delay={0.35} y={20}>
          <p className="max-w-md text-sm uppercase tracking-[0.35em] text-[#D7E2EA]/50 sm:text-base">
            Many Minds · A Brighter Tomorrow
          </p>
        </FadeIn>

        <FadeIn delay={0.5} y={20}>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-4">
            <Magnet padding={80} strength={4}>
              <button
                onClick={onRegisterClick}
                className="rounded-full p-[1.5px] transition-transform duration-200 hover:scale-[1.03]"
                style={{ background: 'linear-gradient(135deg, #B600A8 0%, #7621B0 50%, #BE4C00 100%)' }}
              >
                <span className="block rounded-full bg-[#0C0C0C] px-8 py-3 text-sm font-semibold uppercase tracking-wider text-[#D7E2EA] sm:px-10 sm:py-3.5">
                  Register Now
                </span>
              </button>
            </Magnet>

            <a
              href="#events"
              className="px-6 py-3 text-sm font-medium uppercase tracking-wider text-[#D7E2EA]/70 transition-colors duration-200 hover:text-[#D7E2EA]"
            >
              Explore Events →
            </a>
          </div>
        </FadeIn>
      </div>

      <FadeIn delay={1} y={0} className="pointer-events-none absolute inset-x-0 bottom-6 z-10 flex justify-center">
        <div className="flex flex-col items-center gap-2 text-[#D7E2EA]/40">
          <span className="text-[0.6rem] uppercase tracking-[0.3em]">Scroll</span>
          <span className="h-8 w-px animate-pulse bg-gradient-to-b from-[#D7E2EA]/60 to-transparent" />
        </div>
      </FadeIn>
    </section>
  );
}