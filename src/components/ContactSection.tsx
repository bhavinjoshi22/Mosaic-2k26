import { User } from "lucide-react";

const TECH_TEAM = [
  { name: "CSI", photo: "/CSI%20TECHHEAD.jpeg" },
  { name: "ITSA" },
  { name: "ISTE", photo: "/ISTE%20TECHHEAD" },
  { name: "IEEE" },
  { name: "IETE", photo: "/IETE%20TECHHEAD.jpeg" },
  { name: "ADG" },
  { name: "RAW", photo: "/RAW%20TECHHEAD" },
  { name: "GATEE" },
  { name: "TEJAS" },
  { name: "EESA" },
  { name: "MESA" },
  { name: "CODEX", photo: "/CODEX%20TECHHEAD.jpeg" },
  { name: "E-TAN" },
  { name: "ECSSA" },
];

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

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {TECH_TEAM.map((committee) => (
            <article
              key={committee.name}
              className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/50 p-3 text-center"
            >
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-white">
                {committee.name}
              </h3>
              <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-neutral-800 bg-neutral-800/50">
                {committee.photo ? (
                  <img
                    src={committee.photo}
                    alt={`${committee.name} Tech Head`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                      event.currentTarget.nextElementSibling?.classList.remove("hidden");
                    }}
                  />
                ) : null}
                <div className={`${committee.photo ? "hidden" : ""} flex flex-col items-center gap-2 text-neutral-500`}>
                  <User className="h-8 w-8" />
                  <span className="text-[10px] uppercase tracking-wider">Photo coming soon</span>
                </div>
              </div>
              <p className="mt-2 text-xs text-neutral-500">Tech Head</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}