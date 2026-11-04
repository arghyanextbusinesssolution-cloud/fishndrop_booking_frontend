"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Compass, 
  Calendar, 
  ShieldCheck, 
  ArrowRight, 
  Phone, 
  User as UserIcon, 
  Mail, 
  CheckCircle2, 
  Sparkles,
  X
} from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";

export function TourBookingPage() {
  const { user, isAuthenticated } = useAuthStore();
  
  // Video player state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Booking form state
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Auto-fill details from logged-in user
  useEffect(() => {
    if (user) {
      if (user.phone) setPhone(user.phone);
      if (user.name) setName(user.name);
      if (user.email) setEmail(user.email);
    }
  }, [user]);

  // Video controls
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  const handleBookTour = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone.trim()) {
      toast.error("Please enter your contact phone number");
      return;
    }

    const finalName = name.trim() || user?.name || "";
    const finalEmail = email.trim() || user?.email || "";

    if (!finalName) {
      toast.error("Please provide your full name");
      return;
    }

    if (!finalEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(finalEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!termsAccepted) {
      toast.error("Please accept the terms & conditions to proceed");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/payments/tour-checkout-session", {
        name: finalName,
        email: finalEmail,
        phone: phone.trim(),
        userId: user?.id || undefined
      });

      if (data?.url && typeof window !== "undefined") {
        window.location.href = data.url;
      } else {
        toast.error("Could not initiate payment. Please try again.");
      }
    } catch (err: any) {
      console.error("Tour checkout error:", err);
      toast.error(err?.response?.data?.message || "Failed to start payment session. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#071912] text-white pt-28 pb-20 px-4 sm:px-6 md:px-12 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-[#C8A96A]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-12 relative z-10">
        
        {/* Header Section */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          {/* Virtual Tour Tag */}
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

          <h1 className="font-headline text-3xl sm:text-5xl md:text-6xl text-white italic tracking-tight leading-tight">
            Explore <span className="text-[#C8A96A]">Tropica Sanctuary</span>
          </h1>

          <p className="font-body text-white/70 text-sm md:text-base leading-relaxed">
            Take a virtual preview of our private garden venue. Discover our intimate dining alcoves, 
            lush botanical aesthetics, and bespoke celebratory ambiance before scheduling your visit.
          </p>
        </div>

        {/* ── CINEMATIC VIRTUAL TOUR VIDEO PLAYER ── */}
        <div className="relative rounded-3xl overflow-hidden border border-[#C8A96A]/25 shadow-[0_20px_80px_rgba(0,0,0,0.8)] bg-black/60 group">
          
          <video
            ref={videoRef}
            autoPlay
            loop
            muted={isMuted}
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

          {/* Top Video Overlay: 360° Teaser Pill */}
          <div className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-label text-[9px] uppercase tracking-widest text-white/80 font-bold">
              Interactive 360° Panoramic View Coming Soon
            </span>
          </div>

          {/* Video Control Bar */}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 sm:p-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? "Pause video" : "Play video"}
                className="w-10 h-10 rounded-full bg-[#C8A96A] text-[#071912] flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>

              <button
                type="button"
                onClick={toggleMute}
                aria-label={isMuted ? "Unmute audio" : "Mute audio"}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-md transition-all"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-white/70" /> : <Volume2 className="w-4 h-4 text-[#C8A96A]" />}
              </button>

              <span className="text-xs font-mono text-white/60 hidden sm:inline-block">
                HD Walkthrough Preview
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleFullscreen}
                aria-label="View fullscreen"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-md transition-all"
                title="Fullscreen"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ── ACTION SECTION: "Book A Tour Physically" ── */}
        <div className="rounded-3xl border border-[#C8A96A]/20 bg-gradient-to-b from-[#0F3D2E]/60 to-[#071912] p-6 sm:p-10 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-2 text-center md:text-left">
              <span className="font-label text-[10px] uppercase tracking-[0.3em] text-[#C8A96A] font-bold">
                In-Person Walkthrough
              </span>
              <h2 className="font-headline text-2xl sm:text-3xl text-white italic">
                Want to experience Tropica physically?
              </h2>
              <p className="font-body text-white/60 text-xs sm:text-sm max-w-xl">
                Book a physical walkthrough of the sanctuary. The <span className="text-[#C8A96A] font-bold">$25 tour deposit</span> is 
                100% credited back towards your private dining or event booking.
              </p>
            </div>

            {/* Direct CTA Button to open booking */}
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="w-full md:w-auto shrink-0 px-8 py-4 rounded-full bg-gradient-to-r from-[#C8A96A] via-[#E8CB8A] to-[#C8A96A] text-[#071912] font-label text-[11px] uppercase tracking-[0.2em] font-black hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(200,169,106,0.35)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Book a Tour Physically — $25</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>

      </div>

      {/* ── MODAL: PHYSICAL TOUR BOOKING FORM ── */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
          onClick={() => !loading && setIsModalOpen(false)}
        >
          <div 
            className="relative w-full max-w-lg bg-[#0F2D24] border border-[#C8A96A]/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-white my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={loading}
              className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div>
              <span className="font-label text-[10px] uppercase tracking-[0.3em] text-[#C8A96A] font-bold block mb-1">
                Reservation Step
              </span>
              <h3 className="font-headline text-2xl sm:text-3xl italic text-white">
                Book a Tour Physically
              </h3>
              <p className="font-body text-white/60 text-xs mt-1">
                A personal guided walkthrough of Tropica Sanctuary with our team.
              </p>
            </div>

            {/* Logged In Status Pill */}
            {isAuthenticated && user && (
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="truncate">
                  <span className="text-white/60 block text-[10px] uppercase tracking-wider font-bold">Logged in as</span>
                  <span className="text-emerald-300 font-semibold truncate">{user.name || "Customer"}</span>
                  <span className="text-white/40 ml-1 font-mono text-[11px]">({user.email})</span>
                </div>
              </div>
            )}

            {/* Booking Form */}
            <form onSubmit={handleBookTour} className="space-y-4">
              
              {/* FIELD 1: PHONE NUMBER (COMES FIRST AS REQUESTED) */}
              <div>
                <label className="font-label text-[10px] uppercase tracking-widest text-[#C8A96A] font-bold block mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#C8A96A]" />
                  <span>Contact Phone Number *</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#071912] border border-[#C8A96A]/30 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-[#C8A96A] transition-colors font-mono"
                  autoFocus
                />
                <p className="text-[10px] text-white/40 mt-1">Our coordinator will call/text you to coordinate your tour timing.</p>
              </div>

              {/* FIELD 2: FULL NAME */}
              <div>
                <label className="font-label text-[10px] uppercase tracking-widest text-white/60 font-bold block mb-1.5 flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-white/50" />
                  <span>Full Name *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Eleanor Vance"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#071912] border border-[#C8A96A]/20 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-[#C8A96A] transition-colors"
                />
              </div>

              {/* FIELD 3: EMAIL ADDRESS */}
              <div>
                <label className="font-label text-[10px] uppercase tracking-widest text-white/60 font-bold block mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-white/50" />
                  <span>Email Address *</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="eleanor@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#071912] border border-[#C8A96A]/20 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-[#C8A96A] transition-colors"
                />
              </div>

              {/* Fee Breakdown Card */}
              <div className="p-4 rounded-2xl bg-[#071912] border border-[#C8A96A]/20 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="font-label text-[9px] uppercase tracking-widest text-[#C8A96A] font-bold block">
                    Tour Booking Fee
                  </span>
                  <span className="text-white text-xs block font-medium">Physical Walkthrough Guarantee</span>
                  <span className="text-[10px] text-emerald-400 block">100% credited toward your venue booking</span>
                </div>
                <div className="text-right">
                  <span className="font-headline text-3xl text-[#C8A96A] font-bold">$25</span>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="tour-modal-terms"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-600 text-[#C8A96A] accent-[#C8A96A] cursor-pointer"
                />
                <label htmlFor="tour-modal-terms" className="text-xs text-white/60 leading-relaxed cursor-pointer">
                  I agree to the terms. The $25 tour deposit guarantees your slot and is fully credited toward your subsequent reservation.
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-full bg-gradient-to-r from-[#C8A96A] via-[#E8CB8A] to-[#C8A96A] text-[#071912] font-label text-[11px] uppercase tracking-[0.2em] font-black hover:brightness-110 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#071912]/30 border-t-[#071912] rounded-full animate-spin" />
                    <span>Connecting to Stripe…</span>
                  </>
                ) : (
                  <>
                    <span>Pay $25 & Confirm Tour</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-center pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] text-white/40 uppercase tracking-widest">
                  Secure 256-bit Stripe Checkout
                </span>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
