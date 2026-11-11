"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Copy,
  CreditCard,
  ExternalLink,
  Loader2,
  Mail,
  Pencil,
  Phone,
  RefreshCw,
  Search,
  Sparkles,
  User as UserIcon,
  UserCheck,
  XCircle
} from "lucide-react";
import api from "@/lib/axios";
import { formatTimeTo12Hour, toCurrentSiteUrl } from "@/lib/utils";
import { CATERING_LABEL_MAP } from "@/lib/cateringRestaurants";
import { EditBookingModal } from "@/components/admin/EditBookingModal";

interface Guest {
  _id: string;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  passCode: string;
  status: "approved" | "pending_approval" | "rejected" | "cancelled";
  checkedIn: boolean;
  checkedInAt?: string;
  checkedInByName?: string;
  createdAt: string;
}

interface Stats {
  capacity: number;
  signedUp: number;
  approved: number;
  pendingApproval: number;
  rejected: number;
  spotsLeft: number;
  arrived: number;
  notArrived: number;
  signUpRate: number;
  attendanceRate: number;
}

interface Overview {
  booking: any;
  inviteLink: string | null;
  invitesActive: boolean;
  stats: Stats;
  guests: Guest[];
}

type GuestFilter = "all" | "arrived" | "not_arrived" | "pending";

/* Validated chart tokens on the dark surface (same as Events analytics) */
const C = { arrived: "#B8872A", signed: "#4A86CF", open: "#2a3b33", surface: "#0c1a14" };

const money = (n?: number) => `$${(Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const nice = (s?: string) => (s || "").replace(/_/g, " ");

function Tile({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-[10px] uppercase tracking-[0.15em] text-white/50 font-bold">{label}</p>
      <p className="mt-1.5 text-3xl font-bold tabular-nums" style={{ color: accent || "#fff" }}>
        {value}
      </p>
      {sub && <p className="text-[11px] text-white/45 mt-0.5">{sub}</p>}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-white/5 last:border-0 text-sm">
      <span className="text-white/50 shrink-0">{label}</span>
      <span className="text-right text-white min-w-0 break-words">{children}</span>
    </div>
  );
}

export default function BookingDetailPage() {
  const params = useParams();
  const pathname = usePathname() || "";
  const router = useRouter();
  const id = String(params?.id || "");
  const base = pathname.startsWith("/employee") ? "/employee" : "/admin";

  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<GuestFilter>("all");
  const [editing, setEditing] = useState(false);

  const load = useCallback(
    async (quiet = false) => {
      if (!quiet) setRefreshing(true);
      try {
        const { data } = await api.get(`/admin/bookings/${id}/overview`);
        setData({ ...data, inviteLink: data.inviteLink ? toCurrentSiteUrl(data.inviteLink) : null });
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || "Could not load this booking");
      } finally {
        setRefreshing(false);
      }
    },
    [id]
  );

  useEffect(() => {
    if (!id) return;
    void load(true);
    const t = setInterval(() => void load(true), 30_000); // live door attendance
    return () => clearInterval(t);
  }, [id, load]);

  const guests = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data?.guests || []).filter((g) => {
      if (filter === "arrived" && !g.checkedIn) return false;
      if (filter === "not_arrived" && (g.checkedIn || g.status !== "approved")) return false;
      if (filter === "pending" && g.status !== "pending_approval") return false;
      if (!q) return true;
      return `${g.guestName} ${g.guestPhone} ${g.guestEmail || ""} ${g.passCode}`.toLowerCase().includes(q);
    });
  }, [data, query, filter]);

  if (error) {
    return (
      <div className="p-6 md:p-10 max-w-3xl mx-auto text-white space-y-4">
        <button onClick={() => router.push(`${base}/bookings`)} className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> Back to bookings
        </button>
        <p className="text-rose-300">{error}</p>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="py-32 flex justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-[#C8A96A]" />
      </div>
    );
  }

  const b = data.booking;
  const s = data.stats;
  const isPrivate = b.bookingType === "private_event";
  const pct = (n: number) => (s.capacity ? Math.max(0, Math.min(100, (n / s.capacity) * 100)) : 0);
  const paid = Math.max(0, (b.totalAmount || 0) - (b.remainingAmount || 0));
  const statusCls =
    b.status === "confirmed" ? "bg-emerald-500/15 text-emerald-300" : b.status === "cancelled" ? "bg-rose-500/15 text-rose-300" : "bg-amber-500/15 text-amber-300";

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-6xl mx-auto text-white space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-2">
          <button onClick={() => router.push(`${base}/bookings`)} className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white cursor-pointer">
            <ArrowLeft className="w-4 h-4" /> Back to bookings
          </button>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-[#C8A96A]/15 text-[#E0C68E]">
              {isPrivate ? "Venue booking" : "Table booking"}
            </span>
            <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full ${statusCls}`}>{b.status}</span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-white/10 text-white/70">{nice(b.paymentStatus)}</span>
          </div>
          <h1 className="text-3xl font-headline italic">
            {b.customerName || b.user?.name}
            {isPrivate && b.occasion && <span className="text-[#E0C68E] capitalize"> · {nice(b.occasion)}</span>}
          </h1>
          <p className="text-xs text-white/45 font-mono">Booking #{String(b._id).slice(-6).toUpperCase()} · {b._id}</p>
        </div>
        <div className="self-start flex gap-2">
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 text-xs font-bold bg-[#C8A96A]/15 hover:bg-[#C8A96A]/25 text-[#E0C68E] border border-[#C8A96A]/40 px-3 py-2 rounded-lg cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5" /> Edit booking
          </button>
          <button
            onClick={() => load()}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2 rounded-lg cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      {editing && <EditBookingModal booking={b} onClose={() => setEditing(false)} onSaved={() => void load(true)} />}

      {/* Guests & attendance (venue bookings) */}
      {isPrivate && (
        <section className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <Tile label="Total slots" value={s.capacity} sub="Guests paid for" />
            <Tile label="Signed up" value={s.signedUp} sub={`${s.signUpRate}% of slots`} accent="#7FB0E8" />
            <Tile label="Still needed" value={s.spotsLeft} sub="Open spots to fill" accent={s.spotsLeft ? "#E0C68E" : "#6EE7B7"} />
            <Tile label="Arrived" value={s.arrived} sub={s.approved ? `${s.attendanceRate}% of approved` : "No guests yet"} accent="#E0C68E" />
            <Tile label="Not arrived yet" value={s.notArrived} sub={s.pendingApproval ? `${s.pendingApproval} awaiting host` : "Approved, not scanned"} />
          </div>

          {/* Slots bar: arrived / signed up / open */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-sm font-bold">Slots &amp; attendance</h2>
              <div className="flex gap-4 text-[11px] text-white/70">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: C.arrived }} /> Arrived ({s.arrived})
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: C.signed }} /> Signed up, not here ({Math.max(0, s.signedUp - s.arrived)})
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: C.open }} /> Open ({s.spotsLeft})
                </span>
              </div>
            </div>
            <div
              className="flex h-4 rounded-full overflow-hidden gap-[2px]"
              style={{ background: C.surface }}
              role="img"
              aria-label={`${s.arrived} arrived, ${Math.max(0, s.signedUp - s.arrived)} signed up not arrived, ${s.spotsLeft} open of ${s.capacity} slots`}
            >
              {s.arrived > 0 && <div style={{ width: `${pct(s.arrived)}%`, background: C.arrived }} />}
              {s.signedUp - s.arrived > 0 && <div style={{ width: `${pct(s.signedUp - s.arrived)}%`, background: C.signed }} />}
              {s.spotsLeft > 0 && <div style={{ width: `${pct(s.spotsLeft)}%`, background: C.open }} />}
            </div>
            <p className="text-[11px] text-white/45">
              {s.signedUp} of {s.capacity} slots signed up · {s.arrived} checked in at the door · updates every 30 seconds
            </p>
            {data.inviteLink && (
              <div className="flex items-center gap-2 pt-1">
                <input readOnly value={data.inviteLink} className="flex-1 min-w-0 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-[11px] font-mono text-white/70" />
                <button
                  onClick={() => navigator.clipboard.writeText(data.inviteLink!).then(() => toast.success("Invite link copied"))}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy
                </button>
              </div>
            )}
            {!data.invitesActive && <p className="text-[11px] text-amber-200">Invites are off until the deposit is paid (or a Zelle screenshot is submitted).</p>}
          </div>

          {/* Guest list */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
            <div className="p-4 border-b border-white/10 flex flex-col md:flex-row gap-3 md:items-center justify-between">
              <h2 className="text-sm font-bold">Guest list ({data.guests.length})</h2>
              <div className="flex flex-col sm:flex-row gap-2">
                <label className="flex items-center gap-2 rounded-lg bg-black/30 border border-white/10 focus-within:border-[#C8A96A] px-3">
                  <Search className="w-3.5 h-3.5 text-white/40" />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name, phone, pass…" className="bg-transparent py-2 text-xs outline-none w-44" />
                </label>
                <div className="flex gap-1 overflow-x-auto">
                  {(
                    [
                      ["all", "All"],
                      ["arrived", "Arrived"],
                      ["not_arrived", "Not arrived"],
                      ["pending", "Awaiting host"]
                    ] as const
                  ).map(([k, l]) => (
                    <button
                      key={k}
                      onClick={() => setFilter(k)}
                      className={`shrink-0 px-3 py-2 rounded-lg text-[11px] font-bold border cursor-pointer ${
                        filter === k ? "border-[#C8A96A] bg-[#C8A96A]/15 text-[#E0C68E]" : "border-white/10 text-white/50 hover:text-white"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {guests.length === 0 ? (
              <p className="p-8 text-center text-xs text-white/45">
                {data.guests.length === 0 ? "No guests have signed up from the invite link yet." : "No guests match this filter."}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[720px]">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wider text-white/45 border-b border-white/10 text-left">
                      <th className="px-4 py-3 font-bold">#</th>
                      <th className="px-4 py-3 font-bold">Guest</th>
                      <th className="px-4 py-3 font-bold">Phone</th>
                      <th className="px-4 py-3 font-bold">Pass</th>
                      <th className="px-4 py-3 font-bold">Status</th>
                      <th className="px-4 py-3 font-bold">Attendance</th>
                      <th className="px-4 py-3 font-bold">Signed up</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {guests.map((g, i) => (
                      <tr key={g._id} className="hover:bg-white/[0.02]">
                        <td className="px-4 py-3 text-white/40 tabular-nums">{i + 1}</td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-white">{g.guestName}</p>
                          {g.guestEmail && <p className="text-white/40">{g.guestEmail}</p>}
                        </td>
                        <td className="px-4 py-3 font-mono text-white/70">
                          <a href={`tel:${g.guestPhone}`} className="hover:text-white">
                            {g.guestPhone}
                          </a>
                        </td>
                        <td className="px-4 py-3 font-mono text-[#C8A96A]">{g.passCode}</td>
                        <td className="px-4 py-3">
                          {g.status === "approved" ? (
                            <span className="text-emerald-300">Approved</span>
                          ) : g.status === "pending_approval" ? (
                            <span className="text-amber-300">Awaiting host</span>
                          ) : g.status === "cancelled" ? (
                            <span className="text-white/50">Not attending</span>
                          ) : (
                            <span className="text-rose-300 inline-flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" /> Rejected
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {g.checkedIn ? (
                            <span className="inline-flex items-center gap-1 text-[#E0C68E] font-semibold">
                              <UserCheck className="w-3.5 h-3.5" />
                              {g.checkedInAt ? new Date(g.checkedInAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "Arrived"}
                              {g.checkedInByName && <span className="font-normal text-white/40"> · {g.checkedInByName}</span>}
                            </span>
                          ) : (
                            <span className="text-white/35">Not arrived</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-white/45">
                          {new Date(g.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Booking details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-sm font-bold mb-2 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-[#C8A96A]" /> Event
          </h2>
          <Row label="Date">
            {new Date(b.bookingDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}
          </Row>
          <Row label="Time">
            {formatTimeTo12Hour(b.bookingTime)}
            {b.eventEndTime ? ` – ${b.eventEndTime}` : ""}
          </Row>
          {isPrivate && <Row label="Duration">{b.durationHours} hours</Row>}
          <Row label="Guests">{b.partySize}</Row>
          {!isPrivate && <Row label="Tables">{(b.tables || []).map((t: any) => `T-${t.tableNumber}`).join(", ") || "—"}</Row>}
          {isPrivate && <Row label="Occasion">{nice(b.occasion) || "—"}</Row>}
          {b.complimentaryDrinks ? <Row label="Complimentary drinks">{b.complimentaryDrinks}</Row> : null}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-sm font-bold mb-2 flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-[#C8A96A]" /> Host / customer
          </h2>
          <Row label="Name">{b.customerName || b.user?.name || "—"}</Row>
          <Row label="Phone">
            {b.customerPhone ? (
              <a href={`tel:${b.customerPhone}`} className="inline-flex items-center gap-1 hover:text-[#E0C68E]">
                <Phone className="w-3.5 h-3.5" /> {b.customerPhone}
              </a>
            ) : (
              "—"
            )}
          </Row>
          <Row label="Email">
            {b.customerEmail ? (
              <a href={`mailto:${b.customerEmail}`} className="inline-flex items-center gap-1 hover:text-[#E0C68E]">
                <Mail className="w-3.5 h-3.5" /> {b.customerEmail}
              </a>
            ) : (
              "—"
            )}
          </Row>
          {b.couponCode && <Row label="Coupon">{b.couponCode}{b.promoterName ? ` (${b.promoterName})` : ""}</Row>}
          {b.notes && <Row label="Notes">{b.notes}</Row>}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-sm font-bold mb-2 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#C8A96A]" /> Payment
          </h2>
          <Row label="Total">{money(b.totalAmount)}</Row>
          {b.discountApplied ? <Row label="Discount">−{money(b.discountApplied)}</Row> : null}
          <Row label="Paid">{money(paid)}</Row>
          <Row label="Remaining">{money(b.remainingAmount)}</Row>
          <Row label="Method">{b.paymentMethod === "zelle" ? "Zelle" : "Card"}</Row>
          {b.paymentMethod === "zelle" && <Row label="Zelle status">{nice(b.zelleVerificationStatus) || "—"}</Row>}
          {b.zelleProofUrl && (
            <Row label="Zelle screenshot">
              <a href={b.zelleProofUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#E0C68E] hover:underline">
                View <ExternalLink className="w-3 h-3" />
              </a>
            </Row>
          )}
          {b.zelleNotes && <Row label="Zelle note">{b.zelleNotes}</Row>}
        </div>
      </div>

      {isPrivate && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#C8A96A]" /> Add-ons
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="rounded-lg bg-black/20 border border-white/10 p-3">
              <p className="text-white/45">DJ</p>
              <p className="font-semibold mt-0.5">{b.needDj ? "Yes" : "No"}</p>
            </div>
            <div className="rounded-lg bg-black/20 border border-white/10 p-3">
              <p className="text-white/45">Photographer</p>
              <p className="font-semibold mt-0.5">{b.needPhotographer ? `Yes · ${b.photographerHours || 2}h` : "No"}</p>
            </div>
            <div className="rounded-lg bg-black/20 border border-white/10 p-3">
              <p className="text-white/45">Catering</p>
              <p className="font-semibold mt-0.5">{CATERING_LABEL_MAP[b.cateringMenu] || nice(b.cateringMenu) || "None"}</p>
            </div>
            <div className="rounded-lg bg-black/20 border border-white/10 p-3">
              <p className="text-white/45">Decoration</p>
              <p className="font-semibold mt-0.5">{b.needDecoration ? nice(b.decorationStyle) || "Yes" : "No"}</p>
            </div>
          </div>
        </div>
      )}

      <p className="text-[11px] text-white/35 flex items-center gap-1.5">
        <CheckCircle2 className="w-3.5 h-3.5" /> Guests are marked as arrived when staff scan their pass in{" "}
        <Link href={`${base}/check-in`} className="underline hover:text-white">
          Door QR Check-In
        </Link>
        .
      </p>
    </div>
  );
}
