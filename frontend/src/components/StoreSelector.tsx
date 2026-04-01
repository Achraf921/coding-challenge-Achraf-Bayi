"use client";

const STORES = ["store_1", "store_2", "store_3"];

export default function StoreSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        background: "transparent",
        border: "1px solid var(--border)",
        color: "var(--text)",
        padding: "4px 24px 4px 8px",
        borderRadius: "6px",
        fontSize: "12px",
        fontWeight: 500,
        fontFamily: "'IBM Plex Mono', monospace",
        cursor: "pointer",
        outline: "none",
        appearance: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='8' height='5' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l3 3 3-3' stroke='%23999' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 8px center",
      }}
    >
      {STORES.map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  );
}
