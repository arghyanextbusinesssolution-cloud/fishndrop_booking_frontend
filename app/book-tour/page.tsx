"use client";

import { NavBar } from "@/components/shared/NavBar";
import { Footer } from "@/components/shared/Footer";
import { TourBookingPage } from "@/components/tour/TourBookingPage";

export default function BookTourPage() {
  return (
    <div className="theme-astral min-h-screen bg-[#0F3D2E] text-on-surface selection:bg-primary/30 selection:text-primary font-body overflow-x-hidden">
      <NavBar />
      <TourBookingPage />
      <div className="hidden md:block">
        <Footer />
      </div>
    </div>
  );
}
