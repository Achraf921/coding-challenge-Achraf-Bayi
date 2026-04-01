"use client";

import { useEffect, useState, useRef } from "react";
import { getOverview } from "@/lib/api";

interface OverviewData {
  total_revenue: number;
  events_by_type: Record<string, number>;
  conversion_rate: number;
  period: string;
}

function formatUSD(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);
}

type Mode = "today" | "week" | "month" | "custom";

const PRESETS: { key: Mode; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "7d" },
  { key: "month", label: "30d" },
  { key: "custom", label: "Custom" },
];

function toInputDate(d: Date) {
  return d.toISOString().split("T")[0];
}

export default function RevenueCards({ storeId, estimatedLiveVisitors }: { storeId: string; estimatedLiveVisitors: number }) {
  const [mode, setMode] = useState<Mode>("month");
  const [startDate, setStartDate] = useState(() => toInputDate(new Date(Date.now() - 7 * 86400000)));
  const [endDate, setEndDate] = useState(() => toInputDate(new Date()));
  const [data, setData] = useState<OverviewData | null>(null);
  const [presetData, setPresetData] = useState<Record<string, OverviewData | null>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchPresets = (showLoading: boolean) => {
    if (showLoading) setLoading(true);
    setError(null);

    Promise.all([
      getOverview(storeId, "today"),
      getOverview(storeId, "week"),
      getOverview(storeId, "month"),
    ])
      .then(([today, week, month]) => {
        const map: Record<string, OverviewData> = { today, week, month };
        setPresetData(map);
        if (mode !== "custom") setData(map[mode]);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  // Fetch on mount and matches our cache's TTL (60 secs)
  useEffect(() => {
    fetchPresets(true);
    intervalRef.current = setInterval(() => fetchPresets(false), 60000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [storeId]);

  // When mode changes to a preset, use cached preset data
  useEffect(() => {
    if (mode !== "custom" && presetData[mode]) {
      setData(presetData[mode]);
    }
  }, [mode, presetData]);

  // Fetch custom range
  const fetchCustom = () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    setError(null);

    const endWithTime = endDate + "T23:59:59.999Z";
    getOverview(storeId, "custom", new Date(startDate).toISOString(), endWithTime)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  const inputStyle: React.CSSProperties = {
    border: "1px solid var(--border)",
    borderRadius: "6px",
    padding: "5px 8px",
    fontSize: "12px",
    fontFamily: "'IBM Plex Mono', monospace",
    color: "var(--text)",
    background: "#fff",
    outline: "none",
    cursor: "pointer",
  };

  return (
    <div>
      {/* Period selector */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        marginBottom: "12px",
        flexWrap: "wrap",
      }}>
        {PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => setMode(p.key)}
            style={{
              padding: "5px 12px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 500,
              fontFamily: "inherit",
              cursor: "pointer",
              border: mode === p.key ? "1px solid var(--text)" : "1px solid var(--border)",
              background: mode === p.key ? "var(--text)" : "#fff",
              color: mode === p.key ? "#fff" : "var(--text-2)",
              transition: "all 0.15s",
            }}
          >
            {p.label}
          </button>
        ))}

        {mode === "custom" && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginLeft: "8px",
          }}>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={inputStyle}
            />
            <span style={{ fontSize: "11px", color: "var(--text-3)" }}>to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={inputStyle}
            />
            <button
              onClick={fetchCustom}
              style={{
                padding: "5px 14px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 600,
                fontFamily: "inherit",
                cursor: "pointer",
                border: "1px solid var(--text)",
                background: "var(--text)",
                color: "#fff",
                transition: "opacity 0.15s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
              onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {error && (
        <div style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "12px",
          color: "var(--red)",
          padding: "12px 0",
        }}>
          err: failed to load revenue data
        </div>
      )}

      {/* Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "1px",
        background: "var(--border)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        overflow: "hidden",
      }}
      className="revenue-grid"
      >
        <div style={{ background: "#fff", padding: "20px" }}>
          <div style={{
            fontSize: "11px",
            fontWeight: 500,
            color: "var(--text-3)",
            marginBottom: "6px",
            fontFamily: "'IBM Plex Mono', monospace",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}>
            Total Revenue
          </div>
          {loading ? (
            <div style={{ height: "28px", display: "flex", alignItems: "center" }}>
              <div className="spinner" />
            </div>
          ) : (
            <div style={{
              fontSize: "22px",
              fontWeight: 700,
              color: "var(--text)",
              letterSpacing: "-0.03em",
            }}>
              {data ? formatUSD(data.total_revenue) : "—"}
            </div>
          )}
        </div>

        <div style={{ background: "#fff", padding: "20px" }}>
          <div style={{
            fontSize: "11px",
            fontWeight: 500,
            color: "var(--text-3)",
            marginBottom: "6px",
            fontFamily: "'IBM Plex Mono', monospace",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}>
            Total Events
          </div>
          {loading ? (
            <div style={{ height: "28px", display: "flex", alignItems: "center" }}>
              <div className="spinner" />
            </div>
          ) : (
            <div style={{
              fontSize: "22px",
              fontWeight: 700,
              color: "var(--text)",
              letterSpacing: "-0.03em",
            }}>
              {data?.events_by_type
                ? Object.values(data.events_by_type).reduce((a, b) => a + b, 0).toLocaleString()
                : "—"}
            </div>
          )}
        </div>

        <div style={{ background: "#fff", padding: "20px" }}>
          <div style={{
            fontSize: "11px",
            fontWeight: 500,
            color: "var(--text-3)",
            marginBottom: "6px",
            fontFamily: "'IBM Plex Mono', monospace",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}>
            Conv. Rate
          </div>
          {loading ? (
            <div style={{ height: "28px", display: "flex", alignItems: "center" }}>
              <div className="spinner" />
            </div>
          ) : (
            <div style={{
              fontSize: "22px",
              fontWeight: 700,
              color: "var(--green)",
              letterSpacing: "-0.03em",
            }}>
              {data ? `${data.conversion_rate}%` : "—"}
            </div>
          )}
        </div>

        <div style={{ background: "#fff", padding: "20px" }}>
          <div style={{
            fontSize: "11px",
            fontWeight: 500,
            color: "var(--text-3)",
            marginBottom: "6px",
            fontFamily: "'IBM Plex Mono', monospace",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}>
            <span style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "var(--green)",
              display: "inline-block",
              animation: "pulse-dot 2s ease-in-out infinite",
            }} />
            Live Visitors
          </div>
          <div style={{
            fontSize: "22px",
            fontWeight: 700,
            color: "var(--green)",
            letterSpacing: "-0.03em",
          }}>
            {estimatedLiveVisitors}
          </div>
        </div>

        <style>{`
          @media (max-width: 640px) {
            .revenue-grid {
              grid-template-columns: 1fr 1fr !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
