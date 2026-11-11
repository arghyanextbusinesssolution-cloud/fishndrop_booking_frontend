"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import Cookies from "js-cookie";
import { useAuthStore } from "@/store/authStore";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import {
  ShieldCheck,
  Upload,
  CheckCircle2,
  ArrowRight,
  Building,
  User,
  Mail,
  Smartphone,
  Globe,
  DollarSign,
  QrCode,
  Calendar,
  Loader2,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TropicaAuthShell, tropicaGoldButton, tropicaInputBare } from "@/components/auth/TropicaAuthShell";

const COUNTRY_OPTIONS = [
  { id: "US", code: "+1", flag: "🇺🇸", label: "United States (+1)" },
  { id: "CA", code: "+1", flag: "🇨🇦", label: "Canada (+1)" },
  { id: "IN", code: "+91", flag: "🇮🇳", label: "India (+91)" },
  { id: "UK", code: "+44", flag: "🇬🇧", label: "United Kingdom (+44)" },
  { id: "AU", code: "+61", flag: "🇦🇺", label: "Australia (+61)" },
  { id: "AE", code: "+971", flag: "🇦🇪", label: "UAE (+971)" }
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

export default function PromoterRegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const { sendOTP, verifyOTP, loading: authLoading } = useAuth();

  // Mode: "signup" or "login"
  const [activeTab, setActiveTab] = useState<"signup" | "login">("signup");

  // Read URL query parameter for initial tab (?tab=login or ?mode=login)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab") || params.get("mode");
      if (tab === "login") {
        setActiveTab("login");
      } else if (tab === "signup" || tab === "register") {
        setActiveTab("signup");
      }
    }
  }, []);

  // Phone & OTP states
  const [selectedCountryId, setSelectedCountryId] = useState<string>("US");
  const [phoneInput, setPhoneInput] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState("");
  const [errMessage, setErrMessage] = useState<string | null>(null);

  // Partner Details states (revealed after phone verification for signup)
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [eventGenre, setEventGenre] = useState("nightlife");
  const [socialLink, setSocialLink] = useState("");
  const [idDocumentUrl, setIdDocumentUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const selectedCountry = COUNTRY_OPTIONS.find((c) => c.id === selectedCountryId) || COUNTRY_OPTIONS[0];

  // Resend cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const cleanDigits = (() => {
    let d = phoneInput.replace(/\D/g, "");
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

  // 1. Send OTP for both Signup and Login
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrMessage(null);

    if (rawDigits.length < 7) {
      setErrMessage("Please enter a valid phone number.");
      return;
    }

    try {
      await sendOTP(fullPhone);
      setOtpSent(true);
      setResendCooldown(30);
      toast.success(`Verification code sent to ${fullPhone}`);
    } catch (err: any) {
      setErrMessage(err.message || "Failed to send SMS code. Please try again.");
    }
  };

  // 2. Verify OTP
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrMessage(null);

    const cleanCode = otpCode.trim();
    if (cleanCode.length !== 4) {
      setErrMessage("Please enter the 4-digit code sent to your phone.");
      return;
    }

    try {
      const data = await verifyOTP(fullPhone, cleanCode);
      setIsPhoneVerified(true);
      setVerifiedPhone(fullPhone);
      toast.success("Phone verified successfully!");

      // If logging in, check if user is already a promoter or staff
      if (activeTab === "login") {
        if (data?.token && data?.user) {
          Cookies.set("token", data.token, { expires: 7 });
          Cookies.set("user_role", data.user.role, { expires: 7 });
          setAuth(data.user, data.token);

          if (data.user.role === "promoter") {
            toast.success("Welcome to your Promoter Dashboard!");
            router.push("/promoter");
          } else if (data.user.role === "staff") {
            toast.success("Welcome, Employee!");
            router.push("/employee");
          } else if (data.user.role === "admin" || data.user.role === "owner") {
            toast.success("Welcome, Admin!");
            router.push("/admin");
          } else {
            // User exists but has not completed promoter application details
            toast("Please complete your promoter details to finish onboarding.");
            setActiveTab("signup");
          }
        }
      }
    } catch (err: any) {
      setErrMessage(err.message || "Invalid or expired code. (Dev test code: 1234)");
    }
  };

  // 3. ID Document: read locally; the server uploads it securely when the form is submitted
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be under 10MB");
      return;
    }
    if (!/^image\/|^application\/pdf$/.test(file.type)) {
      toast.error("Please upload a photo (JPG, PNG) or a PDF");
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setIdDocumentUrl(reader.result as string);
      toast.success("Identity document attached!");
      setIsUploading(false);
    };
    reader.onerror = () => {
      toast.error("Failed to read file");
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  // 4. Submit Full Partner Details (After OTP Verification)
  const handlePartnerDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Full name and email are required");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data } = await api.post("/auth/register-promoter", {
        name: name.trim(),
        email: email.trim(),
        phone: verifiedPhone || fullPhone,
        companyName: companyName.trim(),
        idDocumentUrl,
      });

      if (data.success) {
        Cookies.set("token", data.token, { expires: 7 });
        Cookies.set("user_role", data.user.role, { expires: 7 });
        setAuth(data.user, data.token);

        setRegistrationSuccess(true);
        toast.success("Partner account created successfully!");
        setTimeout(() => {
          router.push("/promoter");
        }, 1200);
      }
    } catch (err: any) {
      const res = err.response?.data;
      toast.error(res?.message || "Registration failed");
      if (res?.code === "ALREADY_PROMOTER") router.push("/promoter");
      else if (res?.code === "PHONE_VERIFICATION_REQUIRED") {
        setIsPhoneVerified(false);
        setVerifiedPhone("");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <TropicaAuthShell
      size="xl"
      tagline="Partner & Organizer Portal"
      eyebrow={activeTab === "signup" ? "Become a partner" : "Welcome back, partner"}
      title={activeTab === "signup" ? "Promoter sign up" : "Promoter sign in"}
      subtitle="Verify with a text code from your US, Canada or India number. Sell tickets and get paid out through Stripe Connect."
      footer={
        <div className="space-y-2 text-center">
          <p>
            Need organizer assistance?{" "}
            <a href="mailto:events@tropica.nyc" className="text-[#E0C68E] hover:underline font-semibold">
              events@tropica.nyc
            </a>
          </p>
          <p className="text-[10px] uppercase tracking-widest font-bold">
            <Link href="/login" className="text-[#C8A96A] hover:text-white transition-colors">
              Guest login
            </Link>
            <span className="mx-2 text-white/20">•</span>
            <Link href="/employee-login" className="text-[#C8A96A] hover:text-white transition-colors">
              Employee login
            </Link>
          </p>
        </div>
      }
    >
      {/* Perks */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { Icon: Smartphone, label: "OTP sign in" },
          { Icon: DollarSign, label: "Direct payouts" },
          { Icon: QrCode, label: "QR door passes" },
          { Icon: ShieldCheck, label: "Verified partners" }
        ].map(({ Icon, label }) => (
          <div key={label} className="flex items-center justify-center gap-1.5 rounded-xl border border-[#C8A96A]/20 bg-black/35 px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-white/70">
            <Icon className="w-3.5 h-3.5 text-[#C8A96A] shrink-0" /> {label}
          </div>
        ))}
      </div>

      <div>
          {/* Success State */}
          {registrationSuccess ? (
            <div className="text-center py-10 space-y-4 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-headline text-2xl sm:text-3xl text-white font-bold">Application Received!</h3>
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm sm:text-base font-semibold max-w-md mx-auto shadow-inner">
                Our employee will verify your data and then we will notify you.
              </div>
              <p className="text-white/60 text-xs max-w-md mx-auto">
                Your account is inactive pending verification. Redirecting to your Application Status...
              </p>
              <div className="flex justify-center pt-2">
                <Loader2 className="w-6 h-6 text-[#C8A96A] animate-spin" />
              </div>
            </div>
          ) : (
            <>
              {/* Tabs: Sign Up vs Sign In */}
              <div className="flex rounded-xl bg-black/50 border border-[#C8A96A]/25 p-1 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("signup");
                    setErrMessage(null);
                  }}
                  className={cn(
                    "w-1/2 py-2.5 rounded-lg font-label text-xs uppercase tracking-wider font-bold transition-all duration-200 cursor-pointer",
                    activeTab === "signup"
                      ? "bg-gradient-to-b from-[#F1D9A0] to-[#C8A96A] text-[#1a1208] shadow-md shadow-[#C8A96A]/25"
                      : "text-white/60 hover:text-white"
                  )}
                >
                  Sign up
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("login");
                    setErrMessage(null);
                  }}
                  className={cn(
                    "w-1/2 py-2.5 rounded-lg font-label text-xs uppercase tracking-wider font-bold transition-all duration-200 cursor-pointer",
                    activeTab === "login"
                      ? "bg-gradient-to-b from-[#F1D9A0] to-[#C8A96A] text-[#1a1208] shadow-md shadow-[#C8A96A]/25"
                      : "text-white/60 hover:text-white"
                  )}
                >
                  Sign in
                </button>
              </div>

              {/* ─── STAGE 1: PHONE VERIFICATION (Required for both Sign Up and Login) ─── */}
              {!isPhoneVerified && (
                <div className="space-y-6 animate-fade-in">
                  <div className="space-y-1 pb-2 border-b border-[#C8A96A]/15 text-center sm:text-left">
                    <h3 className="font-headline text-xl text-white font-bold">
                      {activeTab === "signup" ? "1. Verify Phone Number" : "Sign In with Mobile OTP"}
                    </h3>
                    <p className="text-xs text-white/50">
                      We support US (+1), Canada (+1), India (+91), and international numbers.
                    </p>
                  </div>

                  {!otpSent ? (
                    /* Step 1A: Enter Phone Number */
                    <form onSubmit={handleSendOtp} className="space-y-5">
                      <div className="space-y-2">
                        <label className="font-label text-xs uppercase tracking-widest text-white/80 font-bold flex items-center gap-2">
                          <Smartphone className="w-4 h-4 text-[#C8A96A]" />
                          Mobile Phone Number
                        </label>

                        <div className="flex items-center rounded-xl border border-[#C8A96A]/30 bg-black/55 p-1 focus-within:border-[#E0C68E] focus-within:ring-2 focus-within:ring-[#C8A96A]/20 transition-all">
                          {/* Country Dropdown */}
                          <div className="relative border-r border-[#C8A96A]/20 pr-2 pl-3">
                            <select
                              value={selectedCountryId}
                              onChange={(e) => setSelectedCountryId(e.target.value)}
                              className="bg-transparent text-sm font-semibold text-white/90 outline-none cursor-pointer pr-4 appearance-none font-mono"
                            >
                              {COUNTRY_OPTIONS.map((c) => (
                                <option key={c.id} value={c.id} className="bg-[#140f09] text-white">
                                  {c.flag} {c.code} ({c.label.split(" ")[0]})
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Phone input */}
                          <input
                            type="tel"
                            placeholder={selectedCountry.code === "+1" ? "(555) 000-0000" : "Phone number"}
                            value={phoneInput}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPhoneInput(selectedCountry.code === "+1" ? formatNorthAmericanNumber(val) : val);
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
                        disabled={authLoading || rawDigits.length < 7}
                        className={`${tropicaGoldButton} py-4`}
                      >
                        {authLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Sending SMS Code...
                          </>
                        ) : (
                          <>
                            <span>Send Verification Code</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>
                  ) : (
                    /* Step 1B: Enter 4-Digit OTP Code */
                    <form onSubmit={handleVerifyOtp} className="space-y-6">
                      <div className="space-y-2 text-center sm:text-left">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#C8A96A] font-label">
                          SMS Verification
                        </span>
                        <h4 className="font-headline text-2xl text-white">Enter 4-Digit Code</h4>
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
                          className="w-full text-center text-4xl sm:text-5xl font-mono tracking-[0.5em] bg-black/55 border border-[#C8A96A]/30 rounded-xl py-4 text-white focus:outline-none focus:border-[#E0C68E] focus:ring-2 focus:ring-[#C8A96A]/30"
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
                        disabled={authLoading || otpCode.length !== 4}
                        className={`${tropicaGoldButton} py-4`}
                      >
                        {authLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
                          </>
                        ) : (
                          <>
                            <span>Verify Code &amp; Continue</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>

                      <div className="flex items-center justify-between text-xs text-white/50 pt-2 border-t border-white/5">
                        <button
                          type="button"
                          onClick={() => {
                            setOtpSent(false);
                            setOtpCode("");
                          }}
                          className="hover:text-white transition-colors underline cursor-pointer"
                        >
                          Change Number
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
                </div>
              )}

              {/* ─── STAGE 2: PARTNER DETAILS (Revealed After OTP is Verified for Sign Up) ─── */}
              {isPhoneVerified && activeTab === "signup" && (
                <form onSubmit={handlePartnerDetailsSubmit} className="space-y-6 animate-fade-in">
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <div>
                        <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 font-label">
                          Phone Verified
                        </p>
                        <p className="font-mono text-sm text-white font-bold">{verifiedPhone}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsPhoneVerified(false)}
                      className="text-xs text-white/50 hover:text-white underline cursor-pointer"
                    >
                      Change
                    </button>
                  </div>

                  <div className="space-y-1 pb-2 border-b border-[#C8A96A]/15">
                    <h3 className="font-headline text-xl text-white font-bold">2. Partner &amp; Organizer Details</h3>
                    <p className="text-xs text-white/50">Complete your profile to create your promoter account.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-[#E0C68E]/80 mb-1.5 font-label flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#C8A96A]" /> Full Legal Name *
                      </label>
                      <input
                        type="text"
                        required
                        autoFocus
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Alex Rivera"
                        className={tropicaInputBare}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-[#E0C68E]/80 mb-1.5 font-label flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-[#C8A96A]" /> Brand / Collective Name
                      </label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="e.g. Brooklyn Waves Events"
                        className={tropicaInputBare}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-[#E0C68E]/80 mb-1.5 font-label flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-[#C8A96A]" /> Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="promoter@domain.com"
                        className={tropicaInputBare}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-[#E0C68E]/80 mb-1.5 font-label flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-[#C8A96A]" /> Instagram or Website
                      </label>
                      <input
                        type="text"
                        value={socialLink}
                        onChange={(e) => setSocialLink(e.target.value)}
                        placeholder="@yourbrand or website.com"
                        className={tropicaInputBare}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-[#E0C68E]/80 mb-1.5 font-label">
                      Primary Event Genre
                    </label>
                    <select
                      value={eventGenre}
                      onChange={(e) => setEventGenre(e.target.value)}
                      className={`${tropicaInputBare} cursor-pointer [&>option]:bg-[#140f09]`}
                    >
                      <option value="nightlife">Nightlife &amp; DJ Parties</option>
                      <option value="live_music">Live Music &amp; Acoustic</option>
                      <option value="networking">Corporate &amp; Mixer</option>
                      <option value="private">Private Family / Celebration</option>
                      <option value="cultural">Art &amp; Fashion Showcase</option>
                    </select>
                  </div>

                  {/* ID Document Upload */}
                  <div className="border border-[#C8A96A]/20 rounded-2xl p-5 bg-black/35 space-y-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-[#C8A96A]" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider font-label">
                        Government Photo ID Verification
                      </span>
                    </div>
                    <p className="text-xs text-white/60 font-body">
                      Upload a government-issued photo ID (Driver&apos;s License or Passport) for verified payout onboarding.
                    </p>

                    <div className="flex flex-wrap items-center gap-4 pt-1">
                      <label className="cursor-pointer inline-flex items-center gap-2 bg-[#C8A96A]/15 hover:bg-[#C8A96A]/25 text-[#E8CB8A] border border-[#C8A96A]/40 px-4 py-2.5 rounded-xl text-xs font-bold font-label uppercase tracking-wider transition-all">
                        <Upload className="w-4 h-4 text-[#C8A96A]" />
                        {isUploading ? "Uploading ID Document..." : idDocumentUrl ? "Replace ID Document" : "Upload Photo ID (Image / PDF)"}
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={handleFileUpload}
                          disabled={isUploading}
                        />
                      </label>

                      {idDocumentUrl && (
                        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-400/10 border border-emerald-400/30 px-3 py-1.5 rounded-full">
                          <CheckCircle2 className="w-4 h-4" /> ID Document Attached
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Submit Partner Registration */}
                  <button
                    type="submit"
                    disabled={isSubmitting || isUploading || !name.trim() || !email.trim()}
                    className={`${tropicaGoldButton} py-4`}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Creating Partner Account...
                      </>
                    ) : (
                      <>
                        <span>Complete Registration &amp; Open Dashboard</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </>
          )}
      </div>
    </TropicaAuthShell>
  );
}
