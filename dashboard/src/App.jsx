import React, { useState, useEffect } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
} from "recharts";
import { Zap, TrendingUp, AlertTriangle, Activity, Calendar } from "lucide-react";

const COLORS = {
  void: "#0A0E17",
  panel: "#10151F",
  panelBorder: "rgba(34, 211, 238, 0.15)",
  hairline: "rgba(255,255,255,0.08)",
  cyan: "#22D3EE",
  cyanDim: "rgba(34, 211, 238, 0.15)",
  amber: "#F5A623",
  violet: "#7C6CF6",
  textPrimary: "#E6EDF3",
  textMuted: "#6B7785",
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

function Panel({ children, glow, style, className = "" }) {
  return (
    <div
      className={`relative ${className}`}
      style={{
        background: COLORS.panel,
        border: `1px solid ${glow ? COLORS.panelBorder : COLORS.hairline}`,
        borderRadius: 4,
        boxShadow: glow ? `0 0 40px -12px ${COLORS.cyanDim}` : "none",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Label({ children }) {
  return (
    <div
      style={{
        fontFamily: FONT_SANS,
        fontSize: 12,
        letterSpacing: "0.02em",
        color: COLORS.textMuted,
      }}
    >
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

  const improvementPct = (
    (1 - naiveVsModel[1].value / naiveVsModel[0].value) *
    100
  ).toFixed(1);

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
        padding: "28px 32px",
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
        backgroundSize: "34px 34px",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap');
      `}</style>

      <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
        <div className="flex items-center gap-3">
          <Zap size={20} color={COLORS.cyan} strokeWidth={2.2} />
          <span style={{ fontFamily: FONT_MONO, fontSize: 16, fontWeight: 600 }}>
            GridSense AI
          </span>
          <span style={{ color: COLORS.textFaint, fontSize: 14 }}>·</span>
          <span style={{ color: COLORS.textMuted, fontSize: 14 }}>
            AEP, Ohio Valley region
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: 99,
              background: loading ? COLORS.textFaint : COLORS.cyan,
              boxShadow: loading ? "none" : `0 0 8px 2px ${COLORS.cyanDim}`,
            }}
          />
          <span style={{ color: COLORS.textMuted, fontSize: 13 }}>
            {loading ? "Loading..." : error ? "API connection failed" : "Live · connected to GridSense API"}
          </span>
        </div>
      </div>

      <Panel style={{ padding: "14px 22px", marginBottom: 16 }}>
        <div className="flex items-center gap-3">
          <Calendar size={15} color={COLORS.cyan} />
          <Label>Forecast date</Label>
          <input
            type="date"
            value={selectedDate}
            min="2004-10-08"
            max="2018-08-02"
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{
              background: COLORS.void,
              border: `1px solid ${COLORS.hairline}`,
              borderRadius: 4,
              padding: "6px 10px",
              color: COLORS.textPrimary,
              fontFamily: FONT_MONO,
              fontSize: 13,
            }}
          />
          <span style={{ fontSize: 12, color: COLORS.textFaint }}>
            (real data covers Oct 2004 – Aug 2018)
          </span>
        </div>
      </Panel>

      {error && (
        <Panel style={{ padding: "14px 22px", marginBottom: 16, borderColor: "rgba(245,166,35,0.4)" }}>
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} color={COLORS.amber} />
            <span style={{ fontSize: 13, color: COLORS.textMuted }}>
              Could not load predictions for {selectedDate} — {error}. Make
              sure the FastAPI server is running and the date is inside the
              real data range.
            </span>
          </div>
        </Panel>
      )}

      <div className="grid grid-cols-3 gap-4" style={{ marginBottom: 16 }}>
        <Panel glow className="col-span-2" style={{ padding: "26px 30px" }}>
          <Label>
            {peakHour ? `Predicted peak load — ${selectedDate}, ${peakHour.hour}` : "Predicted peak load"}
          </Label>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 10 }}>
            <span
              style={{
                fontFamily: FONT_MONO,
                fontSize: 56,
                fontWeight: 600,
                color: COLORS.cyan,
                textShadow: `0 0 30px ${COLORS.cyanDim}`,
                lineHeight: 1,
              }}
            >
              {peakHour ? peakHour.predicted.toLocaleString() : "—"}
            </span>
            <span style={{ fontFamily: FONT_MONO, fontSize: 18, color: COLORS.textMuted }}>
              MW
            </span>
          </div>
          {peakHour && (
            <div style={{ marginTop: 14, display: "flex", gap: 22 }}>
              <div style={{ fontSize: 13, color: COLORS.textMuted }}>
                Expected range:{" "}
                <span style={{ color: COLORS.textPrimary, fontFamily: FONT_MONO }}>
                  {(peakHour.predicted - 570).toLocaleString()}–
                  {(peakHour.predicted + 570).toLocaleString()} MW
                </span>
              </div>
            </div>
          )}
        </Panel>

        <Panel style={{ padding: "26px 26px" }}>
          <div className="flex items-center gap-2">
            <TrendingUp size={15} color={COLORS.cyan} />
            <Label>Model accuracy vs. naive guess</Label>
          </div>
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 34,
              fontWeight: 600,
              marginTop: 10,
              color: COLORS.textPrimary,
            }}
          >
            {improvementPct}%
          </div>
          <div style={{ fontSize: 12.5, color: COLORS.textMuted, marginTop: 4 }}>
            better than "same hour last week"
          </div>
          <div style={{ marginTop: 16, fontSize: 12.5, color: COLORS.textMuted }}>
            Avg. error:{" "}
            <span style={{ color: COLORS.textPrimary, fontFamily: FONT_MONO }}>
              569.8 MW
            </span>
          </div>
        </Panel>
      </div>

      <Panel style={{ padding: "22px 26px 12px" }} className="mb-4">
        <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
          <div className="flex items-center gap-2">
            <Activity size={15} color={COLORS.cyan} />
            <Label>24-hour load forecast — {selectedDate}</Label>
          </div>
          <div className="flex items-center gap-4" style={{ fontSize: 12, color: COLORS.textMuted }}>
            <span className="flex items-center gap-1.5">
              <span style={{ width: 10, height: 2, background: COLORS.cyan, display: "inline-block" }} />
              Predicted
            </span>
          </div>
        </div>

        {loading ? (
          <div style={{ height: 230, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.textMuted, fontSize: 13 }}>
            Loading predictions from API...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={hourlyForecast} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="predictedFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.cyan} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={COLORS.cyan} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={COLORS.hairline} vertical={false} />
              <XAxis
                dataKey="hour"
                stroke={COLORS.textFaint}
                tick={{ fill: COLORS.textMuted, fontSize: 11, fontFamily: FONT_MONO }}
                interval={2}
                axisLine={{ stroke: COLORS.hairline }}
                tickLine={false}
              />
              <YAxis
                stroke={COLORS.textFaint}
                tick={{ fill: COLORS.textMuted, fontSize: 11, fontFamily: FONT_MONO }}
                axisLine={false}
                tickLine={false}
                width={52}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="predicted"
                name="Predicted"
                stroke={COLORS.cyan}
                strokeWidth={2}
                fill="url(#predictedFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Panel>

      <div className="grid grid-cols-2 gap-4">
        <Panel style={{ padding: "22px 26px" }}>
          <Label>Naive guess vs. GridSense AI (avg. error)</Label>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={naiveVsModel} layout="vertical" margin={{ top: 14, right: 24, left: 8, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                width={110}
                tick={{ fill: COLORS.textMuted, fontSize: 12.5, fontFamily: FONT_SANS }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Avg error" radius={[0, 3, 3, 0]} barSize={22}>
                {naiveVsModel.map((entry, i) => (
                  <Cell key={i} fill={i === 0 ? COLORS.textFaint : COLORS.cyan} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel style={{ padding: "22px 26px" }}>
          <div className="flex items-center gap-2">
            <Label>What drives every forecast</Label>
          </div>
          <div style={{ marginTop: 14 }}>
            {featureImportance.map((f, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div className="flex justify-between" style={{ fontSize: 12.5, marginBottom: 4 }}>
                  <span style={{ color: COLORS.textPrimary }}>{f.name}</span>
                  <span style={{ fontFamily: FONT_MONO, color: COLORS.textMuted }}>
                    {f.value}%
                  </span>
                </div>
                <div style={{ height: 4, background: COLORS.hairline, borderRadius: 2 }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${(f.value / 58.7) * 100}%`,
                      background: i === 0 ? COLORS.cyan : COLORS.textFaint,
                      borderRadius: 2,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel style={{ padding: "14px 22px", marginTop: 16 }}>
        <div className="flex items-center gap-2">
          <AlertTriangle size={14} color={COLORS.amber} />
          <span style={{ fontSize: 12.5, color: COLORS.textMuted }}>
            This forecast does not yet account for weather. Accuracy may drop
            on days with unusual temperature swings.
          </span>
        </div>
      </Panel>
    </div>
  );
}