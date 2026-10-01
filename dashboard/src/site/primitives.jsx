import { useEffect, useRef, useState } from "react";
import { motion, animate, useInView, useMotionValue, useSpring, useTransform } from "framer-motion";
import { EASE } from "./motion";

/* ------------------------------------------------------------------ *
 *  Glass building blocks + interaction primitives
 * ------------------------------------------------------------------ */

/** Scroll-triggered reveal (fires once, generous viewport margin). */
export function Reveal({ children, delay = 0, y = 26, className = "" }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, filter: "blur(10px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-80px 0px -120px 0px" }}
      transition={{ duration: 0.85, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

/** Uppercase monospaced section badge — the text-xs font-mono tracking-widest label. */
export function Badge({ children, tone = "zinc", className = "" }) {
  const tones = {
    zinc: "border-white/10 text-zinc-400",
    accent: "border-cyan-400/30 bg-cyan-400/5 text-cyan-300",
    warn: "border-amber-400/30 bg-amber-400/5 text-amber-300",
  };
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-xs tracking-widest uppercase ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

/** Compact monospace key/value ledger row. */
export function KeyValue({ k, v, accent = false }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-white/5 py-2 last:border-0">
      <span className="font-mono text-[11px] tracking-wider text-zinc-500 uppercase">{k}</span>
      <span className={`font-mono text-xs ${accent ? "text-cyan-300" : "text-zinc-300"}`}>{v}</span>
    </div>
  );
}

/**
 * Glassmorphic card with a per-card cursor spotlight.
 * Base spec: bg-zinc-900/40 backdrop-blur-md border border-white/10
 * Added: top-edge hairline, spring lift, cursor-following radial gradient.
 */
export function GlassCard({
  children,
  className = "",
  spot = "rgba(34,211,238,0.10)",
  hoverLift = true,
}) {
  const ref = useRef(null);

  const handleMove = (event) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--x", `${event.clientX - rect.left}px`);
    el.style.setProperty("--y", `${event.clientY - rect.top}px`);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      whileHover={hoverLift ? { y: -5 } : undefined}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/40 backdrop-blur-md ${className}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(360px circle at var(--x, 50%) var(--y, 0%), ${spot}, transparent 68%)`,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
      />
      <div className="relative h-full">{children}</div>
    </motion.div>
  );
}

/** Springy magnetic button with cursor attraction and tap feedback. */
export function MagneticButton({ children, href, variant = "primary", className = "", pull = 8 }) {
  const ref = useRef(null);
  const x = useSpring(0, { stiffness: 260, damping: 18, mass: 0.4 });
  const y = useSpring(0, { stiffness: 260, damping: 18, mass: 0.4 });

  const handleMove = (event) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dx = (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    const dy = (event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
    x.set(dx * pull);
    y.set(dy * pull);
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  const skin =
    variant === "primary"
      ? "bg-cyan-300 text-zinc-950 hover:bg-cyan-200 shadow-[0_0_0_1px_rgba(34,211,238,0.45),0_20px_44px_-20px_rgba(34,211,238,0.75)]"
      : "border border-white/15 text-zinc-200 hover:border-white/30 hover:bg-white/5";

  const Tag = href ? motion.a : motion.button;

  return (
    <Tag
      ref={ref}
      href={href}
      target={href && href.startsWith("http") ? "_blank" : undefined}
      rel={href && href.startsWith("http") ? "noreferrer" : undefined}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      style={{ x, y }}
      whileTap={{ scale: 0.955 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
      className={`inline-flex items-center gap-2 rounded-full px-6 py-3 font-mono text-xs font-medium tracking-widest uppercase transition-colors ${skin} ${className}`}
    >
      {children}
    </Tag>
  );
}

/** Number that animates up once it scrolls into view. */
export function CountUp({ value, decimals = 0, duration = 1.5, className = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px 0px" });
  const progress = useMotionValue(0);
  const text = useTransform(progress, (latest) =>
    latest.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  );
  const [display, setDisplay] = useState(
    (0).toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  );

  useEffect(() => text.on("change", (next) => setDisplay(next)), [text]);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(progress, value, { duration, ease: EASE });
    return () => controls.stop();
  }, [inView, progress, value, duration]);

  return (
    <span ref={ref} className={`tnum ${className}`}>
      {display}
    </span>
  );
}

/** Marquee strip of monospace feature tokens. */
export function TokenMarquee({ tokens, className = "" }) {
  const doubled = [...tokens, ...tokens];
  return (
    <div className={`mask-fade-x overflow-hidden ${className}`}>
      <div className="flex w-max animate-marquee items-center gap-10 pr-10">
        {doubled.map((token, index) => (
          <span
            key={`${token}-${index}`}
            className="flex items-center gap-10 font-mono text-[11px] tracking-[0.3em] text-zinc-500 uppercase"
          >
            {token}
            <span className="h-1 w-1 rounded-full bg-cyan-400/60" />
          </span>
        ))}
      </div>
    </div>
  );
}

/** Blinking instrument dot. */
export function PulseDot({ tone = "#22d3ee" }) {
  return (
    <span className="relative flex h-2 w-2">
      <span
        className="absolute inline-flex h-full w-full animate-ring rounded-full"
        style={{ background: tone }}
      />
      <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: tone }} />
    </span>
  );
}

/** Section heading block: mono badge + display title + optional lede. */
export function SectionHeading({ index, badge, title, lede, align = "left" }) {
  return (
    <Reveal
      className={`flex flex-col gap-5 ${align === "center" ? "items-center text-center" : "items-start"}`}
    >
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs tracking-widest text-zinc-600">{index}</span>
        <Badge>{badge}</Badge>
      </div>
      <h2 className="max-w-3xl font-display text-[clamp(1.9rem,4.4vw,3.4rem)] leading-[1.02] font-semibold tracking-[-0.03em] text-balance">
        {title}
      </h2>
      {lede ? <p className="max-w-2xl text-base leading-relaxed text-zinc-400">{lede}</p> : null}
    </Reveal>
  );
}
