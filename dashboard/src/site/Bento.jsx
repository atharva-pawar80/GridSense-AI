import { motion } from "framer-motion";
import {
  Activity,
  Boxes,
  GitBranch,
  Layers,
  Radar,
  ShieldCheck,
  Sparkles,
  Terminal,
  TrendingDown,
} from "lucide-react";
import { FEATURE_IMPORTANCE, RESULT } from "./siteData";
import { EASE } from "./motion";
import { Badge, CountUp, GlassCard, KeyValue, Reveal, SectionHeading } from "./primitives";

function CardHead({ icon: Icon, label, meta }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="flex items-center gap-2 font-mono text-[10px] tracking-[0.22em] text-zinc-400 uppercase">
        {Icon ? <Icon size={13} className="text-cyan-400/80" /> : null}
        {label}
      </span>
      {meta ? (
        <span className="text-right font-mono text-[10px] tracking-[0.18em] text-zinc-600 uppercase">
          {meta}
        </span>
      ) : null}
    </div>
  );
}

function MeterBar({ label, value, max, tone, delay = 0, suffix = "", note }) {
  const pct = Math.max(3, Math.min(100, (value / max) * 100));
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-4">
        <span className="font-mono text-[11px] tracking-wider text-zinc-400 uppercase">{label}</span>
        <span className="tnum font-mono text-xs text-zinc-200">
          {value.toLocaleString()}
          {suffix}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
        <motion.div
          className="h-full rounded-full"
          style={{ background: tone, boxShadow: `0 0 18px -4px ${tone}` }}
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true, margin: "-60px 0px" }}
          transition={{ duration: 1.25, ease: EASE, delay }}
        />
      </div>
      {note ? <span className="font-mono text-[10px] text-zinc-600">{note}</span> : null}
    </div>
  );
}

/** col-span-8 — the headline benchmark. */
function BenchmarkCard() {
  return (
    <GlassCard className="h-full p-6 md:p-8">
      <div className="flex flex-col gap-7">
        <CardHead icon={TrendingDown} label="Benchmark · held-out test set" meta="4,295 hours" />

        <div className="flex flex-wrap items-end gap-6">
          <div>
            <div className="flex items-baseline gap-2">
              <CountUp
                value={RESULT.improvement}
                decimals={1}
                className="font-display text-[clamp(3rem,7vw,5rem)] leading-none font-semibold tracking-[-0.05em] text-cyan-300"
              />
              <span className="font-display text-3xl font-semibold text-cyan-300/70">%</span>
            </div>
            <div className="mt-2 font-mono text-[10px] tracking-[0.22em] text-zinc-500 uppercase">
              mean absolute error reduction
            </div>
          </div>
          <div className="flex flex-col gap-1 border-l border-white/10 pl-6">
            <span className="font-mono text-[10px] tracking-[0.22em] text-zinc-500 uppercase">
              dispatch error avoided
            </span>
            <span className="tnum font-mono text-lg text-zinc-100">
              {RESULT.savedPerHour} MW / hour
            </span>
            <span className="font-mono text-[10px] text-zinc-600">
              measured, not modelled
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <MeterBar
            label="Naive baseline · same hour, last week"
            value={RESULT.naiveMae}
            max={RESULT.naiveMae}
            tone="#52525b"
            delay={0.05}
            suffix=" MW"
          />
          <MeterBar
            label="GridSense AI · xgboost"
            value={RESULT.modelMae}
            max={RESULT.naiveMae}
            tone="#22d3ee"
            delay={0.2}
            suffix=" MW"
          />
        </div>

        <div className="hairline" />

        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-md text-xs leading-relaxed text-zinc-500">
            Evaluated strictly on six months of held-out data the model never saw. The correction from
            an inflated 40.3% to an honest 38.0% is part of the story — see integrity log 01.
          </p>
          <Badge tone="accent">no leakage · skew-checked</Badge>
        </div>
      </div>
    </GlassCard>
  );
}

/** col-span-4 — model spec sheet. */
function ModelCard() {
  return (
    <GlassCard className="h-full p-6 md:p-7" spot="rgba(99,102,241,0.12)">
      <div className="flex flex-col gap-6">
        <CardHead icon={Boxes} label="Model card" meta="v1" />
        <div className="flex flex-col">
          <KeyValue k="algorithm" v="XGBoost · gradient boosted trees" accent />
          <KeyValue k="task" v="hourly regression" />
          <KeyValue k="target" v="system load (MW)" />
          <KeyValue k="horizon" v="24 hours ahead" />
          <KeyValue k="tracking" v="MLflow runs + artefacts" />
          <KeyValue k="naive guard" v="lag_168h baseline" />
        </div>
        <p className="text-xs leading-relaxed text-zinc-500">
          A deliberately simple, interpretable model. The interesting engineering is around it:
          leakage-free features, live feature parity, and monitoring that can be trusted.
        </p>
      </div>
    </GlassCard>
  );
}


/** col-span-4 — what the model actually listens to. */
function FeatureCard() {
  return (
    <GlassCard className="h-full p-6 md:p-7">
      <div className="flex flex-col gap-6">
        <CardHead icon={Layers} label="Signal · feature importance" meta="% gain" />
        <div className="flex flex-col gap-4">
          {FEATURE_IMPORTANCE.map((feature, index) => (
            <MeterBar
              key={feature.name}
              label={feature.name}
              value={feature.value}
              max={60}
              tone={feature.tone}
              delay={0.05 + index * 0.07}
              suffix="%"
              note={feature.human}
            />
          ))}
        </div>
        <p className="text-xs leading-relaxed text-zinc-500">
          Yesterday's same hour carries most of the signal. Weather would be next — and it is not in the
          model yet.
        </p>
      </div>
    </GlassCard>
  );
}

/** col-span-4 — season-controlled drift surveillance. */
function DriftCard() {
  const rows = [
    {
      label: "naive 30-day vs multi-year",
      value: "2.53",
      verdict: "false alarm",
      tone: "#ef4444",
      width: 96,
    },
    {
      label: "season-matched year over year",
      value: "stable",
      verdict: "trustworthy",
      tone: "#22d3ee",
      width: 18,
    },
  ];

  return (
    <GlassCard className="h-full p-6 md:p-7" spot="rgba(16,185,129,0.12)">
      <div className="flex flex-col gap-6">
        <CardHead icon={Radar} label="Drift · PSI surveillance" meta="season-controlled" />

        <div className="flex flex-col gap-5">
          {rows.map((row, index) => (
            <div key={row.label} className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-mono text-[10px] tracking-[0.16em] text-zinc-500 uppercase">
                  {row.label}
                </span>
                <span className="font-mono text-xs" style={{ color: row.tone }}>
                  PSI {row.value}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: row.tone, boxShadow: `0 0 18px -4px ${row.tone}` }}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${row.width}%` }}
                  viewport={{ once: true, margin: "-60px 0px" }}
                  transition={{ duration: 1.3, ease: EASE, delay: 0.1 + index * 0.15 }}
                />
              </div>
              <span className="font-mono text-[10px] text-zinc-600">{row.verdict}</span>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-white/10 bg-black/25 p-4">
          <p className="text-xs leading-relaxed text-zinc-400">
            Comparing a recent month against a multi-year training distribution conflates ordinary
            seasonality with real decay. GridSense compares{" "}
            <span className="text-zinc-200">like-for-like calendar windows</span>, then validates the
            check against a random self-split so it cannot cry wolf.
          </p>
        </div>
      </div>
    </GlassCard>
  );
}

/** col-span-4 — weekly accuracy tracking. */
function AccuracyCard() {
  const weeks = Array.from({ length: RESULT.weeksTracked }, (_, index) => index);
  const flagged = new Set([3, 7, 8, 19, 24]);

  return (
    <GlassCard className="h-full p-6 md:p-7" spot="rgba(245,158,11,0.12)">
      <div className="flex flex-col gap-6">
        <CardHead icon={Activity} label="Weekly accuracy" meta="last 6 months" />

        <div className="flex items-end gap-4">
          <div>
            <div className="flex items-baseline gap-1.5">
              <CountUp
                value={RESULT.weeksFlagged}
                className="font-display text-4xl leading-none font-semibold tracking-[-0.03em] text-amber-300"
              />
              <span className="font-mono text-xs text-zinc-500">/ {RESULT.weeksTracked} weeks</span>
            </div>
            <div className="mt-2 font-mono text-[10px] tracking-[0.2em] text-zinc-500 uppercase">
              flagged above threshold
            </div>
          </div>
        </div>

        <div className="flex items-end gap-1">
          {weeks.map((week) => (
            <motion.span
              key={week}
              initial={{ scaleY: 0.2, opacity: 0 }}
              whileInView={{ scaleY: 1, opacity: 1 }}
              viewport={{ once: true, margin: "-40px 0px" }}
              transition={{ duration: 0.5, ease: EASE, delay: week * 0.018 }}
              className="h-9 flex-1 origin-bottom rounded-sm"
              style={{
                background: flagged.has(week) ? "#f59e0b" : "rgba(255,255,255,0.09)",
                boxShadow: flagged.has(week) ? "0 0 14px -2px rgba(245,158,11,0.7)" : "none",
              }}
            />
          ))}
        </div>

        <p className="text-xs leading-relaxed text-zinc-500">
          Flags cluster around winter cold snaps and spring/summer transitions — exactly where a model
          without live weather input should struggle. The monitoring surfaced the limitation instead of
          hiding it.
        </p>
      </div>
    </GlassCard>
  );
}

/** col-span-5 — the serving contract. */
function ServingCard() {
  return (
    <GlassCard className="h-full p-6 md:p-7">
      <div className="flex flex-col gap-6">
        <CardHead icon={Terminal} label="Serving contract" meta="FastAPI" />

        <div className="overflow-hidden rounded-xl border border-white/10 bg-black/45">
          <div className="flex items-center gap-2 border-b border-white/5 px-4 py-2.5">
            <span className="h-2 w-2 rounded-full bg-red-400/50" />
            <span className="h-2 w-2 rounded-full bg-amber-400/50" />
            <span className="h-2 w-2 rounded-full bg-emerald-400/50" />
            <span className="ml-2 font-mono text-[10px] tracking-[0.18em] text-zinc-500 uppercase">
              live feature builder
            </span>
          </div>
          <pre className="overflow-x-auto px-4 py-4 font-mono text-[11px] leading-relaxed text-zinc-400">
            <code>
              <span className="text-zinc-600">POST</span>{" "}
              <span className="text-cyan-300">/forecast</span>
              {"\n{"}
              {"\n  "}
              <span className="text-zinc-500">"timestamp"</span>
              <span className="text-zinc-600">:</span>{" "}
              <span className="text-emerald-300">"2018-06-15T18:00:00Z"</span>
              {"\n}\n\n"}
              <span className="text-zinc-600">// features rebuilt live from raw history,</span>
              {"\n"}
              <span className="text-zinc-600">// never read from a pre-baked file</span>
              {"\n{"}
              {"\n  "}
              <span className="text-zinc-500">"predicted_load_mw"</span>
              <span className="text-zinc-600">:</span> <span className="text-cyan-300">26840</span>
              {",\n  "}
              <span className="text-zinc-500">"model_version"</span>
              <span className="text-zinc-600">:</span>{" "}
              <span className="text-emerald-300">"v1"</span>
              {"\n}"}
            </code>
          </pre>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-mono text-[10px] tracking-[0.18em] text-zinc-500 uppercase">
            train / serve parity
          </span>
          <Badge tone="accent">
            within {RESULT.skewPct}% over {RESULT.testHours.toLocaleString()} h
          </Badge>
        </div>
      </div>
    </GlassCard>
  );
}



/** col-span-7 — CI/CD that has been tested against bad code. */
function CiCard() {
  const checks = [
    { name: "pytest · pipeline suite", note: "DST rules, leakage guards, feature contracts" },
    { name: "pytest · feature parity", note: "live builder reproduces training MAE" },
    { name: "oxlint · react rules", note: "hooks and export discipline" },
    { name: "build · artefact load", note: "serialised model loads and predicts" },
  ];

  return (
    <GlassCard className="h-full p-6 md:p-7" spot="rgba(34,211,238,0.12)">
      <div className="flex flex-col gap-6">
        <CardHead icon={GitBranch} label="CI/CD · verified, not just configured" meta="GitHub Actions" />

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {checks.map((check, index) => (
            <motion.div
              key={check.name}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px 0px" }}
              transition={{ duration: 0.6, ease: EASE, delay: index * 0.08 }}
              className="flex items-start gap-3 rounded-xl border border-white/8 bg-black/20 px-4 py-3"
            >
              <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-emerald-400/15">
                <ShieldCheck size={11} className="text-emerald-300" />
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="font-mono text-[11px] text-zinc-200">{check.name}</span>
                <span className="text-[11px] leading-snug text-zinc-500">{check.note}</span>
              </span>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-wrap items-start gap-4 rounded-xl border border-amber-400/20 bg-amber-400/[0.04] p-4">
          <Sparkles size={15} className="mt-0.5 shrink-0 text-amber-300" />
          <p className="text-xs leading-relaxed text-amber-100/80">
            The leakage bug was deliberately reintroduced and pushed, to prove the pipeline really
            blocks bad code — then reverted with <span className="font-mono">git revert</span> so the
            commit history stays honest.
          </p>
        </div>
      </div>
    </GlassCard>
  );
}

/** Asymmetric bento grid: 12-column canvas with deliberately uneven card weights. */
export default function Bento() {
  return (
    <section id="results" className="relative py-20 md:py-28">
      <div className="mx-auto w-full max-w-[1400px] px-6 lg:px-10">
        <SectionHeading
          index="01"
          badge="Evidence"
          title={
            <>
              Every number comes from an
              <br className="hidden md:block" /> hour the model never saw.
            </>
          }
          lede="One benchmark, one feature ranking, one drift guard that admits when it was wrong. No cherry-picked windows."
        />

        <div className="mt-12 grid grid-cols-12 gap-4 md:gap-5">
          <Reveal className="col-span-12 md:col-span-8">
            <BenchmarkCard />
          </Reveal>
          <Reveal className="col-span-12 md:col-span-4" delay={0.06}>
            <ModelCard />
          </Reveal>
          <Reveal className="col-span-12 md:col-span-4">
            <FeatureCard />
          </Reveal>
          <Reveal className="col-span-12 md:col-span-4" delay={0.06}>
            <DriftCard />
          </Reveal>
          <Reveal className="col-span-12 md:col-span-4" delay={0.12}>
            <AccuracyCard />
          </Reveal>
          <Reveal className="col-span-12 md:col-span-5">
            <ServingCard />
          </Reveal>
          <Reveal className="col-span-12 md:col-span-7" delay={0.06}>
            <CiCard />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
