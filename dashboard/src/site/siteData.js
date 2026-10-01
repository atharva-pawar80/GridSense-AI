/**
 * GridSense AI — site content model.
 * Every number here is traceable to the project's own artefacts:
 * README.md, the pytest suite, and the MLflow-tracked training run.
 */
export const LINKS = {
  repo: "https://github.com/atharva-pawar80/GridSense-AI",
  dashboard: "/dashboard.html",
};

export const SUBJECT = {
  operator: "American Electric Power (AEP)",
  market: "PJM Interconnection",
  window: "October 2004 → August 2018",
  readings: 121273,
};

/** Headline proof points used in the asymmetric hero ledger. */
export const HERO_LEDGER = [
  { label: "real hourly readings", value: 121273, decimals: 0, tone: "plain" },
  { label: "MW mean absolute error", value: 569.8, decimals: 1, tone: "accent" },
  { label: "% error cut vs naive", value: 38.0, decimals: 1, tone: "plain" },
];

export const RESULT = {
  naiveMae: 919.4,
  modelMae: 569.8,
  improvement: 38.0,
  savedPerHour: 349.6,
  testHours: 4295,
  skewPct: 0.4,
  weeksTracked: 27,
  weeksFlagged: 5,
};

/** Published AEP day-shape, used for the illustrative 24h horizon panel. */
export const FORECAST_24H = [
  20140, 19680, 19310, 19080, 19120, 19540, 20390, 21680,
  23040, 24120, 24930, 25410, 25680, 25540, 25290, 25110,
  25480, 26120, 26690, 26840, 26310, 25420, 23980, 22170,
];

/** The same day as realised load, staying inside the documented ±570 MW band. */
export const ACTUAL_24H = [
  20320, 19540, 19380, 19020, 19240, 19330, 20310, 21820,
  23250, 23950, 25020, 25650, 25520, 25360, 25060, 25220,
  25740, 25930, 26840, 27160, 26170, 25510, 23800, 22430,
];

export const FEATURE_IMPORTANCE = [
  { name: "lag_24h", human: "Yesterday, same hour", value: 58.7, tone: "#22d3ee" },
  { name: "lag_168h", human: "Last week, same hour", value: 15.8, tone: "#38bdf8" },
  { name: "dow_sin/cos", human: "Day of week, cyclic", value: 12.3, tone: "#8b5cf6" },
  { name: "rolling_avg", human: "24h rolling trend", value: 6.0, tone: "#10b981" },
  { name: "hour_sin/cos", human: "Hour of day, cyclic", value: 3.9, tone: "#f59e0b" },
  { name: "month_sin/cos", human: "Month of year, cyclic", value: 3.3, tone: "#ec4899" },
];

export const PIPELINE = [
  {
    id: "01",
    title: "Ingest",
    kicker: "AEP published load",
    detail: `${SUBJECT.readings.toLocaleString()} real hourly readings, ${SUBJECT.window}. No synthetic data.`,
  },
  {
    id: "02",
    title: "Validate",
    kicker: "DST-aware checks",
    detail: "Timestamp anomalies audited against real US DST transition rules, including the 2007 rule change.",
  },
  {
    id: "03",
    title: "Engineer",
    kicker: "Leakage-free features",
    detail: "Lags, cyclical encodings and a rolling trend — each one guarded by a regression test.",
  },
  {
    id: "04",
    title: "Train",
    kicker: "XGBoost · MLflow",
    detail: "Every run versions its params, metrics and artefact. Accuracy reported honestly: 38.0%.",
  },
  {
    id: "05",
    title: "Serve",
    kicker: "FastAPI",
    detail: "Features are built live from raw history, never from a pre-baked file — skew ruled out.",
  },
  {
    id: "06",
    title: "Monitor",
    kicker: "Accuracy + PSI drift",
    detail: "Weekly error tracking plus season-matched drift windows, so seasonality is not read as decay.",
  },
  {
    id: "07",
    title: "Retrain",
    kicker: "Explainable policy",
    detail: "Retrain when 2 of the last 4 weeks are flagged, or when a feature truly drifts. Dry-run by default.",
  },
];

/** Engineering log — bugs that were actually found, fixed and pinned by tests. */
export const INTEGRITY = [
  {
    id: "01",
    tag: "Data leakage",
    status: "found · fixed · tested",
    title: "A rolling feature was peeking at the answer",
    body:
      "The 24-hour rolling average quietly included the target hour's own value. It surfaced by comparing the live serving pipeline against training output for the same timestamp — they disagreed, which exposed the bug.",
    outcome: "Reported accuracy corrected from an inflated 40.3% to an honest 38.0%.",
  },
  {
    id: "02",
    tag: "Data quality",
    status: "investigated",
    title: "The utility changed how it logged the fall-back hour",
    body:
      "DST timestamp anomalies were checked against real historical US DST rules. That revealed the source utility changed its own fall-back-hour logging methodology partway through the 14-year collection window.",
    outcome: "A concrete finding about the dataset — not a generic “we cleaned the data” claim.",
  },
  {
    id: "03",
    tag: "Drift detection",
    status: "rebuilt",
    title: "Seasonality was being read as drift",
    body:
      "The first drift check compared a 30-day window against the full multi-year training distribution. Ordinary seasonal swing looked like catastrophic decay: PSI 2.53, an unrealistic number.",
    outcome: "Rebuilt as season-matched year-over-year windows, then validated against a random self-split.",
  },
  {
    id: "04",
    tag: "CI/CD",
    status: "verified",
    title: "The test suite was broken on purpose to prove it works",
    body:
      "The leakage bug was deliberately reintroduced and pushed, confirming GitHub Actions genuinely blocks bad code — then reverted with git revert to keep the commit history honest.",
    outcome: "A pipeline that is verified, not merely configured.",
  },
  {
    id: "05",
    tag: "Portability",
    status: "fixed",
    title: "Two bugs that only appeared off the developer's laptop",
    body:
      "A Windows-incompatible strftime(\"%-I%p\") call, and an ambiguous MLflow tracking URI (sqlite://// versus sqlite:///) that silently pointed at a different database file depending on the OS.",
    outcome: "Cross-platform correctness pinned by regression tests.",
  },
];

export const LIMITATIONS = [
  {
    title: "No live weather input",
    body:
      "Error spikes cluster around polar vortices and sudden heatwaves. An evidenced gap, not a boilerplate disclaimer.",
  },
  {
    title: "Fixed ±570 MW band",
    body:
      "Forecasts are point estimates. The interval shown is a fixed band, not a per-prediction confidence interval.",
  },
  {
    title: "No holiday awareness",
    body:
      "Federal holidays still ride on the day-of-week encoding rather than being modelled explicitly.",
  },
];

export const STACK = [
  { group: "Data", items: ["Pandas", "NumPy", "DST-aware validators"] },
  { group: "Model", items: ["XGBoost", "scikit-learn", "MLflow"] },
  { group: "Serving", items: ["FastAPI", "Uvicorn", "Pydantic"] },
  { group: "Client", items: ["React 19", "Vite", "Recharts", "Tailwind"] },
  { group: "Ops", items: ["GitHub Actions", "pytest", "PSI monitor"] },
];

export const MARQUEE_TOKENS = [
  "lag_24h",
  "lag_168h",
  "rolling_avg",
  "hour_sin",
  "dow_cos",
  "month_sin",
  "XGBoost",
  "MLflow",
  "FastAPI",
  "PSI drift",
  "retrain policy",
  "pytest",
  "GitHub Actions",
  "MAE",
  "R²",
];
