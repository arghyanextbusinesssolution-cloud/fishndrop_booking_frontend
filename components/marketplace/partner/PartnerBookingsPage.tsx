"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CalendarCheck, Clock, Loader2, Mail, MessageSquare, Phone, Users } from "lucide-react";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";
import { OwnerBooking, PortalHeader, STATUS_LABEL, Tabs, apiError, dateLabel, money, time12 } from "./shared";

type Scope = "upcoming" | "past";

/** Venue owner: paid bookings at their venue, with the customer's contact details. */
export default function PartnerBookingsPage() {
  const [scope, setScope] = useState<Scope>("upcoming");
  const [data, setData] = useState<{ scope: Scope; bookings: OwnerBooking[] } | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/marketplace/partner/bookings", { params: { scope } })
      .then(({ data }) => !cancelled && setData({ scope, bookings: data.bookings || [] }))
      .catch((err) => {
        if (cancelled) return;
        toast.error(apiError(err, "Couldn't load bookings"));
        setData({ scope, bookings: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [scope]);

  const loading = !data || data.scope !== scope;

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-6 min-h-screen">
      <PortalHeader title="Bookings" subtitle="Confirmed, paid bookings at your venue. These dates are blocked on your calendar automatically." />

      <Tabs
        value={scope}
        onChange={setScope}
        options={[
          { value: "upcoming", label: "Upcoming" },
          { value: "past", label: "Past" }
        ]}
      />

      {loading && (
        <p className="flex items-center gap-2 text-white/60 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </p>
      )}

      {!loading && data.bookings.length === 0 && (
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-10 text-center space-y-2">
          <CalendarCheck className="w-10 h-10 text-[#C8A96A] mx-auto" />
          <p className="text-white font-semibold">{scope === "upcoming" ? "No upcoming bookings yet" : "No past bookings"}</p>
          <p className="text-sm text-white/50">A booking appears here once the customer has paid.</p>
        </div>
      )}

      <div className="space-y-3">
        {!loading &&
          data.bookings.map((b) => {
            const s = STATUS_LABEL[b.status];
            return (
              <div key={b._id} className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 grid md:grid-cols-[140px_1fr_auto] gap-4 items-start">
                <div className="rounded-xl bg-[#C8A96A]/10 border border-[#C8A96A]/30 p-3 text-center">
                  <p className="text-[10px] uppercase tracking-widest text-[#C8A96A]">{dateLabel(b.date, "EEE")}</p>
                  <p className="text-3xl font-headline text-white leading-none my-1">{dateLabel(b.date, "d")}</p>
                  <p className="text-[11px] text-white/60">{dateLabel(b.date, "MMM yyyy")}</p>
                </div>
                <div className="space-y-2 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-bold text-white">{b.customerName}</p>
                    <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider", s.cls)}>{s.label}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-white/60">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {time12(b.startTime)} – {time12(b.endTime)}</span>
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {b.guests} guests</span>
                    {b.customerPhone && (
                      <a href={`tel:${b.customerPhone}`} className="flex items-center gap-1 text-[#C8A96A]"><Phone className="w-3.5 h-3.5" /> {b.customerPhone}</a>
                    )}
                    {b.customerEmail && (
                      <a href={`mailto:${b.customerEmail}`} className="flex items-center gap-1 text-[#C8A96A] truncate"><Mail className="w-3.5 h-3.5" /> {b.customerEmail}</a>
                    )}
                  </div>
                  {(b.occasion || b.packageName) && (
                    <p className="text-xs text-white/50 capitalize">{[b.packageName, b.occasion?.replace(/_/g, " ")].filter(Boolean).join(" · ")}</p>
                  )}
                  {b.notes && (
                    <p className="text-xs text-white/60 flex gap-1.5"><MessageSquare className="w-3.5 h-3.5 text-[#C8A96A] shrink-0" /> {b.notes}</p>
                  )}
                  {b.status === "cancelled" && b.cancelReason && <p className="text-xs text-rose-300">Cancelled: {b.cancelReason}</p>}
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-widest text-white/40">Your payout</p>
                  <p className="text-xl font-bold text-[#C8A96A]">{money(b.venuePayout)}</p>
                  <p className="text-[11px] text-white/40">#{b.bookingNumber}</p>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
