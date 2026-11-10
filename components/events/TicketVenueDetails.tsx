"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock, ExternalLink, MapPin, Navigation } from "lucide-react";
import { buildMapLinks } from "@/components/events/EventMap";
import { fmt12 } from "@/components/events/EventFormPickers";

export interface TicketVenueEvent {
  date: string;
  startTime: string;
  endTime: string;
  venueName: string;
  venueAddress: string;
  venueType?: "tropica" | "external";
  venueLat?: number;
  venueLng?: number;
}

/** Shows "8:00 PM" for "20:00" and leaves already-formatted times alone. */
const time12 = (t: string) => (/^\d{1,2}:\d{2}$/.test(t) ? fmt12(t.padStart(5, "0")) : t);

/** Date, time, venue and map links shown under a ticket QR. */
export function TicketVenueDetails({ event }: { event: TicketVenueEvent }) {
  const links = buildMapLinks(event);
  const endsNextDay = /^\d{1,2}:\d{2}$/.test(event.endTime) && event.endTime.padStart(5, "0") <= event.startTime.padStart(5, "0");

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 space-y-3 text-xs">
      <div className="flex items-start gap-3">
        <CalendarDays className="w-4 h-4 text-[#C8A96A] shrink-0 mt-0.5" />
        <div>
          <p className="text-[10px] uppercase tracking-wider text-white/45">Date</p>
          <p className="text-sm font-semibold text-white">
            {new Date(event.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })}
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <Clock className="w-4 h-4 text-[#C8A96A] shrink-0 mt-0.5" />
        <div>
          <p className="text-[10px] uppercase tracking-wider text-white/45">Time</p>
          <p className="text-sm font-semibold text-white">
            {time12(event.startTime)} – {time12(event.endTime)}
            {endsNextDay && <span className="ml-1.5 text-[10px] font-normal text-white/50">(next day)</span>}
          </p>
          <p className="text-[10px] text-white/40">New York time</p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <MapPin className="w-4 h-4 text-[#C8A96A] shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-white/45">Venue</p>
          <p className="text-sm font-semibold text-white">{event.venueName}</p>
          <p className="text-white/60 break-words">{links.address}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1 print:hidden">
        <a
          href={links.directions}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#C8A96A] hover:bg-[#E0C68E] text-[#0a120e] px-3 py-2 font-bold"
        >
          <Navigation className="w-3.5 h-3.5" /> Directions
        </a>
        <a
          href={links.google}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/15 hover:border-[#C8A96A] text-white/80 px-3 py-2 font-semibold"
        >
          <ExternalLink className="w-3.5 h-3.5" /> Open map
        </a>
      </div>
    </div>
  );
}

/** Back to the previous page; falls back to My Event Tickets when opened from a link. */
export function TicketBackButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => (window.history.length > 1 ? router.back() : router.push("/user/tickets"))}
      className="inline-flex items-center gap-1.5 text-xs text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
    >
      <ArrowLeft className="w-3.5 h-3.5" /> Back
    </button>
  );
}
