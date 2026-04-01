"use client";

import { useEffect, useState, useRef } from "react";
import { getTopProducts } from "@/lib/api";

interface Product {
  product_id: string;
  total_revenue: string;
  purchase_count: string;
}

export default function TopProductsChart({ storeId }: { storeId: string }) {
  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchProducts = (showLoading: boolean) => {
    if (showLoading) setLoading(true);
    setError(null);

    getTopProducts(storeId)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  // Here polling matches our cache's eviction policy (300s TTL) (and on mount)
  useEffect(() => {
    fetchProducts(true);
    intervalRef.current = setInterval(() => fetchProducts(false), 300000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [storeId]);

  const maxRevenue = data.length > 0
    ? Math.max(...data.map((p) => parseFloat(p.total_revenue)))
    : 0;

  return (
    <div style={{
      background: "#fff",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius)",
      overflow: "hidden",
    }}>
      <div style={{
        padding: "16px 20px 12px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <span style={{
          fontSize: "13px",
          fontWeight: 600,
          color: "var(--text)",
        }}>
          Top products
        </span>
        <span style={{
          fontSize: "11px",
          fontFamily: "'IBM Plex Mono', monospace",
          color: "var(--text-3)",
        }}>
          by revenue
        </span>
      </div>

      {error ? (
        <div style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "12px",
          color: "var(--red)",
          padding: "16px 20px",
        }}>
          err: failed to load
        </div>
      ) : loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
          <div className="spinner" />
        </div>
      ) : (
        <div>
          {data.map((product, i) => {
            const revenue = parseFloat(product.total_revenue);
            const pct = maxRevenue > 0 ? (revenue / maxRevenue) * 100 : 0;
            return (
              <div
                key={product.product_id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 20px",
                  borderTop: "1px solid var(--border)",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#fafafa"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <span style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: i < 3 ? "var(--text)" : "var(--text-3)",
                  fontFamily: "'IBM Plex Mono', monospace",
                  width: "20px",
                  textAlign: "right",
                }}>
                  {i + 1}
                </span>

                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}>
                    <span style={{
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "var(--text)",
                    }}>
                      {product.product_id.replace("product_", "Product ")}
                    </span>
                    <span style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      fontFamily: "'IBM Plex Mono', monospace",
                      color: "var(--text)",
                    }}>
                      ${revenue.toFixed(2)}
                    </span>
                  </div>
                  <div style={{
                    height: "3px",
                    background: "#f0f0f0",
                    borderRadius: "2px",
                    overflow: "hidden",
                  }}>
                    <div style={{
                      height: "100%",
                      width: `${pct}%`,
                      background: i === 0 ? "#111" : i < 3 ? "#666" : "#ccc",
                      borderRadius: "2px",
                      transition: "width 0.4s ease-out",
                    }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
