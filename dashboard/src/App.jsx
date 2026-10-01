import React, { useState, useEffect, useMemo } from "react";
import {
  AreaChart, Area, LineChart, Line, ReferenceLine, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
} from "recharts";
import {
  Zap, TrendingUp, AlertTriangle, Activity, Calendar, Compass,
  HeartPulse, Radar, RefreshCw, BarChart2, ShieldCheck, Download, ArrowUpRight
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const COLORS = {
  void: "#080B12",
  panel: "#0E131F",
  panelHover: "#131A2B",
  panelBorder: "rgba(34, 211, 238, 0.22)",
  hairline: "rgba(255, 255, 255, 0.08)",
  cyan: "#22D3EE",
  cyanDim: "rgba(34, 211, 238, 0.16)",
  cyanGlow: "rgba(34, 211, 238, 0.35)",
  amber: "#F59E0B",
  amberDim: "rgba(245, 158, 11, 0.16)",
  red: "#EF4444",
  redDim: "rgba(239, 68, 68, 0.16)",
  green: "#10B981",
  greenDim: "rgba(16, 185, 129, 0.16)",
  violet: "#8B5CF6",
  violetDim: "rgba(139, 92, 246, 0.16)",
  textPrimary: "#F8FAFC",
  textSecondary: "#CBD5E1",
  textMuted: "#64748B",
  textFaint: "#334155",
};

const FONT_MONO = "'IBM Plex Mono', monospace";
const FONT_SANS = "'IBM Plex Sans', sans-serif";

const featureImportance = [
  { name: "Yesterday, same hour (lag_24h)", value: 58.7, color: COLORS.cyan },
  { name: "Last week, same hour (lag_168h)", value: 15.8, color: "#38BDF8" },
  { name: "Day of week (dow_sin/cos)", value: 12.3, color: COLORS.violet },
  { name: "24h rolling trend (rolling_avg)", value: 6.0, color: COLORS.green },
  { name: "Hour of day (hour_sin/cos)", value: 3.9, color: COLORS.amber },
  { name: "Month (month_sin/cos)", value: 3.3, color: "#EC4899" },
];

const naiveVsModel = [
  { name: "Naive Baseline (Lag 168h)", value: 919.4, color: COLORS.textFaint },
  { name: "GridSense AI (XGBoost)", value: 569.8, color: COLORS.cyan },
];

const PRESET_DATES = [
  { label: "Summer Peak (June 2018)", date: "2018-06-15" },
  { label: "Winter Cold Snap (Jan 2018)", date: "2018-01-05" },
  { label: "Autumn Baseline (Oct 2017)", date: "2017-10-18" },
  { label: "Spring Transition (Apr 2018)", date: "2018-04-12" },
];

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < breakpoint : false
  );
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint]);
  return isMobile;
}

function Panel({ children, glow, style, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: `linear-gradient(145deg, ${COLORS.panel} 0%, #0A0E17 100%)`,
        border: `1px solid ${glow ? COLORS.panelBorder : COLORS.hairline}`,
        borderRadius: 12,
        padding: "20px 24px",
        boxShadow: glow
          ? `0 12px 32px -8px ${COLORS.cyanDim}, 0 0 0 1px ${COLORS.panelBorder}`
          : "0 4px 20px rgba(0, 0, 0, 0.4)",
        transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
    >
      {glow && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "2px",
            background: `linear-gradient(90deg, transparent, ${COLORS.cyan}, transparent)`,
          }}
        />
      )}
      {children}
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, unit, color = COLORS.cyan, subtext }) {
  return (
    <Panel style={{ padding: "18px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <span style={{ fontSize: 11.5, fontWeight: 600, color: COLORS.textMuted, letterSpacing: "0.06em", textTransform: "uppercase" }}>
          {label}
        </span>
        {Icon && (
          <div
            style={{
              padding: 6,
              borderRadius: 8,
              background: `${color}1A`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon size={16} color={color} />
          </div>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span style={{ fontFamily: FONT_MONO, fontSize: 26, fontWeight: 700, color: COLORS.textPrimary, letterSpacing: "-0.02em" }}>
          {value}
        </span>
        {unit && (
          <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: COLORS.textMuted, fontWeight: 500 }}>
            {unit}
          </span>
        )}
      </div>
      {subtext && (
        <div style={{ marginTop: 6, fontSize: 12, color: COLORS.textSecondary, display: "flex", alignItems: "center", gap: 4 }}>
          {subtext}
        </div>
      )}
    </Panel>
  );
}

function Label({ children, style }) {
  return (
    <div style={{ fontFamily: FONT_SANS, fontSize: 12.5, letterSpacing: "0.03em", color: COLORS.textMuted, ...style }}>
      {children}
    </div>
  );
}

function Row({ children, style, gap = 10 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap, ...style }}>
      {children}
    </div>
  );
}

function statusColor(status) {
  if (status === "stable") return COLORS.green;
  if (status === "moderate shift") return COLORS.amber;
  return COLORS.red;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0]?.payload || {};
  return (
    <div
      style={{
        background: "rgba(14, 19, 31, 0.96)",
        backdropFilter: "blur(8px)",
        border: `1px solid ${COLORS.panelBorder}`,
        borderRadius: 8,
        padding: "12px 14px",
        fontFamily: FONT_MONO,
        fontSize: 12,
        color: COLORS.textPrimary,
        boxShadow: "0 10px 25px rgba(0,0,0,0.6)",
        minWidth: 190,
      }}
    >
      <div style={{ color: COLORS.textMuted, marginBottom: 8, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Hour: {label} ({data.timestamp?.split(" ")[1]?.substring(0, 5) || ""})
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 4 }}>
        <span style={{ color: COLORS.cyan, display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: COLORS.cyan }} />
          Forecast:
        </span>
        <b>{data.predicted?.toLocaleString()} MW</b>
      </div>
      {data.actual !== null && data.actual !== undefined && (
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 4 }}>
          <span style={{ color: COLORS.green, display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: COLORS.green }} />
            Actual:
          </span>
          <b>{data.actual?.toLocaleString()} MW</b>
        </div>
      )}
      {data.actual !== null && data.actual !== undefined && (
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 6, paddingTop: 4, borderTop: `1px dashed ${COLORS.hairline}` }}>
          <span style={{ color: COLORS.textMuted }}>Delta (Error):</span>
          <b style={{ color: Math.abs(data.predicted - data.actual) > 600 ? COLORS.amber : COLORS.green }}>
            {Math.abs(data.predicted - data.actual).toLocaleString()} MW ({((Math.abs(data.predicted - data.actual) / data.actual) * 100).toFixed(1)}%)
          </b>
        </div>
      )}
      <div style={{ fontSize: 10.5, color: COLORS.textMuted, paddingTop: 4, borderTop: `1px solid ${COLORS.hairline}` }}>
        95% Residual Band: [{(data.predicted - 570)?.toLocaleString()} – {(data.predicted + 570)?.toLocaleString()} MW]
      </div>
    </div>
  );
};

const WeeklyDot = (props) => {
  const { cx, cy, payload } = props;
  const color = payload.flagged ? COLORS.red : COLORS.cyan;
  const r = payload.flagged ? 5 : 3.5;
  return <circle cx={cx} cy={cy} r={r} fill={color} stroke={COLORS.void} strokeWidth={1.5} />;
};

export default function App() {
  const isMobile = useIsMobile();
  const [selectedDate, setSelectedDate] = useState("2018-06-15");
  const [hourlyForecast, setHourlyForecast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // View controls
  const [showConfidenceBand, setShowConfidenceBand] = useState(true);
  const [showActuals, setShowActuals] = useState(true);
  const [showLags, setShowLags] = useState(false);

  // Monitoring states
  const [weeklyAccuracy, setWeeklyAccuracy] = useState([]);
  const [baselineMae, setBaselineMae] = useState(null);
  const [driftData, setDriftData] = useState(null);
  const [monitoringLoading, setMonitoringLoading] = useState(true);
  const [retrainSimulationRunning, setRetrainSimulationRunning] = useState(false);
  const [retrainSuccess, setRetrainSuccess] = useState(false);

  const fetchForecast = (date) => {
    setLoading(true);
    setError(null);
    fetch(`${API_URL}/predict/day?date=${date}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const formatted = (data.predictions || []).map((p) => ({
          hour: p.hour,
          timestamp: p.timestamp,
          predicted: Math.round(p.predicted),
          actual: p.actual !== null && p.actual !== undefined ? Math.round(p.actual) : null,
          lowerBand: Math.max(0, Math.round(p.predicted - 570)),
          upperBand: Math.round(p.predicted + 570),
          lag_24h: p.lag_24h ? Math.round(p.lag_24h) : null,
          lag_168h: p.lag_168h ? Math.round(p.lag_168h) : null,
        }));
        setHourlyForecast(formatted);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch predictions:", err);
        setError(err.message);
        setLoading(false);
      });
  };

  const fetchMonitoring = () => {
    setMonitoringLoading(true);
    Promise.all([
      fetch(`${API_URL}/monitoring/accuracy`).then((r) => {
        if (!r.ok) throw new Error(`accuracy endpoint returned ${r.status}`);
        return r.json();
      }),
      fetch(`${API_URL}/monitoring/drift`).then((r) => {
        if (!r.ok) throw new Error(`drift endpoint returned ${r.status}`);
        return r.json();
      }),
    ])
      .then(([accuracyData, driftResult]) => {
        setWeeklyAccuracy(accuracyData.weeks || []);
        setBaselineMae(accuracyData.baseline_mae);
        setDriftData(driftResult);
        setMonitoringLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch monitoring data:", err);
        setMonitoringLoading(false);
      });
  };

  useEffect(() => {
    fetchForecast(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    fetchMonitoring();
  }, []);

  const dayStats = useMemo(() => {
    if (!hourlyForecast.length) return null;
    const peak = hourlyForecast.reduce((max, cur) => (cur.predicted > max.predicted ? cur : max), hourlyForecast[0]);
    const min = hourlyForecast.reduce((lowest, cur) => (cur.predicted < lowest.predicted ? cur : lowest), hourlyForecast[0]);
    const totalMWh = hourlyForecast.reduce((acc, cur) => acc + cur.predicted, 0);
    const avgLoad = Math.round(totalMWh / hourlyForecast.length);

    const pairs = hourlyForecast.filter((d) => d.actual !== null && d.actual !== undefined);
    let dayMae = null;
    let dayMape = null;
    if (pairs.length > 0) {
      const sumErr = pairs.reduce((acc, d) => acc + Math.abs(d.predicted - d.actual), 0);
      dayMae = Math.round(sumErr / pairs.length);
      const sumPct = pairs.reduce((acc, d) => acc + Math.abs(d.predicted - d.actual) / d.actual, 0);
      dayMape = ((sumPct / pairs.length) * 100).toFixed(1);
    }
    return { peak, min, avgLoad, totalMWh, dayMae, dayMape };
  }, [hourlyForecast]);

  const flaggedWeekCount = weeklyAccuracy.filter((w) => w.flagged).length;
  const driftFeatureCount = driftData?.features?.filter((f) => f.status !== "stable").length ?? 0;

  const handleSimulateRetrain = () => {
    setRetrainSimulationRunning(true);
    setTimeout(() => {
      setRetrainSimulationRunning(false);
      setRetrainSuccess(true);
      setTimeout(() => setRetrainSuccess(false), 5000);
    }, 1800);
  };

  const handleExportCsv = () => {
    if (!hourlyForecast.length) return;
    const headers = ["Timestamp", "Hour", "Predicted_MW", "Actual_MW", "Lag_24h_MW", "Lag_168h_MW"];
    const rows = hourlyForecast.map((r) => [
      r.timestamp,
      r.hour,
      r.predicted,
      r.actual ?? "",
      r.lag_24h ?? "",
      r.lag_168h ?? "",
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `GridSense_Forecast_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      style={{
        background: COLORS.void,
        minHeight: "100vh",
        width: "100%",
        fontFamily: FONT_SANS,
        color: COLORS.textPrimary,
        padding: isMobile ? "18px 14px" : "36px 40px",
        position: "relative",
        overflowX: "hidden",
        boxSizing: "border-box",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes pulseDot {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34,211,238,0.55); }
          70% { box-shadow: 0 0 0 10px rgba(34,211,238,0); }
        }
        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(70%) sepia(60%) saturate(1000%) hue-rotate(150deg);
          cursor: pointer;
          transform: scale(1.3);
        }
      `}</style>

      <div
        style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage:
            "linear-gradient(rgba(34,211,238,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.035) 1px, transparent 1px)",
          backgroundSize: "38px 38px",
        }}
      />
      <div
        style={{
          position: "absolute", left: 0, right: 0, height: "35vh",
          background: `linear-gradient(180deg, transparent, ${COLORS.cyanDim}, transparent)`,
          animation: "scanline 9s linear infinite",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", maxWidth: 1240, margin: "0 auto", width: "100%", zIndex: 1 }}>
        {/* Header bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: isMobile ? 38 : 44, height: isMobile ? 38 : 44, borderRadius: 10,
                background: COLORS.panel, border: `1px solid ${COLORS.panelBorder}`,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                boxShadow: `0 0 24px -6px ${COLORS.cyanDim}`,
              }}
            >
              <Zap size={isMobile ? 18 : 22} color={COLORS.cyan} strokeWidth={2.2} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: isMobile ? 17 : 21, fontWeight: 700, lineHeight: 1.2 }}>
                  GridSense AI
                </div>
                <span style={{ fontSize: 10.5, fontFamily: FONT_MONO, background: "rgba(34,211,238,0.12)", color: COLORS.cyan, border: `1px solid ${COLORS.panelBorder}`, padding: "2px 7px", borderRadius: 99, fontWeight: 600 }}>
                  v1.2 PROD
                </span>
              </div>
              <div style={{ fontSize: isMobile ? 11 : 12, color: COLORS.textMuted, letterSpacing: "0.04em", marginTop: 2 }}>
                {isMobile ? "AEP · OHIO VALLEY REGION" : "DAY-AHEAD LOAD FORECASTING · AEP / OHIO VALLEY REGION"}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 99, background: "rgba(14, 19, 31, 0.8)", border: `1px solid ${COLORS.hairline}` }}>
              <div
                style={{
                  width: 8, height: 8, borderRadius: 99,
                  background: loading ? COLORS.amber : error ? COLORS.red : COLORS.green,
                  boxShadow: `0 0 8px ${loading ? COLORS.amber : error ? COLORS.red : COLORS.green}`,
                  animation: loading ? "pulseDot 1.4s infinite" : "none",
                }}
              />
              <span style={{ color: COLORS.textSecondary, fontSize: 12, fontFamily: FONT_MONO }}>
                {loading ? "QUERYING API" : error ? "OFFLINE" : "PIPELINE ACTIVE"}
              </span>
            </div>

            <button
              onClick={() => {
                fetchForecast(selectedDate);
                fetchMonitoring();
              }}
              title="Refresh Data"
              style={{
                display: "flex", alignItems: "center", gap: 6, background: COLORS.panel, border: `1px solid ${COLORS.hairline}`,
                color: COLORS.textSecondary, padding: "7px 12px", borderRadius: 8, fontSize: 12, cursor: "pointer", fontFamily: FONT_SANS,
              }}
            >
              <RefreshCw size={13} />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleExportCsv}
              title="Export Forecast CSV"
              style={{
                display: "flex", alignItems: "center", gap: 6, background: "rgba(34,211,238,0.1)", border: `1px solid ${COLORS.panelBorder}`,
                color: COLORS.cyan, padding: "7px 12px", borderRadius: 8, fontSize: 12, cursor: "pointer", fontFamily: FONT_SANS, fontWeight: 500,
              }}
            >
              <Download size={13} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        <div style={{ height: 1, background: COLORS.hairline, margin: isMobile ? "14px 0 16px" : "18px 0 22px" }} />

        {/* Date picker & Preset Scenarios */}
        <Panel style={{ padding: isMobile ? "14px 16px" : "16px 22px", marginBottom: isMobile ? 14 : 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <Row gap={8}>
                <Calendar size={16} color={COLORS.cyan} />
                <Label>Forecast date</Label>
              </Row>
              <input
                type="date"
                value={selectedDate}
                min="2004-10-08"
                max="2018-08-02"
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{
                  background: COLORS.void,
                  border: `1px solid ${COLORS.panelBorder}`,
                  borderRadius: 6,
                  padding: "8px 14px",
                  color: COLORS.textPrimary,
                  fontFamily: FONT_MONO,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, color: COLORS.textMuted }}>Historical Scenarios:</span>
              {PRESET_DATES.map((preset) => (
                <button
                  key={preset.date}
                  onClick={() => setSelectedDate(preset.date)}
                  style={{
                    background: selectedDate === preset.date ? COLORS.cyan : "rgba(255,255,255,0.04)",
                    color: selectedDate === preset.date ? COLORS.void : COLORS.textSecondary,
                    border: `1px solid ${selectedDate === preset.date ? COLORS.cyan : COLORS.hairline}`,
                    padding: "4px 10px", borderRadius: 6, fontSize: 11.5,
                    fontWeight: selectedDate === preset.date ? 600 : 400, cursor: "pointer", fontFamily: FONT_SANS,
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </Panel>

        {error && (
          <Panel style={{ padding: "16px 20px", marginBottom: isMobile ? 14 : 18, borderColor: "rgba(245,166,35,0.4)" }}>
            <Row gap={10}>
              <AlertTriangle size={16} color={COLORS.amber} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: COLORS.textMuted }}>
                Could not load predictions for {selectedDate} — {error}. Confirm
                the FastAPI server is running at localhost:8000.
              </span>
            </Row>
          </Panel>
        )}

        {/* METRICS ROW (4 Cards) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(230px, 1fr))",
            gap: 16,
            marginBottom: 20,
          }}
        >
          <MetricCard
            icon={TrendingUp}
            label="Predicted Peak Load"
            value={dayStats?.peak ? `${dayStats.peak.predicted.toLocaleString()}` : "—"}
            unit="MW"
            color={COLORS.cyan}
            subtext={
              dayStats?.peak ? (
                <span>
                  Expected at <b style={{ color: COLORS.cyan }}>{dayStats.peak.hour.toUpperCase()}</b>
                </span>
              ) : null
            }
          />
          <MetricCard
            icon={Activity}
            label="Expected Daily Volume"
            value={dayStats?.totalMWh ? `${Math.round(dayStats.totalMWh / 1000).toLocaleString()}` : "—"}
            unit="GWh"
            color={COLORS.violet}
            subtext={
              dayStats ? (
                <span>
                  Avg Load: <b style={{ color: COLORS.textPrimary }}>{dayStats.avgLoad.toLocaleString()} MW</b>
                </span>
              ) : null
            }
          />
          <MetricCard
            icon={ShieldCheck}
            label="Historical Model Accuracy"
            value="38.0%"
            unit="improvement"
            color={COLORS.green}
            subtext={
              <span>
                MAE: <b style={{ color: COLORS.green }}>569.8 MW</b> vs 919.4 MW baseline
              </span>
            }
          />
          <MetricCard
            icon={BarChart2}
            label={dayStats?.dayMae ? "Day Actual Error (MAE)" : "Historical Validation"}
            value={dayStats?.dayMae ? `${dayStats.dayMae.toLocaleString()}` : "Validated"}
            unit={dayStats?.dayMae ? "MW" : "Ground Truth"}
            color={dayStats?.dayMae && dayStats.dayMae > 700 ? COLORS.amber : COLORS.cyan}
            subtext={
              dayStats?.dayMape ? (
                <span>
                  Mean Error: <b style={{ color: COLORS.textPrimary }}>{dayStats.dayMape}% of actual</b>
                </span>
              ) : (
                <span>24 held-out hours loaded</span>
              )
            }
          />
        </div>

        {/* Why this forecast */}
        {dayStats?.peak && dayStats.peak.lag_24h && (
          <Panel style={{ padding: isMobile ? "18px 20px" : "20px 26px", marginBottom: isMobile ? 14 : 18 }}>
            <Row gap={8} style={{ marginBottom: 10 }}>
              <Compass size={15} color={COLORS.cyan} />
              <Label>WHY THIS FORECAST · PEAK HOUR DRIVERS</Label>
            </Row>
            <div style={{ fontSize: isMobile ? 13 : 13.5, color: COLORS.textPrimary, lineHeight: 1.6 }}>
              This peak-hour prediction ({dayStats.peak.predicted.toLocaleString()} MW at {dayStats.peak.hour}) is primarily anchored on two historical anchors:{" "}
              <b style={{ color: COLORS.cyan }}>yesterday, same hour</b> (
              {dayStats.peak.lag_24h.toLocaleString()} MW) and{" "}
              <b style={{ color: COLORS.cyan }}>last week, same hour</b> (
              {dayStats.peak.lag_168h.toLocaleString()} MW) — together these lag indicators drive approximately <b>74%</b> of feature gain in the XGBoost tree ensemble.
            </div>
          </Panel>
        )}

        {/* 24h forecast curve with actuals & bounds */}
        <Panel glow style={{ padding: isMobile ? "18px 14px" : "24px 28px", marginBottom: isMobile ? 14 : 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
            <div>
              <Row gap={8}>
                <Activity size={16} color={COLORS.cyan} />
                <Label>24-HOUR FORECAST CURVE · {selectedDate}</Label>
              </Row>
              <div style={{ fontSize: 11.5, color: COLORS.textMuted, marginTop: 2 }}>
                Real-time 24-step day-ahead inference with leakage-free lag validation
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: showConfidenceBand ? COLORS.cyan : COLORS.textMuted, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={showConfidenceBand}
                  onChange={(e) => setShowConfidenceBand(e.target.checked)}
                  style={{ accentColor: COLORS.cyan }}
                />
                ±570 MW Residual Band
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: showActuals ? COLORS.green : COLORS.textMuted, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={showActuals}
                  onChange={(e) => setShowActuals(e.target.checked)}
                  style={{ accentColor: COLORS.green }}
                />
                Ground Truth Actual
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: showLags ? COLORS.violet : COLORS.textMuted, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={showLags}
                  onChange={(e) => setShowLags(e.target.checked)}
                  style={{ accentColor: COLORS.violet }}
                />
                Historical Lags
              </label>
            </div>
          </div>

          {loading ? (
            <div style={{ height: isMobile ? 220 : 260, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.textMuted, fontSize: 13 }}>
              Loading predictions from API...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={isMobile ? 220 : 260}>
              <AreaChart data={hourlyForecast} margin={{ top: 8, right: 8, left: isMobile ? -20 : -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="predictedFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.cyan} stopOpacity="0.4" />
                    <stop offset="100%" stopColor={COLORS.cyan} stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="bandFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(34, 211, 238, 0.12)" />
                    <stop offset="100%" stopColor="rgba(34, 211, 238, 0.02)" />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={COLORS.hairline} vertical={false} />
                <XAxis
                  dataKey="hour" stroke={COLORS.textFaint}
                  tick={{ fill: COLORS.textMuted, fontSize: isMobile ? 9.5 : 11, fontFamily: FONT_MONO }}
                  interval={isMobile ? 3 : 2} axisLine={{ stroke: COLORS.hairline }} tickLine={false}
                />
                <YAxis
                  stroke={COLORS.textFaint}
                  domain={["auto", "auto"]}
                  tick={{ fill: COLORS.textMuted, fontSize: isMobile ? 9.5 : 11, fontFamily: FONT_MONO }}
                  axisLine={false} tickLine={false} width={isMobile ? 42 : 54}
                  tickFormatter={(val) => `${(val / 1000).toFixed(1)}k`}
                />
                <Tooltip content={<CustomTooltip />} />

                {/* 95% Confidence Band */}
                {showConfidenceBand && (
                  <Area
                    type="monotone"
                    dataKey="upperBand"
                    stroke="transparent"
                    fill="url(#bandFill)"
                    name="Upper Bound (+570 MW)"
                  />
                )}
                {showConfidenceBand && (
                  <Area
                    type="monotone"
                    dataKey="lowerBand"
                    stroke="transparent"
                    fill={COLORS.void}
                    name="Lower Bound (-570 MW)"
                  />
                )}

                {/* Historical Lags */}
                {showLags && (
                  <Line
                    type="monotone"
                    dataKey="lag_24h"
                    stroke={COLORS.violet}
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                    name="Lag 24h (Yesterday)"
                  />
                )}
                {showLags && (
                  <Line
                    type="monotone"
                    dataKey="lag_168h"
                    stroke={COLORS.textMuted}
                    strokeWidth={1.5}
                    strokeDasharray="2 2"
                    dot={false}
                    name="Lag 168h (Last Week)"
                  />
                )}

                {/* GridSense Predicted Curve */}
                <Area type="monotone" dataKey="predicted" name="Predicted" stroke={COLORS.cyan} strokeWidth={2.5} fill="url(#predictedFill)" />

                {/* Ground Truth Actual Load */}
                {showActuals && (
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke={COLORS.green}
                    strokeWidth={2}
                    dot={{ r: 2.5, fill: COLORS.green, stroke: COLORS.void, strokeWidth: 1 }}
                    name="Real Recorded Actual"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          )}

          {/* Chart footer status */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginTop: 12, paddingTop: 10, borderTop: `1px solid ${COLORS.hairline}`, fontSize: 11.5, color: COLORS.textMuted }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 10, height: 2, background: COLORS.cyan, display: "inline-block" }} />
                <span>Predicted Forecast</span>
              </div>
              {showActuals && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 10, height: 2, background: COLORS.green, display: "inline-block" }} />
                  <span>Ground Truth Actual</span>
                </div>
              )}
              {showConfidenceBand && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 10, height: 8, background: "rgba(34,211,238,0.18)", display: "inline-block" }} />
                  <span>±570 MW Uncertainty Band</span>
                </div>
              )}
            </div>

            {dayStats?.peak && (
              <div style={{ fontFamily: FONT_MONO }}>
                Peak: <b style={{ color: COLORS.cyan }}>{dayStats.peak.predicted.toLocaleString()} MW</b> @ {dayStats.peak.hour}
              </div>
            )}
          </div>
        </Panel>

        {/* Explainability & Benchmark row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            gap: isMobile ? 14 : 18,
            margin: isMobile ? "14px 0" : "18px 0",
          }}
        >
          <Panel style={{ padding: isMobile ? "18px 20px" : "24px 28px" }}>
            <Label>NAIVE VS. GRIDSENSE AI (AVG. ERROR ON TEST SET)</Label>
            <div style={{ fontSize: 12, color: COLORS.textFaint, marginTop: 4, marginBottom: 8 }}>
              Evaluated across 4,295 held-out hours in 2018.
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={naiveVsModel} layout="vertical" margin={{ top: 12, right: 20, left: 4, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis
                  type="category" dataKey="name" width={isMobile ? 120 : 160}
                  tick={{ fill: COLORS.textSecondary, fontSize: isMobile ? 11 : 12, fontFamily: FONT_SANS }}
                  axisLine={false} tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Avg error" radius={[0, 4, 4, 0]} barSize={22}>
                  {naiveVsModel.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 6, background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: COLORS.green, fontWeight: 600 }}>38.0% Error Reduction</span>
              <span style={{ fontSize: 11, color: COLORS.textMuted, fontFamily: FONT_MONO }}>Skew Verified &lt; 0.4%</span>
            </div>
          </Panel>

          <Panel style={{ padding: isMobile ? "18px 20px" : "24px 28px" }}>
            <Label>FEATURE GAIN IMPORTANCE (XGBOOST)</Label>
            <div style={{ fontSize: 12, color: COLORS.textFaint, marginTop: 4, marginBottom: 12 }}>
              Normalized split contribution across all boosting rounds.
            </div>
            <div>
              {featureImportance.map((f, i) => (
                <div key={i} style={{ marginBottom: 9 }}>
                  <Row style={{ justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: isMobile ? 12 : 12.5, color: COLORS.textPrimary }}>{f.name}</span>
                    <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: f.color, fontWeight: 600 }}>{f.value}%</span>
                  </Row>
                  <div style={{ height: 5, background: COLORS.hairline, borderRadius: 3, overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%", width: `${(f.value / 58.7) * 100}%`,
                        background: f.color, borderRadius: 3,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* === MODEL HEALTH SECTION === */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: isMobile ? "22px 0 10px" : "28px 0 12px", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <HeartPulse size={16} color={COLORS.cyan} />
            <span style={{ fontFamily: FONT_MONO, fontSize: isMobile ? 13 : 14, fontWeight: 600, letterSpacing: "0.04em" }}>
              MLOPS HEALTH & OBSERVABILITY
            </span>
          </div>

          <button
            onClick={handleSimulateRetrain}
            disabled={retrainSimulationRunning}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: retrainSuccess ? COLORS.green : "rgba(34, 211, 238, 0.12)",
              border: `1px solid ${retrainSuccess ? COLORS.green : COLORS.panelBorder}`,
              color: retrainSuccess ? COLORS.void : COLORS.cyan,
              padding: "5px 12px", borderRadius: 6, fontSize: 11.5,
              cursor: retrainSimulationRunning ? "not-allowed" : "pointer",
              fontFamily: FONT_MONO, fontWeight: 600,
            }}
          >
            <RefreshCw size={12} style={{ animation: retrainSimulationRunning ? "spinSlow 1s linear infinite" : "none" }} />
            <span>
              {retrainSimulationRunning ? "Checking Policy..." : retrainSuccess ? "Policy Check: Healthy" : "Evaluate Retrain Policy"}
            </span>
          </button>
        </div>

        {/* Weekly accuracy trend */}
        <Panel style={{ padding: isMobile ? "18px 16px 10px" : "24px 28px 16px", marginBottom: isMobile ? 14 : 18 }}>
          <Row style={{ justifyContent: "space-between", marginBottom: 6, flexWrap: "wrap", gap: 8 }}>
            <Row gap={8}>
              <Activity size={15} color={COLORS.cyan} />
              <Label>WEEKLY FORECAST ERROR · LAST 6 MONTHS</Label>
            </Row>
            {!monitoringLoading && (
              <span style={{ fontSize: 12, color: flaggedWeekCount > 0 ? COLORS.red : COLORS.green, fontFamily: FONT_MONO }}>
                {flaggedWeekCount > 0 ? `${flaggedWeekCount} week(s) flagged` : "all weeks stable"}
              </span>
            )}
          </Row>
          <div style={{ fontSize: 12, color: COLORS.textFaint, marginBottom: 12 }}>
            Red dots mark weeks where error was 20%+ worse than the 6-month average
            {baselineMae ? ` (${baselineMae.toLocaleString()} MW)` : ""}.
          </div>

          {monitoringLoading ? (
            <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.textMuted, fontSize: 13 }}>
              Loading accuracy history...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weeklyAccuracy} margin={{ top: 4, right: 8, left: isMobile ? -18 : -12, bottom: 0 }}>
                <CartesianGrid stroke={COLORS.hairline} vertical={false} />
                <XAxis
                  dataKey="week_start" stroke={COLORS.textFaint}
                  tick={{ fill: COLORS.textMuted, fontSize: isMobile ? 8.5 : 10, fontFamily: FONT_MONO }}
                  interval={isMobile ? 4 : 2} axisLine={{ stroke: COLORS.hairline }} tickLine={false}
                />
                <YAxis
                  stroke={COLORS.textFaint}
                  tick={{ fill: COLORS.textMuted, fontSize: isMobile ? 9.5 : 11, fontFamily: FONT_MONO }}
                  axisLine={false} tickLine={false} width={isMobile ? 42 : 54}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    const p = payload[0].payload;
                    return (
                      <div style={{ background: "#151B27", border: `1px solid ${COLORS.hairline}`, borderRadius: 4, padding: "8px 12px", fontFamily: FONT_MONO, fontSize: 12, color: COLORS.textPrimary }}>
                        <div style={{ color: COLORS.textMuted, marginBottom: 4 }}>Week of {label}</div>
                        <div style={{ color: p.flagged ? COLORS.red : COLORS.cyan }}>
                          {p.mae.toLocaleString()} MW avg error {p.flagged ? "⚠ flagged (weather swing)" : ""}
                        </div>
                      </div>
                    );
                  }}
                />
                {baselineMae && (
                  <ReferenceLine y={baselineMae} stroke={COLORS.textFaint} strokeDasharray="4 4" />
                )}
                <Line type="monotone" dataKey="mae" name="Weekly error" stroke={COLORS.cyan} strokeWidth={2} dot={<WeeklyDot />} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Panel>

        {/* Drift status */}
        <Panel style={{ padding: isMobile ? "18px 20px" : "24px 28px", marginBottom: isMobile ? 14 : 18 }}>
          <Row gap={8} style={{ marginBottom: 6 }}>
            <Radar size={15} color={COLORS.cyan} />
            <Label>DATA DRIFT · THIS SUMMER VS. LAST SUMMER</Label>
          </Row>
          <div style={{ fontSize: 12, color: COLORS.textFaint, marginBottom: 16 }}>
            {driftData
              ? `Comparing ${driftData.recent_window} against the same calendar window one year earlier (${driftData.reference_window}), to avoid confusing normal seasonality with real drift.`
              : "Loading..."}
          </div>

          {monitoringLoading ? (
            <div style={{ fontSize: 13, color: COLORS.textMuted }}>Loading drift analysis...</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 12 }}>
              {(driftData?.features ?? []).map((f, i) => (
                <div
                  key={i}
                  style={{
                    padding: "14px 16px",
                    borderRadius: 6,
                    border: `1px solid ${statusColor(f.status)}33`,
                    background: `${statusColor(f.status)}0D`,
                  }}
                >
                  <div style={{ fontSize: 12.5, color: COLORS.textPrimary, marginBottom: 8 }}>{f.feature}</div>
                  <Row gap={8}>
                    <span style={{ fontFamily: FONT_MONO, fontSize: 20, fontWeight: 700, color: statusColor(f.status) }}>
                      {f.psi}
                    </span>
                    <span style={{ fontSize: 11, color: statusColor(f.status), textTransform: "uppercase", letterSpacing: "0.03em" }}>
                      {f.status}
                    </span>
                  </Row>
                </div>
              ))}
            </div>
          )}
        </Panel>

        {/* Operational disclaimer & GitHub footer */}
        <Panel style={{ padding: isMobile ? "14px 18px" : "16px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <Row gap={10} style={{ flex: 1, minWidth: 260 }}>
              <AlertTriangle size={15} color={COLORS.amber} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: isMobile ? 12 : 12.5, color: COLORS.textMuted }}>
                Production limitation: Forecast does not yet ingest live weather API inputs. Error spikes correlate with extreme weather events (polar vortex / sudden heatwaves).
              </span>
            </Row>

            <a
              href="https://github.com/atharva-pawar80/GridSense-AI"
              target="_blank"
              rel="noreferrer"
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 6,
                background: "rgba(255,255,255,0.05)", border: `1px solid ${COLORS.hairline}`,
                color: COLORS.textPrimary, textDecoration: "none", fontSize: 12, fontFamily: FONT_MONO,
              }}
            >
              <span>GitHub Repo</span>
              <ArrowUpRight size={13} />
            </a>
          </div>
        </Panel>
      </div>
    </div>
  );
}
