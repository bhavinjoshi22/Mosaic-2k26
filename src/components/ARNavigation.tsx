import { useState, useRef, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Navigation2,
  Zap,
  Trophy,
  MapPin,
  ChevronRight,
  Compass,
  Battery,
  Signal,
  Camera,
  Volume2,
  VolumeX,
  Sparkles,
  PartyPopper,
  ArrowUp,
  ArrowLeft,
  ArrowRight,
  ArrowUpLeft,
  ArrowUpRight,
  Target,
  RefreshCw,
  Video,
  VideoOff,
  AlertCircle,
  X,
  Search,
  Layers,
  CheckCircle,
  Footprints,
  LocateFixed,
} from "lucide-react";

/* =========================================================
   1. TYPES, REAL GPS COORDINATES & DATA
   ========================================================= */

export type Direction = "straight" | "slight-left" | "left" | "slight-right" | "right" | "arrived";

export interface Waypoint {
  id: number;
  title: string;
  subtitle: string;
  actionText?: string;
  direction: Direction;
  targetDistance: number; // nominal meters
  lat: number;
  lng: number;
  xpReward: number;
  landmark: string;
  tip?: string;
  voicePrompt: string;
  achievement?: { title: string; icon: string };
}

// SFIT Borivali Campus GPS anchors
export const ROUTE: Waypoint[] = [
  {
    id: 0,
    title: "SFIT Main Gate",
    subtitle: "Head 20m straight into the campus avenue",
    actionText: "START WALKING",
    direction: "straight",
    targetDistance: 20,
    lat: 19.243512,
    lng: 72.855734,
    xpReward: 50,
    landmark: "SFIT Gate",
    tip: "Walk straight past the security checkpoint towards the walkway.",
    voicePrompt: "Walk 20 meters straight into the campus avenue.",
  },
  {
    id: 1,
    title: "Main Building Approach",
    subtitle: "Turn slightly left towards Main Building",
    actionText: "KEEP GOING",
    direction: "slight-left",
    targetDistance: 45,
    lat: 19.243721,
    lng: 72.855912,
    xpReward: 100,
    landmark: "Main Building Foyer",
    tip: "Turn slightly left towards the Main Building foyer.",
    voicePrompt: "Turn slightly left towards the Main Building and keep going for 45 meters.",
    achievement: { title: "On The Move", icon: "🧭" },
  },
  {
    id: 2,
    title: "Main Building Wing",
    subtitle: "Turn right at Main Building",
    actionText: "TURN RIGHT AT MAIN BUILDING",
    direction: "right",
    targetDistance: 35,
    lat: 19.243884,
    lng: 72.856145,
    xpReward: 200,
    landmark: "Main Building",
    tip: "Turn right by the main portico towards the event stage.",
    voicePrompt: "Turn right at the Main Building towards the festival stage.",
    achievement: { title: "Stage Approaching", icon: "⚡" },
  },
  {
    id: 3,
    title: "Mosaic Main Stage",
    subtitle: "Welcome to Mosaic 2k26! 🎉",
    actionText: "WELCOME TO MOSAIC",
    direction: "arrived",
    targetDistance: 0,
    lat: 19.244052,
    lng: 72.856389,
    xpReward: 500,
    landmark: "Mosaic Stage",
    tip: "You have arrived! Welcome to Mosaic 2k26 festival.",
    voicePrompt: "You have arrived at the stage. Welcome to Mosaic 2k26!",
    achievement: { title: "Festival Navigator", icon: "🏆" },
  },
];

export const TOTAL_DISTANCE = ROUTE.reduce((acc, w) => acc + w.targetDistance, 0);

// Real Haversine Distance Calculator (meters)
function calculateHaversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export interface RoomOption {
  id: string;
  name: string;
  roomNumber: string;
  floor: string;
  category: "Technical Society" | "Departmental" | "Coding & Dev" | "Robotics & Racing";
  description: string;
  image: string;
  tag: string;
  exhibits: string[];
}

export const ROOMS_DATA: RoomOption[] = [
  {
    id: "ieee",
    name: "IEEE",
    roomNumber: "620",
    floor: "6th Floor",
    category: "Technical Society",
    description:
      "Institute of Electrical and Electronics Engineers SFIT Student Branch. Project exhibitions, IoT showcases & AI tech demos.",
    image:
      "https://images.pexels.com/photos/8566470/pexels-photo-8566470.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tag: "IoT & AI Showcase",
    exhibits: ["Smart City IoT Model", "AI Computer Vision Demos", "Robotics Arm"],
  },
  {
    id: "csi",
    name: "CSI",
    roomNumber: "318",
    floor: "3rd Floor",
    category: "Technical Society",
    description:
      "Computer Society of India SFIT Chapter. Software hackathon hub, algorithmic challenges and full-stack project showcases.",
    image:
      "https://images.pexels.com/photos/5483077/pexels-photo-5483077.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tag: "Coding & Web3",
    exhibits: ["Live Code Battle", "Full-Stack Web Demos", "Cybersecurity Quiz"],
  },
  {
    id: "iete",
    name: "IETE",
    roomNumber: "514",
    floor: "5th Floor",
    category: "Technical Society",
    description:
      "Institution of Electronics and Telecommunication Engineers. Telecom networks, signal processing and antenna hardware demos.",
    image:
      "https://images.pexels.com/photos/36169774/pexels-photo-36169774.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tag: "Telecom & RF",
    exhibits: ["SDR Radio Station", "Microcontroller Hardware", "Signal Visualizer"],
  },
  {
    id: "iste",
    name: "ISTE",
    roomNumber: "414",
    floor: "4th Floor",
    category: "Technical Society",
    description:
      "Indian Society for Technical Education. Multidisciplinary innovation, technical paper presentations and hands-on workshops.",
    image:
      "https://images.pexels.com/photos/7868836/pexels-photo-7868836.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tag: "Tech Innovation",
    exhibits: ["Project Model Displays", "Technical Paper Expo", "Arduino Workshops"],
  },
  {
    id: "codex",
    name: "CODEX",
    roomNumber: "421, 422",
    floor: "4th Floor",
    category: "Coding & Dev",
    description:
      "SFIT Premier Competitive Programming and Open Source Club. High-intensity competitive coding arena, speed debug & LAN gaming.",
    image:
      "https://images.pexels.com/photos/1089438/pexels-photo-1089438.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tag: "Competitive Coding",
    exhibits: ["Blind Coding Challenge", "Algorithmic Arena", "Open-Source Terminal"],
  },
  {
    id: "itsa",
    name: "ITSA",
    roomNumber: "304",
    floor: "3rd Floor",
    category: "Departmental",
    description:
      "Information Technology Students' Association. Cloud computing, machine learning applications, and UI/UX design showcase.",
    image:
      "https://images.pexels.com/photos/33158875/pexels-photo-33158875.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tag: "Cloud & Data Science",
    exhibits: ["Cloud Architecture Lab", "UI/UX Interactive Hub", "Big Data Analytics"],
  },
  {
    id: "eesa",
    name: "EESA",
    roomNumber: "230",
    floor: "2nd Floor",
    category: "Departmental",
    description:
      "Electrical Engineering Students' Association. Power electronics, smart grid demos, high-voltage circuits and renewable energy prototypes.",
    image:
      "https://images.pexels.com/photos/1432794/pexels-photo-1432794.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tag: "Power & Energy",
    exhibits: ["Solar Smart Inverter", "Tesla Coil Demo", "Micro-Grid Simulator"],
  },
  {
    id: "mesa",
    name: "MESA",
    roomNumber: "006",
    floor: "Ground Floor",
    category: "Departmental",
    description:
      "Mechanical Engineering Students' Association. 3D printing lab, CAD/CAM models, thermodynamic mechanisms & hydraulic robots.",
    image:
      "https://images.pexels.com/photos/8294611/pexels-photo-8294611.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tag: "CAD & 3D Print",
    exhibits: ["3D Printing Live Lab", "IC Engine Model", "Robotic Crane"],
  },
  {
    id: "etan",
    name: "ETAN",
    roomNumber: "128",
    floor: "1st Floor",
    category: "Departmental",
    description:
      "Electronics & Telecommunication Association Network. Embedded systems, PCB prototyping lab, wireless sensor arrays & audio synthesis.",
    image:
      "https://images.pexels.com/photos/3520692/pexels-photo-3520692.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tag: "Embedded & PCB",
    exhibits: ["PCB Etching Workstation", "LoRa Transceiver", "Audio Synthesizer"],
  },
  {
    id: "ecssa",
    name: "ECSSA",
    roomNumber: "618",
    floor: "6th Floor",
    category: "Departmental",
    description:
      "Electronics & Computer Science Students' Association. Edge AI computing, FPGA design, autonomous drones & computer vision.",
    image:
      "https://images.pexels.com/photos/37694202/pexels-photo-37694202.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tag: "Edge AI & FPGA",
    exhibits: ["Autonomous Quadcopter", "FPGA Accelerator", "Gesture Tracker"],
  },
  {
    id: "adg",
    name: "ADG",
    roomNumber: "028",
    floor: "Ground Floor",
    category: "Coding & Dev",
    description:
      "Apple Developers Group SFIT. Swift, iOS app development, VisionOS spatial computing, and human interface guidelines.",
    image:
      "https://images.pexels.com/photos/5926389/pexels-photo-5926389.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tag: "iOS & VisionOS",
    exhibits: ["Vision Pro Experience", "Swift Playground Lab", "Student Apps"],
  },
  {
    id: "team_raw",
    name: "Team RAW",
    roomNumber: "027",
    floor: "Ground Floor",
    category: "Robotics & Racing",
    description:
      "Robotics and Automation Wing SFIT. Combat robots, robowars arena, autonomous maze solvers and all-terrain rovers.",
    image:
      "https://images.pexels.com/photos/7868884/pexels-photo-7868884.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tag: "Combat Robotics",
    exhibits: ["RoboWars 15kg Combat Robot", "All-Terrain Rover", "Line Follower"],
  },
  {
    id: "team_gatee_tejas",
    name: "Team GATEE & TEJAS",
    roomNumber: "213",
    floor: "2nd Floor",
    category: "Robotics & Racing",
    description:
      "SFIT Official Formula Student & Supermileage Racing Teams. Prototype vehicles, telemetry, chassis & EV battery pack design.",
    image:
      "https://images.pexels.com/photos/13857975/pexels-photo-13857975.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tag: "Formula Racing & EV",
    exhibits: ["Formula Student Race Car", "EV Powertrain", "Carbon Fiber Aero"],
  },
];

/* =========================================================
   2. SYNTHESIZED WEB AUDIO & VOICE GUIDANCE
   ========================================================= */

class AudioManager {
  private ctx: AudioContext | null = null;
  public voiceEnabled: boolean = true;
  public soundEnabled: boolean = true;

  private getContext() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  playXpGain() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch {
      /* ignore */
    }
  }

  playTurnAlert() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      [0, 0.12].forEach((delay, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(i === 0 ? 659.25 : 987.77, now + delay);
        gain.gain.setValueAtTime(0.2, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.25);
      });
    } catch {
      /* ignore */
    }
  }

  playAchievement() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5];
      const now = ctx.currentTime;
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        gain.gain.setValueAtTime(0.22, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.4);
      });
    } catch {
      /* ignore */
    }
  }

  speak(text: string) {
    if (!this.voiceEnabled || typeof window === "undefined" || !("speechSynthesis" in window))
      return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.volume = 0.9;
      window.speechSynthesis.speak(utterance);
    } catch {
      /* ignore */
    }
  }
}

export const audioManager = new AudioManager();

/* =========================================================
   3. GOOGLE-STYLE 3D AR GROUND RIBBON & ARROW
   ========================================================= */

function GroundARPathLine({ direction, distance }: { direction: Direction; distance: number }) {
  if (direction === "arrived") return null;

  // Google Live View style: path always STARTS at horizontal centre bottom (500,600)
  // of a 1000x600 viewBox and curves away — never off-screen to one side.
  const getCurve = () => {
    switch (direction) {
      case "slight-left":
        return "M 500 600 C 500 440 470 320 360 170";
      case "left":
        return "M 500 600 C 500 420 430 360 130 300";
      case "right":
        return "M 500 600 C 500 420 570 360 870 300";
      case "slight-right":
        return "M 500 600 C 500 440 530 320 640 170";
      default:
        return "M 500 600 C 500 450 500 300 500 120";
    }
  };

  const curve = getCurve();

  return (
    <>
      {/* Full-width floor layer, perspective-projected like Google AR */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[62%]"
        style={{
          transform: "perspective(560px) rotateX(62deg)",
          transformOrigin: "bottom center",
        }}
      >
        <svg
          viewBox="0 0 1000 600"
          preserveAspectRatio="xMidYMax meet"
          className="h-full w-full"
        >
          <defs>
            <linearGradient id="arPathGlow" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.95" />
              <stop offset="55%" stopColor="#38bdf8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#818cf8" stopOpacity="0.5" />
            </linearGradient>
            <filter id="glowEffect" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="14" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* wide soft glow under the ribbon */}
          <path
            d={curve}
            fill="none"
            stroke="url(#arPathGlow)"
            strokeWidth="86"
            strokeLinecap="round"
            opacity="0.55"
            filter="url(#glowEffect)"
          />
          {/* the ribbon body (road) */}
          <path
            d={curve}
            fill="none"
            stroke="url(#arPathGlow)"
            strokeWidth="58"
            strokeLinecap="round"
            opacity="0.92"
          />
          {/* inner darker lane for depth */}
          <path
            d={curve}
            fill="none"
            stroke="rgba(3,10,28,0.55)"
            strokeWidth="44"
            strokeLinecap="round"
          />
          {/* flowing white dashes — Google's centre lane marking */}
          <motion.path
            d={curve}
            fill="none"
            stroke="#ffffff"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray="46 44"
            animate={{ strokeDashoffset: [0, -90] }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </svg>
      </div>

      {/* Distance bubble — always dead-centre, above the ribbon start */}
      <div className="pointer-events-none absolute bottom-[46%] left-1/2 z-20 -translate-x-1/2">
        <div className="rounded-full border border-cyan-300/80 bg-slate-950/90 px-4 py-1.5 text-xs font-black text-cyan-300 shadow-[0_0_25px_rgba(34,211,238,0.6)] backdrop-blur">
          {distance > 0 ? `${distance} m` : "Turn point"}
        </div>
        <div className="mx-auto h-10 w-0.5 bg-gradient-to-b from-cyan-300/80 to-transparent" />
      </div>
    </>
  );
}

function DirectionArrow({ direction }: { direction: Direction }) {
  if (direction === "arrived") {
    return (
      <motion.div
        animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="relative"
      >
        <div className="flex h-36 w-36 items-center justify-center rounded-full border-4 border-amber-400 bg-gradient-to-br from-amber-400/30 to-rose-500/30 shadow-[0_0_60px_rgba(251,191,36,0.8)] backdrop-blur-md sm:h-44 sm:w-44">
          <PartyPopper className="h-16 w-16 text-amber-300" />
        </div>
      </motion.div>
    );
  }

  const isTurn = direction !== "straight";

  const renderArrowIcon = () => {
    const cls = "h-14 w-14 text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]";
    switch (direction) {
      case "slight-left":
        return <ArrowUpLeft className={cls} strokeWidth={3.5} />;
      case "left":
        return <ArrowLeft className={cls} strokeWidth={3.5} />;
      case "slight-right":
        return <ArrowUpRight className={cls} strokeWidth={3.5} />;
      case "right":
        return <ArrowRight className={cls} strokeWidth={3.5} />;
      default:
        return <ArrowUp className={cls} strokeWidth={3.5} />;
    }
  };

  return (
    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
      className="relative flex items-center justify-center"
    >
      <div
        style={{ transform: "perspective(450px) rotateX(42deg)", transformStyle: "preserve-3d" }}
        className="relative flex items-center justify-center"
      >
        <div
          className={`absolute -inset-4 rounded-full blur-2xl ${
            isTurn ? "bg-amber-400/35" : "bg-cyan-400/35"
          }`}
        />
        <div
          className={`relative flex h-28 w-28 items-center justify-center rounded-full border-4 sm:h-32 sm:w-32 ${
            isTurn
              ? "border-amber-300 bg-gradient-to-br from-amber-400/40 via-rose-500/30 to-violet-500/40 shadow-[0_0_40px_rgba(251,191,36,0.8)]"
              : "border-cyan-300 bg-gradient-to-br from-cyan-400/40 via-sky-500/30 to-violet-500/40 shadow-[0_0_40px_rgba(34,211,238,0.8)]"
          } backdrop-blur-sm`}
        >
          {renderArrowIcon()}
        </div>
      </div>
    </motion.div>
  );
}

function ARScene({
  cameraStream,
  cameraActive,
  videoRef,
}: {
  cameraStream: MediaStream | null;
  cameraActive: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}) {
  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraStream, videoRef]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-slate-950">
      {cameraActive && (
        <video
          ref={videoRef as React.RefObject<HTMLVideoElement>}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      {!cameraActive && (
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950" />
          <div className="pointer-events-none absolute bottom-1/3 left-0 right-0 flex items-end justify-around px-4 opacity-40">
            <div className="h-32 w-20 rounded-t-lg bg-slate-800" />
            <div className="h-48 w-24 rounded-t-lg bg-slate-800" />
            <div className="h-36 w-16 rounded-t-lg bg-slate-800" />
            <div className="h-56 w-28 rounded-t-lg bg-slate-800" />
            <div className="h-40 w-20 rounded-t-lg bg-slate-800" />
            <div className="h-44 w-24 rounded-t-lg bg-slate-800" />
          </div>

          <div
            className="absolute bottom-0 left-0 right-0 h-1/2"
            style={{
              background:
                "linear-gradient(to bottom, rgba(34,211,238,0.05) 0%, rgba(34,211,238,0.2) 100%)",
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(34,211,238,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.4) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
                transform: "perspective(300px) rotateX(60deg)",
                transformOrigin: "center top",
                maskImage: "linear-gradient(to bottom, transparent 0%, black 30%, black 100%)",
              }}
            />
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/70 via-transparent to-slate-950/80" />

      {[
        "top-6 left-6 border-t-2 border-l-2",
        "top-6 right-6 border-t-2 border-r-2",
        "bottom-6 left-6 border-b-2 border-l-2",
        "bottom-6 right-6 border-b-2 border-r-2",
      ].map((pos, i) => (
        <div key={i} className={`pointer-events-none absolute h-6 w-6 border-cyan-400/60 ${pos}`} />
      ))}
    </div>
  );
}

/* =========================================================
   4. CAMPUS 2D TOP-DOWN MAP MODAL
   ========================================================= */

function CampusMapModal({
  currentWaypointIndex,
  onClose,
}: {
  currentWaypointIndex: number;
  onClose: () => void;
}) {
  const mapNodes = [
    { id: 0, label: "SFIT Gate", x: 22, y: 82 },
    { id: 1, label: "Main Bldg Approach", x: 42, y: 58 },
    { id: 2, label: "Main Bldg (Right)", x: 68, y: 40 },
    { id: 3, label: "Mosaic Stage", x: 48, y: 16 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="relative w-full max-w-lg rounded-3xl border border-cyan-500/30 bg-slate-900/95 p-6 shadow-2xl shadow-cyan-500/20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">SFIT Campus Map</h3>
              <p className="text-xs text-slate-400">Mosaic 2k26 AR Route</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-slate-400 hover:bg-white/20 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative mt-4 h-72 w-full overflow-hidden rounded-2xl border border-cyan-500/20 bg-slate-950 p-4">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "linear-gradient(rgba(34,211,238,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.3) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
          <svg className="pointer-events-none absolute inset-0 h-full w-full">
            {mapNodes.map((node, i) => {
              if (i === mapNodes.length - 1) return null;
              const next = mapNodes[i + 1];
              const isPassed = i < currentWaypointIndex;
              return (
                <line
                  key={node.id}
                  x1={`${node.x}%`}
                  y1={`${node.y}%`}
                  x2={`${next.x}%`}
                  y2={`${next.y}%`}
                  stroke={isPassed ? "#22d3ee" : "#475569"}
                  strokeWidth={isPassed ? "3" : "2"}
                  strokeDasharray={isPassed ? "none" : "4 4"}
                />
              );
            })}
          </svg>

          {mapNodes.map((node, idx) => {
            const isCurrent = idx === currentWaypointIndex;
            const isPassed = idx < currentWaypointIndex;
            return (
              <div
                key={node.id}
                style={{ left: `${node.x}%`, top: `${node.y}%` }}
                className="absolute flex -translate-x-1/2 -translate-y-1/2 cursor-pointer flex-col items-center"
              >
                {isCurrent && (
                  <motion.div
                    animate={{ scale: [1, 2.2], opacity: [0.8, 0] }}
                    transition={{ duration: 1.6, repeat: Infinity }}
                    className="absolute h-8 w-8 rounded-full bg-cyan-400"
                  />
                )}
                <div
                  className={`relative flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shadow-md transition-all ${
                    isCurrent
                      ? "scale-110 bg-cyan-400 text-slate-950 ring-4 ring-cyan-400/40"
                      : isPassed
                      ? "bg-emerald-500 text-slate-950"
                      : "border border-slate-600 bg-slate-800 text-slate-300"
                  }`}
                >
                  {isCurrent ? "📍" : isPassed ? "✓" : idx + 1}
                </div>
                <div
                  className={`mt-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[10px] font-semibold backdrop-blur ${
                    isCurrent
                      ? "bg-cyan-500/90 font-bold text-slate-950 shadow-md"
                      : "bg-slate-900/80 text-slate-300"
                  }`}
                >
                  {node.label}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* =========================================================
   5. ROOM SELECTOR (13 ROOMS)
   ========================================================= */

function RoomSelector() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeModalRoom, setActiveModalRoom] = useState<RoomOption | null>(null);

  const categories = ["All", "Technical Society", "Departmental", "Coding & Dev", "Robotics & Racing"];

  const filteredRooms = ROOMS_DATA.filter((room) => {
    const matchesCategory = selectedCategory === "All" || room.category === selectedCategory;
    const matchesSearch =
      room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.floor.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCardClick = (room: RoomOption) => {
    audioManager.playXpGain();
    audioManager.speak(`Selected ${room.name}, Room ${room.roomNumber} on ${room.floor}`);
    setActiveModalRoom(room);
  };

  return (
    <div className="mt-10 w-full text-left">
      <div className="mb-6 flex flex-col justify-between gap-3 px-1 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-300">
            <Compass className="h-3.5 w-3.5" />
            Interactive Campus Directory
          </div>
          <h2 className="text-2xl font-black capitalize tracking-tight text-white sm:text-3xl">
            select the room to visit
          </h2>
          <p className="mt-1 text-xs text-slate-400 sm:text-sm">
            Explore 13 committee exhibits, workshops, and lab showcases across SFIT.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search room (e.g. 620, CODEX)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-900/90 py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 backdrop-blur focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
          />
        </div>
      </div>

      <div className="scrollbar-none mb-5 flex items-center gap-2 overflow-x-auto pb-3 text-xs">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setSelectedCategory(cat);
              audioManager.playXpGain();
            }}
            className={`whitespace-nowrap rounded-full px-3.5 py-1.5 font-semibold transition-all ${
              selectedCategory === cat
                ? "bg-gradient-to-r from-cyan-400 to-violet-500 text-slate-950 shadow-md shadow-cyan-500/20"
                : "border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredRooms.map((room) => (
          <motion.div
            key={room.id}
            whileHover={{ y: -4, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleCardClick(room)}
            className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 text-left shadow-xl backdrop-blur-md transition-all hover:border-cyan-400/50 hover:shadow-cyan-500/10"
          >
            <div className="relative h-36 w-full overflow-hidden bg-slate-950">
              <img
                src={room.image}
                alt={room.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full border border-cyan-400/50 bg-slate-950/90 px-3 py-1 text-xs font-black text-cyan-300 shadow-lg shadow-cyan-500/30 backdrop-blur">
                <MapPin className="h-3 w-3 text-cyan-400" />
                <span>Room {room.roomNumber}</span>
              </div>
              <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-bold text-slate-300 backdrop-blur">
                <Layers className="h-3 w-3 text-violet-400" />
                <span>{room.floor}</span>
              </div>
            </div>

            <div className="flex flex-1 flex-col p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xl font-black text-white transition-colors group-hover:text-cyan-300">
                  {room.name}
                </h3>
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                  {room.tag}
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">{room.description}</p>
              <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs font-bold text-cyan-400 group-hover:text-cyan-300">
                <span>View Details & Guide</span>
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredRooms.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-slate-400">
          No rooms match your search. Try "620", "IEEE", "CODEX" or select "All".
        </div>
      )}

      <AnimatePresence>
        {activeModalRoom && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
            onClick={() => setActiveModalRoom(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto overflow-x-hidden rounded-3xl border border-cyan-400/40 bg-slate-900 text-left shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative h-48 w-full bg-slate-950">
                <img
                  src={activeModalRoom.image}
                  alt={activeModalRoom.name}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
                <button
                  onClick={() => setActiveModalRoom(null)}
                  className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-slate-300 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
                  <div>
                    <span className="rounded-full border border-cyan-400/30 bg-cyan-400/20 px-2.5 py-0.5 text-xs font-bold text-cyan-300">
                      {activeModalRoom.floor}
                    </span>
                    <h3 className="mt-1 text-3xl font-black text-white">{activeModalRoom.name}</h3>
                  </div>
                  <div className="rounded-2xl border border-cyan-400/50 bg-slate-950/90 px-4 py-2 text-right shadow-xl">
                    <div className="text-[10px] font-bold uppercase text-slate-400">Room</div>
                    <div className="text-xl font-black text-cyan-300">
                      {activeModalRoom.roomNumber}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-6">
                <p className="text-sm leading-relaxed text-slate-300">
                  {activeModalRoom.description}
                </p>
                <div>
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                    Featured Highlights & Demos
                  </h4>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {activeModalRoom.exhibits.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2.5 text-xs text-slate-200"
                      >
                        <CheckCircle className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-violet-500/30 bg-violet-500/10 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-violet-300">
                    <Compass className="h-4 w-4" />
                    How to reach from Main Stage
                  </div>
                  <p className="mt-1.5 text-xs text-slate-300">
                    Enter the Main Building foyer. Head to Lift Lobby B or Staircase 2 to reach the{" "}
                    <strong className="text-white">{activeModalRoom.floor}</strong>. Follow room
                    markers to{" "}
                    <strong className="text-cyan-300">Room {activeModalRoom.roomNumber}</strong>.
                  </p>
                </div>

                <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                  <button
                    onClick={() => {
                      audioManager.speak(
                        `Directions to ${activeModalRoom.name}: Go to ${activeModalRoom.floor}, Room ${activeModalRoom.roomNumber}`
                      );
                    }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-xs font-bold text-slate-200 hover:bg-white/10"
                  >
                    <Volume2 className="h-4 w-4 text-cyan-400" />
                    Hear Audio Directions
                  </button>
                  <button
                    onClick={() => setActiveModalRoom(null)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 py-3 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-500/20"
                  >
                    <Sparkles className="h-4 w-4" />
                    Done / Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* =========================================================
   6. MAIN COMPONENT WITH REAL GPS & COMPASS TRACKING
   ========================================================= */

export function ARNavigation({ onClose }: { onClose?: () => void }) {
  const [screen, setScreen] = useState<"start" | "ar" | "done">("start");
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [isRequestingPermissions, setIsRequestingPermissions] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Real GPS & sensor states
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [deviceHeading, setDeviceHeading] = useState<number>(0);
  const [liveDistance, setLiveDistance] = useState<number>(20);

  // Gamification state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [xp, setXp] = useState(50);
  const [level, setLevel] = useState(1);
  const [combo, setCombo] = useState(1);
  const [voiceOn, setVoiceOn] = useState(true);
  const [showMap, setShowMap] = useState(false);
  const [photoFlash, setPhotoFlash] = useState(false);
  const [achievement, setAchievement] = useState<{ title: string; icon: string } | null>(null);
  const [showXpPop, setShowXpPop] = useState(false);
  const [earnedXpPop, setEarnedXpPop] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastFix = useRef<{ lat: number; lng: number } | null>(null);
  const gpsFresh = useRef(false);
  const waypoint = ROUTE[currentIndex];

  const totalWalked = ROUTE.slice(0, currentIndex).reduce((a, b) => a + b.targetDistance, 0);
  const progress = Math.min(Math.round((totalWalked / TOTAL_DISTANCE) * 100), 100);

  /* ---------- Real device compass ---------- */
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      const webkitHeading = (e as DeviceOrientationEvent & { webkitCompassHeading?: number })
        .webkitCompassHeading;
      if (typeof webkitHeading === "number") {
        setDeviceHeading(Math.round(webkitHeading));
      } else if (e.alpha !== null) {
        setDeviceHeading(Math.round(360 - e.alpha));
      }
    };
    window.addEventListener("deviceorientation", handleOrientation, true);
    return () => window.removeEventListener("deviceorientation", handleOrientation, true);
  }, []);

  /* ---------- Real GPS watch: distance ONLY changes when you actually move ---------- */
  useEffect(() => {
    if (screen !== "ar") return;

    // Show the static leg length until a fresh GPS fix arrives — never ticks down on its own
    setLiveDistance(waypoint.targetDistance);
    gpsFresh.current = false;

    if (!("geolocation" in navigator)) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        // Reject stale fixes: only trust readings that actually moved us
        if (
          lastFix.current &&
          calculateHaversine(lastFix.current.lat, lastFix.current.lng, lat, lng) < 1.5
        ) {
          return; // user hasn't moved — keep the current distance unchanged
        }

        setUserLocation({ lat, lng });
        setGpsAccuracy(Math.round(pos.coords.accuracy));

        const realMeters = calculateHaversine(lat, lng, waypoint.lat, waypoint.lng);
        if (realMeters <= 500) {
          lastFix.current = { lat, lng };
          gpsFresh.current = true;
          setLiveDistance(realMeters);
        }
      },
      () => {
        /* GPS weak or denied — distance simply stays at the static leg value */
      },
      { enableHighAccuracy: true, maximumAge: 500, timeout: 8000 }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      lastFix.current = null;
    };
  }, [screen, currentIndex, waypoint]);

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
      setCameraActive(false);
    }
  }, [cameraStream]);

  /* ---------- Request BOTH camera + location ---------- */
  const requestSensorsAccess = async () => {
    setIsRequestingPermissions(true);
    setPermissionError(null);

    // 1. Real location permission
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setGpsAccuracy(Math.round(pos.coords.accuracy));
        },
        () => {
          /* location optional */
        },
        { enableHighAccuracy: true }
      );
    }

    // 2. Camera permission
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API is not supported in this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setCameraStream(stream);
      setCameraActive(true);
      setShowPermissionModal(false);
      setScreen("ar");
    } catch (err: unknown) {
      const error = err as Error;
      setPermissionError(
        error.message || "Camera permission was denied. Continuing in simulation mode."
      );
    } finally {
      setIsRequestingPermissions(false);
    }
  };

  const handleStartClicked = () => {
    setShowPermissionModal(true);
    requestSensorsAccess();
  };

  const handleSkipPermissions = () => {
    setShowPermissionModal(false);
    setCameraActive(false);
    setScreen("ar");
  };

  const handleRestart = () => {
    stopCamera();
    setCurrentIndex(0);
    setScreen("start");
  };

  const handleExit = () => {
    stopCamera();
    if (onClose) onClose();
  };

  useEffect(() => {
    if (screen === "ar" && voiceOn) {
      audioManager.speak(waypoint.voicePrompt);
    }
  }, [screen, currentIndex, voiceOn, waypoint.voicePrompt]);

  const advanceWaypoint = useCallback(() => {
    const wp = ROUTE[currentIndex];
    if (wp.direction !== "straight" && wp.direction !== "arrived") {
      audioManager.playTurnAlert();
    } else {
      audioManager.playXpGain();
    }

    const earned = wp.xpReward * combo;
    setEarnedXpPop(earned);
    setShowXpPop(true);
    setTimeout(() => setShowXpPop(false), 1400);

    setXp((prev) => {
      const newTotal = prev + earned;
      const newLevel = Math.floor(newTotal / 300) + 1;
      setLevel((lvl) => {
        if (newLevel > lvl) {
          audioManager.playAchievement();
          return newLevel;
        }
        return lvl;
      });
      return newTotal;
    });

    setCombo((c) => Math.min(c + 1, 4));

    if (wp.achievement) {
      setTimeout(() => {
        setAchievement(wp.achievement!);
        audioManager.playAchievement();
      }, 500);
    }

    if (currentIndex < ROUTE.length - 1) {
      setCurrentIndex((idx) => idx + 1);
    } else {
      setScreen("done");
    }
  }, [combo, currentIndex]);

  /* ---------- Auto-advance when user physically reaches the waypoint ---------- */
  useEffect(() => {
    if (screen !== "ar") return;
    if (waypoint.direction === "arrived") return;
    if (liveDistance <= 2) {
      const t = window.setTimeout(() => advanceWaypoint(), 600);
      return () => window.clearTimeout(t);
    }
  }, [liveDistance, screen, waypoint.direction, advanceWaypoint]);

  const handleSnapshot = () => {
    setPhotoFlash(true);
    audioManager.playXpGain();
    setTimeout(() => setPhotoFlash(false), 200);
  };

  const levelProgress = ((xp % 300) / 300) * 100;
  const isArrived = waypoint.direction === "arrived";

  const getDirectionIcon = () => {
    const cls = "h-6 w-6 text-white";
    switch (waypoint.direction) {
      case "slight-left":
        return <ArrowUpLeft className={cls} strokeWidth={3} />;
      case "left":
        return <ArrowLeft className={cls} strokeWidth={3} />;
      case "slight-right":
        return <ArrowUpRight className={cls} strokeWidth={3} />;
      case "right":
        return <ArrowRight className={cls} strokeWidth={3} />;
      case "arrived":
        return <Target className={cls} strokeWidth={3} />;
      default:
        return <ArrowUp className={cls} strokeWidth={3} />;
    }
  };

  const getDirectiveText = () => {
    switch (waypoint.direction) {
      case "slight-left":
        return "TURN SLIGHT LEFT";
      case "left":
        return "TURN LEFT";
      case "slight-right":
        return "TURN SLIGHT RIGHT";
      case "right":
        return "TURN RIGHT";
      case "arrived":
        return "ARRIVED 🎉";
      default:
        return "GO STRAIGHT";
    }
  };

  return (
    <div className="h-screen w-full overflow-y-auto overflow-x-hidden bg-slate-950 font-sans text-white">
      {/* Permissions Modal (Camera + Geolocation) */}
      <AnimatePresence>
        {showPermissionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md rounded-3xl border border-cyan-500/40 bg-gradient-to-b from-slate-900 to-slate-950 p-6 text-white shadow-2xl shadow-cyan-500/20"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-500/20 text-cyan-400">
                <LocateFixed className="h-8 w-8 animate-pulse" />
              </div>

              <div className="mt-4 text-center">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                  <Sparkles className="h-3 w-3" />
                  Live AR + GPS Tracking
                </div>
                <h2 className="mt-3 text-2xl font-bold">Allow Camera & Location</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  To provide Google Maps-style live tracking with the glowing ground guide line,
                  real distance countdowns (e.g. 20m straight) and 3D turn arrows, Mosaic 2k26
                  needs camera and location access.
                </p>
              </div>

              {permissionError && (
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                  <span>{permissionError}</span>
                </div>
              )}

              <div className="mt-6 flex flex-col gap-3">
                <button
                  onClick={requestSensorsAccess}
                  disabled={isRequestingPermissions}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-4 py-3.5 font-bold text-slate-950 shadow-lg shadow-cyan-500/30 transition-transform active:scale-95 disabled:opacity-60"
                >
                  {isRequestingPermissions ? (
                    <>
                      <RefreshCw className="h-5 w-5 animate-spin text-slate-950" />
                      <span>Requesting Sensors...</span>
                    </>
                  ) : (
                    <>
                      <LocateFixed className="h-5 w-5 text-slate-950" />
                      <span>Allow Camera & GPS</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleSkipPermissions}
                  className="rounded-2xl border border-white/10 bg-white/5 py-3 text-xs font-medium text-slate-300 transition-colors hover:bg-white/10"
                >
                  Continue in Simulation Mode
                </button>
              </div>

              <div className="mt-4 text-center text-[11px] text-slate-500">
                🔒 Camera & location data stay on your device — nothing is uploaded.
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {/* ============ SCREEN 1: START ============ */}
        {screen === "start" && (
          <motion.div
            key="start"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative flex min-h-screen flex-col overflow-hidden bg-slate-950 text-white"
          >
            <div className="pointer-events-none absolute inset-0 opacity-40">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(34,211,238,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.15) 1px, transparent 1px)",
                  backgroundSize: "40px 40px",
                  maskImage: "radial-gradient(ellipse at center, black 30%, transparent 80%)",
                }}
              />
            </div>

            <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-500/30 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-purple-500/20 blur-3xl" />

            <header className="relative z-10 mx-auto flex w-full max-w-xl items-center justify-between px-6 pt-6">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 shadow-lg shadow-cyan-500/50">
                  <Sparkles className="h-5 w-5 text-slate-950" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">
                    Mosaic 2k26
                  </div>
                  <div className="text-sm font-semibold">AR Campus Live GPS</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="mr-2 flex items-center gap-1.5 text-xs text-slate-400">
                  <Signal className="h-4 w-4" />
                  <Battery className="h-4 w-4" />
                </div>
                {onClose && (
                  <button
                    onClick={handleExit}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-slate-300 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </header>

            <div className="relative z-10 mx-auto mt-6 flex w-full max-w-xl flex-1 flex-col items-center px-6">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="relative"
              >
                <div className="relative h-60 w-72">
                  <div className="absolute inset-x-8 top-8 h-44 rounded-t-[80px] border-4 border-cyan-400/80 bg-gradient-to-b from-cyan-500/10 to-transparent shadow-[0_0_40px_rgba(34,211,238,0.5)]" />
                  <div className="absolute bottom-0 left-4 h-52 w-6 rounded-t bg-gradient-to-b from-cyan-400 to-violet-500 shadow-[0_0_20px_rgba(34,211,238,0.6)]" />
                  <div className="absolute bottom-0 right-4 h-52 w-6 rounded-t bg-gradient-to-b from-cyan-400 to-violet-500 shadow-[0_0_20px_rgba(34,211,238,0.6)]" />
                  <div className="absolute left-1/2 top-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-cyan-300 bg-slate-900/90 px-3 py-1 text-xs font-bold tracking-widest text-cyan-300 shadow-lg shadow-cyan-500/30">
                    SFIT MAIN GATE
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 rounded-full bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.9)]"
                  />
                  <motion.div
                    animate={{ y: [0, 180, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-x-8 top-8 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-4 text-center"
              >
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-300">
                  <MapPin className="h-3.5 w-3.5" />
                  Start from SFIT Gate
                </div>
                <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                  Start from{" "}
                  <span className="bg-gradient-to-r from-cyan-300 via-sky-400 to-violet-400 bg-clip-text text-transparent">
                    SFIT Gate
                  </span>
                </h1>
                <p className="mt-2 max-w-sm text-xs text-slate-400 sm:text-sm">
                  Google-style live AR: 20m straight into campus, turn slightly left towards Main
                  Building, turn right, and reach Mosaic Main Stage!
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-6 w-full space-y-2"
              >
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-slate-300">
                      Route Overview • 4 Checkpoints
                    </span>
                    <span className="font-mono text-cyan-300">{TOTAL_DISTANCE}m • ~3 min</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    {ROUTE.map((w, i) => (
                      <div key={w.id} className="flex flex-1 items-center">
                        <div
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold ${
                            i === 0
                              ? "border-cyan-400 bg-cyan-400 text-slate-950"
                              : i === ROUTE.length - 1
                              ? "border-violet-400 bg-violet-400/20 text-violet-300"
                              : "border-slate-600 bg-slate-800 text-slate-400"
                          }`}
                        >
                          {i === ROUTE.length - 1 ? "🏁" : i + 1}
                        </div>
                        {i < ROUTE.length - 1 && (
                          <div className="mx-1 h-0.5 flex-1 rounded bg-gradient-to-r from-cyan-400/60 to-violet-400/20" />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex justify-between text-[10px] uppercase tracking-wider text-slate-500">
                    <span>SFIT Gate</span>
                    <span>Main Bldg</span>
                    <span>Right Turn</span>
                    <span>Stage</span>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="relative z-10 mx-auto w-full max-w-xl p-6">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleStartClicked}
                className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 p-[2px] shadow-2xl shadow-violet-500/40"
              >
                <div className="flex items-center justify-center gap-3 rounded-2xl bg-slate-950/85 px-6 py-4 transition-colors group-hover:bg-slate-950/50">
                  <Navigation2 className="h-5 w-5 text-cyan-300 transition-transform group-hover:rotate-45" />
                  <span className="text-lg font-black tracking-wider text-white">
                    START LIVE NAVIGATION
                  </span>
                  <ChevronRight className="h-5 w-5 text-cyan-300" />
                </div>
              </motion.button>

              <div className="mt-3 flex items-center justify-between px-1 text-xs text-slate-400">
                <span className="text-[11px] text-slate-500">Live Camera + GPS Guided</span>
                <button
                  onClick={() => setScreen("done")}
                  className="text-xs font-bold text-cyan-400 underline underline-offset-4 hover:text-cyan-300"
                >
                  Browse Committee Rooms (13) →
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ============ SCREEN 2: AR LIVE NAVIGATION ============ */}
        {screen === "ar" && (
          <motion.div
            key="ar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative flex min-h-screen select-none flex-col overflow-hidden bg-slate-950 text-white"
          >
            {photoFlash && (
              <div className="pointer-events-none fixed inset-0 z-50 bg-white transition-opacity duration-200" />
            )}

            {/* Live camera / simulated world */}
            <ARScene cameraStream={cameraStream} cameraActive={cameraActive} videoRef={videoRef} />

            {/* Google-style ground ribbon guide line */}
            <GroundARPathLine direction={waypoint.direction} distance={liveDistance} />

            <AnimatePresence>
              {achievement && (
                <motion.div
                  initial={{ y: -80, opacity: 0, scale: 0.8 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: -80, opacity: 0, scale: 0.8 }}
                  className="pointer-events-none fixed left-1/2 top-20 z-50 w-[90%] max-w-xs -translate-x-1/2"
                >
                  <div className="flex items-center gap-3 rounded-2xl border border-amber-400/50 bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 px-4 py-3 shadow-2xl shadow-amber-500/40 backdrop-blur-xl">
                    <motion.div
                      animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.6 }}
                      className="shrink-0 text-3xl"
                    >
                      {achievement.icon}
                    </motion.div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300">
                        Achievement Unlocked
                      </div>
                      <div className="text-sm font-bold leading-tight text-white">
                        {achievement.title}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {showXpPop && (
              <motion.div
                initial={{ opacity: 1, y: 0, scale: 0.8 }}
                animate={{ opacity: 0, y: -90, scale: 1.3 }}
                transition={{ duration: 1.4, ease: "easeOut" }}
                className="pointer-events-none absolute left-1/2 top-1/2 z-40 -translate-x-1/2 -translate-y-1/2 text-2xl font-black text-cyan-300 drop-shadow-[0_0_12px_rgba(34,211,238,0.9)]"
              >
                +{earnedXpPop} XP
              </motion.div>
            )}

            <AnimatePresence>
              {showMap && (
                <CampusMapModal
                  currentWaypointIndex={currentIndex}
                  onClose={() => setShowMap(false)}
                />
              )}
            </AnimatePresence>

            {/* TOP HUD */}
            <div className="relative z-20 mx-auto w-full max-w-xl px-4 pt-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 rounded-2xl border border-white/10 bg-slate-950/70 p-3 backdrop-blur-xl">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <Zap className="h-4 w-4 fill-cyan-400 text-cyan-400" />
                      <span className="font-bold text-cyan-300">LVL {level}</span>
                    </div>
                    <span className="font-mono text-xs font-semibold text-slate-300">{xp} XP</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      animate={{ width: `${levelProgress}%` }}
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500"
                    />
                  </div>
                </div>

                {/* Live GPS status */}
                <div className="rounded-2xl border border-cyan-400/30 bg-slate-950/70 px-3 py-2 text-center backdrop-blur-xl">
                  <div className="flex items-center justify-center gap-1 text-cyan-300">
                    <LocateFixed
                      className="h-3.5 w-3.5 animate-spin"
                      style={{ animationDuration: "3s" }}
                    />
                    <span className="font-mono text-xs font-bold">
                      {userLocation ? "GPS LIVE" : "SIM"}
                    </span>
                  </div>
                  <div className="text-[9px] font-bold text-slate-400">
                    {gpsAccuracy ? `±${gpsAccuracy}m` : "TRACKING"}
                  </div>
                </div>

                {onClose && (
                  <button
                    onClick={handleExit}
                    className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/70 text-slate-300 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Google-style direction card with live countdown */}
              <motion.div
                key={waypoint.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-3 flex items-center gap-3.5 rounded-2xl border border-cyan-400/40 bg-slate-950/85 p-3.5 shadow-2xl shadow-cyan-500/20 backdrop-blur-xl"
              >
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-lg ${
                    waypoint.direction !== "straight" && waypoint.direction !== "arrived"
                      ? "bg-gradient-to-br from-amber-400 to-rose-500 shadow-amber-500/30"
                      : waypoint.direction === "arrived"
                      ? "bg-gradient-to-br from-emerald-400 to-cyan-500 shadow-emerald-500/30"
                      : "bg-gradient-to-br from-cyan-400 to-violet-500 shadow-cyan-500/30"
                  }`}
                >
                  {getDirectionIcon()}
                </div>

                <div className="min-w-0 flex-1">
                  <div
                    className={`text-[11px] font-black uppercase tracking-wider ${
                      waypoint.direction !== "straight" && waypoint.direction !== "arrived"
                        ? "text-amber-300"
                        : "text-cyan-300"
                    }`}
                  >
                    {getDirectiveText()}
                  </div>
                  <div className="truncate text-base font-bold text-white">{waypoint.title}</div>
                  <div className="truncate text-xs text-slate-300">{waypoint.subtitle}</div>
                </div>

                <div className="shrink-0 text-right">
                  <div className="font-mono text-2xl font-black leading-none text-cyan-300">
                    {liveDistance}
                  </div>
                  <div className="mt-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    METERS
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Real compass — rotates with the phone */}
            <div className="pointer-events-none absolute right-4 top-1/2 z-20 -translate-y-1/2">
              <div className="flex flex-col items-center gap-1 rounded-2xl border border-white/10 bg-slate-950/70 p-2 backdrop-blur-xl">
                <Compass
                  className="h-6 w-6 text-cyan-300 transition-transform duration-300"
                  style={{ transform: `rotate(${-deviceHeading}deg)` }}
                />
                <div className="font-mono text-[10px] font-bold">{deviceHeading}°</div>
                <div className="text-[8px] font-bold text-slate-400">BEARING</div>
              </div>
            </div>

            {/* Floating 3D pin + direction arrow */}
            <div className="pointer-events-none relative z-10 my-auto flex flex-1 flex-col items-center justify-center py-2">
              <motion.div
                key={`pin-${waypoint.id}`}
                initial={{ opacity: 0, y: -12, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="z-10 mb-3"
              >
                <div className="flex items-center gap-2 rounded-full border border-cyan-300/80 bg-black/90 px-4 py-1.5 shadow-2xl shadow-cyan-500/50 backdrop-blur-md">
                  <MapPin className="h-4 w-4 shrink-0 text-cyan-300" />
                  <span className="text-sm font-bold tracking-wide text-white">
                    {waypoint.landmark}
                  </span>
                  <span className="rounded-full bg-cyan-400/20 px-2 py-0.5 font-mono text-xs font-bold text-cyan-300">
                    {liveDistance > 0 ? `${liveDistance}m` : "ARRIVED"}
                  </span>
                </div>
                <div className="mx-auto h-5 w-0.5 bg-gradient-to-b from-cyan-400 to-transparent shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              </motion.div>

              <div className="relative">
                <DirectionArrow direction={waypoint.direction} />
              </div>
            </div>

            {/* BOTTOM HUD */}
            <div className="relative z-20 mx-auto w-full max-w-xl space-y-3 px-4 pb-6">
              <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-3.5 backdrop-blur-xl">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">Route Progress</span>
                  <span className="font-mono font-bold text-cyan-300">{progress}%</span>
                </div>
                <div className="relative h-2 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    animate={{ width: `${progress}%` }}
                    transition={{ type: "spring", stiffness: 80 }}
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500"
                  />
                  {ROUTE.map((w, i) => {
                    const pos =
                      i === 0
                        ? 2
                        : (ROUTE.slice(0, i).reduce((a, b) => a + b.targetDistance, 0) /
                            TOTAL_DISTANCE) *
                          100;
                    return (
                      <div
                        key={w.id}
                        className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-slate-950 ${
                          i <= currentIndex ? "scale-110 bg-cyan-300" : "bg-slate-600"
                        }`}
                        style={{ left: `${Math.min(pos, 98)}%` }}
                      />
                    );
                  })}
                </div>
                <div className="mt-2.5 flex justify-between text-[10px] font-semibold text-slate-400">
                  <span>SFIT Gate</span>
                  <span>Main Bldg</span>
                  <span>Right Turn</span>
                  <span>Stage</span>
                </div>
              </div>

              {waypoint.tip && (
                <motion.div
                  key={`tip-${waypoint.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-3 backdrop-blur-xl"
                >
                  <div className="flex items-start gap-2.5">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                    <div className="text-xs font-medium text-amber-100">{waypoint.tip}</div>
                  </div>
                </motion.div>
              )}

              {/* Main action: auto-advances with GPS, manual tap as backup */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={advanceWaypoint}
                className={`group relative w-full overflow-hidden rounded-2xl p-[2px] shadow-2xl ${
                  isArrived
                    ? "bg-gradient-to-r from-amber-400 via-rose-500 to-violet-500 shadow-rose-500/40"
                    : waypoint.direction !== "straight"
                    ? "bg-gradient-to-r from-amber-400 via-rose-500 to-fuchsia-500 shadow-amber-500/40"
                    : "bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 shadow-violet-500/40"
                }`}
              >
                <div className="flex items-center justify-center gap-3 rounded-2xl bg-slate-950/85 px-6 py-4 transition-colors group-hover:bg-slate-950/50">
                  {isArrived ? (
                    <>
                      <PartyPopper className="h-5 w-5 text-amber-300" />
                      <span className="text-lg font-black tracking-wide text-white">
                        {waypoint.actionText || "WELCOME TO MOSAIC"}
                      </span>
                    </>
                  ) : waypoint.direction === "slight-left" ? (
                    <>
                      <ArrowUpLeft className="h-5 w-5 text-amber-300" />
                      <span className="text-lg font-black tracking-wide text-white">
                        {waypoint.actionText || "KEEP GOING"}
                      </span>
                      <span className="rounded-md bg-amber-400/20 px-2 py-0.5 text-xs font-bold text-amber-300">
                        +{waypoint.xpReward * combo} XP
                      </span>
                    </>
                  ) : waypoint.direction === "right" ? (
                    <>
                      <ArrowRight className="h-5 w-5 text-amber-300" />
                      <span className="text-lg font-black tracking-wide text-white">
                        {waypoint.actionText || "TURN RIGHT AT MAIN BUILDING"}
                      </span>
                      <span className="rounded-md bg-amber-400/20 px-2 py-0.5 text-xs font-bold text-amber-300">
                        +{waypoint.xpReward * combo} XP
                      </span>
                    </>
                  ) : (
                    <>
                      <Footprints className="h-5 w-5 text-cyan-300" />
                      <span className="text-lg font-black tracking-wide text-white">
                        WALK FORWARD ({liveDistance}m)
                      </span>
                      <span className="rounded-md bg-cyan-400/20 px-2 py-0.5 text-xs font-bold text-cyan-300">
                        +{waypoint.xpReward * combo} XP
                      </span>
                    </>
                  )}
                </div>
              </motion.button>

              <div className="flex items-center justify-center gap-3 pt-1">
                <button
                  onClick={handleSnapshot}
                  title="Snap AR Photo"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-slate-950/70 text-slate-300 transition-colors hover:bg-slate-900 hover:text-white"
                >
                  <Camera className="h-4 w-4" />
                </button>

                <button
                  onClick={requestSensorsAccess}
                  title={cameraActive ? "Sensors Live" : "Turn on Camera"}
                  className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${
                    cameraActive
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                      : "border-white/10 bg-slate-950/70 text-slate-300 hover:text-white"
                  }`}
                >
                  {cameraActive ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                </button>

                <button
                  onClick={() => {
                    const next = !voiceOn;
                    setVoiceOn(next);
                    audioManager.voiceEnabled = next;
                    if (next) audioManager.speak(waypoint.voicePrompt);
                  }}
                  title={voiceOn ? "Mute Voice Guidance" : "Enable Voice Guidance"}
                  className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${
                    voiceOn
                      ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-400"
                      : "border-white/10 bg-slate-950/70 text-slate-500"
                  }`}
                >
                  {voiceOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </button>

                <button
                  onClick={() => setShowMap(true)}
                  title="Open Campus 2D Map"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-slate-950/70 text-slate-300 transition-colors hover:bg-slate-900 hover:text-white"
                >
                  <MapPin className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ============ SCREEN 3: ARRIVAL & ROOM SELECTOR ============ */}
        {screen === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative flex min-h-min flex-col bg-gradient-to-b from-slate-950 via-violet-950 to-slate-950 pb-32 text-white"
          >
            <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-amber-400/30 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-violet-500/30 blur-3xl" />

            {onClose && (
              <div className="absolute right-4 top-4 z-30">
                <button
                  onClick={handleExit}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-slate-300 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}

            <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-4 py-8 text-center">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 120 }}
                className="mb-4 text-6xl sm:text-7xl"
              >
                🏆
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="max-w-2xl"
              >
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-amber-300">
                  <PartyPopper className="h-3.5 w-3.5" />
                  Quest Complete • Mosaic 2k26
                </div>
                <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
                  Welcome to
                  <br />
                  <span className="bg-gradient-to-r from-amber-300 via-rose-400 to-violet-400 bg-clip-text text-transparent">
                    Mosaic 2k26!
                  </span>
                </h1>
                <p className="mt-2 text-sm text-slate-400">
                  You navigated from SFIT Gate, turned slightly left towards Main Building, and
                  turned right to reach Mosaic Main Stage!
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-6 grid w-full max-w-xl grid-cols-3 gap-3"
              >
                {[
                  { icon: Zap, label: "XP Earned", value: `${xp}`, color: "text-cyan-400" },
                  {
                    icon: MapPin,
                    label: "Distance",
                    value: `${TOTAL_DISTANCE}m`,
                    color: "text-violet-400",
                  },
                  { icon: Trophy, label: "Badges", value: "4", color: "text-amber-400" },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur"
                  >
                    <s.icon className={`mx-auto h-5 w-5 ${s.color}`} />
                    <div className="mt-2 text-xl font-black">{s.value}</div>
                    <div className="text-[10px] font-bold uppercase text-slate-400">{s.label}</div>
                  </div>
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-6 w-full max-w-xl"
              >
                <div className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                  Badges Collected
                </div>
                <div className="flex justify-center gap-2 sm:gap-3">
                  {[
                    { icon: "🧭", name: "On The Move" },
                    { icon: "⚡", name: "Pace Maker" },
                    { icon: "🔥", name: "Sharp Turn" },
                    { icon: "🏆", name: "Fest Navigator" },
                  ].map((b) => (
                    <div
                      key={b.name}
                      className="flex flex-1 flex-col items-center rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-500/10 to-violet-500/10 p-2 backdrop-blur sm:p-2.5"
                    >
                      <div className="text-2xl sm:text-3xl">{b.icon}</div>
                      <div className="mt-1 text-[10px] font-semibold text-slate-200">{b.name}</div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* SELECT THE ROOM TO VISIT */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="w-full"
              >
                <RoomSelector />
              </motion.div>

              <div className="mb-4 mt-10 w-full max-w-md">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleRestart}
                  className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-6 py-4 text-base font-bold text-slate-950 shadow-2xl shadow-violet-500/40 transition-transform hover:scale-[1.01]"
                >
                  Navigate Again
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ARNavigation;
