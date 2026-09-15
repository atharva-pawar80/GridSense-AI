import React, { useState, useEffect } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
} from "recharts";
import { Zap, TrendingUp, AlertTriangle, Activity, Calendar, Compass } from "lucide-react";

const COLORS = {
  void: "#080B12",
  panel: "#0F141E",
  panelBorder: "rgba(34, 211, 238, 0.18)",
  hairline: "rgba(255,255,255,0.08)",
  cyan: "#22D3EE",
  cyanDim: "rgba(34, 211, 238, 0.16)",
  amber: "#F5A623",
  violet: "#7C6CF6",
  textPrimary: "#EDF2F7",
  textMuted: "#7C8798",
  textFaint: "#3E4756",
};

const FONT_MONO = "'IBM Plex Mono', monospace";
const FONT_SANS = "'IBM Plex Sans', sans-serif";

const featureImportance = [
  { name: "Yesterday, same hour", value: 58.7 },
  { name: "Last week, same hour", value: 15.8 },
  { name: "Day of week", value: 12.3 },
  { name: "24h rolling trend", value: 6.0 },
  { name: "Hour of day", value: 3.9 },
  { name: "Month", value: 3.3 },
];

const naiveVsModel = [
  { name: "Naive baseline", value: 919.4 },
  { name: "GridSense AI", value: 569.8 },
];

function Panel({ children, glow, style }) {
  return (
    <div
      style={{
        background: COLORS.panel,
        border: `1px solid ${glow ? COLORS.panelBorder : COLORS.hairline}`,
        borderRadius: 6,
        boxShadow: glow ? `0 0 48px -14px ${COLORS.cyanDim}` : "none",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Label({ children }) {
  return (
    <div style={{ fontFamily: FONT_SANS, fontSize: 12.5, letterSpacing: "0.03em", color: COLORS.textMuted }}>
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

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      style={{
        background: "#151B27",
        border: `1px solid ${COLORS.hairline}`,
        borderRadius: 4,
        padding: "8px 12px",
        fontFamily: FONT_MONO,
        fontSize: 12,
        color: COLORS.textPrimary,
      }}
    >
      <div style={{ color: COLORS.textMuted, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>
          {p.name}: {p.value?.toLocaleString()} MW
        </div>
      ))}
    </div>
  );
};

export default function App() {
  const [selectedDate, setSelectedDate] = useState("2018-06-15");
  const [hourlyForecast, setHourlyForecast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`http://127.0.0.1:8000/predict/day?date=${selectedDate}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const formatted = data.predictions.map((p) => ({
          hour: p.hour,
          predicted: Math.round(p.predicted),
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
  }, [selectedDate]);

  const improvementPct = ((1 - naiveVsModel[1].value / naiveVsModel[0].value) * 100).toFixed(1);

  const peakHour =
    hourlyForecast.length > 0
      ? hourlyForecast.reduce((a, b) => (b.predicted > a.predicted ? b : a))
      : null;

  return (
    <div
      style={{
        background: COLORS.void,
        minHeight: "100vh",
        fontFamily: FONT_SANS,
        color: COLORS.textPrimary,
        padding: "36px 40px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap');
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

      {/* Static grid background */}
      <div
        style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage:
            "linear-gradient(rgba(34,211,238,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.035) 1px, transparent 1px)",
          backgroundSize: "38px 38px",
        }}
      />
      {/* Slow animated scan line, like a radar sweep */}
      <div
        style={{
          position: "absolute", left: 0, right: 0, height: "35vh",
          background: `linear-gradient(180deg, transparent, ${COLORS.cyanDim}, transparent)`,
          animation: "scanline 9s linear infinite",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", maxWidth: 1180, margin: "0 auto" }}>
        {/* Header bar -- official briefing feel */}
        <Row style={{ justifyContent: "space-between", marginBottom: 6 }}>
          <Row gap={14}>
            <div
              style={{
                width: 40, height: 40, borderRadius: 8, background: COLORS.panel,
                border: `1px solid ${COLORS.panelBorder}`, display: "flex",
                alignItems: "center", justifyContent: "center",
              }}
            >
              <Zap size={20} color={COLORS.cyan} strokeWidth={2.2} />
            </div>
            <div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 19, fontWeight: 700, lineHeight: 1.2 }}>
                GridSense AI
              </div>
              <div style={{ fontSize: 12, color: COLORS.textMuted, letterSpacing: "0.06em" }}>
                DAY-AHEAD LOAD FORECASTING · AEP / OHIO VALLEY REGION
              </div>
            </div>
          </Row>
          <Row gap={8}>
            <div
              style={{
                width: 9, height: 9, borderRadius: 99,
                background: loading ? COLORS.textFaint : COLORS.cyan,
                animation: loading ? "none" : "pulseDot 2s infinite",
              }}
            />
            <span style={{ color: COLORS.textMuted, fontSize: 13, fontFamily: FONT_MONO }}>
              {loading ? "SYNCING" : error ? "OFFLINE" : "LIVE FEED"}
            </span>
          </Row>
        </Row>

        <div style={{ height: 1, background: COLORS.hairline, margin: "22px 0 24px" }} />

        {/* Date picker -- large, touch-friendly */}
        <Panel style={{ padding: "18px 24px", marginBottom: 18 }}>
          <Row gap={16}>
            <Row gap={8}>
              <Calendar size={17} color={COLORS.cyan} />
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
                padding: "12px 16px",
                color: COLORS.textPrimary,
                fontFamily: FONT_MONO,
                fontSize: 16,
                minHeight: 44,
                minWidth: 190,
              }}
            />
            <span style={{ fontSize: 12.5, color: COLORS.textFaint }}>
              Real historical data · Oct 2004 – Aug 2018
            </span>
          </Row>
        </Panel>

        {error && (
          <Panel style={{ padding: "16px 24px", marginBottom: 18, borderColor: "rgba(245,166,35,0.4)" }}>
            <Row gap={10}>
              <AlertTriangle size={16} color={COLORS.amber} />
              <span style={{ fontSize: 13.5, color: COLORS.textMuted }}>
                Could not load predictions for {selectedDate} — {error}. Confirm
                the FastAPI server is running at localhost:8000.
              </span>
            </Row>
          </Panel>
        )}

        {/* Hero row */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 18, marginBottom: 18 }}>
          <Panel glow style={{ padding: "32px 36px" }}>
            <Label>
              {peakHour ? `PREDICTED PEAK LOAD · ${selectedDate}, ${peakHour.hour.toUpperCase()}` : "PREDICTED PEAK LOAD"}
            </Label>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 12 }}>
              <span
                style={{
                  fontFamily: FONT_MONO, fontSize: 68, fontWeight: 700,
                  color: COLORS.cyan, textShadow: `0 0 36px ${COLORS.cyanDim}`, lineHeight: 1,
                }}
              >
                {peakHour ? peakHour.predicted.toLocaleString() : "—"}
              </span>
              <span style={{ fontFamily: FONT_MONO, fontSize: 20, color: COLORS.textMuted }}>MW</span>
            </div>
            {peakHour && (
              <div style={{ marginTop: 16, fontSize: 13.5, color: COLORS.textMuted }}>
                Expected range:{" "}
                <span style={{ color: COLORS.textPrimary, fontFamily: FONT_MONO }}>
                  {(peakHour.predicted - 570).toLocaleString()}–{(peakHour.predicted + 570).toLocaleString()} MW
                </span>
              </div>
            )}
          </Panel>

          <Panel style={{ padding: "28px 28px" }}>
            <Row gap={8}>
              <TrendingUp size={16} color={COLORS.cyan} />
              <Label>MODEL ACCURACY</Label>
            </Row>
            <div style={{ fontFamily: FONT_MONO, fontSize: 38, fontWeight: 700, marginTop: 12 }}>
              {improvementPct}%
            </div>
            <div style={{ fontSize: 12.5, color: COLORS.textMuted, marginTop: 4 }}>
              better than naive baseline
            </div>
            <div style={{ marginTop: 18, fontSize: 12.5, color: COLORS.textMuted }}>
              Avg. error:{" "}
              <span style={{ color: COLORS.textPrimary, fontFamily: FONT_MONO }}>569.8 MW</span>
            </div>
          </Panel>
        </div>

        {/* Why this forecast -- grounded in the REAL lag values from the API */}
        {peakHour && peakHour.lag_24h && (
          <Panel style={{ padding: "22px 28px", marginBottom: 18 }}>
            <Row gap={8} style={{ marginBottom: 14 }}>
              <Compass size={16} color={COLORS.cyan} />
              <Label>WHY THIS FORECAST</Label>
            </Row>
            <div style={{ fontSize: 14, color: COLORS.textPrimary, lineHeight: 1.6 }}>
              This peak-hour forecast leans mainly on two real signals:{" "}
              <b style={{ color: COLORS.cyan }}>yesterday, same hour</b> (
              {peakHour.lag_24h.toLocaleString()} MW) and{" "}
              <b style={{ color: COLORS.cyan }}>last week, same hour</b> (
              {peakHour.lag_168h.toLocaleString()} MW) — together these two data
              points drive roughly <b>74%</b> of every prediction this model makes.
            </div>
          </Panel>
        )}

        {/* 24h forecast curve */}
        <Panel style={{ padding: "26px 30px 16px" }}>
          <Row style={{ justifyContent: "space-between", marginBottom: 16 }}>
            <Row gap={8}>
              <Activity size={16} color={COLORS.cyan} />
              <Label>24-HOUR LOAD FORECAST · {selectedDate}</Label>
            </Row>
            <Row gap={6}>
              <span style={{ width: 10, height: 2, background: COLORS.cyan, display: "inline-block" }} />
              <span style={{ fontSize: 12, color: COLORS.textMuted }}>Predicted</span>
            </Row>
          </Row>

          {loading ? (
            <div style={{ height: 240, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.textMuted, fontSize: 13 }}>
              Loading predictions from API...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={hourlyForecast} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="predictedFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.cyan} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={COLORS.cyan} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={COLORS.hairline} vertical={false} />
                <XAxis
                  dataKey="hour" stroke={COLORS.textFaint}
                  tick={{ fill: COLORS.textMuted, fontSize: 11, fontFamily: FONT_MONO }}
                  interval={2} axisLine={{ stroke: COLORS.hairline }} tickLine={false}
                />
                <YAxis
                  stroke={COLORS.textFaint}
                  tick={{ fill: COLORS.textMuted, fontSize: 11, fontFamily: FONT_MONO }}
                  axisLine={false} tickLine={false} width={54}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="predicted" name="Predicted" stroke={COLORS.cyan} strokeWidth={2.5} fill="url(#predictedFill)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Panel>

        {/* Bottom row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 18 }}>
          <Panel style={{ padding: "24px 28px" }}>
            <Label>NAIVE GUESS VS. GRIDSENSE AI (AVG. ERROR)</Label>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={naiveVsModel} layout="vertical" margin={{ top: 16, right: 24, left: 8, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis
                  type="category" dataKey="name" width={110}
                  tick={{ fill: COLORS.textMuted, fontSize: 12.5, fontFamily: FONT_SANS }}
                  axisLine={false} tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Avg error" radius={[0, 3, 3, 0]} barSize={24}>
                  {naiveVsModel.map((entry, i) => (
                    <Cell key={i} fill={i === 0 ? COLORS.textFaint : COLORS.cyan} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Panel>

          <Panel style={{ padding: "24px 28px" }}>
            <Label>WHAT DRIVES EVERY FORECAST</Label>
            <div style={{ marginTop: 16 }}>
              {featureImportance.map((f, i) => (
                <div key={i} style={{ marginBottom: 11 }}>
                  <Row style={{ justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 13, color: COLORS.textPrimary }}>{f.name}</span>
                    <span style={{ fontFamily: FONT_MONO, fontSize: 12.5, color: COLORS.textMuted }}>{f.value}%</span>
                  </Row>
                  <div style={{ height: 5, background: COLORS.hairline, borderRadius: 3 }}>
                    <div
                      style={{
                        height: "100%", width: `${(f.value / 58.7) * 100}%`,
                        background: i === 0 ? COLORS.cyan : COLORS.textFaint, borderRadius: 3,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <Panel style={{ padding: "16px 24px", marginTop: 18 }}>
          <Row gap={10}>
            <AlertTriangle size={15} color={COLORS.amber} />
            <span style={{ fontSize: 13, color: COLORS.textMuted }}>
              This forecast does not yet account for weather. Accuracy may drop
              on days with unusual temperature swings.
            </span>
          </Row>
        </Panel>
      </div>
    </div>
  );
}