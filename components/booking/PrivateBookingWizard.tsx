"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StepPrivateDate } from "./StepPrivateDate";
import { StepPrivateTime } from "./StepPrivateTime";
import { StepOccasionSelection } from "./StepOccasionSelection";
import { StepEventPreferences } from "./StepEventPreferences";
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
  occasion: string;
  needDj: boolean;
  cateringMenu: string;
  needDecoration: boolean;
  decorationStyle?: string;
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
    occasion: "celebration",
    needDj: false,
    cateringMenu: "seafood_buffet",
    needDecoration: false,
    decorationStyle: "tropical_arch",
    guestDetails: {
      name: user?.name || "Guest User",
      email: user?.email || "",
      phone: user?.phone || "",
      notes: "",
      occasion: "celebration",
      agreedToTransactional: true,
      agreedToMarketing: false,
      agreedToTerms: true
    },
  });

  const updateData = (stepData: Partial<PrivateBookingData> & Record<string, any>) => {
    setBookingData((prev) => {
      if (stepData.occasion) {
        return {
          ...prev,
          occasion: stepData.occasion,
          guestDetails: {
            ...prev.guestDetails,
            occasion: stepData.occasion,
          },
        };
      }
      if (stepData.guestDetails) {
        return {
          ...prev,
          ...stepData,
          guestDetails: {
            ...prev.guestDetails,
            ...stepData.guestDetails,
            occasion: prev.occasion || stepData.guestDetails.occasion || "celebration",
          },
        };
      }
      return { ...prev, ...stepData };
    });
  };

  const handleNext = (stepData: any) => {
    updateData(stepData);
    if (currentStep < 6) {
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
    { num: 1, title: "Phone OTP" },
    { num: 2, title: "Calendar Date" },
    { num: 3, title: "Time Slot" },
    { num: 4, title: "Occasion" },
    { num: 5, title: "Preferences & DJ" },
    { num: 6, title: "Payment ($200 Deposit)" }
  ];

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepGuestDetails
            onNext={handleNext}
            initialData={bookingData.guestDetails}
          />
        );
      case 2:
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
      case 3:
        return (
          <StepPrivateTime
            onNext={handleNext}
            date={bookingData.date}
            durationHours={bookingData.durationHours}
            selectedTime={bookingData.time}
          />
        );
      case 4:
        return (
          <StepOccasionSelection
            onNext={handleNext}
            selectedOccasion={bookingData.occasion}
          />
        );
      case 5:
        return (
          <StepEventPreferences
            onNext={handleNext}
            initialNeedDj={bookingData.needDj}
            initialCateringMenu={bookingData.cateringMenu}
            initialNeedDecoration={bookingData.needDecoration}
            initialDecorationStyle={bookingData.decorationStyle}
          />
        );
      case 6:
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
    <div className={cn("mx-auto flex flex-col mt-6 md:mt-8 transition-all duration-700", currentStep === 6 ? "max-w-7xl" : "max-w-4xl")}>
      {/* Progress Tracker - Scrollable horizontally on mobile */}
      <div className="mb-12 px-4 md:px-0">
        <div className="overflow-x-auto pb-6 scrollbar-hide">
          <div className="flex items-center justify-between relative min-w-[480px] md:min-w-0">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[1px] bg-white/10" />
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-[1px] bg-[#C8A96A] transition-all duration-500 ease-out"
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            />
            {steps.map((step) => {
              const isCompleted = currentStep > step.num;
              const isCurrent = currentStep === step.num;
              return (
                <div key={step.num} className="relative z-10 flex flex-col items-center gap-3">
                  <div
                    className={cn(
                      "w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center font-headline transition-all duration-500 text-sm md:text-base",
                      isCompleted
                        ? "bg-[#C8A96A] text-[#0d1612] font-bold shadow-[0_0_15px_rgba(200,169,106,0.4)]"
                        : isCurrent
                          ? "bg-[#0d1612] border-2 border-[#C8A96A] text-[#C8A96A] font-bold shadow-[0_0_20px_rgba(200,169,106,0.3)]"
                          : "bg-[#0d1612] border-2 border-white/10 text-white/40"
                    )}
                  >
                    {isCompleted ? <Check className="w-4 h-4 text-[#0d1612]" /> : step.num}
                  </div>
                  <span
                    className={cn(
                      "absolute -bottom-6 w-max font-label text-[8px] md:text-[10px] uppercase tracking-widest transition-colors duration-300",
                      isCurrent || isCompleted ? "text-[#C8A96A]" : "text-white/40"
                    )}
                  >
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex-1 bg-background/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 md:p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#C8A96A]/50 to-transparent opacity-50" />

        {renderStep()}

        {/* Navigation */}
        <div className="mt-12 pt-8 border-t border-white/10 flex justify-between items-center">
          <button
            onClick={handleBack}
            className="text-white/60 hover:text-white transition-colors font-label tracking-widest text-xs uppercase px-4 py-2 font-bold"
          >
            {currentStep === 1 ? "Cancel" : "Back"}
          </button>
        </div>
      </div>
    </div>
  );
};
