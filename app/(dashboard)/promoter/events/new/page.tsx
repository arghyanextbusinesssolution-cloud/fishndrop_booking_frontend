"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import {
  Calendar,
  Clock,
  Building,
  Upload,
  Plus,
  Trash2,
  ArrowLeft,
  Sparkles,
  Ticket,
  MapPin,
  Info
} from "lucide-react";
import {
  DatePickerField,
  TimePickerField,
  PlaceAutocomplete,
  PickedPlace,
  nyNow,
  toMinutes,
  fmt12,
  SALES_CLOSE_MINUTES
} from "@/components/events/EventFormPickers";

interface TicketTierInput {
  name: string;
  price: number;
  quantity: number;
  description?: string;
  salesDeadline?: string;
}

export default function CreateEventPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("20:00");
  const [endTime, setEndTime] = useState("02:00");
  const [venueType, setVenueType] = useState<"tropica" | "external">("tropica");
  const [venueName, setVenueName] = useState("Tropica Sanctuary NYC");
  const [venueAddress, setVenueAddress] = useState("Brooklyn, NY");
  const [venueCoords, setVenueCoords] = useState<{ lat?: number; lng?: number; placeId?: string }>({});
  const [flyerUrl, setFlyerUrl] = useState("");
  // New York "now", refreshed every 30s so past times grey out live
  const [now, setNow] = useState<{ date: string; minutes: number } | null>(null);
  useEffect(() => {
    const tick = () => setNow(nyNow());
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  const isToday = !!now && date === now.date;
  // Start must leave room for the 5-minute ticket-sales cutoff
  const minStartMinutes = isToday && now ? now.minutes + SALES_CLOSE_MINUTES + 1 : undefined;
  const endsNextDay = !!startTime && !!endTime && toMinutes(endTime) <= toMinutes(startTime);
  const salesCloseLabel = (() => {
    if (!startTime) return "";
    const m = (toMinutes(startTime) - SALES_CLOSE_MINUTES + 1440) % 1440;
    return fmt12(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  })();

  // Clear a start time that has slipped into the past (e.g. switched the date to today)
  useEffect(() => {
    if (minStartMinutes !== undefined && startTime && toMinutes(startTime) < minStartMinutes) {
      setStartTime("");
      toast("That start time has already passed today. Please pick a later time.", { icon: "\u23F0" });
    }
  }, [minStartMinutes, startTime]);

  const handlePlaceSelect = (p: PickedPlace) => {
    setVenueName(p.name);
    setVenueAddress(p.address);
    setVenueCoords({ lat: p.lat, lng: p.lng, placeId: p.id });
  };
  const [isUploadingFlyer, setIsUploadingFlyer] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [ticketTiers, setTicketTiers] = useState<TicketTierInput[]>([
    { name: "General Admission", price: 25, quantity: 100, description: "Standard event admission" },
    { name: "VIP Admission", price: 65, quantity: 25, description: "VIP expedited entry & lounge access" }
  ]);

  const handleAddTier = () => {
    setTicketTiers([
      ...ticketTiers,
      { name: "Tier " + (ticketTiers.length + 1), price: 30, quantity: 50, description: "" }
    ]);
  };

  const handleRemoveTier = (index: number) => {
    if (ticketTiers.length <= 1) {
      toast.error("At least one ticket tier is required");
      return;
    }
    setTicketTiers(ticketTiers.filter((_, i) => i !== index));
  };

  const handleUpdateTier = (index: number, field: keyof TicketTierInput, value: any) => {
    const updated = [...ticketTiers];
    updated[index] = { ...updated[index], [field]: value };
    setTicketTiers(updated);
  };

  /** Read the flyer locally for the preview; the server uploads it when the event is created. */
  const handleFlyerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image (JPG, PNG or WebP)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Flyer must be under 10MB");
      return;
    }
    setIsUploadingFlyer(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setFlyerUrl(reader.result as string);
      toast.success("Flyer attached!");
      setIsUploadingFlyer(false);
    };
    reader.onerror = () => {
      toast.error("Failed to read flyer image");
      setIsUploadingFlyer(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !date || !startTime || !endTime) {
      toast.error("Please fill in event title, date, and times");
      return;
    }

    const current = nyNow();
    if (date < current.date || (date === current.date && toMinutes(startTime) <= current.minutes + SALES_CLOSE_MINUTES)) {
      toast.error("The event start time must be in the future");
      return;
    }

    if (startTime === endTime) {
      toast.error("End time must be different from the start time");
      return;
    }

    if (venueType === "external" && (!venueName.trim() || !venueAddress.trim())) {
      toast.error("Please search for the venue or enter its name and address");
      return;
    }

    if (!flyerUrl) {
      toast.error("Please upload an event flyer image");
      return;
    }

    if (ticketTiers.length === 0) {
      toast.error("Please configure at least one ticket tier");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data } = await api.post("/events", {
        title,
        description,
        date,
        startTime,
        endTime,
        venueType,
        venueName: venueType === "tropica" ? "Tropica Sanctuary NYC" : venueName,
        venueAddress: venueType === "tropica" ? "Brooklyn, NY" : venueAddress,
        ...(venueType === "external" && venueCoords.lat !== undefined
          ? { venueLat: venueCoords.lat, venueLng: venueCoords.lng, venuePlaceId: venueCoords.placeId }
          : {}),
        flyerUrl,
        ticketTiers
      });

      if (data.success) {
        toast.success("Event created successfully as Draft!");
        router.push("/promoter");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create event");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8 min-h-screen">
      {/* Back button */}
      <div>
        <Link
          href="/promoter"
          className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>

      <header className="space-y-1">
        <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-[#C8A96A] block">
          Event Creator
        </span>
        <h1 className="text-3xl md:text-4xl font-headline italic text-white">Create New Event</h1>
        <p className="text-xs text-white/60">
          Configure ticket tiers, pricing, event flyers, and venue details.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: General Info */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#C8A96A] flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> 1. Event Details
          </h2>

          <div>
            <label className="block text-xs font-medium text-white/80 uppercase tracking-wider mb-1.5">
              Event Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sunset Rhythms – Afrohouse Night"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#C8A96A]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/80 uppercase tracking-wider mb-1.5">
              Event Description *
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your event, DJ lineup, dress code, age requirements, etc."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#C8A96A]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="ev-date" className="block text-xs font-medium text-white/80 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#C8A96A]" /> Date *
              </label>
              {now ? (
                <DatePickerField id="ev-date" value={date} onChange={setDate} minDate={now.date} />
              ) : (
                <div className="h-[42px] rounded-xl bg-white/5 border border-white/10" />
              )}
            </div>

            <div>
              <label htmlFor="ev-start" className="block text-xs font-medium text-white/80 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#C8A96A]" /> Start Time *
              </label>
              <TimePickerField id="ev-start" value={startTime} onChange={setStartTime} minMinutes={minStartMinutes} placeholder="Select start" />
            </div>

            <div>
              <label htmlFor="ev-end" className="block text-xs font-medium text-white/80 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#C8A96A]" /> End Time *
              </label>
              <TimePickerField id="ev-end" value={endTime} onChange={setEndTime} badge={endsNextDay ? "Next day" : undefined} placeholder="Select end" />
            </div>
          </div>

          {startTime && (
            <p className="flex items-start gap-2 text-[11px] text-white/55 bg-[#C8A96A]/5 border border-[#C8A96A]/15 rounded-xl px-3 py-2.5">
              <Info className="w-3.5 h-3.5 text-[#C8A96A] shrink-0 mt-0.5" />
              <span>
                Ticket sales close automatically {SALES_CLOSE_MINUTES} minutes before the event starts
                {date ? (
                  <>
                    {" "}(at <strong className="text-white/80">{salesCloseLabel}</strong> New York time).
                  </>
                ) : (
                  "."
                )}
              </span>
            </p>
          )}
        </div>

        {/* Section 2: Venue Location */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#C8A96A] flex items-center gap-2">
            <Building className="w-4 h-4" /> 2. Venue Location
          </h2>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => {
                setVenueType("tropica");
                setVenueName("Tropica Sanctuary NYC");
                setVenueAddress("Brooklyn, NY");
              }}
              className={`flex-1 py-3 px-4 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                venueType === "tropica"
                  ? "border-[#C8A96A] bg-[#C8A96A]/10 text-[#C8A96A]"
                  : "border-white/10 text-white/60 hover:border-white/20"
              }`}
            >
              Tropica Sanctuary NYC
            </button>
            <button
              type="button"
              onClick={() => {
                setVenueType("external");
                setVenueName("");
                setVenueAddress("");
                setVenueCoords({});
              }}
              className={`flex-1 py-3 px-4 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                venueType === "external"
                  ? "border-[#C8A96A] bg-[#C8A96A]/10 text-[#C8A96A]"
                  : "border-white/10 text-white/60 hover:border-white/20"
              }`}
            >
              Independent / External Venue
            </button>
          </div>

          {venueType === "external" && (
            <div className="pt-2 space-y-1.5">
              <label htmlFor="ev-place" className="block text-xs font-medium text-white/80 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#C8A96A]" /> Find the venue
              </label>
              <PlaceAutocomplete id="ev-place" onSelect={handlePlaceSelect} />
              <p className="text-[10px] text-white/35">Pick a result to fill in the name and address. You can still edit them below.</p>
            </div>
          )}

          {venueType === "external" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-white/80 uppercase tracking-wider mb-1.5">
                  Venue Name *
                </label>
                <input
                  type="text"
                  required
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  placeholder="e.g. Mirage Hall Brooklyn"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#C8A96A]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white/80 uppercase tracking-wider mb-1.5">
                  Street Address & Borough *
                </label>
                <input
                  type="text"
                  required
                  value={venueAddress}
                  onChange={(e) => {
                    setVenueAddress(e.target.value);
                    setVenueCoords({});
                  }}
                  placeholder="e.g. 123 Atlantic Ave, Brooklyn, NY"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#C8A96A]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Flyer Upload */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#C8A96A] flex items-center gap-2">
            <Upload className="w-4 h-4" /> 3. Event Flyer Image
          </h2>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-36 h-48 bg-black/40 border border-white/10 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
              {flyerUrl ? (
                <img src={flyerUrl} alt="Flyer preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-2 text-white/30 text-xs">No flyer uploaded</div>
              )}
            </div>

            <div className="space-y-3">
              <p className="text-xs text-white/70">
                Upload a high-resolution portrait or square flyer (JPEG or PNG, up to 10MB).
              </p>
              <label className="cursor-pointer inline-flex items-center gap-2 bg-[#C8A96A]/20 hover:bg-[#C8A96A]/30 text-[#C8A96A] border border-[#C8A96A]/40 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all">
                <Upload className="w-4 h-4" />
                {isUploadingFlyer ? "Uploading Flyer..." : flyerUrl ? "Replace Flyer" : "Upload Event Flyer"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFlyerUpload}
                  disabled={isUploadingFlyer}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Section 4: Ticket Tiers & Capacity */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#C8A96A] flex items-center gap-2">
              <Ticket className="w-4 h-4" /> 4. Ticket Categories & Pricing
            </h2>
            <button
              type="button"
              onClick={handleAddTier}
              className="inline-flex items-center gap-1.5 text-xs text-[#C8A96A] hover:underline font-bold uppercase tracking-wider cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Ticket Tier
            </button>
          </div>

          <div className="space-y-4">
            {ticketTiers.map((tier, idx) => (
              <div
                key={idx}
                className="bg-white/[0.02] border border-white/10 rounded-xl p-4 space-y-3 relative group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider">
                    Tier {idx + 1}
                  </span>
                  {ticketTiers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTier(idx)}
                      className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-white/70 mb-1">Tier Name *</label>
                    <input
                      type="text"
                      required
                      value={tier.name}
                      onChange={(e) => handleUpdateTier(idx, "name", e.target.value)}
                      placeholder="e.g. VIP Access"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C8A96A]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-white/70 mb-1">Ticket Price ($) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={tier.price}
                      onChange={(e) => handleUpdateTier(idx, "price", parseFloat(e.target.value) || 0)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C8A96A]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-white/70 mb-1">Available Quantity *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={tier.quantity}
                      onChange={(e) => handleUpdateTier(idx, "quantity", parseInt(e.target.value) || 1)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C8A96A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-white/70 mb-1">Tier Description (optional)</label>
                  <input
                    type="text"
                    value={tier.description || ""}
                    onChange={(e) => handleUpdateTier(idx, "description", e.target.value)}
                    placeholder="e.g. Includes 1 free welcome cocktail"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C8A96A]"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting || isUploadingFlyer}
            className="w-full py-4 bg-[#C8A96A] hover:bg-[#d8b97a] text-[#070B09] font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(200,169,106,0.3)] disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? "Creating Event..." : "Create Event & Save as Draft"}
          </button>
        </div>
      </form>
    </div>
  );
}

