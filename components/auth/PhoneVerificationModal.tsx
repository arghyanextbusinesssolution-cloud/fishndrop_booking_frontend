"use client";

import { useState, useEffect } from "react";
import {
  Smartphone,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";

const COUNTRY_CODES = [
  { code: "+1", label: "US (+1)" },
  { code: "+1", label: "CA (+1)" },
  { code: "+44", label: "UK (+44)" },
  { code: "+91", label: "IN (+91)" },
  { code: "+61", label: "AU (+61)" },
  { code: "+52", label: "MX (+52)" },
  { code: "+49", label: "DE (+49)" },
  { code: "+33", label: "FR (+33)" },
  { code: "+971", label: "UAE (+971)" }
];

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

interface PhoneVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPhone?: string;
  onSuccess?: (user: any, token: string) => void;
}

export function PhoneVerificationModal({
  isOpen,
  onClose,
  initialPhone = "",
  onSuccess
}: PhoneVerificationModalProps) {
  const { sendOTP, verifyOTP, loading } = useAuth();

  const [countryCode, setCountryCode] = useState("+1");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [errMessage, setErrMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialPhone) {
      const clean = initialPhone.replace(/[^\d+]/g, "");
      if (clean.startsWith("+")) {
        const found = COUNTRY_CODES.find((c) => clean.startsWith(c.code));
        if (found) {
          setCountryCode(found.code);
          setPhoneNumber(formatUSPhoneNumber(clean.slice(found.code.length)));
        } else {
          setPhoneNumber(formatUSPhoneNumber(clean));
        }
      } else {
        setPhoneNumber(formatUSPhoneNumber(clean));
      }
    }
  }, [initialPhone]);

  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!isOpen) return null;

  const getFullPhone = () => {
    const raw = phoneNumber.replace(/\D/g, "");
    return `${countryCode}${raw}`;
  };

  const handleSendOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrMessage(null);
    const raw = phoneNumber.replace(/\D/g, "");
    if (!raw || raw.length < 7) {
      setErrMessage("Please enter a valid phone number (at least 7 digits)");
      return;
    }

    const fullPhone = getFullPhone();
    try {
      await sendOTP(fullPhone);
      toast.success(`Verification SMS code sent to ${fullPhone}`);
      setStep("otp");
      setResendCooldown(60);
    } catch (err: any) {
      setErrMessage(err.message || "Failed to send verification code");
      toast.error(err.message || "Failed to send SMS code");
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrMessage(null);
    const cleanCode = otpCode.trim();
    if (!cleanCode || cleanCode.length !== 4) {
      setErrMessage("Please enter the 4-digit verification code");
      return;
    }

    const fullPhone = getFullPhone();
    try {
      const data = await verifyOTP(fullPhone, cleanCode);
      toast.success("Phone number verified successfully!");
      if (onSuccess) {
        onSuccess(data.user, data.token);
      }
      onClose();
    } catch (err: any) {
      setErrMessage(err.message || "Invalid or expired verification code");
      toast.error(err.message || "Verification failed");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0c1612] border border-[#C8A96A]/40 rounded-2xl shadow-2xl p-6 sm:p-8 overflow-hidden text-white">
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#C8A96A] to-transparent" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-white/50 hover:text-white rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="flex items-center justify-center w-14 h-14 mx-auto mb-4 rounded-full bg-[#C8A96A]/10 border border-[#C8A96A]/30 text-[#C8A96A]">
          {step === "phone" ? (
            <Smartphone className="w-7 h-7" />
          ) : (
            <ShieldCheck className="w-7 h-7 text-emerald-400" />
          )}
        </div>

        <h3 className="font-headline text-2xl font-bold text-center text-white mb-1">
          {step === "phone" ? "Verify Phone Number" : "Enter Verification Code"}
        </h3>
        <p className="text-xs text-center text-white/70 mb-6 max-w-xs mx-auto">
          {step === "phone"
            ? "Enter your mobile phone number to receive a 4-digit verification code via SMS."
            : `We sent a 4-digit code to ${getFullPhone()}. Enter it below to verify.`}
        </p>

        {errMessage && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errMessage}</span>
          </div>
        )}

        {step === "phone" ? (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#C8A96A] mb-1.5">
                Mobile Phone Number
              </label>
              <div className="flex items-center rounded-xl bg-black/60 border border-white/20 focus-within:border-[#C8A96A] p-1.5">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="bg-transparent text-sm font-bold text-[#E8CB8A] px-2 py-2 outline-none cursor-pointer"
                >
                  {COUNTRY_CODES.map((c, i) => (
                    <option key={i} value={c.code} className="bg-[#0c1612] text-white">
                      {c.label}
                    </option>
                  ))}
                </select>
                <div className="h-5 w-px bg-white/20 mx-1" />
                <input
                  type="tel"
                  autoFocus
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(formatUSPhoneNumber(e.target.value))}
                  placeholder="(555) 000-0000"
                  className="flex-1 bg-transparent px-2 py-2 font-mono text-base font-bold text-white placeholder:text-white/30 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full relative group overflow-hidden font-black text-xs tracking-[0.15em] uppercase py-3.5 rounded-xl bg-gradient-to-r from-[#C8A96A] via-[#E0C68E] to-[#C8A96A] text-[#0a120e] shadow-lg shadow-[#C8A96A]/20 hover:shadow-xl hover:shadow-[#C8A96A]/35 transition-all flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending SMS Code...</span>
                </>
              ) : (
                <>
                  <span>Send SMS Code</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#C8A96A] mb-1.5 text-center">
                4-Digit Security Code
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                autoFocus
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="1234"
                className="w-full text-center bg-black/60 border border-[#C8A96A]/50 focus:border-[#C8A96A] focus:ring-2 focus:ring-[#C8A96A]/30 rounded-xl px-4 py-3 font-mono text-3xl font-black text-white tracking-[0.6em] placeholder:tracking-normal placeholder:text-white/20 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading || otpCode.length !== 4}
              className="w-full font-black text-xs tracking-[0.15em] uppercase py-3.5 rounded-xl bg-gradient-to-r from-[#C8A96A] via-[#E0C68E] to-[#C8A96A] text-[#0a120e] shadow-lg shadow-[#C8A96A]/20 hover:shadow-xl hover:shadow-[#C8A96A]/35 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Code...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#0a120e]" />
                  <span>Verify Code &amp; Sign In</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-xs text-white/60 pt-2">
              <button
                type="button"
                onClick={() => setStep("phone")}
                className="hover:text-white transition-colors underline"
              >
                Change Phone
              </button>

              {resendCooldown > 0 ? (
                <span className="text-white/40">Resend in {resendCooldown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSendOTP()}
                  className="text-[#C8A96A] hover:text-[#E0C68E] flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Resend SMS</span>
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
