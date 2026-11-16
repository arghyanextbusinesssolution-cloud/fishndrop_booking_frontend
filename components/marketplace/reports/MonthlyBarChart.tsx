"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

/** One money series per month. Months after the current one are drawn muted and labelled "Upcoming". */
export interface MonthPoint {
  month: string; // YYYY-MM
  value: number;
  bookings: number;
  upcoming?: boolean;
}

const C = {
  bar: "#C8A96A", // brand gold
  upcoming: "#6E5D3B", // same hue, recessive step for not-yet-happened months
  grid: "rgba(255,255,255,0.06)",
  axis: "rgba(255,255,255,0.45)",
  surface: "#0d1612"
};

const money = (n = 0) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const compact = (n: number) => (n >= 1000 ? `$${(n / 1000).toLocaleString("en-US", { maximumFractionDigits: 1 })}k` : `$${n}`);
const monthShort = (ym: string) => format(new Date(`${ym}-15T12:00:00`), "MMM");
const monthLong = (ym: string) => format(new Date(`${ym}-15T12:00:00`), "MMMM yyyy");

interface Props {
  title: string;
  subtitle?: string;
  data: MonthPoint[];
  valueLabel: string; // e.g. "Your earnings", "Tropica commission"
  height?: number;
}

export function MonthlyBarChart({ title, subtitle, data, valueLabel, height = 260 }: Props) {
  const [asTable, setAsTable] = useState(false);
  const hasUpcoming = data.some((d) => d.upcoming && d.value > 0);
  const empty = data.every((d) => d.value === 0);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white">{title}</h2>
          {subtitle && <p className="text-xs text-white/50 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-4">
          {/* Legend: a single series needs none, but the muted "upcoming" bars do */}
          {hasUpcoming && !asTable && (
            <div className="flex items-center gap-3 text-[11px] text-white/60">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: C.bar }} /> Event held
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: C.upcoming }} /> Upcoming
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={() => setAsTable((v) => !v)}
            className="text-[11px] font-bold uppercase tracking-wider text-[#C8A96A] hover:text-[#E0C68E]"
          >
            {asTable ? "View chart" : "View as table"}
          </button>
        </div>
      </div>

      {asTable ? (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.04] text-[10px] uppercase tracking-widest text-white/50">
              <tr>
                <th className="text-left px-4 py-2.5">Month</th>
                <th className="text-right px-4 py-2.5">Bookings</th>
                <th className="text-right px-4 py-2.5">{valueLabel}</th>
              </tr>
            </thead>
            <tbody>
              {[...data].reverse().map((d) => (
                <tr key={d.month} className="border-t border-white/5">
                  <td className="px-4 py-2 text-white/80">
                    {monthLong(d.month)}
                    {d.upcoming && <span className="ml-2 text-[10px] uppercase tracking-wider text-white/40">upcoming</span>}
                  </td>
                  <td className="px-4 py-2 text-right text-white/70">{d.bookings}</td>
                  <td className="px-4 py-2 text-right text-white font-semibold">{money(d.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative" style={{ height }}>
          {empty && (
            <p className="absolute inset-0 flex items-center justify-center text-sm text-white/40 z-10 pointer-events-none">
              No paid bookings yet — this fills in as bookings come in.
            </p>
          )}
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barCategoryGap="28%">
              <CartesianGrid vertical={false} stroke={C.grid} />
              <XAxis dataKey="month" tickFormatter={monthShort} tick={{ fill: C.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                tickFormatter={compact}
                tick={{ fill: C.axis, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={52}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.05)" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0].payload as MonthPoint;
                  return (
                    <div className="rounded-xl border border-white/15 bg-[#0d1612] px-3 py-2 shadow-xl text-xs space-y-0.5">
                      <p className="text-white/60">
                        {monthLong(p.month)}
                        {p.upcoming ? " · upcoming" : ""}
                      </p>
                      <p className="text-white font-semibold text-sm">{money(p.value)}</p>
                      <p className="text-white/50">
                        {valueLabel} · {p.bookings} booking{p.bookings === 1 ? "" : "s"}
                      </p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={36} stroke={C.surface} strokeWidth={2}>
                {data.map((d) => (
                  <Cell key={d.month} fill={d.upcoming ? C.upcoming : C.bar} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

/** Big-number tile used on the revenue dashboards. */
export function StatTile({
  label,
  value,
  hint,
  highlight,
  icon
}: {
  label: string;
  value: string;
  hint?: React.ReactNode;
  highlight?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-2xl border p-5 space-y-1.5", highlight ? "border-[#C8A96A]/40 bg-[#C8A96A]/10" : "border-white/10 bg-white/[0.03]")}>
      <p className="text-[10px] uppercase tracking-widest text-white/50 flex items-center gap-1.5">
        {icon && <span className="text-[#C8A96A]">{icon}</span>}
        {label}
      </p>
      <p className={cn("text-2xl font-headline", highlight ? "text-[#E0C68E]" : "text-white")}>{value}</p>
      {hint && <div className="text-[11px] text-white/50">{hint}</div>}
    </div>
  );
}

/** "+25% vs last month" with an arrow; text carries the meaning, color only reinforces. */
export function Delta({ now, before, label = "vs last month" }: { now: number; before: number; label?: string }) {
  if (!before && !now) return <span>No bookings yet this month</span>;
  if (!before) return <span className="text-emerald-300">▲ New this month</span>;
  const pct = Math.round(((now - before) / before) * 100);
  const up = pct >= 0;
  return (
    <span className={up ? "text-emerald-300" : "text-rose-300"}>
      {up ? "▲" : "▼"} {Math.abs(pct)}% {label}
    </span>
  );
}
