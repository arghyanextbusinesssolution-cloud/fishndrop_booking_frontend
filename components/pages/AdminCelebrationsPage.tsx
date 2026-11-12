"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, ChevronRight, Clock, Loader2, PartyPopper, Phone, RefreshCw, Search, UserCheck, Users } from "lucide-react";
import api from "@/lib/axios";
import { formatTimeTo12Hour } from "@/lib/utils";

interface Celebration {
  _id: string;
  hostName: string;
  hostPhone: string;
  date: string;
  startTime: string;
  endTime: string;
  occasion: string;
  status: string;
  capacity: number;
  registered: number;
  pendingApproval: number;
  checkedIn: number;
  lastCheckInAt: string | null;
}

type When = "today" | "upcoming" | "past" | "all";

const TABS: { key: When; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past" },
  { key: "all", label: "All" }
];

const nice = (s: string) => s.replace(/_/g, " ");
const dateLabel = (d: string) => new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const timeLabel = (d: string) => new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

/* Validated chart tokens on the dark surface (same as the booking detail slots bar) */
const C = { arrived: "#B8872A", signed: "#4A86CF", open: "#2a2118" };

export default function AdminCelebrationsPage() {
  const pathname = usePathname() || "";
  const base = pathname.startsWith("/employee") ? "/employee" : "/admin";

  const [when, setWhen] = useState<When>("today");
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<Celebration[] | null>(null);
  const [totals, setTotals] = useState({ parties: 0, capacity: 0, registered: 0, checkedIn: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/celebrations", { params: { when, q: query || undefined } });
      setRows(data.celebrations);
      setTotals(data.totals);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Could not load celebrations");
    } finally {
      setLoading(false);
    }
  }, [when, query]);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 30_000); // live door numbers
    return () => clearInterval(t);
  }, [load]);

  // Debounce the search box
  useEffect(() => {
    const t = setTimeout(() => setQuery(q.trim()), 350);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-6xl mx-auto text-white space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-[0.3em] text-[#E0C68E] font-bold flex items-center gap-2">
            <PartyPopper className="w-4 h-4" /> Private venue parties
          </p>
          <h1 className="text-3xl md:text-4xl font-headline font-bold">Celebrations</h1>
          <p className="text-sm text-white/55">Every party&apos;s guest list and who has arrived at the door. Updates every 30 seconds.</p>
        </div>
        <button
          onClick={() => void load()}
          disabled={loading}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 text-xs bg-white/5 hover:bg-white/10 border border-[#C8A96A]/25 px-3 py-2 rounded-lg cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
        <div className="flex gap-1 p-1 rounded-xl bg-black/40 border border-[#C8A96A]/20 w-fit">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setWhen(t.key)}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer transition-all ${
                when === t.key ? "bg-gradient-to-b from-[#F1D9A0] to-[#C8A96A] text-[#1a1208]" : "text-white/60 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 rounded-xl bg-black/40 border border-[#C8A96A]/20 focus-within:border-[#E0C68E] px-3 md:w-80">
          <Search className="w-4 h-4 text-white/40" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Host name, phone, occasion…" className="flex-1 bg-transparent py-2.5 text-sm outline-none placeholder:text-white/30" />
        </label>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Parties", value: totals.parties, accent: "#fff" },
          { label: "Guest slots", value: totals.capacity, accent: "#fff" },
          { label: "Signed up", value: totals.registered, accent: "#7FB0E8" },
          { label: "Checked in", value: totals.checkedIn, accent: "#E0C68E" }
        ].map((t) => (
          <div key={t.label} className="rounded-xl border border-[#C8A96A]/15 bg-black/30 p-4">
            <p className="text-[11px] uppercase tracking-[0.15em] text-white/50 font-bold">{t.label}</p>
            <p className="mt-1 text-3xl font-bold tabular-nums" style={{ color: t.accent }}>
              {t.value}
            </p>
          </div>
        ))}
      </div>

      {/* List */}
      {error ? (
        <p className="text-rose-300 text-sm">{error}</p>
      ) : rows === null ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-7 h-7 animate-spin text-[#E0C68E]" />
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-[#C8A96A]/15 bg-black/30 p-10 text-center space-y-2">
          <PartyPopper className="w-10 h-10 mx-auto text-[#C8A96A]/50" />
          <p className="text-sm text-white/60">
            {query ? "No celebrations match your search." : when === "today" ? "No celebrations today." : "No celebrations here yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {rows.map((c) => {
            const pct = (n: number) => (c.capacity ? Math.max(0, Math.min(100, (n / c.capacity) * 100)) : 0);
            const signedNotHere = Math.max(0, c.registered - c.checkedIn);
            const open = Math.max(0, c.capacity - c.registered);
            return (
              <Link
                key={c._id}
                href={`${base}/celebrations/${c._id}`}
                className="group rounded-2xl border border-[#C8A96A]/20 bg-gradient-to-b from-[#1a140c]/80 to-[#0a0705]/90 p-5 space-y-4 hover:border-[#E0C68E]/60 hover:shadow-[0_0_40px_-14px_rgba(224,184,110,0.6)] transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-[#E0C68E] font-bold capitalize">{nice(c.occasion)}</p>
                    <h2 className="text-xl font-headline font-bold truncate">{c.hostName}&apos;s party</h2>
                    <p className="text-xs text-white/55 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="w-3.5 h-3.5 text-[#C8A96A]" /> {dateLabel(c.date)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#C8A96A]" /> {formatTimeTo12Hour(c.startTime)}
                        {c.endTime ? ` – ${c.endTime}` : ""}
                      </span>
                      {c.hostPhone && (
                        <span className="inline-flex items-center gap-1 font-mono">
                          <Phone className="w-3.5 h-3.5 text-[#C8A96A]" /> {c.hostPhone}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-3xl font-bold tabular-nums text-[#F1D9A0] leading-none">
                      {c.checkedIn}
                      <span className="text-base text-white/40">/{c.capacity}</span>
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-white/45 font-bold mt-1">checked in</p>
                  </div>
                </div>

                <div
                  className="flex h-2.5 rounded-full overflow-hidden gap-[2px]"
                  style={{ background: C.open }}
                  role="img"
                  aria-label={`${c.checkedIn} checked in, ${signedNotHere} signed up not arrived, ${open} open of ${c.capacity} slots`}
                >
                  {c.checkedIn > 0 && <div style={{ width: `${pct(c.checkedIn)}%`, background: C.arrived }} />}
                  {signedNotHere > 0 && <div style={{ width: `${pct(signedNotHere)}%`, background: C.signed }} />}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-white/60">
                  <span className="inline-flex items-center gap-3">
                    <span className="inline-flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-[#E0C68E]" /> {c.checkedIn} arrived
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-[#7FB0E8]" /> {c.registered} signed up
                    </span>
                    {c.pendingApproval > 0 && <span className="text-amber-200">{c.pendingApproval} awaiting host</span>}
                  </span>
                  <span className="inline-flex items-center gap-1 text-white/45">
                    {c.lastCheckInAt ? `Last arrival ${timeLabel(c.lastCheckInAt)}` : "No arrivals yet"}
                    <ChevronRight className="w-4 h-4 text-[#C8A96A] group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
