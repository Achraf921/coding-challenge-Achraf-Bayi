"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { getTopProducts } from "@/lib/api";

interface Product {
  product_id: string;
  total_revenue: string;
  purchase_count: string;
}

const BAR_COLORS = [
  "#3b82f6",
  "#2563eb",
  "#1d4ed8",
  "#1e40af",
  "#1e3a8a",
  "#60a5fa",
  "#93c5fd",
  "#3b82f6",
  "#2563eb",
  "#1d4ed8",
];

export default function TopProductsChart({ storeId }: { storeId: string }) {
  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getTopProducts(storeId)
      .then((res) => {
        if (cancelled) return;
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [storeId]);

  const chartData = data.map((p) => ({
    name: p.product_id.replace("product_", "#"),
    revenue: parseFloat(p.total_revenue),
    count: parseInt(p.purchase_count),
  }));

  return (
    <div
      className="fade-in"
      style={{
        animationDelay: "300ms",
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
          marginBottom: "20px",
        }}
      >
        Top 10 Products by Revenue
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
            alignItems: "center",
            height: "300px",
          }}
        >
          <div className="spinner" />
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
            <XAxis
              dataKey="name"
              tick={{ fill: "#7a8ba8", fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}
              axisLine={{ stroke: "#1e2a3a" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#4a5a74", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${v}`}
            />
            <Tooltip
              contentStyle={{
                background: "#1a2233",
                border: "1px solid #1e2a3a",
                borderRadius: "8px",
                fontSize: "13px",
                fontFamily: "'DM Sans', sans-serif",
                color: "#e8ecf4",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              }}
              formatter={(value) => [`$${Number(value).toFixed(2)}`, "Revenue"]}
              cursor={{ fill: "rgba(59,130,246,0.06)" }}
            />
            <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
