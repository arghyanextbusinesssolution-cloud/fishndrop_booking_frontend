"use client";

import { useCallback, useEffect, useState } from "react";
import { useBookings } from "@/hooks/useBookings";
import { Booking } from "@/types";
import { CalendarDays, Loader2, Star, Eye, Music, UtensilsCrossed, CheckCircle2, AlertCircle, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import toast from "react-hot-toast";

import { CancelBookingModal } from "@/components/booking/CancelBookingModal";
import { ZelleProofLightboxModal } from "@/components/booking/ZelleProofLightboxModal";

const CATERING_LABEL_MAP: Record<string, string> = {
  seafood_buffet: "Seafood Extravaganza Buffet",
  tropica_signature: "Tropica Signature Experience",
  cocktail_canapes: "Cocktail and Canapes Reception",
  bbq_grill: "Tropical BBQ and Grill",
  vegan_garden: "Garden and Vegan Feast",
  kids_friendly: "Family & Kids Celebration",
  custom: "Custom Menu",
};

export default function UserVenueBookingsPage() {
  const { getMyBookings, cancelBooking } = useBookings();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Modals
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);
  const [previewProof, setPreviewProof] = useState<{ url: string; booking: Booking; proofType: "deposit" | "balance" } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyBookings(page, status, "private_event");
      setBookings(data.bookings);
      setTotalPages(data.totalPages);
    } catch {
      setBookings([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [getMyBookings, page, status]);

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
        <>
          {/* Desktop Table Layout - Clean Column Proportions & No Clipping */}
          <div className="hidden md:block rounded-2xl border border-outline-variant/15 bg-surface-container-lowest ambient-shadow overflow-hidden">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="bg-surface-container-low/80 border-b border-outline-variant/15 text-[10px] uppercase tracking-widest font-bold text-outline">
                  <th className="w-[18%] px-6 py-4">Date &amp; Time</th>
                  <th className="w-[20%] px-6 py-4">Occasion &amp; Details</th>
                  <th className="w-[22%] px-6 py-4">Add-Ons &amp; Preferences</th>
                  <th className="w-[25%] px-6 py-4">Payment Breakdown</th>
                  <th className="w-[15%] px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {bookings.map((booking) => {
                  const remainingAmt = booking.remainingAmount ?? 0;
                  const isFullyPaid = booking.remainingPaymentStatus === "paid" || (booking.paymentStatus === "paid" && remainingAmt === 0);
                  const isDepositPaid = booking.paymentStatus === "deposit_paid" || isFullyPaid;
                  const isZelle = booking.paymentMethod === "zelle";
                  const isCancelled = booking.status === "cancelled";

                  const hasBalanceProof = Boolean(booking.remainingZelleProofUrl);
                  const isBalancePending = hasBalanceProof && !isFullyPaid;
                  const isDepositPending = isZelle && booking.zelleVerificationStatus !== "verified" && !isDepositPaid;

                  return (
                    <tr key={booking._id} className="hover:bg-surface-container-low/20 transition-colors">
                      {/* Date & Time */}
                      <td className="px-6 py-5 align-top space-y-1">
                        <p className="font-headline text-lg italic text-on-surface leading-snug">
                          {new Date(booking.bookingDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                        <p className="text-xs text-outline">{booking.bookingTime} ({booking.durationHours || 5} Hours)</p>
                        <p className="text-[10px] text-outline/50 font-mono pt-1">ID: #{booking._id.slice(-6).toUpperCase()}</p>
                      </td>

                      {/* Occasion & Details */}
                      <td className="px-6 py-5 align-top space-y-1">
                        <p className="text-sm font-bold text-on-surface capitalize">{booking.occasion}</p>
                        <p className="text-xs text-outline">{booking.partySize} Guests</p>
                        {booking.notes && (
                          <p className="text-[11px] text-secondary italic leading-relaxed pt-1" title={booking.notes}>
                            Note: &quot;{booking.notes}&quot;
                          </p>
                        )}
                      </td>

                      {/* Add-Ons */}
                      <td className="px-6 py-5 align-top space-y-2">
                        <div className="flex items-center gap-1.5 text-xs text-on-surface">
                          <Music className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>{booking.needDj ? "DJ Requested (+$300)" : "No DJ Service"}</span>
                        </div>
                        {booking.cateringMenu && (
                          <div className="flex items-center gap-1.5 text-xs text-secondary">
                            <UtensilsCrossed className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span>{CATERING_LABEL_MAP[booking.cateringMenu] || booking.cateringMenu}</span>
                          </div>
                        )}
                        {booking.complimentaryDrinks > 0 && (
                          <span className="inline-block text-[9px] px-2 py-0.5 rounded bg-primary/10 text-primary font-bold uppercase tracking-widest border border-primary/20">
                            +{booking.complimentaryDrinks} Free Drinks
                          </span>
                        )}
                      </td>

                      {/* Payment Breakdown */}
                      <td className="px-6 py-5 align-top space-y-3">
                        {/* Method & Verification Badges */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={cn(
                            "px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-widest font-extrabold border",
                            isZelle ? "bg-purple-500/10 text-purple-300 border-purple-500/30" : "bg-primary/10 text-primary border-primary/20"
                          )}>
                            {isZelle ? "⚡ Zelle Pay" : "💳 Card"}
                          </span>

                          {isFullyPaid ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-widest font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" /> Fully Paid &amp; Confirmed
                            </span>
                          ) : isBalancePending ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-widest font-extrabold bg-purple-500/15 text-purple-300 border border-purple-500/30 animate-pulse">
                              <Clock className="w-3 h-3" /> Balance Pending Verification
                            </span>
                          ) : isDepositPending ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-widest font-extrabold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                              <Clock className="w-3 h-3" /> Deposit Pending Verification
                            </span>
                          ) : isDepositPaid ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-widest font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" /> Deposit Verified ($300)
                            </span>
                          ) : null}
                        </div>

                        {/* Amounts */}
                        <div className="space-y-0.5 text-xs">
                          <p className="text-on-surface"><span className="text-outline">Total Event Cost:</span> <strong>${booking.totalAmount?.toFixed(2)}</strong></p>
                          <p className="text-emerald-400"><span className="text-outline">Deposit Paid:</span> <strong>${booking.depositAmount?.toFixed(2)}</strong></p>
                          
                          {isFullyPaid ? (
                            <p className="text-emerald-400 font-bold pt-0.5">
                              Remaining Balance: $0.00 (Fully Settled)
                            </p>
                          ) : (
                            <p className={cn("font-bold pt-0.5", isBalancePending ? "text-purple-300" : "text-error")}>
                              Remaining: ${remainingAmt.toFixed(2)} {isBalancePending ? "(Payment Uploaded - Waiting Verification)" : "(Unpaid)"}
                            </p>
                          )}
                        </div>

                        {/* 72-Hour Balance Notice (only if unpaid and balance proof not submitted yet) */}
                        {!isFullyPaid && !isBalancePending && !isCancelled && (
                          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[10px] text-amber-300 leading-relaxed flex items-start gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                            <span>
                              Remaining <strong>${remainingAmt.toFixed(2)}</strong> balance is due no later than 72h before event.
                            </span>
                          </div>
                        )}

                        {/* Uploaded Zelle Proof Links */}
                        {(booking.zelleProofUrl || booking.remainingZelleProofUrl) && (
                          <div className="flex flex-wrap items-center gap-3 pt-1">
                            {booking.zelleProofUrl && (
                              <button
                                onClick={() => setPreviewProof({ url: booking.zelleProofUrl!, booking, proofType: "deposit" })}
                                className="inline-flex items-center gap-1 text-[10px] text-purple-400 hover:text-purple-300 underline font-bold"
                              >
                                <Eye className="w-3 h-3" /> Deposit Proof
                              </button>
                            )}
                            {booking.remainingZelleProofUrl && (
                              <button
                                onClick={() => setPreviewProof({ url: booking.remainingZelleProofUrl!, booking, proofType: "balance" })}
                                className="inline-flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 underline font-bold"
                              >
                                <Eye className="w-3 h-3" /> Balance Proof {isBalancePending ? "(Pending Verification)" : "(Verified)"}
                              </button>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Actions Column */}
                      <td className="px-6 py-5 align-top text-right space-y-2">
                        {isCancelled ? (
                          <span className="text-[10px] font-bold tracking-widest uppercase text-error block">
                            Cancelled
                          </span>
                        ) : (
                          <div className="flex flex-col items-end gap-2.5">
                            {!isFullyPaid && (
                              <Link
                                href={`/user/payment?is_balance=true&bookingId=${booking._id}`}
                                className={cn(
                                  "inline-flex items-center justify-center px-4 py-2 rounded-lg text-[10px] font-bold tracking-widest uppercase transition-all shadow-sm",
                                  isBalancePending
                                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30"
                                    : "bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30"
                                )}
                              >
                                {isBalancePending ? "Re-upload Balance Proof" : "Pay Balance"}
                              </Link>
                            )}

                            {/* Cancel Booking Button */}
                            <button
                              onClick={() => setCancellingBooking(booking)}
                              className="inline-flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase transition-colors"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Cancel Booking</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
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
              const isBalancePending = hasBalanceProof && !isFullyPaid;
              const isDepositPending = isZelle && booking.zelleVerificationStatus !== "verified" && !isDepositPaid;

              return (
                <div key={booking._id} className="p-5 rounded-2xl border border-outline-variant/15 bg-surface-container-lowest ambient-shadow space-y-4">
                  <div className="flex justify-between items-start border-b border-outline-variant/10 pb-4">
                    <div>
                      <p className="font-headline text-xl italic text-on-surface">
                        {new Date(booking.bookingDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                      <p className="text-xs text-outline">{booking.bookingTime} ({booking.durationHours || 5} Hours)</p>
                    </div>
                    {isCancelled ? (
                      <span className="text-[10px] font-bold tracking-widest uppercase text-error">
                        Cancelled
                      </span>
                    ) : isFullyPaid ? (
                      <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> All Paid
                      </span>
                    ) : (
                      <Link
                        href={`/user/payment?is_balance=true&bookingId=${booking._id}`}
                        className="inline-block bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-3 py-2 rounded-lg text-[10px] font-bold tracking-widest uppercase transition-colors"
                      >
                        {isBalancePending ? "Balance Pending" : "Pay Balance"}
                      </Link>
                    )}
                  </div>

                  {/* Payment Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn(
                      "px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-widest font-extrabold border",
                      isZelle ? "bg-purple-500/10 text-purple-300 border-purple-500/20" : "bg-primary/10 text-primary border-primary/20"
                    )}>
                      {isZelle ? "⚡ Zelle Pay" : "💳 Card"}
                    </span>

                    {isFullyPaid ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-widest font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        Fully Paid &amp; Confirmed
                      </span>
                    ) : isBalancePending ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-widest font-extrabold bg-purple-500/15 text-purple-300 border border-purple-500/30 animate-pulse">
                        Balance Pending Verification
                      </span>
                    ) : isDepositPending ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-widest font-extrabold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        Deposit Pending Verification
                      </span>
                    ) : isDepositPaid ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-widest font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        Deposit Verified ($300)
                      </span>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest font-bold text-outline mb-1">Occasion</p>
                      <p className="text-on-surface capitalize font-semibold">{booking.occasion}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest font-bold text-outline mb-1">Guests &amp; Time</p>
                      <p className="text-on-surface text-xs">{booking.partySize} Guests</p>
                    </div>
                  </div>

                  {/* Add-ons */}
                  <div className="p-3 rounded-lg bg-surface-container-low/40 border border-outline-variant/10 space-y-1.5 text-xs">
                    <div className="flex items-center gap-1.5 text-on-surface">
                      <Music className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>{booking.needDj ? "DJ Requested (+$300)" : "No DJ Service"}</span>
                    </div>
                    {booking.cateringMenu && (
                      <div className="flex items-center gap-1.5 text-secondary">
                        <UtensilsCrossed className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>{CATERING_LABEL_MAP[booking.cateringMenu] || booking.cateringMenu}</span>
                      </div>
                    )}
                  </div>

                  {/* Uploaded Zelle Receipt Link */}
                  {(booking.zelleProofUrl || booking.remainingZelleProofUrl) && (
                    <div className="flex items-center gap-3 pt-1">
                      {booking.zelleProofUrl && (
                        <button
                          onClick={() => setPreviewProof({ url: booking.zelleProofUrl!, booking, proofType: "deposit" })}
                          className="inline-flex items-center gap-1 text-[10px] text-purple-400 hover:text-purple-300 underline font-bold"
                        >
                          <Eye className="w-3 h-3" /> Deposit Receipt
                        </button>
                      )}
                      {booking.remainingZelleProofUrl && (
                        <button
                          onClick={() => setPreviewProof({ url: booking.remainingZelleProofUrl!, booking, proofType: "balance" })}
                          className="inline-flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 underline font-bold"
                        >
                          <Eye className="w-3 h-3" /> Balance Receipt {isBalancePending ? "(Pending)" : "(Verified)"}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Payment Breakdown */}
                  <div className="pt-4 border-t border-outline-variant/10 space-y-1 text-xs">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-outline mb-2">Payment Breakdown</p>
                    <div className="flex justify-between items-center">
                      <span className="text-outline">Total Event Cost:</span>
                      <span className="text-on-surface font-semibold">${booking.totalAmount?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-outline">Deposit Paid:</span>
                      <span className="text-emerald-400 font-semibold">${booking.depositAmount?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-outline">Remaining:</span>
                      <span className={cn("font-bold", isFullyPaid ? "text-emerald-400" : isBalancePending ? "text-purple-300" : "text-error")}>
                        {isFullyPaid ? "$0.00 (Fully Settled)" : `$${remainingAmt.toFixed(2)} ${isBalancePending ? "(Pending Verification)" : "(Unpaid)"}`}
                      </span>
                    </div>

                    {/* 72-Hour Notice */}
                    {!isFullyPaid && !isBalancePending && !isCancelled && (
                      <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 space-y-1">
                        <div className="flex items-start gap-1.5 text-[10px] text-amber-300 font-semibold leading-relaxed">
                          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <span>
                            Remaining <strong>${remainingAmt.toFixed(2)}</strong> balance is due no later than 72h before event.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Cancel Button */}
                  {!isCancelled && (
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => setCancellingBooking(booking)}
                        className="inline-flex items-center gap-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3 py-2 rounded-lg text-[10px] font-bold tracking-widest uppercase transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cancel Booking</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
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
