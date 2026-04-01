"use client";

import { useState, useEffect, useRef } from "react";
import { getRecentActivity } from "@/lib/api";
import StoreSelector from "@/components/StoreSelector";
import RevenueCards from "@/components/RevenueCards";
import TopProductsChart from "@/components/TopProductsChart";
import RecentActivity from "@/components/RecentActivity";

interface Event {
  event_id: string;
  event_type: string;
  timestamp: string;
  product_id: string;
  amount: string | null;
  currency: string;
}

export default function Dashboard() {
  const [storeId, setStoreId] = useState("store_1");
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [recentError, setRecentError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchRecent = (showLoading: boolean) => {
    if (showLoading) setRecentLoading(true);
    setRecentError(null);
    getRecentActivity(storeId)
      .then((res) => { setRecentEvents(res); setRecentLoading(false); })
      .catch((err) => { setRecentError(err.message); setRecentLoading(false); });
  };

  useEffect(() => {
    fetchRecent(true);
    intervalRef.current = setInterval(() => fetchRecent(false), 5000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [storeId]);

  // Compute live visitors: count page_views in last 5 min from the 20 most recent events, divide by 3
  const estimatedLiveVisitors = Math.round(
    recentEvents.filter(
      (e) => e.event_type === "page_view" && (Date.now() - new Date(e.timestamp).getTime()) < 5 * 60 * 1000
    ).length / 3
  );

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{
        borderBottom: "1px solid var(--border)",
        background: "#fff",
        padding: "0 32px",
        height: "56px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <img
              src="https://www.amboras.com/logo.svg?dpl=dpl_Cy3h6pFmCXwREj5g2YqTb3wRki56"
              alt="Amboras"
              style={{ height: "22px", width: "auto" }}
            />
            <span style={{
              fontSize: "15px",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: "var(--text)",
            }}>
              Amboras
            </span>
          </div>
          <nav style={{ display: "flex", gap: "20px" }}>
            <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)", borderBottom: "2px solid var(--text)", paddingBottom: "16px", marginBottom: "-17px" }}>Dashboard</span>
            <span style={{ fontSize: "13px", color: "var(--text-3)", cursor: "default" }}>Products</span>
          </nav>
        </div>
        <StoreSelector value={storeId} onChange={setStoreId} />
      </header>

      {/* Content */}
      <main style={{
        flex: 1,
        maxWidth: "960px",
        margin: "0 auto",
        padding: "32px 24px 48px",
        width: "100%",
      }}>
        <div style={{ marginBottom: "24px" }}>
          <RevenueCards key={`rev-${storeId}`} storeId={storeId} estimatedLiveVisitors={estimatedLiveVisitors} />
        </div>

        <div style={{ marginBottom: "24px" }}>
          <TopProductsChart key={`chart-${storeId}`} storeId={storeId} />
        </div>

        <RecentActivity events={recentEvents} loading={recentLoading} error={recentError} />
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: "1px solid var(--border)",
        background: "#f9f8f6",
        padding: "48px 32px 0",
      }}>
        <div style={{
          maxWidth: "960px",
          margin: "0 auto",
          width: "100%",
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr",
            gap: "32px",
            paddingBottom: "40px",
          }}
          className="footer-grid"
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "12px" }}>
                <img
                  src="https://www.amboras.com/logo.svg?dpl=dpl_Cy3h6pFmCXwREj5g2YqTb3wRki56"
                  alt="Amboras"
                  style={{ height: "20px", width: "auto" }}
                />
                <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.03em" }}>Amboras</span>
              </div>
              <p style={{ fontSize: "13px", color: "var(--text-3)", lineHeight: "1.6" }}>
                Multi-tenant eCommerce platform orchestrator.
              </p>
            </div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", marginBottom: "16px" }}>Product</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <span style={{ fontSize: "13px", color: "var(--text-3)" }}>Features</span>
                <span style={{ fontSize: "13px", color: "var(--text-3)" }}>About</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", marginBottom: "16px" }}>Company</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <span style={{ fontSize: "13px", color: "var(--text-3)" }}>About Us</span>
                <span style={{ fontSize: "13px", color: "var(--text-3)" }}>Contact</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", marginBottom: "16px" }}>Legal</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <span style={{ fontSize: "13px", color: "var(--text-3)" }}>Terms of Service</span>
                <span style={{ fontSize: "13px", color: "var(--text-3)" }}>Privacy Policy</span>
                <span style={{ fontSize: "13px", color: "var(--text-3)" }}>Cookie Policy</span>
                <span style={{ fontSize: "13px", color: "var(--text-3)", textDecoration: "underline" }}>Do Not Sell My Info</span>
              </div>
            </div>
          </div>
          <div style={{
            borderTop: "1px solid var(--border)",
            padding: "20px 0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "8px",
          }}>
            <span style={{ fontSize: "13px", color: "var(--text-3)" }}>
              &copy; 2026 Amboras. All rights reserved.
            </span>
            <span style={{ fontSize: "13px", color: "var(--text-3)" }}>
              English
            </span>
          </div>
        </div>
      </footer>

      <style>{`
        @media (max-width: 640px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
      `}</style>

      <style>{`
        @media (max-width: 640px) {
          main { padding: 16px 12px 32px !important; }
        }
      `}</style>
    </div>
  );
}
