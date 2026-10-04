import { motion } from 'framer-motion';
import { Instagram, Twitter, Linkedin, Facebook, Youtube, MessageCircle } from 'lucide-react';
import FadeIn from './FadeIn';
import { ACCENT } from '../lib/theme';

// TODO: replace with real links/details once finalized
const SOCIAL_LINKS = [
  { label: 'Instagram', href: '#', icon: Instagram },
  { label: 'Twitter / X', href: '#', icon: Twitter },
  { label: 'LinkedIn', href: '#', icon: Linkedin },
  { label: 'Facebook', href: '#', icon: Facebook },
  { label: 'YouTube', href: '#', icon: Youtube },
  { label: 'WhatsApp', href: '#', icon: MessageCircle },
];

const QUICK_LINKS = [
  { label: 'Home', href: '#' },
  { label: 'About', href: '#about' },
  { label: 'Events', href: '#events' },
  { label: 'Contact', href: '#contact' },
];

const CONTACT_EMAIL = 'hello@mosaic2k26.com'; // TODO: real contact email
const VENUE = 'SFIT Campus'; // TODO: real venue line


const MARQUEE_TEXT = 'MANY MINDS · A BRIGHTER TOMORROW · MOSAIC 2K26 · ';

function MarqueeBand() {
  // Duplicated content, animated -50% so the loop is seamless.
  const repeated = MARQUEE_TEXT.repeat(6);
  return (
    <div className="relative overflow-hidden border-y border-[#D7E2EA]/10 py-4">
      <motion.div
        className="flex whitespace-nowrap"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 26, repeat: Infinity, ease: 'linear' }}
      >
        {[0, 1].map((i) => (
          <span
            key={i}
            className="hero-heading pr-4 text-2xl font-black uppercase tracking-tight text-[#D7E2EA]/15 sm:text-4xl"
          >
            {repeated}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-[#0C0C0C] pt-4 pb-8">
      {/* background texture — faint grid + glow, echoes HeroBackground so
          the footer doesn't feel like a flat, disconnected slab */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              'linear-gradient(#D7E2EA 1px, transparent 1px), linear-gradient(90deg, #D7E2EA 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      <div className="relative">
        <MarqueeBand />

        <div className="mx-auto max-w-6xl px-5 sm:px-8 md:px-10">
          {/* CTA block */}
          <FadeIn delay={0} y={30}>
            <div className="flex flex-col items-center gap-6 py-16 text-center">
              <div className="h-11 w-11 rounded-full p-[1.5px]" style={{ background: ACCENT }}>
                <span className="flex h-full w-full items-center justify-center rounded-full bg-[#0C0C0C]">
                  <span className="font-display italic text-sm text-[#D7E2EA]">MO</span>
                </span>
              </div>

              <h2
                className="hero-heading font-black uppercase leading-none tracking-tight text-[#D7E2EA]"
                style={{ fontSize: 'clamp(2.25rem, 7vw, 88px)' }}
              >
                Got questions?
              </h2>

              <a
                href={`mailto:${CONTACT_EMAIL}`}
                style={{ background: ACCENT }}
                className="rounded-full px-8 py-3.5 text-sm font-semibold uppercase tracking-widest text-[#0C0C0C] transition-transform hover:scale-105"
              >
                {CONTACT_EMAIL}
              </a>
            </div>
          </FadeIn>

          {/* middle: links / contact / socials */}
          <div className="grid grid-cols-1 gap-10 border-t border-[#D7E2EA]/10 py-12 sm:grid-cols-3">
            <FadeIn delay={0.05} y={20} className="text-center sm:text-left">
              <p className="mb-4 text-xs uppercase tracking-[0.3em] text-[#D7E2EA]/40">
                Navigate
              </p>
              <ul className="space-y-2.5">
                {QUICK_LINKS.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-[#D7E2EA]/70 transition-colors hover:text-[#D7E2EA]"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </FadeIn>

            <FadeIn delay={0.1} y={20} className="text-center">
              <p className="mb-4 text-xs uppercase tracking-[0.3em] text-[#D7E2EA]/40">
                Get in touch
              </p>
              <p className="text-sm text-[#D7E2EA]/50">{VENUE}</p>

              <div className="mt-4 inline-flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                </span>
                <span className="text-xs uppercase tracking-widest text-[#D7E2EA]/50">
                  Registrations open
                </span>
              </div>
            </FadeIn>

            <FadeIn delay={0.15} y={20} className="text-center sm:text-right">
              <p className="mb-4 text-xs uppercase tracking-[0.3em] text-[#D7E2EA]/40">
                Follow along
              </p>
              <div className="flex flex-wrap justify-center gap-2.5 sm:justify-end">
                {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="group relative flex h-10 w-10 items-center justify-center rounded-full border border-[#D7E2EA]/15 bg-[#151515] text-[#D7E2EA]/70 transition-colors duration-200 hover:border-transparent hover:text-[#0C0C0C]"
                  >
                    <span
                      className="absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                      style={{ background: ACCENT }}
                    />
                    <Icon className="relative h-4 w-4" strokeWidth={1.75} />
                  </a>
                ))}
              </div>
            </FadeIn>
          </div>

          {/* bottom bar */}
          <div className="flex flex-col items-center justify-between gap-4 border-t border-[#D7E2EA]/10 pt-6 text-center sm:flex-row sm:text-left">
            <p className="text-xs text-[#D7E2EA]/35">
              © {new Date().getFullYear()} Mosaic-2K26. All rights reserved.
            </p>
            <p className="text-xs text-[#D7E2EA]/35">
              Built by the students, for the students.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}