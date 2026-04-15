"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NavBar } from "@/components/shared/NavBar";
import { Footer } from "@/components/shared/Footer";
import { cn } from "@/lib/utils";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";

// Step Components
import { StepTimeSelection } from "./StepTimeSelection";
import { StepGuestCount } from "./StepGuestCount";
import { StepTableSelection } from "./StepTableSelection";
import { StepGuestDetails } from "./StepGuestDetails";
import { StepOccasionSelection } from "./StepOccasionSelection";
import { StepAddons } from "./StepAddons";
import { StepCakeDetails } from "./StepCakeDetails";
import { StepSummaryPayment } from "./StepSummaryPayment";

interface BookingData {
  date: string | null;
  time: string | null;
  guests: number;
  table: string | null;
  guestDetails: {
    name: string;
    email: string;
    phone: string;
    password?: string;
  };
  occasion: string;
  addons: string[];
  customCakeDetails?: any;
  totalPrice: number;
}

export const BookingWizard = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialDate = searchParams.get("date");
  const { user, setAuth } = useAuthStore();

  const STORAGE_KEY = "fishndrop_wizard_progress";
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(2);
  const [isRestoring, setIsRestoring] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [splitDialogOpen, setSplitDialogOpen] = useState(false);
  const [splitDialogMessage, setSplitDialogMessage] = useState("");
  const [chairConsentOpen, setChairConsentOpen] = useState(false);
  const [bookingData, setBookingData] = useState<BookingData>({
    date: initialDate,
    time: null,
    guests: 2,
    table: null,
    guestDetails: {
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      password: ""
    },
    occasion: "other",
    addons: [],
    totalPrice: 200
  });

  // Load state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const { step: savedStep, data: savedData } = JSON.parse(saved);
        // Only restore if the date hasn't changed in the URL
        if (initialDate === savedData.date) {
          setStep(savedStep);
          setBookingData(savedData);
        } else {
          // If date changed, clear old progress
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (e) {
        console.error("Failed to restore wizard state", e);
      }
    }
    setIsRestoring(false);
  }, [initialDate]);

  // Save state to localStorage on every change
  useEffect(() => {
    if (!isRestoring) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        step,
        data: bookingData
      }));
    }
  }, [step, bookingData, isRestoring]);

  // Sync auth state if user logs in midway
  useEffect(() => {
    if (user && !isRestoring) {
      setBookingData(prev => ({
        ...prev,
        guestDetails: {
          ...prev.guestDetails,
          name: prev.guestDetails.name || user.name,
          email: prev.guestDetails.email || user.email,
          phone: prev.guestDetails.phone || user.phone || ""
        }
      }));
    }
  }, [user, isRestoring]);

  const steps = [
    "Date", "Time", "Guests", "Table", "Details", "Occasion", "Add-ons", "Payment"
  ];

  const handleFinalSubmit = async (allowSplit = false) => {
    setIsSubmitting(true);
    try {
      const payload = {
        partySize: bookingData.guests,
        bookingDate: bookingData.date,
        bookingTime: bookingData.time,
        customerName: bookingData.guestDetails.name,
        customerEmail: bookingData.guestDetails.email,
        customerPhone: bookingData.guestDetails.phone,
        password: bookingData.guestDetails.password || undefined,
        occasion: bookingData.occasion || "other",
        notes: "",
        cakeDetails: bookingData.addons.includes("cake") ? "Signature Birthday Cake" : "",
        customCakeDetails: bookingData.addons.includes("custom_cake") ? bookingData.customCakeDetails : undefined,
        cakePrice: bookingData.addons.includes("custom_cake") && bookingData.customCakeDetails ? bookingData.customCakeDetails.retailPrice : (bookingData.addons.includes("cake") ? 50 : 0),
        userId: user?.id,
        allowSplit
      };

      const { data } = await api.post("/bookings/reserve", payload);

      if (data.success) {
        if (data.token && data.user) {
          setAuth(data.user, data.token);
          toast.success("Reservation confirmed & Account created!");
        } else {
          toast.success("Reservation confirmed!");
        }
        
        // Clear progress and redirect
        localStorage.removeItem(STORAGE_KEY);
        // We also want to clear the local state to prevent any re-renders from re-saving
        setStep(2); 
        setBookingData({
          date: initialDate,
          time: null,
          guests: 2,
          table: null,
          guestDetails: {
            name: user?.name || "",
            email: user?.email || "",
            phone: user?.phone || "",
            password: ""
          },
          occasion: "other",
          addons: [],
          totalPrice: 200
        });
        
        router.push(`/book-table/confirmed?id=${data.booking._id}`);
      }
    } catch (error: any) {
      setIsSubmitting(false);
      const responseData = error.response?.data;
      // Special case: backend needs user approval to split tables
      if (responseData?.code === "SPLIT_APPROVAL_REQUIRED") {
        setSplitDialogMessage(responseData.message || "No single table available. Would you like to join multiple tables?");
        setSplitDialogOpen(true);
        return;
      }
      if (responseData?.errors && Array.isArray(responseData.errors)) {
        responseData.errors.forEach((err: any) => {
          toast.error(`${err.msg}`);
        });
      } else {
        toast.error(responseData?.message || "Something went wrong with your reservation.");
      }
    }
  };

  const handleSplitConfirm = () => {
    setSplitDialogOpen(false);
    handleFinalSubmit(true);
  };

  const handleSplitCancel = () => {
    setSplitDialogOpen(false);
    toast("Please choose a different date or time slot.");
  };

  const handleNext = (data: any) => {
    const updatedData = { ...bookingData, ...data };

    // Calculate total price based on guests ($40 per person)
    const basePrice = updatedData.guests * 40;
    const oldCakePrice = updatedData.addons.includes("cake") ? 50 : 0;
    const customCakePrice = updatedData.addons.includes("custom_cake") && updatedData.customCakeDetails ? updatedData.customCakeDetails.retailPrice : 0;
    const finalPrice = basePrice + oldCakePrice + customCakePrice;

    // Check for 5-guest consent in Step 2 (Guest Count)
    if (step === 2 && updatedData.guests === 5 && !chairConsentOpen) {
      setBookingData({ ...updatedData, totalPrice: finalPrice });
      setChairConsentOpen(true);
      return;
    }

    setBookingData({ ...updatedData, totalPrice: finalPrice });

    let nextStep = step + 1;

    // SKIP Step 5 (Details) if user is logged in and we have their phone
    if (nextStep === 5 && user && updatedData.guestDetails.phone) {
      nextStep = 6;
    }

    // Determine if we need to show Cake Details step (Step 8)
    const needsCakeStep = updatedData.addons.includes("custom_cake");
    const maxSteps = needsCakeStep ? 9 : 8;

    if (step < maxSteps) {
      if (step === 7 && !needsCakeStep) {
        setStep(maxSteps); // Skip to payment if no custom cake
      } else {
        setStep(nextStep);
      }
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      handleFinalSubmit(false);
    }
  };

  const handleChairConsentConfirm = () => {
    setChairConsentOpen(false);
    setStep(3); // Go to Time Selection after consent
  };

  const handleBack = () => {
    let prevStep = step - 1;

    // SKIP Step 5 if going back and user is logged in with phone
    if (prevStep === 5 && user && bookingData.guestDetails.phone) {
      prevStep = 4;
    }

    // Calculate needsCakeStep for back navigation from Payment
    const needsCakeStep = bookingData.addons.includes("custom_cake");
    if (step === (needsCakeStep ? 9 : 8)) {
       prevStep = needsCakeStep ? 8 : 7;
    }

    if (step > 2) {
      setStep(prevStep);
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
    else router.push("/");
  };

  const renderStep = () => {
    switch (step) {
      case 2:
        return <StepGuestCount onNext={handleNext} selectedGuests={bookingData.guests} />;
      case 3:
        return <StepTimeSelection onNext={handleNext} selectedTime={bookingData.time} date={bookingData.date} guests={bookingData.guests} />;
      case 4:
        return <StepTableSelection onNext={handleNext} selectedTable={bookingData.table} guests={bookingData.guests} />;
      case 5:
        return <StepGuestDetails onNext={handleNext} initialData={bookingData.guestDetails} />;
      case 6:
        return <StepOccasionSelection onNext={handleNext} selectedOccasion={bookingData.occasion} />;
      case 7:
        return <StepAddons onNext={handleNext} selectedAddons={bookingData.addons} />;
      case 8:
        if (bookingData.addons.includes("custom_cake")) {
          return <StepCakeDetails onNext={handleNext} onBack={handleBack} initialData={bookingData.customCakeDetails} />;
        }
        return <StepSummaryPayment onNext={() => handleNext({})} bookingData={bookingData} />;
      case 9:
        return <StepSummaryPayment onNext={() => handleNext({})} bookingData={bookingData} />;
      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Split Table Approval Dialog */}
      {splitDialogOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/80 backdrop-blur-md">
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-10 max-w-md w-full space-y-8 shadow-2xl">
            <div className="space-y-3">
              <span className="font-label text-[9px] tracking-[0.3em] uppercase text-primary font-bold block">Table Availability Notice</span>
              <h2 className="font-headline text-3xl italic text-on-surface leading-tight">
                Alternative Arrangement
              </h2>
              <p className="font-body text-secondary text-sm font-light leading-relaxed">
                {splitDialogMessage}
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <button
                onClick={handleSplitConfirm}
                className="w-full bg-gold-gradient text-on-primary font-label text-[10px] tracking-[0.2em] uppercase py-4 rounded-lg shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all duration-300 font-bold"
              >
                Yes, Arrange Multiple Tables
              </button>
              <button
                onClick={handleSplitCancel}
                className="w-full border border-outline-variant/30 text-secondary font-label text-[10px] tracking-[0.2em] uppercase py-4 rounded-lg hover:border-outline-variant/60 hover:text-on-surface transition-all duration-300 font-bold"
              >
                Choose Different Slot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chair Arrangement Consent Dialog (for 5 guests) */}
      {chairConsentOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/80 backdrop-blur-md">
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-10 max-w-md w-full space-y-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gold-gradient" />
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="font-label text-[9px] tracking-[0.3em] uppercase text-primary font-bold block">Seating Arrangement</span>
              </div>
              <h2 className="font-headline text-3xl italic text-on-surface leading-tight">
                Party of Five
              </h2>
              <p className="font-body text-secondary text-sm font-light leading-relaxed">
                To accommodate your party of five, we will utilize one of our premium 4-seater tables and add a complementary <span className="font-bold text-on-surface italic">special corner chair arrangement</span>.
              </p>
              <p className="font-body text-outline text-[11px] italic font-light">
                By proceeding, you acknowledge and consent to this specific seating configuration.
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <button
                onClick={handleChairConsentConfirm}
                className="w-full bg-gold-gradient text-on-primary font-label text-[10px] tracking-[0.2em] uppercase py-4 rounded-lg shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all duration-300 font-bold"
              >
                I Understand & Consent
              </button>
              <button
                onClick={() => {
                  setChairConsentOpen(false);
                  setStep(3);
                }}
                className="w-full border border-outline-variant/30 text-secondary font-label text-[10px] tracking-[0.2em] uppercase py-4 rounded-lg hover:border-outline-variant/60 hover:text-on-surface transition-all duration-300 font-bold"
              >
                Change Guest Count
              </button>
            </div>
          </div>
        </div>
      )}

      <NavBar />

      <main className="flex-grow flex flex-col items-center overflow-hidden">
        <div 
          ref={scrollContainerRef}
          className="w-full flex-grow flex flex-col items-center pt-28 md:pt-32 pb-10 px-4 md:px-12 overflow-y-auto scrollbar-hide"
        >
          {/* Step Indicator */}
          <div className="max-w-4xl w-full mb-12 md:mb-16 shrink-0 overflow-x-auto scrollbar-hide px-2">
            {/* ... (step indicator code remains same) ... */}
            <div className="flex justify-between items-center min-w-[600px] md:min-w-0 relative gap-4 md:gap-8 pb-4">
              {steps.map((label, index) => (
                <div key={label} className="flex flex-col items-center gap-3 md:gap-4 min-w-[60px] md:min-w-[70px] relative z-10">
                  <div className={cn(
                    "w-8 h-8 md:w-10 md:h-10 rounded-full border-2 flex items-center justify-center text-[9px] md:text-[10px] font-bold transition-all duration-700",
                    step === index + 1 ? "bg-primary border-primary text-on-primary scale-110 shadow-xl shadow-primary/20" :
                      step > index + 1 ? "bg-primary-container border-primary-container text-on-primary-container" :
                        "bg-surface border-outline-variant/30 text-outline"
                  )}>
                    {index + 1}
                  </div>
                  <span className={cn(
                    "text-[8px] md:text-[9px] uppercase tracking-[0.2em] font-bold transition-colors duration-700",
                    step === index + 1 ? "text-primary" : "text-outline/60"
                  )}>
                    {label}
                  </span>
                  {index < steps.length - 1 && (
                    <div className={cn(
                      "absolute top-4 md:top-5 left-[calc(50%+16px)] md:left-[calc(50%+20px)] w-[calc(100%+16px)] md:w-[calc(100%+32px)] h-[1px] -z-10 transition-colors duration-1000",
                      step > index + 1 ? "bg-primary-container" : "bg-outline-variant/20"
                    )} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Wizard Content */}
          <div className={cn(
            "w-full max-w-6xl relative pb-20",
            (isSubmitting || isRestoring) && "opacity-50 pointer-events-none transition-opacity"
          )}>
            {(isSubmitting || isRestoring) && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/20 backdrop-blur-[2px]">
                <div className="flex flex-col items-center gap-6">
                  <div className="w-16 h-16 rounded-full border-4 border-primary-container border-t-primary animate-spin" />
                  <p className="font-headline text-2xl italic animate-pulse">
                    {isRestoring ? "Restoring your journey..." : "Crafting your experience..."}
                  </p>
                </div>
              </div>
            )}
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 30, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -30, scale: 1.01 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>

            {/* Persistent Back Action */}
            <div className="mt-12 pt-8 border-t border-outline-variant/10">
              <button
                onClick={handleBack}
                className="text-secondary hover:text-on-surface font-body text-[10px] tracking-widest uppercase font-bold transition-colors flex items-center gap-3 group"
              >
                <div className="w-6 h-px bg-secondary group-hover:bg-primary group-hover:w-8 transition-all" />
                Go Back
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
