import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from 'framer-motion';
import { Home, CalendarDays, Phone, Info, UserPlus } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Home', href: '#', icon: Home },
  { label: 'About', href: '#about', icon: Info },
  { label: 'Events', href: '#events', icon: CalendarDays },
  { label: 'Contact', href: '#contact', icon: Phone },
  { label: 'Register', href: '#register', icon: UserPlus },
];

// Magnetic dock tuning — how far the cursor's influence reaches, how big an
// icon gets at the very center of that influence, and how far it "pops"
// off the bar toward the page as it grows.
const MAGNETIC_DISTANCE = 110;
const MAX_SCALE = 1.35;
const POP_DISTANCE = 16;
const SPRING = { damping: 20, stiffness: 300, mass: 0.5 };

interface SideNavProps {
  onRegisterClick: () => void;
}

function NavItem({
  label,
  href,
  Icon,
  isRegister,
  onRegisterClick,
  mouseY,
}: {
  label: string;
  href: string;
  Icon: typeof Home;
  isRegister: boolean;
  onRegisterClick: () => void;
  mouseY: MotionValue<number>;
}) {
  // Measured on this fixed-size wrapper (not the part that visually scales)
  // so the distance calculation has a stable center to work from.
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

  // Left-edge dock: pop toward the page (positive x) as it grows.
  const popRaw = useTransform(scale, (s) => (s - 1) * POP_DISTANCE);
  const pop = useSpring(popRaw, SPRING);

  return (
    <div ref={ref} className="group relative z-10">
      <motion.a
        href={href}
        onClick={(e) => {
          if (isRegister) {
            e.preventDefault();
            onRegisterClick();
          }
        }}
        whileTap={{ scale: 0.92 }}
        aria-label={label}
        className="relative flex h-14 w-14 items-center justify-center"
      >
        <motion.div
          style={{ scale, x: pop }}
          className="absolute inset-0 flex items-center justify-center rounded-full border border-[#D7E2EA]/15 bg-[#151515] text-[#D7E2EA]/70 transition-colors duration-200 group-hover:border-[#D7E2EA]/40 group-hover:text-white"
        >
          <Icon className="relative h-6 w-6" strokeWidth={1.75} />
        </motion.div>
      </motion.a>

      <span className="pointer-events-none absolute left-full top-1/2 ml-4 -translate-y-1/2 whitespace-nowrap rounded-full border border-[#D7E2EA]/20 bg-[#151515] px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-[#D7E2EA] opacity-0 shadow-lg transition-all duration-200 group-hover:opacity-100">
        {label}
      </span>
    </div>
  );
}

export default function SideNav({ onRegisterClick }: SideNavProps) {
  // Infinity keeps every icon at rest (distance always exceeds
  // MAGNETIC_DISTANCE) until the cursor actually enters the dock.
  const mouseY = useMotionValue(Infinity);

  return (
    <nav
      onMouseMove={(e) => mouseY.set(e.clientY)}
      onMouseLeave={() => mouseY.set(Infinity)}
      className="fixed left-5 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-center gap-3 rounded-[28px] border border-[#D7E2EA]/15 bg-[#0C0C0C]/80 p-4 shadow-[0_8px_40px_rgba(0,0,0,0.55)] backdrop-blur-xl lg:flex"
      aria-label="Section navigation"
    >
      {/* connecting spine */}
      <div className="absolute left-1/2 top-4 h-[calc(100%-2rem)] w-px -translate-x-1/2 bg-[#D7E2EA]/10" />

      {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
        <NavItem
          key={label}
          label={label}
          href={href}
          Icon={Icon}
          isRegister={label === 'Register'}
          onRegisterClick={onRegisterClick}
          mouseY={mouseY}
        />
      ))}
    </nav>
  );
}