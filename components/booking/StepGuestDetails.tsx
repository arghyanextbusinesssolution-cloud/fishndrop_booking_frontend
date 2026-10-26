"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Loader2,
  ArrowRight,
  Smartphone,
  ChevronDown,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import { PhoneVerificationModal } from "@/components/auth/PhoneVerificationModal";

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
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(8, "Invalid phone number"),
  password: z.string().optional(),
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
  const [mounted, setMounted] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(Boolean(user?.isPhoneVerified));

  // Phone OTP tab inline state
  const [otpStep, setOtpStep] = useState<"phone" | "code">("phone");
  const [inlineOtpCode, setInlineOtpCode] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpSentMessage, setOtpSentMessage] = useState<string | null>(null);

  const existingPhone = initialData?.phone || user?.phone || "";
  const initialParsed = parsePhoneNumber(existingPhone);

  const [countryCode, setCountryCode] = useState(initialParsed.code);
  const [phoneNumber, setPhoneNumber] = useState(initialParsed.number);
  const [showPassword, setShowPassword] = useState(false);

  const rawDigits = phoneNumber.replace(/\D/g, "");
  const fullPhone = rawDigits
    ? `${countryCode}${rawDigits}`
    : (existingPhone.startsWith("+") ? existingPhone : (existingPhone ? `${countryCode}${existingPhone.replace(/\D/g, "")}` : ""));

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(guestSchema),
    defaultValues: {
      name: initialData?.name || user?.name || "",
      email: initialData?.email || user?.email || "",
      phone: fullPhone || existingPhone,
      password: "",
      agreedToTerms: true
    }
  });

  useEffect(() => {
    setMounted(true);
    const phoneToSync = initialData?.phone || user?.phone;
    if (phoneToSync) {
      const parsed = parsePhoneNumber(phoneToSync);
      setCountryCode(parsed.code);
      setPhoneNumber(parsed.number);
      const computedFull = parsed.number.replace(/\D/g, "")
        ? `${parsed.code}${parsed.number.replace(/\D/g, "")}`
        : phoneToSync;
      setValue("phone", computedFull);
    }
    const initialName = initialData?.name || user?.name || "";
    if (initialName && initialName !== "Guest User") {
      setValue("name", initialName);
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

  // Inline Send OTP handler for Phone OTP Tab
  const handleSendInlineOTP = async () => {
    const activeFullPhone = fullPhone || getValues("phone");
    if (!activeFullPhone || activeFullPhone.replace(/\D/g, "").length < 7) {
      toast.error("Please enter a valid mobile phone number");
      return;
    }
    setSendingOtp(true);
    try {
      const res = await api.post("/auth/send-otp", {
        phone: activeFullPhone,
        name: getValues("name"),
        email: getValues("email")
      });
      setOtpSentMessage(res.data.message || `4-digit code sent to ${activeFullPhone}`);
      toast.success(`Verification SMS sent to ${activeFullPhone}`);
      setOtpStep("code");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to send SMS OTP code");
    } finally {
      setSendingOtp(false);
    }
  };

  // Inline Verify OTP handler for Phone OTP Tab
  const handleVerifyInlineOTP = async () => {
    const cleanCode = inlineOtpCode.trim();
    if (!cleanCode || cleanCode.length !== 4) {
      toast.error("Please enter the 4-digit verification code");
      return;
    }
    const activeFullPhone = fullPhone || getValues("phone");
    setVerifyingOtp(true);
    try {
      const { data } = await api.post("/auth/verify-otp", {
        phone: activeFullPhone,
        otp: cleanCode,
        name: getValues("name"),
        email: getValues("email")
      });
      if (data.token && data.user) {
        useAuthStore.getState().setAuth(data.user, data.token);
        if (data.user.name && data.user.name !== "Guest User") {
          setValue("name", data.user.name);
        }
        if (data.user.email) setValue("email", data.user.email);
      }
      setIsPhoneVerified(true);
      toast.success("Phone verified! Please enter your name and email to proceed.");
      setOtpStep("phone");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Invalid 4-digit verification code");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const onSubmitForm = (data: any) => {
    const activeFullPhone = fullPhone || data.phone || user?.phone || initialData?.phone;
    if (!activeFullPhone || activeFullPhone.replace(/\D/g, "").length < 7) {
      toast.error("Please enter a valid phone number");
      return;
    }
    if (!isPhoneVerified && !user?.isPhoneVerified) {
      toast.error("Please verify your phone number with the 4-digit SMS code before continuing");
      return;
    }
    if (!data.name || !data.name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!data.email || !data.email.trim()) {
      toast.error("Please enter your email address");
      return;
    }
    onNext({
      guestDetails: {
        ...data,
        name: data.name?.trim() || user?.name || "Guest User",
        email: data.email?.trim() || user?.email || "",
        phone: activeFullPhone,
      }
    });
  };

  const onInvalid = (formErrors: any) => {
    if (formErrors.name) {
      toast.error(formErrors.name.message || "Please enter your name");
    } else if (formErrors.email) {
      toast.error(formErrors.email.message || "Please enter a valid email address");
    } else if (formErrors.phone) {
      toast.error("Please enter a valid phone number");
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
      {/* Left Column */}
      <div className="lg:col-span-5 space-y-4 lg:space-y-8">
        <header className="space-y-2 lg:space-y-4">
          <span className="font-label text-[10px] tracking-widest text-[#C8A96A] uppercase font-bold">
            Guest Details &amp; Verification
          </span>
          <h1 className="font-headline text-3xl md:text-5xl lg:text-6xl text-white leading-tight tracking-tight">
            Guest <span className="font-headline italic text-[#C8A96A]">Details</span>
          </h1>
        </header>
        <p className="hidden md:block text-white/80 font-body text-base lg:text-lg leading-relaxed max-w-sm font-light">
          Enter your mobile number to receive a 4-digit SMS verification code to begin your reservation.
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
                Instant Reservation
              </p>
              <p className="font-headline italic text-white text-xl">
                SMS Phone Verification
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Main Form */}
      <div className="lg:col-span-7 bg-[#0b1410] p-4 sm:p-6 md:p-8 lg:p-10 rounded-2xl sm:rounded-3xl border border-[#C8A96A]/30 relative overflow-hidden shadow-2xl backdrop-blur-md">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#C8A96A] to-transparent" />
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#C8A96A]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Logged in User Badge Indicator */}
        {user && (
          <div className="mb-6 p-3.5 bg-[#C8A96A]/10 border border-[#C8A96A]/30 rounded-xl flex items-center justify-between text-xs text-[#E8CB8A]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Logged in as <strong className="text-white">{user.name || "Guest User"}</strong> ({user.phone || user.email})
              </span>
            </div>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
              Verified
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmitForm, onInvalid)} className="space-y-6 animate-in fade-in duration-300">
          <div className="space-y-4">
            {/* Phone Number Input Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 font-label text-[11px] uppercase tracking-[0.15em] text-[#C8A96A] font-bold">
                  <Smartphone className="w-3.5 h-3.5 text-[#C8A96A]" />
                  Phone Number
                </label>
                <span className="text-[10px] text-[#C8A96A]/80 tracking-wide">
                  Step 1: SMS 4-Digit Verification
                </span>
              </div>
              <div className="group relative rounded-xl bg-black/60 border border-white/15 focus-within:border-[#C8A96A] focus-within:ring-2 focus-within:ring-[#C8A96A]/20 transition-all flex items-center p-1.5 shadow-inner">
                <div className="relative flex items-center flex-shrink-0">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    disabled={isPhoneVerified || user?.isPhoneVerified}
                    className="appearance-none bg-transparent pl-2 pr-6 py-2 text-xs sm:text-sm font-semibold text-[#E8CB8A] focus:outline-none cursor-pointer disabled:opacity-60"
                  >
                    {COUNTRY_CODES.map((item, i) => (
                      <option key={i} value={item.code} className="bg-[#0c1612] text-white py-2">
                        {item.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3 h-3 text-[#C8A96A] absolute right-1 pointer-events-none opacity-80" />
                </div>
                <div className="h-5 w-px bg-[#C8A96A]/30 mx-1 flex-shrink-0" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(formatUSPhoneNumber(e.target.value))}
                  disabled={isPhoneVerified || user?.isPhoneVerified}
                  placeholder="(513) 940-5811"
                  className="flex-1 min-w-0 bg-transparent px-2 py-2 text-base font-mono font-bold text-white tracking-wide placeholder:text-white/25 focus:outline-none disabled:opacity-60"
                />
              </div>
            </div>

            {/* Phone OTP Verification Section */}
            <div className="pt-1">
              {isPhoneVerified || user?.isPhoneVerified ? (
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs text-emerald-300 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Phone verified via SMS ({fullPhone || user?.phone})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPhoneVerified(false);
                      setOtpStep("phone");
                    }}
                    className="text-[10px] text-[#C8A96A] hover:underline uppercase tracking-wider font-bold"
                  >
                    Change
                  </button>
                </div>
              ) : otpStep === "phone" ? (
                <div className="p-4 bg-[#C8A96A]/10 border border-[#C8A96A]/30 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-[#E8CB8A]">
                      <Smartphone className="w-4 h-4 text-[#C8A96A]" />
                      <span className="font-semibold">SMS Phone Verification</span>
                    </div>
                    <span className="text-[10px] text-white/50">4-digit code</span>
                  </div>
                  <p className="text-xs text-white/70 font-light leading-relaxed">
                    We will send a 4-digit verification code to your phone number via SMS to confirm your reservation.
                  </p>
                  <button
                    type="button"
                    onClick={handleSendInlineOTP}
                    disabled={sendingOtp || !phoneNumber}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#C8A96A] via-[#E0C68E] to-[#C8A96A] text-[#0a120e] font-black text-xs uppercase tracking-[0.15em] flex items-center justify-center gap-2 hover:opacity-95 shadow-md shadow-[#C8A96A]/20 transition-all disabled:opacity-50"
                  >
                    {sendingOtp ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending 4-Digit Code...</span>
                      </>
                    ) : (
                      <>
                        <span>Send 4-Digit Code via SMS</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-[#C8A96A]/10 border border-[#C8A96A]/40 rounded-xl space-y-3.5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-[#E8CB8A]">
                      Enter 4-digit code sent to <strong className="text-white">{fullPhone}</strong>:
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setOtpStep("phone");
                        setInlineOtpCode("");
                      }}
                      className="text-[10px] text-white/60 hover:text-white underline"
                    >
                      Change Phone
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={4}
                      value={inlineOtpCode}
                      onChange={(e) => setInlineOtpCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      placeholder="1234"
                      className="w-full text-center bg-black/70 border border-[#C8A96A]/60 focus:border-[#C8A96A] focus:ring-2 focus:ring-[#C8A96A]/30 rounded-xl px-4 py-2.5 font-mono text-2xl font-black text-white tracking-[0.5em] placeholder:tracking-normal placeholder:text-white/20 outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyInlineOTP}
                      disabled={verifyingOtp || inlineOtpCode.length !== 4}
                      className="px-6 rounded-xl bg-gradient-to-r from-[#C8A96A] via-[#E0C68E] to-[#C8A96A] text-[#0a120e] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-95 shadow-md disabled:opacity-50 shrink-0"
                    >
                      {verifyingOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      <span>Verify</span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-white/50 pt-1">
                    <span>Didn't receive the SMS?</span>
                    <button
                      type="button"
                      onClick={handleSendInlineOTP}
                      disabled={sendingOtp}
                      className="text-[#C8A96A] hover:underline font-semibold"
                    >
                      {sendingOtp ? "Resending..." : "Resend Code"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Stage 2 Details: Name & Email - STRICTLY ONLY REVEALED ONCE PHONE IS VERIFIED */}
            {(isPhoneVerified || user?.isPhoneVerified) && (
              <div className="space-y-4 pt-3 border-t border-white/10 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <span className="font-label text-[11px] uppercase tracking-[0.15em] text-[#C8A96A] font-bold">
                    Step 2: Guest Information
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Phone Verified
                  </span>
                </div>

                {/* Guest Name */}
                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 font-label text-[11px] uppercase tracking-[0.15em] text-[#C8A96A] font-bold">
                    <User className="w-3.5 h-3.5 text-[#C8A96A]" />
                    Full Name
                  </label>
                  <input
                    {...register("name")}
                    placeholder="e.g. Eleanor Vance"
                    className="w-full bg-black/60 border border-white/15 hover:border-[#C8A96A]/40 focus:border-[#C8A96A] focus:ring-2 focus:ring-[#C8A96A]/20 rounded-xl px-4 py-3.5 text-base font-body text-white placeholder:text-white/25 transition-all outline-none"
                  />
                  {errors.name && (
                    <p className="text-[11px] tracking-wide text-rose-400 font-medium">
                      {errors.name.message as string}
                    </p>
                  )}
                </div>

                {/* Email Address */}
                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 font-label text-[11px] uppercase tracking-[0.15em] text-[#C8A96A] font-bold">
                    <Mail className="w-3.5 h-3.5 text-[#C8A96A]" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    {...register("email")}
                    placeholder="e.g. eleanor@example.com"
                    className="w-full bg-black/60 border border-white/15 hover:border-[#C8A96A]/40 focus:border-[#C8A96A] focus:ring-2 focus:ring-[#C8A96A]/20 rounded-xl px-4 py-3.5 text-base font-body text-white placeholder:text-white/25 transition-all outline-none"
                  />
                  {errors.email && (
                    <p className="text-[11px] tracking-wide text-rose-400 font-medium">
                      {errors.email.message as string}
                    </p>
                  )}
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
                      and consent to receiving table confirmation SMS &amp; Email updates.
                    </span>
                  </label>
                  {errors.agreedToTerms && (
                    <p className="text-[11px] tracking-wide text-rose-400 font-medium mt-1">
                      {errors.agreedToTerms.message as string}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full relative group overflow-hidden font-black text-xs tracking-[0.2em] uppercase px-8 py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 bg-gradient-to-r from-[#C8A96A] via-[#E0C68E] to-[#C8A96A] text-[#0a120e] shadow-xl shadow-[#C8A96A]/20 hover:shadow-2xl hover:shadow-[#C8A96A]/35 hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <span>Continue to Next Step</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
      </div>
    );
  };
