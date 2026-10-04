import { motion } from 'framer-motion';

const ABOUT_POINTS = [
  'Every committee builds its own game — nobody borrows, nobody repeats.',
  'A full year of ideas, compressed into three days of pure innovation.',
  'One campus, every mind, one showcase you don\'t want to miss.',
];

export default function AboutSection() {
  return (
    <section
      id="about"
      className="relative overflow-hidden px-5 pb-20 pt-20 sm:px-8 md:px-10"
    >
      <div className="relative z-10 mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          className="mb-10 text-center lg:mb-14"
        >
          <p className="mb-3 text-xs uppercase tracking-[0.3em] text-[#D7E2EA]/50 sm:text-sm">
            SFIT's Technical Fest
          </p>
          <h2
            className="hero-heading font-black uppercase leading-none tracking-tight"
            style={{ fontSize: 'clamp(2.75rem, 12vw, 170px)' }}
          >
            About Us
          </h2>
        </motion.div>

        <div className="grid items-center gap-12 lg:grid-cols-[1.08fr_0.92fr] lg:gap-x-16">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
            className="space-y-6"
          >
            <p className="max-w-[36rem] text-base leading-relaxed text-[#D7E2EA]/80 sm:text-lg lg:text-[1.1rem] lg:leading-[1.8]">
              MOSAIC isn't run by one committee — it's built by every single
              one of them. Different teams, different ideas, one shared
              stage. Three days where a year's worth of late nights, wild
              ideas, and last-minute brainwaves finally go live — no two
              games alike, nobody playing it safe.
            </p>

            <div className="space-y-4 lg:space-y-5">
              {ABOUT_POINTS.map((point, index) => (
                <motion.div
                  key={point}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.5, delay: 0.15 + index * 0.1 }}
                  whileHover={{
                    scale: 1.02,
                    x: 6,
                    borderColor: 'rgba(215,226,234,0.4)',
                    backgroundColor: 'rgba(215,226,234,0.08)',
                  }}
                  className="flex items-start gap-4 rounded-2xl border border-[#D7E2EA]/15 bg-[#D7E2EA]/5 p-4 backdrop-blur-sm transition-shadow duration-300 hover:shadow-[0_10px_40px_rgba(0,0,0,0.4)] lg:p-5"
                >
                  <motion.span
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                    className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#D7E2EA]/40 bg-[#0C0C0C] text-sm font-bold text-[#D7E2EA] lg:h-9 lg:w-9"
                  >
                    0{index + 1}
                  </motion.span>
                  <p className="text-sm leading-relaxed text-[#D7E2EA]/80 sm:text-base lg:text-[1.02rem]">
                    {point}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 30 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex w-full -translate-y-4 items-center justify-center lg:justify-end"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5, ease: 'easeInOut', repeat: Infinity }}
              className="relative w-full max-w-[680px]"
            >
              <div
                className="relative rounded-[42px] border-[3px] border-[#73787d] bg-[#272b2f] p-2 shadow-[0_30px_90px_rgba(0,0,0,0.7),inset_0_0_0_2px_rgba(255,255,255,0.18)] sm:rounded-[52px] sm:p-3"
                style={{
                  backgroundImage:
                    'linear-gradient(145deg, #9da3a8 0%, #353a3f 18%, #171a1d 52%, #73797f 100%)',
                }}
              >
                <div className="absolute -left-[6px] top-1/2 h-16 w-1 -translate-y-1/2 rounded-full bg-[#848a8f] shadow-[0_0_0_1px_rgba(0,0,0,0.5)]" />
                <div className="absolute -right-[6px] top-1/2 h-20 w-1 -translate-y-1/2 rounded-full bg-[#848a8f] shadow-[0_0_0_1px_rgba(0,0,0,0.5)]" />
                <div className="absolute left-1/2 top-1 h-1 w-20 -translate-x-1/2 rounded-full bg-white/25" />

                <div className="relative overflow-hidden rounded-[34px] border-2 border-black/70 bg-black shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)] sm:rounded-[43px]">
                  <div className="absolute left-1/2 top-2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-black shadow-[0_1px_3px_rgba(255,255,255,0.18)] sm:top-3 sm:h-6 sm:w-28" />
                  <div className="absolute bottom-2 left-1/2 z-10 h-1 w-24 -translate-x-1/2 rounded-full bg-white/70 sm:bottom-3 sm:w-28" />
                  <div className="relative aspect-video w-full overflow-hidden">
                    <video
                      className="absolute inset-0 h-full w-full object-cover"
                      src="/About-us.mp4"
                      poster="/image.jpeg"
                      autoPlay
                      muted
                      loop
                      playsInline
                      aria-label="MOSAIC fest video"
                    />
                  </div>
                </div>
              </div>
            </motion.div>

          </motion.div>
        </div>
      </div>
    </section>
  );
}