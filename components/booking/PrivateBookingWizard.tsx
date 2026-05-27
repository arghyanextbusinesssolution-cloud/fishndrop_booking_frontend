"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StepPrivateDate } from "./StepPrivateDate";
import { StepPrivateTime } from "./StepPrivateTime";
import { StepGuestDetails } from "./StepGuestDetails";
import StepPrivateSummary from "./StepPrivateSummary";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

interface PrivateBookingData {
  date: string | null;
  guests: number;
  durationHours: number;
  time: string | null;
  guestDetails: {
    name: string;
    email: string;
    phone: string;
    notes: string;
    occasion: string;
    agreedToTransactional: boolean;
    agreedToMarketing: boolean;
    agreedToTerms: boolean;
  };
}

export const PrivateBookingWizard = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingData, setBookingData] = useState<PrivateBookingData>({
    date: null,
    guests: 20,
    durationHours: 4,
    time: null,
    guestDetails: {
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      notes: "",
      occasion: "business",
      agreedToTransactional: false,
      agreedToMarketing: false,
      agreedToTerms: false
    },
  });

  const updateData = (stepData: Partial<PrivateBookingData>) => {
    setBookingData((prev) => {
      if (stepData.guestDetails) {
        return {
          ...prev,
          ...stepData,
          guestDetails: {
            ...prev.guestDetails,
            ...stepData.guestDetails,
          },
        };
      }
      return { ...prev, ...stepData };
    });
  };

  const handleNext = (stepData: any) => {
    updateData(stepData);
    if (currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    } else {
      router.push("/");
    }
  };

  const steps = [
    { num: 1, title: "Event Details" },
    { num: 2, title: "Time Slot" },
    { num: 3, title: "Contact" },
    { num: 4, title: "Summary" }
  ];

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepPrivateDate
            onNext={handleNext}
            initialData={{
              date: bookingData.date,
              guests: bookingData.guests,
              durationHours: bookingData.durationHours
            }}
          />
        );
      case 2:
        return (
          <StepPrivateTime
            onNext={handleNext}
            date={bookingData.date}
            durationHours={bookingData.durationHours}
            selectedTime={bookingData.time}
          />
        );
      case 3:
        return (
          <StepGuestDetails
            onNext={handleNext}
            initialData={bookingData.guestDetails}
          />
        );
      case 4:
        return (
          <StepPrivateSummary
            bookingData={bookingData}
            onBack={handleBack}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={cn("mx-auto min-h-[600px] flex flex-col mt-8 transition-all duration-700", currentStep === 4 ? "max-w-7xl" : "max-w-4xl")}>
      {/* Progress Tracker */}
      <div className="mb-12 px-4 md:px-0">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[1px] bg-white/10" />
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-[1px] bg-primary transition-all duration-500 ease-out"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          />
          {steps.map((step) => {
            const isCompleted = currentStep > step.num;
            const isCurrent = currentStep === step.num;
            return (
              <div key={step.num} className="relative z-10 flex flex-col items-center gap-3">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-headline transition-all duration-500",
                    isCompleted
                      ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(212,175,55,0.4)]"
                      : isCurrent
                        ? "bg-background border-2 border-primary text-primary shadow-[0_0_20px_rgba(212,175,55,0.2)]"
                        : "bg-background border-2 border-white/10 text-white/40"
                  )}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : step.num}
                </div>
                <span
                  className={cn(
                    "absolute -bottom-6 w-max font-label text-[10px] uppercase tracking-widest transition-colors duration-300",
                    isCurrent || isCompleted ? "text-primary" : "text-white/40"
                  )}
                >
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 bg-background/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 md:p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />

        {renderStep()}

        {/* Navigation */}
        <div className="mt-12 pt-8 border-t border-white/10 flex justify-between items-center">
          <button
            onClick={handleBack}
            className="text-white/60 hover:text-white transition-colors font-label tracking-widest text-xs uppercase px-4 py-2"
          >
            {currentStep === 1 ? "Cancel" : "Back"}
          </button>
        </div>
      </div>
    </div>
  );
};
