import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from 'framer-motion';
import { Globe, Instagram, Linkedin } from 'lucide-react';

// TODO: replace '#' with the official college website URL.
const SOCIAL_LINKS = [
  { label: 'Instagram', href: 'https://www.instagram.com/techfest_mosaic?stkn=dDBvMnF4YnFyYmt2', icon: Instagram },
  { label: 'LinkedIn', href: '#', icon: Linkedin },
  { label: 'College Website', href: '#', icon: Globe },
];

// Same magnetic-dock tuning as SideNav, mirrored for the right edge.
const MAGNETIC_DISTANCE = 110;
const MAX_SCALE = 1.35;
const POP_DISTANCE = 16;
const SPRING = { damping: 20, stiffness: 300, mass: 0.5 };

function SocialItem({
  label,
  href,
  Icon,
  mouseY,
}: {
  label: string;
  href: string;
  Icon: typeof Instagram;
  mouseY: MotionValue<number>;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const distance = useTransform(mouseY, (val) => {
    if (!ref.current) return MAGNETIC_DISTANCE + 1;
    const rect = ref.current.getBoundingClientRect();
    const center = rect.top + rect.height / 2;
    return val - center;
  });

  const scaleRaw = useTransform(
    distance,
    [-MAGNETIC_DISTANCE, 0, MAGNETIC_DISTANCE],
    [1, MAX_SCALE, 1]
  );
  const scale = useSpring(scaleRaw, SPRING);

  // Right-edge dock: pop toward the page (negative x) as it grows.
  const popRaw = useTransform(scale, (s) => (s - 1) * -POP_DISTANCE);
  const pop = useSpring(popRaw, SPRING);

  return (
    <div ref={ref} className="group relative z-10">
      <motion.a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        whileTap={{ scale: 0.92 }}
        className="relative flex h-14 w-14 items-center justify-center"
      >
        <motion.div
          style={{ scale, x: pop }}
          className="absolute inset-0 flex items-center justify-center rounded-full border border-[#D7E2EA]/15 bg-[#151515] text-[#D7E2EA]/70 transition-colors duration-200 group-hover:border-[#D7E2EA]/40 group-hover:text-white"
        >
          <Icon className="relative h-6 w-6" strokeWidth={1.75} />
        </motion.div>
      </motion.a>

      <span className="pointer-events-none absolute right-full top-1/2 mr-4 -translate-y-1/2 whitespace-nowrap rounded-full border border-[#D7E2EA]/20 bg-[#151515] px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-[#D7E2EA] opacity-0 shadow-lg transition-all duration-200 group-hover:opacity-100">
        {label}
      </span>
    </div>
  );
}

export default function SocialSidebar() {
  const mouseY = useMotionValue(Infinity);

  return (
    <div
      onMouseMove={(e) => mouseY.set(e.clientY)}
      onMouseLeave={() => mouseY.set(Infinity)}
      className="fixed right-5 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-center gap-3 rounded-[28px] border border-[#D7E2EA]/15 bg-[#0C0C0C]/80 p-4 shadow-[0_8px_40px_rgba(0,0,0,0.55)] backdrop-blur-xl lg:flex"
      aria-label="Social media links"
    >
      {/* connecting spine */}
      <div className="absolute left-1/2 top-4 h-[calc(100%-2rem)] w-px -translate-x-1/2 bg-[#D7E2EA]/10" />

      {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
        <SocialItem key={label} label={label} href={href} Icon={Icon} mouseY={mouseY} />
      ))}
    </div>
  );
}