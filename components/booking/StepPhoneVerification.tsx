"use client";

import { useState, useEffect } from "react";
import {
  Smartphone,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

const COUNTRY_OPTIONS = [
  { id: "US", code: "+1", flag: "🇺🇸", label: "US (+1)", name: "United States" },
  { id: "CA", code: "+1", flag: "🇨🇦", label: "CA (+1)", name: "Canada" },
  { id: "UK", code: "+44", flag: "🇬🇧", label: "UK (+44)", name: "United Kingdom" },
  { id: "IN", code: "+91", flag: "🇮🇳", label: "IN (+91)", name: "India" },
  { id: "AU", code: "+61", flag: "🇦🇺", label: "AU (+61)", name: "Australia" },
  { id: "MX", code: "+52", flag: "🇲🇽", label: "MX (+52)", name: "Mexico" },
  { id: "DE", code: "+49", flag: "🇩🇪", label: "DE (+49)", name: "Germany" },
  { id: "FR", code: "+33", flag: "🇫🇷", label: "FR (+33)", name: "France" },
  { id: "AE", code: "+971", flag: "🇦🇪", label: "UAE (+971)", name: "United Arab Emirates" }
];

const formatNorthAmericanNumber = (value: string): string => {
  if (!value) return "";
  const cleaned = value.replace(/\D/g, "");
  const match = cleaned.length === 11 && cleaned.startsWith("1") ? cleaned.slice(1) : cleaned.slice(0, 10);
  const len = match.length;
  if (len === 0) return "";
  if (len < 4) return `(${match}`;
  if (len < 7) return `(${match.slice(0, 3)}) ${match.slice(3)}`;
  return `(${match.slice(0, 3)}) ${match.slice(3, 6)}-${match.slice(6)}`;
};

interface StepPhoneVerificationProps {
  onNext: (data: { phone: string }) => void;
  initialPhone?: string;
}

export const StepPhoneVerification = ({ onNext, initialPhone = "" }: StepPhoneVerificationProps) => {
  const { user } = useAuthStore();
  const { sendOTP, verifyOTP, loading } = useAuth();

  const [selectedCountryId, setSelectedCountryId] = useState<string>("US");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [errMessage, setErrMessage] = useState<string | null>(null);
  const [isSuccessVerified, setIsSuccessVerified] = useState(false);

  const selectedCountry = COUNTRY_OPTIONS.find((c) => c.id === selectedCountryId) || COUNTRY_OPTIONS[0];

  // Initialize from user or initialPhone
  useEffect(() => {
    const raw = initialPhone || user?.phone || "";
    if (raw) {
      const clean = raw.replace(/[^\d+]/g, "");
      if (clean.startsWith("+")) {
        const found = COUNTRY_OPTIONS.find((c) => clean.startsWith(c.code));
        if (found) {
          setSelectedCountryId(found.id);
          const rawNum = clean.slice(found.code.length);
          setPhoneNumber(found.code === "+1" ? formatNorthAmericanNumber(rawNum) : rawNum);
        } else {
          setPhoneNumber(formatNorthAmericanNumber(clean));
        }
      } else {
        setPhoneNumber(formatNorthAmericanNumber(clean));
      }

      if (user?.isPhoneVerified && user?.phone) {
        setIsSuccessVerified(true);
      }
    }
  }, [initialPhone, user]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const rawDigits = phoneNumber.replace(/\D/g, "");
  const fullPhone = rawDigits ? `${selectedCountry.code}${rawDigits}` : "";

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrMessage(null);

    if (rawDigits.length < 7) {
      setErrMessage("Please enter a valid phone number.");
      return;
    }

    try {
      await sendOTP(fullPhone);
      setStep("otp");
      setResendCooldown(30);
      toast.success(`Verification code sent to ${fullPhone}`);
    } catch (err: any) {
      setErrMessage(err.message || "Failed to send SMS code. Please try again.");
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrMessage(null);

    const cleanCode = otpCode.trim();
    if (cleanCode.length !== 4) {
      setErrMessage("Please enter the 4-digit code sent to your phone.");
      return;
    }

    try {
      await verifyOTP(fullPhone, cleanCode);
      setIsSuccessVerified(true);
      toast.success("Phone verified successfully!");
      setTimeout(() => {
        onNext({ phone: fullPhone });
      }, 350);
    } catch (err: any) {
      setErrMessage(err.message || "Invalid or expired code. (Dev test code: 1234)");
    }
  };

  const handleProceedAlreadyVerified = () => {
    onNext({ phone: fullPhone || user?.phone || "" });
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-2xl mx-auto">
      {/* Header */}
      <header className="space-y-3 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-4">
          <span className="font-headline italic text-[#C8A96A] text-base">03.</span>
          <div className="h-[1px] w-8 bg-white/20"></div>
          <span className="font-label uppercase tracking-widest text-[10px] text-white/50 font-bold">
            Step 03 &bull; Phone Verification
          </span>
        </div>
        <h2 className="font-headline italic text-4xl md:text-5xl text-white leading-tight">
          Verify Your <span className="text-gold-gradient">Phone Number</span>
        </h2>
        <p className="text-white/60 font-body text-base md:text-lg font-light">
          We use direct SMS instant verification to secure your reservation. No passwords or long forms required.
        </p>
      </header>

      {/* Main Verification Card */}
      <div className="bg-[#121614] rounded-3xl p-6 sm:p-8 md:p-10 border border-[#C8A96A]/25 shadow-[0_15px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#C8A96A]/50 to-transparent" />

        {/* State A: User is already verified */}
        {isSuccessVerified && (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 rounded-full bg-[#C8A96A]/20 border border-[#C8A96A]/50 text-[#C8A96A] flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(200,169,106,0.3)]">
              <CheckCircle2 className="w-8 h-8 text-[#C8A96A]" />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#C8A96A] font-label">
                Verified Customer
              </span>
              <h3 className="font-headline text-2xl text-white">Phone Confirmed</h3>
              <p className="text-white/70 font-mono text-lg font-bold">
                {fullPhone || user?.phone}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsSuccessVerified(false);
                  setStep("phone");
                }}
                className="w-full sm:w-1/2 py-3 rounded-xl border border-white/15 bg-white/5 text-white/70 hover:text-white hover:bg-white/10 font-label uppercase tracking-widest text-xs font-bold transition-all"
              >
                Change Number
              </button>
              <button
                type="button"
                onClick={handleProceedAlreadyVerified}
                className="w-full sm:w-1/2 py-3.5 rounded-xl bg-[#C8A96A] text-[#0d1612] hover:bg-[#d8b97a] font-label uppercase tracking-widest text-xs font-bold transition-all shadow-[0_0_20px_rgba(200,169,106,0.3)] flex items-center justify-center gap-2"
              >
                Continue to Add-ons <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* State B: Step 1 - Enter Phone Number */}
        {!isSuccessVerified && step === "phone" && (
          <form onSubmit={handleSendOtp} className="space-y-6">
            <div className="space-y-2">
              <label className="font-label text-xs uppercase tracking-widest text-white/80 font-bold flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#C8A96A]" />
                Mobile Phone Number
              </label>
              <p className="text-[11px] text-white/50">
                You will receive a 4-digit SMS verification code to verify this booking.
              </p>

              <div className="flex items-center rounded-2xl border border-white/15 bg-white/[0.04] p-1.5 focus-within:border-[#C8A96A] focus-within:ring-2 focus-within:ring-[#C8A96A]/20 transition-all">
                {/* Country Code Selector */}
                <div className="relative border-r border-white/10 pr-2 pl-3">
                  <select
                    value={selectedCountryId}
                    onChange={(e) => setSelectedCountryId(e.target.value)}
                    className="bg-transparent text-sm font-semibold text-white/90 outline-none cursor-pointer pr-4 appearance-none font-mono"
                  >
                    {COUNTRY_OPTIONS.map((c) => (
                      <option key={c.id} value={c.id} className="bg-[#121614] text-white">
                        {c.flag} {c.code}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Phone Input */}
                <input
                  type="tel"
                  placeholder="(555) 000-0000"
                  value={phoneNumber}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPhoneNumber(selectedCountry.code === "+1" ? formatNorthAmericanNumber(val) : val);
                  }}
                  autoFocus
                  className="w-full bg-transparent px-4 py-3 text-white placeholder-white/30 text-lg sm:text-xl font-mono tracking-wider outline-none"
                />
              </div>
            </div>

            {errMessage && (
              <div className="p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 flex items-center gap-2 text-xs text-red-200">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || rawDigits.length < 7}
              className={cn(
                "w-full py-4 rounded-xl font-label uppercase tracking-widest text-xs font-bold transition-all duration-300 shadow-xl flex items-center justify-center gap-2",
                rawDigits.length >= 7 && !loading
                  ? "bg-[#C8A96A] text-[#0d1612] hover:bg-[#d8b97a] shadow-[0_0_20px_rgba(200,169,106,0.3)] hover:shadow-[0_0_30px_rgba(200,169,106,0.5)] transform hover:-translate-y-0.5 cursor-pointer"
                  : "bg-white/5 text-white/20 cursor-not-allowed border border-white/5"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Sending SMS Code...
                </>
              ) : (
                <>
                  Send Verification Code <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* State C: Step 2 - Enter 4-digit Code */}
        {!isSuccessVerified && step === "otp" && (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="space-y-2 text-center">
              <div className="w-12 h-12 rounded-full bg-[#C8A96A]/10 border border-[#C8A96A]/30 text-[#C8A96A] flex items-center justify-center mx-auto mb-2">
                <ShieldCheck className="w-6 h-6 text-[#C8A96A]" />
              </div>
              <label className="font-label text-xs uppercase tracking-widest text-[#C8A96A] font-bold block">
                Enter 4-Digit Code
              </label>
              <p className="text-xs text-white/60">
                Code sent via SMS to <strong className="text-white font-mono">{fullPhone}</strong>
              </p>
            </div>

            <div className="flex justify-center">
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                autoFocus
                placeholder="••••"
                value={otpCode}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, "").slice(0, 4);
                  setOtpCode(cleaned);
                  if (cleaned.length === 4) {
                    setErrMessage(null);
                  }
                }}
                className="w-48 text-center text-4xl sm:text-5xl font-mono font-bold tracking-[0.3em] bg-white/[0.06] border-2 border-[#C8A96A]/40 rounded-2xl py-3 text-[#E3C281] outline-none focus:border-[#C8A96A] focus:ring-4 focus:ring-[#C8A96A]/20 transition-all shadow-inner"
              />
            </div>

            {errMessage && (
              <div className="p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 flex items-center gap-2 text-xs text-red-200">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errMessage}</span>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={loading || otpCode.trim().length !== 4}
                className={cn(
                  "w-full py-4 rounded-xl font-label uppercase tracking-widest text-xs font-bold transition-all duration-300 shadow-xl flex items-center justify-center gap-2",
                  otpCode.trim().length === 4 && !loading
                    ? "bg-[#C8A96A] text-[#0d1612] hover:bg-[#d8b97a] shadow-[0_0_20px_rgba(200,169,106,0.3)] hover:shadow-[0_0_30px_rgba(200,169,106,0.5)] transform hover:-translate-y-0.5 cursor-pointer"
                    : "bg-white/5 text-white/20 cursor-not-allowed border border-white/5"
                )}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
                  </>
                ) : (
                  <>
                    Verify &amp; Continue <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-xs pt-2 px-1">
                <button
                  type="button"
                  onClick={() => {
                    setStep("phone");
                    setOtpCode("");
                    setErrMessage(null);
                  }}
                  className="text-white/50 hover:text-white underline font-label transition-colors"
                >
                  Edit phone number
                </button>

                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading || resendCooldown > 0}
                  className={cn(
                    "font-label flex items-center gap-1.5 transition-colors",
                    resendCooldown > 0 ? "text-white/30 cursor-not-allowed" : "text-[#C8A96A] hover:underline"
                  )}
                >
                  <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} />
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend Code"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Trust reassurance banner */}
      <div className="flex items-center justify-center gap-2 text-center text-xs text-white/40 font-label">
        <Lock className="w-3.5 h-3.5 text-[#C8A96A]" />
        <span>Your information is strictly private. We never send spam or share your number.</span>
      </div>
    </div>
  );
};
