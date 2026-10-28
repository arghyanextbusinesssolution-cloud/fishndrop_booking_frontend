"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useBookings } from "@/hooks/useBookings";
import { Booking } from "@/types";
import { CalendarDays, Loader2, Star, Eye, Music, UtensilsCrossed, CheckCircle2, AlertCircle, XCircle, Clock, Copy, Check, TableProperties, ChefHat, Sparkles, CreditCard } from "lucide-react";
import { cn, formatBookingDate, formatVenueDateTime } from "@/lib/utils";
import Link from "next/link";
import toast from "react-hot-toast";

import { CancelBookingModal } from "@/components/booking/CancelBookingModal";
import { ZelleProofLightboxModal } from "@/components/booking/ZelleProofLightboxModal";
import { EditBookingMenuModal } from "@/components/booking/EditBookingMenuModal";
import { QuoteHistoryTimeline } from "@/components/booking/QuoteHistoryTimeline";

import { CATERING_LABEL_MAP, parseCateringDetails } from "@/lib/cateringRestaurants";

export default function UserVenueBookingsPage() {
  const { getMyBookings, cancelBooking, respondToQuote } = useBookings();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [respondingQuoteId, setRespondingQuoteId] = useState<string | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success("Booking ID copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Modals
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);
  const [previewProof, setPreviewProof] = useState<{ url: string; booking: Booking; proofType: "deposit" | "balance" | "food" } | null>(null);
  const [editingMenuBooking, setEditingMenuBooking] = useState<Booking | null>(null);
  const [expandedDishesBookingIds, setExpandedDishesBookingIds] = useState<Record<string, boolean>>({});

  const toggleExpandDishes = (bookingId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedDishesBookingIds((prev) => ({
      ...prev,
      [bookingId]: !prev[bookingId]
    }));
  };

  const handleQuoteResponse = async (bookingId: string, action: "accept" | "reject", e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setRespondingQuoteId(bookingId);
    try {
      const updated = await respondToQuote(bookingId, action);
      setBookings((prev) =>
        prev.map((b) => (b._id === updated._id ? { ...b, ...updated } : b))
      );
      toast.success(action === "accept" ? "Quote accepted! Event total updated." : "Quote declined.");
    } catch (err: any) {
      toast.error(err.message || `Failed to ${action} quote`);
    } finally {
      setRespondingQuoteId(null);
    }
  };

  const searchParams = useSearchParams();
  const queryBookingId = searchParams.get("id") || searchParams.get("bookingId");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyBookings(page, status, "private_event");
      setBookings(data.bookings);
      setTotalPages(data.totalPages);
      if (data.bookings?.length > 0) {
        const targetId = queryBookingId && data.bookings.some((b) => b._id === queryBookingId)
          ? queryBookingId
          : data.bookings[0]._id;
        setSelectedBookingId((prev) => (queryBookingId ? targetId : (prev || targetId)));
      }
    } catch {
      setBookings([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [getMyBookings, page, status, queryBookingId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleConfirmCancel = async (bookingId: string) => {
    try {
      await cancelBooking(bookingId);
      toast.success("Reservation cancelled successfully.");
      await load();
    } catch {
      toast.error("Failed to cancel reservation. Please try again.");
    }
  };

  if (loading && page === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-12 lg:p-24 space-y-12 md:space-y-20">
      {/* Lightbox Modal */}
      {previewProof && (
        <ZelleProofLightboxModal
          isOpen={!!previewProof}
          imageUrl={previewProof.url}
          booking={previewProof.booking}
          proofType={previewProof.proofType}
          onClose={() => setPreviewProof(null)}
        />
      )}

      {/* Cancel Modal with 48h Creation Time Logic */}
      {cancellingBooking && (
        <CancelBookingModal
          isOpen={!!cancellingBooking}
          booking={cancellingBooking}
          onClose={() => setCancellingBooking(null)}
          onConfirmCancel={handleConfirmCancel}
        />
      )}

      {/* Edit Catering & Menu Modal */}
      {editingMenuBooking && (
        <EditBookingMenuModal
          isOpen={!!editingMenuBooking}
          booking={editingMenuBooking}
          onClose={() => setEditingMenuBooking(null)}
          onSuccess={(updated) => {
            setBookings((prev) =>
              prev.map((b) => (b._id === updated._id ? { ...b, ...updated } : b))
            );
          }}
        />
      )}

      {/* Header */}
      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <Star className="w-4 h-4 text-primary" fill="currentColor" />
          <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-primary block">Elite Experiences</span>
        </div>
        <h2 className="text-5xl md:text-6xl lg:text-8xl font-headline italic tracking-tighter text-on-surface leading-[0.9] lg:leading-[0.85]">
          Your Private <br className="hidden md:block" /> Sanctuary.
        </h2>
        <p className="text-base md:text-lg text-secondary leading-relaxed font-body font-light max-w-sm italic pt-2 md:pt-4">
          A history of your exclusive venue buyouts. Revisit the moments when Tropica was yours alone.
        </p>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-8 border-b border-outline-variant/10 pb-8">
        {["all", "confirmed", "cancelled"].map((s) => (
          <button
            key={s}
            onClick={() => { setStatus(s); setPage(1); }}
            className={cn(
              "text-[9px] uppercase tracking-[0.3em] font-bold transition-all duration-500 relative py-2",
              status === s ? "text-primary" : "text-outline hover:text-on-surface"
            )}
          >
            {s}
            {status === s && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-gradient" />
            )}
          </button>
        ))}
      </div>

      {bookings.length === 0 ? (
        <div className="py-32 flex flex-col items-center justify-center space-y-8 bg-surface-container-low/30 rounded-2xl border border-dashed border-outline-variant/20">
          <CalendarDays className="w-12 h-12 text-outline/20" strokeWidth={1} />
          <div className="text-center space-y-2">
            <p className="font-headline text-3xl italic text-secondary">No exclusive events yet.</p>
            <p className="text-sm text-outline font-body font-light italic">Your journey towards an exclusive buyout starts here.</p>
          </div>
          <Link href="/book-venue" className="bg-gold-gradient px-8 py-3 rounded-lg text-on-primary font-label tracking-widest uppercase text-[10px] font-bold">
            Reserve the Venue
          </Link>
        </div>
      ) : (
        <div className="w-full space-y-6">
          {/* Desktop Table Layout - Clean Column Proportions & No Clipping */}
          <div className="hidden md:block rounded-2xl border border-outline-variant/15 bg-surface-container-lowest ambient-shadow overflow-hidden">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="bg-surface-container-low/80 border-b border-outline-variant/15 text-[10px] uppercase tracking-widest font-bold text-outline">
                  <th className="w-[18%] px-5 py-4">Date &amp; Time</th>
                  <th className="w-[18%] px-5 py-4">Occasion &amp; Venue</th>
                  <th className="w-[28%] px-5 py-4">Catering &amp; Menu</th>
                  <th className="w-[24%] px-5 py-4">Payment &amp; Verification</th>
                  <th className="w-[12%] px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    {bookings.map((booking) => {
                      const remainingAmt = booking.remainingAmount ?? 0;
                      const isFullyPaid = booking.remainingPaymentStatus === "paid" || (booking.paymentStatus === "paid" && remainingAmt === 0);
                      const isDepositPaid = booking.paymentStatus === "deposit_paid" || isFullyPaid;
                      const isZelle = booking.paymentMethod === "zelle";
                      const isCancelled = booking.status === "cancelled";
                      const isSelected = selectedBookingId === booking._id;

                      const hasBalanceProof = Boolean(booking.remainingZelleProofUrl);
                      const hasPendingBreakdownEntry = Boolean(
                        booking.paymentBreakdown?.some(p => p.status === "pending" && (p.paymentType === "balance_partial" || p.paymentType === "balance_full"))
                      );
                      const isBalancePending = (hasBalanceProof || hasPendingBreakdownEntry) && !isFullyPaid;
                      const isDepositPending = isZelle && booking.zelleVerificationStatus !== "verified" && !isDepositPaid;

                      const rowCatering = parseCateringDetails(booking);
                      const hasRowPartnerCatering = Boolean(booking.cateringMenu && booking.cateringMenu !== "none" && booking.cateringMenu !== "no_catering");
                      const rowTables = booking.tables || [];

                      return (
                        <Fragment key={booking._id}>
                          <tr
                            onClick={() => setSelectedBookingId(booking._id)}
                            className={cn(
                              "cursor-pointer transition-colors",
                              isSelected ? "bg-primary/5" : "hover:bg-surface-container-low/20"
                            )}
                          >
                          {/* Date & Time */}
                          <td className="px-5 py-5 align-top space-y-1">
                            <p className="font-headline text-lg italic text-on-surface leading-snug">
                              {formatBookingDate(booking.bookingDate, { month: "short", day: "numeric", year: "numeric" })}
                            </p>
                            <p className="text-xs text-outline">{booking.bookingTime} ({booking.durationHours || 5}h)</p>
                            <p className="text-[10px] text-outline/50 font-mono pt-1">Short ID: #{booking._id.slice(-6).toUpperCase()}</p>
                            <div className="flex items-center gap-1 pt-0.5">
                              <span className="text-[9px] font-mono text-outline/60 break-all leading-tight">{booking._id}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyId(booking._id);
                                }}
                                className="shrink-0 p-1 rounded hover:bg-surface-container-low text-outline hover:text-primary transition-colors"
                                title="Copy full booking ID"
                              >
                                {copiedId === booking._id
                                  ? <Check className="w-3 h-3 text-emerald-400" />
                                  : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                          </td>

                          {/* Occasion & Venue Buyout */}
                          <td className="px-5 py-5 align-top space-y-2">
                            <p className="text-sm font-bold text-on-surface capitalize">{booking.occasion}</p>
                            <p className="text-xs text-outline">{booking.partySize} Guests</p>
                            <div className="pt-0.5">
                              <span className="inline-flex items-center gap-1 text-[10px] bg-primary/10 text-primary border border-primary/25 px-2 py-1 rounded-md font-bold tracking-wide">
                                <Star className="w-3 h-3 text-[#C8A96A]" fill="currentColor" />
                                <span>Exclusive Venue Buyout</span>
                              </span>
                            </div>
                          </td>

                          {/* Catering & Menu */}
                          <td className="px-5 py-5 align-top space-y-2.5">
                            <div className="flex items-center gap-1.5 text-xs text-secondary font-semibold">
                              <UtensilsCrossed className="w-3.5 h-3.5 text-primary shrink-0" />
                              <span className="truncate">{rowCatering.restaurantLabel}</span>
                            </div>

                            {/* Button under the restaurant to edit the booking menu */}
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingMenuBooking(booking);
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase transition-all bg-[#C8A96A]/20 hover:bg-[#C8A96A]/30 text-[#E8CB8A] border border-[#C8A96A]/40 shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                              >
                                <UtensilsCrossed className="w-3 h-3 text-[#C8A96A]" />
                                <span>Edit Booking Menu</span>
                              </button>
                            </div>

                            {/* Dishes List / Badges */}
                            {rowCatering.dishes.length > 0 ? (
                              <div className="flex flex-wrap items-center gap-1 pt-0.5">
                                {(expandedDishesBookingIds[booking._id] ? rowCatering.dishes : rowCatering.dishes.slice(0, 3)).map((d, dIdx) => (
                                  <span key={dIdx} className="text-[9px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-white/80 truncate max-w-[150px]">
                                    {d}
                                  </span>
                                ))}
                                {rowCatering.dishes.length > 3 && (
                                  <button
                                    type="button"
                                    onClick={(e) => toggleExpandDishes(booking._id, e)}
                                    className="text-[9px] text-[#C8A96A] hover:text-white font-bold bg-[#C8A96A]/10 hover:bg-[#C8A96A]/20 border border-[#C8A96A]/30 px-1.5 py-0.5 rounded transition-all cursor-pointer"
                                    title={expandedDishesBookingIds[booking._id] ? "Collapse dishes" : "Show all dishes"}
                                  >
                                    {expandedDishesBookingIds[booking._id] ? "Show less" : `+${rowCatering.dishes.length - 3} more`}
                                  </button>
                                )}
                              </div>
                            ) : (
                              <p className="text-[10px] text-outline italic">No dishes chosen yet</p>
                            )}

                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-on-surface pt-0.5">
                              <span className="flex items-center gap-1">
                                <Music className="w-3 h-3 text-primary shrink-0" />
                                <span>{booking.needDj ? "DJ Requested" : "No DJ"}</span>
                              </span>
                              {booking.needPhotographer && (
                                <span className="flex items-center gap-1 text-[#E8CB8A]">
                                  <span>📷</span>
                                  <span>Photo ({booking.photographerHours || 2}h)</span>
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Payment & Verification Column */}
                          <td className="px-5 py-5 align-top space-y-2.5">
                            {/* Verification Badges */}
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className={cn(
                                "px-2 py-0.5 rounded-full text-[9px] uppercase tracking-widest font-extrabold border",
                                booking.paymentMethod === "cash"
                                  ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                                  : booking.paymentMethod === "zelle"
                                  ? "bg-purple-500/10 text-purple-300 border-purple-500/30"
                                  : booking.paymentMethod === "bank_transfer"
                                  ? "bg-blue-500/10 text-blue-300 border-blue-500/30"
                                  : "bg-primary/10 text-primary border-primary/20"
                              )}>
                                {booking.paymentMethod === "cash"
                                  ? "💵 Cash"
                                  : booking.paymentMethod === "zelle"
                                  ? "⚡ Zelle"
                                  : booking.paymentMethod === "bank_transfer"
                                  ? "🏦 Transfer"
                                  : "💳 Card"}
                              </span>

                              {isFullyPaid ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-widest font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                  <CheckCircle2 className="w-3 h-3" /> Fully Settled
                                </span>
                              ) : isBalancePending ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-widest font-extrabold bg-purple-500/15 text-purple-300 border border-purple-500/30 animate-pulse">
                                  <Clock className="w-3 h-3" /> Balance Pending Review
                                </span>
                              ) : isDepositPending ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-widest font-extrabold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                  <AlertCircle className="w-3 h-3" /> Deposit Pending Verification
                                </span>
                              ) : isDepositPaid ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-widest font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                  <CheckCircle2 className="w-3 h-3" /> Deposit Verified (${booking.depositAmount || 300})
                                </span>
                              ) : null}

                              {isZelle && booking.zelleVerificationStatus === "mismatched" && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-widest font-extrabold bg-red-500/10 text-red-400 border border-red-500/30">
                                  <XCircle className="w-3 h-3" /> Zelle Mismatch
                                </span>
                              )}
                            </div>

                            {/* Uploaded Zelle Receipts: Deposit, Balance & Food */}
                            {(booking.zelleProofUrl || booking.remainingZelleProofUrl || booking.foodZelleProofUrl) && (
                              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-outline-variant/10">
                                {booking.zelleProofUrl && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPreviewProof({ url: booking.zelleProofUrl!, booking, proofType: "deposit" });
                                    }}
                                    className="inline-flex items-center gap-1 text-[10px] text-purple-300 hover:text-purple-200 underline font-bold bg-purple-500/10 hover:bg-purple-500/20 px-2 py-0.5 rounded border border-purple-500/20 transition-colors"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>Deposit Receipt</span>
                                  </button>
                                )}
                                {booking.remainingZelleProofUrl && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPreviewProof({ url: booking.remainingZelleProofUrl!, booking, proofType: "balance" });
                                    }}
                                    className="inline-flex items-center gap-1 text-[10px] text-blue-300 hover:text-blue-200 underline font-bold bg-blue-500/10 hover:bg-blue-500/20 px-2 py-0.5 rounded border border-blue-500/20 transition-colors"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>Balance Receipt {isBalancePending ? "(Pending)" : "(Verified)"}</span>
                                  </button>
                                )}
                                {booking.foodZelleProofUrl && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPreviewProof({ url: booking.foodZelleProofUrl!, booking, proofType: "food" });
                                    }}
                                    className="inline-flex items-center gap-1 text-[10px] text-emerald-300 hover:text-emerald-200 underline font-bold bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/20 transition-colors"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>Food Receipt {booking.foodPaymentStatus === "pending_verification" ? "(Pending)" : "(Verified)"}</span>
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Quote Proposal Alert & Decision Card */}
                            {hasRowPartnerCatering && booking.offerPrice ? (
                              <div className={cn(
                                "p-3 rounded-xl border space-y-2 text-xs",
                                booking.offerStatus === "accepted"
                                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                                  : booking.offerStatus === "declined"
                                  ? "bg-red-500/10 border-red-500/30 text-red-300"
                                  : booking.offerStatus === "pending"
                                  ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                                  : "bg-gold-gradient/10 border-primary/40 text-on-surface shadow-sm"
                              )}>
                                <div className="flex items-center justify-between gap-1 flex-wrap">
                                  <span className="text-[10px] uppercase font-bold tracking-wider text-primary flex items-center gap-1">
                                    <Sparkles className="w-3 h-3 text-[#C8A96A]" />
                                    {booking.offerStatus === "accepted"
                                      ? "Quote Accepted"
                                      : booking.offerStatus === "declined"
                                      ? "Quote Declined"
                                      : booking.offerStatus === "pending"
                                      ? "Revised Quote in Review"
                                      : "Quote Proposal from Tropica"}
                                  </span>
                                  <div className="text-right">
                                    <span className="font-headline italic text-base font-bold text-primary block leading-none">
                                      ${booking.offerPrice.toFixed(2)}
                                    </span>
                                    {booking.foodBasePrice && (
                                      <span className="text-[9px] text-[#C8A96A] font-semibold">
                                        (${booking.foodBasePrice.toFixed(2)} + ${booking.foodServiceFee ?? 50} fee)
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {booking.negotiationNotes && (
                                  <p className="text-[11px] text-secondary leading-tight italic bg-surface-container-lowest/80 p-1.5 rounded border border-outline-variant/10">
                                    &ldquo;{booking.negotiationNotes}&rdquo;
                                  </p>
                                )}

                                {/* Decision Actions for Guest */}
                                {booking.offerStatus === "offered" ? (
                                  <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                                    <button
                                      type="button"
                                      disabled={respondingQuoteId === booking._id}
                                      onClick={(e) => handleQuoteResponse(booking._id, "accept", e)}
                                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-sm transition-all"
                                    >
                                      {respondingQuoteId === booking._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                                      <span>Accept Quote</span>
                                    </button>

                                    <button
                                      type="button"
                                      disabled={respondingQuoteId === booking._id}
                                      onClick={(e) => handleQuoteResponse(booking._id, "reject", e)}
                                      className="px-2 py-1 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-[10px] font-bold uppercase tracking-wider transition-colors"
                                    >
                                      <span>Decline</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingMenuBooking(booking);
                                      }}
                                      className="px-2 py-1 rounded-lg border border-[#C8A96A]/40 text-[#E8CB8A] hover:bg-[#C8A96A]/15 text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1"
                                      title="Edit menu to request revised quote"
                                    >
                                      <UtensilsCrossed className="w-2.5 h-2.5" />
                                      <span>Edit Menu</span>
                                    </button>
                                  </div>
                                ) : booking.offerStatus === "accepted" ? (
                                  <div className="pt-1 space-y-1.5">
                                    {booking.foodPaymentStatus === "paid" ? (
                                      <div className="flex items-center justify-between bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1.5 rounded-lg text-emerald-300 text-[11px] font-bold">
                                        <span className="flex items-center gap-1.5">
                                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                          Food Catering Paid
                                        </span>
                                        <span className="font-mono">${booking.offerPrice.toFixed(2)}</span>
                                      </div>
                                    ) : booking.foodPaymentStatus === "pending_verification" ? (
                                      <div className="flex items-center justify-between bg-amber-500/15 border border-amber-500/30 px-2.5 py-1.5 rounded-lg text-amber-300 text-[11px] font-semibold">
                                        <span className="flex items-center gap-1.5">
                                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                                          Food Zelle Under Review
                                        </span>
                                        {booking.foodZelleProofUrl && (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setPreviewProof({ url: booking.foodZelleProofUrl!, booking, proofType: "food" });
                                            }}
                                            className="text-primary hover:text-white underline text-[10px]"
                                          >
                                            View Proof
                                          </button>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="space-y-1">
                                        <Link
                                          href={`/user/payment?bookingId=${booking._id}&is_food=true`}
                                          onClick={(e) => e.stopPropagation()}
                                          className="w-full text-center px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#C8A96A] via-[#dfbf7b] to-[#C8A96A] text-stone-950 font-bold text-[11px] uppercase tracking-wider shadow-sm hover:brightness-105 transition-all flex items-center justify-center gap-1.5"
                                        >
                                          <CreditCard className="w-3.5 h-3.5" />
                                          <span>Pay Food Price (${booking.offerPrice.toFixed(2)})</span>
                                        </Link>
                                        <div className="flex items-center justify-between text-[10px] text-stone-400 px-0.5">
                                          <span>Stripe Card or Zelle</span>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setEditingMenuBooking(booking);
                                            }}
                                            className="text-[#C8A96A] hover:underline"
                                          >
                                            Edit Menu
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ) : booking.offerStatus === "declined" ? (
                                  <div className="pt-0.5">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingMenuBooking(booking);
                                      }}
                                      className="text-[10px] font-bold text-primary underline hover:text-white"
                                    >
                                      Edit Menu to Request New Quote →
                                    </button>
                                  </div>
                                ) : booking.offerStatus === "pending" ? (
                                  <p className="text-[10px] text-amber-300/80 italic">
                                    Menu updated. Tropica team is preparing your revised quote proposal.
                                  </p>
                                ) : null}
                              </div>
                            ) : null}

                            {/* === PAYMENT BREAKDOWN: Venue vs Food — Completely Separated === */}
                            <div className="space-y-2 pt-2 border-t border-outline-variant/10">

                              {/* Venue Buyout Block */}
                              <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 overflow-hidden">
                                <div className="px-3 py-1.5 bg-blue-500/10 border-b border-blue-500/15 flex items-center justify-between">
                                  <span className="text-[9px] uppercase tracking-widest font-extrabold text-blue-300">🏛️ Venue Buyout</span>
                                  <span className="text-[10px] font-mono font-bold text-on-surface">${booking.totalAmount?.toFixed(2) ?? "0.00"}</span>
                                </div>
                                <div className="px-3 py-2 space-y-1 text-[11px]">
                                  <div className="flex justify-between items-center text-[10px] text-stone-400 pb-1 border-b border-blue-500/10">
                                    <span>Venue Inclusions:</span>
                                    <span className="text-[#C8A96A] font-semibold">
                                      ${((booking.durationHours || 5) * 100).toLocaleString()} Base ({booking.durationHours || 5}h)
                                      {booking.needDj ? " + $300 DJ" : ""}
                                      {booking.needPhotographer ? ` + $${300 + Math.max(0, (booking.photographerHours || 2) - 2) * 150} Photo` : ""}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-outline">Deposit Paid:</span>
                                    <span className="text-emerald-400 font-bold font-mono">✓ ${(booking.depositAmount || 300).toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-outline">Venue Balance:</span>
                                    <span className={cn("font-bold font-mono", isFullyPaid ? "text-emerald-400" : isBalancePending ? "text-purple-300" : "text-amber-400")}>
                                      {isFullyPaid ? "$0.00 (Settled)" : `$${remainingAmt.toFixed(2)} ${isBalancePending ? "(Pending)" : "(Due)"}`}
                                    </span>
                                  </div>
                                  {booking.paymentDueDate && !isFullyPaid && remainingAmt > 0 && (
                                    <div className="flex justify-between items-center pt-1 border-t border-blue-500/10 text-[10px]">
                                      <span className="text-stone-400 flex items-center gap-1">
                                        <Clock className="w-3 h-3 text-amber-400" />
                                        <span>Payment Due:</span>
                                      </span>
                                      <span className="font-semibold text-amber-300">
                                        {formatVenueDateTime(booking.paymentDueDate, {
                                          month: "short",
                                          day: "numeric",
                                          hour: "numeric",
                                          minute: "2-digit"
                                        })}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Food Catering Block */}
                              {booking.offerPrice ? (
                                <div className="rounded-lg border border-primary/25 bg-primary/5 overflow-hidden">
                                  <div className="px-3 py-1.5 bg-primary/10 border-b border-primary/15 flex items-center justify-between">
                                    <span className="text-[9px] uppercase tracking-widest font-extrabold text-primary">🍽️ Food Catering</span>
                                    <span className={cn(
                                      "text-[9px] font-bold uppercase px-1.5 py-0.2 rounded border",
                                      booking.foodPaymentStatus === "paid"
                                        ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                                        : booking.foodPaymentStatus === "pending_verification"
                                        ? "text-purple-300 bg-purple-500/10 border-purple-500/20"
                                        : "text-amber-300 bg-amber-500/10 border-amber-500/20"
                                    )}>
                                      {booking.foodPaymentStatus === "paid" ? "Paid" : booking.foodPaymentStatus === "pending_verification" ? "Pending" : "Unpaid"}
                                    </span>
                                  </div>
                                  <div className="px-3 py-2 space-y-1 text-[11px]">
                                    {booking.foodBasePrice && (
                                      <div className="flex justify-between items-center text-[10px] text-stone-400">
                                        <span>${booking.foodBasePrice.toFixed(2)} food + $50 fee</span>
                                        <span className="font-mono font-bold text-primary">${booking.offerPrice.toFixed(2)}</span>
                                      </div>
                                    )}
                                    <div className="flex justify-between items-center">
                                      <span className="text-outline">Food Quote:</span>
                                      <span className="font-mono font-bold text-primary">${booking.offerPrice.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-outline">Food Paid:</span>
                                      <span className={cn("font-bold font-mono", booking.foodPaymentStatus === "paid" ? "text-emerald-400" : "text-stone-500")}>
                                        {booking.foodPaymentStatus === "paid" ? `$${booking.offerPrice.toFixed(2)}` : "$0.00"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ) : hasRowPartnerCatering ? (
                                <div className="rounded-lg border border-outline-variant/10 bg-surface-container-low/30 px-3 py-2 flex justify-between items-center text-[11px]">
                                  <span className="text-outline">🍽️ Food Quote:</span>
                                  <span className="text-amber-400 font-bold">Not sent yet</span>
                                </div>
                              ) : null}

                              {/* Total Paid Row */}
                              <div className="flex justify-between items-center px-1 pt-1 border-t border-outline-variant/10 text-[11px] font-bold">
                                <span className="text-stone-300">Total Paid For Event:</span>
                                <span className="text-emerald-400 font-mono">
                                  ${(
                                    ((booking.paymentStatus === "deposit_paid" || booking.paymentStatus === "paid" || isFullyPaid) ? (booking.depositAmount || 300) : 0) +
                                    (booking.remainingPaymentStatus === "paid" ? remainingAmt : 0) +
                                    (booking.foodPaymentStatus === "paid" ? (booking.offerPrice || 0) : 0)
                                  ).toFixed(2)}
                                </span>
                              </div>
                              {/* Installment History Breakdown */}
                              {booking.paymentBreakdown && booking.paymentBreakdown.length > 0 && (
                                <div className="mt-2 pt-1.5 border-t border-outline-variant/10 space-y-1">
                                  <span className="text-[9px] uppercase tracking-widest font-bold text-outline block">
                                    Installment History:
                                  </span>
                                  <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                                    {booking.paymentBreakdown.map((item, idx) => (
                                      <div
                                        key={item._id || idx}
                                        className="flex items-center justify-between text-[10px] bg-surface-container-low/60 px-2 py-1 rounded border border-outline-variant/10"
                                      >
                                        <div className="flex items-center gap-1 text-on-surface">
                                          <span className="font-mono font-bold">${item.amount?.toFixed(2)}</span>
                                          <span className="text-outline capitalize">({item.paymentType?.replace("_", " ")})</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          <span className={cn(
                                            "text-[9px] font-bold uppercase px-1.5 py-0.2 rounded",
                                            item.status === "verified" ? "text-emerald-400 bg-emerald-500/10" : "text-amber-300 bg-amber-500/10"
                                          )}>
                                            {item.status}
                                          </span>
                                          {item.proofUrl && (
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setPreviewProof({ url: item.proofUrl!, booking, proofType: item.paymentType === "deposit" ? "deposit" : "balance" });
                                              }}
                                              className="text-primary hover:text-white"
                                              title="View receipt"
                                            >
                                              <Eye className="w-3 h-3" />
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Actions Column */}
                          <td className="px-5 py-5 align-top text-right space-y-2">
                            {isCancelled ? (
                              <span className="text-[10px] font-bold tracking-widest uppercase text-error block">
                                Cancelled
                              </span>
                            ) : (
                              <div className="flex flex-col items-end gap-2">
                                {!isFullyPaid && remainingAmt > 0 && (
                                  <Link
                                    href={`/user/payment?is_balance=true&bookingId=${booking._id}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className={cn(
                                      "inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase transition-all shadow-sm",
                                      isBalancePending
                                        ? "bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30"
                                        : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30"
                                    )}
                                  >
                                    <CreditCard className="w-3 h-3" />
                                    <span>{isBalancePending ? "Installment" : `Pay Balance ($${remainingAmt.toFixed(0)})`}</span>
                                  </Link>
                                )}

                                {/* Cancel Booking Button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCancellingBooking(booking);
                                  }}
                                  className="inline-flex items-center gap-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-2.5 py-1 rounded-lg text-[9px] font-bold tracking-widest uppercase transition-colors"
                                >
                                  <XCircle className="w-3 h-3" />
                                  <span>Cancel</span>
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>

                        {/* Expandable History Timeline Row */}
                        <tr className="bg-surface-container-low/15 border-b border-outline-variant/15">
                          <td colSpan={5} className="px-5 py-2.5">
                            <QuoteHistoryTimeline booking={booking} />
                          </td>
                        </tr>
                      </Fragment>
                    );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card Layout */}
              <div className="md:hidden space-y-6">
                {bookings.map((booking) => {
                  const remainingAmt = booking.remainingAmount ?? 0;
                  const isFullyPaid = booking.remainingPaymentStatus === "paid" || (booking.paymentStatus === "paid" && remainingAmt === 0);
                  const isDepositPaid = booking.paymentStatus === "deposit_paid" || isFullyPaid;
                  const isZelle = booking.paymentMethod === "zelle";
                  const isCancelled = booking.status === "cancelled";

                  const hasBalanceProof = Boolean(booking.remainingZelleProofUrl);
                  const hasPendingBreakdownEntry = Boolean(
                    booking.paymentBreakdown?.some(p => p.status === "pending" && (p.paymentType === "balance_partial" || p.paymentType === "balance_full"))
                  );
                  const isBalancePending = (hasBalanceProof || hasPendingBreakdownEntry) && !isFullyPaid;
                  const isDepositPending = isZelle && booking.zelleVerificationStatus !== "verified" && !isDepositPaid;

                  const cardCatering = parseCateringDetails(booking);
                  const hasCardPartnerCatering = Boolean(booking.cateringMenu && booking.cateringMenu !== "none" && booking.cateringMenu !== "no_catering");
                  const cardTables = booking.tables || [];

                  return (
                    <div key={booking._id} className="p-5 rounded-2xl border border-outline-variant/15 bg-surface-container-lowest ambient-shadow space-y-4">
                      <div className="flex justify-between items-start border-b border-outline-variant/10 pb-4">
                        <div className="space-y-1">
                          <p className="font-headline text-xl italic text-on-surface">
                            {formatBookingDate(booking.bookingDate, { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                          <p className="text-xs text-outline">{booking.bookingTime} ({booking.durationHours || 5} Hours)</p>
                          <div className="flex items-center gap-1 pt-0.5">
                            <span className="text-[9px] font-mono text-outline/60 break-all leading-tight">{booking._id}</span>
                            <button
                              onClick={() => handleCopyId(booking._id)}
                              className="shrink-0 p-1 rounded hover:bg-surface-container-low text-outline hover:text-primary transition-colors"
                              title="Copy full booking ID"
                            >
                              {copiedId === booking._id
                                ? <Check className="w-3 h-3 text-emerald-400" />
                                : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>
                        {isCancelled && (
                          <span className="text-[10px] font-bold tracking-widest uppercase text-error">
                            Cancelled
                          </span>
                        )}
                      </div>

                      {/* Occasion & Venue Buyout */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-on-surface capitalize">{booking.occasion}</span>
                          <span className="text-outline">{booking.partySize} Guests</span>
                        </div>
                        <div>
                          <span className="inline-flex items-center gap-1.5 text-[10px] bg-primary/10 text-primary border border-primary/25 px-2 py-0.5 rounded font-bold tracking-wide">
                            <Star className="w-3 h-3 text-[#C8A96A]" fill="currentColor" />
                            <span>Exclusive Venue Buyout</span>
                          </span>
                        </div>
                      </div>

                      {/* Catering Restaurant & Dishes */}
                      <div className="p-3.5 rounded-xl bg-surface-container-low/40 border border-outline-variant/10 space-y-2.5 text-xs">
                        <div className="flex items-center gap-1.5 text-secondary font-semibold">
                          <UtensilsCrossed className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>{cardCatering.restaurantLabel}</span>
                        </div>

                        {/* Button under the restaurant to edit the booking menu */}
                        <div>
                          <button
                            type="button"
                            onClick={() => setEditingMenuBooking(booking)}
                            className="inline-flex items-center gap-1.5 bg-[#C8A96A]/20 hover:bg-[#C8A96A]/30 text-[#E8CB8A] border border-[#C8A96A]/40 px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase transition-all"
                          >
                            <UtensilsCrossed className="w-3 h-3 text-[#C8A96A]" />
                            <span>Edit Booking Menu</span>
                          </button>
                        </div>

                        {cardCatering.dishes.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1">
                            {(expandedDishesBookingIds[booking._id] ? cardCatering.dishes : cardCatering.dishes.slice(0, 3)).map((dish, dI) => (
                              <span key={dI} className="text-[9px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-white/80">
                                {dish}
                              </span>
                            ))}
                            {cardCatering.dishes.length > 3 && (
                              <button
                                type="button"
                                onClick={(e) => toggleExpandDishes(booking._id, e)}
                                className="text-[9px] text-[#C8A96A] hover:text-white font-bold bg-[#C8A96A]/10 hover:bg-[#C8A96A]/20 border border-[#C8A96A]/30 px-1.5 py-0.5 rounded transition-all cursor-pointer"
                              >
                                {expandedDishesBookingIds[booking._id] ? "Show less" : `+${cardCatering.dishes.length - 3} more`}
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Quote Proposal Alert & Decision Card for Guest */}
                      {hasCardPartnerCatering && booking.offerPrice ? (
                        <div className={cn(
                          "p-3.5 rounded-xl border space-y-2.5 text-xs",
                          booking.offerStatus === "accepted"
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                            : booking.offerStatus === "declined"
                            ? "bg-red-500/10 border-red-500/30 text-red-300"
                            : booking.offerStatus === "pending"
                            ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                            : "bg-[#C8A96A]/10 border-primary/40 text-on-surface shadow-sm"
                        )}>
                          <div className="flex items-center justify-between gap-1 flex-wrap">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-primary flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-[#C8A96A]" />
                              {booking.offerStatus === "accepted"
                                ? "Quote Accepted"
                                : booking.offerStatus === "declined"
                                ? "Quote Declined"
                                : booking.offerStatus === "pending"
                                ? "Revised Quote in Review"
                                : "Quote Proposal from Tropica"}
                            </span>
                            <div className="text-right">
                              <span className="font-headline italic text-lg font-bold text-primary block leading-none">
                                ${booking.offerPrice.toFixed(2)}
                              </span>
                              {booking.foodBasePrice && (
                                <span className="text-[9px] text-[#C8A96A] font-semibold">
                                  (${booking.foodBasePrice.toFixed(2)} + ${booking.foodServiceFee ?? 50} fee)
                                </span>
                              )}
                            </div>
                          </div>

                          {booking.negotiationNotes && (
                            <p className="text-[11px] text-secondary leading-tight italic bg-surface-container-lowest/80 p-2 rounded border border-outline-variant/10">
                              &ldquo;{booking.negotiationNotes}&rdquo;
                            </p>
                          )}

                          {/* Decision Actions for Guest */}
                          {booking.offerStatus === "offered" ? (
                            <div className="pt-1 flex items-center gap-2 flex-wrap">
                              <button
                                type="button"
                                disabled={respondingQuoteId === booking._id}
                                onClick={(e) => handleQuoteResponse(booking._id, "accept", e)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-sm transition-all"
                              >
                                {respondingQuoteId === booking._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                                <span>Accept Quote</span>
                              </button>

                              <button
                                type="button"
                                disabled={respondingQuoteId === booking._id}
                                onClick={(e) => handleQuoteResponse(booking._id, "reject", e)}
                                className="px-2.5 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-[10px] font-bold uppercase tracking-wider transition-colors"
                              >
                                <span>Decline</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setEditingMenuBooking(booking)}
                                className="px-2.5 py-1.5 rounded-lg border border-[#C8A96A]/40 text-[#E8CB8A] hover:bg-[#C8A96A]/15 text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1"
                                title="Edit menu to request revised quote"
                              >
                                <UtensilsCrossed className="w-2.5 h-2.5" />
                                <span>Edit Menu</span>
                              </button>
                            </div>
                          ) : booking.offerStatus === "accepted" ? (
                            <div className="pt-1 space-y-2">
                              {booking.foodPaymentStatus === "paid" ? (
                                <div className="flex items-center justify-between bg-emerald-500/15 border border-emerald-500/30 px-3 py-2 rounded-lg text-emerald-300 text-xs font-bold">
                                  <span className="flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    Food Catering Paid
                                  </span>
                                  <span className="font-mono">${booking.offerPrice.toFixed(2)}</span>
                                </div>
                              ) : booking.foodPaymentStatus === "pending_verification" ? (
                                <div className="flex items-center justify-between bg-amber-500/15 border border-amber-500/30 px-3 py-2 rounded-lg text-amber-300 text-xs font-semibold">
                                  <span className="flex items-center gap-1.5">
                                    <Clock className="w-4 h-4 text-amber-400" />
                                    Food Zelle Under Review
                                  </span>
                                  {booking.foodZelleProofUrl && (
                                    <button
                                      type="button"
                                      onClick={() => setPreviewProof({ url: booking.foodZelleProofUrl!, booking, proofType: "food" })}
                                      className="text-primary hover:text-white underline text-[11px]"
                                    >
                                      View Proof
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <div className="space-y-1.5">
                                  <Link
                                    href={`/user/payment?bookingId=${booking._id}&is_food=true`}
                                    className="w-full text-center px-4 py-2 rounded-lg bg-gradient-to-r from-[#C8A96A] via-[#dfbf7b] to-[#C8A96A] text-stone-950 font-bold text-xs uppercase tracking-wider shadow-md hover:brightness-105 transition-all flex items-center justify-center gap-2"
                                  >
                                    <CreditCard className="w-4 h-4" />
                                    <span>Pay Food Price (${booking.offerPrice.toFixed(2)})</span>
                                  </Link>
                                  <div className="flex items-center justify-between text-[10px] text-stone-400 px-1">
                                    <span>Stripe Card or Zelle</span>
                                    <button
                                      type="button"
                                      onClick={() => setEditingMenuBooking(booking)}
                                      className="text-[#C8A96A] underline hover:text-white"
                                    >
                                      Edit Menu
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : booking.offerStatus === "declined" ? (
                            <div className="pt-0.5">
                              <button
                                type="button"
                                onClick={() => setEditingMenuBooking(booking)}
                                className="text-[10px] font-bold text-primary underline hover:text-white"
                              >
                                Edit Menu to Request New Quote →
                              </button>
                            </div>
                          ) : booking.offerStatus === "pending" ? (
                            <p className="text-[10px] text-amber-300/80 italic">
                              Menu updated. Tropica team is preparing your revised quote proposal.
                            </p>
                          ) : null}
                        </div>
                      ) : null}

                      {/* Payment Breakdown & Receipts */}
                      <div className="pt-2 border-t border-outline-variant/10 space-y-2 text-xs">
                        {/* Verification Badges */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[9px] uppercase tracking-widest font-extrabold border",
                            isZelle
                              ? "bg-purple-500/10 text-purple-300 border-purple-500/30"
                              : booking.paymentMethod === "cash"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : booking.paymentMethod === "bank_transfer"
                              ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                              : "bg-primary/10 text-primary border-primary/20"
                          )}>
                            {isZelle
                              ? "⚡ Zelle"
                              : booking.paymentMethod === "cash"
                              ? "💵 Cash"
                              : booking.paymentMethod === "bank_transfer"
                              ? "🏦 Transfer"
                              : "💳 Card"}
                          </span>

                          {isFullyPaid ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-widest font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" /> Fully Settled
                            </span>
                          ) : isBalancePending ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-widest font-extrabold bg-purple-500/15 text-purple-300 border border-purple-500/30 animate-pulse">
                              <Clock className="w-3 h-3" /> Balance Pending Review
                            </span>
                          ) : isDepositPending ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-widest font-extrabold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              <AlertCircle className="w-3 h-3" /> Deposit Pending Verification
                            </span>
                          ) : isDepositPaid ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-widest font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" /> Deposit Verified (${booking.depositAmount || 300})
                            </span>
                          ) : null}
                        </div>

                        {/* Receipts */}
                        {(booking.zelleProofUrl || booking.remainingZelleProofUrl || booking.foodZelleProofUrl) && (
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            {booking.zelleProofUrl && (
                              <button
                                type="button"
                                onClick={() => setPreviewProof({ url: booking.zelleProofUrl!, booking, proofType: "deposit" })}
                                className="inline-flex items-center gap-1 text-[10px] text-purple-300 underline font-bold bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20"
                              >
                                <Eye className="w-3 h-3" /> Deposit Receipt
                              </button>
                            )}
                            {booking.remainingZelleProofUrl && (
                              <button
                                type="button"
                                onClick={() => setPreviewProof({ url: booking.remainingZelleProofUrl!, booking, proofType: "balance" })}
                                className="inline-flex items-center gap-1 text-[10px] text-blue-300 underline font-bold bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20"
                              >
                                <Eye className="w-3 h-3" /> Balance Receipt {isBalancePending ? "(Pending)" : "(Verified)"}
                              </button>
                            )}
                            {booking.foodZelleProofUrl && (
                              <button
                                type="button"
                                onClick={() => setPreviewProof({ url: booking.foodZelleProofUrl!, booking, proofType: "food" })}
                                className="inline-flex items-center gap-1 text-[10px] text-emerald-300 underline font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20"
                              >
                                <Eye className="w-3 h-3" /> Food Receipt {booking.foodPaymentStatus === "pending_verification" ? "(Pending)" : "(Verified)"}
                              </button>
                            )}
                          </div>
                        )}

                        <div className="space-y-2 pt-1">
                          {/* Venue Section */}
                          <div className="bg-surface-container-low/50 p-2.5 rounded-lg border border-outline-variant/10 space-y-1">
                            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-outline">
                              <span>Venue Buyout Reservation</span>
                              <span className="font-mono text-on-surface">${booking.totalAmount?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-stone-400">
                              <span>Duration:</span>
                              <span className="text-[#C8A96A] font-semibold">${((booking.durationHours || 5) * 100).toLocaleString()} ({booking.durationHours || 5}h @ $100/h)</span>
                            </div>
                            <div className="flex justify-between items-center text-[11px]">
                              <span className="text-outline">Deposit Paid:</span>
                              <span className="text-emerald-400 font-semibold font-mono">${(booking.depositAmount || 300).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-[11px]">
                              <span className="text-outline">Remaining Balance:</span>
                              <span className={cn("font-bold font-mono", isFullyPaid ? "text-emerald-400" : isBalancePending ? "text-purple-300" : "text-amber-400")}>
                                {isFullyPaid ? "$0.00 (Settled)" : `$${remainingAmt.toFixed(2)} ${isBalancePending ? "(Pending Review)" : "(Due)"}`}
                              </span>
                            </div>
                            {booking.paymentDueDate && !isFullyPaid && remainingAmt > 0 && (
                              <div className="flex justify-between items-center pt-1 border-t border-outline-variant/10 text-[10px]">
                                <span className="text-stone-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-amber-400" />
                                  <span>Payment Due:</span>
                                </span>
                                <span className="font-semibold text-amber-300">
                                  {formatVenueDateTime(booking.paymentDueDate, {
                                    month: "short",
                                    day: "numeric",
                                    hour: "numeric",
                                    minute: "2-digit"
                                  })}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Food Catering Section */}
                          {hasCardPartnerCatering && booking.offerPrice && (
                            <div className="bg-surface-container-low/50 p-2.5 rounded-lg border border-outline-variant/10 space-y-1">
                              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                                <span className="text-primary">Food Catering Package</span>
                                <span className={cn(
                                  "px-1.5 py-0.2 rounded text-[9px]",
                                  booking.foodPaymentStatus === "paid"
                                    ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                                    : booking.foodPaymentStatus === "pending_verification"
                                    ? "text-purple-300 bg-purple-500/10 border border-purple-500/20"
                                    : "text-amber-300 bg-amber-500/10 border border-amber-500/20"
                                )}>
                                  {booking.foodPaymentStatus === "paid" ? "Paid" : booking.foodPaymentStatus === "pending_verification" ? "Review Pending" : "Unpaid"}
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-[11px]">
                                <span className="text-outline">Food Total Quote:</span>
                                <span className="font-mono font-bold text-primary">${booking.offerPrice.toFixed(2)}</span>
                              </div>
                              {booking.foodBasePrice && (
                                <div className="text-[10px] text-stone-400 flex justify-between">
                                  <span>Breakdown:</span>
                                  <span>${booking.foodBasePrice.toFixed(2)} food + ${booking.foodServiceFee ?? 50} fee</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Total Paid For Event */}
                          <div className="flex justify-between items-center pt-1 px-1 font-bold text-[11px] border-t border-outline-variant/10">
                            <span className="text-stone-300">Total Paid For Event:</span>
                            <span className="text-emerald-400 font-mono text-xs">
                              ${(
                                ((booking.paymentStatus === "deposit_paid" || booking.paymentStatus === "paid" || isFullyPaid) ? (booking.depositAmount || 300) : 0) +
                                (booking.remainingPaymentStatus === "paid" ? remainingAmt : 0) +
                                (booking.foodPaymentStatus === "paid" ? (booking.offerPrice || 0) : 0)
                              ).toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Installment History Breakdown */}
                        {booking.paymentBreakdown && booking.paymentBreakdown.length > 0 && (
                          <div className="mt-2 pt-1.5 border-t border-outline-variant/10 space-y-1">
                            <span className="text-[9px] uppercase tracking-widest font-bold text-outline block">
                              Installment Payments:
                            </span>
                            <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                              {booking.paymentBreakdown.map((item, idx) => (
                                <div
                                  key={item._id || idx}
                                  className="flex items-center justify-between text-[10px] bg-surface-container-low/60 px-2 py-1 rounded border border-outline-variant/10"
                                >
                                  <div className="flex items-center gap-1 text-on-surface">
                                    <span className="font-mono font-bold">${item.amount?.toFixed(2)}</span>
                                    <span className="text-outline capitalize">({item.paymentType?.replace("_", " ")})</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className={cn(
                                      "text-[9px] font-bold uppercase px-1.5 py-0.2 rounded",
                                      item.status === "verified" ? "text-emerald-400 bg-emerald-500/10" : "text-amber-300 bg-amber-500/10"
                                    )}>
                                      {item.status}
                                    </span>
                                    {item.proofUrl && (
                                      <button
                                        type="button"
                                        onClick={() => setPreviewProof({ url: item.proofUrl!, booking, proofType: item.paymentType === "deposit" ? "deposit" : "balance" })}
                                        className="text-primary hover:text-white"
                                        title="View receipt"
                                      >
                                        <Eye className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      {!isCancelled && (
                        <div className="pt-2 flex flex-wrap gap-2 justify-end">
                          {!isFullyPaid && remainingAmt > 0 && (
                            <Link
                              href={`/user/payment?is_balance=true&bookingId=${booking._id}`}
                              className={cn(
                                "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase transition-all shadow-sm",
                                isBalancePending
                                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30"
                                  : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30"
                              )}
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>{isBalancePending ? "Installment" : `Pay Balance ($${remainingAmt.toFixed(0)})`}</span>
                            </Link>
                          )}
                          <button
                            onClick={() => setCancellingBooking(booking)}
                            className="inline-flex items-center gap-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Cancel</span>
                          </button>
                        </div>
                      )}

                      {/* Negotiation & Menu History Expandable Timeline */}
                      <div className="pt-2 border-t border-outline-variant/10">
                        <QuoteHistoryTimeline booking={booking} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-12 pt-16 border-t border-outline-variant/10">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="text-[10px] uppercase tracking-[0.4em] font-bold text-outline hover:text-primary disabled:opacity-20 transition-all group"
          >
            PREV
          </button>

          <div className="flex items-center gap-4">
            <span className="w-10 h-px bg-outline-variant" />
            <span className="font-headline text-2xl italic text-primary">{page} <span className="text-outline text-lg">/ {totalPages}</span></span>
            <span className="w-10 h-px bg-outline-variant" />
          </div>

          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="text-[10px] uppercase tracking-[0.4em] font-bold text-outline hover:text-primary disabled:opacity-20 transition-all group"
          >
            NEXT
          </button>
        </div>
      )}
    </div>
  );
}
