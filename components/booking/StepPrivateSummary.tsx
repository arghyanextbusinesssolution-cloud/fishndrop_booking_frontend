"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Elements } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe";
import { StripePaymentForm } from "./StripePaymentForm";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/axios";
import {
  Calendar,
  Users,
  Loader2,
  Ticket,
  Check,
  X,
  Music,
  UtensilsCrossed,
  AlertCircle,
  Sparkles,
  ChefHat,
  Clock,
  Copy,
  Phone,
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import toast from "react-hot-toast";
import { cn, formatTimeTo12Hour, formatBookingDate } from "@/lib/utils";
import { getAttributionPayload, trackMetaConversion } from "@/lib/tracking";

import { BookingPolicyModal } from "./BookingPolicyModal";

interface StepPrivateSummaryProps {
  bookingData: any;
  onBack: () => void;
}

const stripePromise = getStripe();

import { CATERING_LABEL_MAP } from "@/lib/cateringRestaurants";


const calculateEndTime = (startSlot: string, duration: number): string => {
  if (!startSlot) return "";
  const [hStr, mStr] = startSlot.split(":");
  const startHour = parseInt(hStr, 10);
  const mins = mStr || "00";
  const totalHours = startHour + duration;
  const endHour = totalHours >= 24 ? totalHours - 24 : totalHours;
  const formattedEnd = `${endHour < 10 ? "0" : ""}${endHour}:${mins}`;
  return formatTimeTo12Hour(formattedEnd);
};

export default function StepPrivateSummary({ bookingData, onBack }: StepPrivateSummaryProps) {
  const router = useRouter();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const { setAuth } = useAuthStore();
  const [pricingSettings, setPricingSettings] = useState<{
    perGuestPrice: number;
    extraHourPrice: number;
    djPrice: number;
    photographerBasePrice: number;
    photographerExtraHourPrice: number;
    minDepositAmount: number;
  }>({
    perGuestPrice: 35,
    extraHourPrice: 125,
    djPrice: 300,
    photographerBasePrice: 300,
    photographerExtraHourPrice: 150,
    minDepositAmount: 200,
  });

  useEffect(() => {
    api.get("/bookings/venue-capacity").then(({ data }) => {
      if (data?.success) {
        setPricingSettings({
          perGuestPrice: data.perGuestPrice || 35,
          extraHourPrice: data.extraHourPrice || 125,
          djPrice: data.djPrice || 300,
          photographerBasePrice: data.photographerBasePrice || 300,
          photographerExtraHourPrice: data.photographerExtraHourPrice || 150,
          minDepositAmount: data.minDepositAmount || 200,
        });
      }
    }).catch(() => {});
  }, []);

  const djCost = bookingData.needDj ? pricingSettings.djPrice : 0;
  const extraHours = (bookingData.durationHours || 5) > 5 ? (bookingData.durationHours - 5) * pricingSettings.extraHourPrice : 0;
  const photographerCost = bookingData.needPhotographer
    ? pricingSettings.photographerBasePrice + Math.max(0, (bookingData.photographerHours || 2) - 2) * pricingSettings.photographerExtraHourPrice
    : 0;
  const guestCost = (bookingData.guests || 1) * pricingSettings.perGuestPrice;
  const baseCost = guestCost + extraHours + djCost + photographerCost;
  const [submitting, setSubmitting] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number } | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const finalCost = appliedCoupon ? Math.max(0, baseCost - appliedCoupon.discountAmount) : baseCost;
  const minDeposit = Math.min(finalCost, pricingSettings.minDepositAmount);
  const [customDeposit, setCustomDeposit] = useState<number>(minDeposit);

  useEffect(() => {
    setCustomDeposit(Math.min(finalCost, pricingSettings.minDepositAmount));
  }, [finalCost]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsValidating(true);
    try {
      const { data } = await api.post("/bookings/validate-coupon", { couponCode, totalAmount: baseCost });
      if (data.success) {
        const discountAmount = data.discountType === "percentage"
          ? (baseCost * data.discount) / 100
          : data.discount;
        setAppliedCoupon({ code: couponCode, discountAmount });
        toast.success("Coupon applied!");
        setCouponCode("");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Invalid coupon");
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    toast.success("Coupon removed");
  };
  const [paymentMethod, setPaymentMethod] = useState<"card" | "zelle">("card");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [copiedZelle, setCopiedZelle] = useState(false);
  const [copiedBookingId, setCopiedBookingId] = useState(false);
  const [zelleSecondsLeft, setZelleSecondsLeft] = useState<number>(15 * 60);
  const [isZelleExpired, setIsZelleExpired] = useState(false);
  const [isCreatingZelleDraft, setIsCreatingZelleDraft] = useState(false);

  // 15-minute reverse countdown clock for Zelle slot hold
  useEffect(() => {
    if (paymentMethod !== "zelle" || !bookingId || isZelleExpired) return;

    const timer = setInterval(() => {
      setZelleSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsZelleExpired(true);
          // Automatically release the slot lock in backend
          api.post("/bookings/cancel-unpaid", { bookingId }).catch((err) => {
            console.warn("Auto-cancel unpaid slot error:", err);
          });
          toast.error("15-minute slot hold has expired. The venue slot was released.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [paymentMethod, bookingId, isZelleExpired]);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Screenshot file size must be under 10MB");
        return;
      }
      setScreenshotFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCopyZelle = () => {
    navigator.clipboard.writeText("tropicapayments@gmail.com");
    setCopiedZelle(true);
    toast.success("Zelle Email copied!");
    setTimeout(() => setCopiedZelle(false), 2000);
  };

  const handleCopyBookingId = () => {
    if (!bookingId) return;
    navigator.clipboard.writeText(bookingId);
    setCopiedBookingId(true);
    toast.success("Full Booking ID copied! Paste this in your Zelle memo.");
    setTimeout(() => setCopiedBookingId(false), 2000);
  };

  const buildPayload = (method: "card" | "zelle", zelleUrl?: string) => {
    let formattedNotes = bookingData.notes || "";
    if (bookingData.selectedDishes && bookingData.selectedDishes.length > 0) {
      const dishStrs = bookingData.selectedDishes.map((dish: string) => {
        const qty = bookingData.dishQuantities?.[dish];
        return qty && qty > 1 ? `${dish} (x${qty} platters)` : `${dish} (x1 platter)`;
      });
      const dishStr = `[Dishes: ${dishStrs.join(", ")}]`;
      formattedNotes = formattedNotes ? `${formattedNotes} | ${dishStr}` : dishStr;
    }
    if (bookingData.cateringNotes) {
      formattedNotes = formattedNotes ? `${formattedNotes} | [Dietary: ${bookingData.cateringNotes}]` : `[Dietary: ${bookingData.cateringNotes}]`;
    }
    if (bookingData.needDecoration && bookingData.decorationStyle) {
      formattedNotes = formattedNotes ? `${formattedNotes} | [Decor: ${bookingData.decorationStyle}]` : `[Decor: ${bookingData.decorationStyle}]`;
    }

    const attribution = getAttributionPayload();
    const cleanPhone = (bookingData.guestDetails?.phone || "").replace(/\D/g, "");

    return {
      customerName: bookingData.guestDetails?.name || "Guest User",
      customerEmail: bookingData.guestDetails?.email || (cleanPhone ? `guest_${cleanPhone}@fishndrop.com` : "guest@fishndrop.com"),
      customerPhone: bookingData.guestDetails?.phone || "",
      password: bookingData.guestDetails?.password || undefined,
      bookingDate: bookingData.date,
      bookingTime: bookingData.time || "19:00",
      partySize: bookingData.guests,
      durationHours: bookingData.durationHours || 1,
      occasion: bookingData.occasion || "other",
      notes: formattedNotes.slice(0, 2500),
      needDj: bookingData.needDj ?? false,
      needPhotographer: bookingData.needPhotographer ?? false,
      photographerHours: bookingData.needPhotographer ? (bookingData.photographerHours || 2) : 0,
      cateringMenu: bookingData.cateringMenu || "jamaican_jerk_house",
      dishQuantities: bookingData.dishQuantities || {},
      customDepositAmount: customDeposit,
      couponCode: appliedCoupon?.code || undefined,
      paymentMethod: method,
      zelleProofUrl: zelleUrl || undefined,
      ...attribution
    };
  };

  const createZelleDraft = async () => {
    setIsCreatingZelleDraft(true);
    setError(null);
    setIsZelleExpired(false);
    setZelleSecondsLeft(15 * 60);

    try {
      const payload = buildPayload("zelle");
      const res = await api.post("/bookings/reserve-private", payload);
      if (res.data.success) {
        if (res.data.token && res.data.user) {
          setAuth(res.data.user, res.data.token);
        }
        setBookingId(res.data.booking._id);
        setZelleSecondsLeft(15 * 60);
        setIsZelleExpired(false);
        toast.success("Venue slot held for 15 minutes! Copy your Booking ID below.");
      } else {
        setError(res.data.message || "Failed to hold slot. The time slot may no longer be available.");
      }
    } catch (err: any) {
      console.error("Zelle draft reservation failed:", err);
      let errorMsg = "Failed to reserve slot for Zelle. The slot may be already taken.";
      if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }
      setError(errorMsg);
    } finally {
      setIsCreatingZelleDraft(false);
    }
  };

  const handleSelectZelle = async () => {
    setPaymentMethod("zelle");
    if (!bookingId && !isCreatingZelleDraft) {
      await createZelleDraft();
    }
  };

  const handleSelectCard = async () => {
    if (bookingId && paymentMethod === "zelle") {
      try {
        await api.post("/bookings/cancel-unpaid", { bookingId });
      } catch (e) {
        console.warn("Cancel unpaid draft error:", e);
      }
      setBookingId(null);
      setIsZelleExpired(false);
      setZelleSecondsLeft(15 * 60);
    }
    setPaymentMethod("card");
  };

  const handleSubmitZelle = async () => {
    if (!bookingId) {
      await createZelleDraft();
      return;
    }
    if (isZelleExpired) {
      toast.error("Your 15-minute slot hold has expired. Please re-hold the slot.");
      return;
    }
    if (!screenshotPreview) {
      toast.error("Please upload your Zelle payment screenshot first.");
      return;
    }
    setSubmitting(true);
    try {
      // The booking is only sent for verification once the screenshot upload succeeds
      try {
        await api.post("/payments/upload-zelle-proof", {
          bookingId,
          imageBase64: screenshotPreview
        });
      } catch (proofErr: any) {
        const code = proofErr?.response?.data?.code;
        if (code === "HOLD_EXPIRED") setIsZelleExpired(true);
        toast.error(proofErr?.response?.data?.message || "Screenshot upload failed. Please try again.");
        return;
      }
      trackMetaConversion("Lead", {
        content_name: "Private Sanctuary Booking - Zelle",
        currency: "USD",
        value: customDeposit
      });
      toast.success("Zelle screenshot submitted! We're verifying your payment.");
      // Host dashboard → share-your-invite popup (Zelle status shown there)
      router.push(`/user/celebrations/${bookingId}?share=zelle`);
    } catch (err: any) {
      console.error("Zelle submit failed:", err);
      toast.error("Failed to complete Zelle booking.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReserveCard = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const payload = buildPayload("card");
      const res = await api.post("/bookings/reserve-private", payload);

      if (res.data.success) {
        trackMetaConversion("Lead", {
          content_name: "Private Sanctuary Booking",
          currency: "USD",
          value: customDeposit
        });
        if (res.data.token && res.data.user) {
          setAuth(res.data.user, res.data.token);
        }
        setBookingId(res.data.booking._id);

        const { data: piData } = await api.post(
          "/payments/create-payment-intent",
          { bookingId: res.data.booking._id },
          res.data.token ? { headers: { Authorization: `Bearer ${res.data.token}` } } : undefined
        );

        if (piData.success && piData.clientSecret) {
          setClientSecret(piData.clientSecret);
        } else {
          setError(piData.message || "Failed to initialize payment. Please try again.");
        }
      } else {
        setError(res.data.message || "Failed to create booking.");
      }
    } catch (err: any) {
      console.error("Payment init failed:", err);
      let errorMsg = "An error occurred. Please go back and try again.";
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        errorMsg = err.response.data.errors.map((e: any) => e.message || e.msg).join(", ");
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.message) {
        errorMsg = err.message;
      }
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentSuccess = (bookingId: string, paymentIntentId?: string) => {
    if (bookingId) {
      let url = `/user/payment/confirmed?bookingId=${bookingId}`;
      if (paymentIntentId) url += `&payment_intent=${paymentIntentId}`;
      router.push(url);
    }
  };

  const cateringLabel = CATERING_LABEL_MAP[bookingData.cateringMenu] || bookingData.cateringMenu || "Not selected";

  return (
    <div className="max-w-md mx-auto space-y-3 pt-1 sm:pt-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {!clientSecret && (
        <div className="bg-[#f7f6f2] rounded-xl p-4 sm:p-6 shadow-lg space-y-4">

          {/* Deposit / Total Header */}
          <div className="space-y-3 border-b border-black/10 pb-4">
            {/* Event Schedule & Reservation Overview */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-[#0F3D2E] to-[#174838] text-white border border-[#C8A96A]/40 shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#C8A96A] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#C8A96A]" /> Private Event Reservation
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#C8A96A]/20 text-[#E8CB8A] font-bold">
                  {bookingData.durationHours || 5} Hours
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs pt-1 border-t border-white/10">
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-white/50 font-bold flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#C8A96A]" /> Date
                  </p>
                  <p className="text-white font-bold text-sm mt-0.5">
                    {formatBookingDate(bookingData.date, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>

                <div>
                  <p className="text-[9px] uppercase tracking-widest text-white/50 font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#C8A96A]" /> Time Window
                  </p>
                  <p className="text-white font-bold text-sm mt-0.5">
                    {formatTimeTo12Hour(bookingData.time || "18:00")} – {calculateEndTime(bookingData.time || "18:00", bookingData.durationHours || 5)}
                  </p>
                </div>

                <div>
                  <p className="text-[9px] uppercase tracking-widest text-white/50 font-bold flex items-center gap-1">
                    <Users className="w-3 h-3 text-[#C8A96A]" /> Guest Count
                  </p>
                  <p className="text-white font-bold text-sm mt-0.5">
                    {bookingData.guests} Guests <span className="text-[11px] text-[#C8A96A] font-normal">(@ ${pricingSettings.perGuestPrice}/guest)</span>
                  </p>
                </div>

                <div>
                  <p className="text-[9px] uppercase tracking-widest text-white/50 font-bold">Occasion</p>
                  <p className="text-white font-bold text-sm mt-0.5 capitalize">
                    {bookingData.occasion || "Celebration"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <div>
                <p className="font-label text-[9px] sm:text-[10px] tracking-[0.2em] uppercase text-[#1a1c1b]/60 font-bold leading-tight">Total Venue Package</p>
                <p className="font-headline text-2xl sm:text-4xl text-[#1a1c1b] font-bold tracking-tighter">${finalCost.toFixed(2)}</p>
                <p className="text-[10px] text-[#1a1c1b]/70 font-semibold mt-0.5">
                  ${pricingSettings.perGuestPrice}/guest × {bookingData.guests} guests (${(bookingData.guests * pricingSettings.perGuestPrice).toFixed(2)})
                  {bookingData.durationHours > 5 && ` + ${bookingData.durationHours - 5} extra hrs (${(bookingData.durationHours - 5) * pricingSettings.extraHourPrice})`}
                  {bookingData.needDj && ` + DJ (${pricingSettings.djPrice})`}
                  {bookingData.needPhotographer && ` + Photo (${pricingSettings.photographerBasePrice})`}
                </p>
              </div>
              {appliedCoupon && (
                <div className="text-right">
                  <p className="text-[9px] tracking-widest uppercase text-emerald-600 font-bold">Discount Applied</p>
                  <p className="font-semibold text-xs sm:text-sm text-emerald-600">-${appliedCoupon.discountAmount.toFixed(2)}</p>
                  <p className="text-[10px] text-gray-500 line-through">Orig: ${baseCost.toFixed(2)}</p>
                </div>
              )}
            </div>
            {/* Deposit breakdown */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="bg-[#C8A96A]/10 border border-[#C8A96A]/30 rounded-xl p-3">
                <p className="text-[9px] uppercase tracking-widest text-[#C8A96A] font-bold">Due Today (Deposit)</p>
                <p className="font-headline text-2xl text-[#C8A96A] font-bold">${customDeposit.toFixed(2)}</p>
                <p className="text-[9px] text-[#1a1c1b]/50 mt-0.5">Secures your venue date &amp; time</p>
              </div>
              <div className="bg-black/5 border border-black/10 rounded-xl p-3">
                <p className="text-[9px] uppercase tracking-widest text-[#1a1c1b]/50 font-bold">Remaining Balance</p>
                <p className="font-headline text-2xl text-[#1a1c1b] font-bold">${Math.max(0, finalCost - customDeposit).toFixed(2)}</p>
                <p className="text-[9px] text-[#1a1c1b]/40 mt-0.5">Due 72 hrs before event</p>
              </div>
            </div>
          </div>

          {/* 72-Hour Balance Deadline Notice */}
          {finalCost - customDeposit > 0 && (
            <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/30 text-xs text-amber-800 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-amber-950">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>72-Hour Balance Policy</span>
              </p>
              <p className="text-[11px] leading-relaxed text-amber-900">
                The remaining <strong>${(finalCost - customDeposit).toFixed(2)}</strong> balance is due no later than <strong>72 hours before the event</strong>. If unpaid by that deadline, the reservation may be canceled.
              </p>
            </div>
          )}

          {/* Payment Method Selector */}
          <div className="space-y-2 pt-2 border-t border-black/10">
            <label className="text-[9px] sm:text-[10px] uppercase tracking-widest text-[#1a1c1b]/60 font-bold block">
              Choose Payment Method
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleSelectCard}
                className={`py-3 px-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                  paymentMethod === "card"
                    ? "bg-[#0F4C3A] text-white border-[#0F4C3A] shadow-md"
                    : "bg-white text-[#1a1c1b] border-gray-200 hover:border-[#C8A96A]"
                }`}
              >
                <span>💳 Credit / Debit Card</span>
                <span className="text-[9px] opacity-80">Stripe Card Deposit</span>
              </button>

              <button
                type="button"
                onClick={handleSelectZelle}
                className={`py-3 px-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                  paymentMethod === "zelle"
                    ? "bg-[#6B1D2F] text-white border-[#6B1D2F] shadow-md"
                    : "bg-white text-[#1a1c1b] border-gray-200 hover:border-[#6B1D2F]"
                }`}
              >
                <span>⚡ Zelle Pay</span>
                <span className="text-[9px] opacity-80">Backend Verification</span>
              </button>
            </div>
          </div>

          {/* Zelle Instructions, Full Booking ID, Reverse Timer & Screenshot Upload */}
          {paymentMethod === "zelle" && (
            <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 space-y-3.5 animate-in fade-in duration-300">
              
              {/* Draft creation loading spinner */}
              {isCreatingZelleDraft && (
                <div className="p-3 bg-purple-100/80 rounded-lg border border-purple-200 flex items-center justify-center gap-2 text-xs font-bold text-purple-900 animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-700" />
                  <span>Holding your venue slot &amp; generating your Booking ID...</span>
                </div>
              )}

              {/* Expired state alert */}
              {isZelleExpired ? (
                <div className="p-4 rounded-xl bg-red-50 border border-red-300 space-y-2.5 text-center">
                  <AlertTriangle className="w-8 h-8 text-red-600 mx-auto" />
                  <h4 className="text-sm font-bold text-red-950">15-Minute Slot Hold Expired</h4>
                  <p className="text-xs text-red-700 leading-relaxed">
                    Your 15-minute temporary slot reservation has ended and the slot has been released for other guests.
                  </p>
                  <button
                    type="button"
                    onClick={createZelleDraft}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-1.5 shadow"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Re-Hold Slot (15 Minutes)</span>
                  </button>
                </div>
              ) : (
                <>
                  {/* 15-Minute Reverse Countdown Clock Badge */}
                  {bookingId && (
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 text-white shadow-sm border border-purple-800">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-300 animate-pulse shrink-0" />
                        <div>
                          <p className="text-[10px] uppercase tracking-wider font-bold text-purple-200">Temporary Slot Hold</p>
                          <p className="text-[9px] text-purple-300 font-light">Completes auto-release when timer ends</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-base font-black text-amber-300 bg-black/50 px-2.5 py-0.5 rounded border border-amber-300/30 inline-block tracking-widest">
                          {formatTimer(zelleSecondsLeft)}
                        </div>
                        <span className="block text-[8px] text-purple-200 uppercase font-sans mt-0.5">remaining</span>
                      </div>
                    </div>
                  )}

                  {/* Zelle Recipient Email Box */}
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-purple-200 shadow-sm">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-purple-700 font-bold">Zelle Recipient Email</p>
                      <p className="text-xs sm:text-sm font-extrabold text-purple-950 font-mono select-all">tropicapayments@gmail.com</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyZelle}
                      className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-[10px] uppercase tracking-wider font-bold hover:bg-purple-700 transition shadow"
                    >
                      {copiedZelle ? "Copied!" : "Copy Email"}
                    </button>
                  </div>

                  {/* Full Booking ID Box (Required for Zelle Memo) */}
                  {bookingId && (
                    <div className="p-3 bg-gradient-to-r from-purple-950 to-indigo-950 text-white rounded-lg border border-purple-400/30 space-y-2 shadow-sm">
                      <div className="flex justify-between items-center">
                        <p className="text-[10px] uppercase tracking-widest text-purple-200 font-bold">
                          Full Booking ID (Paste in Zelle Memo)
                        </p>
                        <span className="text-[9px] bg-amber-400 text-purple-950 px-1.5 py-0.5 rounded font-extrabold uppercase">
                          Required
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 bg-black/40 p-2.5 rounded-lg border border-white/10">
                        <span className="font-mono text-xs sm:text-sm font-bold text-amber-300 break-all select-all">
                          {bookingId}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyBookingId}
                          className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-purple-950 font-bold rounded-lg text-[10px] uppercase tracking-wider transition flex items-center gap-1 shrink-0 shadow"
                        >
                          {copiedBookingId ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedBookingId ? "Copied!" : "Copy Full ID"}</span>
                        </button>
                      </div>
                      <p className="text-[10px] text-purple-200/90 leading-tight">
                        * Paste this full Booking ID into your Zelle payment memo/note so our team can immediately verify your deposit.
                      </p>
                    </div>
                  )}

                  {/* Instructions */}
                  <div className="p-3 bg-white/90 rounded-lg border border-purple-100 space-y-1.5 text-xs text-purple-900">
                    <p className="font-bold text-[11px] text-purple-950">📋 Private Event Zelle Instructions:</p>
                    <ol className="list-decimal pl-4 space-y-1 text-[11px] text-gray-700">
                      <li>Send deposit of <strong className="text-purple-950">${customDeposit.toFixed(2)}</strong> via Zelle to email <span className="font-mono font-bold select-all">tropicapayments@gmail.com</span></li>
                      <li>Paste your copied <strong>Full Booking ID</strong> in your Zelle payment memo/notes.</li>
                      <li>Upload your payment screenshot proof below.</li>
                      <li>Your venue slot is reserved for <strong>15 minutes</strong> while verification proceeds.</li>
                    </ol>
                  </div>

                  {/* Screenshot Proof Uploader */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest text-purple-900 font-bold block">
                      📷 Upload Zelle Screenshot Proof
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="block w-full text-xs text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-purple-600 file:text-white hover:file:bg-purple-700 cursor-pointer"
                    />
                    {screenshotPreview && (
                      <div className="mt-2 relative rounded-lg overflow-hidden border border-purple-300 max-h-40">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={screenshotPreview} alt="Zelle Proof" className="object-cover w-full h-full" />
                        <button
                          type="button"
                          onClick={() => { setScreenshotFile(null); setScreenshotPreview(null); }}
                          className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full text-xs hover:bg-red-700 transition"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Customer Support Notice with Tropica Phone Call */}
                  <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200/80 text-xs text-amber-950 space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-amber-900">
                      <Phone className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Need Help or Cannot Upload Proof?</span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      If you are not able to upload your booking proof, please contact customer support directly:
                    </p>
                    <div>
                      <a
                        href="tel:8669907422"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition-colors shadow-sm"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call Tropica at (866) 990-7422</span>
                      </a>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Preferences & Catering Dishes Summary */}
          <div className="pt-3 border-t border-black/10 space-y-2.5">
            <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-[#1a1c1b]/60 font-bold">Event Preferences &amp; Catering</p>

            <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white border border-[#1a1c1b]/10">
              <UtensilsCrossed className="w-4 h-4 text-[#C8A96A] flex-shrink-0" />
              <div className="flex-1">
                <p className="text-[9px] uppercase tracking-widest text-[#1a1c1b]/50 font-bold">Catering Partner</p>
                <p className="text-xs sm:text-sm font-bold text-[#1a1c1b] mt-0.5">{cateringLabel}</p>
              </div>
            </div>

            {bookingData.selectedDishes && bookingData.selectedDishes.length > 0 && (
              <div className="p-2.5 rounded-lg bg-white border border-[#1a1c1b]/10 space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] uppercase tracking-widest text-[#1a1c1b]/50 font-bold flex items-center gap-1">
                    <ChefHat className="w-3 h-3 text-[#C8A96A]" /> Selected Event Dishes ({bookingData.selectedDishes.length})
                  </p>
                  <span className="text-[9px] text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded font-bold">Add-on (Extra Cost)</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {bookingData.selectedDishes.map((dish: string, i: number) => {
                    const qty = bookingData.dishQuantities?.[dish] || 1;
                    return (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-900 border border-amber-500/20 font-medium flex items-center gap-1.5"
                      >
                        <span>✓ {dish}</span>
                        <span className="font-bold text-amber-800 bg-amber-500/20 px-1 rounded text-[9px]">
                          {qty} {qty === 1 ? "platter" : "platters"}
                        </span>
                      </span>
                    );
                  })}
                </div>
                <p className="text-[10px] text-[#1a1c1b]/60 italic font-body pt-0.5">
                  * Note: The website payment covers venue rental only. Catering dishes are an add-on; the restaurant partner will contact you directly with dish pricing.
                </p>
              </div>
            )}

            {bookingData.cateringNotes && (
              <div className="p-2.5 rounded-lg bg-white border border-[#1a1c1b]/10">
                <p className="text-[9px] uppercase tracking-widest text-[#1a1c1b]/50 font-bold">Dietary / Special Notes</p>
                <p className="text-xs text-[#1a1c1b]/80 italic mt-0.5 leading-relaxed font-body">"{bookingData.cateringNotes}"</p>
              </div>
            )}

            <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white border border-[#1a1c1b]/10">
              <Music className="w-4 h-4 text-[#C8A96A] flex-shrink-0" />
              <div className="flex-1">
                <p className="text-[9px] uppercase tracking-widest text-[#1a1c1b]/50 font-bold">DJ Service</p>
                <p className={cn(
                  "text-xs sm:text-sm font-bold mt-0.5",
                  bookingData.needDj ? "text-[#0F4C3A]" : "text-[#1a1c1b]/60"
                )}>
                  {bookingData.needDj ? "✓ Yes — DJ Requested (+$300 USD)" : "No DJ"}
                </p>
              </div>
            </div>

            {bookingData.needDecoration && (
              <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white border border-[#1a1c1b]/10">
                <Sparkles className="w-4 h-4 text-[#C8A96A] flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-[9px] uppercase tracking-widest text-[#1a1c1b]/50 font-bold">Event Decoration</p>
                  <p className="text-xs sm:text-sm font-bold text-[#1a1c1b] mt-0.5 capitalize">
                    ✓ {bookingData.decorationStyle?.replace(/_/g, " ") || "Custom Decoration"}
                  </p>
                </div>
              </div>
            )}

            {/* Photography / Videography Add-On Row */}
            <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white border border-[#1a1c1b]/10">
              <span className="text-base flex-shrink-0">📷</span>
              <div className="flex-1">
                <p className="text-[9px] uppercase tracking-widest text-[#1a1c1b]/50 font-bold">Photography / Videography</p>
                <p className={cn(
                  "text-xs sm:text-sm font-bold mt-0.5",
                  bookingData.needPhotographer ? "text-[#0F4C3A]" : "text-[#1a1c1b]/60"
                )}>
                  {bookingData.needPhotographer
                    ? `✓ ${bookingData.photographerHours || 2} hrs (+$${photographerCost} USD)`
                    : "No Media Add-on"}
                </p>
                {bookingData.needPhotographer && (bookingData.photographerHours || 2) > 2 && (
                  <p className="text-[10px] text-[#1a1c1b]/40 mt-0.5">
                    $300 base + {(bookingData.photographerHours - 2)} extra hr{(bookingData.photographerHours - 2) > 1 ? "s" : ""} × $150
                  </p>
                )}
              </div>
            </div>

          </div>

          {/* Coupon */}
          <div className="space-y-3 pt-3 border-t border-black/10">
            {!appliedCoupon ? (
              <div className="space-y-1.5">
                <label className="text-[9px] sm:text-[10px] uppercase tracking-widest text-[#1a1c1b]/60 font-bold flex items-center gap-1.5">
                  <Ticket className="w-3 h-3" /> Referral Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Enter code"
                    className="flex-1 bg-white border border-[#C8A96A]/30 rounded-lg px-3 py-1.5 text-xs sm:text-sm text-[#1a1c1b] focus:outline-none focus:border-[#C8A96A]"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={isValidating || !couponCode}
                    className="bg-[#C8A96A] text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider disabled:opacity-50 min-w-[70px] flex justify-center items-center"
                  >
                    {isValidating ? <Loader2 className="w-3 h-3 animate-spin" /> : "Apply"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 p-2.5 rounded-lg">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <div>
                    <p className="text-xs font-bold text-emerald-700">{appliedCoupon.code}</p>
                    <p className="text-[10px] text-emerald-600">-${appliedCoupon.discountAmount.toFixed(2)} applied</p>
                  </div>
                </div>
                <button onClick={handleRemoveCoupon} className="p-1 hover:bg-emerald-100 rounded text-emerald-700 transition">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <label className="text-[9px] sm:text-[10px] uppercase tracking-widest text-[#1a1c1b]/60 font-bold block">
              Adjust your initial payment amount (Min: ${minDeposit})
            </label>
            <input
              type="range"
              min={minDeposit}
              max={finalCost}
              step="1"
              value={customDeposit}
              onChange={(e) => setCustomDeposit(Number(e.target.value))}
              className="w-full accent-[#C8A96A] h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs font-semibold text-gray-500">
              <span>${minDeposit}</span>
              <span>${finalCost}</span>
            </div>
          </div>

          <div className="pt-1 space-y-2">
            <button
              type="button"
              onClick={() => setShowPolicyModal(true)}
              className="text-[10px] sm:text-[11px] text-[#C8A96A] underline font-semibold flex items-center justify-center gap-1.5 w-full hover:text-[#0F4C3A]"
            >
              View Booking &amp; Payment Policy ($200 Deposit / 48-Hour Refund)
            </button>

            {paymentMethod === "zelle" ? (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleSubmitZelle}
                  disabled={submitting || isZelleExpired || !bookingId || !screenshotPreview}
                  className="w-full text-white py-3 sm:py-3.5 rounded-xl text-xs uppercase tracking-widest font-black transition shadow-lg bg-gradient-to-r from-purple-800 to-indigo-900 hover:from-purple-900 hover:to-indigo-950 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting Zelle Verification...</span>
                    </>
                  ) : (
                    <span>
                      {screenshotPreview
                        ? `Confirm & Submit Zelle Reservation ($${customDeposit.toFixed(2)})`
                        : "Upload your Zelle screenshot to submit"}
                    </span>
                  )}
                </button>

                {bookingId && !isZelleExpired && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await api.post("/bookings/cancel-unpaid", { bookingId });
                        toast.success("Held slot released.");
                      } catch (err) {
                        console.warn("Release slot error:", err);
                      }
                      setBookingId(null);
                      setPaymentMethod("card");
                    }}
                    className="w-full text-center py-1 text-[11px] text-gray-500 hover:text-red-600 transition font-medium"
                  >
                    Cancel Hold &amp; Switch to Card
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowPolicyModal(true)}
                disabled={submitting || finalCost < 0}
                className="w-full text-white py-3 sm:py-3.5 rounded-xl text-xs uppercase tracking-widest font-black transition shadow-lg bg-[#0F4C3A] hover:bg-[#1a5b48] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Preparing Payment...</span>
                  </>
                ) : (
                  <span>Confirm &amp; Pay ${customDeposit.toFixed(2)} Deposit</span>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      <BookingPolicyModal
        isOpen={showPolicyModal}
        onClose={() => setShowPolicyModal(false)}
        onAccept={handleReserveCard}
        amount={customDeposit}
        totalPrice={finalCost}
        remainingBalance={Math.max(0, finalCost - customDeposit)}
        durationHours={bookingData.durationHours || 5}
        needDj={bookingData.needDj}
        needPhotographer={bookingData.needPhotographer}
      />

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center">
          {error}
        </div>
      )}

      {submitting && !clientSecret && (
        <div className="space-y-4 animate-pulse p-6 bg-primary/5 rounded-xl border border-primary/10">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400 pt-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            Preparing payment bridge...
          </div>
        </div>
      )}

      {clientSecret && bookingId && (
        <div className="space-y-4">
          <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "stripe" } }}>
            <StripePaymentForm
              bookingId={bookingId}
              onSuccess={handlePaymentSuccess}
              agreedToTerms={bookingData.guestDetails.agreedToTerms}
              agreedToTransactional={bookingData.guestDetails.agreedToTransactional}
            />
          </Elements>
          <button
            type="button"
            onClick={async () => {
              if (bookingId) {
                try {
                  await api.post("/bookings/cancel-unpaid", { bookingId });
                  toast.success("Unpaid booking draft cancelled. Slot released.");
                } catch (err) {
                  console.warn("Cancel unpaid draft error:", err);
                }
              }
              setBookingId(null);
              setClientSecret(null);
              if (onBack) onBack();
            }}
            className="w-full text-center py-2 text-xs text-red-500 hover:text-red-700 font-semibold tracking-wider uppercase transition-colors"
          >
            ← Cancel &amp; Change Booking Details
          </button>
        </div>
      )}
    </div>
  );
}
