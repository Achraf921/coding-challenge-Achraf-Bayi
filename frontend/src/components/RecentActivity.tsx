"use client";

import { useEffect, useState, useRef } from "react";
import { getRecentActivity } from "@/lib/api";

interface Event {
  event_id: string;
  store_id: string;
  event_type: string;
  timestamp: string;
  product_id: string;
  amount: string | null;
  currency: string;
}

const EVENT_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
  page_view: { color: "#7a8ba8", bg: "rgba(122,139,168,0.1)", icon: "eye" },
  add_to_cart: { color: "#3b82f6", bg: "rgba(59,130,246,0.1)", icon: "+" },
  remove_from_cart: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", icon: "-" },
  checkout_started: { color: "#a855f7", bg: "rgba(168,85,247,0.1)", icon: "cart" },
  purchase: { color: "#22c55e", bg: "rgba(34,197,94,0.1)", icon: "$" },
};

function timeAgo(ts: string) {
  const seconds = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatEventType(type: string) {
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function RecentActivity({ storeId }: { storeId: string }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchEvents = (showLoading: boolean) => {
    if (showLoading) setLoading(true);
    setError(null);

    getRecentActivity(storeId)
      .then((res) => {
        setEvents(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchEvents(true);
    intervalRef.current = setInterval(() => fetchEvents(false), 10000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [storeId]);

  return (
    <div
      className="fade-in"
      style={{
        animationDelay: "400ms",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "24px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            fontWeight: 500,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Recent Activity
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "11px",
            color: "var(--green)",
          }}
        >
          <span
            className="pulse-dot"
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "var(--green)",
              display: "inline-block",
            }}
          />
          Live - 10s
        </div>
      </div>

      {error ? (
        <div style={{ color: "var(--red)", fontSize: "14px", padding: "20px 0" }}>
          Failed to load: {error}
        </div>
      ) : loading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "40px 0",
          }}
        >
          <div className="spinner" />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {events.map((event) => {
            const cfg = EVENT_CONFIG[event.event_type] || EVENT_CONFIG.page_view;
            return (
              <div
                key={event.event_id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--bg-card-hover)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background: cfg.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: cfg.color,
                    fontFamily: "'JetBrains Mono', monospace",
                    flexShrink: 0,
                  }}
                >
                  {cfg.icon === "eye" ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : cfg.icon === "cart" ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                    </svg>
                  ) : (
                    cfg.icon
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "var(--text-primary)",
                    }}
                  >
                    {formatEventType(event.event_type)}
                    <span
                      style={{
                        color: "var(--text-muted)",
                        fontWeight: 400,
                        marginLeft: "6px",
                      }}
                    >
                      {event.product_id?.replace("product_", "#")}
                    </span>
                  </div>
                </div>

                {event.amount && (
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "var(--green)",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    ${parseFloat(event.amount).toFixed(2)}
                  </div>
                )}

                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    whiteSpace: "nowrap",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {timeAgo(event.timestamp)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
