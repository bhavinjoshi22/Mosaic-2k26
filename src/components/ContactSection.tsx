import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Phone } from "lucide-react";

interface CouncilMember {
  role: string;
  name: string;
  email: string;
  phone: string;
  photo?: string;
}

const COUNCIL_MEMBERS: CouncilMember[] = [
  { role: "President", name: "Austin Machado", email: "president@mosaic2k26.com", phone: "+91 00000 00000", photo: "/Austin.jpeg" },
  { role: "General Secretary", name: "Royce Rodriguez", email: "gensec@mosaic2k26.com", phone: "+91 00000 00000", photo: "/Royce.jpeg" },
  { role: "Lady Representative", name: "Bhavisha", email: "ladyrep@mosaic2k26.com", phone: "+91 00000 00000", photo: "/Bhavisha.jpeg" },
  { role: "Technical Secretary", name: "Aman Gound", email: "techsec@mosaic2k26.com", phone: "+91 00000 00000", photo: "/aman.jpeg" },
  { role: "Joint Technical Secretary", name: "Bhavin Joshi", email: "jtechsec@mosaic2k26.com", phone: "+91 00000 00000", photo: "/Bhavin.jpeg" },
  { role: "NSS Representative", name: "Shravan More", email: "nssrep@mosaic2k26.com", phone: "+91 00000 00000", photo: "/image.jpeg" },
  { role: "Cultural Secretary", name: "Rashi", email: "culsec@mosaic2k26.com", phone: "+91 00000 00000", photo: "/Rashi.jpeg" },
  { role: "Joint Cultural Secretary", name: "Janhvi", email: "jculsec@mosaic2k26.com", phone: "+91 00000 00000", photo: "/Janhvi.jpeg" },
  { role: "Sports Secretary", name: "Sarang", email: "sportsec@mosaic2k26.com", phone: "+91 00000 00000", photo: "/Sarang.jpeg" },
  { role: "Joint Sports Secretary", name: "Divesh", email: "jsportsec@mosaic2k26.com", phone: "+91 00000 00000", photo: "/Divesh.jpeg" },
];


const STACK_GAP = 300;

const AUTOPLAY_INTERVAL = 2500;

export default function ContactSection() {
  const [activeIndex, setActiveIndex] = useState(0);


  useEffect(() => {
    const id = setInterval(() => {
      setActiveIndex((current) => (current + 1) % COUNCIL_MEMBERS.length);
    }, AUTOPLAY_INTERVAL);
    return () => clearInterval(id);
  }, []);

  return (
    <section id="contact" className="relative overflow-hidden py-20">

      <div className="relative flex flex-col">
        <div className="pb-4 text-center">
          <h2
            className="hero-heading text-center font-black uppercase leading-none tracking-tight"
            style={{ fontSize: 'clamp(3rem, 12vw, 160px)' }}
          >
            Contact Us
          </h2>
          <p className="mt-2 text-sm text-neutral-500">Meet the council</p>
        </div>

        {/* Horizontal cover-flow stack, auto-playing */}
        <div className="relative h-[720px] overflow-hidden">
          {COUNCIL_MEMBERS.map((member, i) => {
            const total = COUNCIL_MEMBERS.length;

            let offset = i - activeIndex;
            if (offset > total / 2) offset -= total;
            if (offset < -total / 2) offset += total;
            const abs = Math.abs(offset);
            const isActive = offset === 0;
            const visible = abs <= 2;

            return (
              <motion.div
                key={i}
                className="absolute left-1/2 top-1/2 w-[340px] sm:w-[420px]"
                style={{ zIndex: 10 - abs }}
                animate={{
                  x: `calc(-50% + ${offset * STACK_GAP}px)`,
                  y: "-50%",
                  scale: isActive ? 1 : 0.8,
                  opacity: visible ? (isActive ? 1 : 0.35) : 0,
                }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                <div
                  className={`rounded-2xl border p-6 text-center backdrop-blur-sm transition-colors ${
                    isActive
                      ? "border-neutral-700 bg-neutral-900/70"
                      : "border-neutral-800 bg-neutral-900/40"
                  }`}
                >
                  <p className="mb-4 text-xs uppercase tracking-wide text-neutral-500">
                    {member.role}
                  </p>

                  {/* Photo box — shows member.photo, falls back to the User icon if it fails to load */}
                  <div className="relative mx-auto mb-7 h-56 w-56 sm:h-64 sm:w-64">
                    <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-xl border border-neutral-700 bg-neutral-800/50">
                      {member.photo && (
                        <img
                          src={member.photo}
                          alt={member.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            e.currentTarget.nextElementSibling?.classList.remove("hidden");
                          }}
                        />
                      )}
                      <User className="hidden h-14 w-14 text-neutral-600" />
                    </div>
                  </div>

                  <h3 className="text-xl font-medium text-white">{member.name}</h3>

                  <div className="mt-3 space-y-1.5 text-sm text-neutral-400">
                    <div className="flex items-center justify-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{member.email}</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{member.phone}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}