"use client";

interface Event {
  event_id: string;
  event_type: string;
  timestamp: string;
  product_id: string;
  amount: string | null;
  currency: string;
}

function formatTime(ts: string) {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}

function formatDate(ts: string) {
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
}

const EVENT_CONFIG: Record<string, { code: string; color: string }> = {
  page_view: { code: "VIEW", color: "#888" },
  add_to_cart: { code: "CART+", color: "#3b82f6" },
  remove_from_cart: { code: "CART-", color: "#f59e0b" },
  checkout_started: { code: "CHKOUT", color: "#a855f7" },
  purchase: { code: "PURCHASE", color: "#28c840" },
};

export default function RecentActivity({ events, loading, error }: { events: Event[]; loading: boolean; error: string | null }) {

  const mono: React.CSSProperties = {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "12px",
  };

  return (
    <div style={{
      background: "#111",
      border: "1px solid #333",
      borderRadius: "var(--radius)",
      overflow: "hidden",
    }}>
      {/* Terminal header */}
      <div style={{
        padding: "10px 16px",
        borderBottom: "1px solid #222",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ display: "flex", gap: "5px" }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57", display: "block" }} />
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#febc2e", display: "block" }} />
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#28c840", display: "block" }} />
          </div>
          <span style={{ ...mono, color: "#666", marginLeft: "4px" }}>
            event_stream
          </span>
        </div>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "5px",
          ...mono,
          color: "#28c840",
        }}>
          <span style={{
            width: "5px",
            height: "5px",
            borderRadius: "50%",
            background: "#28c840",
            display: "inline-block",
            animation: "blink 1.5s ease-in-out infinite",
          }} />
          LIVE
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "8px 0", maxHeight: "360px", overflowY: "auto" }}>
        {error ? (
          <div style={{ ...mono, color: "#ef4444", padding: "16px" }}>
            ERR: {error}
          </div>
        ) : loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "32px 0" }}>
            <div className="spinner" style={{ borderColor: "#333", borderTopColor: "#28c840" }} />
          </div>
        ) : (
          events.map((event) => {
            const cfg = EVENT_CONFIG[event.event_type] || { code: event.event_type, color: "#888" };
            return (
              <div
                key={event.event_id}
                style={{
                  padding: "4px 16px",
                  display: "flex",
                  gap: "12px",
                  alignItems: "center",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#1a1a1a"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <span style={{ ...mono, color: "#555", whiteSpace: "nowrap" }}>
                  {formatDate(event.timestamp)} {formatTime(event.timestamp)}
                </span>
                <span style={{
                  ...mono,
                  color: cfg.color,
                  fontWeight: 500,
                  minWidth: "72px",
                }}>
                  {cfg.code}
                </span>
                <span style={{ ...mono, color: "#aaa", flex: 1 }}>
                  {event.product_id}
                </span>
                <span style={{
                  ...mono,
                  color: event.amount ? cfg.color : "#444",
                  fontWeight: event.amount ? 500 : 400,
                  textAlign: "right",
                  minWidth: "70px",
                }}>
                  {event.amount ? `$${parseFloat(event.amount).toFixed(2)}` : "—"}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
