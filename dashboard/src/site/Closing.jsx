import { motion } from "framer-motion";
import { ArrowUpRight, GitBranch, Zap } from "lucide-react";
import { LINKS, RESULT, SUBJECT } from "./siteData";
import { MagneticButton, Reveal } from "./primitives";

const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Forecasting console", href: LINKS.dashboard },
      { label: "Architecture", href: "#pipeline" },
      { label: "Benchmarks", href: "#results" },
    ],
  },
  {
    title: "Trust",
    links: [
      { label: "Integrity log", href: "#integrity" },
      { label: "Drift policy", href: "#results" },
      { label: "Known limits", href: "#stack" },
    ],
  },
  {
    title: "Source",
    links: [
      { label: "GitHub repository", href: LINKS.repo, external: true },
      { label: "README", href: LINKS.repo, external: true },
      { label: "pytest suite", href: LINKS.repo, external: true },
    ],
  },
];

/** Dispatch closing block — one more honest number before the door out. */
function DispatchSection() {
  const facts = [
    { k: "operator", v: SUBJECT.operator },
    { k: "market", v: SUBJECT.market },
    { k: "window", v: SUBJECT.window },
    { k: "test hours", v: RESULT.testHours.toLocaleString() },
  ];

  return (
    <section className="relative py-24 md:py-32">
      <div className="mx-auto w-full max-w-[1400px] px-6 lg:px-10">
        <Reveal className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/40 p-8 backdrop-blur-md md:p-14">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(700px circle at 82% 0%, rgba(34,211,238,0.16), transparent 60%), radial-gradient(520px circle at 4% 100%, rgba(99,102,241,0.16), transparent 62%)",
            }}
          />
          <div className="relative grid grid-cols-12 items-center gap-8">
            <div className="col-span-12 lg:col-span-7">
              <span className="font-mono text-xs tracking-widest text-zinc-500 uppercase">
                04 · Dispatch
              </span>
              <h2 className="mt-5 font-display text-[clamp(2rem,4.6vw,3.6rem)] leading-[1.02] font-semibold tracking-[-0.04em]">
                <span className="text-metal">{RESULT.savedPerHour} MW of error,</span>
                <br />
                <span className="text-cyan-grad">removed from every hour.</span>
              </h2>
              <p className="mt-6 max-w-xl text-sm leading-relaxed text-zinc-400">
                That is the gap between reusing last week's shape and knowing today's. Point the console
                at a date and it rebuilds the features live, calls the model, and shows you how much to
                trust the answer.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <MagneticButton href={LINKS.dashboard}>
                  Open the console
                  <ArrowUpRight size={14} />
                </MagneticButton>
                <MagneticButton href={LINKS.repo} variant="ghost">
                  <GitBranch size={13} />
                  View the source
                </MagneticButton>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-5">
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                {facts.map((item) => (
                  <div key={item.k} className="bg-zinc-950/60 px-4 py-4">
                    <div className="font-mono text-[10px] tracking-[0.2em] text-zinc-600 uppercase">
                      {item.k}
                    </div>
                    <div className="mt-1.5 font-mono text-xs text-zinc-200">{item.v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/** Footer: wordmark, three link columns, build stamp. */
function Footer() {
  return (
    <footer className="relative border-t border-white/8 pt-14 pb-10">
      <div className="mx-auto w-full max-w-[1400px] px-6 lg:px-10">
        <div className="grid grid-cols-12 gap-10">
          <div className="col-span-12 flex flex-col gap-5 lg:col-span-5">
            <span className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-zinc-900/60">
                <Zap size={15} className="text-cyan-300" strokeWidth={2.4} />
              </span>
              <span className="font-mono text-[13px] font-semibold tracking-[0.24em] text-zinc-100">
                GRIDSENSE<span className="text-cyan-400"> AI</span>
              </span>
            </span>
            <p className="max-w-sm text-xs leading-relaxed text-zinc-500">
              Day-ahead hourly load forecasting with the unglamorous parts included: validation,
              leakage checks, experiment tracking, serving parity, drift surveillance and a retrain
              policy you can read in one sitting.
            </p>
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="font-mono text-[10px] tracking-[0.22em] text-zinc-600 uppercase"
            >
              {SUBJECT.readings.toLocaleString()} readings · {RESULT.weeksTracked} monitored weeks
            </motion.span>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <div
              key={column.title}
              className="col-span-6 flex flex-col gap-4 md:col-span-4 lg:col-span-2"
            >
              <span className="font-mono text-[10px] tracking-[0.24em] text-zinc-500 uppercase">
                {column.title}
              </span>
              <ul className="flex flex-col gap-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target={link.external ? "_blank" : undefined}
                      rel={link.external ? "noreferrer" : undefined}
                      className="link-sweep text-xs text-zinc-400 transition-colors hover:text-zinc-100"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-white/8 pt-6 md:flex-row md:items-center">
          <span className="font-mono text-[10px] tracking-[0.2em] text-zinc-600 uppercase">
            react 19 · vite · tailwind · framer motion
          </span>
          <span className="font-mono text-[10px] tracking-[0.2em] text-zinc-600 uppercase">
            GridSense AI · MIT licensed
          </span>
        </div>
      </div>
    </footer>
  );
}

export default function Closing() {
  return (
    <>
      <DispatchSection />
      <Footer />
    </>
  );
}
