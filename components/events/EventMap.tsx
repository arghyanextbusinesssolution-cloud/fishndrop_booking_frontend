"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Copy, ExternalLink, MapPin, Navigation } from "lucide-react";

/** Exact Tropica street address. Set NEXT_PUBLIC_TROPICA_ADDRESS in frontend/.env.local. */
export const TROPICA_VENUE_ADDRESS = process.env.NEXT_PUBLIC_TROPICA_ADDRESS || "Brooklyn, NY";

export interface MapVenue {
  venueType?: "tropica" | "external";
  venueName: string;
  venueAddress: string;
  venueLat?: number;
  venueLng?: number;
}

/** Map URLs for a venue: exact pin when coordinates exist, otherwise name + address search. */
export const buildMapLinks = (v: MapVenue) => {
  const isTropica = v.venueType === "tropica";
  const address = isTropica && TROPICA_VENUE_ADDRESS !== "Brooklyn, NY" ? TROPICA_VENUE_ADDRESS : v.venueAddress;
  const hasCoords = Number.isFinite(v.venueLat) && Number.isFinite(v.venueLng);
  const label = [v.venueName, address].filter(Boolean).join(", ");
  const query = hasCoords ? `${v.venueLat},${v.venueLng}` : label;
  const q = encodeURIComponent(query);
  return {
    address,
    label,
    embed: `https://www.google.com/maps?q=${q}&z=15&output=embed`,
    google: `https://www.google.com/maps/search/?api=1&query=${q}`,
    directions: `https://www.google.com/maps/dir/?api=1&destination=${q}`,
    apple: hasCoords
      ? `https://maps.apple.com/?ll=${v.venueLat},${v.venueLng}&q=${encodeURIComponent(v.venueName || "Venue")}`
      : `https://maps.apple.com/?q=${encodeURIComponent(label)}`
  };
};

export function EventMap({ venue }: { venue: MapVenue }) {
  const [loaded, setLoaded] = useState(false);
  const links = buildMapLinks(venue);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(links.label);
      toast.success("Address copied");
    } catch {
      toast.error("Could not copy the address");
    }
  };

  const btn =
    "inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors";

  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
      <div className="p-5 sm:p-6 space-y-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-white/80 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#C8A96A]" /> Location
        </h3>
        <p className="text-sm font-semibold text-white">{venue.venueName}</p>
        <p className="text-xs text-white/60">{links.address}</p>
      </div>

      <div className="relative h-64 sm:h-72 bg-[#0c1612] border-y border-white/10">
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-white/40">Loading map…</div>
        )}
        <iframe
          title={`Map of ${venue.venueName}`}
          src={links.embed}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          onLoad={() => setLoaded(true)}
          className="absolute inset-0 w-full h-full border-0"
          style={{ filter: "grayscale(0.25) contrast(1.05)" }}
          allowFullScreen
        />
      </div>

      <div className="p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-4 gap-2">
        <a href={links.directions} target="_blank" rel="noopener noreferrer" className={`${btn} col-span-2 sm:col-span-1 bg-[#C8A96A] border-[#C8A96A] text-[#0a120e] hover:bg-[#E0C68E]`}>
          <Navigation className="w-3.5 h-3.5" /> Directions
        </a>
        <a href={links.google} target="_blank" rel="noopener noreferrer" className={`${btn} border-white/15 text-white/80 hover:border-[#C8A96A] hover:text-white`}>
          <ExternalLink className="w-3.5 h-3.5" /> Google Maps
        </a>
        <a href={links.apple} target="_blank" rel="noopener noreferrer" className={`${btn} border-white/15 text-white/80 hover:border-[#C8A96A] hover:text-white`}>
          <ExternalLink className="w-3.5 h-3.5" /> Apple Maps
        </a>
        <button type="button" onClick={copy} className={`${btn} col-span-2 sm:col-span-1 border-white/15 text-white/80 hover:border-[#C8A96A] hover:text-white cursor-pointer`}>
          <Copy className="w-3.5 h-3.5" /> Copy address
        </button>
      </div>
    </div>
  );
}
