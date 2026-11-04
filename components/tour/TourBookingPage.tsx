"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Play, 
  Pause, 
  Maximize2, 
  Compass, 
  Calendar, 
  ShieldCheck, 
  ArrowRight, 
  Phone, 
  User as UserIcon, 
  Mail, 
  X,
  Lock,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Loader2,
  Check
} from "lucide-react";
import toast from "react-hot-toast";
import { Elements, useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";

const stripePromise = getStripe();

// ── In-Modal Embedded Stripe Card Payment Form ──
function TourStripeCardForm({
  name,
  email,
  phone,
  onBack,
  onSuccess
}: {
  name: string;
  email: string;
  phone: string;
  onBack: () => void;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/book-tour/confirmed`,
          payment_method_data: {
            billing_details: {
              name,
              email,
              phone
            }
          }
        },
        redirect: "if_required",
      });

      if (error) {
        toast.error(error.message || "Card verification failed. Please try again.");
        setIsProcessing(false);
      } else if (paymentIntent && (paymentIntent.status === "succeeded" || paymentIntent.status === "processing")) {
        toast.success("Tour deposit of $25 paid successfully!");
        onSuccess();
      } else {
        // In case 3D Secure triggers redirect
        setIsProcessing(false);
      }
    } catch (err: any) {
      console.error("Payment confirmation error:", err);
      toast.error(err?.message || "Payment processing failed. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
      {/* Customer summary pill */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-[#C8A96A]/20 text-xs">
        <div className="space-y-0.5 truncate pr-2">
          <span className="text-white/40 block text-[9px] uppercase tracking-wider font-bold">Tour Reserved For</span>
          <span className="text-[#C8A96A] font-semibold truncate block">{name}</span>
          <span className="text-white/60 text-[11px] font-mono block">{phone} • {email}</span>
        </div>
        <button
          type="button"
          onClick={onBack}
          disabled={isProcessing}
          className="shrink-0 text-[10px] text-white/50 hover:text-white uppercase tracking-wider font-bold transition-colors underline cursor-pointer"
        >
          Edit Info
        </button>
      </div>

      {/* Embedded Stripe Elements Card Box (Compact, tabs layout, NO duplicate fields) */}
      <div className="p-4 bg-[#071912] rounded-2xl border border-[#C8A96A]/30 space-y-3">
        <div className="flex items-center justify-between text-xs pb-1 border-b border-white/5">
          <div className="flex items-center gap-2 text-[#C8A96A] font-medium">
            <Lock className="w-3.5 h-3.5" />
            <span className="font-label text-[10px] uppercase tracking-wider font-bold">
              Credit / Debit Card
            </span>
          </div>
          <span className="font-mono text-xs font-bold text-emerald-400">$25.00 USD</span>
        </div>

        <PaymentElement 
          options={{
            layout: "tabs",
            fields: {
              billingDetails: {
                name: "never",
                email: "never",
                phone: "never"
              }
            }
          }}
        />

        <div className="flex items-center justify-between text-[10px] text-white/40 pt-1">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            PCI-DSS 256-Bit Encrypted
          </span>
          <span className="font-mono text-[#C8A96A]/70">100% credited to booking</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-1">
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="w-full py-4 rounded-full bg-gradient-to-r from-[#C8A96A] via-[#E8CB8A] to-[#C8A96A] text-[#071912] font-label text-[11px] uppercase tracking-[0.2em] font-black hover:brightness-110 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_0_25px_rgba(200,169,106,0.35)] flex items-center justify-center gap-2 cursor-pointer"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[#071912]" />
              <span>Processing $25 Deposit…</span>
            </>
          ) : (
            <>
              <span>Complete Payment &amp; Book — $25</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onBack}
          disabled={isProcessing}
          className="w-full py-1 text-center text-xs text-white/40 hover:text-white/80 transition-colors flex items-center justify-center gap-1 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Details</span>
        </button>
      </div>
    </form>
  );
}

// ── Main Tour Booking Page Component ──
export function TourBookingPage() {
  const { user, isAuthenticated } = useAuthStore();
  
  // Video player state — MUTED always, no speaker button
  const desktopVideoRef = useRef<HTMLVideoElement | null>(null);
  const mobileVideoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  // In-modal payment state
  const [loadingIntent, setLoadingIntent] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Auto-fill details from logged-in user if available
  useEffect(() => {
    if (user) {
      if (user.name && user.name !== "Guest User") {
        setName(user.name);
      }
      if (user.phone) {
        setPhone(user.phone);
      }
      if (user.email && !user.email.endsWith("@fishndrop.com")) {
        setEmail(user.email);
      }
    }
  }, [user]);

  // Ensure videos are MUTED on mount (silent background preview)
  useEffect(() => {
    [desktopVideoRef.current, mobileVideoRef.current].forEach((video) => {
      if (video) {
        video.muted = true;
        video.defaultMuted = true;
      }
    });
  }, []);

  // Video controls (Play/Pause & Fullscreen only - speaker button removed)
  const togglePlay = () => {
    const nextState = !isPlaying;
    setIsPlaying(nextState);

    [desktopVideoRef.current, mobileVideoRef.current].forEach((video) => {
      if (!video) return;
      if (nextState) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  };

  const handleFullscreen = () => {
    const video = desktopVideoRef.current || mobileVideoRef.current;
    if (!video) return;
    if (video.requestFullscreen) {
      video.requestFullscreen();
    }
  };

  // Open modal
  const handleOpenModal = () => {
    setIsSuccess(false);
    setClientSecret(null);
    setIsModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    if (loadingIntent) return;
    setIsModalOpen(false);
    setClientSecret(null);
    setIsSuccess(false);
  };

  // Step 1: Submit Details -> Generate Stripe PaymentIntent -> Switch to Embedded Card Element
  const handleInitializePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalName = name.trim();
    const finalPhone = phone.trim();
    const finalEmail = email.trim();

    if (!finalName) {
      toast.error("Please enter your full name");
      return;
    }

    if (!finalPhone || finalPhone.replace(/\D/g, "").length < 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    if (!finalEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(finalEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!termsAccepted) {
      toast.error("Please agree to the terms to proceed with the reservation");
      return;
    }

    setLoadingIntent(true);
    try {
      // If user is authenticated, update profile with provided name/email in background
      if (isAuthenticated) {
        api.post("/auth/update-profile", { name: finalName, email: finalEmail, phone: finalPhone }).catch(() => {});
      }

      // Create PaymentIntent specifically for Tour ($25 flat fee)
      const { data } = await api.post("/payments/tour-payment-intent", {
        name: finalName,
        email: finalEmail,
        phone: finalPhone,
        userId: user?.id || undefined
      });

      if (data?.clientSecret) {
        setClientSecret(data.clientSecret);
      } else {
        toast.error("Could not initialize card payment. Please try again.");
      }
    } catch (err: any) {
      console.error("Tour PaymentIntent error:", err);
      toast.error(err?.response?.data?.message || "Failed to initialize payment form. Please try again.");
    } finally {
      setLoadingIntent(false);
    }
  };

  return (
    <>
      {/* ─────────────────────────────────────────────────────────────
          1. MOBILE FULLSCREEN EXPERIENCE (iPhone / Small screens)
          Immersive full-screen video with bottom pinned CTA
      ─────────────────────────────────────────────────────────────── */}
      <section className="md:hidden relative w-full h-[100dvh] overflow-hidden bg-black select-none">
        
        {/* Fullscreen Background Video (Muted, no audio) */}
        <video
          ref={mobileVideoRef}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover brightness-[0.85]"
        >
          <source src="/banner_video.mp4" type="video/mp4" />
          <img
            src="/venue_ambience.jpg"
            alt="Tropica Sanctuary Virtual Tour"
            className="w-full h-full object-cover"
          />
        </video>

        {/* Top Vignette Overlay */}
        <div className="absolute top-0 inset-x-0 h-44 bg-gradient-to-b from-black/85 via-black/40 to-transparent pointer-events-none z-10" />

        {/* Top Header Floating Badge & Title (below fixed navbar) */}
        <div className="absolute top-20 inset-x-0 px-5 z-20 flex flex-col items-center text-center space-y-2 pointer-events-none">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 border border-[#C8A96A]/40 backdrop-blur-md pointer-events-auto">
            <Compass className="w-3 h-3 text-[#C8A96A] animate-spin-slow" />
            <span className="font-label text-[9px] uppercase tracking-[0.2em] text-[#C8A96A] font-bold">
              Virtual Tour
            </span>
            <span className="text-white/30">•</span>
            <span className="font-label text-[8px] uppercase tracking-wider text-emerald-400">
              360° View Coming Soon
            </span>
          </div>

          <h1 className="font-headline text-2xl text-white italic tracking-tight drop-shadow-md">
            Explore <span className="text-[#C8A96A]">Tropica Sanctuary</span>
          </h1>
        </div>

        {/* Floating Controls on Right Side (Play/Pause & Fullscreen ONLY - Speaker removed) */}
        <div className="absolute right-4 bottom-56 z-20 flex flex-col gap-3">
          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause video" : "Play video"}
            className="w-11 h-11 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md border border-white/15 shadow-xl active:scale-90 transition-all cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 text-white/80" />
            ) : (
              <Play className="w-4 h-4 text-[#C8A96A] ml-0.5 fill-current" />
            )}
          </button>

          <button
            type="button"
            onClick={handleFullscreen}
            aria-label="Fullscreen"
            className="w-11 h-11 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md border border-white/15 shadow-xl active:scale-90 transition-all cursor-pointer"
          >
            <Maximize2 className="w-4 h-4 text-white/70" />
          </button>
        </div>

        {/* Bottom Pinned CTA Overlay */}
        <div className="absolute bottom-0 inset-x-0 z-20 bg-gradient-to-t from-black via-black/90 to-transparent pt-12 pb-7 px-4">
          <div className="rounded-2xl border border-[#C8A96A]/30 bg-[#0F2D24]/85 backdrop-blur-xl p-4 shadow-[0_10px_35px_rgba(0,0,0,0.8)] space-y-3">
            
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-label text-[9px] uppercase tracking-[0.25em] text-[#C8A96A] font-bold">
                  In-Person Walkthrough
                </span>
                <span className="text-[10px] text-emerald-400 font-mono font-medium">
                  100% Credited Back
                </span>
              </div>
              <h2 className="font-headline text-lg text-white italic">
                Want to experience Tropica physically?
              </h2>
              <p className="font-body text-white/70 text-[11px] leading-snug line-clamp-2">
                Book a physical walkthrough of the sanctuary. The <span className="text-[#C8A96A] font-semibold">$25 tour deposit</span> is fully credited toward your venue booking.
              </p>
            </div>

            {/* Prominent Mobile CTA Button */}
            <button
              type="button"
              onClick={handleOpenModal}
              className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#C8A96A] via-[#E8CB8A] to-[#C8A96A] text-[#071912] font-label text-[11px] uppercase tracking-[0.2em] font-black active:scale-95 transition-all shadow-[0_0_25px_rgba(200,169,106,0.35)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Book a Tour Physically — $25</span>
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </button>
          </div>
        </div>

      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. DESKTOP / TABLET CINEMATIC EXPERIENCE
          Spacious layout with high-definition walkthrough player
      ─────────────────────────────────────────────────────────────── */}
      <main className="hidden md:block min-h-screen bg-[#071912] text-white pt-28 pb-20 px-6 lg:px-12 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-[#C8A96A]/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-5xl mx-auto space-y-10 relative z-10">
          
          {/* Header */}
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C8A96A]/10 border border-[#C8A96A]/30 backdrop-blur-md">
              <Compass className="w-3.5 h-3.5 text-[#C8A96A] animate-spin-slow" />
              <span className="font-label text-[10px] uppercase tracking-[0.25em] text-[#C8A96A] font-bold">
                Virtual Tour
              </span>
              <span className="text-white/30">•</span>
              <span className="font-label text-[9px] uppercase tracking-wider text-emerald-400">
                360° View Coming Soon
              </span>
            </div>

            <h1 className="font-headline text-4xl lg:text-6xl text-white italic tracking-tight leading-tight">
              Explore <span className="text-[#C8A96A]">Tropica Sanctuary</span>
            </h1>

            <p className="font-body text-white/70 text-sm md:text-base leading-relaxed">
              Take a virtual preview of our private garden venue. Discover our intimate dining alcoves, 
              lush botanical aesthetics, and bespoke celebratory ambiance before scheduling your visit.
            </p>
          </div>

          {/* Desktop Video Player (Muted, Speaker removed) */}
          <div className="relative rounded-3xl overflow-hidden border border-[#C8A96A]/25 shadow-[0_20px_80px_rgba(0,0,0,0.8)] bg-black/60 group">
            <video
              ref={desktopVideoRef}
              autoPlay
              loop
              muted
              playsInline
              className="w-full aspect-video object-cover brightness-[0.9] transition-all duration-700"
            >
              <source src="/banner_video.mp4" type="video/mp4" />
              <img
                src="/venue_ambience.jpg"
                alt="Tropica Sanctuary Virtual Tour"
                className="w-full h-full object-cover"
              />
            </video>

            {/* Overlay badge */}
            <div className="absolute top-6 left-6 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-label text-[9px] uppercase tracking-widest text-white/80 font-bold">
                Interactive 360° Panoramic View Coming Soon
              </span>
            </div>

            {/* Desktop Control Bar (Play/Pause & Fullscreen ONLY - Speaker removed) */}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={togglePlay}
                  aria-label={isPlaying ? "Pause video" : "Play video"}
                  className="w-10 h-10 rounded-full bg-[#C8A96A] text-[#071912] flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                </button>

                <span className="text-xs font-mono text-white/60">
                  HD Walkthrough Preview
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleFullscreen}
                  aria-label="View fullscreen"
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-md transition-all cursor-pointer"
                  title="Fullscreen"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Desktop Action Banner */}
          <div className="rounded-3xl border border-[#C8A96A]/20 bg-gradient-to-b from-[#0F3D2E]/60 to-[#071912] p-8 lg:p-10 backdrop-blur-xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-2 text-center md:text-left">
                <span className="font-label text-[10px] uppercase tracking-[0.3em] text-[#C8A96A] font-bold">
                  In-Person Walkthrough
                </span>
                <h2 className="font-headline text-3xl text-white italic">
                  Want to experience Tropica physically?
                </h2>
                <p className="font-body text-white/60 text-sm max-w-xl">
                  Book a physical walkthrough of the sanctuary. The <span className="text-[#C8A96A] font-bold">$25 tour deposit</span> is 
                  100% credited back towards your private dining or event booking.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenModal}
                className="shrink-0 px-8 py-4 rounded-full bg-gradient-to-r from-[#C8A96A] via-[#E8CB8A] to-[#C8A96A] text-[#071912] font-label text-[11px] uppercase tracking-[0.2em] font-black hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(200,169,106,0.35)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>Book a Tour Physically — $25</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>

        </div>
      </main>

      {/* ─────────────────────────────────────────────────────────────
          3. BEAUTIFUL DESKTOP & MOBILE IN-MODAL STRIPE PAYMENT
          Spacious 2-column desktop layout that fits comfortably on-screen
      ─────────────────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in"
          onClick={handleCloseModal}
        >
          <div 
            className="relative w-full max-w-lg md:max-w-3xl lg:max-w-4xl bg-[#0F2D24] border border-[#C8A96A]/35 rounded-3xl p-5 sm:p-7 md:p-8 shadow-[0_25px_80px_rgba(0,0,0,0.8)] text-white my-auto max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Close Button */}
            <button
              type="button"
              onClick={handleCloseModal}
              disabled={loadingIntent}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-colors cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* VIEW A: SUCCESS CONFIRMATION STATE */}
            {isSuccess ? (
              <div className="text-center py-6 sm:py-10 space-y-5 animate-fade-in max-w-md mx-auto">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <span className="font-label text-[10px] uppercase tracking-[0.25em] text-[#C8A96A] font-bold">
                    Reservation Confirmed
                  </span>
                  <h4 className="font-headline text-3xl italic text-white">
                    We Look Forward to Seeing You
                  </h4>
                  <p className="font-body text-white/70 text-xs sm:text-sm max-w-sm mx-auto leading-relaxed">
                    Thank you, <strong className="text-white">{name}</strong>. Your physical tour walkthrough has been reserved! 
                    Your <span className="text-[#C8A96A] font-bold">$25 deposit</span> is credited to your venue reservation.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-black/40 border border-[#C8A96A]/20 text-left text-xs space-y-2 font-mono">
                  <div className="flex justify-between text-white/60">
                    <span>Contact Phone:</span>
                    <span className="text-white font-semibold">{phone}</span>
                  </div>
                  <div className="flex justify-between text-white/60">
                    <span>Receipt Sent:</span>
                    <span className="text-white truncate max-w-[200px]">{email}</span>
                  </div>
                  <div className="flex justify-between text-white/60 border-t border-white/5 pt-2">
                    <span>Deposit Status:</span>
                    <span className="text-emerald-400 font-bold">Paid ($25.00)</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="w-full py-4 rounded-full bg-gradient-to-r from-[#C8A96A] via-[#E8CB8A] to-[#C8A96A] text-[#071912] font-label text-[11px] uppercase tracking-[0.2em] font-black hover:brightness-110 active:scale-95 transition-all shadow-lg cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              /* VIEW B & C: TWO-COLUMN LUXURY DESKTOP LAYOUT (Sidebar on left, Form/Card on right) */
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-start">
                
                {/* ── LEFT COLUMN (5 cols on desktop): Sanctuary Walkthrough Overview ── */}
                <div className="md:col-span-5 space-y-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#C8A96A]/10 border border-[#C8A96A]/30 mb-2">
                      <Sparkles className="w-3 h-3 text-[#C8A96A]" />
                      <span className="font-label text-[8px] uppercase tracking-[0.25em] text-[#C8A96A] font-bold">
                        In-Person Experience
                      </span>
                    </div>

                    <h3 className="font-headline text-2xl sm:text-3xl italic text-white leading-tight">
                      Book a Physical Tour
                    </h3>
                    <p className="font-body text-white/60 text-xs mt-1 leading-relaxed">
                      A personal guided walkthrough of Tropica Sanctuary before your event.
                    </p>
                  </div>

                  {/* $25 Credit Highlight Card */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-[#071912] to-black/60 border border-[#C8A96A]/25 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-label text-[9px] uppercase tracking-widest text-[#C8A96A] font-bold">
                        Tour Deposit Fee
                      </span>
                      <span className="font-headline text-2xl text-[#C8A96A] font-bold">
                        $25
                      </span>
                    </div>
                    <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>100% credited to your venue booking</span>
                    </div>
                    <p className="text-[11px] text-white/50 leading-snug pt-1 border-t border-white/5">
                      Your $25 deposit guarantees a dedicated coordinator walkthrough and applies directly as a credit toward any date reserved.
                    </p>
                  </div>

                  {/* Highlights list (hidden on small mobile to save vertical space, shown on md:) */}
                  <div className="hidden md:block space-y-2 text-xs text-white/70">
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#C8A96A]" />
                      <span>45-minute private walkthrough</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#C8A96A]" />
                      <span>Explore garden alcoves &amp; private dining</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#C8A96A]" />
                      <span>Meet our on-site event coordinator</span>
                    </div>
                  </div>
                </div>

                {/* ── RIGHT COLUMN (7 cols on desktop): Form or Embedded Payment ── */}
                <div className="md:col-span-7">
                  {clientSecret ? (
                    /* Embedded Card Element (Clean tabs, no repeat fields) */
                    <Elements 
                      stripe={stripePromise} 
                      options={{ 
                        clientSecret, 
                        appearance: { 
                          theme: "night",
                          variables: {
                            colorPrimary: "#C8A96A",
                            colorBackground: "#071912",
                            colorText: "#ffffff",
                            colorDanger: "#ef4444",
                            fontFamily: "inherit",
                            borderRadius: "12px",
                            spacingUnit: "4px"
                          },
                          rules: {
                            ".Input": {
                              backgroundColor: "#071912",
                              borderColor: "rgba(200, 169, 106, 0.3)",
                              color: "#ffffff"
                            },
                            ".Input:focus": {
                              borderColor: "#C8A96A"
                            },
                            ".Label": {
                              color: "rgba(255, 255, 255, 0.6)",
                              fontSize: "11px",
                              textTransform: "uppercase",
                              letterSpacing: "0.1em",
                              fontWeight: "600"
                            }
                          }
                        } 
                      }}
                    >
                      <TourStripeCardForm
                        name={name}
                        email={email}
                        phone={phone}
                        onBack={() => setClientSecret(null)}
                        onSuccess={() => setIsSuccess(true)}
                      />
                    </Elements>
                  ) : (
                    /* Initial Intake: Name, Phone, Email */
                    <form onSubmit={handleInitializePayment} className="space-y-3.5">
                      {/* FIELD 1: FULL NAME */}
                      <div>
                        <label className="font-label text-[10px] uppercase tracking-widest text-[#C8A96A] font-bold block mb-1 flex items-center gap-1.5">
                          <UserIcon className="w-3 h-3 text-[#C8A96A]" />
                          <span>Full Name *</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Eleanor Vance"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#071912] border border-[#C8A96A]/30 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-[#C8A96A] transition-colors"
                          autoFocus
                        />
                      </div>

                      {/* FIELD 2: CONTACT PHONE NUMBER */}
                      <div>
                        <label className="font-label text-[10px] uppercase tracking-widest text-[#C8A96A] font-bold block mb-1 flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-[#C8A96A]" />
                          <span>Phone Number *</span>
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="+1 (555) 000-0000"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#071912] border border-[#C8A96A]/30 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-[#C8A96A] transition-colors font-mono"
                        />
                      </div>

                      {/* FIELD 3: EMAIL ADDRESS */}
                      <div>
                        <label className="font-label text-[10px] uppercase tracking-widest text-[#C8A96A] font-bold block mb-1 flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-[#C8A96A]" />
                          <span>Email Address *</span>
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="eleanor@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#071912] border border-[#C8A96A]/30 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-[#C8A96A] transition-colors"
                        />
                      </div>

                      {/* Terms Checkbox */}
                      <div className="flex items-start gap-2 pt-1">
                        <input
                          type="checkbox"
                          id="tour-terms-checkbox"
                          checked={termsAccepted}
                          onChange={(e) => setTermsAccepted(e.target.checked)}
                          className="mt-0.5 h-3.5 w-3.5 rounded border-gray-600 text-[#C8A96A] accent-[#C8A96A] cursor-pointer"
                        />
                        <label htmlFor="tour-terms-checkbox" className="text-[11px] text-white/70 leading-snug cursor-pointer">
                          I agree to the <span className="text-[#C8A96A] underline">Terms &amp; Conditions</span>. The $25 deposit is 100% credited toward your venue booking.
                        </label>
                      </div>

                      {/* Continue to In-Modal Card Payment Button */}
                      <button
                        type="submit"
                        disabled={loadingIntent}
                        className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#C8A96A] via-[#E8CB8A] to-[#C8A96A] text-[#071912] font-label text-[11px] uppercase tracking-[0.2em] font-black hover:brightness-110 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(200,169,106,0.3)] flex items-center justify-center gap-2 cursor-pointer mt-2"
                      >
                        {loadingIntent ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-[#071912]" />
                            <span>Loading Card Form…</span>
                          </>
                        ) : (
                          <>
                            <span>Proceed to Card Payment — $25</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>

                      <div className="flex items-center justify-center gap-1.5 text-center pt-0.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono">
                          256-Bit SSL Encrypted • Powered by Stripe
                        </span>
                      </div>
                    </form>
                  )}
                </div>

              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}
