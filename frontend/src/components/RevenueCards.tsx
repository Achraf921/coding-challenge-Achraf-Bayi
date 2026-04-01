"use client";

import { useEffect, useState } from "react";
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
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

const PERIODS = [
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
] as const;

export default function RevenueCards({ storeId }: { storeId: string }) {
  const [data, setData] = useState<Record<string, OverviewData | null>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all(PERIODS.map((p) => getOverview(storeId, p.key)))
      .then(([today, week, month]) => {
        if (cancelled) return;
        setData({ today, week, month });
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [storeId]);

  if (error) {
    return (
      <div
        style={{
          background: "var(--red-muted)",
          border: "1px solid rgba(239,68,68,0.2)",
          borderRadius: "12px",
          padding: "16px 20px",
          color: "var(--red)",
          fontSize: "14px",
        }}
      >
        Failed to load revenue data: {error}
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
        }}
      >
        {PERIODS.map((p, i) => {
          const d = data[p.key];
          return (
            <div
              key={p.key}
              className="fade-in"
              style={{
                animationDelay: `${i * 80}ms`,
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "24px",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: "8px",
                }}
              >
                Revenue {p.label}
              </div>
              {loading ? (
                <div style={{ display: "flex", alignItems: "center", height: "36px" }}>
                  <div className="spinner" />
                </div>
              ) : (
                <div
                  style={{
                    fontSize: "28px",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {d ? formatUSD(d.total_revenue) : "—"}
                </div>
              )}
            </div>
          );
        })}

        {/* Conversion Rate Card */}
        <div
          className="fade-in"
          style={{
            animationDelay: "240ms",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            padding: "24px",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              fontWeight: 500,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: "8px",
            }}
          >
            Conversion Rate (Month)
          </div>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", height: "36px" }}>
              <div className="spinner" />
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <div
                style={{
                  fontSize: "28px",
                  fontWeight: 700,
                  color: "var(--green)",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {data.month ? `${data.month.conversion_rate}%` : "—"}
              </div>
              <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                purchases / views
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
