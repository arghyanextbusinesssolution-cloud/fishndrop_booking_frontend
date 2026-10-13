"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StepPrivateDate } from "./StepPrivateDate";
import { StepPrivateTime } from "./StepPrivateTime";
import { StepOccasionSelection } from "./StepOccasionSelection";
import { StepEventPreferences } from "./StepEventPreferences";
import { StepMenuSelection } from "./StepMenuSelection";
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
  needPhotographer: boolean;
  photographerHours: number;
  cateringMenu: string;
  selectedDishes?: string[];
  dishQuantities?: Record<string, number>;
  cateringNotes?: string;
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
    durationHours: 5,
    time: null,
    occasion: "celebration",
    needDj: false,
    needPhotographer: false,
    photographerHours: 2,
    cateringMenu: "none",
    selectedDishes: [],
    dishQuantities: {},
    cateringNotes: "",
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
    if (currentStep === 5) {
      const chosenCatering = stepData.cateringMenu ?? bookingData.cateringMenu;
      if (!chosenCatering || chosenCatering === "none") {
        setCurrentStep(7);
        return;
      }
    }
    if (currentStep < 7) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep === 7) {
      if (!bookingData.cateringMenu || bookingData.cateringMenu === "none") {
        setCurrentStep(5);
        return;
      }
    }
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    } else {
      router.push("/");
    }
  };

  const steps = [
    { num: 1, title: "Guest Details" },
    { num: 2, title: "Calendar Date" },
    { num: 3, title: "Time Slot" },
    { num: 4, title: "Occasion" },
    { num: 5, title: "Preferences & DJ" },
    { num: 6, title: "Curate Menu" },
    { num: 7, title: "Payment ($300 Deposit)" }
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
            initialNeedPhotographer={bookingData.needPhotographer}
            initialPhotographerHours={bookingData.photographerHours}
          />
        );
      case 6:
        return (
          <StepMenuSelection
            restaurantId={bookingData.cateringMenu}
            initialSelectedDishes={bookingData.selectedDishes}
            initialDishQuantities={bookingData.dishQuantities}
            initialCateringNotes={bookingData.cateringNotes}
            onNext={handleNext}
            onChangeRestaurant={(newRestaurantId) => updateData({ cateringMenu: newRestaurantId })}
          />
        );
      case 7:
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
    <div className={cn("mx-auto flex flex-col mt-2 md:mt-4 transition-all duration-700", currentStep === 7 ? "max-w-7xl" : "max-w-4xl")}>
      {/* ─── Mobile-Friendly Progress Header (< sm screens) ─── */}
      <div className="sm:hidden mb-4 px-1 space-y-2">
        <div className="flex items-center justify-between text-xs font-medium">
          <span className="font-label text-[10px] uppercase tracking-wider text-[#C8A96A] font-bold">
            Step {currentStep} of {steps.length}
          </span>
          <span className="text-[11px] font-semibold text-white/90 truncate max-w-[200px]">
            {steps[currentStep - 1]?.title}
          </span>
        </div>
        {/* Compact Segmented Progress Bar for mobile */}
        <div className="grid grid-cols-7 gap-1">
          {steps.map((step) => {
            const isCompleted = currentStep > step.num;
            const isCurrent = currentStep === step.num;
            return (
              <div
                key={step.num}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  isCompleted
                    ? "bg-[#C8A96A]"
                    : isCurrent
                      ? "bg-[#C8A96A] ring-2 ring-[#C8A96A]/40 shadow-sm"
                      : "bg-white/15"
                )}
              />
            );
          })}
        </div>
      </div>

      {/* ─── Desktop Stepper Tracker (sm+ screens) ─── */}
      <div className="hidden sm:block mb-4 sm:mb-6 px-2 md:px-0">
        <div className="overflow-x-auto pb-4 pt-1 scrollbar-hide">
          <div className="flex items-start justify-between relative min-w-[620px] md:min-w-0 px-3">
            {/* Background line aligned with circle center */}
            <div className="absolute left-6 right-6 top-4 md:top-5 h-[2px] bg-white/10 -z-0" />
            
            {/* Active filled line */}
            <div
              className="absolute left-6 top-4 md:top-5 h-[2px] bg-[#C8A96A] transition-all duration-500 ease-out -z-0"
              style={{ width: `calc(${((currentStep - 1) / (steps.length - 1)) * 100}% - 1.5rem)` }}
            />

            {steps.map((step) => {
              const isCompleted = currentStep > step.num;
              const isCurrent = currentStep === step.num;
              return (
                <div key={step.num} className="relative z-10 flex flex-col items-center text-center gap-1.5 w-16 sm:w-20 md:w-24">
                  <div
                    className={cn(
                      "w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-headline transition-all duration-500 text-xs md:text-base shrink-0 shadow-md",
                      isCompleted
                        ? "bg-[#C8A96A] text-[#0d1612] font-bold shadow-[0_0_15px_rgba(200,169,106,0.4)]"
                        : isCurrent
                          ? "bg-[#0d1612] border-2 border-[#C8A96A] text-[#C8A96A] font-bold shadow-[0_0_20px_rgba(200,169,106,0.3)] ring-4 ring-[#C8A96A]/20"
                          : "bg-[#0d1612] border-2 border-white/10 text-white/40"
                    )}
                  >
                    {isCompleted ? <Check className="w-4 h-4 text-[#0d1612]" /> : step.num}
                  </div>
                  <span
                    className={cn(
                      "font-label text-[9px] md:text-[10px] uppercase tracking-wider leading-tight text-center font-medium transition-colors duration-300",
                      isCurrent || isCompleted ? "text-[#C8A96A] font-bold" : "text-white/40"
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

      <div className="flex-1 bg-background/40 backdrop-blur-md border border-white/5 rounded-2xl p-3.5 sm:p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#C8A96A]/50 to-transparent opacity-50" />

        {renderStep()}

        {/* Navigation Back / Cancel */}
        <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center">
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
