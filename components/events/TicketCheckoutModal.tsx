"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Elements } from "@stripe/react-stripe-js";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Lock,
  Mail,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Ticket,
  User as UserIcon,
  X,
  AlertCircle,
  Timer,
  Cake
} from "lucide-react";
import { isAxiosError } from "axios";
import api from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/authStore";
import { getStripe } from "@/lib/stripe";
import { TicketPaymentForm } from "./TicketPaymentForm";
import { BirthdayPicker } from "@/components/shared/BirthdayPicker";

const stripePromise = getStripe();

/* ───────────────────────── Types ───────────────────────── */

export interface CheckoutLine {
  tierId: string;
  name: string;
  price: number;
  quantity: number;
}

interface CheckoutEvent {
  _id: string;
  title: string;
  date: string;
  startTime: string;
  venueName: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  event: CheckoutEvent;
  lines: CheckoutLine[];
  subtotal: number;
  platformFee: number;
  totalAmount: number;
}

type Step = "checking" | "phone" | "otp" | "details" | "birthday" | "review" | "payment";

interface PendingPayment {
  orderId: string;
  orderNumber: string;
  clientSecret: string;
  expiresAt: number;
  totalAmount: number;
}

interface Buyer {
  name: string;
  email: string;
  phone: string;
  dob: string; // "YYYY-MM-DD" or "" (optional, birthday bonus)
}

/* ───────────────────── Country handling ──────────────────── */

const COUNTRIES = [
  { id: "US", code: "+1", flag: "🇺🇸", name: "USA", digits: 10, placeholder: "(555) 000-0000" },
  { id: "CA", code: "+1", flag: "🇨🇦", name: "Canada", digits: 10, placeholder: "(555) 000-0000" },
  { id: "IN", code: "+91", flag: "🇮🇳", name: "India", digits: 10, placeholder: "98765 43210" }
] as const;
type CountryId = (typeof COUNTRIES)[number]["id"];

const formatLocal = (countryId: CountryId, raw: string): string => {
  const d = raw.replace(/\D/g, "").slice(0, 10);
  if (countryId === "IN") return d.length > 5 ? `${d.slice(0, 5)} ${d.slice(5)}` : d;
  if (d.length === 0) return "";
  if (d.length < 4) return `(${d}`;
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_LENGTH = 4;

interface SessionUser {
  name?: string;
  email?: string;
  phone?: string;
  isPhoneVerified?: boolean;
  dateOfBirth?: string;
}

/** Latest allowed birth date (13+), as "YYYY-MM-DD" for the date input. */
const maxDob = (() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 13);
  return d.toISOString().slice(0, 10);
})();
const isDobOk = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && v <= maxDob && v >= "1915-01-01";
const formatDob = (v: string) =>
  new Date(`${v}T00:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

const errMsg = (err: unknown, fallback: string) => (err instanceof Error && err.message) || fallback;

const realName = (n?: string) => (n && n !== "Guest User" ? n : "");

/**
 * Validates the stored session without going through the axios 401 interceptor
 * (which would hard-redirect to /login mid-checkout).
 */
const fetchSessionUser = async (): Promise<SessionUser | null> => {
  const token = Cookies.get("token");
  if (!token) return null;
  try {
    const base = process.env.NEXT_PUBLIC_API_URL || "/api";
    const res = await fetch(`${base}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8000) // never leave the popup spinning
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.success ? data.user : null;
  } catch {
    return null;
  }
};

/* ───────────────────────── Component ───────────────────────── */

export function TicketCheckoutModal({ isOpen, onClose, event, lines, subtotal, platformFee, totalAmount }: Props) {
  const router = useRouter();
  const { sendOTP, verifyOTP } = useAuth();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const setAuth = useAuthStore((s) => s.setAuth);

  const [step, setStep] = useState<Step>("checking");
  const [countryId, setCountryId] = useState<CountryId>("US");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [buyer, setBuyer] = useState<Buyer>({ name: "", email: "", phone: "", dob: "" });
  const [dobDraft, setDobDraft] = useState("");
  const [savingDob, setSavingDob] = useState(false);
  const [dobSkipped, setDobSkipped] = useState(false); // skipped once → don't ask again this checkout
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [payment, setPayment] = useState<PendingPayment | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const paymentRef = useRef<PendingPayment | null>(null);
  const paidRef = useRef(false); // once paid, a hold must never be released
  paymentRef.current = paidRef.current ? null : payment;

  const country = COUNTRIES.find((c) => c.id === countryId)!;
  const totalTickets = lines.reduce((s, l) => s + l.quantity, 0);
  const fullPhone = `${country.code}${phone.replace(/\D/g, "")}`;

  /* Decide the starting step whenever the modal opens */
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setError(null);
    setOtp(Array(OTP_LENGTH).fill(""));
    setStep("checking");

    (async () => {
      const user = await fetchSessionUser();
      if (cancelled) return;
      if (!user) {
        if (Cookies.get("token")) clearAuth(); // stale / expired token
        setStep("phone");
        return;
      }
      const b = { name: realName(user.name), email: user.email || "", phone: user.phone || "", dob: user.dateOfBirth || "" };
      setBuyer(b);
      if (!user.phone || !user.isPhoneVerified) setStep("phone");
      else if (!b.name || !b.email) setStep("details");
      else if (!b.dob) {
        setDobDraft("");
        setStep("birthday");
      } else setStep("review");
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, clearAuth]);

  /* Resend countdown */
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  /** Give held seats back (buyer left the payment step). keepalive survives page unload. */
  const releaseHold = useCallback((orderId: string) => {
    const token = Cookies.get("token");
    if (!token || paidRef.current) return;
    const base = process.env.NEXT_PUBLIC_API_URL || "/api";
    void fetch(`${base}/tickets/cancel-order`, {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ orderId })
    }).catch(() => undefined);
  }, []);

  /** Close the popup; if a payment is open, confirm and release the held tickets first. */
  const requestClose = useCallback(() => {
    if (busy) return;
    const pending = paymentRef.current;
    if (pending) {
      if (!window.confirm("Leave payment? Your held tickets will be released.")) return;
      releaseHold(pending.orderId);
      setPayment(null);
    }
    onClose();
  }, [busy, onClose, releaseHold]);

  /* Lock background scroll + Esc to close */
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && requestClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, requestClose]);

  /* 15-minute seat hold countdown while paying */
  useEffect(() => {
    if (!payment) return;
    const tick = () => {
      const left = Math.max(0, Math.round((payment.expiresAt - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0) {
        releaseHold(payment.orderId);
        setPayment(null);
        setStep("review");
        setError("Your ticket hold expired. Tap Continue to payment to try again.");
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [payment, releaseHold]);

  /* Release the hold if the tab is closed mid-payment */
  useEffect(() => {
    if (!payment) return;
    const onUnload = () => {
      if (paymentRef.current) releaseHold(payment.orderId);
    };
    window.addEventListener("pagehide", onUnload);
    return () => window.removeEventListener("pagehide", onUnload);
  }, [payment, releaseHold]);

  if (!isOpen) return null;

  /* ───────── Actions ───────── */

  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    if (phone.replace(/\D/g, "").length !== country.digits) {
      setError(`Enter a valid ${country.digits}-digit ${country.name} mobile number`);
      return;
    }
    setBusy(true);
    try {
      await sendOTP(fullPhone);
      toast.success(`Code sent to ${country.flag} ${country.code} ${phone}`);
      setOtp(Array(OTP_LENGTH).fill(""));
      setStep("otp");
      setCooldown(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
    } catch (err: unknown) {
      setError(errMsg(err, "Could not send the code. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOtp = async (code: string) => {
    setError(null);
    setBusy(true);
    try {
      const data = await verifyOTP(fullPhone, code);
      const u: SessionUser = data.user || {};
      const b = { name: realName(u.name), email: u.email || "", phone: u.phone || fullPhone, dob: u.dateOfBirth || "" };
      setBuyer(b);
      toast.success("Mobile number verified");
      setStep(!b.name || !b.email ? "details" : b.dob ? "review" : "birthday");
    } catch (err: unknown) {
      setError(errMsg(err, "Invalid or expired code"));
      setOtp(Array(OTP_LENGTH).fill(""));
      otpRefs.current[0]?.focus();
    } finally {
      setBusy(false);
    }
  };

  const setOtpDigit = (idx: number, value: string) => {
    const digits = value.replace(/\D/g, "");
    if (!digits) {
      const next = [...otp];
      next[idx] = "";
      setOtp(next);
      return;
    }
    const next = [...otp];
    // Supports pasting the whole code into any box
    digits.split("").forEach((d, i) => {
      if (idx + i < OTP_LENGTH) next[idx + i] = d;
    });
    setOtp(next);
    const focusIdx = Math.min(idx + digits.length, OTP_LENGTH - 1);
    otpRefs.current[focusIdx]?.focus();
    const code = next.join("");
    if (code.length === OTP_LENGTH && !busy) void handleVerifyOtp(code);
  };

  /** Saves name + email to the buyer's account (created at OTP verify) so they have a full profile & dashboard. */
  const handleDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const name = buyer.name.trim();
    const email = buyer.email.trim().toLowerCase();
    if (name.length < 2) return setError("Please enter your full name");
    if (!EMAIL_RE.test(email)) return setError("Please enter a valid email address");
    setBusy(true);
    try {
      const { data } = await api.post("/auth/update-profile", { name, email });
      const token = Cookies.get("token");
      if (data?.success && data.user && token) setAuth(data.user, token);
      setBuyer((b) => ({ ...b, name, email }));
      toast.success("Your account is ready");
      if (buyer.dob || dobSkipped) setStep("review");
      else {
        setDobDraft("");
        setStep("birthday");
      }
    } catch (err: unknown) {
      const res = isAxiosError<{ message?: string }>(err) ? err.response?.data : undefined;
      setError(res?.message || "Could not save your details. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handlePay = async () => {
    setError(null);
    setBusy(true);
    try {
      const { data } = await api.post("/tickets/checkout", {
        eventId: event._id,
        customerName: buyer.name,
        customerEmail: buyer.email,
        selectedTiers: lines.map((l) => ({ tierId: l.tierId, quantity: l.quantity }))
      });
      if (data.success && data.isSimulated && data.checkoutUrl) {
        window.location.href = data.checkoutUrl; // dev only: Stripe not configured
        return;
      }
      if (data.success && data.clientSecret) {
        if (!stripePromise) {
          releaseHold(data.orderId);
          setError("Card payments are not configured on this site yet.");
        } else {
          setPayment({
            orderId: data.orderId,
            orderNumber: data.orderNumber,
            clientSecret: data.clientSecret,
            expiresAt: new Date(data.expiresAt).getTime(),
            totalAmount: data.totalAmount
          });
          setStep("payment");
        }
      } else {
        setError("Could not start payment. Please try again.");
      }
    } catch (err: unknown) {
      const res = isAxiosError<{ code?: string; message?: string }>(err) ? err.response?.data : undefined;
      if (res?.code === "PHONE_VERIFICATION_REQUIRED" || res?.code === "AUTH_REQUIRED") setStep("phone");
      else if (res?.code === "PROFILE_INCOMPLETE") setStep("details");
      setError(res?.message || "Checkout failed. Please retry.");
    }
    setBusy(false);
  };

  /** Birthday step: save to the account, then review. */
  const saveDob = async () => {
    if (!isDobOk(dobDraft)) {
      setError("Please enter a valid date of birth (13+)");
      return;
    }
    setError(null);
    setSavingDob(true);
    try {
      const { data } = await api.post("/auth/update-profile", { dateOfBirth: dobDraft });
      const token = Cookies.get("token");
      if (data?.success && data.user && token) setAuth(data.user, token);
      setBuyer((b) => ({ ...b, dob: dobDraft }));
      toast.success("Birthday saved");
      setStep("review");
    } catch (err: unknown) {
      const res = isAxiosError<{ message?: string }>(err) ? err.response?.data : undefined;
      setError(res?.message || "Could not save your birthday");
    } finally {
      setSavingDob(false);
    }
  };

  /* ───────── UI ───────── */

  const stepIndex = { checking: 0, phone: 0, otp: 0, details: 1, birthday: 2, review: 3, payment: 4 }[step];
  const STEP_LABELS = ["Verify", "Details", "Birthday", "Review", "Pay"];

  const goldBtn =
    "w-full py-3.5 rounded-xl bg-gradient-to-r from-[#C8A96A] via-[#E0C68E] to-[#C8A96A] text-[#0a120e] text-xs font-black uppercase tracking-[0.15em] shadow-lg shadow-[#C8A96A]/20 flex items-center justify-center gap-2 transition-all disabled:opacity-40 cursor-pointer";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md"
      onClick={requestClose}
      role="dialog"
      aria-modal="true"
      aria-label="Book tickets"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full sm:max-w-md max-h-[92vh] overflow-y-auto bg-[#0c1612] border border-[#C8A96A]/30 rounded-t-3xl sm:rounded-2xl shadow-2xl text-white"
      >
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#C8A96A] to-transparent" />

        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0c1612]/95 backdrop-blur px-5 pt-5 pb-4 border-b border-white/10">
          <div className="sm:hidden mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#C8A96A] font-bold">Book Tickets</p>
              <h3 className="text-base font-bold truncate">{event.title}</h3>
              <p className="text-[11px] text-white/50">
                {totalTickets} ticket{totalTickets === 1 ? "" : "s"} · ${totalAmount.toFixed(2)}
              </p>
            </div>
            <button
              onClick={requestClose}
              disabled={busy}
              aria-label="Close"
              className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress */}
          <div className="mt-4 flex items-center gap-2">
            {STEP_LABELS.map((label, i) => (
              <div key={label} className="flex-1">
                <div className={`h-1 rounded-full ${i <= stepIndex ? "bg-[#C8A96A]" : "bg-white/10"}`} />
                <p className={`mt-1 text-[10px] uppercase tracking-wider ${i <= stepIndex ? "text-[#E0C68E]" : "text-white/30"}`}>
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {step === "checking" && (
            <div className="py-10 flex flex-col items-center gap-3 text-white/60 text-xs">
              <Loader2 className="w-6 h-6 animate-spin text-[#C8A96A]" />
              Checking your account…
            </div>
          )}

          {/* ── Step: phone ── */}
          {step === "phone" && (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 mx-auto rounded-full bg-[#C8A96A]/10 border border-[#C8A96A]/30 flex items-center justify-center text-[#C8A96A]">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold">Sign in with your mobile</h4>
                <p className="text-xs text-white/60">We&apos;ll text you a 4-digit code. No password needed.</p>
              </div>

              <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Country">
                {COUNTRIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    role="radio"
                    aria-checked={countryId === c.id}
                    onClick={() => {
                      setCountryId(c.id);
                      setPhone(formatLocal(c.id, phone));
                      setError(null);
                    }}
                    className={`rounded-xl border px-2 py-2.5 text-center transition-all cursor-pointer ${
                      countryId === c.id
                        ? "border-[#C8A96A] bg-[#C8A96A]/10 shadow-[0_0_12px_rgba(200,169,106,0.25)]"
                        : "border-white/10 bg-white/[0.03] hover:border-white/30"
                    }`}
                  >
                    <div className="text-xl leading-none">{c.flag}</div>
                    <div className="mt-1 text-[11px] font-bold">{c.name}</div>
                    <div className="text-[10px] text-white/50 font-mono">{c.code}</div>
                  </button>
                ))}
              </div>

              <div>
                <label htmlFor="tk-phone" className="block text-[11px] font-semibold uppercase tracking-wider text-[#C8A96A] mb-1.5">
                  Mobile number
                </label>
                <div className="flex items-center rounded-xl bg-black/50 border border-white/15 focus-within:border-[#C8A96A] transition-colors">
                  <span className="pl-3.5 pr-2 font-mono text-sm font-bold text-[#E0C68E] shrink-0">
                    {country.flag} {country.code}
                  </span>
                  <span className="h-5 w-px bg-white/15" />
                  <input
                    id="tk-phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    autoFocus
                    value={phone}
                    onChange={(e) => {
                      setPhone(formatLocal(countryId, e.target.value));
                      setError(null);
                    }}
                    placeholder={country.placeholder}
                    className="flex-1 min-w-0 bg-transparent px-3 py-3 font-mono text-base font-bold text-white placeholder:text-white/25 outline-none"
                  />
                </div>
              </div>

              <button type="submit" disabled={busy} className={goldBtn}>
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                {busy ? "Sending code…" : "Send OTP"}
              </button>
            </form>
          )}

          {/* ── Step: otp ── */}
          {step === "otp" && (
            <div className="space-y-5">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold">Enter verification code</h4>
                <p className="text-xs text-white/60">
                  Sent to <span className="font-mono text-[#E0C68E]">{country.flag} {country.code} {phone}</span>
                </p>
              </div>

              <div className="flex justify-center gap-3">
                {otp.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      otpRefs.current[i] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete={i === 0 ? "one-time-code" : "off"}
                    aria-label={`Digit ${i + 1}`}
                    maxLength={OTP_LENGTH}
                    value={d}
                    disabled={busy}
                    onChange={(e) => setOtpDigit(i, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
                    }}
                    className="w-14 h-16 text-center rounded-xl bg-black/50 border border-white/15 focus:border-[#C8A96A] focus:ring-2 focus:ring-[#C8A96A]/30 font-mono text-2xl font-black outline-none"
                  />
                ))}
              </div>

              <button
                type="button"
                disabled={busy || otp.join("").length !== OTP_LENGTH}
                onClick={() => handleVerifyOtp(otp.join(""))}
                className={goldBtn}
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {busy ? "Verifying…" : "Verify & Continue"}
              </button>

              <div className="flex items-center justify-between text-xs text-white/60">
                <button
                  type="button"
                  onClick={() => {
                    setStep("phone");
                    setError(null);
                  }}
                  className="inline-flex items-center gap-1 hover:text-white cursor-pointer"
                >
                  <ArrowLeft className="w-3 h-3" /> Change number
                </button>
                {cooldown > 0 ? (
                  <span className="text-white/40">Resend in {cooldown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSendOtp()}
                    disabled={busy}
                    className="inline-flex items-center gap-1 text-[#C8A96A] hover:text-[#E0C68E] cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> Resend code
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Step: details ── */}
          {step === "details" && (
            <form onSubmit={handleDetails} className="space-y-4">
              <div className="text-center space-y-1">
                <h4 className="text-lg font-bold">Create your account</h4>
                <p className="text-xs text-white/60">Tickets and QR passes are issued in this name.</p>
              </div>

              <div>
                <label htmlFor="tk-name" className="block text-[11px] font-semibold uppercase tracking-wider text-[#C8A96A] mb-1.5">
                  Full name
                </label>
                <div className="flex items-center gap-2 rounded-xl bg-black/50 border border-white/15 focus-within:border-[#C8A96A] px-3.5">
                  <UserIcon className="w-4 h-4 text-white/40" />
                  <input
                    id="tk-name"
                    autoFocus
                    autoComplete="name"
                    value={buyer.name}
                    onChange={(e) => setBuyer((b) => ({ ...b, name: e.target.value }))}
                    placeholder="Jordan Lee"
                    className="flex-1 bg-transparent py-3 text-sm text-white placeholder:text-white/25 outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="tk-email" className="block text-[11px] font-semibold uppercase tracking-wider text-[#C8A96A] mb-1.5">
                  Email
                </label>
                <div className="flex items-center gap-2 rounded-xl bg-black/50 border border-white/15 focus-within:border-[#C8A96A] px-3.5">
                  <Mail className="w-4 h-4 text-white/40" />
                  <input
                    id="tk-email"
                    type="email"
                    autoComplete="email"
                    value={buyer.email}
                    onChange={(e) => setBuyer((b) => ({ ...b, email: e.target.value }))}
                    placeholder="jordan@example.com"
                    className="flex-1 bg-transparent py-3 text-sm text-white placeholder:text-white/25 outline-none"
                  />
                </div>
              </div>

              {buyer.phone && (
                <p className="text-[11px] text-white/50 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Verified mobile: {buyer.phone}
                </p>
              )}

              <p className="text-[10px] text-white/40">
                We&apos;ll create your Tropica account with these details so you can view your tickets anytime from your dashboard.
              </p>

              <button type="submit" disabled={busy} className={goldBtn}>
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {busy ? "Saving your account…" : "Continue"}
                {!busy && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          )}

          {/* ── Step: birthday (optional) ── */}
          {step === "birthday" && (
            <div className="space-y-5">
              <div className="text-center space-y-1">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full border border-[#C8A96A]/40 bg-[#C8A96A]/10">
                  <Cake className="w-6 h-6 text-[#E0C68E]" />
                </div>
                <h4 className="text-lg font-bold">When&apos;s your birthday?</h4>
                <p className="text-xs text-white/60">Add it to get a special bonus when you celebrate with us. It&apos;s optional.</p>
              </div>

              <BirthdayPicker compact value={dobDraft} onChange={setDobDraft} />

              <button type="button" onClick={saveDob} disabled={!dobDraft || savingDob} className={goldBtn}>
                {savingDob ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {savingDob ? "Saving…" : "Continue"}
                {!savingDob && <ArrowRight className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setDobSkipped(true);
                  setError(null);
                  setStep("review");
                }}
                className="w-full py-1 text-[11px] font-bold uppercase tracking-wider text-white/50 hover:text-white cursor-pointer"
              >
                Skip for now
              </button>
            </div>
          )}

          {/* ── Step: review & pay ── */}
          {step === "review" && (
            <div className="space-y-5">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] divide-y divide-white/5">
                {lines.map((l) => (
                  <div key={l.tierId} className="flex items-center justify-between px-4 py-3 text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <Ticket className="w-4 h-4 text-[#C8A96A] shrink-0" />
                      <span className="truncate">{l.name}</span>
                      <span className="text-white/50 text-xs shrink-0">× {l.quantity}</span>
                    </div>
                    <span className="font-semibold">${(l.price * l.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="px-4 py-3 space-y-1.5 text-xs">
                  <div className="flex justify-between text-white/60">
                    <span>Subtotal ({totalTickets} ticket{totalTickets === 1 ? "" : "s"})</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  {platformFee > 0 && (
                    <div className="flex justify-between text-white/60">
                      <span>Service &amp; processing fee</span>
                      <span>${platformFee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-white/10 text-sm font-bold">
                    <span>Total</span>
                    <span className="text-[#E0C68E] text-base">${totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-white/40">Tickets for</span>
                  <button
                    type="button"
                    onClick={() => setStep("details")}
                    className="text-[11px] text-[#C8A96A] hover:text-[#E0C68E] cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
                <div className="font-semibold text-sm">{buyer.name}</div>
                <div className="text-white/60">{buyer.email}</div>
                <div className="text-white/60 font-mono">{buyer.phone}</div>
                <button
                  type="button"
                  onClick={() => {
                    setDobDraft(buyer.dob);
                    setStep("birthday");
                  }}
                  className="text-white/60 hover:text-[#E0C68E] flex items-center gap-1.5 cursor-pointer"
                >
                  <Cake className="w-3.5 h-3.5 text-[#C8A96A]" />
                  {buyer.dob ? formatDob(buyer.dob) : <span className="text-[#C8A96A] underline underline-offset-2">Add birthday for a bonus</span>}
                </button>
              </div>

              <button type="button" onClick={handlePay} disabled={busy} className={goldBtn}>
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                {busy ? "Holding your tickets…" : `Continue to payment · $${totalAmount.toFixed(2)}`}
              </button>

              <p className="text-[10px] text-center text-white/40 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Secure Stripe payment. QR tickets are issued instantly after payment.
              </p>
            </div>
          )}

          {/* ── Step: payment (embedded Stripe, same flow as venue booking) ── */}
          {step === "payment" && payment && stripePromise && (
            <div className="space-y-4">
              <div
                className={`flex items-center justify-between rounded-xl border px-4 py-2.5 text-xs ${
                  secondsLeft <= 120
                    ? "border-rose-500/40 bg-rose-500/10 text-rose-200"
                    : "border-[#C8A96A]/30 bg-[#C8A96A]/10 text-[#E0C68E]"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Timer className="w-4 h-4" /> {totalTickets} ticket{totalTickets === 1 ? "" : "s"} held for you
                </span>
                <span className="font-mono font-bold tabular-nums">
                  {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-white/60 px-1">
                <span>Order {payment.orderNumber}</span>
                <span className="text-sm font-bold text-white">${payment.totalAmount.toFixed(2)}</span>
              </div>

              <Elements
                key={payment.clientSecret}
                stripe={stripePromise}
                options={{
                  clientSecret: payment.clientSecret,
                  appearance: {
                    theme: "night",
                    variables: {
                      colorPrimary: "#C8A96A",
                      colorBackground: "#0f1d17",
                      colorText: "#ffffff",
                      colorDanger: "#fb7185",
                      borderRadius: "10px",
                      fontSizeBase: "14px"
                    }
                  }
                }}
              >
                <TicketPaymentForm
                  orderId={payment.orderId}
                  totalAmount={payment.totalAmount}
                  disabled={secondsLeft === 0}
                  onPaid={() => {
                    setBusy(true);
                    paidRef.current = true;
                    paymentRef.current = null;
                    toast.success("Payment successful! Issuing your tickets…");
                    router.push(`/tickets/success?order_id=${payment.orderId}`);
                  }}
                  onProcessing={() => {
                    paidRef.current = true;
                    paymentRef.current = null;
                    router.push(`/tickets/success?order_id=${payment.orderId}`);
                  }}
                />
              </Elements>

              <button
                type="button"
                onClick={() => {
                  releaseHold(payment.orderId);
                  setPayment(null);
                  setStep("review");
                }}
                className="w-full text-center text-[11px] text-white/50 hover:text-white inline-flex items-center justify-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3 h-3" /> Back · release tickets
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
