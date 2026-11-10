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
  User,
  Mail
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
  onNext: (data: { phone: string; name?: string; email?: string }) => void;
  initialPhone?: string;
  initialName?: string;
  initialEmail?: string;
}

export const StepPhoneVerification = ({
  onNext,
  initialPhone = "",
  initialName = "",
  initialEmail = "",
}: StepPhoneVerificationProps) => {
  const { user } = useAuthStore();
  const { sendOTP, verifyOTP, loading } = useAuth();

  const [selectedCountryId, setSelectedCountryId] = useState<string>("US");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [step, setStep] = useState<"phone" | "otp" | "name">("phone");
  const [hostName, setHostName] = useState(initialName || user?.name || "");
  const [hostEmail, setHostEmail] = useState(initialEmail || user?.email || "");  const [resendCooldown, setResendCooldown] = useState(0);
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
    if (user?.name && !hostName) setHostName(user.name);
    if (user?.email && !hostEmail) setHostEmail(user.email);
  }, [initialPhone, user]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const cleanDigits = (() => {
    let d = phoneNumber.replace(/\D/g, "");
    const codeDigits = selectedCountry.code.replace(/\D/g, "");
    // If user typed/pasted with country code, strip it so it is not doubled
    if (d.startsWith(codeDigits) && d.length > 10) {
      d = d.slice(codeDigits.length);
    }
    if (d.startsWith("0")) {
      d = d.slice(1);
    }
    return d;
  })();

  const rawDigits = cleanDigits;
  const fullPhone = cleanDigits ? `${selectedCountry.code}${cleanDigits}` : "";

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
      // Proceed to take host name & email
      setStep("name");
    } catch (err: any) {
      setErrMessage(err.message || "Invalid or expired code. (Dev test code: 1234)");
    }
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostName.trim()) {
      setErrMessage("Please enter your full name.");
      return;
    }
    onNext({
      phone: fullPhone || user?.phone || "",
      name: hostName.trim(),
      email: hostEmail.trim() || undefined,
    });
  };

  const handleProceedAlreadyVerified = () => {
    if (hostName.trim()) {
      onNext({
        phone: fullPhone || user?.phone || "",
        name: hostName.trim(),
        email: hostEmail.trim() || undefined,
      });
    } else {
      setStep("name");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-2xl mx-auto">
      {/* Header */}
      <header className="space-y-3 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-4">
          <span className="font-headline italic text-[#C8A96A] text-base">03.</span>
          <div className="h-[1px] w-8 bg-white/20"></div>
          <span className="font-label uppercase tracking-widest text-[10px] text-white/50 font-bold">
            Step 03 &bull; Booker Identity &amp; Verification
          </span>
        </div>
        <h2 className="font-headline italic text-4xl md:text-5xl text-white leading-tight">
          Verify Your <span className="text-gold-gradient">Reservation</span>
        </h2>
        <p className="text-white/60 font-body text-base md:text-lg font-light">
          Verify your mobile phone and provide host details so we can send your private booking pass and guest invitation link.
        </p>
      </header>

      {/* Main Glass Form Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border-white/10 bg-white/[0.03] shadow-2xl relative overflow-hidden">
        {/* State A: User is already verified */}
        {isSuccessVerified && step !== "name" && (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#C8A96A] font-label">
                Verified Booker Phone
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
                onClick={() => setStep("name")}
                className="w-full sm:w-1/2 py-3.5 rounded-xl bg-gradient-to-r from-[#C8A96A] via-[#E8CB8A] to-[#C8A96A] text-[#0d1612] font-black font-label uppercase tracking-widest text-xs transition-all shadow-xl shadow-[#C8A96A]/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                Continue to Host Name <ArrowRight className="w-4 h-4" />
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
                You will receive a 4-digit SMS verification code to secure this reservation.
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
              className="w-full py-4 rounded-xl bg-gradient-to-r from-[#C8A96A] via-[#E8CB8A] to-[#C8A96A] text-[#0d1612] font-black font-label text-xs uppercase tracking-[0.2em] shadow-xl shadow-[#C8A96A]/30 hover:scale-[1.02] active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Sending Code...
                </>
              ) : (
                <>
                  Send Verification Code <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* State C: Step 2 - Enter OTP Code */}
        {!isSuccessVerified && step === "otp" && (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="space-y-2 text-center sm:text-left">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#C8A96A] font-label">
                Security Check
              </span>
              <h3 className="font-headline text-2xl text-white">Enter 4-Digit SMS Code</h3>
              <p className="text-xs text-white/60">
                We sent a 4-digit code to <strong className="text-white font-mono">{fullPhone}</strong>
              </p>
            </div>

            <div className="py-2">
              <input
                type="text"
                maxLength={4}
                autoFocus
                placeholder="••••"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                className="w-full text-center text-4xl sm:text-5xl font-mono tracking-[0.5em] bg-white/[0.05] border border-white/20 rounded-2xl py-4 text-white focus:outline-none focus:border-[#C8A96A] focus:ring-2 focus:ring-[#C8A96A]/30"
              />
            </div>

            {errMessage && (
              <div className="p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 flex items-center gap-2 text-xs text-red-200">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || otpCode.length !== 4}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-[#C8A96A] via-[#E8CB8A] to-[#C8A96A] text-[#0d1612] font-black font-label text-xs uppercase tracking-[0.2em] shadow-xl shadow-[#C8A96A]/30 hover:scale-[1.02] active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
                </>
              ) : (
                <>
                  Verify Code <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-xs text-white/50 pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={() => setStep("phone")}
                className="hover:text-white transition-colors underline cursor-pointer"
              >
                Change Phone Number
              </button>
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={resendCooldown > 0}
                className="text-[#C8A96A] hover:underline disabled:opacity-40 disabled:no-underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
              </button>
            </div>
          </form>
        )}

        {/* State D: Step 3 - Host Name & Email Taken After OTP */}
        {step === "name" && (
          <form onSubmit={handleNameSubmit} className="space-y-6 animate-fade-in">
            <div className="space-y-1.5 text-center sm:text-left">
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 font-label">
                  Phone Verified: {fullPhone || user?.phone}
                </span>
              </div>
              <h3 className="font-headline text-2xl sm:text-3xl text-white">Who Is Hosting This Party?</h3>
              <p className="text-xs text-white/60">
                Please provide your name and email so we can send your host itinerary, guest invitation link, and QR pass.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-white/80 font-bold mb-1.5 font-label flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-[#C8A96A]" />
                  Host Full Name *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  placeholder="e.g. Maria Gonzalez"
                  className="w-full bg-white/[0.05] border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/30 text-base focus:outline-none focus:border-[#C8A96A] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-white/80 font-bold mb-1.5 font-label flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-[#C8A96A]" />
                  Email Address (For Confirmation &amp; Passes)
                </label>
                <input
                  type="email"
                  value={hostEmail}
                  onChange={(e) => setHostEmail(e.target.value)}
                  placeholder="e.g. maria@example.com"
                  className="w-full bg-white/[0.05] border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/30 text-base focus:outline-none focus:border-[#C8A96A] transition-all"
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
              disabled={!hostName.trim()}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-[#C8A96A] via-[#E8CB8A] to-[#C8A96A] text-[#0d1612] font-black font-label text-xs uppercase tracking-[0.2em] shadow-xl shadow-[#C8A96A]/30 hover:scale-[1.02] active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Continue to Party Occasion</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
