"use client";

import { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  Maximize2,
  Compass,
  Calendar,
  ArrowRight,
} from "lucide-react";

// GHL calendar for free in-person walkthroughs
const GHL_TOUR_CALENDAR_URL = "https://api.leadconnectorhq.com/widget/booking/hh2gGpKwljrlKAb3FzN1";

// ── Main Tour Booking Page Component ──
export function TourBookingPage() {
  // Video player state — MUTED always, no speaker button
  const desktopVideoRef = useRef<HTMLVideoElement | null>(null);
  const mobileVideoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);


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

  // Free walkthrough: send the visitor straight to the GHL booking calendar
  const handleBookTour = () => {
    window.open(GHL_TOUR_CALENDAR_URL, "_blank", "noopener,noreferrer");
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
                  Free
                </span>
              </div>
              <h2 className="font-headline text-lg text-white italic">
                Want to experience Tropica physically?
              </h2>
              <p className="font-body text-white/70 text-[11px] leading-snug line-clamp-2">
                Book a <span className="text-[#C8A96A] font-semibold">free</span> physical walkthrough of the sanctuary. Pick a time that suits you.
              </p>
            </div>

            {/* Prominent Mobile CTA Button */}
            <button
              type="button"
              onClick={handleBookTour}
              className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#C8A96A] via-[#E8CB8A] to-[#C8A96A] text-[#071912] font-label text-[11px] uppercase tracking-[0.2em] font-black active:scale-95 transition-all shadow-[0_0_25px_rgba(200,169,106,0.35)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Book a Free Tour</span>
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
                  Book a <span className="text-[#C8A96A] font-bold">free</span> physical walkthrough of the sanctuary.
                  Pick a time on our calendar and meet our event coordinator on-site.
                </p>
              </div>

              <button
                type="button"
                onClick={handleBookTour}
                className="shrink-0 px-8 py-4 rounded-full bg-gradient-to-r from-[#C8A96A] via-[#E8CB8A] to-[#C8A96A] text-[#071912] font-label text-[11px] uppercase tracking-[0.2em] font-black hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(200,169,106,0.35)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>Book a Free Tour</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>

        </div>
      </main>
    </>
  );
}
