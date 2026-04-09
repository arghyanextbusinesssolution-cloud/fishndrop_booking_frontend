"use client";

import { TableStats } from "@/types";

export function StatsCards({ stats }: { stats: TableStats }) {
  const items = [
    { label: "Total Tables", value: stats.total },
    { label: "Available Tables", value: stats.available },
    { label: "Booked Tables", value: stats.booked },
    { label: "Two-Seaters Available", value: stats.twoSeatersAvailable },
    { label: "Four-Seaters Available", value: stats.fourSeatersAvailable },
  ];
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-sm text-[var(--text-secondary)]">{item.label}</p>
          <p className="mt-2 text-2xl font-bold text-[var(--accent)]">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
