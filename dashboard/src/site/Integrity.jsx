import { motion } from "framer-motion";
import { AlertTriangle, GitBranch } from "lucide-react";
import { INTEGRITY, LIMITATIONS, LINKS, MARQUEE_TOKENS, STACK } from "./siteData";
import { Badge, Reveal, SectionHeading, TokenMarquee } from "./primitives";

/** Engineering log: numbered asymmetric rows — index on one side, substance on the other. */
export default function Integrity() {
  return (
    <section id="integrity" className="relative py-20 md:py-28">
      <div className="mx-auto w-full max-w-[1400px] px-6 lg:px-10">
        <SectionHeading
          index="03"
          badge="Integrity log"
          title={
            <>
              The bugs are the
              <br className="hidden md:block" /> interesting part.
            </>
          }
          lede="Five things went wrong on this project. Each is documented, fixed, and pinned by a test so it cannot come back quietly."
        />

        <div className="mt-14 flex flex-col">
          {INTEGRITY.map((entry, index) => (
            <Reveal key={entry.id} delay={index * 0.05}>
              <motion.article
                whileHover={{ x: 6 }}
                transition={{ type: "spring", stiffness: 300, damping: 26 }}
                className="group grid grid-cols-1 gap-4 border-t border-white/8 py-8 md:grid-cols-12 md:gap-8"
              >
                <div className="col-span-12 flex items-start gap-4 md:col-span-3">
                  <span className="font-mono text-xs tracking-widest text-zinc-600">{entry.id}</span>
                  <div className="flex flex-col gap-2">
                    <span className="font-mono text-[10px] tracking-[0.2em] text-cyan-400/80 uppercase">
                      {entry.tag}
                    </span>
                    <span className="font-mono text-[10px] tracking-[0.16em] text-zinc-600 uppercase">
                      {entry.status}
                    </span>
                  </div>
                </div>

                <div className="col-span-12 flex flex-col gap-3 md:col-span-6">
                  <h3 className="font-display text-xl leading-snug font-semibold tracking-[-0.01em] text-zinc-100 transition-colors group-hover:text-white">
                    {entry.title}
                  </h3>
                  <p className="max-w-2xl text-sm leading-relaxed text-zinc-400">{entry.body}</p>
                </div>

                <div className="col-span-12 md:col-span-3">
                  <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                    <span className="font-mono text-[10px] tracking-[0.2em] text-zinc-600 uppercase">
                      outcome
                    </span>
                    <p className="mt-2 text-xs leading-relaxed text-zinc-300">{entry.outcome}</p>
                  </div>
                </div>
              </motion.article>
            </Reveal>
          ))}
          <div className="border-t border-white/8" />
        </div>
      </div>
    </section>
  );
}

/** Honest limits on the left, the stack on the right — a 5 / 7 asymmetric split. */
export function LimitsAndStack() {
  return (
    <section id="stack" className="relative py-20 md:py-24">
      <div className="mx-auto w-full max-w-[1400px] px-6 lg:px-10">
        <div className="grid grid-cols-12 gap-6 md:gap-8">
          <Reveal className="col-span-12 md:col-span-5">
            <div className="flex h-full flex-col gap-6 rounded-2xl border border-amber-400/15 bg-zinc-900/40 p-7 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <AlertTriangle size={15} className="text-amber-300" />
                <span className="font-mono text-[10px] tracking-[0.22em] text-amber-200/80 uppercase">
                  Known limitations
                </span>
              </div>
              <h3 className="font-display text-2xl font-semibold tracking-[-0.02em] text-zinc-100">
                What this model still cannot do
              </h3>
              <div className="flex flex-col divide-y divide-white/5">
                {LIMITATIONS.map((item) => (
                  <div key={item.title} className="flex flex-col gap-1.5 py-4 first:pt-0 last:pb-0">
                    <span className="font-mono text-[11px] tracking-[0.14em] text-zinc-200 uppercase">
                      {item.title}
                    </span>
                    <span className="text-xs leading-relaxed text-zinc-500">{item.body}</span>
                  </div>
                ))}
              </div>
              <p className="mt-auto font-mono text-[10px] tracking-[0.18em] text-zinc-600 uppercase">
                stated up front, on purpose
              </p>
            </div>
          </Reveal>

          <Reveal className="col-span-12 md:col-span-7" delay={0.08}>
            <div className="flex h-full flex-col gap-7 rounded-2xl border border-white/10 bg-zinc-900/40 p-7 backdrop-blur-md">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="font-mono text-[10px] tracking-[0.22em] text-zinc-400 uppercase">
                  Stack · five layers
                </span>
                <Badge tone="accent">MIT licensed</Badge>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {STACK.map((group, index) => (
                  <motion.div
                    key={group.group}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px 0px" }}
                    transition={{ duration: 0.6, delay: index * 0.07 }}
                    className="flex flex-col gap-3"
                  >
                    <span className="font-mono text-[10px] tracking-[0.24em] text-cyan-400/80 uppercase">
                      {group.group}
                    </span>
                    <ul className="flex flex-col gap-1.5">
                      {group.items.map((item) => (
                        <li key={item} className="text-xs text-zinc-400">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </div>

              <div className="hairline" />

              <div className="flex flex-col gap-3">
                <span className="font-mono text-[10px] tracking-[0.22em] text-zinc-500 uppercase">
                  feature vocabulary
                </span>
                <TokenMarquee tokens={MARQUEE_TOKENS} />
              </div>

              <a
                href={LINKS.repo}
                target="_blank"
                rel="noreferrer"
                className="group mt-auto flex items-center justify-between gap-4 rounded-xl border border-white/8 bg-black/25 px-4 py-3 transition-colors hover:border-white/20"
              >
                <span className="flex items-center gap-3 font-mono text-[11px] tracking-[0.16em] text-zinc-300 uppercase">
                  <GitBranch size={14} className="text-cyan-400/80" />
                  atharva-pawar80 / GridSense-AI
                </span>
                <span className="font-mono text-[10px] text-zinc-600 transition-colors group-hover:text-zinc-300">
                  read the source →
                </span>
              </a>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
