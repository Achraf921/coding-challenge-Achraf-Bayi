const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function fetchAPI(endpoint: string, storeId: string) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { "x-store-id": storeId },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function getOverview(storeId: string, period: string) {
  return fetchAPI(`/api/v1/analytics/overview?period=${period}`, storeId);
}

export async function getTopProducts(storeId: string) {
  return fetchAPI("/api/v1/analytics/top-products", storeId);
}

export async function getRecentActivity(storeId: string) {
  return fetchAPI("/api/v1/analytics/recent-activity", storeId);
}
