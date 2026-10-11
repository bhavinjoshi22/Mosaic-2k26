import { useState, useRef, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Navigation2,
  Zap,
  Trophy,
  Flame,
  Coins,
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
} from "lucide-react";

/* =========================================================
   1. TYPES & DATA (ROUTE & ROOMS)
   ========================================================= */

export type Direction = "straight" | "slight-left" | "left" | "slight-right" | "right" | "arrived";

export interface Waypoint {
  id: number;
  title: string;
  subtitle: string;
  actionText?: string;
  direction: Direction;
  distance: number;
  xpReward: number;
  landmark: string;
  tip?: string;
  voicePrompt: string;
  achievement?: { title: string; icon: string };
}

export const ROUTE: Waypoint[] = [
  {
    id: 0,
    title: "SFIT Main Gate",
    subtitle: "Starting point • Head into campus avenue",
    actionText: "START WALKING",
    direction: "straight",
    distance: 45,
    xpReward: 50,
    landmark: "SFIT Gate",
    tip: "Face the campus and walk straight past security.",
    voicePrompt: "Start walking straight from SFIT Gate into the campus avenue.",
  },
  {
    id: 1,
    title: "Main Building Approach",
    subtitle: "Turn slightly left towards Main Building",
    actionText: "KEEP GOING",
    direction: "slight-left",
    distance: 75,
    xpReward: 100,
    landmark: "Main Building",
    tip: "Turn slightly left towards the Main Building foyer.",
    voicePrompt: "Turn slightly left towards the Main Building and keep going.",
    achievement: { title: "On The Move", icon: "🧭" },
  },
  {
    id: 2,
    title: "Main Building",
    subtitle: "Turn right at Main Building",
    actionText: "TURN RIGHT AT MAIN BUILDING",
    direction: "right",
    distance: 50,
    xpReward: 200,
    landmark: "Main Building",
    tip: "Turn right at the Main Building wing heading straight to the stage.",
    voicePrompt: "Turn right at Main Building towards the stage.",
    achievement: { title: "Stage Approaching", icon: "⚡" },
  },
  {
    id: 3,
    title: "Mosaic Main Stage",
    subtitle: "Welcome to Mosaic 2k26! 🎉",
    actionText: "WELCOME TO MOSAIC",
    direction: "arrived",
    distance: 0,
    xpReward: 500,
    landmark: "Mosaic Stage",
    tip: "You have arrived! Welcome to Mosaic 2k26 festival.",
    voicePrompt: "You have arrived at the stage. Welcome to Mosaic 2k26!",
    achievement: { title: "Festival Navigator", icon: "🏆" },
  },
];

export const TOTAL_DISTANCE = ROUTE.reduce((acc, w) => acc + w.distance, 0);

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
    description: "Institute of Electrical and Electronics Engineers SFIT Student Branch. Project exhibitions, IoT showcases & AI tech demos.",
    image: "https://images.pexels.com/photos/8566470/pexels-photo-8566470.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tag: "IoT & AI Showcase",
    exhibits: ["Smart City IoT Model", "AI Computer Vision Demos", "Robotics Arm"],
  },
  {
    id: "csi",
    name: "CSI",
    roomNumber: "318",
    floor: "3rd Floor",
    category: "Technical Society",
    description: "Computer Society of India SFIT Chapter. Software hackathon hub, algorithmic challenges and full-stack project showcases.",
    image: "https://images.pexels.com/photos/5483077/pexels-photo-5483077.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tag: "Coding & Web3",
    exhibits: ["Live Code Battle", "Full-Stack Web Demos", "Cybersecurity Quiz"],
  },
  {
    id: "iete",
    name: "IETE",
    roomNumber: "514",
    floor: "5th Floor",
    category: "Technical Society",
    description: "Institution of Electronics and Telecommunication Engineers. Telecomm networks, signal processing and antenna hardware demos.",
    image: "https://images.pexels.com/photos/36169774/pexels-photo-36169774.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tag: "Telecom & RF",
    exhibits: ["SDR Radio Station", "Microcontroller Hardware", "Signal Visualizer"],
  },
  {
    id: "iste",
    name: "ISTE",
    roomNumber: "414",
    floor: "4th Floor",
    category: "Technical Society",
    description: "Indian Society for Technical Education. Multidisciplinary innovation, technical paper presentations and hands-on workshops.",
    image: "https://images.pexels.com/photos/7868836/pexels-photo-7868836.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tag: "Tech Innovation",
    exhibits: ["Project Model Displays", "Technical Paper Expo", "Arduino Workshops"],
  },
  {
    id: "codex",
    name: "CODEX",
    roomNumber: "421, 422",
    floor: "4th Floor",
    category: "Coding & Dev",
    description: "SFIT Premier Competitive Programming and Open Source Club. High-intensity competitive coding arena, speed debug & LAN gaming.",
    image: "https://images.pexels.com/photos/1089438/pexels-photo-1089438.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tag: "Competitive Coding",
    exhibits: ["Blind Coding Challenge", "Algorithmic Arena", "Open-Source Terminal"],
  },
  {
    id: "itsa",
    name: "ITSA",
    roomNumber: "304",
    floor: "3rd Floor",
    category: "Departmental",
    description: "Information Technology Students' Association. Cloud computing, machine learning applications, and UI/UX design showcase.",
    image: "https://images.pexels.com/photos/33158875/pexels-photo-33158875.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tag: "Cloud & Data Science",
    exhibits: ["Cloud Architecture Lab", "UI/UX Interactive Hub", "Big Data Analytics"],
  },
  {
    id: "eesa",
    name: "EESA",
    roomNumber: "230",
    floor: "2nd Floor",
    category: "Departmental",
    description: "Electrical Engineering Students' Association. Power electronics, smart grid demos, high-voltage circuits and renewable energy prototypes.",
    image: "https://images.pexels.com/photos/1432794/pexels-photo-1432794.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tag: "Power & Energy",
    exhibits: ["Solar Smart Inverter", "Tesla Coil Demo", "Micro-Grid Simulator"],
  },
  {
    id: "mesa",
    name: "MESA",
    roomNumber: "006",
    floor: "Ground Floor",
    category: "Departmental",
    description: "Mechanical Engineering Students' Association. 3D printing lab, CAD/CAM models, thermodynamic mechanisms & hydraulic robots.",
    image: "https://images.pexels.com/photos/8294611/pexels-photo-8294611.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tag: "CAD & 3D Print",
    exhibits: ["3D Printing Live Lab", "Internal Combustion Engine Model", "Robotic Crane"],
  },
  {
    id: "etan",
    name: "ETAN",
    roomNumber: "128",
    floor: "1st Floor",
    category: "Departmental",
    description: "Electronics & Telecommunication Association Network. Embedded systems, PCB prototyping lab, wireless sensor arrays & audio synthesis.",
    image: "https://images.pexels.com/photos/3520692/pexels-photo-3520692.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tag: "Embedded & PCB",
    exhibits: ["PCB Etching Workstation", "LoRa Long-Range Transceiver", "Digital Audio Synthesizer"],
  },
  {
    id: "ecssa",
    name: "ECSSA",
    roomNumber: "618",
    floor: "6th Floor",
    category: "Departmental",
    description: "Electronics & Computer Science Students' Association. Edge AI computing, FPGA design, autonomous drones & computer vision.",
    image: "https://images.pexels.com/photos/37694202/pexels-photo-37694202.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tag: "Edge AI & FPGA",
    exhibits: ["Autonomous Quadcopter", "FPGA Hardware Accelerator", "Smart Gesture Tracker"],
  },
  {
    id: "adg",
    name: "ADG",
    roomNumber: "028",
    floor: "Ground Floor",
    category: "Coding & Dev",
    description: "Apple Developers Group SFIT. Swift, iOS app development, VisionOS spatial computing, and human interface guidelines.",
    image: "https://images.pexels.com/photos/5926389/pexels-photo-5926389.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tag: "iOS & VisionOS",
    exhibits: ["Vision Pro Experience", "Swift Playground Lab", "Published Student Apps"],
  },
  {
    id: "team_raw",
    name: "Team RAW",
    roomNumber: "027",
    floor: "Ground Floor",
    category: "Robotics & Racing",
    description: "Robotics and Automation Wing SFIT. Combat robots, robowars arena, autonomous maze solvers and all-terrain rovers.",
    image: "https://images.pexels.com/photos/7868884/pexels-photo-7868884.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tag: "Combat Robotics",
    exhibits: ["RoboWars 15kg Combat Robot", "All-Terrain Exploration Rover", "Autonomous Line Follower"],
  },
  {
    id: "team_gatee_tejas",
    name: "Team GATEE & TEJAS",
    roomNumber: "213",
    floor: "2nd Floor",
    category: "Robotics & Racing",
    description: "SFIT Official Formula Student & Supermileage Racing Teams. High-efficiency prototype vehicles, telemetry, chassis & EV battery pack design.",
    image: "https://images.pexels.com/photos/13857975/pexels-photo-13857975.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tag: "Formula Racing & EV",
    exhibits: ["Formula Student Race Car", "Electric Vehicle Powertrain", "Carbon Fiber Aerodynamics"],
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
      // Ignore
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
      // Ignore
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
      // Ignore
    }
  }

  speak(text: string) {
    if (!this.voiceEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.volume = 0.9;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Ignore
    }
  }
}

export const audioManager = new AudioManager();

/* =========================================================
   3. CAMPUS 2D TOP-DOWN MAP MODAL
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
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
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
          <svg className="absolute inset-0 h-full w-full pointer-events-none">
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

          <div className="absolute top-10 left-6 h-14 w-24 rounded-lg border border-slate-700 bg-slate-800/60 p-1 text-[9px] text-slate-400 flex items-center justify-center text-center">
            Admin Block
          </div>
          <div className="absolute top-24 right-8 h-18 w-28 rounded-lg border border-slate-700 bg-slate-800/60 p-1 text-[9px] text-slate-400 flex items-center justify-center text-center">
            Main Building Wing
          </div>
          <div className="absolute bottom-16 right-12 h-12 w-20 rounded-lg border border-slate-700 bg-slate-800/60 p-1 text-[9px] text-slate-400 flex items-center justify-center text-center">
            Basketball Court
          </div>

          {mapNodes.map((node, idx) => {
            const isCurrent = idx === currentWaypointIndex;
            const isPassed = idx < currentWaypointIndex;
            return (
              <div
                key={node.id}
                style={{ left: `${node.x}%`, top: `${node.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer"
              >
                {isCurrent && (
                  <motion.div
                    animate={{ scale: [1, 2.2], opacity: [0.8, 0] }}
                    transition={{ duration: 1.6, repeat: Infinity }}
                    className="absolute h-8 w-8 rounded-full bg-cyan-400"
                  />
                )}
                <div
                  className={`relative flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all shadow-md ${
                    isCurrent
                      ? "bg-cyan-400 text-slate-950 ring-4 ring-cyan-400/40 scale-110"
                      : isPassed
                      ? "bg-emerald-500 text-slate-950"
                      : "bg-slate-800 text-slate-300 border border-slate-600"
                  }`}
                >
                  {isCurrent ? "📍" : isPassed ? "✓" : idx + 1}
                </div>
                <div
                  className={`mt-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[10px] font-semibold backdrop-blur ${
                    isCurrent
                      ? "bg-cyan-500/90 text-slate-950 shadow-md font-bold"
                      : "bg-slate-900/80 text-slate-300"
                  }`}
                >
                  {node.label}
                </div>
              </div>
            );
          })}

          <div className="absolute top-2 right-2 flex items-center gap-1 rounded-lg bg-black/60 px-2 py-1 text-[10px] text-slate-400 border border-white/5">
            <Compass className="h-3 w-3 text-cyan-400" />
            <span>N</span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl bg-white/5 p-3 text-xs">
          <div>
            <span className="text-slate-400">Current Step: </span>
            <span className="font-semibold text-cyan-300">
              {ROUTE[currentWaypointIndex]?.title}
            </span>
          </div>
          <span className="rounded bg-cyan-400/20 px-2 py-0.5 text-[11px] font-bold text-cyan-300">
            {ROUTE[currentWaypointIndex]?.distance > 0
              ? `${ROUTE[currentWaypointIndex]?.distance}m ahead`
              : "Arrived!"}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* =========================================================
   4. ROOM SELECTOR COMPONENT (13 ROOMS WITH IMAGES & NUMBERS)
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
    <div className="w-full mt-10 text-left">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6 px-1">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-300 mb-2">
            <Compass className="h-3.5 w-3.5" />
            Interactive Campus Directory
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white capitalize">
            select the room to visit
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Explore 13 committee exhibits, workshops, and lab showcases across SFIT.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search room (e.g. 620, CODEX)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-900/90 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 backdrop-blur"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-5 scrollbar-none text-xs">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setSelectedCategory(cat);
              audioManager.playXpGain();
            }}
            className={`whitespace-nowrap px-3.5 py-1.5 rounded-full font-semibold transition-all ${
              selectedCategory === cat
                ? "bg-gradient-to-r from-cyan-400 to-violet-500 text-slate-950 shadow-md shadow-cyan-500/20"
                : "bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRooms.map((room) => (
          <motion.div
            key={room.id}
            whileHover={{ y: -4, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleCardClick(room)}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 shadow-xl backdrop-blur-md transition-all hover:border-cyan-400/50 hover:shadow-cyan-500/10 cursor-pointer text-left"
          >
            <div className="relative h-36 w-full overflow-hidden bg-slate-950">
              <img
                src={room.image}
                alt={room.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full border border-cyan-400/50 bg-slate-950/90 px-3 py-1 text-xs font-black text-cyan-300 shadow-lg shadow-cyan-500/30 backdrop-blur">
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
                <h3 className="text-xl font-black text-white group-hover:text-cyan-300 transition-colors">
                  {room.name}
                </h3>
                <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                  {room.tag}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {room.description}
              </p>
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-bold text-cyan-400 group-hover:text-cyan-300">
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
              className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-cyan-400/40 bg-slate-900 shadow-2xl text-left"
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
                  className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-slate-300 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
                  <div>
                    <span className="rounded-full bg-cyan-400/20 px-2.5 py-0.5 text-xs font-bold text-cyan-300 border border-cyan-400/30">
                      {activeModalRoom.floor}
                    </span>
                    <h3 className="mt-1 text-3xl font-black text-white">
                      {activeModalRoom.name}
                    </h3>
                  </div>
                  <div className="rounded-2xl bg-slate-950/90 border border-cyan-400/50 px-4 py-2 text-right shadow-xl">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Room</div>
                    <div className="text-xl font-black text-cyan-300">{activeModalRoom.roomNumber}</div>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-sm text-slate-300 leading-relaxed">
                  {activeModalRoom.description}
                </p>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Featured Highlights & Demos
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activeModalRoom.exhibits.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 p-2.5 text-xs text-slate-200"
                      >
                        <CheckCircle className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-violet-500/30 bg-violet-500/10 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-violet-300 uppercase tracking-wider">
                    <Compass className="h-4 w-4" />
                    How to reach from Main Stage
                  </div>
                  <p className="mt-1.5 text-xs text-slate-300">
                    Enter the Main Building foyer. Head to Lift Lobby B or Staircase 2 to reach the{" "}
                    <strong className="text-white">{activeModalRoom.floor}</strong>. Follow room markers to{" "}
                    <strong className="text-cyan-300">Room {activeModalRoom.roomNumber}</strong>.
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => {
                      audioManager.speak(
                        `Directions to ${activeModalRoom.name}: Go to ${activeModalRoom.floor}, Room ${activeModalRoom.roomNumber}`
                      );
                    }}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-xs font-bold text-slate-200 hover:bg-white/10"
                  >
                    <Volume2 className="h-4 w-4 text-cyan-400" />
                    Hear Audio Directions
                  </button>
                  <button
                    onClick={() => setActiveModalRoom(null)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 py-3 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-500/20"
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
   5. AR DIRECTION ARROW & CAMERA OVERLAY
   ========================================================= */

function DirectionArrow({ direction }: { direction: Direction }) {
  if (direction === "arrived") {
    return (
      <motion.div
        animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="relative"
      >
        <div className="flex h-36 w-36 sm:h-44 sm:w-44 items-center justify-center rounded-full border-4 border-amber-400 bg-gradient-to-br from-amber-400/30 to-rose-500/30 shadow-[0_0_60px_rgba(251,191,36,0.8)] backdrop-blur-md">
          <PartyPopper className="h-16 w-16 text-amber-300" />
        </div>
      </motion.div>
    );
  }

  const isTurn = direction !== "straight";

  const renderArrowIcon = () => {
    switch (direction) {
      case "slight-left":
        return <ArrowUpLeft className="h-16 w-16 text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]" strokeWidth={3.5} />;
      case "left":
        return <ArrowLeft className="h-16 w-16 text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]" strokeWidth={3.5} />;
      case "slight-right":
        return <ArrowUpRight className="h-16 w-16 text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]" strokeWidth={3.5} />;
      case "right":
        return <ArrowRight className="h-16 w-16 text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]" strokeWidth={3.5} />;
      default:
        return <ArrowUp className="h-16 w-16 text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]" strokeWidth={3.5} />;
    }
  };

  return (
    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
      className="relative flex items-center justify-center"
    >
      <div
        style={{
          transform: "perspective(450px) rotateX(42deg)",
          transformStyle: "preserve-3d",
        }}
        className="relative flex items-center justify-center"
      >
        <div
          className={`absolute -inset-4 rounded-full blur-2xl ${
            isTurn ? "bg-amber-400/35" : "bg-cyan-400/35"
          }`}
        />
        <div
          className={`relative flex h-32 w-32 sm:h-36 sm:w-36 items-center justify-center rounded-full border-4 ${
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
  videoRef: any;
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
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      {!cameraActive && (
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950" />
          <div className="absolute bottom-1/3 left-0 right-0 flex items-end justify-around px-4 opacity-40 pointer-events-none">
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
                maskImage:
                  "linear-gradient(to bottom, transparent 0%, black 30%, black 100%)",
              }}
            />
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute left-1/2 top-0 h-full w-1 -translate-x-1/2 bg-gradient-to-b from-transparent via-cyan-400 to-cyan-400/80 shadow-[0_0_20px_rgba(34,211,238,0.8)]"
            />
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/70 via-transparent to-slate-950/80" />

      <motion.div
        animate={{ y: ["0%", "100%"] }}
        transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
        className="pointer-events-none absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent"
      />

      {[
        "top-6 left-6 border-t-2 border-l-2",
        "top-6 right-6 border-t-2 border-r-2",
        "bottom-6 left-6 border-b-2 border-l-2",
        "bottom-6 right-6 border-b-2 border-r-2",
      ].map((pos, i) => (
        <div key={i} className={`pointer-events-none absolute h-6 w-6 border-cyan-400/60 ${pos}`} />
      ))}

      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 rounded-full border border-white/10 bg-black/60 px-3 py-1 backdrop-blur-md">
        <motion.div
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          className={`h-2 w-2 rounded-full ${cameraActive ? "bg-emerald-400" : "bg-amber-400"}`}
        />
        <span className="text-[10px] font-bold tracking-wider text-slate-200 uppercase">
          {cameraActive ? "AR • Live Camera" : "AR • Cyber Simulation"}
        </span>
      </div>

      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            y: [0, -25, 0],
            x: [0, i % 2 ? 8 : -8, 0],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: 3 + i,
            repeat: Infinity,
            delay: i * 0.5,
          }}
          className="pointer-events-none absolute h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.9)]"
          style={{
            left: `${20 + i * 20}%`,
            top: `${55 + (i % 2) * 12}%`,
          }}
        />
      ))}
    </div>
  );
}

/* =========================================================
   6. MAIN AR NAVIGATION CONTAINER (WITH GUARANTEED SCROLLING)
   ========================================================= */

export function ARNavigation({ onClose }: { onClose?: () => void }) {
  const [screen, setScreen] = useState<"start" | "ar" | "done">("start");
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [isRequestingCamera, setIsRequestingCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Navigation State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [xp, setXp] = useState(50);
  const [level, setLevel] = useState(1);
  const [streak, setStreak] = useState(1);
  const [combo, setCombo] = useState(1);
  const [voiceOn, setVoiceOn] = useState(true);
  const [showMap, setShowMap] = useState(false);
  const [photoFlash, setPhotoFlash] = useState(false);
  const [achievement, setAchievement] = useState<{ title: string; icon: string } | null>(null);
  const [showXpPop, setShowXpPop] = useState(false);
  const [earnedXpPop, setEarnedXpPop] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const waypoint = ROUTE[currentIndex];

  const totalWalked = ROUTE.slice(0, currentIndex).reduce((a, b) => a + b.distance, 0);
  const progress = Math.min(Math.round((totalWalked / TOTAL_DISTANCE) * 100), 100);

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
      setCameraActive(false);
    }
  }, [cameraStream]);

  const requestCameraAccess = async () => {
    setIsRequestingCamera(true);
    setCameraError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API is not supported in this browser environment.");
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
      setShowCameraModal(false);
      setScreen("ar");
    } catch (err: unknown) {
      const error = err as Error;
      let msg = "Could not access camera. You can still navigate in Cyber Simulation mode.";
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        msg = "Camera permission was denied. Please allow camera access in browser permissions or continue with Cyber Simulator.";
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        msg = "No camera found on this device. Continuing in Cyber Simulation mode.";
      }
      setCameraError(msg);
    } finally {
      setIsRequestingCamera(false);
    }
  };

  const handleStartClicked = () => {
    setShowCameraModal(true);
    requestCameraAccess();
  };

  const handleSkipCamera = () => {
    setShowCameraModal(false);
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

  const handleKeepGoing = () => {
    if (waypoint.direction !== "straight" && waypoint.direction !== "arrived") {
      audioManager.playTurnAlert();
    } else {
      audioManager.playXpGain();
    }

    const earned = waypoint.xpReward * combo;
    setEarnedXpPop(earned);
    setShowXpPop(true);
    setTimeout(() => setShowXpPop(false), 1400);

    setXp((prev) => {
      const newTotal = prev + earned;
      const newLevel = Math.floor(newTotal / 300) + 1;
      if (newLevel > level) {
        setLevel(newLevel);
        audioManager.playAchievement();
      }
      return newTotal;
    });

    setStreak((s) => s + 1);
    if (streak >= 1) {
      setCombo((c) => Math.min(c + 1, 4));
    }

    if (waypoint.achievement) {
      setTimeout(() => {
        setAchievement(waypoint.achievement!);
        audioManager.playAchievement();
      }, 500);
    }

    if (currentIndex < ROUTE.length - 1) {
      setCurrentIndex((idx) => idx + 1);
    } else {
      setScreen("done");
    }
  };

  const handleSnapshot = () => {
    setPhotoFlash(true);
    audioManager.playXpGain();
    setTimeout(() => setPhotoFlash(false), 200);
  };

  const levelProgress = ((xp % 300) / 300) * 100;
  const isArrived = waypoint.direction === "arrived";

  const getDirectionIcon = () => {
    switch (waypoint.direction) {
      case "slight-left":
        return <ArrowUpLeft className="h-6 w-6 text-white" strokeWidth={3} />;
      case "left":
        return <ArrowLeft className="h-6 w-6 text-white" strokeWidth={3} />;
      case "slight-right":
        return <ArrowUpRight className="h-6 w-6 text-white" strokeWidth={3} />;
      case "right":
        return <ArrowRight className="h-6 w-6 text-white" strokeWidth={3} />;
      case "arrived":
        return <Target className="h-6 w-6 text-white" strokeWidth={3} />;
      default:
        return <ArrowUp className="h-6 w-6 text-white" strokeWidth={3} />;
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
      {/* Camera Permission Modal */}
      <AnimatePresence>
        {showCameraModal && (
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
              className="w-full max-w-md rounded-3xl border border-cyan-500/40 bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-2xl shadow-cyan-500/20 text-white"
            >
              <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-400/30">
                <Camera className="h-8 w-8 animate-pulse" />
              </div>

              <div className="mt-4 text-center">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-300 border border-cyan-400/20">
                  <Sparkles className="h-3 w-3" />
                  AR Visual Positioning
                </div>
                <h2 className="mt-3 text-2xl font-bold">Enable Camera Access</h2>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                  Mosaic 2k26 AR Navigation overlays Google Directions-style 3D holographic arrows onto your live camera feed so you can navigate the SFIT campus seamlessly.
                </p>
              </div>

              {cameraError && (
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                  <span>{cameraError}</span>
                </div>
              )}

              <div className="mt-6 flex flex-col gap-3">
                <button
                  onClick={requestCameraAccess}
                  disabled={isRequestingCamera}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 py-3.5 px-4 font-bold text-slate-950 shadow-lg shadow-cyan-500/30 transition-transform active:scale-95 disabled:opacity-60"
                >
                  {isRequestingCamera ? (
                    <>
                      <RefreshCw className="h-5 w-5 animate-spin text-slate-950" />
                      <span>Requesting Permission...</span>
                    </>
                  ) : (
                    <>
                      <Video className="h-5 w-5 text-slate-950" />
                      <span>Allow Camera Access</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleSkipCamera}
                  className="rounded-2xl border border-white/10 bg-white/5 py-3 text-xs font-medium text-slate-300 hover:bg-white/10 transition-colors"
                >
                  Continue with AR Cyber Simulator Mode
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {/* SCREEN 1: START SCREEN */}
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

            <header className="relative z-10 flex items-center justify-between px-6 pt-6 max-w-xl mx-auto w-full">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 shadow-lg shadow-cyan-500/50">
                  <Sparkles className="h-5 w-5 text-slate-950" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">
                    Mosaic 2k26
                  </div>
                  <div className="text-sm font-semibold">AR Campus Navigator</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mr-2">
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

            <div className="relative z-10 mt-6 flex flex-1 flex-col items-center px-6 max-w-xl mx-auto w-full">
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
                <p className="mt-2 max-w-sm text-xs sm:text-sm text-slate-400">
                  Turn slightly left towards Main Building, turn right, and arrive at Mosaic Main Stage!
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
                    <span className="font-semibold text-slate-300">Route Overview • 4 Checkpoints</span>
                    <span className="font-mono text-cyan-300">{TOTAL_DISTANCE}m • ~4 min</span>
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

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { icon: Trophy, label: "4 Badges", color: "text-amber-400" },
                    { icon: Zap, label: "950 XP", color: "text-cyan-400" },
                    { icon: Flame, label: "x3 Combo", color: "text-rose-400" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-center"
                    >
                      <item.icon className={`mx-auto h-4 w-4 ${item.color}`} />
                      <div className="mt-1 text-[11px] font-semibold text-slate-300">
                        {item.label}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            <div className="relative z-10 p-6 max-w-xl mx-auto w-full">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleStartClicked}
                className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 p-[2px] shadow-2xl shadow-violet-500/40"
              >
                <div className="flex items-center justify-center gap-3 rounded-2xl bg-slate-950/85 px-6 py-4 transition-colors group-hover:bg-slate-950/50">
                  <Navigation2 className="h-5 w-5 text-cyan-300 transition-transform group-hover:rotate-45" />
                  <span className="text-lg font-black tracking-wider text-white">START</span>
                  <ChevronRight className="h-5 w-5 text-cyan-300" />
                </div>
              </motion.button>

              <div className="mt-3 flex items-center justify-between text-xs text-slate-400 px-1">
                <span className="text-[11px] text-slate-500">Live Camera AR Directions</span>
                <button
                  onClick={() => setScreen("done")}
                  className="text-xs font-bold text-cyan-400 hover:text-cyan-300 underline underline-offset-4"
                >
                  Browse Committee Rooms (13) →
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* SCREEN 2: AR CAMERA NAVIGATION */}
        {screen === "ar" && (
          <motion.div
            key="ar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative flex min-h-screen flex-col overflow-hidden bg-slate-950 text-white select-none"
          >
            {photoFlash && (
              <div className="fixed inset-0 z-50 bg-white pointer-events-none transition-opacity duration-200" />
            )}

            <ARScene
              cameraStream={cameraStream}
              cameraActive={cameraActive}
              videoRef={videoRef}
            />

            <AnimatePresence>
              {achievement && (
                <motion.div
                  initial={{ y: -80, opacity: 0, scale: 0.8 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: -80, opacity: 0, scale: 0.8 }}
                  className="pointer-events-none fixed left-1/2 top-20 z-50 -translate-x-1/2 w-[90%] max-w-xs"
                >
                  <div className="flex items-center gap-3 rounded-2xl border border-amber-400/50 bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 px-4 py-3 shadow-2xl shadow-amber-500/40 backdrop-blur-xl">
                    <motion.div
                      animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.6 }}
                      className="text-3xl shrink-0"
                    >
                      {achievement.icon}
                    </motion.div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300">
                        Achievement Unlocked
                      </div>
                      <div className="text-sm font-bold text-white leading-tight">
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
                className="pointer-events-none absolute left-1/2 top-1/2 z-40 -translate-x-1/2 -translate-y-1/2 font-black text-2xl text-cyan-300 drop-shadow-[0_0_12px_rgba(34,211,238,0.9)]"
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

            {/* TOP HUD CONTAINER */}
            <div className="relative z-20 w-full max-w-xl mx-auto px-4 pt-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 rounded-2xl border border-white/10 bg-slate-950/70 p-3 backdrop-blur-xl">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <Zap className="h-4 w-4 fill-cyan-400 text-cyan-400" />
                      <span className="font-bold text-cyan-300">LVL {level}</span>
                    </div>
                    <span className="font-mono text-xs font-semibold text-slate-300">
                      {xp} XP
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      animate={{ width: `${levelProgress}%` }}
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500"
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-3.5 py-2.5 backdrop-blur-xl text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Flame className="h-4 w-4 fill-orange-400 text-orange-400" />
                    <span className="text-sm font-bold">{streak}</span>
                  </div>
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Streak
                  </div>
                </div>

                <div className="rounded-2xl border border-amber-400/30 bg-slate-950/70 px-3.5 py-2.5 backdrop-blur-xl text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Coins className="h-4 w-4 text-amber-400" />
                    <span className="text-sm font-bold text-amber-300">x{combo}</span>
                  </div>
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Combo
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

              {/* Direction Banner */}
              <motion.div
                key={waypoint.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-3 flex items-center gap-3.5 rounded-2xl border border-cyan-400/30 bg-slate-950/80 p-3.5 backdrop-blur-xl shadow-xl shadow-cyan-500/10"
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

                <div className="flex-1 min-w-0">
                  <div
                    className={`text-[11px] font-black uppercase tracking-wider ${
                      waypoint.direction !== "straight" && waypoint.direction !== "arrived"
                        ? "text-amber-300"
                        : "text-cyan-300"
                    }`}
                  >
                    {getDirectiveText()}
                  </div>
                  <div className="truncate text-base font-bold text-white">
                    {waypoint.title}
                  </div>
                  <div className="truncate text-xs text-slate-300">
                    {waypoint.subtitle}
                  </div>
                </div>

                {waypoint.distance > 0 && (
                  <div className="text-right shrink-0">
                    <div className="text-xl font-black text-cyan-300 leading-none">
                      {waypoint.distance}
                    </div>
                    <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                      meters
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Middle compass */}
            <div className="pointer-events-none absolute right-4 top-1/2 z-20 -translate-y-1/2">
              <div className="flex flex-col items-center gap-1 rounded-2xl border border-white/10 bg-slate-950/70 p-2 backdrop-blur-xl">
                <Compass className="h-5 w-5 text-cyan-300" />
                <div className="text-[10px] font-bold">N</div>
                <div className="h-6 w-0.5 rounded bg-gradient-to-b from-cyan-400 to-transparent" />
              </div>
            </div>

            {/* 3D Direction Arrow & Distance Tag */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center pointer-events-none py-2 my-auto">
              <motion.div
                key={`pin-${waypoint.id}`}
                initial={{ opacity: 0, y: -12, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="mb-3 z-10"
              >
                <div className="flex items-center gap-2 rounded-full border border-cyan-300/60 bg-black/85 px-4 py-1.5 shadow-2xl shadow-cyan-500/40 backdrop-blur-md">
                  <MapPin className="h-4 w-4 text-cyan-300 shrink-0" />
                  <span className="text-sm font-bold text-white tracking-wide">
                    {waypoint.landmark}
                  </span>
                  <span className="rounded-full bg-cyan-400/20 px-2 py-0.5 text-xs font-mono font-bold text-cyan-300">
                    {waypoint.distance > 0 ? `${waypoint.distance}m` : "HERE"}
                  </span>
                </div>
                <div className="mx-auto h-4 w-0.5 bg-gradient-to-b from-cyan-400 to-transparent shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              </motion.div>

              <div className="relative">
                <DirectionArrow direction={waypoint.direction} />
              </div>
            </div>

            {/* BOTTOM HUD CONTAINER */}
            <div className="relative z-20 w-full max-w-xl mx-auto space-y-3 px-4 pb-6">
              <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-3.5 backdrop-blur-xl">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">Route Progress</span>
                  <span className="font-mono font-bold text-cyan-300">
                    {progress}%
                  </span>
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
                        : (ROUTE.slice(0, i).reduce((a, b) => a + b.distance, 0) /
                            TOTAL_DISTANCE) *
                          100;
                    return (
                      <div
                        key={w.id}
                        className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-slate-950 ${
                          i <= currentIndex ? "bg-cyan-300 scale-110" : "bg-slate-600"
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
                    <div className="text-xs text-amber-100 font-medium">
                      {waypoint.tip}
                    </div>
                  </div>
                </motion.div>
              )}

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleKeepGoing}
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
                      <Navigation2 className="h-5 w-5 text-cyan-300" />
                      <span className="text-lg font-black tracking-wide text-white">
                        {waypoint.actionText || "KEEP GOING"}
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
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-slate-950/70 text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
                >
                  <Camera className="h-4 w-4" />
                </button>

                <button
                  onClick={requestCameraAccess}
                  title={cameraActive ? "Camera is Live" : "Turn on Camera"}
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
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-slate-950/70 text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
                >
                  <MapPin className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* SCREEN 3: ARRIVAL & SELECT ROOM TO VISIT (NATURAL SCROLLING) */}
        {screen === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative flex min-h-min flex-col bg-gradient-to-b from-slate-950 via-violet-950 to-slate-950 text-white pb-32"
          >
            <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-amber-400/30 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-violet-500/30 blur-3xl" />

            {onClose && (
              <div className="absolute top-4 right-4 z-30">
                <button
                  onClick={handleExit}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-slate-300 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}

            <div className="relative z-10 flex flex-1 flex-col items-center px-4 py-8 text-center max-w-5xl mx-auto w-full">
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
                <h1 className="mt-4 text-4xl sm:text-5xl font-black leading-tight">
                  Welcome to
                  <br />
                  <span className="bg-gradient-to-r from-amber-300 via-rose-400 to-violet-400 bg-clip-text text-transparent">
                    Mosaic 2k26!
                  </span>
                </h1>
                <p className="mt-2 text-sm text-slate-400">
                  You navigated from SFIT Gate, turned slightly left towards Main Building, and turned right to reach Mosaic Main Stage!
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-6 grid w-full max-w-xl grid-cols-3 gap-3"
              >
                {[
                  { icon: Zap, label: "XP Earned", value: "1,200", color: "text-cyan-400" },
                  { icon: MapPin, label: "Distance", value: `${TOTAL_DISTANCE}m`, color: "text-violet-400" },
                  { icon: Trophy, label: "Badges", value: "4", color: "text-amber-400" },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur text-center"
                  >
                    <s.icon className={`mx-auto h-5 w-5 ${s.color}`} />
                    <div className="mt-2 text-xl font-black">{s.value}</div>
                    <div className="text-[10px] font-bold uppercase text-slate-400">
                      {s.label}
                    </div>
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
                      className="flex flex-col items-center rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-500/10 to-violet-500/10 p-2 sm:p-2.5 backdrop-blur flex-1"
                    >
                      <div className="text-2xl sm:text-3xl">{b.icon}</div>
                      <div className="mt-1 text-[10px] font-semibold text-slate-200">
                        {b.name}
                      </div>
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

              <div className="mt-10 mb-4 w-full max-w-md">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleRestart}
                  className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-6 py-4 text-base font-bold shadow-2xl shadow-violet-500/40 text-slate-950 transition-transform hover:scale-[1.01]"
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