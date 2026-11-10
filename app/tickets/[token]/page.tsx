"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios";
import dynamic from "next/dynamic";
import { NavBar } from "@/components/shared/NavBar";
import { TicketVenueDetails, TicketBackButton } from "@/components/events/TicketVenueDetails";
const QrCodeCard = dynamic(() => import("@/components/shared/QrCodeCard"), { ssr: false });
import {
  Calendar,
  Clock,
  MapPin,
  Ticket,
  Printer,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles
} from "lucide-react";

interface TicketData {
  _id: string;
  ticketCode: string;
  tierName: string;
  price: number;
  customerName: string;
  customerEmail: string;
  qrCodeToken: string;
  status: "valid" | "used" | "refunded" | "cancelled";
  checkedIn: boolean;
  checkedInAt?: string;
  checkedInByName?: string;
  event: {
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    venueName: string;
    venueAddress: string;
    venueType?: "tropica" | "external";
    venueLat?: number;
    venueLng?: number;
    flyerUrl: string;
  };
}

export default function DigitalTicketPassPage() {
  const params = useParams();
  const token = params?.token as string;

  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const fetchTicket = async () => {
      try {
        setIsLoading(true);
        const { data } = await api.get(`/tickets/qr/${token}`);
        if (data.success && data.ticket) {
          setTicket(data.ticket);
        } else {
          setError("Ticket pass not found");
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Invalid or expired ticket pass");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTicket();
  }, [token]);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070B09]">
        <NavBar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-[#C8A96A]"></div>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-[#070B09] flex flex-col items-center justify-center p-6 pt-28 text-center space-y-4 text-white">
        <NavBar />
        <AlertCircle className="w-12 h-12 text-red-400" />
        <h1 className="text-2xl font-bold">Ticket Not Recognized</h1>
        <p className="text-xs text-white/60 max-w-sm">{error || "This QR code pass is invalid or expired."}</p>
        <Link href="/" className="px-4 py-2 bg-[#C8A96A] text-black text-xs font-bold rounded-xl">
          Tropica NYC Homepage
        </Link>
      </div>
    );
  }

  const { event } = ticket;

  return (
    <div className="min-h-screen bg-[#070B09] text-white pt-24 md:pt-28 pb-10 px-4 sm:px-6 print:pt-4">
      <div className="print:hidden">
        <NavBar />
      </div>
      <div className="max-w-md mx-auto space-y-6">
        {/* Top Actions */}
        <div className="flex items-center justify-between text-xs text-white/60 print:hidden">
          <TicketBackButton />
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 text-white cursor-pointer transition-all"
          >
            <Printer className="w-3.5 h-3.5" /> Print / Save Pass
          </button>
        </div>

        {/* Physical Pass Style Card */}
        <div className="bg-gradient-to-b from-[#141F1A] to-[#0A100D] border border-white/15 rounded-3xl overflow-hidden shadow-2xl">
          {/* Header Flyer Banner */}
          <div className="relative h-44 w-full bg-black/60 overflow-hidden">
            <img
              src={event.flyerUrl}
              alt={event.title}
              className="w-full h-full object-cover opacity-85"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#141F1A] via-transparent to-black/40" />

            {/* Status Ribbon */}
            <div className="absolute top-3 right-3">
              {ticket.checkedIn ? (
                <span className="bg-amber-500 text-black px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg">
                  Used &bull; Checked In
                </span>
              ) : ticket.status === "refunded" ? (
                <span className="bg-red-500 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  Void &bull; Refunded
                </span>
              ) : (
                <span className="bg-emerald-500 text-black px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg">
                  Valid For Entry
                </span>
              )}
            </div>
          </div>

          {/* Pass Details */}
          <div className="p-6 space-y-5">
            <div className="space-y-1 text-center">
              <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-[#C8A96A] block">
                Official Admission Pass
              </span>
              <h1 className="text-xl font-bold text-white line-clamp-2">{event.title}</h1>
              <div className="text-sm font-semibold text-[#C8A96A] pt-0.5">{ticket.tierName}</div>
            </div>

            {/* QR Code Centerpiece */}
            <div className="py-2 flex flex-col items-center justify-center">
              <QrCodeCard value={ticket.qrCodeToken} size={210} />
              <div className="mt-3 text-center">
                <div className="font-mono text-sm font-bold tracking-widest text-[#C8A96A]">
                  {ticket.ticketCode}
                </div>
                <div className="text-[10px] uppercase text-white/40 tracking-wider">
                  Single Admission Pass
                </div>
              </div>
            </div>

            {/* Attendee */}
            <div className="flex justify-between items-center bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 text-xs">
              <span className="text-white/50 uppercase tracking-wider text-[10px]">Attendee</span>
              <span className="font-semibold text-white">{ticket.customerName}</span>
            </div>

            {/* Venue details */}
            <TicketVenueDetails event={event} />

            {/* Check-In Status Note */}
            {ticket.checkedIn ? (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center text-xs text-amber-300">
                Checked in at {ticket.checkedInAt ? new Date(ticket.checkedInAt).toLocaleTimeString("en-US") : "door"} by {ticket.checkedInByName || "Staff"}.
              </div>
            ) : (
              <div className="text-center text-[10px] text-white/50 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Present this screen at door security for fast scan verification.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

