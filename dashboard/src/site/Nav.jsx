import { useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useSpring } from "framer-motion";
import { ArrowUpRight, GitBranch, Menu, X, Zap } from "lucide-react";
import { LINKS } from "./siteData";
import { MagneticButton, PulseDot } from "./primitives";

const NAV_LINKS = [
  { label: "Overview", href: "#overview" },
  { label: "Pipeline", href: "#pipeline" },
  { label: "Results", href: "#results" },
  { label: "Integrity", href: "#integrity" },
  { label: "Stack", href: "#stack" },
];

function Wordmark() {
  return (
    <a href="#overview" className="group flex items-center gap-3">
      <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-xl border border-white/10 bg-zinc-900/60">
        <span className="absolute inset-0 bg-gradient-to-br from-cyan-400/25 via-transparent to-indigo-500/25 opacity-70" />
        <Zap size={15} className="relative text-cyan-300" strokeWidth={2.4} />
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-mono text-[13px] font-semibold tracking-[0.24em] text-zinc-100">
          GRIDSENSE
          <span className="text-cyan-400"> AI</span>
        </span>
        <span className="mt-1 font-mono text-[9px] tracking-[0.32em] text-zinc-600 uppercase">
          load forecasting
        </span>
      </span>
    </a>
  );
}

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 26, mass: 0.3 });

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    setScrolled(latest > 0.01);
  });

  return (
    <>
      {/* top progress rail */}
      <motion.div
        style={{ scaleX: progress }}
        className="fixed inset-x-0 top-0 z-[90] h-px origin-left bg-gradient-to-r from-cyan-300 via-cyan-400 to-indigo-400"
      />

      <header className="fixed inset-x-0 top-0 z-[85] flex justify-center px-4 pt-4">
        <motion.nav
          initial={{ y: -28, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className={`flex w-full max-w-[1400px] items-center justify-between rounded-2xl border px-4 py-3 transition-all duration-500 md:px-5 ${
            scrolled
              ? "border-white/10 bg-zinc-950/70 shadow-[0_18px_60px_-30px_rgba(0,0,0,0.9)] backdrop-blur-xl"
              : "border-transparent bg-transparent"
          }`}
        >
          <Wordmark />

          <div className="hidden items-center gap-8 lg:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="link-sweep font-mono text-[11px] tracking-[0.18em] text-zinc-400 uppercase transition-colors hover:text-zinc-100"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 font-mono text-[10px] tracking-[0.2em] text-zinc-500 uppercase xl:inline-flex">
              <PulseDot tone="#34d399" />
              tests passing
            </span>
            <a
              href={LINKS.repo}
              target="_blank"
              rel="noreferrer"
              className="hidden h-9 w-9 place-items-center rounded-full border border-white/10 text-zinc-400 transition-colors hover:border-white/25 hover:text-zinc-100 md:grid"
              aria-label="Source repository"
            >
              <GitBranch size={15} />
            </a>
            <MagneticButton href={LINKS.dashboard} className="hidden md:inline-flex">
              Console
              <ArrowUpRight size={13} />
            </MagneticButton>
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-zinc-300 lg:hidden"
              aria-label="Toggle navigation"
            >
              {open ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </motion.nav>
      </header>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-4 top-24 z-[84] rounded-2xl border border-white/10 bg-zinc-950/85 p-5 backdrop-blur-xl lg:hidden"
          >
            <div className="flex flex-col divide-y divide-white/5">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="py-3 font-mono text-xs tracking-[0.2em] text-zinc-300 uppercase"
                >
                  {link.label}
                </a>
              ))}
              <a
                href={LINKS.dashboard}
                className="flex items-center gap-2 py-3 font-mono text-xs tracking-[0.2em] text-cyan-300 uppercase"
              >
                Launch console <ArrowUpRight size={13} />
              </a>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
