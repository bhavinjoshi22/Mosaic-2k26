import { motion } from "framer-motion";

type TechTeamMember = {
  name: string;
  photo: string;
  headName?: string;
  mobile?: string;
  email?: string;
};

const TECH_TEAM: TechTeamMember[] = [
  { name: "CSI", photo: "/CSI%20TECHHEAD.jpeg" ,headName:"Balaji Nadar",mobile:"9860365177" ,email:"balaji17nadar@student.sfit.ac.in"},
  {
    name: "ITSA",
    photo: "/ITSA%20TECHHEAD.jpg",
    headName: "Bhavin Joshi",
    mobile: "8591601713",
    email: "bhavinjoshi22032006@student.sfit.ac.in",
  },
  { name: "ISTE", photo: "/ISTE%20TECHHEAD.png" ,headName:"Viraj Salunke",mobile:"9372437473" ,email:"virajsalunke192006@student.sfit.ac.in"},
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
  { name: "EESA",
    photo: "/EESA%20TECHHEAD.jpeg" ,
    headName: "Bhaarat Yadav",
    mobile: "8291600882",
    email: "bhaaratyadav7@student.sfit.ac.in",
  },
  { name: "CODEX", photo: "/CODEX%20TECHHEAD.jpeg" ,
    headName: "Gilmore Dsilva",
    mobile: "9619469771",
    email: "thegilmoredsilva@student.sfit.ac.in",
  },
  { name: "ECSSA",
    photo: "/ECSSA%20TECHHEAD.jpeg  ",
    headName: "Briva",
    mobile: "9326829981",
    email: "Briva.10102@student.sfit.ac.in",
  },
]
function CommitteeCarousel() {
  const duplicatedTeam = [...TECH_TEAM, ...TECH_TEAM];

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#0c0c0c] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#0c0c0c] to-transparent" />

      <motion.div
        className="flex w-max gap-5 py-4"
        animate={{ x: ["0%", "-50%"] }}
        transition={{
          x: {
            duration: 32,
            ease: "linear",
            repeat: Infinity,
          },
        }}
      >
        {duplicatedTeam.map((committee, index) => (
          <article
            key={`${committee.name}-${index}`}
            className="w-[280px] shrink-0 overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 text-center shadow-[0_20px_60px_rgba(0,0,0,0.35)] sm:w-[300px]"
          >
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-white">
              {committee.name}
            </h3>

            <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-neutral-800 bg-neutral-800/40">
              <img
                src={committee.photo}
                alt={`${committee.name} Tech Head`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>

            <div className="mt-4 space-y-2 text-left text-sm">
              {committee.headName || committee.mobile || committee.email ? (
                <>
                  {committee.headName && <p className="text-base text-white">{committee.headName}</p>}
                  {committee.mobile && <p className="text-neutral-400">Mobile: {committee.mobile}</p>}
                  {committee.email && <p className="break-all text-neutral-400">Email: {committee.email}</p>}
                </>
              ) : (
                <p className="text-neutral-500">Tech Head details coming soon</p>
              )}
            </div>
          </article>
        ))}
      </motion.div>
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