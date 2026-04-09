"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
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
  totalPrice: number;
}

export const BookingWizard = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialDate = searchParams.get("date");
  const { user, setAuth } = useAuthStore();
  
  const [step, setStep] = useState(2); // Starts from Step 2
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  // Sync auth state if user logs in midway
  useEffect(() => {
    if (user) {
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
  }, [user]);

  const steps = [
    "Date", "Time", "Guests", "Table", "Details", "Occasion", "Add-ons", "Payment"
  ];

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Map frontend state to backend payload
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
        cakePrice: bookingData.addons.includes("cake") ? 50 : 0,
        userId: user?.id // Attach user ID if logged in
      };

      console.log("[Booking Request Payload]", payload);

      const { data } = await api.post("/bookings/reserve", payload);

      if (data.success) {
        if (data.token && data.user) {
          setAuth(data.user, data.token);
          toast.success("Reservation confirmed & Account created!");
        } else {
          toast.success("Reservation confirmed!");
        }
        
        router.push("/book-table/confirmed");
      }
    } catch (error: any) {
      const responseData = error.response?.data;
      if (responseData?.errors && Array.isArray(responseData.errors)) {
        responseData.errors.forEach((err: any) => {
          toast.error(`${err.msg}`);
        });
      } else {
        toast.error(responseData?.message || "Something went wrong with your reservation.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = (data: any) => {
    const updatedData = { ...bookingData, ...data };
    setBookingData(updatedData);

    let nextStep = step + 1;

    // SKIP Step 5 (Details) if user is logged in and we have their phone
    if (nextStep === 5 && user && updatedData.guestDetails.phone) {
      nextStep = 6;
    }

    if (step < 8) {
      setStep(nextStep);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      handleFinalSubmit();
    }
  };

  const handleBack = () => {
    let prevStep = step - 1;

    // SKIP Step 5 if going back and user is logged in with phone
    if (prevStep === 5 && user && bookingData.guestDetails.phone) {
      prevStep = 4;
    }

    if (step > 2) {
      setStep(prevStep);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    else router.push("/");
  };

  const renderStep = () => {
    switch (step) {
      case 2:
        return <StepTimeSelection onNext={handleNext} selectedTime={bookingData.time} />;
      case 3:
        return <StepGuestCount onNext={handleNext} selectedGuests={bookingData.guests} />;
      case 4:
        return <StepTableSelection onNext={handleNext} selectedTable={bookingData.table} />;
      case 5:
        return <StepGuestDetails onNext={handleNext} initialData={bookingData.guestDetails} />;
      case 6:
        return <StepOccasionSelection onNext={handleNext} selectedOccasion={bookingData.occasion} />;
      case 7:
        return <StepAddons onNext={handleNext} selectedAddons={bookingData.addons} />;
      case 8:
        return <StepSummaryPayment onNext={() => handleNext({})} bookingData={bookingData} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <NavBar />
      
      <main className="flex-grow pt-24 md:pt-32 pb-20 px-4 md:px-12 flex flex-col items-center">
        {/* Step Indicator */}
        <div className="max-w-4xl w-full mb-16 md:mb-24 px-4 overflow-x-auto scrollbar-hide">
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
        <div className={cn("w-full max-w-6xl relative", isSubmitting && "opacity-50 pointer-events-none transition-opacity")}>
          {isSubmitting && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/20 backdrop-blur-[2px]">
              <div className="flex flex-col items-center gap-6">
                <div className="w-16 h-16 rounded-full border-4 border-primary-container border-t-primary animate-spin" />
                <p className="font-headline text-2xl italic animate-pulse">Crafting your experience...</p>
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
          <div className="mt-20 pt-12 border-t border-outline-variant/10">
             <button 
              onClick={handleBack}
              className="text-secondary hover:text-on-surface font-body text-[10px] tracking-widest uppercase font-bold transition-colors flex items-center gap-3 group"
            >
              <div className="w-6 h-px bg-secondary group-hover:bg-primary group-hover:w-8 transition-all" />
              Go Back
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
