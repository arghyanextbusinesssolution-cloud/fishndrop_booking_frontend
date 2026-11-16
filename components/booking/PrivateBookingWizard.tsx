"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { StepPrivateDate } from "./StepPrivateDate";
import { StepPrivateTime } from "./StepPrivateTime";
import { StepPrivateGuests, MIN_PRIVATE_GUESTS } from "./StepPrivateGuests";
import { StepPhoneVerification } from "./StepPhoneVerification";
import { StepBirthday } from "./StepBirthday";
import { StepOccasionSelection } from "./StepOccasionSelection";
import { StepAddonCardsHub } from "./StepAddonCardsHub";
import StepPrivateSummary from "./StepPrivateSummary";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { StepVenueSelect, TROPICA_VENUE_ID } from "@/components/marketplace/StepVenueSelect";
import { StepVenueGuests } from "@/components/marketplace/StepVenueGuests";
import { StepVenueTime } from "@/components/marketplace/StepVenueTime";
import { StepVenueRequestSummary } from "@/components/marketplace/StepVenueRequestSummary";
import { VenueThemeProvider } from "@/components/marketplace/VenueThemeProvider";
import type { CustomerPrice, MarketplaceVenue } from "@/types";

type StepKey =
  | "date"
  | "venue"
  | "guests"
  | "time"
  | "verify"
  | "birthday"
  | "occasion"
  | "addons"
  | "checkout"
  | "request";

/** Tropica's own venue keeps its full flow (add-ons + deposit checkout). */
const TROPICA_STEPS: Array<{ key: StepKey; title: string }> = [
  { key: "date", title: "Calendar Date" },
  { key: "venue", title: "Venue" },
  { key: "guests", title: "Guests" },
  { key: "time", title: "Time & Duration" },
  { key: "verify", title: "Verification & Host" },
  { key: "birthday", title: "Birthday" },
  { key: "occasion", title: "Party Occasion" },
  { key: "addons", title: "Add-ons Hub" },
  { key: "checkout", title: "Checkout & Deposit" }
];

/** Partner venues: same flow, but it ends in a request the venue owner confirms before payment. */
const PARTNER_STEPS: Array<{ key: StepKey; title: string }> = [
  { key: "date", title: "Calendar Date" },
  { key: "venue", title: "Venue" },
  { key: "guests", title: "Guests" },
  { key: "time", title: "Time Slot" },
  { key: "verify", title: "Verification & Host" },
  { key: "birthday", title: "Birthday" },
  { key: "occasion", title: "Party Occasion" },
  { key: "request", title: "Send Request" }
];

interface PrivateBookingData {
  // Marketplace: which venue ("tropica" or a partner venue id) + the partner's details
  venueId: string | null;
  venue: MarketplaceVenue | null;
  endTime?: string;
  packageId?: string;
  packageName?: string;
  price?: CustomerPrice;
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
    dateOfBirth?: string; // "YYYY-MM-DD", optional (birthday bonus)
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
    venueId: null,
    venue: null,
    date: null,
    guests: MIN_PRIVATE_GUESTS,
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
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      dateOfBirth: user?.dateOfBirth || "",
      notes: "",
      occasion: "celebration",
      agreedToTransactional: true,
      agreedToMarketing: false,
      agreedToTerms: true
    },
  });

  const updateData = (stepData: Partial<PrivateBookingData> & Record<string, any>) => {
    setBookingData((prev) => {
      // Switching venue invalidates the guest count / slot / price picked for the old one
      if ("venueId" in stepData && stepData.venueId !== prev.venueId) {
        const partner = stepData.venue as MarketplaceVenue | null;
        return {
          ...prev,
          venueId: stepData.venueId ?? null,
          venue: partner,
          guests: partner ? partner.minGuests : MIN_PRIVATE_GUESTS,
          durationHours: partner ? partner.minHours : 5,
          time: null,
          endTime: undefined,
          packageId: undefined,
          packageName: undefined,
          price: undefined
        };
      }
      // A new date means slots must be re-picked
      if ("date" in stepData && stepData.date !== prev.date) {
        return { ...prev, date: stepData.date ?? null, time: null, endTime: undefined };
      }

      // If occasion was selected
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

      // If phone and name/email were provided from StepPhoneVerification
      if (stepData.phone) {
        return {
          ...prev,
          guestDetails: {
            ...prev.guestDetails,
            phone: stepData.phone,
            name: stepData.name || prev.guestDetails.name,
            dateOfBirth: stepData.dateOfBirth ?? prev.guestDetails.dateOfBirth,
            email: stepData.email || prev.guestDetails.email || `guest_${stepData.phone.replace(/\D/g, "")}@tropica.nyc`
          }
        };
      }

      if (stepData.guestDetails) {
        return {
          ...prev,
          ...stepData,
          guestDetails: {
            ...prev.guestDetails,
            ...stepData.guestDetails
          }
        };
      }

      return { ...prev, ...stepData };
    });
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [currentStep]);

  const handleNext = (stepData: any = {}) => {
    updateData(stepData);
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    if (currentStep < steps.length) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    } else {
      router.push("/");
    }
  };

  const partner = bookingData.venueId && bookingData.venueId !== TROPICA_VENUE_ID ? bookingData.venue : null;
  const steps = (partner ? PARTNER_STEPS : TROPICA_STEPS).map((s, i) => ({ ...s, num: i + 1 }));
  const currentKey = steps[currentStep - 1]?.key;

  const renderStep = () => {
    if (partner) {
      switch (currentKey) {
        case "guests":
          return <StepVenueGuests venue={partner} date={bookingData.date} initialGuests={bookingData.guests} onNext={handleNext} />;
        case "time":
          return (
            <StepVenueTime
              venue={partner}
              date={bookingData.date}
              initial={{ time: bookingData.time ?? undefined, durationHours: bookingData.durationHours, packageId: bookingData.packageId }}
              onNext={handleNext}
            />
          );
        case "request":
          return <StepVenueRequestSummary venue={partner} data={bookingData} />;
      }
    }
    switch (currentKey) {
      case "date":
        return (
          <StepPrivateDate
            onNext={handleNext}
            initialData={{
              date: bookingData.date,
            }}
          />
        );
      case "venue":
        return <StepVenueSelect date={bookingData.date} selectedId={bookingData.venueId} onNext={handleNext} />;
      case "guests":
        return <StepPrivateGuests onNext={handleNext} date={bookingData.date} initialGuests={bookingData.guests} />;
      case "time":
        return (
          <StepPrivateTime
            onNext={handleNext}
            date={bookingData.date}
            guests={bookingData.guests}
            initialDurationHours={bookingData.durationHours}
            selectedTime={bookingData.time}
          />
        );
      case "verify":
        return (
          <StepPhoneVerification
            onNext={handleNext}
            initialPhone={bookingData.guestDetails.phone}
            initialName={bookingData.guestDetails.name}
            initialEmail={bookingData.guestDetails.email}
          />
        );
      case "birthday":
        return (
          <StepBirthday
            onNext={handleNext}
            initialDob={bookingData.guestDetails.dateOfBirth}
            partyDate={bookingData.date}
          />
        );
      case "occasion":
        return (
          <StepOccasionSelection
            onNext={handleNext}
            selectedOccasion={bookingData.occasion}
          />
        );
      case "addons":
        return (
          <StepAddonCardsHub
            onNext={handleNext}
            initialNeedDj={bookingData.needDj}
            initialNeedPhotographer={bookingData.needPhotographer}
            initialPhotographerHours={bookingData.photographerHours}
            initialCateringMenu={bookingData.cateringMenu}
            initialSelectedDishes={bookingData.selectedDishes}
            initialDishQuantities={bookingData.dishQuantities}
            initialCateringNotes={bookingData.cateringNotes}
          />
        );
      case "checkout":
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
    // Once a partner venue is picked, the whole page (nav, background, wizard) takes its colors.
    // Only the date + venue steps stay Tropica-branded until a partner is chosen.
    <VenueThemeProvider theme={partner && currentKey !== "date" ? partner.theme : null} applyToDocument>
    <div className={cn("mx-auto flex flex-col mt-2 md:mt-4 transition-all duration-700", currentStep === steps.length ? "max-w-7xl" : "max-w-5xl")}>
      {partner && currentKey !== "date" && currentKey !== "venue" && (
        <div className="mb-4 flex items-center justify-center gap-3">
          {partner.logoUrl ? (
            <img src={partner.logoUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-brand/60" />
          ) : (
            <span className="w-10 h-10 rounded-full bg-brand text-brand-ink flex items-center justify-center font-headline text-lg">
              {partner.name.charAt(0)}
            </span>
          )}
          <div className="text-left">
            <p className="font-headline text-lg text-brand-fg leading-tight">{partner.name}</p>
            <p className="text-[10px] uppercase tracking-widest text-brand-fg/50">Booked through Tropica NYC</p>
          </div>
        </div>
      )}
      {/* ─── Mobile-Friendly Progress Header (< sm screens) ─── */}
      <div className="sm:hidden mb-4 px-1 space-y-2">
        <div className="flex items-center justify-between text-xs font-medium">
          <span className="font-label text-[10px] uppercase tracking-wider text-brand font-bold">
            Step {currentStep} of {steps.length}
          </span>
          <span className="text-[11px] font-semibold text-brand-fg/90 truncate max-w-[200px]">
            {steps[currentStep - 1]?.title}
          </span>
        </div>
        {/* Compact Segmented Progress Bar for mobile */}
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
          {steps.map((step) => {
            const isCompleted = currentStep > step.num;
            const isCurrent = currentStep === step.num;
            return (
              <div
                key={step.num}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  isCompleted
                    ? "bg-brand"
                    : isCurrent
                      ? "bg-brand ring-2 ring-brand/40 shadow-sm"
                      : "bg-brand-fg/15"
                )}
              />
            );
          })}
        </div>
      </div>

      {/* ─── Desktop Stepper Tracker (sm+ screens) ─── */}
      <div className="hidden sm:block mb-4 sm:mb-6 px-2 md:px-0">
        <div className="overflow-x-auto pb-4 pt-1 scrollbar-hide">
          <div className="flex items-start justify-between relative min-w-[580px] md:min-w-0 px-3">
            {/* Background line aligned with circle center */}
            <div className="absolute left-6 right-6 top-4 md:top-5 h-[2px] bg-brand-fg/10 -z-0" />
            
            {/* Active filled line */}
            <div
              className="absolute left-6 top-4 md:top-5 h-[2px] bg-brand transition-all duration-500 ease-out -z-0"
              style={{ width: `calc(${((currentStep - 1) / (steps.length - 1)) * 100}% - 1.5rem)` }}
            />

            {steps.map((step) => {
              const isCompleted = currentStep > step.num;
              const isCurrent = currentStep === step.num;
              return (
                <div key={step.num} className="relative z-10 flex flex-col items-center text-center gap-1.5 w-20 sm:w-24 md:w-28">
                  <div
                    className={cn(
                      "w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-headline transition-all duration-500 text-xs md:text-base shrink-0 shadow-md",
                      isCompleted
                        ? "bg-brand text-brand-ink font-bold shadow-[0_0_15px_rgb(var(--brand)/0.4)]"
                        : isCurrent
                          ? "bg-brand-ink border-2 border-brand text-brand font-bold shadow-[0_0_20px_rgb(var(--brand)/0.3)] ring-4 ring-brand/20"
                          : "bg-brand-ink border-2 border-brand-fg/10 text-brand-fg/40"
                    )}
                  >
                    {isCompleted ? <Check className="w-4 h-4 text-brand-ink" /> : step.num}
                  </div>
                  <span
                    className={cn(
                      "font-label text-[9px] md:text-[10px] uppercase tracking-wider leading-tight text-center font-medium transition-colors duration-300",
                      isCurrent || isCompleted ? "text-brand font-bold" : "text-brand-fg/40"
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

      <div className="flex-1 bg-background/40 backdrop-blur-md border border-brand-fg/5 rounded-2xl p-2.5 sm:p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand/50 to-transparent opacity-50" />

        {renderStep()}

        {/* Navigation Back / Cancel */}
        <div className="mt-6 pt-4 border-t border-brand-fg/10 flex justify-between items-center">
          <button
            onClick={handleBack}
            className="text-brand-fg/60 hover:text-brand-fg transition-colors font-label tracking-widest text-xs uppercase px-4 py-2 font-bold cursor-pointer"
          >
            {currentStep === 1 ? "Cancel" : "Back"}
          </button>
        </div>
      </div>
    </div>
    </VenueThemeProvider>
  );
};
