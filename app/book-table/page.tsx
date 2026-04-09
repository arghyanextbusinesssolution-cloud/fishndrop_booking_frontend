"use client";

import { Suspense } from "react";
import { BookingWizard } from "@/components/booking/BookingWizard";

export default function BookTablePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 rounded-full border-4 border-primary-container border-t-primary animate-spin" />
      </div>
    }>
      <BookingWizard />
    </Suspense>
  );
}
