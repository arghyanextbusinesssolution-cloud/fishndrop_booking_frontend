"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";
import {
  Loader2,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Smartphone,
  ChevronDown,
  Edit2,
  Sparkles,
  Lock,
  User,
  Mail
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";

const COUNTRY_CODES = [
  { code: "+1", label: "US (+1)", name: "United States" },
  { code: "+1", label: "CA (+1)", name: "Canada" },
  { code: "+44", label: "UK (+44)", name: "United Kingdom" },
  { code: "+91", label: "IN (+91)", name: "India" },
  { code: "+61", label: "AU (+61)", name: "Australia" },
  { code: "+52", label: "MX (+52)", name: "Mexico" },
  { code: "+49", label: "DE (+49)", name: "Germany" },
  { code: "+33", label: "FR (+33)", name: "France" },
  { code: "+971", label: "UAE (+971)", name: "United Arab Emirates" },
];

const guestSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional().or(z.literal("")),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().min(8, "Invalid phone number"),
  agreedToTerms: z.boolean().refine((val) => val === true, "Must agree to terms")
});

const formatUSPhoneNumber = (value: string): string => {
  if (!value) return "";
  const cleaned = value.replace(/\D/g, "");
  const match = cleaned.length === 11 && cleaned.startsWith("1") ? cleaned.slice(1) : cleaned.slice(0, 10);
  
  const len = match.length;
  if (len === 0) return "";
  if (len < 4) return `(${match}`;
  if (len < 7) return `(${match.slice(0, 3)}) ${match.slice(3)}`;
  return `(${match.slice(0, 3)}) ${match.slice(3, 6)}-${match.slice(6)}`;
};

interface StepGuestDetailsProps {
  onNext: (data: { guestDetails: any }) => void;
  initialData: any;
}

const parsePhoneNumber = (phoneStr: string) => {
  if (!phoneStr) return { code: "+1", number: "" };
  const cleaned = phoneStr.trim();
  for (const c of COUNTRY_CODES) {
    if (cleaned.startsWith(c.code)) {
      const national = cleaned.slice(c.code.length).replace(/\D/g, "");
      return { code: c.code, number: formatUSPhoneNumber(national) };
    }
  }
  const digits = cleaned.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    return { code: "+1", number: formatUSPhoneNumber(digits.slice(1)) };
  }
  return { code: "+1", number: formatUSPhoneNumber(digits) };
};

export const StepGuestDetails = ({ onNext, initialData }: StepGuestDetailsProps) => {
  const { user } = useAuthStore();
  const { sendOTP, verifyOTP } = useAuth();

  const [mounted, setMounted] = useState(false);

  const existingPhone = initialData?.phone || user?.phone || "";
  const initialParsed = parsePhoneNumber(existingPhone);

  const [countryCode, setCountryCode] = useState(initialParsed.code);
  const [phoneNumber, setPhoneNumber] = useState(initialParsed.number);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(Boolean(existingPhone || initialData?.isPhoneVerified));
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const rawDigits = phoneNumber.replace(/\D/g, "");
  const fullPhone = rawDigits
    ? `${countryCode}${rawDigits}`
    : (existingPhone.startsWith("+") ? existingPhone : (existingPhone ? `${countryCode}${existingPhone.replace(/\D/g, "")}` : ""));

  const displayPhone = rawDigits
    ? `${countryCode} ${phoneNumber.startsWith("(") ? phoneNumber : formatUSPhoneNumber(phoneNumber)}`
    : (existingPhone || "");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(guestSchema),
    defaultValues: {
      name: initialData?.name || user?.name || "Guest User",
      email: initialData?.email || user?.email || "",
      phone: fullPhone || existingPhone,
      agreedToTerms: true
    }
  });

  // Countdown timer for resending OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Sync phone & auth state
  useEffect(() => {
    setMounted(true);
    const phoneToSync = initialData?.phone || user?.phone;
    if (phoneToSync) {
      const parsed = parsePhoneNumber(phoneToSync);
      setCountryCode(parsed.code);
      setPhoneNumber(parsed.number);
      setOtpVerified(true);
      const computedFull = parsed.number.replace(/\D/g, "")
        ? `${parsed.code}${parsed.number.replace(/\D/g, "")}`
        : phoneToSync;
      setValue("phone", computedFull);
    }
    if (user?.name || initialData?.name) {
      setValue("name", initialData?.name || user?.name || "Guest User");
    }
    if (user?.email || initialData?.email) {
      setValue("email", initialData?.email || user?.email || "");
    }
  }, [user, initialData, setValue]);

  useEffect(() => {
    if (fullPhone) {
      setValue("phone", fullPhone);
    }
  }, [fullPhone, setValue]);

  const handleSendOTP = async () => {
    if (!rawDigits || rawDigits.length < 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }
    setSendingOtp(true);
    try {
      const res = await sendOTP(fullPhone);
      setOtpSent(true);
      setCountdown(45);
      if (res.devOtp) {
        setDevOtpHint(res.devOtp);
        toast(`Verification OTP Code: ${res.devOtp}`, { icon: "🔑", duration: 8000 });
      }
      toast.success(`SMS verification code sent to ${displayPhone}!`);
      setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
    } catch (err: any) {
      toast.error(err.message || "Failed to send SMS code. Check your phone number.");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleOtpDigitChange = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").slice(0, 6).split("");
      const newDigits = [...otpDigits];
      digits.forEach((d, i) => {
        newDigits[i] = d;
      });
      setOtpDigits(newDigits);
      if (digits.length === 6) {
        triggerVerifyOTP(newDigits.join(""));
      } else if (otpInputRefs.current[digits.length]) {
        otpInputRefs.current[digits.length]?.focus();
      }
      return;
    }

    const newDigits = [...otpDigits];
    newDigits[index] = value;
    setOtpDigits(newDigits);

    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    if (newDigits.every((d) => d !== "")) {
      triggerVerifyOTP(newDigits.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const triggerVerifyOTP = async (code: string) => {
    setVerifyingOtp(true);
    try {
      await verifyOTP(fullPhone, code);
      setOtpVerified(true);
      toast.success("Phone number verified successfully!");
    } catch (err: any) {
      toast.error(err.message || "Invalid OTP code");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const onSubmitForm = (data: any) => {
    const activeFullPhone = fullPhone || data.phone || user?.phone || initialData?.phone;
    if (!otpVerified && !user?.phone) {
      toast.error("Please verify your phone number via SMS to continue");
      return;
    }
    if (!activeFullPhone || activeFullPhone.replace(/\D/g, "").length < 7) {
      toast.error("Please enter a valid phone number");
      return;
    }
    const cleanPhoneDigits = activeFullPhone.replace(/\D/g, "");
    const guestEmail = data.email?.trim() || user?.email || `guest_${cleanPhoneDigits}@tropica.com`;
    onNext({
      guestDetails: {
        ...data,
        name: data.name?.trim() || user?.name || "Guest User",
        email: guestEmail,
        phone: activeFullPhone,
        isPhoneVerified: true
      }
    });
  };

  const onInvalid = (formErrors: any) => {
    console.warn("Guest details form validation errors:", formErrors);
    if (formErrors.email) {
      toast.error(formErrors.email.message || "Please enter a valid email address");
    } else if (formErrors.phone) {
      toast.error("Please provide a valid verified phone number");
    } else if (formErrors.agreedToTerms) {
      toast.error("Please agree to the Terms & Conditions to proceed");
    } else {
      toast.error("Please check the form for errors");
    }
  };

  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="w-10 h-10 text-[#C8A96A] animate-spin" />
        <p className="font-headline text-xl italic text-white/80">Loading guest details...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-16 items-start">
      {/* Left Column - hidden on mobile for space */}
      <div className="lg:col-span-5 space-y-4 lg:space-y-8">
        <header className="space-y-2 lg:space-y-4">
          <span className="font-label text-[10px] tracking-widest text-[#C8A96A] uppercase font-bold">
            Guest Verification
          </span>
          <h1 className="font-headline text-3xl md:text-5xl lg:text-6xl text-white leading-tight tracking-tight">
            Guest <span className="font-headline italic text-[#C8A96A]">Details</span>
          </h1>
        </header>
        <p className="hidden md:block text-white/80 font-body text-base lg:text-lg leading-relaxed max-w-sm font-light">
          Your phone number is your primary reservation key. We use SMS verification for fast, passwordless access to your booking.
        </p>

        <div className="hidden md:block pt-8 border-t border-white/10">
          <div className="flex items-center gap-4 group">
            <div className="w-12 h-12 rounded-full overflow-hidden glass-card border-[#C8A96A]/30 ring-1 ring-[#C8A96A]/30">
              <img
                className="w-full h-full object-cover transition-all duration-700"
                alt="Concierge"
                src="/resturant_img1.png"
              />
            </div>
            <div>
              <p className="font-label text-[10px] uppercase tracking-widest text-[#C8A96A] font-bold">
                SMS Verification
              </p>
              <p className="font-headline italic text-white text-xl">Passwordless Login</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Form & OTP Section */}
      <div className="lg:col-span-7 bg-[#0b1410] p-4 sm:p-6 md:p-8 lg:p-10 rounded-2xl sm:rounded-3xl border border-[#C8A96A]/30 relative overflow-hidden shadow-2xl backdrop-blur-md">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#C8A96A] to-transparent" />
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#C8A96A]/10 rounded-full blur-3xl pointer-events-none" />

        <form onSubmit={handleSubmit(onSubmitForm, onInvalid)} className="space-y-6">
          {/* SECTION: Contact Number Header */}
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <label className="font-headline italic text-xl md:text-2xl text-white flex items-center gap-3">
                <Smartphone className="w-5 h-5 md:w-6 md:h-6 text-[#C8A96A]" />
                Contact Number
              </label>
              {otpVerified && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Verified
                </span>
              )}
            </div>

            {!otpVerified ? (
              <div className="space-y-4">
                {/* Unified Phone Input Card */}
                <div
                  className={cn(
                    "group relative rounded-xl sm:rounded-2xl bg-black/60 border transition-all duration-300 flex items-center p-1.5 sm:p-2 shadow-inner w-full min-w-0 max-w-full overflow-hidden",
                    otpSent
                      ? "border-[#C8A96A]/30 bg-black/40"
                      : "border-[#C8A96A]/40 focus-within:border-[#C8A96A] focus-within:ring-2 focus-within:ring-[#C8A96A]/20"
                  )}
                >
                  {/* Country Code Dropdown */}
                  <div className="relative flex items-center flex-shrink-0">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      disabled={sendingOtp || otpSent}
                      className="appearance-none bg-transparent pl-2 sm:pl-3 pr-5 sm:pr-7 py-2 text-xs sm:text-sm font-semibold text-[#E8CB8A] focus:outline-none cursor-pointer disabled:cursor-not-allowed"
                    >
                      {COUNTRY_CODES.map((item, i) => (
                        <option key={i} value={item.code} className="bg-[#0c1612] text-white py-2">
                          {item.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#C8A96A] absolute right-1 sm:right-2 pointer-events-none opacity-80" />
                  </div>

                  {/* Hairline Divider */}
                  <div className="h-5 sm:h-6 w-px bg-[#C8A96A]/30 mx-1 flex-shrink-0" />

                  {/* Phone Number Input with min-w-0 to prevent flex blowout */}
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(formatUSPhoneNumber(e.target.value))}
                    placeholder="(513) 940-5811"
                    disabled={sendingOtp || otpSent}
                    className="flex-1 min-w-0 w-0 bg-transparent px-1.5 sm:px-3 py-2 text-sm sm:text-base md:text-lg font-mono font-bold text-white tracking-wide placeholder:text-white/25 focus:outline-none disabled:opacity-75"
                  />

                  {/* Inline Change Button if OTP sent — always visible */}
                  {otpSent && (
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setOtpDigits(["", "", "", "", "", ""]);
                      }}
                      className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold text-[#E8CB8A] hover:text-white bg-[#C8A96A]/15 hover:bg-[#C8A96A]/25 border border-[#C8A96A]/35 transition-all whitespace-nowrap active:scale-95 ml-1"
                    >
                      <Edit2 className="w-3 h-3 text-[#C8A96A]" />
                      <span>Change</span>
                    </button>
                  )}
                </div>

                {/* Helper text with phone preview — never breaks at hyphen */}
                <p className="text-xs text-white/60 font-body px-1">
                  {otpSent ? "Verification code sent to " : "We will send a 6-digit SMS verification code to "}
                  <span className="text-[#E8CB8A] font-mono font-bold whitespace-nowrap">
                    {displayPhone || `${countryCode} (513) 940-5811`}
                  </span>
                </p>

                {/* Send OTP Button */}
                {!otpSent && (
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    disabled={sendingOtp || rawDigits.length < 10}
                    className="w-full relative group overflow-hidden bg-gradient-to-r from-[#C8A96A] via-[#E2C88F] to-[#C8A96A] text-[#0a120e] hover:brightness-110 font-black text-xs tracking-[0.2em] uppercase py-4 rounded-xl shadow-lg shadow-[#C8A96A]/15 hover:shadow-xl hover:shadow-[#C8A96A]/25 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:brightness-100 mt-2"
                  >
                    {sendingOtp ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#0a120e]" />
                        <span>Sending SMS Code...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Verification Code</span>
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </button>
                )}

                {/* Modern & Compact In-Page OTP Digit Verification View */}
                {otpSent && (
                  <div className="relative overflow-hidden p-4 sm:p-5 rounded-xl bg-gradient-to-b from-[#13231c]/95 via-[#0b1511]/95 to-black/95 border border-[#C8A96A]/40 shadow-xl backdrop-blur-xl space-y-3.5 animate-in fade-in slide-in-from-top-3 duration-300">
                    <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-[#C8A96A]/60 to-transparent" />

                    {/* Single-line Compact Header */}
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Lock className="w-3.5 h-3.5 text-[#C8A96A] flex-shrink-0" />
                        <span className="font-label text-xs uppercase tracking-wider text-[#C8A96A] font-bold whitespace-nowrap">
                          6-Digit Code
                        </span>
                        <span className="text-white/20 hidden xs:inline">•</span>
                        <span className="text-xs text-white/50 font-mono truncate hidden xs:inline">
                          {displayPhone}
                        </span>
                      </div>

                      {devOtpHint && (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#C8A96A]/15 border border-[#C8A96A]/35 text-[11px] font-mono font-bold text-[#E8CB8A] flex-shrink-0">
                          <Sparkles className="w-3 h-3 text-[#C8A96A] animate-pulse" />
                          <span>Dev: <span className="text-white underline decoration-[#C8A96A] tracking-wider">{devOtpHint}</span></span>
                        </div>
                      )}
                    </div>

                    {/* 6 Digit Input Grid - Compact & Responsive */}
                    <div className="flex justify-center items-center gap-1.5 sm:gap-2.5 py-0.5">
                      {otpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => {
                            otpInputRefs.current[idx] = el;
                          }}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(idx, e)}
                          className={cn(
                            "w-9 h-11 xs:w-10 xs:h-12 sm:w-12 sm:h-13 text-center text-lg sm:text-2xl font-mono font-bold rounded-xl transition-all duration-200 outline-none",
                            digit
                              ? "bg-[#C8A96A]/20 border-2 border-[#C8A96A] text-[#E8CB8A] shadow-[0_0_12px_rgba(200,169,106,0.25)] scale-[1.02]"
                              : "bg-black/60 border border-white/20 text-white hover:border-[#C8A96A]/40 focus:border-[#C8A96A] focus:ring-2 focus:ring-[#C8A96A]/25 focus:bg-black/80"
                          )}
                        />
                      ))}
                    </div>

                    {/* Compact Actions: Verify Button + Resend Timer */}
                    <div className="flex items-center justify-between gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => triggerVerifyOTP(otpDigits.join(""))}
                        disabled={verifyingOtp || otpDigits.some((d) => !d)}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-200 shadow-md disabled:cursor-not-allowed bg-gradient-to-r from-[#C8A96A] to-[#E0C68E] text-[#0a120e] hover:shadow-lg hover:shadow-[#C8A96A]/20 hover:scale-[1.02] active:scale-[0.98] disabled:from-white/10 disabled:to-white/10 disabled:text-white/30 disabled:border disabled:border-white/10 disabled:shadow-none disabled:hover:scale-100"
                      >
                        {verifyingOtp ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-current" />
                            <span>Verifying...</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-3.5 h-3.5 text-current" />
                            <span>Verify Code</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleSendOTP}
                        disabled={countdown > 0 || sendingOtp}
                        className="text-xs text-white/50 hover:text-[#C8A96A] transition-colors flex items-center gap-1.5 disabled:text-white/30 disabled:cursor-not-allowed py-1 whitespace-nowrap"
                      >
                        <RefreshCw className={cn("w-3 h-3 transition-transform group-hover:rotate-180 duration-500", sendingOtp && "animate-spin")} />
                        {countdown > 0 ? (
                          <span>
                            Resend in <span className="font-mono font-bold text-[#C8A96A]">{countdown}s</span>
                          </span>
                        ) : (
                          <span>Resend Code</span>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#0c2217] via-[#081810] to-[#040a07] border border-emerald-500/35 p-3.5 sm:p-4 shadow-lg backdrop-blur-md">
                {/* Ambient glow & top edge highlight */}
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />

                {/* Top Row: Status Chip on Left, Change Button on Right */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span className="text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">SMS Verified</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setOtpVerified(false);
                      setOtpSent(false);
                      setOtpDigits(["", "", "", "", "", ""]);
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-[#E8CB8A] hover:text-white bg-[#C8A96A]/10 hover:bg-[#C8A96A]/20 border border-[#C8A96A]/30 transition-all hover:scale-[1.02] active:scale-95 shadow-sm whitespace-nowrap"
                  >
                    <Edit2 className="w-3 h-3 text-[#C8A96A]" />
                    <span>Change</span>
                  </button>
                </div>

                {/* Middle: Full Phone Number on its own line — never wrapped, never truncated */}
                <div className="font-mono text-base xs:text-lg sm:text-xl font-bold text-white tracking-wider whitespace-nowrap py-0.5">
                  {displayPhone || fullPhone}
                </div>

                {/* Bottom: Subtle security badge */}
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-300/80 font-medium mt-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                  <span className="whitespace-nowrap">Passwordless reservation key active</span>
                </div>
              </div>
            )}
          </div>

          {/* Optional Guest Name & Email Section */}
          <div className="space-y-6 pt-6 border-t border-[#C8A96A]/20">
            <div className="flex items-center justify-between">
              <h3 className="font-headline italic text-lg sm:text-xl text-white">Guest Information</h3>
              <span className="text-[11px] uppercase tracking-wider text-white/40">Optional Details</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 font-label text-[11px] uppercase tracking-[0.15em] text-[#C8A96A] font-bold">
                  <User className="w-3 h-3 text-[#C8A96A]" />
                  Guest Name
                </label>
                <input
                  {...register("name")}
                  placeholder="e.g. Eleanor Vance"
                  className="w-full bg-black/50 border border-white/15 hover:border-[#C8A96A]/40 focus:border-[#C8A96A] focus:ring-2 focus:ring-[#C8A96A]/20 rounded-xl px-4 py-3.5 text-base font-body text-white placeholder:text-white/25 transition-all outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-1.5 font-label text-[11px] uppercase tracking-[0.15em] text-[#C8A96A] font-bold">
                  <Mail className="w-3 h-3 text-[#C8A96A]" />
                  Email Address
                </label>
                <input
                  type="email"
                  {...register("email")}
                  placeholder="e.g. eleanor@sanctuary.com"
                  className="w-full bg-black/50 border border-white/15 hover:border-[#C8A96A]/40 focus:border-[#C8A96A] focus:ring-2 focus:ring-[#C8A96A]/20 rounded-xl px-4 py-3.5 text-base font-body text-white placeholder:text-white/25 transition-all outline-none"
                />
                {errors.email && (
                  <p className="text-[11px] tracking-wide text-rose-400 font-medium">
                    {errors.email.message as string}
                  </p>
                )}
              </div>
            </div>

            {/* Terms & Conditions Checkbox */}
            <div className="pt-2">
              <label className="flex gap-3.5 cursor-pointer items-start select-none group">
                <input
                  type="checkbox"
                  {...register("agreedToTerms")}
                  className="mt-1 h-4 w-4 rounded border-white/30 bg-black/50 text-[#C8A96A] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#C8A96A]"
                />
                <span className="text-xs text-white/70 group-hover:text-white/90 font-body leading-relaxed transition-colors">
                  I agree to the{" "}
                  <a href="/terms" target="_blank" className="text-[#C8A96A] underline hover:text-[#E0C68E] transition-colors">
                    Terms &amp; Conditions
                  </a>{" "}
                  and consent to receiving table confirmation SMS messages.
                </span>
              </label>
              {errors.agreedToTerms && (
                <p className="text-[11px] tracking-wide text-rose-400 font-medium mt-1">
                  {errors.agreedToTerms.message as string}
                </p>
              )}
            </div>

            {/* Continue to Next Step Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={!otpVerified}
                className={cn(
                  "w-full sm:w-auto relative group overflow-hidden font-black text-xs tracking-[0.2em] uppercase px-12 py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-3",
                  otpVerified
                    ? "bg-gradient-to-r from-[#C8A96A] via-[#E0C68E] to-[#C8A96A] text-[#0a120e] shadow-xl shadow-[#C8A96A]/20 hover:shadow-2xl hover:shadow-[#C8A96A]/35 hover:scale-[1.02] active:scale-[0.98]"
                    : "bg-white/10 text-white/30 border border-white/10 cursor-not-allowed opacity-50"
                )}
              >
                <span>Continue to Next Step</span>
                <ArrowRight className={cn("w-4 h-4 transition-transform", otpVerified && "group-hover:translate-x-1")} />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
