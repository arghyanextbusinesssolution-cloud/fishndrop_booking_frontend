"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CheckCircle2, Loader2, Printer, Users } from "lucide-react";
import api from "@/lib/axios";
import { NavBar } from "@/components/shared/NavBar";
import { TicketVenueDetails, TicketBackButton } from "@/components/events/TicketVenueDetails";
import { LoungeBackdrop } from "@/components/auth/TropicaAuthShell";

const QrCodeCard = dynamic(() => import("@/components/shared/QrCodeCard"), { ssr: false });

interface GroupPass {
  groupQrToken: string;
  orderNumber: string;
  customerName: string;
  total: number;
  checkedIn: number;
  event?: {
    title: string;
    slug: string;
    date: string;
    startTime: string;
    endTime: string;
    venueName: string;
    venueAddress: string;
    venueType?: "tropica" | "external";
    venueLat?: number;
    venueLng?: number;
  };
  tickets: Array<{ ticketCode: string; tierName: string; checkedIn: boolean }>;
}

export default function GroupPassPage() {
  const params = useParams();
  const token = String(params?.token || "");
  const [pass, setPass] = useState<GroupPass | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    const load = () =>
      api
        .get(`/tickets/group/${token}`)
        .then(({ data }) => setPass(data.pass))
        .catch((err) => setError(err.response?.data?.message || "Group pass not found"));
    void load();
    const id = setInterval(load, 20_000); // live "x of y admitted"
    return () => clearInterval(id);
  }, [token]);

  if (error) {
    return (
      <div className="relative isolate min-h-screen bg-[#0b0704] flex flex-col items-center justify-center gap-3 p-6 pt-28 text-center text-white">
        <LoungeBackdrop behind />
        <NavBar />
        <h1 className="text-xl font-bold">Group pass unavailable</h1>
        <p className="text-xs text-white/60 max-w-sm">{error}</p>
        <Link href="/user/tickets" className="text-xs text-[#C8A96A] underline">
          Go to my tickets
        </Link>
      </div>
    );
  }

  if (!pass) {
    return (
      <div className="relative isolate min-h-screen bg-[#0b0704] flex items-center justify-center">
        <LoungeBackdrop behind />
        <NavBar />
        <Loader2 className="w-8 h-8 animate-spin text-[#C8A96A]" />
      </div>
    );
  }

  const allIn = pass.checkedIn >= pass.total;
  const tiers = pass.tickets.reduce<Record<string, number>>((m, t) => ((m[t.tierName] = (m[t.tierName] || 0) + 1), m), {});

  return (
    <div className="relative isolate min-h-screen bg-[#0b0704] text-white pt-24 md:pt-28 pb-10 px-4 print:pt-4">
      <LoungeBackdrop behind />
      <div className="print:hidden">
        <NavBar />
      </div>
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center justify-between print:hidden">
          <TicketBackButton />
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 text-xs text-white bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> Print / Save Pass
          </button>
        </div>

        <div className="text-center space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-[#C8A96A]">Group admission pass</span>
          <h1 className="text-2xl font-headline italic">{pass.event?.title}</h1>
        </div>

        <div className="rounded-3xl border border-[#C8A96A]/30 bg-white/[0.03] p-6 space-y-5 shadow-2xl">
          <div className="flex items-center justify-center gap-2 text-sm font-bold">
            <Users className="w-5 h-5 text-[#C8A96A]" />
            Admits {pass.total} {pass.total === 1 ? "person" : "people"}
          </div>

          <div className={`mx-auto w-fit rounded-2xl bg-white p-3 ${allIn ? "opacity-30" : ""}`}>
            <QrCodeCard value={pass.groupQrToken} size={240} />
          </div>

          <div
            className={`rounded-xl px-4 py-2.5 text-center text-xs font-semibold ${
              allIn
                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                : pass.checkedIn > 0
                ? "bg-amber-400/10 text-amber-200 border border-amber-400/30"
                : "bg-white/5 text-white/70 border border-white/10"
            }`}
          >
            {allIn
              ? `Everyone is checked in (${pass.total}/${pass.total})`
              : pass.checkedIn > 0
              ? `${pass.checkedIn} of ${pass.total} already inside. Scanning admits the remaining ${pass.total - pass.checkedIn}.`
              : "Show this QR at the door. One scan admits your whole group."}
          </div>

          <div className="text-center text-xs text-white/60 space-y-0.5">
            <p className="font-semibold text-white">{pass.customerName}</p>
            <p>{Object.entries(tiers).map(([n, c]) => `${c}× ${n}`).join(" · ")}</p>
            <p className="font-mono text-[11px] text-[#C8A96A]">{pass.orderNumber}</p>
          </div>

          {pass.event && <TicketVenueDetails event={pass.event} />}
        </div>

        <details className="rounded-xl border border-white/10 bg-white/[0.02] text-xs">
          <summary className="px-4 py-3 cursor-pointer text-white/70">Tickets in this pass ({pass.total})</summary>
          <ul className="divide-y divide-white/5">
            {pass.tickets.map((t) => (
              <li key={t.ticketCode} className="px-4 py-2 flex justify-between">
                <span>
                  {t.tierName} <span className="font-mono text-white/40">{t.ticketCode}</span>
                </span>
                {t.checkedIn ? (
                  <span className="inline-flex items-center gap-1 text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5" /> In
                  </span>
                ) : (
                  <span className="text-white/40">Not yet</span>
                )}
              </li>
            ))}
          </ul>
        </details>

        <p className="text-center text-[11px] text-white/40">Keep your screen brightness up when scanning.</p>
      </div>
    </div>
  );
}
