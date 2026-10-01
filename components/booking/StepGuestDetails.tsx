"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";
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
  Sparkles,
  Clock,
  ShieldCheck
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
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

  // Active Tab Toggle: Default is "email"
  const [activeTab, setActiveTab] = useState<"email" | "phone">("email");

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
    if (user?.name || initialData?.name) {
      setValue("name", initialData?.name || user?.name || "");
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

  const onSubmitForm = (data: any) => {
    const activeFullPhone = fullPhone || data.phone || user?.phone || initialData?.phone;
    if (!activeFullPhone || activeFullPhone.replace(/\D/g, "").length < 7) {
      toast.error("Please enter a valid phone number");
      return;
    }
    onNext({
      guestDetails: {
        ...data,
        name: data.name?.trim() || user?.name || "Guest User",
        email: data.email?.trim() || user?.email || "",
        phone: activeFullPhone,
        isPhoneVerified: false
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
            Guest Details &amp; Account
          </span>
          <h1 className="font-headline text-3xl md:text-5xl lg:text-6xl text-white leading-tight tracking-tight">
            Guest <span className="font-headline italic text-[#C8A96A]">Details</span>
          </h1>
        </header>
        <p className="hidden md:block text-white/80 font-body text-base lg:text-lg leading-relaxed max-w-sm font-light">
          Enter your information below to confirm your reservation. An instant confirmation receipt will be delivered to your email.
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
              <p className="font-headline italic text-white text-xl">Direct Email &amp; Phone</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Main Form & Toggle */}
      <div className="lg:col-span-7 bg-[#0b1410] p-4 sm:p-6 md:p-8 lg:p-10 rounded-2xl sm:rounded-3xl border border-[#C8A96A]/30 relative overflow-hidden shadow-2xl backdrop-blur-md">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#C8A96A] to-transparent" />
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#C8A96A]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Logged in User Badge Indicator */}
        {user && (
          <div className="mb-6 p-3.5 bg-[#C8A96A]/10 border border-[#C8A96A]/30 rounded-xl flex items-center justify-between text-xs text-[#E8CB8A]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Logged in as <strong className="text-white">{user.name || "Guest User"}</strong> ({user.email})
              </span>
            </div>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
              Verified
            </span>
          </div>
        )}

        {/* Navigation Mode Switcher Toggle Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-black/60 rounded-xl border border-[#C8A96A]/30 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab("email")}
            className={cn(
              "py-2.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2",
              activeTab === "email"
                ? "bg-[#C8A96A] text-[#0d1612] shadow-md font-extrabold"
                : "text-white/60 hover:text-white"
            )}
          >
            <Mail className="w-4 h-4" /> {user ? "Guest Details" : "Email & Password"}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("phone")}
            className={cn(
              "py-2.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 relative",
              activeTab === "phone"
                ? "bg-[#C8A96A] text-[#0d1612] shadow-md font-extrabold"
                : "text-white/60 hover:text-white"
            )}
          >
            <Smartphone className="w-4 h-4" /> Phone Login
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase font-black tracking-tighter">
              Soon
            </span>
          </button>
        </div>

        {/* TAB 1: Email / Guest Info Form */}
        {activeTab === "email" && (
          <form onSubmit={handleSubmit(onSubmitForm, onInvalid)} className="space-y-6 animate-in fade-in duration-300">
            <div className="space-y-4">
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

              {/* Phone Number Input */}
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 font-label text-[11px] uppercase tracking-[0.15em] text-[#C8A96A] font-bold">
                  <Smartphone className="w-3.5 h-3.5 text-[#C8A96A]" />
                  Phone Number
                </label>
                <div className="group relative rounded-xl bg-black/60 border border-white/15 focus-within:border-[#C8A96A] focus-within:ring-2 focus-within:ring-[#C8A96A]/20 transition-all flex items-center p-1.5 shadow-inner">
                  <div className="relative flex items-center flex-shrink-0">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="appearance-none bg-transparent pl-2 pr-6 py-2 text-xs sm:text-sm font-semibold text-[#E8CB8A] focus:outline-none cursor-pointer"
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
                    placeholder="(513) 940-5811"
                    className="flex-1 min-w-0 bg-transparent px-2 py-2 text-base font-mono font-bold text-white tracking-wide placeholder:text-white/25 focus:outline-none"
                  />
                </div>
              </div>

              {/* Password Input: HIDDEN when user is logged in */}
              {!user && (
                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 font-label text-[11px] uppercase tracking-[0.15em] text-[#C8A96A] font-bold">
                    <Lock className="w-3.5 h-3.5 text-[#C8A96A]" />
                    Password <span className="text-white/40 text-[10px] font-normal lowercase">(optional for fast login)</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      {...register("password")}
                      placeholder="••••••••"
                      className="w-full bg-black/60 border border-white/15 hover:border-[#C8A96A]/40 focus:border-[#C8A96A] focus:ring-2 focus:ring-[#C8A96A]/20 rounded-xl px-4 py-3.5 text-base font-body text-white placeholder:text-white/25 pr-10 transition-all outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
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
          </form>
        )}

        {/* TAB 2: Phone Verification - Coming Soon View */}
        {activeTab === "phone" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#16271f] via-[#0d1813] to-black border border-[#C8A96A]/40 p-6 text-center space-y-4 shadow-xl">
              <div className="w-12 h-12 rounded-full bg-[#C8A96A]/20 border border-[#C8A96A]/40 flex items-center justify-center mx-auto text-[#C8A96A]">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>

              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#C8A96A]/20 text-[#E8CB8A] border border-[#C8A96A]/40">
                  <Sparkles className="w-3.5 h-3.5" /> Coming Soon
                </span>
                <h3 className="font-headline italic text-2xl text-white pt-2">Phone SMS Verification</h3>
                <p className="text-xs text-white/70 max-w-xs mx-auto leading-relaxed">
                  SMS OTP verification is currently coming soon. You can enter your details and phone number directly in the Email &amp; Guest Details tab to proceed with your booking immediately!
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab("email")}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C8A96A] text-[#0d1612] font-black text-xs uppercase tracking-wider hover:bg-[#D6B97A] transition-all shadow-md"
              >
                <span>Switch to Guest Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
