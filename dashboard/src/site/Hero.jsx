import { motion } from "framer-motion";
import { ArrowUpRight, CircuitBoard } from "lucide-react";
import { ACTUAL_24H, FORECAST_24H, LINKS, RESULT, SUBJECT } from "./siteData";
import { EASE, riseChild, staggerParent } from "./motion";
import { Badge, CountUp, MagneticButton, PulseDot } from "./primitives";

const VIEW_W = 560;
const VIEW_H = 210;
const MIN = 18400;
const MAX = 27600;
const BAND = 570;

function scaleX(index, length) {
  return (index / (length - 1)) * VIEW_W;
}

function scaleY(value) {
  const clamped = Math.min(Math.max(value, MIN), MAX);
  return VIEW_H - ((clamped - MIN) / (MAX - MIN)) * VIEW_H;
}

function linePath(values) {
  return values
    .map(
      (value, index) =>
        `${index === 0 ? "M" : "L"}${scaleX(index, values.length).toFixed(1)},${scaleY(value).toFixed(1)}`
    )
    .join(" ");
}

function areaPath(values) {
  return `${linePath(values)} L${VIEW_W},${VIEW_H} L0,${VIEW_H} Z`;
}

function bandPath(values) {
  const upper = values.map(
    (value, index) => `${scaleX(index, values.length).toFixed(1)},${scaleY(value + BAND).toFixed(1)}`
  );
  const lower = values
    .map((value, index) => `${scaleX(index, values.length).toFixed(1)},${scaleY(value - BAND).toFixed(1)}`)
    .reverse();
  return `M${upper.join(" L")} L${lower.join(" L")} Z`;
}

/** Illustrative 24h horizon panel: forecast area, realised trace, ±570 MW band. */
function HorizonPanel() {
  const forecastPath = linePath(FORECAST_24H);
  const actualPath = linePath(ACTUAL_24H);
  const peakIndex = FORECAST_24H.indexOf(Math.max(...FORECAST_24H));
  const peakHour = `${String(peakIndex).padStart(2, "0")}:00`;
  const peakValue = Math.max(...FORECAST_24H);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/40 backdrop-blur-md">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(420px circle at 78% 0%, rgba(34,211,238,0.14), transparent 62%), radial-gradient(320px circle at 6% 100%, rgba(99,102,241,0.12), transparent 66%)",
        }}
      />
      <div className="relative flex items-center justify-between border-b border-white/5 px-5 py-3.5">
        <span className="flex items-center gap-2.5 font-mono text-[10px] tracking-[0.22em] text-zinc-400 uppercase">
          <PulseDot />
          day-ahead horizon · 24h
        </span>
        <span className="font-mono text-[10px] tracking-[0.18em] text-zinc-500 uppercase">
          sample day
        </span>
      </div>

      <div className="relative px-5 pt-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="flex items-baseline gap-2">
              <CountUp
                value={peakValue}
                className="font-display text-4xl leading-none font-semibold tracking-[-0.03em] text-zinc-50"
              />
              <span className="font-mono text-[11px] tracking-widest text-zinc-500 uppercase">
                MW peak
              </span>
            </div>
            <div className="mt-2 font-mono text-[11px] text-zinc-500">
              ±{BAND} MW band · peak at {peakHour}
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[10px] tracking-[0.22em] text-zinc-500 uppercase">model</div>
            <div className="font-mono text-xs text-cyan-300">XGBoost v1</div>
          </div>
        </div>

        <div className="relative mt-5">
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent"
            initial={{ x: -90 }}
            animate={{ x: VIEW_W }}
            transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
          />
          <svg
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            preserveAspectRatio="none"
            className="h-[186px] w-full"
          >
            <defs>
              <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.36" />
                <stop offset="70%" stopColor="#22d3ee" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
              <line
                key={fraction}
                x1="0"
                x2={VIEW_W}
                y1={VIEW_H * fraction}
                y2={VIEW_H * fraction}
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            ))}
            <motion.path
              d={bandPath(FORECAST_24H)}
              fill="rgba(34,211,238,0.06)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.4, delay: 0.9 }}
            />
            <motion.path
              d={areaPath(FORECAST_24H)}
              fill="url(#forecastFill)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, delay: 0.7 }}
            />
            <motion.path
              d={forecastPath}
              fill="none"
              stroke="#22d3ee"
              strokeWidth="1.8"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 2.2, ease: EASE, delay: 0.35 }}
            />
            <motion.path
              d={actualPath}
              fill="none"
              stroke="rgba(244,244,245,0.5)"
              strokeWidth="1.4"
              strokeDasharray="3 5"
              vectorEffect="non-scaling-stroke"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2.4, ease: EASE, delay: 0.8 }}
            />
            <motion.line
              x1={scaleX(peakIndex, FORECAST_24H.length)}
              x2={scaleX(peakIndex, FORECAST_24H.length)}
              y1="0"
              y2={VIEW_H}
              stroke="rgba(34,211,238,0.4)"
              strokeWidth="1"
              strokeDasharray="2 4"
              vectorEffect="non-scaling-stroke"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 2.2 }}
            />
          </svg>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-white/5 py-3 font-mono text-[10px] tracking-[0.18em] text-zinc-500 uppercase">
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-4 rounded-full bg-cyan-400" />
            forecast
          </span>
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-4 rounded-full bg-zinc-500" />
            realised
          </span>
          <span>00:00 → 23:00</span>
        </div>
      </div>

      <div className="relative flex items-center justify-between gap-4 border-t border-white/5 bg-black/20 px-5 py-3">
        <span className="font-mono text-[10px] tracking-[0.18em] text-zinc-500 uppercase">
          illustrative · published AEP shape
        </span>
        <a
          href={LINKS.dashboard}
          className="link-sweep font-mono text-[10px] tracking-[0.18em] text-cyan-300 uppercase"
        >
          run live forecast
        </a>
      </div>
    </div>
  );
}

/** Asymmetric hero: editorial column left, instrument panel right, offset down. */
export default function Hero() {
  return (
    <section id="overview" className="relative pt-28 pb-16 md:pt-36 lg:pt-40">
      <div className="mx-auto w-full max-w-[1400px] px-6 lg:px-10">
        {/* rotated editorial rail */}
        <div className="pointer-events-none absolute top-1/2 right-2 hidden -translate-y-1/2 xl:block">
          <span className="vertical-label font-mono text-[10px] tracking-[0.42em] text-zinc-700 uppercase">
            {SUBJECT.operator} · {SUBJECT.market}
          </span>
        </div>

        <div className="grid grid-cols-12 items-start gap-6 lg:gap-8">
          <motion.div
            variants={staggerParent(0.09, 0.15)}
            initial="hidden"
            animate="show"
            className="col-span-12 flex flex-col gap-7 lg:col-span-7 lg:pr-4"
          >
            <motion.div variants={riseChild} className="flex flex-wrap items-center gap-3">
              <Badge tone="accent">Day-ahead load forecasting</Badge>
              <Badge>{SUBJECT.market} · AEP</Badge>
            </motion.div>

            <motion.h1
              variants={riseChild}
              className="font-display text-[clamp(2.5rem,7vw,5.4rem)] leading-[0.95] font-semibold tracking-[-0.045em]"
            >
              <span className="text-metal">Hourly grid load,</span>
              <br />
              <span className="text-cyan-grad">forecast</span>{" "}
              <span className="text-metal">before</span>
              <br />
              <span className="text-metal">the sun comes up.</span>
            </motion.h1>

            <motion.p variants={riseChild} className="max-w-xl text-[15px] leading-relaxed text-zinc-400">
              GridSense AI forecasts hourly electricity load for{" "}
              <span className="text-zinc-200">American Electric Power</span> across the PJM
              Interconnection — trained on{" "}
              <span className="font-mono text-zinc-200">121,273</span> real published readings, served
              through FastAPI, and watched by drift surveillance that knows the difference between a
              season and a decay.
            </motion.p>

            <motion.div variants={riseChild} className="flex flex-wrap items-center gap-3">
              <MagneticButton href={LINKS.dashboard}>
                Launch the console
                <ArrowUpRight size={14} />
              </MagneticButton>
              <MagneticButton href="#pipeline" variant="ghost">
                See the pipeline
              </MagneticButton>
              <span className="flex items-center gap-2 pl-1 font-mono text-[10px] tracking-[0.2em] text-zinc-600 uppercase">
                <CircuitBoard size={13} />
                mit · python 3.12 · xgboost
              </span>
            </motion.div>

            {/* metric ledger */}
            <motion.div
              variants={riseChild}
              className="mt-2 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/5 sm:grid-cols-3"
            >
              {[
                { label: "real hourly readings", value: SUBJECT.readings, decimals: 0 },
                { label: "mw mean abs. error", value: RESULT.modelMae, decimals: 1 },
                { label: "held-out test hours", value: RESULT.testHours, decimals: 0 },
              ].map((item) => (
                <div key={item.label} className="bg-zinc-950/60 px-5 py-4 backdrop-blur-sm">
                  <CountUp
                    value={item.value}
                    decimals={item.decimals}
                    className="font-display text-2xl font-semibold tracking-[-0.02em] text-zinc-50"
                  />
                  <div className="mt-1 font-mono text-[10px] tracking-[0.2em] text-zinc-500 uppercase">
                    {item.label}
                  </div>
                </div>
              ))}
            </motion.div>

            <motion.div
              variants={riseChild}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-xs text-zinc-500"
            >
              <span className="text-zinc-600 line-through decoration-zinc-700">919.4 MW</span>
              <span className="text-zinc-600">→</span>
              <span className="text-cyan-300">569.8 MW</span>
              <span className="text-zinc-600">
                ({RESULT.improvement.toFixed(1)}% tighter than the utility naive baseline)
              </span>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40, filter: "blur(14px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1.1, ease: EASE, delay: 0.5 }}
            className="relative col-span-12 lg:col-span-5 lg:mt-20"
          >
            <HorizonPanel />

            {/* floating telemetry chip, deliberately breaking the grid line */}
            <motion.div
              initial={{ opacity: 0, x: -18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, ease: EASE, delay: 1.15 }}
              className="absolute -bottom-6 -left-2 hidden items-center gap-3 rounded-xl border border-white/10 bg-zinc-950/85 px-4 py-3 backdrop-blur-md sm:flex lg:-left-10"
            >
              <PulseDot tone="#34d399" />
              <div>
                <div className="font-mono text-[10px] tracking-[0.2em] text-zinc-500 uppercase">
                  train / serve agreement
                </div>
                <div className="font-mono text-xs text-emerald-300">
                  within {RESULT.skewPct}% · {RESULT.testHours.toLocaleString()} hours
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

