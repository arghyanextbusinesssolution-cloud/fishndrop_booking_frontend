"use client";

import { useCallback, useEffect, useState } from "react";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Database,
  Download,
  Loader2,
  Mail,
  Phone,
  Search,
  ShieldCheck,
  X
} from "lucide-react";
import api from "@/lib/axios";

type Source = "venue_host" | "table_guest" | "event_buyer" | "party_guest" | "promoter" | "account";

interface Activity {
  type: string;
  title: string;
  date: string;
  eventDate?: string;
  amount?: number;
  status?: string;
  attended?: boolean;
}

interface Contact {
  key: string;
  name: string;
  email: string;
  phone: string;
  sources: Source[];
  hasAccount: boolean;
  firstSeen: string;
  lastActivityAt: string;
  lastActivity: string;
  lastEvent?: { title: string; date: string };
  nextEvent?: { title: string; date: string };
  venueBookings: number;
  tableBookings: number;
  eventOrders: number;
  ticketsBought: number;
  partiesJoined: number;
  checkIns: number;
  totalSpent: number;
  guestOf: string[];
  marketingConsent: boolean;
  utmSource?: string;
  utmCampaign?: string;
  activities: Activity[];
}

interface Summary {
  total: number;
  withEmail: number;
  withPhone: number;
  venueHosts: number;
  tableGuests: number;
  eventBuyers: number;
  partyGuests: number;
  promoters: number;
  consented: number;
  totalRevenue: number;
}

const SOURCES: Array<[Source | "all", string]> = [
  ["all", "Everyone"],
  ["venue_host", "Venue hosts"],
  ["party_guest", "Party guests"],
  ["event_buyer", "Event ticket buyers"],
  ["table_guest", "Table bookings"],
  ["promoter", "Promoters"],
  ["account", "Account only"]
];
const TAG: Record<Source, { label: string; cls: string }> = {
  venue_host: { label: "Venue host", cls: "bg-[#C8A96A]/15 text-[#E0C68E]" },
  party_guest: { label: "Party guest", cls: "bg-sky-500/15 text-sky-300" },
  event_buyer: { label: "Event buyer", cls: "bg-fuchsia-500/15 text-fuchsia-300" },
  table_guest: { label: "Table", cls: "bg-emerald-500/15 text-emerald-300" },
  promoter: { label: "Promoter", cls: "bg-orange-500/15 text-orange-300" },
  account: { label: "Account only", cls: "bg-white/10 text-white/60" }
};
const SORTS = [
  ["recent", "Latest activity"],
  ["spent", "Most spent"],
  ["visits", "Most visits"],
  ["newest", "Newest contacts"],
  ["name", "Name A–Z"]
] as const;

const money = (n: number) => `$${(n || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const day = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) : "—";

export default function AdminDataCenterPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [contacts, setContacts] = useState<Contact[] | null>(null);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [source, setSource] = useState<Source | "all">("all");
  const [sort, setSort] = useState<(typeof SORTS)[number][0]>("recent");
  const [consentOnly, setConsentOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [open, setOpen] = useState<Contact | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);
  useEffect(() => setPage(1), [debouncedQ, source, sort, consentOnly]);

  const params = useCallback(
    () => ({ q: debouncedQ, source, sort, consent: consentOnly ? "1" : undefined }),
    [debouncedQ, source, sort, consentOnly]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get("/admin/data-center", { params: { ...params(), page, limit: 25 } })
      .then(({ data }) => {
        if (cancelled) return;
        setSummary(data.summary);
        setContacts(data.contacts);
        setTotal(data.total);
        setPages(data.pages);
      })
      .catch((err) => !cancelled && toast.error(err.response?.data?.message || "Could not load the Data Center"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [params, page]);

  /** CSV of the current filter: every page, not just the visible one. */
  const exportCsv = async () => {
    setExporting(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || "/api";
      const qs = new URLSearchParams(Object.entries(params()).filter(([, v]) => v) as [string, string][]).toString();
      const res = await fetch(`${base}/admin/data-center/export?${qs}`, { headers: { Authorization: `Bearer ${Cookies.get("token")}` } });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `tropica-contacts-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success(`Exported ${total} contacts`);
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  const tiles: Array<[string, number | string, string?]> = summary
    ? [
        ["Contacts", summary.total, `${summary.withEmail} with email · ${summary.withPhone} with phone`],
        ["Venue hosts", summary.venueHosts],
        ["Party guests", summary.partyGuests],
        ["Event buyers", summary.eventBuyers],
        ["Marketing consent", summary.consented, "Opted in on a booking"],
        ["Lifetime revenue", money(summary.totalRevenue), "Paid bookings + tickets"]
      ]
    : [];

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-7xl mx-auto text-white space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-[#C8A96A] font-bold inline-flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5" /> Marketing
          </p>
          <h1 className="text-3xl font-headline italic">Data Center</h1>
          <p className="text-xs text-white/50 mt-1">
            Every customer in one place: hosts, party guests, ticket buyers and table guests, merged by phone number.
          </p>
        </div>
        <button
          onClick={exportCsv}
          disabled={exporting || !total}
          className="self-start inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#C8A96A] hover:bg-[#d8b97a] text-[#0d1612] text-xs font-black uppercase tracking-wider disabled:opacity-40 cursor-pointer"
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Export CSV ({total})
        </button>
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {tiles.map(([label, value, sub]) => (
            <div key={label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] uppercase tracking-[0.15em] text-white/50 font-bold">{label}</p>
              <p className="mt-1.5 text-2xl font-bold tabular-nums">{value}</p>
              {sub && <p className="text-[10px] text-white/40 mt-0.5">{sub}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <label className="flex items-center gap-2 flex-1 rounded-xl bg-black/30 border border-white/10 focus-within:border-[#C8A96A] px-3">
            <Search className="w-4 h-4 text-white/40" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, email, phone or host…"
              className="flex-1 bg-transparent py-2.5 text-sm outline-none placeholder:text-white/30"
              aria-label="Search contacts"
            />
          </label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 text-sm text-white cursor-pointer"
            aria-label="Sort contacts"
          >
            {SORTS.map(([v, l]) => (
              <option key={v} value={v} className="bg-[#0c1612]">
                {l}
              </option>
            ))}
          </select>
          <label className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-xs text-white/80 cursor-pointer">
            <input type="checkbox" checked={consentOnly} onChange={(e) => setConsentOnly(e.target.checked)} className="accent-[#C8A96A]" />
            Marketing consent only
          </label>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {SOURCES.map(([v, l]) => (
            <button
              key={v}
              onClick={() => setSource(v)}
              className={`shrink-0 px-3 py-2 rounded-lg text-[11px] uppercase tracking-wider font-bold border transition-colors cursor-pointer ${
                source === v ? "border-[#C8A96A] bg-[#C8A96A]/15 text-[#E0C68E]" : "border-white/10 text-white/50 hover:text-white hover:border-white/30"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-10">
            <Loader2 className="w-6 h-6 animate-spin text-[#C8A96A]" />
          </div>
        )}
        {contacts && contacts.length === 0 ? (
          <p className="p-10 text-center text-sm text-white/50">No contacts match.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[980px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-white/45 border-b border-white/10 text-left">
                  <th className="px-4 py-3 font-bold">Contact</th>
                  <th className="px-4 py-3 font-bold">Tags</th>
                  <th className="px-4 py-3 font-bold">Last event</th>
                  <th className="px-4 py-3 font-bold">Last activity</th>
                  <th className="px-4 py-3 font-bold text-right">Bookings / tickets / parties</th>
                  <th className="px-4 py-3 font-bold text-right">Spent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {(contacts || []).map((c) => (
                  <tr key={c.key} onClick={() => setOpen(c)} className="hover:bg-white/[0.03] cursor-pointer align-top">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-white text-sm flex items-center gap-1.5">
                        {c.name || <span className="text-white/40 italic">No name</span>}
                        {c.marketingConsent && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" aria-label="Marketing consent" />}
                      </p>
                      {c.email && <p className="text-white/55">{c.email}</p>}
                      {c.phone && <p className="text-white/45 font-mono">{c.phone}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-[220px]">
                        {c.sources.map((s) => (
                          <span key={s} className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${TAG[s].cls}`}>
                            {TAG[s].label}
                          </span>
                        ))}
                      </div>
                      {c.guestOf.length > 0 && <p className="text-[10px] text-white/40 mt-1">Guest of {c.guestOf.slice(0, 3).join(", ")}</p>}
                    </td>
                    <td className="px-4 py-3 max-w-[220px]">
                      {c.lastEvent ? (
                        <>
                          <p className="text-white/85 line-clamp-2">{c.lastEvent.title}</p>
                          <p className="text-white/40">{day(c.lastEvent.date)}</p>
                        </>
                      ) : (
                        <span className="text-white/30">—</span>
                      )}
                      {c.nextEvent && <p className="text-[10px] text-[#E0C68E] mt-1">Next: {day(c.nextEvent.date)}</p>}
                    </td>
                    <td className="px-4 py-3 max-w-[220px]">
                      <p className="text-white/75 line-clamp-2">{c.lastActivity}</p>
                      <p className="text-white/40">{day(c.lastActivityAt)}</p>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-white/75">
                      {c.venueBookings + c.tableBookings} / {c.ticketsBought} / {c.partiesJoined}
                      {c.checkIns > 0 && <p className="text-[10px] text-emerald-300">{c.checkIns} check-ins</p>}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold">{c.totalSpent ? money(c.totalSpent) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 text-xs text-white/60">
          <span>
            {total} contact{total === 1 ? "" : "s"} · page {page} of {pages}
          </span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="p-1.5 rounded-lg border border-white/10 disabled:opacity-30 cursor-pointer" aria-label="Previous page">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="p-1.5 rounded-lg border border-white/10 disabled:opacity-30 cursor-pointer" aria-label="Next page">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Contact drawer */}
      {open && (
        <div className="fixed inset-0 z-[80] flex justify-end bg-black/60" onClick={() => setOpen(null)} role="dialog" aria-modal="true" aria-label="Contact details">
          <div onClick={(e) => e.stopPropagation()} className="w-full sm:max-w-md h-full overflow-y-auto bg-[#0c1612] border-l border-[#C8A96A]/25 p-6 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-headline italic">{open.name || "No name"}</h2>
                <div className="flex flex-wrap gap-1 mt-2">
                  {open.sources.map((s) => (
                    <span key={s} className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${TAG[s].cls}`}>
                      {TAG[s].label}
                    </span>
                  ))}
                </div>
              </div>
              <button onClick={() => setOpen(null)} aria-label="Close" className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-sm">
              {open.email && (
                <a href={`mailto:${open.email}`} className="flex items-center gap-2 text-white/80 hover:text-[#E0C68E]">
                  <Mail className="w-4 h-4 text-[#C8A96A]" /> {open.email}
                </a>
              )}
              {open.phone && (
                <a href={`tel:${open.phone}`} className="flex items-center gap-2 text-white/80 hover:text-[#E0C68E] font-mono">
                  <Phone className="w-4 h-4 text-[#C8A96A]" /> {open.phone}
                </a>
              )}
              <p className="flex items-center gap-2 text-white/60 text-xs">
                <ShieldCheck className={`w-4 h-4 ${open.marketingConsent ? "text-emerald-400" : "text-white/30"}`} />
                {open.marketingConsent ? "Gave marketing consent" : "No marketing consent recorded"}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              {(
                [
                  ["Spent", money(open.totalSpent)],
                  ["Check-ins", open.checkIns],
                  ["Parties joined", open.partiesJoined],
                  ["Venue bookings", open.venueBookings],
                  ["Table bookings", open.tableBookings],
                  ["Tickets", open.ticketsBought]
                ] as const
              ).map(([l, v]) => (
                <div key={l} className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
                  <p className="text-lg font-bold tabular-nums">{v}</p>
                  <p className="text-[10px] text-white/45">{l}</p>
                </div>
              ))}
            </div>

            <div className="text-xs text-white/55 space-y-1">
              <p>First seen: {day(open.firstSeen)}</p>
              <p>Account: {open.hasAccount ? "Yes" : "No (booked or joined without signing up)"}</p>
              {open.guestOf.length > 0 && <p>Guest of: {open.guestOf.join(", ")}</p>}
              {open.utmSource && (
                <p>
                  Came from: {open.utmSource}
                  {open.utmCampaign ? ` · ${open.utmCampaign}` : ""}
                </p>
              )}
            </div>

            <div>
              <h3 className="text-xs uppercase tracking-widest text-white/50 font-bold mb-2">History</h3>
              <ol className="space-y-2">
                {open.activities.map((a, i) => (
                  <li key={i} className="rounded-lg border border-white/10 bg-white/[0.02] p-3 text-xs">
                    <p className="text-white/85">{a.title}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-white/45">
                      <span>{day(a.date)}</span>
                      {a.eventDate && (
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" /> Event {day(a.eventDate)}
                        </span>
                      )}
                      {a.amount ? <span>{money(a.amount)}</span> : null}
                      {a.status && <span className="capitalize">{a.status.replace(/_/g, " ")}</span>}
                      {a.attended && (
                        <span className="inline-flex items-center gap-1 text-emerald-300">
                          <CheckCircle2 className="w-3 h-3" /> Attended
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
