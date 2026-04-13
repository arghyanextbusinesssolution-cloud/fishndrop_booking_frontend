"use client";

import { useState } from "react";
import { Calendar, Users, Wine, ShieldCheck, Lock, CreditCard, Cake, UtensilsCrossed, Flower2, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface StepSummaryPaymentProps {
  bookingData: any;
  onNext: () => void;
}

export const StepSummaryPayment = ({ bookingData, onNext }: StepSummaryPaymentProps) => {
  const { date, time, guests, table, addons, guestDetails, totalPrice } = bookingData;
  const [cardName, setCardName] = useState(guestDetails.name || "");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");

  const handleAutofill = () => {
    setCardNumber("4242 4242 4242 4242");
    setExpiry("12 / 24");
    setCvc("123");
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const getAddonInfo = (addon: string) => {
    switch(addon) {
      case "krug": return { label: "Vintage Krug Pairings", icon: Wine };
      case "truffle": return { label: "Winter Truffle Supplement", icon: UtensilsCrossed };
      case "cake": return { label: "Signature Birthday Cake", icon: Cake };
      case "custom_cake": return { label: "Custom Celebration Cake", icon: Cake };
      case "flowers": return { label: "Floral Arrangement", icon: Flower2 };
      default: return { label: addon, icon: Wine };
    }
  };

  return (
    <div className="space-y-12">
      <header className="text-center md:text-left space-y-4">
        <span className="font-label text-[10px] tracking-[0.2em] uppercase text-primary mb-4 block font-bold transition-all animate-in fade-in slide-in-from-left-4 duration-500">Step 08 of 08</span>
        <h1 className="font-headline text-5xl md:text-7xl italic leading-tight text-on-surface">The Final Movement</h1>
        <p className="font-body text-secondary text-base md:text-lg font-light max-w-2xl">A final review of your bespoke culinary journey at Fishndrop. Every detail curated for your arrival.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Summary */}
        <div className="lg:col-span-7 space-y-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-8 bg-surface-container-low rounded-xl border border-outline-variant/10 ambient-shadow group hover:border-primary/20 transition-colors">
              <Calendar className="w-5 h-5 text-primary mb-6" />
              <h3 className="font-label text-[9px] tracking-[0.3em] uppercase text-outline mb-2 font-bold">Arrival</h3>
              <p className="font-headline text-2xl italic text-on-surface">{date ? formatDate(date) : "TBD"}</p>
              <p className="font-body text-sm text-secondary italic mt-1">Scheduled for {time || "TBD"}</p>
            </div>
            <div className="p-8 bg-surface-container-low rounded-xl border border-outline-variant/10 ambient-shadow group hover:border-primary/20 transition-colors">
              <Users className="w-5 h-5 text-primary mb-6" />
              <h3 className="font-label text-[9px] tracking-[0.3em] uppercase text-outline mb-2 font-bold">Configuration</h3>
              <p className="font-headline text-2xl italic text-on-surface">{guests} Persons</p>
              <p className="font-body text-sm text-secondary italic mt-1 capitalize">{table?.replace(/-/g, ' ') || "Main Salon"}</p>
            </div>
          </div>

          <div className="p-10 bg-surface-container-low rounded-xl border border-outline-variant/10 ambient-shadow">
            <h3 className="font-label text-[9px] tracking-[0.3em] uppercase text-outline mb-8 font-bold">Chosen Enhancements</h3>
            <div className="space-y-8">
              {addons.length > 0 ? addons.map((addon: string) => {
                const info = getAddonInfo(addon);
                const Icon = info.icon;
                return (
                  <div key={addon} className="flex justify-between items-center group">
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 overflow-hidden rounded-xl bg-surface-container-highest flex items-center justify-center border border-outline-variant/10">
                         <Icon className="w-6 h-6 text-primary group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <div>
                        <p className="font-headline text-xl italic text-on-surface">{info.label}</p>
                        <p className="font-label text-[8px] tracking-[0.2em] uppercase text-outline mt-1 font-bold">Curated Selection</p>
                      </div>
                    </div>
                    <span className="font-body text-primary text-sm font-bold tracking-widest italic pt-1">Included</span>
                  </div>
                );
              }) : (
                <div className="py-4 text-center">
                  <p className="font-body text-secondary italic text-sm font-light">No additional enhancements selected for this journey.</p>
                </div>
              )}
            </div>
          </div>

          {/* Mosaic Grid with improved spacing */}
          <div className="grid grid-cols-12 gap-4 h-64">
            <div className="col-span-8 overflow-hidden rounded-xl border border-outline-variant/10">
              <img className="w-full h-full object-cover grayscale brightness-75 hover:grayscale-0 hover:brightness-100 transition-all duration-1000" src="https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=800" alt="Ambiance" />
            </div>
            <div className="col-span-4 space-y-4">
              <div className="h-[calc(50%-8px)] overflow-hidden rounded-xl border border-outline-variant/10">
                <img className="w-full h-full object-cover grayscale brightness-75" src="https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&q=80&w=400" alt="Detail 1" />
              </div>
              <div className="h-[calc(50%-8px)] overflow-hidden rounded-xl border border-outline-variant/10">
                <img className="w-full h-full object-cover grayscale brightness-75" src="https://images.unsplash.com/photo-1657545215947-a45e4975dd58?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fHJlc3R1cmFudHxlbnwwfHwwfHx8MA%3D%3D" alt="Detail 2" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Checkout */}
        <div className="lg:col-span-5 lg:sticky lg:top-32 h-fit">
          <div className="relative group">
            <div className="absolute -inset-[1px] bg-gold-gradient rounded-2xl opacity-20 blur-[2px] group-hover:opacity-40 transition-opacity" />
            <div className="relative bg-surface-container-lowest p-10 rounded-2xl border border-outline-variant/10 ambient-shadow space-y-10">
              <div className="space-y-2">
                <span className="font-label text-[8px] tracking-[0.4em] uppercase text-primary font-bold">Secure Checkout</span>
                <h2 className="font-headline text-4xl italic text-on-surface">Confirm Table</h2>
              </div>

              <div className="p-6 bg-surface-container-low rounded-xl border border-outline-variant/20 flex justify-between items-center">
                <div>
                  <p className="font-label text-[9px] tracking-[0.3em] uppercase text-secondary font-bold">Booking Deposit</p>
                  <p className="font-body text-[10px] text-outline italic mt-1 font-light">Fully refundable 48h prior</p>
                </div>
                <p className="font-headline text-4xl text-primary font-bold tracking-tighter">${totalPrice?.toFixed(2)}</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2 group/input">
                  <label className="font-label text-[9px] tracking-[0.2em] uppercase text-outline-variant ml-1 font-bold transition-colors group-focus-within/input:text-primary">Cardholder</label>
                  <input 
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="NAME ON CARD"
                    className="w-full bg-surface-container-low border border-outline-variant/10 rounded-lg p-4 font-body text-sm tracking-widest focus:ring-1 focus:ring-primary/40 outline-none transition-all placeholder:opacity-25 uppercase" 
                  />
                </div>
                
                <div className="space-y-2 group/input">
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-label text-[9px] tracking-[0.2em] uppercase text-outline-variant font-bold">Card Details</label>
                    <button 
                      type="button"
                      onClick={handleAutofill}
                      className="flex items-center gap-1.5 text-[8px] uppercase tracking-widest text-primary font-bold hover:scale-105 transition-transform"
                    >
                      <Zap size={10} fill="currentColor" />
                      Fill Test Card
                    </button>
                  </div>
                  <div className="relative">
                    <input 
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant/10 rounded-lg p-4 font-body text-sm tracking-widest focus:ring-1 focus:ring-primary/40 outline-none transition-all placeholder:opacity-25" 
                      placeholder="0000 0000 0000 0000" 
                    />
                    <CreditCard className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline/30" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input 
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      className="bg-surface-container-low border border-outline-variant/10 rounded-lg p-4 font-body text-sm tracking-widest focus:ring-1 focus:ring-primary/40 outline-none text-center placeholder:opacity-25" 
                      placeholder="MM / YY" 
                    />
                    <input 
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value)}
                      className="bg-surface-container-low border border-outline-variant/10 rounded-lg p-4 font-body text-sm tracking-widest focus:ring-1 focus:ring-primary/40 outline-none text-center placeholder:opacity-25" 
                      placeholder="CVC" 
                    />
                  </div>
                </div>
              </div>

              <button 
                onClick={onNext}
                className="w-full bg-gold-gradient text-on-primary font-label text-[10px] tracking-[0.3em] uppercase py-6 rounded-lg shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all duration-500 font-bold"
              >
                Complete Bespoke Journey
              </button>

              <div className="flex justify-center gap-10 pt-4 opacity-50">
                <div className="flex flex-col items-center gap-2 group">
                  <Lock className="w-4 h-4 text-outline group-hover:text-primary transition-colors" />
                  <span className="font-label text-[7px] tracking-widest uppercase font-bold">SSL Secure</span>
                </div>
                <div className="flex flex-col items-center gap-2 group">
                  <ShieldCheck className="w-4 h-4 text-outline group-hover:text-primary transition-colors" />
                  <span className="font-label text-[7px] tracking-widest uppercase font-bold">PCI Compliant</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
