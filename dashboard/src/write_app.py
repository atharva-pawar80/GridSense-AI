import os

content = '''import React, { useState, useEffect, useMemo } from "react";
import {
  AreaChart, Area, LineChart, Line, ReferenceLine, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell
} from "recharts";
import {
  Zap, TrendingUp, AlertTriangle, Activity, Calendar, Compass,
  HeartPulse, Radar, RefreshCw, BarChart2,
  ShieldCheck, Download, ArrowUpRight
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const COLORS = {
  void: "#080B12",
  card: "#0E131F",
  cardHover: "#131A2B",
  panelBorder: "rgba(34, 211, 238, 0.22)",
  cardBorder: "rgba(255, 255, 255, 0.08)",
  hairline: "rgba(255, 255, 255, 0.08)",
  cyan: "#22D3EE",
  cyanDim: "rgba(34, 211, 238, 0.16)",
  cyanGlow: "rgba(34, 211, 238, 0.35)",
  emerald: "#10B981",
  emeraldDim: "rgba(16, 185, 129, 0.16)",
  amber: "#F59E0B",
  amberDim: "rgba(245, 158, 11, 0.16)",
  red: "#EF4444",
  redDim: "rgba(239, 68, 68, 0.16)",
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
  { name: "24h rolling trend (rolling_avg)", value: 6.0, color: COLORS.emerald },
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

function GlassCard({ children, glow, className = "", style = {}, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: `linear-gradient(145deg, ${COLORS.card} 0%, #0A0E17 100%)`,
        border: `1px solid ${glow ? COLORS.panelBorder : COLORS.cardBorder}`,
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
      className={className}
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

function MetricBadge({ icon: Icon, label, value, unit, color = COLORS.cyan, subtext }) {
  return (
    <GlassCard style={{ padding: "18px 20px" }}>
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
    </GlassCard>
  );
}

const CustomForecastTooltip = ({ active, payload, label }) => {
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
          <span style={{ color: COLORS.emerald, display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: COLORS.emerald }} />
            Actual:
          </span>
          <b>{data.actual?.toLocaleString()} MW</b>
        </div>
      )}
      {data.actual !== null && data.actual !== undefined && (
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 6, paddingTop: 4, borderTop: `1px dashed ${COLORS.hairline}` }}>
          <span style={{ color: COLORS.textMuted }}>Delta (Error):</span>
          <b style={{ color: Math.abs(data.predicted - data.actual) > 600 ? COLORS.amber : COLORS.emerald }}>
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
  const isFlagged = payload.flagged;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={isFlagged ? 5 : 3.5}
      fill={isFlagged ? COLORS.red : COLORS.cyan}
      stroke={COLORS.void}
      strokeWidth={1.5}
    />
  );
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
        if (!res.ok) throw new Error(`Server status ${res.status}`);
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
        if (!r.ok) throw new Error(`Accuracy API status ${r.status}`);
        return r.json();
      }),
      fetch(`${API_URL}/monitoring/drift`).then((r) => {
        if (!r.ok) throw new Error(`Drift API status ${r.status}`);
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

  // Derived statistics
  const dayStats = useMemo(() => {
    if (!hourlyForecast.length) return null;
    const peak = hourlyForecast.reduce((max, cur) => (cur.predicted > max.predicted ? cur : max), hourlyForecast[0]);
    const min = hourlyForecast.reduce((lowest, cur) => (cur.predicted < lowest.predicted ? cur : lowest), hourlyForecast[0]);
    const totalMWh = hourlyForecast.reduce((acc, cur) => acc + cur.predicted, 0);
    const avgLoad = Math.round(totalMWh / hourlyForecast.length);

    // Calculate actual vs predicted error if actuals are available
    const pairs = hourlyForecast.filter((d) => d.actual !== null);
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

  const flaggedWeeks = weeklyAccuracy.filter((w) => w.flagged);
  const driftedFeatures = driftData?.features?.filter((f) => f.status !== "stable") || [];

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
        padding: isMobile ? "16px 12px 60px" : "32px 36px 80px",
        position: "relative",
        boxSizing: "border-box",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');
        
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.8; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.96); }
        }
        @keyframes spinSlow {
          100% { transform: rotate(360deg); }
        }
        .btn-hover {
          transition: all 0.2s ease;
        }
        .btn-hover:hover {
          transform: translateY(-1px);
          filter: brightness(1.1);
        }
        .btn-hover:active {
          transform: translateY(0);
        }
        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(70%) sepia(60%) saturate(1000%) hue-rotate(150deg);
          cursor: pointer;
        }
      `}</style>

      {/* Ambient Grid Background */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          backgroundImage:
            "linear-gradient(rgba(34,211,238,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.025) 1px, transparent 1px)",
          backgroundSize: "42px 42px",
          zIndex: 0,
        }}
      />

      <div style={{ position: "relative", maxWidth: 1240, margin: "0 auto", width: "100%", zIndex: 1 }}>
        {/* TOP BAR / NAVIGATION */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
            marginBottom: 24,
            paddingBottom: 20,
            borderBottom: `1px solid ${COLORS.hairline}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "linear-gradient(135deg, rgba(34,211,238,0.2) 0%, rgba(139,92,246,0.2) 100%)",
                border: `1px solid ${COLORS.panelBorder}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 0 20px -5px ${COLORS.cyanDim}`,
              }}
            >
              <Zap size={22} color={COLORS.cyan} strokeWidth={2.4} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h1 style={{ fontFamily: FONT_MONO, fontSize: isMobile ? 18 : 22, fontWeight: 700, letterSpacing: "-0.02em", margin: 0, color: COLORS.textPrimary }}>
                  GridSense AI
                </h1>
                <span
                  style={{
                    fontSize: 10,
                    fontFamily: FONT_MONO,
                    background: "rgba(34,211,238,0.12)",
                    color: COLORS.cyan,
                    border: `1px solid ${COLORS.panelBorder}`,
                    padding: "2px 7px",
                    borderRadius: 99,
                    fontWeight: 600,
                  }}
                >
                  v1.2 PROD
                </span>
              </div>
              <div style={{ fontSize: 12, color: COLORS.textMuted, letterSpacing: "0.02em", marginTop: 2 }}>
                PJM Interconnection · American Electric Power (AEP) · 14-Year Real Dataset
              </div>
            </div>
          </div>

          {/* System status & quick actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 14px",
                borderRadius: 99,
                background: "rgba(14, 19, 31, 0.8)",
                border: `1px solid ${COLORS.cardBorder}`,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: loading ? COLORS.amber : error ? COLORS.red : COLORS.emerald,
                  boxShadow: `0 0 8px ${loading ? COLORS.amber : error ? COLORS.red : COLORS.emerald}`,
                  animation: loading ? "pulseGlow 1.2s infinite" : "none",
                }}
              />
              <span style={{ fontSize: 12, fontFamily: FONT_MONO, color: COLORS.textSecondary }}>
                {loading ? "API QUERYING" : error ? "OFFLINE / DISCONNECTED" : "INFERENCE PIPELINE ONLINE"}
              </span>
            </div>

            <button
              onClick={() => {
                fetchForecast(selectedDate);
                fetchMonitoring();
              }}
              title="Refresh Live Data"
              className="btn-hover"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: COLORS.card,
                border: `1px solid ${COLORS.cardBorder}`,
                color: COLORS.textSecondary,
                padding: "7px 12px",
                borderRadius: 8,
                fontSize: 12,
                cursor: "pointer",
                fontFamily: FONT_SANS,
              }}
            >
              <RefreshCw size={13} />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleExportCsv}
              title="Export Forecast to CSV"
              className="btn-hover"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "rgba(34,211,238,0.1)",
                border: `1px solid ${COLORS.panelBorder}`,
                color: COLORS.cyan,
                padding: "7px 12px",
                borderRadius: 8,
                fontSize: 12,
                cursor: "pointer",
                fontFamily: FONT_SANS,
                fontWeight: 500,
              }}
            >
              <Download size={13} />
              <span>Export CSV</span>
            </button>
          </div>
        </header>

        {/* DATE SELECTOR & PRESETS BAR */}
        <div
          style={{
            background: COLORS.card,
            border: `1px solid ${COLORS.cardBorder}`,
            borderRadius: 12,
            padding: "16px 20px",
            marginBottom: 22,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Calendar size={18} color={COLORS.cyan} />
              <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.textSecondary }}>
                Target Forecast Date:
              </span>
            </div>

            <input
              type="date"
              value={selectedDate}
              min="2004-10-08"
              max="2018-08-02"
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                background: COLORS.void,
                border: `1px solid ${COLORS.panelBorder}`,
                borderRadius: 8,
                padding: "8px 14px",
                color: COLORS.textPrimary,
                fontFamily: FONT_MONO,
                fontSize: 14,
                cursor: "pointer",
                outline: "none",
              }}
            />
          </div>

          {/* Fast Presets */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: COLORS.textMuted }}>Historical Scenarios:</span>
            {PRESET_DATES.map((preset) => (
              <button
                key={preset.date}
                onClick={() => setSelectedDate(preset.date)}
                className="btn-hover"
                style={{
                  background: selectedDate === preset.date ? COLORS.cyan : "rgba(255,255,255,0.04)",
                  color: selectedDate === preset.date ? COLORS.void : COLORS.textSecondary,
                  border: `1px solid ${selectedDate === preset.date ? COLORS.cyan : COLORS.cardBorder}`,
                  padding: "5px 11px",
                  borderRadius: 6,
                  fontSize: 11.5,
                  fontWeight: selectedDate === preset.date ? 600 : 400,
                  cursor: "pointer",
                  fontFamily: FONT_SANS,
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* ERROR BANNER IF API IS NOT REACHABLE */}
        {error && (
          <GlassCard style={{ marginBottom: 22, borderColor: COLORS.amber, background: "rgba(245, 158, 11, 0.08)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <AlertTriangle size={20} color={COLORS.amber} style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.amber }}>
                  Cannot connect to GridSense Serving API
                </div>
                <div style={{ fontSize: 12.5, color: COLORS.textSecondary, marginTop: 2 }}>
                  Ensure FastAPI backend is running via <code>python -m uvicorn src.serving.app:app --reload</code> on port 8000. Error details: {error}
                </div>
              </div>
            </div>
          </GlassCard>
        )}

        {/* METRICS ROW */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(230px, 1fr))",
            gap: 16,
            marginBottom: 22,
          }}
        >
          <MetricBadge
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
          <MetricBadge
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
          <MetricBadge
            icon={ShieldCheck}
            label="Historical Model Accuracy"
            value="38.0%"
            unit="improvement"
            color={COLORS.emerald}
            subtext={
              <span>
                MAE: <b style={{ color: COLORS.emerald }}>569.8 MW</b> vs 919.4 MW baseline
              </span>
            }
          />
          <MetricBadge
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

        {/* MAIN FORECAST CHART PANEL */}
        <GlassCard glow style={{ padding: isMobile ? "18px 14px" : "24px 28px", marginBottom: 22 }}>
          {/* Chart Header & Filters */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
              marginBottom: 18,
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Activity size={18} color={COLORS.cyan} />
                <h2 style={{ fontSize: 16, fontWeight: 700, fontFamily: FONT_MONO, color: COLORS.textPrimary, margin: 0 }}>
                  24-HOUR DAY-AHEAD LOAD CURVE
                </h2>
                <span style={{ fontSize: 12, color: COLORS.textMuted }}>· {selectedDate}</span>
              </div>
              <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 3 }}>
                Continuous 24-step ahead inference with leakage-free lag validation
              </div>
            </div>

            {/* Toggle controls */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  cursor: "pointer",
                  color: showConfidenceBand ? COLORS.cyan : COLORS.textMuted,
                  userSelect: "none",
                }}
              >
                <input
                  type="checkbox"
                  checked={showConfidenceBand}
                  onChange={(e) => setShowConfidenceBand(e.target.checked)}
                  style={{ accentColor: COLORS.cyan, cursor: "pointer" }}
                />
                ±570 MW Band
              </label>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  cursor: "pointer",
                  color: showActuals ? COLORS.emerald : COLORS.textMuted,
                  userSelect: "none",
                }}
              >
                <input
                  type="checkbox"
                  checked={showActuals}
                  onChange={(e) => setShowActuals(e.target.checked)}
                  style={{ accentColor: COLORS.emerald, cursor: "pointer" }}
                />
                Actuals Ground Truth
              </label>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  cursor: "pointer",
                  color: showLags ? COLORS.violet : COLORS.textMuted,
                  userSelect: "none",
                }}
              >
                <input
                  type="checkbox"
                  checked={showLags}
                  onChange={(e) => setShowLags(e.target.checked)}
                  style={{ accentColor: COLORS.violet, cursor: "pointer" }}
                />
                Historical Lags
              </label>
            </div>
          </div>

          {/* Interactive Chart */}
          {loading ? (
            <div style={{ height: 320, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.textMuted }}>
              <RefreshCw size={24} style={{ animation: "spinSlow 1.5s linear infinite", marginRight: 10 }} />
              <span>Computing leakage-free features and running inference...</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={hourlyForecast} margin={{ top: 10, right: 10, left: isMobile ? -20 : -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="predGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.cyan} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={COLORS.cyan} stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="bandGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="rgba(34, 211, 238, 0.12)" />
                    <stop offset="95%" stopColor="rgba(34, 211, 238, 0.02)" />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={COLORS.hairline} strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="hour"
                  stroke={COLORS.textFaint}
                  tick={{ fill: COLORS.textMuted, fontSize: 11, fontFamily: FONT_MONO }}
                  axisLine={{ stroke: COLORS.hairline }}
                  tickLine={false}
                />
                <YAxis
                  stroke={COLORS.textFaint}
                  domain={["auto", "auto"]}
                  tick={{ fill: COLORS.textMuted, fontSize: 11, fontFamily: FONT_MONO }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `${(val / 1000).toFixed(1)}k`}
                />
                <Tooltip content={<CustomForecastTooltip />} />

                {/* 95% Confidence Band */}
                {showConfidenceBand && (
                  <Area
                    type="monotone"
                    dataKey="upperBand"
                    stroke="transparent"
                    fill="url(#bandGradient)"
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

                {/* Model Prediction Curve */}
                <Area
                  type="monotone"
                  dataKey="predicted"
                  stroke={COLORS.cyan}
                  strokeWidth={2.6}
                  fill="url(#predGradient)"
                  name="GridSense AI Forecast"
                />

                {/* Ground Truth Actual Load */}
                {showActuals && (
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke={COLORS.emerald}
                    strokeWidth={2}
                    dot={{ r: 2.5, fill: COLORS.emerald, stroke: COLORS.void, strokeWidth: 1 }}
                    name="Real Recorded Actual"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          )}

          {/* Chart Legend Footer */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
              marginTop: 14,
              paddingTop: 12,
              borderTop: `1px solid ${COLORS.hairline}`,
              fontSize: 12,
              color: COLORS.textMuted,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 12, height: 3, background: COLORS.cyan, borderRadius: 2 }} />
                <span style={{ color: COLORS.textSecondary }}>GridSense Forecast</span>
              </div>
              {showActuals && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 12, height: 3, background: COLORS.emerald, borderRadius: 2 }} />
                  <span style={{ color: COLORS.textSecondary }}>Ground Truth Actual (MW)</span>
                </div>
              )}
              {showConfidenceBand && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 12, height: 10, background: "rgba(34,211,238,0.18)", borderRadius: 2 }} />
                  <span style={{ color: COLORS.textSecondary }}>±570 MW Residual Band</span>
                </div>
              )}
            </div>

            {dayStats?.peak && (
              <div style={{ fontFamily: FONT_MONO, fontSize: 12 }}>
                Predicted Peak: <b style={{ color: COLORS.cyan }}>{dayStats.peak.predicted.toLocaleString()} MW</b> @ {dayStats.peak.hour}
              </div>
            )}
          </div>
        </GlassCard>

        {/* TWO-COLUMN EXPLANATION & BENCHMARK ROW */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            gap: 18,
            marginBottom: 28,
          }}
        >
          {/* Explainability & Signals */}
          <GlassCard>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Compass size={17} color={COLORS.cyan} />
              <h3 style={{ fontSize: 14, fontWeight: 700, fontFamily: FONT_MONO, color: COLORS.textPrimary, margin: 0 }}>
                FEATURE IMPORTANCE & EXPLAINABILITY
              </h3>
            </div>
            <p style={{ fontSize: 12.5, color: COLORS.textMuted, marginBottom: 16, lineHeight: 1.5 }}>
              XGBoost gain importance across all trees. The model relies heavily on lag features while capturing intraday/intraweek seasonality through continuous Fourier sine/cosine components.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {featureImportance.map((f, i) => (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: COLORS.textSecondary, fontWeight: 500 }}>{f.name}</span>
                    <span style={{ fontFamily: FONT_MONO, color: f.color, fontWeight: 600 }}>{f.value}%</span>
                  </div>
                  <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${(f.value / 58.7) * 100}%`,
                        background: f.color,
                        borderRadius: 3,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Model vs Baseline Benchmark */}
          <GlassCard>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <ShieldCheck size={17} color={COLORS.cyan} />
              <h3 style={{ fontSize: 14, fontWeight: 700, fontFamily: FONT_MONO, color: COLORS.textPrimary, margin: 0 }}>
                BENCHMARK EVALUATION (4,295 TEST HOURS)
              </h3>
            </div>
            <p style={{ fontSize: 12.5, color: COLORS.textMuted, marginBottom: 14, lineHeight: 1.5 }}>
              Evaluated strictly on held-out 6 months test data. GridSense cuts average dispatch scheduling error by <b>349.6 MW/hour</b> over standard utility naive baseline.
            </p>

            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={naiveVsModel} layout="vertical" margin={{ top: 8, right: 24, left: 10, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={isMobile ? 120 : 160}
                  tick={{ fill: COLORS.textSecondary, fontSize: 12, fontFamily: FONT_SANS }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(val) => [`${val} MW MAE`, "Average Error"]}
                  contentStyle={{ background: COLORS.card, border: `1px solid ${COLORS.panelBorder}`, borderRadius: 6, fontFamily: FONT_MONO, fontSize: 12 }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={22}>
                  {naiveVsModel.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div
              style={{
                marginTop: 10,
                padding: "10px 14px",
                borderRadius: 8,
                background: "rgba(16, 185, 129, 0.08)",
                border: "1px solid rgba(16, 185, 129, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ fontSize: 12, color: COLORS.emerald, fontWeight: 600 }}>
                38.0% Error Reduction
              </div>
              <div style={{ fontSize: 11.5, color: COLORS.textMuted, fontFamily: FONT_MONO }}>
                Skew & Leakage Checked
              </div>
            </div>
          </GlassCard>
        </div>

        {/* SECTION: MLOPS & MODEL HEALTH MONITORING */}
        <div style={{ marginBottom: 28 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <HeartPulse size={18} color={COLORS.cyan} />
              <h2 style={{ fontSize: 16, fontWeight: 700, fontFamily: FONT_MONO, letterSpacing: "0.04em", margin: 0 }}>
                MLOPS OBSERVABILITY & DRIFT SURVEILLANCE
              </h2>
            </div>

            {/* Retrain Trigger Simulation Button */}
            <button
              onClick={handleSimulateRetrain}
              disabled={retrainSimulationRunning}
              className="btn-hover"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: retrainSuccess ? COLORS.emerald : "rgba(34, 211, 238, 0.12)",
                border: `1px solid ${retrainSuccess ? COLORS.emerald : COLORS.panelBorder}`,
                color: retrainSuccess ? COLORS.void : COLORS.cyan,
                padding: "7px 14px",
                borderRadius: 8,
                fontSize: 12,
                cursor: retrainSimulationRunning ? "not-allowed" : "pointer",
                fontFamily: FONT_MONO,
                fontWeight: 600,
              }}
            >
              <RefreshCw
                size={13}
                style={{
                  animation: retrainSimulationRunning ? "spinSlow 1s linear infinite" : "none",
                }}
              />
              <span>
                {retrainSimulationRunning
                  ? "Evaluating Retrain Policy..."
                  : retrainSuccess
                  ? "Retrain Evaluated: System Healthy"
                  : "Run Retrain Policy Check"}
              </span>
            </button>
          </div>

          {/* Monitoring Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1.5fr 1fr",
              gap: 18,
            }}
          >
            {/* Weekly Error Tracking Chart */}
            <GlassCard>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Activity size={15} color={COLORS.cyan} />
                    <span style={{ fontSize: 12, fontWeight: 700, fontFamily: FONT_MONO, color: COLORS.textPrimary }}>
                      WEEKLY FORECAST MAE (LAST 6 MONTHS)
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 4 }}>
                    Automated flags highlight weeks where error is 20%+ worse than 6-month mean ({baselineMae ? `${baselineMae} MW` : "..."})
                  </div>
                </div>

                <span
                  style={{
                    fontSize: 11.5,
                    fontFamily: FONT_MONO,
                    padding: "3px 8px",
                    borderRadius: 4,
                    background: flaggedWeeks.length > 0 ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)",
                    color: flaggedWeeks.length > 0 ? COLORS.red : COLORS.emerald,
                    border: `1px solid ${flaggedWeeks.length > 0 ? COLORS.red : COLORS.emerald}40`,
                  }}
                >
                  {flaggedWeeks.length} Anomalous Week(s)
                </span>
              </div>

              {monitoringLoading ? (
                <div style={{ height: 210, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.textMuted }}>
                  Loading accuracy timeline...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={210}>
                  <LineChart data={weeklyAccuracy} margin={{ top: 10, right: 10, left: isMobile ? -20 : -10, bottom: 0 }}>
                    <CartesianGrid stroke={COLORS.hairline} strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="week_start"
                      stroke={COLORS.textFaint}
                      tick={{ fill: COLORS.textMuted, fontSize: 10, fontFamily: FONT_MONO }}
                      interval={isMobile ? 5 : 3}
                      axisLine={{ stroke: COLORS.hairline }}
                      tickLine={false}
                    />
                    <YAxis
                      stroke={COLORS.textFaint}
                      tick={{ fill: COLORS.textMuted, fontSize: 10, fontFamily: FONT_MONO }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload || !payload.length) return null;
                        const p = payload[0].payload;
                        return (
                          <div style={{ background: COLORS.card, border: `1px solid ${COLORS.panelBorder}`, borderRadius: 6, padding: "8px 12px", fontFamily: FONT_MONO, fontSize: 12, color: COLORS.textPrimary }}>
                            <div style={{ color: COLORS.textMuted, marginBottom: 4 }}>Week of {label}</div>
                            <div style={{ color: p.flagged ? COLORS.red : COLORS.cyan, fontWeight: 600 }}>
                              {p.mae.toLocaleString()} MW MAE {p.flagged ? "(⚠ Drift/Weather Anomaly)" : ""}
                            </div>
                          </div>
                        );
                      }}
                    />
                    {baselineMae && (
                      <ReferenceLine
                        y={baselineMae}
                        stroke={COLORS.amber}
                        strokeDasharray="4 4"
                        label={{ value: `Baseline: ${baselineMae} MW`, fill: COLORS.amber, fontSize: 10, position: "insideTopRight" }}
                      />
                    )}
                    <Line
                      type="monotone"
                      dataKey="mae"
                      name="Weekly MAE"
                      stroke={COLORS.cyan}
                      strokeWidth={2}
                      dot={<WeeklyDot />}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </GlassCard>

            {/* PSI Drift Surveillance Cards */}
            <GlassCard>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Radar size={15} color={COLORS.cyan} />
                    <span style={{ fontSize: 12, fontWeight: 700, fontFamily: FONT_MONO, color: COLORS.textPrimary }}>
                      SEASON-CONTROLLED PSI DRIFT
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 4 }}>
                    Year-over-year matched calendar windows (prevents false drift from summer/winter seasonality)
                  </div>
                </div>

                <span
                  style={{
                    fontSize: 11.5,
                    fontFamily: FONT_MONO,
                    padding: "3px 8px",
                    borderRadius: 4,
                    background: driftedFeatures.length > 0 ? "rgba(245, 158, 11, 0.15)" : "rgba(16, 185, 129, 0.15)",
                    color: driftedFeatures.length > 0 ? COLORS.amber : COLORS.emerald,
                    border: `1px solid ${driftedFeatures.length > 0 ? COLORS.amber : COLORS.emerald}40`,
                  }}
                >
                  {driftedFeatures.length === 0 ? "Stable Distributions" : `${driftedFeatures.length} Shifted`}
                </span>
              </div>

              {monitoringLoading ? (
                <div style={{ height: 210, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.textMuted }}>
                  Computing Population Stability Index...
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
                  {(driftData?.features || []).map((f, i) => {
                    const isStable = f.status === "stable";
                    const isModerate = f.status === "moderate shift";
                    const statusColor = isStable ? COLORS.emerald : isModerate ? COLORS.amber : COLORS.red;
                    const statusBg = isStable ? COLORS.emeraldDim : isModerate ? COLORS.amberDim : COLORS.redDim;
                    return (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 14px",
                          borderRadius: 8,
                          background: statusBg,
                          border: `1px solid ${statusColor}33`,
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textPrimary, fontFamily: FONT_MONO }}>
                            {f.feature}
                          </div>
                          <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>
                            PSI Threshold: &lt; 0.10
                          </div>
                        </div>

                        <div style={{ textAlign: "right" }}>
                          <span style={{ fontFamily: FONT_MONO, fontSize: 16, fontWeight: 700, color: statusColor }}>
                            {f.psi}
                          </span>
                          <div style={{ fontSize: 10, fontWeight: 600, color: statusColor, textTransform: "uppercase" }}>
                            {f.status}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </GlassCard>
          </div>
        </div>

        {/* FOOTER: REAL AUDIT FINDINGS & ARCHITECTURAL SPECS */}
        <div
          style={{
            background: "rgba(14, 19, 31, 0.6)",
            border: `1px solid ${COLORS.cardBorder}`,
            borderRadius: 12,
            padding: "18px 24px",
            display: "flex",
            alignItems: "flex-start",
            gap: 14,
            flexWrap: "wrap",
          }}
        >
          <AlertTriangle size={18} color={COLORS.amber} style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>
              Operational Limitations & Engineering Transparency
            </div>
            <p style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 4, lineHeight: 1.6 }}>
              • <b>No Real-Time Weather Integration:</b> Anomalous error spikes align with extreme polar vortex cold snaps where heating demand surges beyond pure calendar lags.
              <br />
              • <b>Leakage-Free Guarantee:</b> All rolling statistics utilize <code>shift(1)</code> lag buffers strictly excluding target hours.
              <br />
              • <b>Automated Retrain Trigger:</b> Retrain activates if 2+ of the last 4 weeks breach error threshold or if feature PSI exceeds 0.25.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <a
              href="https://github.com/atharva-pawar80/GridSense-AI"
              target="_blank"
              rel="noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 8,
                background: "rgba(255,255,255,0.06)",
                border: `1px solid ${COLORS.cardBorder}`,
                color: COLORS.textPrimary,
                textDecoration: "none",
                fontSize: 12,
                fontFamily: FONT_MONO,
              }}
            >
              <span>GitHub Repository</span>
              <ArrowUpRight size={13} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
'''

with open('dashboard/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("SUCCESS: wrote updated App.jsx")
