"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NavBar } from "@/components/shared/NavBar";
import { cn } from "@/lib/utils";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";
import { ConfirmationModal } from "@/components/shared/ConfirmationModal";

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
  assignedNote?: string;
}

export const BookingWizard = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialDate = searchParams.get("date");
  const { user, setAuth } = useAuthStore();

  const STORAGE_KEY = "tropica_wizard_progress";
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(2);
  const [isRestoring, setIsRestoring] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [splitDialogOpen, setSplitDialogOpen] = useState(false);
  const [splitDialogMessage, setSplitDialogMessage] = useState("");
  const [chairConsentOpen, setChairConsentOpen] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  
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
        if (initialDate === savedData.date) {
          setStep(savedStep);
          setBookingData(savedData);
        } else {
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
        }
        
        // Initiate Stripe Checkout
        try {
          const { data: stripeData } = await api.post("/payments/checkout-session", {
            bookingId: data.booking._id
          });
          
          if (stripeData.success && stripeData.url) {
            localStorage.removeItem(STORAGE_KEY);
            window.location.href = stripeData.url;
            return;
          }
        } catch (stripeErr) {
          console.error("Stripe initiation failed", stripeErr);
          // Fallback to confirmed page if Stripe fails but booking was created
          localStorage.removeItem(STORAGE_KEY);
          router.push(`/book-table/confirmed?id=${data.booking._id}`);
        }
      }
    } catch (error: any) {
      setIsSubmitting(false);
      const responseData = error.response?.data;
      if (responseData?.code === "SPLIT_APPROVAL_REQUIRED") {
        setSplitDialogMessage(responseData.message || "No single table available. Would you like to join multiple tables?");
        setSplitDialogOpen(true);
        return;
      }
      toast.error(responseData?.message || "Something went wrong with your reservation.");
    }
  };

  const handleSplitConfirm = () => {
    setSplitDialogOpen(false);
    handleFinalSubmit(true);
  };

  const handleNext = (data: any) => {
    const updatedData = { ...bookingData, ...data };
    const basePrice = updatedData.guests * 40;
    const oldCakePrice = updatedData.addons.includes("cake") ? 50 : 0;
    const customCakePrice = updatedData.addons.includes("custom_cake") && updatedData.customCakeDetails ? updatedData.customCakeDetails.retailPrice : 0;
    const finalPrice = basePrice + oldCakePrice + customCakePrice;

    if (step === 2 && updatedData.guests === 5 && !chairConsentOpen) {
      setBookingData({ ...updatedData, totalPrice: finalPrice });
      setChairConsentOpen(true);
      return;
    }

    setBookingData({ ...updatedData, totalPrice: finalPrice });
    let nextStep = step + 1;
    if (nextStep === 5 && user && updatedData.guestDetails.phone) nextStep = 6;
    
    const needsCakeStep = updatedData.addons.includes("custom_cake");
    const maxSteps = needsCakeStep ? 9 : 8;

    if (step < maxSteps) {
      if (step === 7 && !needsCakeStep) setStep(maxSteps);
      else setStep(nextStep);
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      handleFinalSubmit(false);
    }
  };

  const handleBack = () => {
    let prevStep = step - 1;
    if (prevStep === 5 && user && bookingData.guestDetails.phone) prevStep = 4;
    
    const needsCakeStep = bookingData.addons.includes("custom_cake");
    if (step === (needsCakeStep ? 9 : 8)) prevStep = needsCakeStep ? 8 : 7;

    if (step > 2) {
      setStep(prevStep);
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
    else router.push("/");
  };

  const confirmCancel = () => {
    localStorage.removeItem(STORAGE_KEY);
    router.push("/");
  };

  const steps = ["Date", "Time", "Guests", "Table", "Details", "Occasion", "Add-ons", "Payment"];

  const renderStep = () => {
    switch (step) {
      case 2: return <StepGuestCount onNext={handleNext} selectedGuests={bookingData.guests} />;
      case 3: return <StepTimeSelection onNext={handleNext} selectedTime={bookingData.time} date={bookingData.date} guests={bookingData.guests} />;
      case 4: return <StepTableSelection onNext={handleNext} selectedTable={bookingData.table} guests={bookingData.guests} assignedNote={bookingData.assignedNote} />;
      case 5: return <StepGuestDetails onNext={handleNext} initialData={bookingData.guestDetails} />;
      case 6: return <StepOccasionSelection onNext={handleNext} selectedOccasion={bookingData.occasion} />;
      case 7: return <StepAddons onNext={handleNext} selectedAddons={bookingData.addons} />;
      case 8:
        if (bookingData.addons.includes("custom_cake")) {
          return <StepCakeDetails onNext={handleNext} onBack={handleBack} initialData={bookingData.customCakeDetails} />;
        }
        return <StepSummaryPayment onBack={handleBack} goToStep={setStep} bookingData={bookingData} />;
      case 9:
        return <StepSummaryPayment onBack={handleBack} goToStep={setStep} bookingData={bookingData} />;
      default: return null;
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden selection:bg-primary/30" style={{backgroundColor: '#1a4a35'}}>
      <NavBar />
      
      <ConfirmationModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={confirmCancel}
        title="Abandon Journey?"
        description="Are you sure you want to cancel your reservation? All progress in crafting your bespoke culinary experience will be lost."
        confirmText="Yes, Abandon"
        cancelText="No, Continue"
        variant="danger"
      />

      {/* Split Table Approval Dialog */}
      {splitDialogOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/90 backdrop-blur-xl">
          <div className="p-10 max-w-md w-full space-y-8 relative overflow-hidden rounded-2xl" style={{backgroundColor: '#111412', border: '1px solid rgba(200,169,106,0.15)'}}>
            <div className="absolute top-0 left-0 w-full h-1 bg-gold-gradient" />
            <div className="space-y-3">
              <span className="font-label text-[9px] tracking-[0.3em] uppercase text-primary font-bold block">Table Availability Notice</span>
              <h2 className="font-headline text-3xl italic text-on-surface leading-tight">
                Alternative <span className="text-gold-gradient">Arrangement</span>
              </h2>
              <p className="font-body text-on-surface/70 text-sm font-light leading-relaxed">
                {splitDialogMessage}
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <button onClick={handleSplitConfirm} className="w-full bg-gold-gradient text-on-primary font-label text-[10px] tracking-[0.2em] uppercase py-4 rounded-lg shadow-2xl shadow-primary/30 font-bold">Yes, Arrange Multiple Tables</button>
              <button onClick={() => setSplitDialogOpen(false)} className="w-full border border-outline-variant/20 text-on-surface/60 font-label text-[10px] tracking-[0.2em] uppercase py-4 rounded-lg font-bold">Choose Different Slot</button>
            </div>
          </div>
        </div>
      )}

      {/* Chair Arrangement Consent Dialog */}
      {chairConsentOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/90 backdrop-blur-xl">
          <div className="p-10 max-w-md w-full space-y-8 relative overflow-hidden rounded-2xl" style={{backgroundColor: '#111412', border: '1px solid rgba(200,169,106,0.15)'}}>
            <div className="absolute top-0 left-0 w-full h-1 bg-gold-gradient" />
            <div className="space-y-4">
              <h2 className="font-headline text-3xl italic text-on-surface leading-tight">Party of <span className="text-gold-gradient">Five</span></h2>
              <p className="font-body text-on-surface/70 text-sm font-light leading-relaxed">To accommodate your party of five, we will utilize one of our premium 4-seater tables and add a complementary special corner chair arrangement.</p>
            </div>
            <div className="flex flex-col gap-4">
              <button onClick={() => setChairConsentOpen(false)} className="w-full bg-gold-gradient text-on-primary font-label text-[10px] tracking-[0.2em] uppercase py-4 rounded-lg font-bold">I Understand & Consent</button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-grow flex flex-col items-center overflow-hidden">
        <div ref={scrollContainerRef} className="w-full flex-grow flex flex-col items-center pt-28 md:pt-32 pb-10 px-4 md:px-12 overflow-y-auto scrollbar-hide">
          {/* Progress Stepper */}
          <div className="max-w-4xl w-full mb-16 px-4 shrink-0">
            <div className="flex items-center justify-between mb-4">
              <span className="font-label text-[10px] uppercase tracking-[0.2em] text-[#C8A96A] font-bold">Step {step} of 8</span>
              <span className="font-label text-[10px] uppercase tracking-[0.2em] text-[#C8A96A] font-bold">{Math.round((step / 8) * 100)}%</span>
            </div>
            <div className="h-1 w-full bg-[#333534] rounded-full overflow-hidden">
              <div className="h-full bg-[#C8A96A] transition-all duration-1000 ease-out" style={{ width: `${(step / 8) * 100}%` }}></div>
            </div>
          </div>

          {/* Wizard Content */}
          <div className={cn("w-full max-w-6xl relative pb-20", (isSubmitting || isRestoring) && "opacity-50 pointer-events-none")}>
            {(isSubmitting || isRestoring) && (
              <div className="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-md" style={{backgroundColor: 'rgba(26,74,53,0.6)'}}>
                <div className="flex flex-col items-center gap-6">
                  <div className="w-20 h-20 rounded-full border-2 border-primary/10 border-t-primary animate-spin" />
                  <p className="font-headline text-3xl italic animate-pulse text-gold-gradient">{isRestoring ? "Restoring journey..." : "Crafting experience..."}</p>
                </div>
              </div>
            )}
            
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -30, filter: "blur(10px)" }}
                transition={{ duration: 0.8 }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>

            {/* Persistent Navigation */}
            <div className="mt-12 pt-8 border-t border-outline-variant/10 flex flex-col sm:flex-row justify-between items-center gap-6">
              <button onClick={handleBack} className="text-[#E5E7EB]/40 hover:text-[#E5E7EB] font-body text-[10px] tracking-widest uppercase font-bold transition-all flex items-center gap-3 group">
                <div className="w-6 h-px bg-[#E5E7EB]/20 group-hover:bg-[#E5E7EB] group-hover:w-10 transition-all" />
                Go Back
              </button>

              <button onClick={() => setShowCancelModal(true)} className="text-[#E5E7EB]/20 hover:text-red-400/70 font-body text-[10px] tracking-widest uppercase font-bold transition-all flex items-center gap-3 group">
                Cancel Journey
                <div className="w-6 h-px bg-[#E5E7EB]/10 group-hover:bg-red-400/40 group-hover:w-10 transition-all" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
