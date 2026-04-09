"use client";

import { BookingForm } from "@/components/booking/BookingForm";
import Link from "next/link";
import { ArrowLeft, LayoutDashboard } from "lucide-react";

export default function UserBookPage() {
  return (
    <div className="grid min-h-[calc(100vh-7rem)] gap-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 md:grid-cols-[1.05fr_1.35fr] md:p-6">
      <div className="relative hidden overflow-hidden rounded-2xl border border-[var(--border)] bg-[radial-gradient(circle_at_20%_20%,#ff3d7d22_0%,#f3f6ff_45%,#e9effa_100%)] p-6 md:flex md:flex-col md:justify-between">
        <div>
          <div className="flex justify-between items-center mb-12">
            <p className="inline-flex rounded-full border border-pink-400/40 bg-pink-100 px-3 py-1 text-[11px] font-semibold text-pink-700">
              PREMIUM DINING EXPERIENCE
            </p>
            <Link 
              href="/user" 
              className="flex items-center gap-2 group text-[10px] uppercase tracking-widest font-bold text-secondary hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
              Go to Dashboard
            </Link>
          </div>
          <h2 className="mt-4 text-4xl font-bold leading-tight">Reserve Your Perfect Evening</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Choose your date, select a time, tell us your guest count, and we will assign tables automatically.
          </p>
        </div>
        <div className="space-y-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-xs text-[var(--text-secondary)]">
          <p className="font-semibold text-[var(--text-primary)]">Flow</p>
          <p>1. Pick date</p>
          <p>2. Pick time</p>
          <p>3. Enter guests</p>
          <p>4. View table map</p>
          <p>5. Fill details & pay</p>
        </div>
      </div>
      <BookingForm />
    </div>
  );
}
