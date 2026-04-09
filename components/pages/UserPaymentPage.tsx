"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { useBookings } from "@/hooks/useBookings";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

type PaymentBooking = {
  _id: string;
  totalAmount: number;
  partySize: number;
  bookingDate: string;
  bookingTime: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  cakePrice?: number;
  occasion: string;
  notes?: string;
  cakeDetails?: string;
};

export default function UserPaymentPage() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId") || "";
  const prefilledTotalAmount = Number(searchParams.get("totalAmount") || 0);
  const prefilledPartySize = Number(searchParams.get("partySize") || 0);
  const prefilledBookingDate = searchParams.get("bookingDate") || "";
  const prefilledBookingTime = searchParams.get("bookingTime") || "";
  const prefilledCustomerName = searchParams.get("customerName") || "";
  const prefilledOccasion = searchParams.get("occasion") || "";
  const prefilledCakePrice = Number(searchParams.get("cakePrice") || 0);
  const { getBookingById, startPayment, loading } = useBookings();
  const [booking, setBooking] = useState<PaymentBooking | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  const loadBooking = useCallback(async () => {
    if (!bookingId) {
      setPageLoading(false);
      return;
    }

    // Prefer data from the create-booking redirect so this page works
    // even if backend route changes or server hasn't reloaded yet.
    if (prefilledTotalAmount > 0 && prefilledBookingDate && prefilledBookingTime) {
      setBooking({
        _id: bookingId,
        totalAmount: prefilledTotalAmount,
        partySize: prefilledPartySize,
        bookingDate: prefilledBookingDate,
        bookingTime: prefilledBookingTime,
        customerName: prefilledCustomerName || "Guest",
        customerEmail: "",
        customerPhone: "",
        cakePrice: prefilledCakePrice,
        occasion: prefilledOccasion || "other"
      });
      setPageLoading(false);
      return;
    }

    setPageLoading(true);
    try {
      const data = await getBookingById(bookingId);
      setBooking(data);
    } catch {
      setBooking(null);
    } finally {
      setPageLoading(false);
    }
  }, [
    bookingId,
    getBookingById,
    prefilledTotalAmount,
    prefilledPartySize,
    prefilledBookingDate,
    prefilledBookingTime,
    prefilledCustomerName,
    prefilledOccasion,
    prefilledCakePrice
  ]);

  useEffect(() => {
    void loadBooking();
  }, [loadBooking]);

  const handleProceedToStripe = async () => {
    if (!booking?._id) return;
    try {
      const url = await startPayment(booking._id);
      if (url && typeof window !== "undefined") {
        window.location.href = url;
      }
    } catch {
      toast.error("Failed to start payment");
    }
  };

  if (pageLoading) return <LoadingSpinner />;

  if (!booking) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <p className="text-lg font-semibold text-[var(--text-primary)]">Booking not found</p>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          We could not load your booking details for payment.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <p className="text-sm font-semibold text-[var(--text-secondary)]">Payment Summary</p>
        <h2 className="mt-2 text-2xl font-bold text-[var(--text-primary)]">Confirm your booking details</h2>
        <div className="mt-5 space-y-2 text-sm text-[var(--text-secondary)]">
          <p><span className="font-medium text-[var(--text-primary)]">Name:</span> {booking.customerName}</p>
          <p><span className="font-medium text-[var(--text-primary)]">Date:</span> {format(new Date(booking.bookingDate), "PPP")}</p>
          <p><span className="font-medium text-[var(--text-primary)]">Time:</span> {booking.bookingTime}</p>
          <p><span className="font-medium text-[var(--text-primary)]">Party Size:</span> {booking.partySize}</p>
          <p><span className="font-medium text-[var(--text-primary)]">Occasion:</span> {booking.occasion}</p>
          <p><span className="font-medium text-[var(--text-primary)]">Cake:</span> ${booking.cakePrice || 0}</p>
        </div>
        <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
          <p className="text-sm text-[var(--text-secondary)]">Total Charge</p>
          <p className="text-3xl font-bold text-[var(--accent)]">${booking.totalAmount}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <p className="text-sm font-semibold text-[var(--text-secondary)]">Secure payment (Stripe)</p>
        <h3 className="mt-2 text-xl font-bold text-[var(--text-primary)]">Pay on Stripe’s checkout page</h3>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          We do <span className="font-medium text-[var(--text-primary)]">not</span> collect or store your card number in this app. After you continue, Stripe opens a secure page where you enter{" "}
          <span className="font-medium text-[var(--text-primary)]">billing name</span>, <span className="font-medium text-[var(--text-primary)]">email</span> (often pre-filled), and{" "}
          <span className="font-medium text-[var(--text-primary)]">card details</span>—same as paying on any major retailer that uses Stripe.
        </p>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Test mode: use card <span className="font-semibold">4242 4242 4242 4242</span>, any future expiry, any CVC, any postal code.
        </p>
        <Button
          className="mt-6 w-full bg-[var(--accent)] text-black hover:bg-[var(--accent-hover)]"
          isLoading={loading}
          onClick={handleProceedToStripe}
        >
          {loading ? "Opening Stripe..." : "Pay & Confirm Booking"}
        </Button>
      </section>
    </div>
  );
}
