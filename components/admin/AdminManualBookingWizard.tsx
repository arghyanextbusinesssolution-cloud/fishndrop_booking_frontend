"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";
import {
  User,
  Phone,
  Mail,
  Calendar,
  Clock,
  Users,
  CreditCard,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  Receipt,
  Printer,
  PlusCircle,
  Cake,
  Music,
  Camera,
  UtensilsCrossed,
  Building2,
  Lock,
  Check
} from "lucide-react";

interface SlotData {
  slot: string;
  isAvailable: boolean;
  message?: string;
}

export function AdminManualBookingWizard() {
  const router = useRouter();

  // Wizard Steps: 1 = Customer, 2 = Venue Schedule & Slot, 3 = Payment & Balance, 4 = Review, 5 = Confirmed
  const [currentStep, setCurrentStep] = useState<number>(1);

  // ── Step 1: Customer Details ───────────────────────────────
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [notes, setNotes] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [existingCustomer, setExistingCustomer] = useState<{
    exists: boolean;
    name?: string;
    email?: string;
    phone?: string;
    pastBookingsCount?: number;
  } | null>(null);

  // ── Step 2: Venue Event Schedule & Slot ────────────────────
  const [bookingDate, setBookingDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [durationHours, setDurationHours] = useState<number>(5);
  const [partySize, setPartySize] = useState<number>(25);
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [customTimeSlot, setCustomTimeSlot] = useState<string>("");
  const [useCustomTime, setUseCustomTime] = useState<boolean>(false);
  const [occasion, setOccasion] = useState<string>("private_party");
  const [forceOverride, setForceOverride] = useState<boolean>(false);

  // Private availability slots
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [availableSlots, setAvailableSlots] = useState<SlotData[]>([]);
  const [venueCapacity, setVenueCapacity] = useState<number>(50);

  // Add-ons & Amenities
  const [needDj, setNeedDj] = useState<boolean>(false);
  const [needPhotographer, setNeedPhotographer] = useState<boolean>(false);
  const [photographerHours, setPhotographerHours] = useState<number>(2);
  const [cateringMenu, setCateringMenu] = useState<string>("none");
  const [hasCake, setHasCake] = useState<boolean>(false);
  const [cakeDetails, setCakeDetails] = useState<string>("");
  const [cakePrice, setCakePrice] = useState<number>(0);

  // ── Step 3: Venue Pricing & Remaining Balance ──────────────
  const [customTotalAmount, setCustomTotalAmount] = useState<number>(500);
  const [paidAmount, setPaidAmount] = useState<number>(200); // Standard deposit default
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "zelle" | "bank_transfer" | "other">("cash");
  const [paymentPreset, setPaymentPreset] = useState<"full" | "deposit" | "unpaid" | "custom">("deposit");
  const [paymentNotes, setPaymentNotes] = useState<string>("");
  const [transactionId, setTransactionId] = useState<string>("");
  const [paymentDeadline, setPaymentDeadline] = useState<"event_time" | "72_hours_before">("72_hours_before");

  // ── Step 4 & 5: Submission & Result ────────────────────────
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [createdBooking, setCreatedBooking] = useState<any>(null);
  const [accountCreatedFlag, setAccountCreatedFlag] = useState<boolean>(false);

  // Duration base prices map — $100 per hour
  const durationBasePriceMap: Record<number, number> = {
    1: 100,
    2: 200,
    3: 300,
    4: 400,
    5: 500,
    6: 600,
    7: 700,
    8: 800,
    9: 900,
    10: 1000
  };

  // Recalculate suggested total when duration or cake changes
  useEffect(() => {
    let base = durationBasePriceMap[durationHours] || (durationHours * 100);
    if (hasCake) base += Number(cakePrice || 0);
    setCustomTotalAmount(base);

    if (paymentPreset === "full") {
      setPaidAmount(base);
    } else if (paymentPreset === "deposit") {
      setPaidAmount(Math.min(200, base));
    } else if (paymentPreset === "unpaid") {
      setPaidAmount(0);
    }
  }, [durationHours, hasCake, cakePrice]);

  // Handle Preset changes
  const handlePresetChange = (preset: "full" | "deposit" | "unpaid" | "custom") => {
    setPaymentPreset(preset);
    if (preset === "full") {
      setPaidAmount(customTotalAmount);
    } else if (preset === "deposit") {
      setPaidAmount(Math.min(200, customTotalAmount));
    } else if (preset === "unpaid") {
      setPaidAmount(0);
    }
  };

  // Dynamically computed remaining balance
  const remainingBalance = useMemo(() => {
    return Math.max(0, customTotalAmount - paidAmount);
  }, [customTotalAmount, paidAmount]);

  // Calculate End Time for display (e.g. 18:00 + 4 hours = 22:00)
  const getEndTime = (startTime: string, hours: number) => {
    if (!startTime) return "";
    const [h, m] = startTime.split(":").map(Number);
    const endH = (h + hours) % 24;
    return `${endH < 10 ? "0" : ""}${endH}:${m < 10 ? "0" : ""}${m}`;
  };

  // Convert 24h format "14:00" to 12h format "2:00 PM"
  const formatTime12h = (timeStr: string) => {
    if (!timeStr) return "";
    const parts = timeStr.split(":");
    if (parts.length < 2) return timeStr;
    let h = parseInt(parts[0], 10);
    const m = parts[1];
    if (isNaN(h)) return timeStr;
    const period = h >= 12 ? "PM" : "AM";
    h = h % 12;
    if (h === 0) h = 12;
    return `${h}:${m} ${period}`;
  };

  // Customer phone live lookup (at least 10 digits)
  useEffect(() => {
    const clean = customerPhone.replace(/\D/g, "");
    if (clean.length >= 10) {
      let active = true;
      setLookupLoading(true);
      api
        .get(`/admin/customers/lookup?phone=${encodeURIComponent(customerPhone.trim())}`)
        .then((res) => {
          if (!active) return;
          if (res.data?.exists) {
            setExistingCustomer({
              exists: true,
              name: res.data.user.name,
              email: res.data.user.email,
              phone: res.data.user.phone,
              pastBookingsCount: res.data.user.pastBookingsCount
            });
            if (!customerName && res.data.user.name) {
              setCustomerName(res.data.user.name);
            }
            if (!customerEmail && res.data.user.email && !res.data.user.email.includes("@fishndrop.com")) {
              setCustomerEmail(res.data.user.email);
            }
          } else {
            setExistingCustomer({ exists: false });
          }
        })
        .catch(() => {
          if (active) setExistingCustomer(null);
        })
        .finally(() => {
          if (active) setLookupLoading(false);
        });
      return () => {
        active = false;
      };
    } else {
      setExistingCustomer(null);
    }
  }, [customerPhone]);

  // Fetch Private Venue Availability for selected date and duration
  useEffect(() => {
    if (!bookingDate) return;
    let active = true;
    setLoadingSlots(true);

    api
      .get("/bookings/private-availability", {
        params: {
          date: bookingDate,
          duration: durationHours
        }
      })
      .then((res) => {
        if (!active) return;
        if (res.data?.slots) {
          setAvailableSlots(res.data.slots);
          if (res.data.totalCapacity) {
            setVenueCapacity(res.data.totalCapacity);
          }
          // If selected slot is no longer available in the new slots, clear it (unless custom time is used)
          if (!useCustomTime && selectedSlot) {
            const found = res.data.slots.find((s: SlotData) => s.slot === selectedSlot);
            if (found && !found.isAvailable) {
              // keep selection so admin can choose to override, but warn
            }
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load private venue slots", err);
      })
      .finally(() => {
        if (active) setLoadingSlots(false);
      });

    return () => {
      active = false;
    };
  }, [bookingDate, durationHours]);

  const activeSlot = useCustomTime ? customTimeSlot : selectedSlot;

  // Validation before proceeding
  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!customerPhone.trim()) {
        toast.error("Please enter a customer phone number");
        return;
      }
      if (!customerName.trim()) {
        toast.error("Please enter the customer / event organizer's name");
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!bookingDate) {
        toast.error("Please select an event date");
        return;
      }
      if (!activeSlot) {
        toast.error("Please select or enter an event start time slot");
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (customTotalAmount < 0) {
        toast.error("Venue price cannot be negative");
        return;
      }
      if (paidAmount < 0) {
        toast.error("Paid amount cannot be negative");
        return;
      }
      if (paidAmount > customTotalAmount) {
        toast.error("Paid amount cannot exceed total contracted price");
        return;
      }
      setCurrentStep(4);
    }
  };

  // Submit manual venue booking
  const handleCreateVenueBooking = async () => {
    setIsSubmitting(true);
    try {
      const payload: any = {
        bookingType: "private_event", // Specifically private venue booking
        customerPhone: customerPhone.trim(),
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim() || undefined,
        notes: [companyName ? `Company: ${companyName}` : "", notes.trim()].filter(Boolean).join(" | "),
        bookingDate,
        bookingTime: activeSlot,
        durationHours: Number(durationHours),
        partySize: Number(partySize),
        occasion,
        totalAmount: Number(customTotalAmount),
        paidAmount: Number(paidAmount),
        paymentMethod,
        paymentNotes: paymentNotes.trim() || undefined,
        transactionId: transactionId.trim() || undefined,
        paymentDeadline,
        forceOverride,
        needDj,
        needPhotographer,
        photographerHours: needPhotographer ? Number(photographerHours) : 0,
        cateringMenu: cateringMenu !== "none" ? cateringMenu : undefined
      };

      if (hasCake) {
        payload.cakeDetails = cakeDetails.trim() || "Custom Celebration Cake";
        payload.cakePrice = Number(cakePrice || 0);
      }

      const res = await api.post("/admin/bookings/manual", payload);

      if (res.data?.success) {
        toast.success("Venue booking confirmed! Event time slot has been locked.");
        setCreatedBooking(res.data.booking);
        setAccountCreatedFlag(Boolean(res.data.accountCreated));
        setCurrentStep(5);
      } else {
        toast.error(res.data?.message || "Booking creation failed");
      }
    } catch (err: any) {
      console.error("Booking submission error:", err);
      const msg = err.response?.data?.message || "Failed to create venue booking";
      toast.error(msg);
      if (err.response?.data?.hasConflict) {
        setForceOverride(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setCustomerPhone("");
    setCustomerName("");
    setCustomerEmail("");
    setCompanyName("");
    setNotes("");
    setExistingCustomer(null);
    setSelectedSlot("");
    setCustomTimeSlot("");
    setUseCustomTime(false);
    setDurationHours(5);
    setPaymentDeadline("72_hours_before");
    setPartySize(25);
    setCustomTotalAmount(500);
    setPaidAmount(200);
    setPaymentPreset("deposit");
    setPaymentNotes("");
    setTransactionId("");
    setForceOverride(false);
    setCreatedBooking(null);
  };

  return (
    <div className="p-6 md:p-10 space-y-8 min-h-screen max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant/15 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-label text-[9px] tracking-[0.3em] uppercase text-emerald-600 font-bold block flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" /> Venue Buyout & Event Management
            </span>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
              No OTP Required
            </span>
          </div>
          <h1 className="font-headline text-3xl md:text-4xl text-on-surface italic font-serif">
            Book Venue (Exclusive Buyout)
          </h1>
          <p className="text-sm text-secondary font-light">
            Reserve the entire Tropica venue for private events, lock the time slot, create customer accounts without OTP, and record deposits with live remaining balance calculation.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/bookings"
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-outline-variant/30 text-xs font-bold uppercase tracking-wider text-secondary hover:bg-surface-container transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Bookings</span>
          </Link>
        </div>
      </div>

      {/* Stepper Header (Only shown if not confirmed) */}
      {currentStep < 5 && (
        <div className="grid grid-cols-4 gap-2 text-xs font-medium">
          {[
            { step: 1, label: "1. Customer", desc: "Phone & Account" },
            { step: 2, label: "2. Venue Slot", desc: "Date, Time, Hours" },
            { step: 3, label: "3. Balance Due", desc: "Deposit & Balance" },
            { step: 4, label: "4. Review", desc: "Lock Venue" }
          ].map((item) => (
            <div
              key={item.step}
              className={cn(
                "p-3 rounded-xl border transition-all text-left flex flex-col justify-between",
                currentStep === item.step
                  ? "bg-emerald-50/50 border-emerald-500 shadow-sm"
                  : currentStep > item.step
                  ? "bg-surface-container/60 border-outline-variant/30 text-emerald-700"
                  : "bg-surface-container/20 border-outline-variant/15 text-secondary/60"
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "font-bold uppercase tracking-wider text-[10px]",
                    currentStep === item.step ? "text-emerald-700" : ""
                  )}
                >
                  {item.label}
                </span>
                {currentStep > item.step && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              </div>
              <span className="text-[11px] text-secondary font-light truncate mt-0.5">{item.desc}</span>
            </div>
          ))}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────── */}
      {/* STEP 1: CUSTOMER & HOST DETAILS                           */}
      {/* ───────────────────────────────────────────────────────── */}
      {currentStep === 1 && (
        <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-outline-variant/15 pb-4">
            <div>
              <h2 className="text-xl font-headline font-serif text-on-surface flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-600" />
                Customer & Event Host Information
              </h2>
              <p className="text-xs text-secondary mt-0.5">
                Enter the host's phone number. The user account is automatically created without OTP verification, or attached to their existing account.
              </p>
            </div>
            <div className="px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-[10px] font-bold uppercase tracking-wider hidden sm:block">
              Auto Account Link
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Phone Number Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface flex items-center justify-between">
                <span>Phone Number *</span>
                {lookupLoading && (
                  <span className="text-[10px] font-normal text-secondary flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Looking up...
                  </span>
                )}
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-outline absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant/40 bg-surface focus:outline-none focus:border-emerald-600 font-body text-sm text-on-surface"
                  required
                />
              </div>

              {/* Existing vs New Account status banner */}
              {existingCustomer?.exists && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-900 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Existing Customer Profile Found:</span>
                    <p className="mt-0.5 text-emerald-800">
                      Member: <strong className="font-semibold">{existingCustomer.name || "Customer"}</strong> ({existingCustomer.pastBookingsCount || 0} prior reservation(s)). This venue booking will be linked to their account.
                    </p>
                  </div>
                </div>
              )}

              {existingCustomer && !existingCustomer.exists && customerPhone.replace(/\D/g, "").length >= 10 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2.5 text-xs text-blue-900 animate-fadeIn">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">New User Account (OTP-Free):</span>
                    <p className="mt-0.5 text-blue-800">
                      An account will be instantly registered using this phone number. No OTP verification needed.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Host / Customer Name */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface">
                Host / Customer Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-outline absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="e.g. Michael Smith"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant/40 bg-surface focus:outline-none focus:border-emerald-600 font-body text-sm text-on-surface"
                  required
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface flex items-center justify-between">
                <span>Email Address (Optional)</span>
                <span className="text-[10px] font-normal text-secondary">Auto-generated if left blank</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-outline absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  placeholder="host@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant/40 bg-surface focus:outline-none focus:border-emerald-600 font-body text-sm text-on-surface"
                />
              </div>
            </div>

            {/* Company / Organization Name */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface">
                Company / Organization (Optional)
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-outline absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="e.g. Acme Corp / Private Host"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant/40 bg-surface focus:outline-none focus:border-emerald-600 font-body text-sm text-on-surface"
                />
              </div>
            </div>

            {/* Notes / VIP Requirements */}
            <div className="space-y-2 col-span-full">
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface">
                Event Requirements & Host Notes
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Audio-visual setup needed, stage setup, champagne toast at 9 PM, VIP lounge area"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/40 bg-surface focus:outline-none focus:border-emerald-600 font-body text-sm text-on-surface"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-outline-variant/15">
            <button
              type="button"
              onClick={handleNextStep}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-emerald-500 transition-all shadow-md"
            >
              <span>Next: Venue Schedule & Time Slot</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────── */}
      {/* STEP 2: VENUE SCHEDULE & TIME SLOTS                       */}
      {/* ───────────────────────────────────────────────────────── */}
      {currentStep === 2 && (
        <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-outline-variant/15 pb-4">
            <div>
              <h2 className="text-xl font-headline font-serif text-on-surface flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                Venue Event Schedule & Time Slot
              </h2>
              <p className="text-xs text-secondary mt-0.5">
                Select event date, duration, and the start time slot to lock the entire venue.
              </p>
            </div>
            <div className="px-3 py-1 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[10px] font-bold uppercase tracking-wider hidden sm:block">
              Exclusive Buyout Lock
            </div>
          </div>

          {/* Date, Duration, Guest Count, Occasion */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Date */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface">
                Event Date *
              </label>
              <input
                type="date"
                value={bookingDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setBookingDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-outline-variant/40 bg-surface focus:outline-none focus:border-emerald-600 font-body text-sm text-on-surface"
                required
              />
              <div className="flex gap-2 text-[10px] text-secondary">
                <button
                  type="button"
                  onClick={() => setBookingDate(new Date().toISOString().split("T")[0])}
                  className="px-2 py-0.5 rounded border border-outline-variant/30 hover:bg-surface-container"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() + 1);
                    setBookingDate(d.toISOString().split("T")[0]);
                  }}
                  className="px-2 py-0.5 rounded border border-outline-variant/30 hover:bg-surface-container"
                >
                  Tomorrow
                </button>
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface">
                Duration (Hours) *
              </label>
              <select
                value={durationHours}
                onChange={(e) => setDurationHours(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-outline-variant/40 bg-surface focus:outline-none focus:border-emerald-600 font-body text-sm text-on-surface font-semibold"
              >
                <option value={1}>1 Hour ($100)</option>
                <option value={2}>2 Hours ($200)</option>
                <option value={3}>3 Hours ($300)</option>
                <option value={4}>4 Hours ($400)</option>
                <option value={5}>5 Hours ($500 — Standard Buyout)</option>
                <option value={6}>6 Hours ($600)</option>
                <option value={7}>7 Hours ($700)</option>
                <option value={8}>8 Hours ($800)</option>
                <option value={9}>9 Hours ($900)</option>
                <option value={10}>10 Hours / Full Day ($1,000)</option>
              </select>
            </div>

            {/* Guest Count / Party Size */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface">
                Guest Count *
              </label>
              <input
                type="number"
                min={2}
                max={200}
                value={partySize}
                onChange={(e) => setPartySize(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-outline-variant/40 bg-surface focus:outline-none focus:border-emerald-600 font-body text-sm text-on-surface font-semibold"
                placeholder="e.g. 25"
                required
              />
              <span className="text-[10px] text-secondary block">Full venue capacity ~{venueCapacity} seated</span>
            </div>

            {/* Event Occasion */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface">
                Event Type / Occasion
              </label>
              <select
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-outline-variant/40 bg-surface focus:outline-none focus:border-emerald-600 font-body text-sm text-on-surface"
              >
                <option value="private_party">Private Party / Celebration</option>
                <option value="birthday">Birthday Bash</option>
                <option value="corporate">Corporate Gala / Dinner</option>
                <option value="wedding">Wedding / Engagement Party</option>
                <option value="networking">Networking / Launch Event</option>
                <option value="anniversary">Anniversary</option>
                <option value="other">Exclusive Venue Buyout</option>
              </select>
            </div>
          </div>

          {/* TIME SLOT SELECTION */}
          <div className="space-y-4 border-t border-outline-variant/15 pt-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  Select Starting Time Slot ({durationHours} Hours Block) *
                </label>
                <p className="text-[11px] text-secondary">
                  The entire venue will be blocked starting at this time for the full {durationHours} hours.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setUseCustomTime(!useCustomTime)}
                  className="text-xs font-bold text-emerald-700 underline hover:text-emerald-800"
                >
                  {useCustomTime ? "Show Hourly Slots" : "Enter Custom Time Slot"}
                </button>
              </div>
            </div>

            {useCustomTime ? (
              <div className="p-4 rounded-xl border border-outline-variant/30 bg-surface space-y-2">
                <label className="text-xs font-bold text-on-surface">Custom Start Time (HH:MM)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="time"
                    value={customTimeSlot}
                    onChange={(e) => setCustomTimeSlot(e.target.value)}
                    className="px-4 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-lowest font-semibold text-sm"
                  />
                  {customTimeSlot && (
                    <span className="text-xs text-emerald-700 font-medium">
                      Window: <strong>{formatTime12h(customTimeSlot)}</strong> to <strong>{formatTime12h(getEndTime(customTimeSlot, durationHours))}</strong> ({durationHours} hours)
                    </span>
                  )}
                </div>
              </div>
            ) : loadingSlots ? (
              <div className="py-8 flex flex-col items-center justify-center text-xs text-secondary gap-2 border border-outline-variant/15 rounded-xl bg-surface">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                <span>Checking live venue schedule for {bookingDate}...</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
                {availableSlots.length > 0 ? (
                  availableSlots.map((slotItem) => {
                    const isSelected = selectedSlot === slotItem.slot;
                    const endTime = getEndTime(slotItem.slot, durationHours);
                    return (
                      <button
                        key={slotItem.slot}
                        type="button"
                        onClick={() => setSelectedSlot(slotItem.slot)}
                        className={cn(
                          "p-3 rounded-xl border flex flex-col items-center justify-center transition-all relative text-left",
                          isSelected
                            ? "bg-emerald-600 text-white border-emerald-500 font-bold shadow-md scale-[1.02]"
                            : slotItem.isAvailable
                            ? "bg-surface hover:bg-emerald-800/40 hover:border-emerald-400 border-outline-variant/40 text-on-surface"
                            : "bg-surface-container/30 border-red-500/30 text-red-300 hover:border-red-400 hover:bg-red-950/20"
                        )}
                      >
                        <span className="text-sm font-bold whitespace-nowrap">{formatTime12h(slotItem.slot)}</span>
                        <span className="text-[10px] opacity-80 whitespace-nowrap">to {formatTime12h(endTime)}</span>
                        <span
                          className={cn(
                            "text-[8px] uppercase tracking-wider font-bold mt-1 px-1.5 py-0.5 rounded",
                            isSelected
                              ? "bg-white/20 text-white"
                              : slotItem.isAvailable
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-red-100 text-red-700"
                          )}
                        >
                          {slotItem.isAvailable ? "Available" : "Conflict"}
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <div className="col-span-full py-4 text-center text-xs text-secondary">
                    No slots returned. Use custom time input above.
                  </div>
                )}
              </div>
            )}

            {/* Selected slot feedback badge */}
            {activeSlot && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs text-on-surface flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Selected Event Window: <strong className="font-bold text-emerald-300">{formatTime12h(activeSlot)} - {formatTime12h(getEndTime(activeSlot, durationHours))}</strong> ({durationHours} Hours) on {bookingDate}
                  </span>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-300 bg-emerald-900/50 border border-emerald-500/30 px-2.5 py-1 rounded-full text-center">
                  Full Venue Buyout
                </span>
              </div>
            )}

            {/* Admin Override Conflict Checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="forceOverride"
                checked={forceOverride}
                onChange={(e) => setForceOverride(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-outline-variant focus:ring-emerald-500"
              />
              <label htmlFor="forceOverride" className="text-xs text-secondary cursor-pointer">
                Admin Priority Override (Force booking even if partial overlaps exist on calendar)
              </label>
            </div>
          </div>

          {/* Event Add-ons & Amenities */}
          <div className="space-y-4 border-t border-outline-variant/15 pt-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface">
              Venue Amenities & Event Services
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Resident DJ */}
              <div className="p-4 rounded-xl border border-outline-variant/30 bg-surface space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={needDj}
                    onChange={(e) => setNeedDj(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                    <Music className="w-4 h-4 text-emerald-600" /> Resident Event DJ
                  </span>
                </label>
                <p className="text-[11px] text-secondary pl-6">
                  Sound equipment, professional mixer & resident DJ setup.
                </p>
              </div>

              {/* Event Photographer */}
              <div className="p-4 rounded-xl border border-outline-variant/30 bg-surface space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={needPhotographer}
                    onChange={(e) => setNeedPhotographer(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-emerald-600" /> Event Photographer
                  </span>
                </label>
                {needPhotographer && (
                  <div className="flex items-center gap-2 pl-6">
                    <span className="text-[11px] text-secondary">Hours:</span>
                    <input
                      type="number"
                      min={2}
                      max={durationHours}
                      value={photographerHours}
                      onChange={(e) => setPhotographerHours(Number(e.target.value))}
                      className="w-16 px-2 py-1 rounded border border-outline-variant/40 text-xs bg-surface-container-lowest"
                    />
                  </div>
                )}
              </div>

              {/* Catering Menu */}
              <div className="p-4 rounded-xl border border-outline-variant/30 bg-surface space-y-2">
                <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                  <UtensilsCrossed className="w-4 h-4 text-emerald-600" /> Partner Catering
                </span>
                <select
                  value={cateringMenu}
                  onChange={(e) => setCateringMenu(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-outline-variant/40 text-xs bg-surface-container-lowest"
                >
                  <option value="none">No Partner Catering (Self-Managed)</option>
                  <option value="jamaican_jerk_house">Jamaican Jerk House</option>
                  <option value="east_coast_street_tacos">East Coast Street Tacos</option>
                  <option value="cooklyn_eats">Cooklyn Eats</option>
                  <option value="custom">Custom / Multi-Restaurant Mix</option>
                </select>
              </div>

              {/* Custom Celebration Cake */}
              <div className="p-4 rounded-xl border border-outline-variant/30 bg-surface space-y-2 col-span-full">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasCake}
                    onChange={(e) => setHasCake(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                    <Cake className="w-4 h-4 text-emerald-600" /> Celebration Cake
                  </span>
                </label>
                {hasCake && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 pl-6">
                    <input
                      type="text"
                      placeholder="Cake Message & Theme"
                      value={cakeDetails}
                      onChange={(e) => setCakeDetails(e.target.value)}
                      className="sm:col-span-2 px-3 py-1.5 rounded-lg border border-outline-variant/40 text-xs bg-surface-container-lowest"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-secondary">Price: $</span>
                      <input
                        type="number"
                        min={0}
                        value={cakePrice}
                        onChange={(e) => setCakePrice(Number(e.target.value))}
                        className="w-full px-3 py-1.5 rounded-lg border border-outline-variant/40 text-xs bg-surface-container-lowest"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-outline-variant/15">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-outline-variant/30 text-xs font-bold uppercase tracking-wider text-secondary hover:bg-surface-container"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={handleNextStep}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-emerald-500 transition-all shadow-md"
            >
              <span>Next: Pricing & Balance Due</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────── */}
      {/* STEP 3: VENUE PRICING & REMAINING BALANCE                 */}
      {/* ───────────────────────────────────────────────────────── */}
      {currentStep === 3 && (
        <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-outline-variant/15 pb-4">
            <div>
              <h2 className="text-xl font-headline font-serif text-on-surface flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                Venue Pricing, Deposit & Remaining Balance
              </h2>
              <p className="text-xs text-secondary mt-0.5">
                Set the contracted venue price and record the advance payment. The remaining balance due upon event arrival is computed in real time.
              </p>
            </div>
            <div className="px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-[10px] font-bold uppercase tracking-wider hidden sm:block">
              Balance Due Tracker
            </div>
          </div>

          {/* DYNAMIC FINANCIAL HERO CARD */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-surface-container-high to-surface-container border border-outline-variant/30 space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary block">
              Venue Contract Financial Summary
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-surface-container-lowest/90 rounded-xl border border-outline-variant/20">
                <span className="text-[10px] uppercase font-bold tracking-wider text-secondary">
                  Total Contracted Price
                </span>
                <p className="text-2xl font-bold font-headline text-on-surface mt-1">
                  ${customTotalAmount.toFixed(2)}
                </p>
                <span className="text-[10px] text-secondary">Venue buyout ({durationHours} hours)</span>
              </div>

              <div className="p-4 bg-surface-container-lowest/90 rounded-xl border border-outline-variant/20">
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700">
                  Advance / Deposit Paid Now
                </span>
                <p className="text-2xl font-bold font-headline text-emerald-600 mt-1">
                  ${paidAmount.toFixed(2)}
                </p>
                <span className="text-[10px] text-emerald-700/80">
                  {paidAmount >= customTotalAmount
                    ? "Paid in Full"
                    : paidAmount > 0
                    ? `Advance Secured ($${paidAmount.toFixed(2)})`
                    : "Unpaid / Pay Later"}
                </span>
              </div>

              <div
                className={cn(
                  "p-4 rounded-xl border transition-all",
                  remainingBalance === 0
                    ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                    : remainingBalance > 0 && paidAmount > 0
                    ? "bg-amber-50 border-amber-300 text-amber-950"
                    : "bg-red-50 border-red-300 text-red-950"
                )}
              >
                <span className="text-[10px] uppercase font-bold tracking-wider">
                  Remaining Balance Due
                </span>
                <p className="text-2xl font-bold font-headline mt-1">
                  ${remainingBalance.toFixed(2)}
                </p>
                <span className="text-[10px] font-semibold">
                  {remainingBalance === 0
                    ? "✓ Settled in Full ($0 Balance)"
                    : `Due Upon Arrival ($${remainingBalance.toFixed(2)})`}
                </span>
              </div>
            </div>
          </div>

          {/* Pricing & Payment Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Total Contracted Price (Editable) */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface flex items-center justify-between">
                <span>Total Venue Contract Price ($) *</span>
                <span className="text-[10px] text-secondary font-normal">Editable contracted amount</span>
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-outline absolute left-3.5 top-3.5" />
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={customTotalAmount}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setCustomTotalAmount(val);
                    if (paymentPreset === "full") {
                      setPaidAmount(val);
                    }
                  }}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant/40 bg-surface focus:outline-none focus:border-emerald-600 font-body text-sm text-on-surface font-semibold"
                  required
                />
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface">
                Payment Method Collected
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/40 bg-surface focus:outline-none focus:border-emerald-600 font-body text-sm text-on-surface font-medium"
              >
                <option value="cash">💵 Cash (In-Person / Office)</option>
                <option value="card">💳 Credit / Debit Card (POS Terminal)</option>
                <option value="zelle">⚡ Zelle Wire Transfer</option>
                <option value="bank_transfer">🏦 Bank Wire / ACH Transfer</option>
                <option value="other">📋 Other / Corporate Invoice</option>
              </select>
            </div>
          </div>

          {/* Payment Presets */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-on-surface">
              Deposit & Payment Options
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() => handlePresetChange("deposit")}
                className={cn(
                  "p-3 rounded-xl border text-center transition-all",
                  paymentPreset === "deposit"
                    ? "bg-emerald-600 text-white border-emerald-600 font-bold shadow-sm"
                    : "bg-surface border-outline-variant/30 hover:bg-surface-container text-on-surface"
                )}
              >
                <span className="text-xs block font-bold">Standard Deposit</span>
                <span className="text-[10px] opacity-80">$200.00 Advance</span>
              </button>

              <button
                type="button"
                onClick={() => handlePresetChange("full")}
                className={cn(
                  "p-3 rounded-xl border text-center transition-all",
                  paymentPreset === "full"
                    ? "bg-emerald-600 text-white border-emerald-600 font-bold shadow-sm"
                    : "bg-surface border-outline-variant/30 hover:bg-surface-container text-on-surface"
                )}
              >
                <span className="text-xs block font-bold">Paid in Full</span>
                <span className="text-[10px] opacity-80">${customTotalAmount} (No Balance)</span>
              </button>

              <button
                type="button"
                onClick={() => handlePresetChange("unpaid")}
                className={cn(
                  "p-3 rounded-xl border text-center transition-all",
                  paymentPreset === "unpaid"
                    ? "bg-emerald-600 text-white border-emerald-600 font-bold shadow-sm"
                    : "bg-surface border-outline-variant/30 hover:bg-surface-container text-on-surface"
                )}
              >
                <span className="text-xs block font-bold">Pay Later / $0</span>
                <span className="text-[10px] opacity-80">Full balance pending</span>
              </button>

              <button
                type="button"
                onClick={() => handlePresetChange("custom")}
                className={cn(
                  "p-3 rounded-xl border text-center transition-all",
                  paymentPreset === "custom"
                    ? "bg-emerald-600 text-white border-emerald-600 font-bold shadow-sm"
                    : "bg-surface border-outline-variant/30 hover:bg-surface-container text-on-surface"
                )}
              >
                <span className="text-xs block font-bold">Custom Amount</span>
                <span className="text-[10px] opacity-80">Manual entry</span>
              </button>
            </div>
          </div>

          {/* Paid Amount Numeric Input & Reference */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface">
                Amount Collected Now ($)
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-outline absolute left-3.5 top-3.5" />
                <input
                  type="number"
                  min={0}
                  max={customTotalAmount}
                  step={1}
                  value={paidAmount}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setPaidAmount(val);
                    setPaymentPreset("custom");
                  }}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant/40 bg-surface focus:outline-none focus:border-emerald-600 font-body text-sm text-on-surface font-semibold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface">
                Payment Reference / Receipt / Transaction #
              </label>
              <input
                type="text"
                placeholder="e.g. Cash receipt #1049, Wire txn #948271"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/40 bg-surface focus:outline-none focus:border-emerald-600 font-body text-sm text-on-surface"
              />
            </div>
          </div>

          {/* Payment Deadline Selector */}
          {remainingBalance > 0 && (
            <div className="space-y-2 border-t border-outline-variant/15 pt-5">
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                Remaining Balance Payment Deadline
              </label>
              <p className="text-[11px] text-secondary">
                The customer can pay the remaining ${remainingBalance.toFixed(2)} from their profile dashboard before this deadline. The admin can also manually mark it as fully paid at any time.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPaymentDeadline("72_hours_before")}
                  className={cn(
                    "p-3 rounded-xl border text-center transition-all text-left",
                    paymentDeadline === "72_hours_before"
                      ? "bg-emerald-600 text-white border-emerald-600 font-bold shadow-sm"
                      : "bg-surface border-outline-variant/30 hover:bg-surface-container text-on-surface"
                  )}
                >
                  <span className="text-xs block font-bold">72 Hours Before Event</span>
                  <span className="text-[10px] opacity-80">Customer must pay remaining balance 3 days prior</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentDeadline("event_time")}
                  className={cn(
                    "p-3 rounded-xl border text-center transition-all text-left",
                    paymentDeadline === "event_time"
                      ? "bg-emerald-600 text-white border-emerald-600 font-bold shadow-sm"
                      : "bg-surface border-outline-variant/30 hover:bg-surface-container text-on-surface"
                  )}
                >
                  <span className="text-xs block font-bold">At Event Time (Day-of)</span>
                  <span className="text-[10px] opacity-80">Customer can pay until the start of the event</span>
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4 border-t border-outline-variant/15">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-outline-variant/30 text-xs font-bold uppercase tracking-wider text-secondary hover:bg-surface-container"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={handleNextStep}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-emerald-500 transition-all shadow-md"
            >
              <span>Next: Review & Confirm</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────── */}
      {/* STEP 4: REVIEW & CONFIRM                                  */}
      {/* ───────────────────────────────────────────────────────── */}
      {currentStep === 4 && (
        <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm">
          <div className="border-b border-outline-variant/15 pb-4">
            <h2 className="text-xl font-headline font-serif text-on-surface flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-600" />
              Review & Finalize Venue Buyout
            </h2>
            <p className="text-xs text-secondary mt-0.5">
              Review all event parameters below. When confirmed, all venue tables and time slots will be locked, and the host's account registered without OTP.
            </p>
          </div>

          {/* Summary Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Host Box */}
            <div className="p-5 rounded-xl bg-surface border border-outline-variant/25 space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                Event Host & Account
              </span>
              <div className="space-y-1.5 text-xs text-on-surface">
                <p>
                  <strong>Host Name:</strong> {customerName}
                </p>
                <p>
                  <strong>Phone:</strong> {customerPhone}
                </p>
                <p>
                  <strong>Email:</strong> {customerEmail || "Auto-generated guest account"}
                </p>
                {companyName && (
                  <p>
                    <strong>Company:</strong> {companyName}
                  </p>
                )}
                {notes && (
                  <p>
                    <strong>Notes:</strong> {notes}
                  </p>
                )}
                <div className="pt-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {existingCustomer?.exists
                      ? "Linking to existing member profile"
                      : "New user account created directly (No OTP required)"}
                  </span>
                </div>
              </div>
            </div>

            {/* Venue Event Box */}
            <div className="p-5 rounded-xl bg-surface border border-outline-variant/25 space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                Venue Event Schedule
              </span>
              <div className="space-y-1.5 text-xs text-on-surface">
                <p>
                  <strong>Reservation:</strong> Private Venue Buyout (Full Venue)
                </p>
                <p>
                  <strong>Date:</strong> {bookingDate}
                </p>
                <p>
                  <strong>Time Window:</strong>{" "}
                  <span className="font-bold text-emerald-700">
                    {formatTime12h(activeSlot)} - {formatTime12h(getEndTime(activeSlot, durationHours))} ({durationHours} Hours)
                  </span>
                </p>
                <p>
                  <strong>Guests:</strong> {partySize} Attendees
                </p>
                <p>
                  <strong>Occasion:</strong> {occasion}
                </p>
                <p>
                  <strong>Services:</strong> {[needDj ? "DJ Setup" : "", needPhotographer ? `Photographer (${photographerHours}h)` : "", cateringMenu !== "none" ? `Catering (${cateringMenu})` : "", hasCake ? "Cake" : ""].filter(Boolean).join(", ") || "Standard Venue Hire"}
                </p>
              </div>
            </div>
          </div>

          {/* Financial Breakdown Card */}
          <div className="p-5 rounded-xl bg-surface border border-outline-variant/25 space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
              Payment & Remaining Balance Breakdown
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-secondary block">Total Venue Hire:</span>
                <span className="text-xl font-bold font-headline text-on-surface">
                  ${customTotalAmount.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-secondary block">Payment Method:</span>
                <span className="text-sm font-semibold capitalize text-on-surface">
                  {paymentMethod}
                </span>
              </div>
              <div>
                <span className="text-secondary block">Deposit Paid Now:</span>
                <span className="text-xl font-bold font-headline text-emerald-600">
                  ${paidAmount.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-secondary block">Remaining Balance:</span>
                <span
                  className={cn(
                    "text-xl font-bold font-headline",
                    remainingBalance === 0 ? "text-emerald-700" : "text-amber-700"
                  )}
                >
                  ${remainingBalance.toFixed(2)}
                </span>
                <span className="text-[10px] block font-medium mt-0.5 text-secondary">
                  {remainingBalance === 0
                    ? "Fully Settled"
                    : paymentDeadline === "72_hours_before"
                    ? "Due 72 Hours Before Event"
                    : "Due At Event Time (Day-of)"}
                </span>
              </div>
            </div>
            {remainingBalance > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Payment Deadline:</span>{" "}
                  {paymentDeadline === "72_hours_before"
                    ? "The customer must pay the remaining balance at least 72 hours before the event. They can pay from their profile dashboard."
                    : "The customer can pay the remaining balance anytime until the start of the event. They can pay from their profile dashboard."}
                  <span className="block mt-1 text-[10px] text-amber-700">
                    The admin can also manually mark the booking as fully paid from the All Bookings panel.
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-4 border-t border-outline-variant/15">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setCurrentStep(3)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-outline-variant/30 text-xs font-bold uppercase tracking-wider text-secondary hover:bg-surface-container disabled:opacity-50"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleCreateVenueBooking}
              className="flex items-center gap-2 px-8 py-3 rounded-full bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-emerald-500 transition-all shadow-lg disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Locking Venue & Registering Booking...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Venue Booking & Lock Slot</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────── */}
      {/* STEP 5: SUCCESS CONFIRMATION                              */}
      {/* ───────────────────────────────────────────────────────── */}
      {currentStep === 5 && createdBooking && (
        <div className="bg-surface-container-lowest border border-emerald-500/30 rounded-2xl p-8 md:p-12 space-y-8 text-center shadow-lg animate-fadeIn">
          <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" strokeWidth={2.5} />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-600">
              Venue Reserved & Time Slot Locked
            </span>
            <h2 className="text-3xl font-headline font-serif text-on-surface">
              Venue Booking Placed Successfully!
            </h2>
            <p className="text-xs text-secondary leading-relaxed">
              The exclusive venue buyout on <strong>{bookingDate}</strong> from <strong>{formatTime12h(createdBooking.bookingTime)}</strong> to <strong>{formatTime12h(getEndTime(createdBooking.bookingTime, createdBooking.durationHours || durationHours))}</strong> has been confirmed and locked in the database.
              {accountCreatedFlag
                ? " The customer account has been registered with phone number without OTP."
                : " The booking is linked to the existing member account."}
            </p>
          </div>

          {/* Receipt Summary Card */}
          <div className="max-w-md mx-auto p-5 rounded-2xl bg-surface border border-outline-variant/30 text-left text-xs space-y-3">
            <div className="flex justify-between items-center border-b border-outline-variant/15 pb-2">
              <span className="text-secondary">Booking Reference:</span>
              <span className="font-mono font-bold">{createdBooking._id}</span>
            </div>
            <div className="flex justify-between items-center border-b border-outline-variant/15 pb-2">
              <span className="text-secondary">Host:</span>
              <span className="font-semibold">{createdBooking.customerName} ({createdBooking.customerPhone})</span>
            </div>
            <div className="flex justify-between items-center border-b border-outline-variant/15 pb-2">
              <span className="text-secondary">Event Date & Time:</span>
              <span className="font-semibold">{bookingDate} &bull; {formatTime12h(createdBooking.bookingTime)} - {formatTime12h(getEndTime(createdBooking.bookingTime, createdBooking.durationHours || durationHours))}</span>
            </div>
            <div className="flex justify-between items-center border-b border-outline-variant/15 pb-2">
              <span className="text-secondary">Total Contract Price:</span>
              <span className="font-bold">${createdBooking.totalAmount?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center border-b border-outline-variant/15 pb-2">
              <span className="text-secondary">Deposit Paid ({createdBooking.paymentMethod}):</span>
              <span className="font-bold text-emerald-600">${createdBooking.depositAmount?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-secondary font-bold">Remaining Balance Due:</span>
              <span className={cn("font-bold text-sm", (createdBooking.remainingAmount || 0) === 0 ? "text-emerald-700" : "text-amber-700")}>
                ${createdBooking.remainingAmount?.toFixed(2) || "0.00"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-outline-variant/30 text-xs font-bold uppercase tracking-wider text-secondary hover:bg-surface-container transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print Receipt</span>
            </button>
            <Link
              href="/admin/bookings"
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-surface-container-high text-on-surface font-bold text-xs uppercase tracking-wider hover:bg-surface-container-highest transition-all"
            >
              <span>View in All Bookings</span>
            </Link>
            <button
              onClick={resetForm}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-emerald-500 transition-all shadow-md"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Book Another Venue Event</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
