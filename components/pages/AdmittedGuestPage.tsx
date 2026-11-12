"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  PartyPopper,
  Phone,
  ScanLine,
  ShieldCheck,
  Ticket,
  User as UserIcon,
  Users
} from "lucide-react";
import api from "@/lib/axios";
import { formatTimeTo12Hour } from "@/lib/utils";

interface Admission {
  kind: "guest_pass" | "ticket" | "group";
  person: { name: string; phone: string; email: string; memberSince: string | null; phoneVerified: boolean };
  pass: { code: string; status: string; label: string };
  checkIn: { checkedIn: boolean; at: string | null; by: string };
  group?: { size: number; inside: number };
  event: {
    kind: "celebration" | "event";
    bookingId?: string;
    title: string;
    hostName: string;
    hostPhone: string;
    date: string;
    startTime: string;
    endTime: string;
    venueName?: string;
    arrived: number;
    capacity: number;
  } | null;
}

function Row({ icon: Icon, label, children }: { icon: any; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-[#C8A96A]/10 last:border-0">
      <Icon className="w-4 h-4 text-[#E0C68E] mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.18em] text-white/45 font-bold">{label}</p>
        <div className="text-sm text-white break-words">{children}</div>
      </div>
    </div>
  );
}

/** Shown right after a successful door scan: who was admitted, their details, and "Scan another". */
export default function AdmittedGuestPage() {
  const params = useParams();
  const pathname = usePathname() || "";
  const router = useRouter();
  const base = pathname.startsWith("/employee") ? "/employee" : pathname.startsWith("/promoter") ? "/promoter" : "/admin";
  const kind = String(params?.kind || "");
  const id = String(params?.id || "");

  const [data, setData] = useState<Admission | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get(`/check-in/admission/${kind}/${id}`)
      .then(({ data }) => setData(data))
      .catch((err) => setError(err.response?.data?.message || "Could not load this admission"));
  }, [kind, id]);

  const scanAnother = () => router.push(`${base}/check-in`);

  if (error) {
    return (
      <div className="p-6 max-w-md mx-auto text-white text-center space-y-4 pt-20">
        <AlertCircle className="w-10 h-10 mx-auto text-amber-300" />
        <p className="text-sm text-white/70">{error}</p>
        <button onClick={scanAnother} className="w-full py-4 rounded-xl bg-gradient-to-b from-[#F1D9A0] to-[#C8A96A] text-[#1a1208] text-sm font-black uppercase tracking-[0.15em] cursor-pointer">
          Scan another
        </button>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="py-32 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#E0C68E]" />
      </div>
    );
  }

  const p = data.person;
  const ev = data.event;
  const atLabel = data.checkIn.at ? new Date(data.checkIn.at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "";
  const evDate = ev ? new Date(ev.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }) : "";

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-lg mx-auto text-white space-y-5 pb-32">
      {/* Admitted banner */}
      <div className="rounded-3xl border border-emerald-400/40 bg-gradient-to-b from-emerald-500/20 to-emerald-900/10 p-6 text-center space-y-2 shadow-[0_0_60px_-20px_rgba(52,211,153,0.6)]">
        <CheckCircle2 className="w-14 h-14 mx-auto text-emerald-300" />
        <p className="text-[11px] uppercase tracking-[0.3em] font-bold text-emerald-200">
          {data.kind === "group" ? `Admit ${data.group?.size || ""} people` : "Admitted"}
        </p>
        <h1 className="text-3xl sm:text-4xl font-headline font-bold">{p.name}</h1>
        <p className="text-xs text-white/60">
          Checked in{atLabel ? ` at ${atLabel}` : ""}
          {data.checkIn.by ? ` by ${data.checkIn.by}` : ""}
        </p>
      </div>

      {/* Personal details */}
      <div className="rounded-2xl border border-[#C8A96A]/25 bg-gradient-to-b from-[#1a140c]/85 to-[#0a0705]/95 p-5">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#E0C68E] mb-1">Guest details</h2>
        <Row icon={UserIcon} label="Full name">
          {p.name}
        </Row>
        <Row icon={Phone} label="Phone">
          {p.phone ? (
            <a href={`tel:${p.phone}`} className="font-mono hover:text-[#E0C68E]">
              {p.phone}
            </a>
          ) : (
            "—"
          )}
          {p.phoneVerified && (
            <span className="ml-2 inline-flex items-center gap-1 text-[10px] text-emerald-300 font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3 h-3" /> Verified
            </span>
          )}
        </Row>
        <Row icon={Mail} label="Email">
          {p.email && !p.email.includes("@fishndrop.com") ? (
            <a href={`mailto:${p.email}`} className="hover:text-[#E0C68E]">
              {p.email}
            </a>
          ) : (
            "—"
          )}
        </Row>
        <Row icon={Ticket} label="Pass">
          <span className="font-mono text-[#F1D9A0]">{data.pass.code}</span>
          <span className="block text-xs text-white/55">{data.pass.label}</span>
        </Row>
        {p.memberSince && (
          <Row icon={CalendarDays} label="Tropica member since">
            {new Date(p.memberSince).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </Row>
        )}
        {data.group && (
          <Row icon={Users} label="Group">
            {data.group.inside} of {data.group.size} inside
          </Row>
        )}
      </div>

      {/* Event */}
      {ev && (
        <div className="rounded-2xl border border-[#C8A96A]/25 bg-black/35 p-5 space-y-3">
          <div className="flex items-start gap-3">
            <PartyPopper className="w-5 h-5 text-[#E0C68E] shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="font-semibold capitalize">{ev.title}</p>
              <p className="text-xs text-white/55 flex flex-wrap gap-x-3">
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="w-3.5 h-3.5" /> {evDate}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {formatTimeTo12Hour(ev.startTime)}
                  {ev.endTime ? ` – ${ev.endTime}` : ""}
                </span>
              </p>
              {ev.hostName && <p className="text-xs text-white/55 mt-1">Host: {ev.hostName}</p>}
            </div>
          </div>
          {ev.kind === "celebration" && (
            <div className="flex items-center justify-between rounded-xl bg-[#C8A96A]/10 border border-[#C8A96A]/25 px-4 py-3">
              <span className="text-xs text-white/70">Guests arrived so far</span>
              <span className="text-xl font-bold tabular-nums text-[#F1D9A0]">
                {ev.arrived}
                <span className="text-sm text-white/40">/{ev.capacity}</span>
              </span>
            </div>
          )}
          {ev.kind === "celebration" && ev.bookingId && base !== "/promoter" && (
            <Link href={`${base}/celebrations/${ev.bookingId}`} className="block text-center text-xs text-[#E0C68E] underline underline-offset-2">
              Open this party&apos;s guest list
            </Link>
          )}
        </div>
      )}

      {/* Sticky "Scan another" so it's always one tap away at the door */}
      <div className="fixed bottom-0 inset-x-0 lg:left-72 z-30 p-4 bg-gradient-to-t from-[#0b0704] via-[#0b0704]/95 to-transparent">
        <button
          onClick={scanAnother}
          className="mx-auto max-w-lg w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-b from-[#F1D9A0] via-[#D9B872] to-[#B8934E] text-[#1a1208] text-sm font-black uppercase tracking-[0.15em] shadow-[0_8px_28px_-6px_rgba(224,184,110,0.6)] cursor-pointer"
        >
          <ScanLine className="w-5 h-5" /> Scan another
        </button>
      </div>
    </div>
  );
}
