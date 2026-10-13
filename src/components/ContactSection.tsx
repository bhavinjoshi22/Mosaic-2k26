import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type TechTeamMember = {
  name: string;
  photo: string;
  headName?: string;
  mobile?: string;
  email?: string;
};

const TECH_TEAM: TechTeamMember[] = [
  { name: "CSI", photo: "/CSI%20TECHHEAD.jpeg" },
  {
    name: "ITSA",
    photo: "/ITSA%20TECHHEAD.jpeg",
    headName: "Bhavin Joshi",
    mobile: "8591601713",
    email: "bhavinjoshi22032006@student.sfit.ac.in",
  },
  { name: "ISTE", photo: "/ISTE%20TECHHEAD" },
  {
    name: "IETE",
    photo: "/IETE%20TECHHEAD.jpeg",
    headName: "Soham Kadam",
    mobile: "9870526618",
    email: "sohamkadam440@student.sfit.ac.in",
  },
  {
    name: "RAW",
    photo: "/RAW%20TECHHEAD",
    headName: "Joshua Coutinho",
    mobile: "8976357005",
    email: "joshuacoutinho5@student.sfit.ac.in",
  },
  { name: "EESA", photo: "/EESA%20TECHHEAD.jpeg" },
  { name: "CODEX", photo: "/CODEX%20TECHHEAD.jpeg" },
  { name: "ECSSA", photo: "/ECSSA%20TECHHEAD.jpeg" },
];

function CommitteeCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [unavailablePhotos, setUnavailablePhotos] = useState<string[]>([]);
  const visibleTeam = TECH_TEAM.filter((member) => !unavailablePhotos.includes(member.name));

  useEffect(() => {
    if (visibleTeam.length < 2) return;

    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % visibleTeam.length);
    }, 3000);

    return () => window.clearInterval(timer);
  }, [visibleTeam.length]);

  useEffect(() => {
    if (activeIndex >= visibleTeam.length) setActiveIndex(0);
  }, [activeIndex, visibleTeam.length]);

  const committee = visibleTeam[activeIndex];

  if (!committee) return null;

  return (
    <div className="relative mx-auto min-h-[500px] w-[min(88vw,360px)] overflow-hidden sm:min-h-[520px]">
      <AnimatePresence initial={false}>
        <motion.article
          key={committee.name}
          initial={{ x: "12%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "-12%", opacity: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/50 p-3 text-center"
        >
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-white">
            {committee.name}
          </h3>
          <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-neutral-800 bg-neutral-800/50">
            <img
              src={committee.photo}
              alt={`${committee.name} Tech Head`}
              className="h-full w-full object-cover"
              loading="lazy"
              onError={(event) => {
                setUnavailablePhotos((current) =>
                  current.includes(committee.name) ? current : [...current, committee.name],
                );
              }}
            />
          </div>
          <div className="mt-4 space-y-2 text-left text-sm">
            {committee.headName || committee.mobile || committee.email ? (
              <>
                {committee.headName && <p className="text-white">{committee.headName}</p>}
                {committee.mobile && <p className="text-neutral-400">Mobile: {committee.mobile}</p>}
                {committee.email && <p className="break-all text-neutral-400">Email: {committee.email}</p>}
              </>
            ) : (
              <p className="text-neutral-500">Tech Head details coming soon</p>
            )}
          </div>
        </motion.article>
      </AnimatePresence>
    </div>
  );
}

export default function ContactSection() {
  return (
    <section id="contact" className="relative overflow-hidden py-20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="pb-10 text-center">
          <h2
            className="hero-heading text-center font-black uppercase leading-none tracking-tight"
            style={{ fontSize: "clamp(3rem, 12vw, 160px)" }}
          >
            Contact Us
          </h2>
          <p className="mt-3 text-sm uppercase tracking-widest text-neutral-400">
            Meet the Tech Team
          </p>
        </div>

        <div className="overflow-hidden">
          <CommitteeCarousel />
        </div>
      </div>
    </section>
  );
}