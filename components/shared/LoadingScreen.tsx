"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface LoadingScreenProps {
  isLoading: boolean;
  onFinished?: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  isLoading,
  onFinished,
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const [shouldRender, setShouldRender] = useState(true);
  const [progress, setProgress] = useState(0);

  // Constants for slats
  const SLAT_COUNT = 10;
  const slats = Array.from({ length: SLAT_COUNT });

  useEffect(() => {
    // Initial progress animation
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, 30);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isLoading && progress >= 100) {
      setIsExiting(true);
      // Duration (800ms) + Stagger Delay (9 * 80ms) + Safety Margin (100ms)
      const timer = setTimeout(() => {
        setShouldRender(false);
        if (onFinished) onFinished();
      }, 1620);
      return () => clearTimeout(timer);
    }
  }, [isLoading, progress, onFinished]);

  if (!shouldRender) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden font-body">
      {/* Background Shutter Slats */}
      <div className="absolute inset-0 flex">
        {slats.map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-full flex-1 bg-[#0F3D2E] transition-transform duration-800 ease-[cubic-bezier(0.85,0,0.15,1)]",
              isExiting ? "-translate-y-full" : "translate-y-0"
            )}
            style={{
              transitionDelay: `${i * 80}ms`,
            }}
          />
        ))}
      </div>

      {/* Loading Content - Fades out before shutter opens */}
      <div
        className={cn(
          "relative z-10 flex flex-col items-center gap-12 max-w-lg px-8 text-center transition-all duration-700",
          isExiting ? "opacity-0 scale-95 blur-sm" : "opacity-100 scale-100 blur-0"
        )}
      >
        {/* Elegant Brand Identity */}
        <div className="animate-fade-in-slow flex flex-col items-center gap-6">
          <div className="relative w-[600px] h-[200px]">
            <Image
              src="/tropica-logo.png"
              alt="Tropica"
              fill
              className="object-contain"
              priority
            />
          </div>
          <p className="font-label uppercase tracking-[0.4em] text-[10px] text-[#E5E7EB]/40 ml-1">
            Exquisite Tropical Dining
          </p>
        </div>

        {/* Minimalist Loading Indicator */}
        <div className="w-64 h-[2px] bg-[#E5E7EB]/10 relative overflow-hidden ring-1 ring-[#E5E7EB]/5">
          {/* Shimmer Effect */}
          <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-transparent via-[#E5E7EB] to-transparent w-full animate-shimmer"></div>
          {/* Progress Fill */}
          <div
            className="absolute top-0 left-0 h-full bg-[#E5E7EB] shadow-[0_0_10px_rgba(229,231,235,0.5)] transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Quote */}
        <div className="animate-fade-in-slow" style={{ animationDelay: "0.8s" }}>
          <p className="font-headline italic text-lg md:text-xl font-extralight tracking-tight text-[#E5E7EB]/70">
            "Culinary excellence in every moment."
          </p>
        </div>

        {/* Dynamic Micro-Interactions */}
        <div className="flex gap-4 items-center justify-center mt-4">
          <span className="animate-shimmer-slow w-1 h-1 rounded-full bg-[#E5E7EB]/20"></span>
          <span
            className="animate-shimmer-slow w-1 h-1 rounded-full bg-[#E5E7EB]/20"
            style={{ animationDelay: "0.5s" }}
          ></span>
          <span
            className="animate-shimmer-slow w-1 h-1 rounded-full bg-[#E5E7EB]/20"
            style={{ animationDelay: "1s" }}
          ></span>
        </div>
      </div>

      {/* Decorative Corner Accent */}
      <div
        className={cn(
          "absolute bottom-12 right-12 transition-all duration-700 opacity-20",
          isExiting ? "opacity-0 translate-y-4" : "opacity-20 translate-y-0"
        )}
        style={{ transitionDelay: "1.5s" }}
      >
        <div className="text-4xl text-[#E5E7EB]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2L12 22" />
            <path d="M18 9l-6 6-6-6" />
          </svg>
        </div>
      </div>

      {/* Branding Bottom Anchor */}
      <div
        className={cn(
          "absolute bottom-12 flex flex-col items-center gap-2 transition-all duration-700",
          isExiting ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
        )}
        style={{ transitionDelay: "2s" }}
      >
        <div className="h-8 w-[1px] bg-gradient-to-b from-[#E5E7EB]/30 to-transparent"></div>
        <span className="font-label text-[9px] uppercase tracking-[0.3em] text-[#E5E7EB]/40">
          Est. 1924
        </span>
      </div>

      {/* Aesthetic Border Framing */}
      <div className="fixed inset-0 border-[1.5rem] border-[#0F3D2E] pointer-events-none z-50"></div>
    </div>
  );
};
