import { motion } from "framer-motion";
import { RefreshCcw } from "lucide-react";
import { PIPELINE } from "./siteData";
import { EASE } from "./motion";
import { Badge, Reveal, SectionHeading } from "./primitives";

/** Architecture flow: seven stages on a single rail, closed by a feedback loop. */
export default function Pipeline() {
  return (
    <section id="pipeline" className="relative py-20 md:py-28">
      <div className="mx-auto w-full max-w-[1400px] px-6 lg:px-10">
        <SectionHeading
          index="02"
          badge="Architecture"
          title={
            <>
              Seven stages on one rail,
              <br className="hidden md:block" /> and a loop that closes.
            </>
          }
          lede="Real data in, validated features, a tracked model, a live API, and monitoring that is allowed to disagree with the model."
        />

        <div className="relative mt-14">
          {/* animated rail */}
          <div className="absolute top-4 right-0 left-0 hidden h-px bg-white/8 lg:block">
            <motion.div
              className="h-full origin-left bg-gradient-to-r from-cyan-400/90 via-cyan-400/40 to-indigo-400/70"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, margin: "-100px 0px" }}
              transition={{ duration: 1.8, ease: EASE }}
            />
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-7 lg:gap-4">
            {PIPELINE.map((node, index) => (
              <Reveal key={node.id} delay={index * 0.07} className="relative">
                <div className="flex gap-4 lg:flex-col lg:gap-0">
                  <span className="relative z-10 mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/15 bg-zinc-950 font-mono text-[10px] tracking-wider text-cyan-300 lg:mb-6">
                    {node.id}
                  </span>
                  <div className="flex flex-col gap-2">
                    <h3 className="font-display text-lg font-semibold tracking-[-0.01em] text-zinc-100">
                      {node.title}
                    </h3>
                    <span className="font-mono text-[10px] tracking-[0.18em] text-cyan-400/80 uppercase">
                      {node.kicker}
                    </span>
                    <p className="max-w-xs text-xs leading-relaxed text-zinc-500">{node.detail}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal className="mt-12">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-dashed border-white/12 bg-white/[0.02] px-5 py-4">
            <span className="flex items-center gap-3 font-mono text-[11px] tracking-[0.18em] text-zinc-400 uppercase">
              <RefreshCcw size={14} className="text-cyan-400/80" />
              feedback loop · drift detected or 2 of 4 weeks flagged → retrain policy
            </span>
            <Badge tone="warn">dry-run by default</Badge>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
