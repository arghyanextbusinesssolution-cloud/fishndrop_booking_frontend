"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import { TicketCheckoutModal, CheckoutLine } from "@/components/events/TicketCheckoutModal";
import { UserProfileMenu } from "@/components/shared/UserProfileMenu";
import { EventMap } from "@/components/events/EventMap";
import { useAuthStore } from "@/store/authStore";
import {
  Calendar,
  Clock,
  MapPin,
  Ticket,
  ShieldCheck,
  Building,
  Plus,
  Minus,
  ArrowRight,
  Share2,
  Sparkles
} from "lucide-react";

interface TicketTier {
  _id: string;
  name: string;
  price: number;
  available: number;
  isSoldOut: boolean;
  description?: string;
}

interface EventData {
  _id: string;
  title: string;
  slug: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  venueName: string;
  venueAddress: string;
  venueType?: "tropica" | "external";
  venueLat?: number;
  venueLng?: number;
  flyerUrl: string;
  promoter: {
    name: string;
    companyName?: string;
  };
  ticketTiers: TicketTier[];
  eventStartAt?: string | null;
  salesCloseAt?: string | null;
  salesClosed?: boolean;
  salesCloseMinutes?: number;
  feeInfo: {
    feePercent: number;
    fixedFee: number;
    feeMode: "customer_paid" | "promoter_paid";
  };
}

export default function PublicEventPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [event, setEvent] = useState<EventData | null>(null);
  const storeAuthed = useAuthStore((st) => st.isAuthenticated);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isAuthenticated = mounted && storeAuthed; // avoid SSR/client hydration mismatch
  const [isLoading, setIsLoading] = useState(true);
  const [pendingNotice, setPendingNotice] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setClock(Date.now()), 15_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!slug) return;
    const fetchEvent = async () => {
      try {
        setIsLoading(true);
        const { data } = await api.get(`/events/slug/${slug}`);
        if (data.success && data.event) {
          setEvent(data.event);
          // Initialize tier quantities
          const initialQty: Record<string, number> = {};
          data.event.ticketTiers.forEach((tier: TicketTier, idx: number) => {
            initialQty[tier._id] = idx === 0 && !tier.isSoldOut ? 1 : 0;
          });
          setQuantities(initialQty);
        }
      } catch (err: any) {
        if (err.response?.status === 403) {
          setPendingNotice(err.response?.data?.message || "This event is awaiting employee verification and is not yet published.");
        } else {
          toast.error("Event not found or sales unavailable");
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvent();
  }, [slug]);

  const handleQuantityChange = (tierId: string, delta: number, maxAvailable: number) => {
    setQuantities((prev) => {
      const current = prev[tierId] || 0;
      const next = Math.max(0, Math.min(maxAvailable, current + delta));
      return { ...prev, [tierId]: next };
    });
  };

  const calculateSubtotal = () => {
    if (!event) return 0;
    return event.ticketTiers.reduce((sum, tier) => {
      const qty = quantities[tier._id] || 0;
      return sum + tier.price * qty;
    }, 0);
  };

  const totalTickets = event
    ? event.ticketTiers.reduce((sum, tier) => sum + (quantities[tier._id] || 0), 0)
    : 0;

  const subtotal = calculateSubtotal();

  const calculateFee = () => {
    if (!event || totalTickets === 0) return 0;
    const { feePercent, fixedFee, feeMode } = event.feeInfo;
    if (feeMode === "promoter_paid") return 0;
    return Math.round(((subtotal * feePercent) / 100 + fixedFee * totalTickets) * 100) / 100;
  };

  const platformFee = calculateFee();
  const totalAmount = Math.round((subtotal + platformFee) * 100) / 100;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: event?.title,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Event link copied to clipboard!");
    }
  };

  const checkoutLines: CheckoutLine[] = event
    ? event.ticketTiers
        .filter((tier) => (quantities[tier._id] || 0) > 0)
        .map((tier) => ({ tierId: tier._id, name: tier.name, price: tier.price, quantity: quantities[tier._id] }))
    : [];

  // Ticket sales close a few minutes before the event starts (enforced again on the server)
  const closeAtMs = event?.salesCloseAt ? new Date(event.salesCloseAt).getTime() : null;
  const salesClosed = !!event && (!!event.salesClosed || (closeAtMs !== null && clock >= closeAtMs));
  const msToClose = closeAtMs !== null ? closeAtMs - clock : null;
  const closesSoonLabel =
    !salesClosed && msToClose !== null && msToClose < 24 * 3600_000
      ? msToClose < 3600_000
        ? `${Math.max(1, Math.ceil(msToClose / 60_000))} min`
        : `${Math.floor(msToClose / 3600_000)}h ${Math.floor((msToClose % 3600_000) / 60_000)}m`
      : null;

  useEffect(() => {
    if (salesClosed) setIsCheckoutOpen(false);
  }, [salesClosed]);

  const handlePayNow = (e: React.FormEvent) => {
    e.preventDefault();
    if (salesClosed) {
      toast.error("Ticket sales for this event have closed");
      return;
    }
    if (totalTickets === 0) {
      toast.error("Please select at least 1 ticket");
      return;
    }
    setIsCheckoutOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070B09] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-[#C8A96A]"></div>
      </div>
    );
  }

  if (pendingNotice) {
    return (
      <div className="min-h-screen bg-[#070B09] flex flex-col items-center justify-center p-6 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/20">
          <Clock className="w-8 h-8 animate-pulse" />
        </div>
        <div className="space-y-2 max-w-md">
          <h1 className="font-headline text-3xl font-bold text-white">Event Under Review</h1>
          <p className="text-sm text-amber-200/90 leading-relaxed">{pendingNotice}</p>
          <p className="text-xs text-white/50">
            Once our employee verifies the event details, ticket checkout will automatically go live at this link.
          </p>
        </div>
        <Link href="/" className="px-5 py-2.5 bg-[#C8A96A] hover:bg-[#d8b97a] text-black text-xs font-bold uppercase tracking-wider rounded-xl transition-all">
          Return to Tropica NYC
        </Link>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#070B09] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <Ticket className="w-12 h-12 text-white/30" />
        <h1 className="text-2xl font-bold text-white">Event Not Found</h1>
        <p className="text-xs text-white/60">The event you are looking for does not exist or has ended.</p>
        <Link href="/" className="px-4 py-2 bg-[#C8A96A] text-black text-xs font-bold rounded-xl">
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070B09] text-white">
      {/* Top Navbar */}
      <nav className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-headline text-2xl italic text-[#C8A96A]">
          Tropica NYC
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 text-xs text-white/70 hover:text-white px-3 py-1.5 border border-white/10 rounded-lg hover:border-white/30 transition-all cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Share Event</span>
          </button>
          {isAuthenticated ? (
            <UserProfileMenu />
          ) : (
            <Link
              href="/login"
              className="text-xs font-bold uppercase tracking-wider text-[#0d1612] bg-[#C8A96A] hover:bg-[#E0C68E] px-4 py-2 rounded-full transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </nav>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Flyer & Description */}
          <div className="lg:col-span-7 space-y-6">
            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black">
              <img
                src={event.flyerUrl}
                alt={event.title}
                className="w-full h-auto object-cover max-h-[580px]"
              />
            </div>

            {/* Event Header Info */}
            <div className="space-y-3">
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#C8A96A] block">
                Presented by {event.promoter.companyName || event.promoter.name}
              </span>
              <h1 className="text-3xl sm:text-4xl font-headline italic text-white">{event.title}</h1>

              <div className="flex flex-wrap gap-4 text-xs text-white/70 pt-2">
                <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
                  <Calendar className="w-4 h-4 text-[#C8A96A]" />
                  <span>{new Date(event.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
                  <Clock className="w-4 h-4 text-[#C8A96A]" />
                  <span>{event.startTime} – {event.endTime}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
                  <MapPin className="w-4 h-4 text-[#C8A96A]" />
                  <a href="#location" className="hover:text-white underline-offset-2 hover:underline">
                    {event.venueName} &bull; {event.venueAddress}
                  </a>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/80">About This Event</h3>
              <p className="text-sm text-white/80 whitespace-pre-line leading-relaxed">
                {event.description}
              </p>
            </div>

            <div id="location" className="scroll-mt-6">
              <EventMap venue={event} />
            </div>
          </div>

          {/* Right Column: Ticket Checkout Box */}
          <div className="lg:col-span-5 lg:sticky lg:top-8 space-y-6">
            <div className="bg-white/[0.04] border border-white/15 rounded-2xl p-6 sm:p-7 backdrop-blur-xl shadow-2xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-[#C8A96A]" />
                  <h2 className="text-lg font-bold text-white">Select Tickets</h2>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                  Official Tickets
                </span>
              </div>

              {/* Tiers List */}
              <div className="space-y-3">
                {event.ticketTiers.map((tier) => {
                  const qty = quantities[tier._id] || 0;
                  return (
                    <div
                      key={tier._id}
                      className={`border rounded-xl p-4 transition-all ${
                        qty > 0
                          ? "border-[#C8A96A] bg-[#C8A96A]/5"
                          : "border-white/10 bg-white/[0.02]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-bold text-white text-sm">{tier.name}</div>
                          {tier.description && (
                            <p className="text-[11px] text-white/50 mt-0.5">{tier.description}</p>
                          )}
                          <div className="text-xs font-bold text-[#C8A96A] mt-1">
                            ${tier.price.toFixed(2)}
                          </div>
                        </div>

                        {/* Quantity Selector */}
                        {salesClosed ? (
                          <span className="text-[10px] uppercase font-bold text-white/50 bg-white/10 px-2.5 py-1 rounded-md">
                            Closed
                          </span>
                        ) : tier.isSoldOut ? (
                          <span className="text-[10px] uppercase font-bold text-red-400 bg-red-500/10 px-2.5 py-1 rounded-md">
                            Sold Out
                          </span>
                        ) : (
                          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(tier._id, -1, tier.available)}
                              disabled={qty === 0}
                              className="w-7 h-7 rounded flex items-center justify-center text-white hover:bg-white/10 disabled:opacity-30 cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-6 text-center text-xs font-bold text-white">{qty}</span>
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(tier._id, 1, tier.available)}
                              disabled={qty >= tier.available}
                              className="w-7 h-7 rounded flex items-center justify-center text-white hover:bg-white/10 disabled:opacity-30 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {salesClosed ? (
                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-center space-y-1">
                  <p className="text-sm font-bold text-white">Ticket sales have closed</p>
                  <p className="text-[11px] text-white/50">
                    Online sales end {event.salesCloseMinutes ?? 5} minutes before the event starts.
                  </p>
                </div>
              ) : closesSoonLabel ? (
                <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2.5 text-[11px] text-amber-200 text-center">
                  Ticket sales close in <strong>{closesSoonLabel}</strong> ({event.salesCloseMinutes ?? 5} min before start)
                </div>
              ) : null}

              {/* Order summary & Pay Now (sign-in / details happen in the checkout popup) */}
              <form onSubmit={handlePayNow} className="space-y-4 pt-2">
                {/* Price Breakdown */}
                <div className="pt-3 border-t border-white/10 space-y-1.5 text-xs">
                  <div className="flex justify-between text-white/70">
                    <span>Tickets ({totalTickets})</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  {platformFee > 0 && (
                    <div className="flex justify-between text-white/50">
                      <span>Service & Processing Fee</span>
                      <span>${platformFee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-white/10">
                    <span>Total Due</span>
                    <span className="text-[#C8A96A] text-base">${totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={totalTickets === 0 || salesClosed}
                  className="w-full py-3.5 bg-[#C8A96A] hover:bg-[#d8b97a] text-[#070B09] font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(200,169,106,0.3)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                >
                  {salesClosed ? "Sales Closed" : <>Pay Now <ArrowRight className="w-4 h-4" /></>}
                </button>

                <p className="text-[10px] text-center text-white/40 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Quick mobile sign-in, then secure Stripe payment. QR tickets issued instantly.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>

      <TicketCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        event={{
          _id: event._id,
          title: event.title,
          date: event.date,
          startTime: event.startTime,
          venueName: event.venueName
        }}
        lines={checkoutLines}
        subtotal={subtotal}
        platformFee={platformFee}
        totalAmount={totalAmount}
      />
    </div>
  );
}

