"use client";

import { useState } from "react";
import StoreSelector from "@/components/StoreSelector";
import RevenueCards from "@/components/RevenueCards";
import TopProductsChart from "@/components/TopProductsChart";
import RecentActivity from "@/components/RecentActivity";

export default function Dashboard() {
  const [storeId, setStoreId] = useState("store_1");

  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "32px 24px 64px",
        width: "100%",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "32px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "22px",
              fontWeight: 700,
              color: "var(--text-primary)",
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            Analytics
          </h1>
          <p
            style={{
              fontSize: "13px",
              color: "var(--text-muted)",
              margin: "4px 0 0",
            }}
          >
            Store performance overview
          </p>
        </div>
        <StoreSelector value={storeId} onChange={setStoreId} />
      </div>

      {/* Revenue + Conversion Cards */}
      <div style={{ marginBottom: "20px" }}>
        <RevenueCards key={`rev-${storeId}`} storeId={storeId} />
      </div>

      {/* Chart + Activity */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
        }}
        className="dashboard-grid"
      >
        <TopProductsChart key={`chart-${storeId}`} storeId={storeId} />
        <RecentActivity key={`activity-${storeId}`} storeId={storeId} />
      </div>

      <style>{`
        @media (max-width: 768px) {
          .dashboard-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
