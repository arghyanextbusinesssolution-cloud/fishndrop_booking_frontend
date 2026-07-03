"use client";

import { useState } from "react";
import { useCallback } from "react";
import api from "@/lib/axios";
import { AvailabilityResponse, Booking, BookingResponse, CreateBookingPayload } from "@/types";

export function useBookings() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getMyBookings = useCallback(async (page = 1, status = "all", type?: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<BookingResponse>("/bookings/my", {
        params: {
          page,
          limit: 10,
          status: status === "all" ? undefined : status,
          type: type || undefined
        },
      });
      return data;
    } catch {
      setError("Failed to load bookings");
      throw new Error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, []);

  const getAvailability = useCallback(async (date: string, partySize: number, slot?: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<AvailabilityResponse>("/bookings/availability", {
        params: { date, partySize, slot },
      });
      return data;
    } catch {
      setError("Failed to check availability");
      throw new Error("Failed to check availability");
    } finally {
      setLoading(false);
    }
  }, []);

  const createBooking = useCallback(async (payload: CreateBookingPayload) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post("/bookings", payload);
      return data as { success: boolean; booking: { _id: string; totalAmount: number } };
    } catch {
      setError("Failed to create booking");
      throw new Error("Failed to create booking");
    } finally {
      setLoading(false);
    }
  }, []);

  const getBookingById = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<{ success: boolean; booking: Booking }>(`/bookings/${id}`);
      return data.booking;
    } catch {
      setError("Failed to fetch booking");
      throw new Error("Failed to fetch booking");
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelBooking = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await api.patch(`/bookings/cancel/${id}`);
    } catch {
      setError("Failed to cancel booking");
      throw new Error("Failed to cancel booking");
    } finally {
      setLoading(false);
    }
  }, []);

  const startPayment = useCallback(async (bookingId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post<{ success: boolean; url: string }>("/payments/checkout-session", { bookingId });
      if (!data.url) {
        throw new Error("Missing payment URL");
      }
      return data.url;
    } catch {
      setError("Failed to start payment");
      throw new Error("Failed to start payment");
    } finally {
      setLoading(false);
    }
  }, []);

  const startRemainingPayment = useCallback(async (bookingId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post<{ success: boolean; url: string }>("/payments/checkout-balance", { bookingId });
      if (!data.url) {
        throw new Error("Missing payment URL");
      }
      return data.url;
    } catch {
      setError("Failed to start remaining payment");
      throw new Error("Failed to start remaining payment");
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyCheckoutSession = useCallback(async (sessionId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post<{ success: boolean; booking: Booking }>("/payments/verify-session", { sessionId });
      return data.booking;
    } catch {
      setError("Failed to confirm payment");
      throw new Error("Failed to confirm payment");
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyPaymentIntent = useCallback(async (paymentIntentId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post<{ success: boolean; booking: Booking }>("/payments/verify-payment-intent", { paymentIntentId });
      return data.booking;
    } catch {
      setError("Failed to confirm payment intent");
      throw new Error("Failed to confirm payment intent");
    } finally {
      setLoading(false);
    }
  }, []);

  return { getMyBookings, getAvailability, createBooking, getBookingById, startPayment, startRemainingPayment, verifyCheckoutSession, verifyPaymentIntent, cancelBooking, loading, error };
}
