"use client";

import { Calendar, Users, Wine, ShieldCheck, Lock, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepSummaryPaymentProps {
  bookingData: any;
  onNext: () => void;
}

export const StepSummaryPayment = ({ bookingData, onNext }: StepSummaryPaymentProps) => {
  const { date, time, guests, table, addons, guestDetails } = bookingData;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const addonMap: any = {
    krug: "Vintage Krug Pairings",
    truffle: "Winter Truffle Supplement",
    cake: "Signature Birthday Cake",
    flowers: "Floral Arrangement"
  };

  return (
    <div className="space-y-16">
      <header className="text-center md:text-left space-y-4">
        <span className="font-label text-[10px] tracking-[0.2em] uppercase text-primary mb-4 block font-bold transition-all animate-in fade-in slide-in-from-left-4 duration-500">Step 08 of 08</span>
        <h1 className="font-headline text-5xl md:text-7xl italic leading-tight text-on-surface">08. The Final Movement</h1>
        <p className="font-body text-secondary text-lg md:text-xl font-light">A final review of your bespoke culinary evening.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Summary Column */}
        <div className="lg:col-span-7 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-8 bg-surface-container-low rounded-xl border border-outline-variant/10 ambient-shadow">
              <Calendar className="w-5 h-5 text-primary mb-4" />
              <h3 className="font-label text-[10px] tracking-widest uppercase text-secondary mb-2 font-bold">Arrival</h3>
              <p className="font-headline text-2xl italic text-on-surface">{date ? formatDate(date) : "TBD"}</p>
              <p className="font-body text-sm text-secondary italic">at {time || "TBD"}</p>
            </div>
            <div className="p-8 bg-surface-container-low rounded-xl border border-outline-variant/10 ambient-shadow">
              <Users className="w-5 h-5 text-primary mb-4" />
              <h3 className="font-label text-[10px] tracking-widest uppercase text-secondary mb-2 font-bold">Guest Configuration</h3>
              <p className="font-headline text-2xl italic text-on-surface">{guests} Persons</p>
              <p className="font-body text-sm text-secondary italic capitalize">{table?.replace(/-/g, ' ') || "Main Salon"}</p>
            </div>
          </div>

          <div className="p-8 bg-surface-container-low rounded-xl border border-outline-variant/10 ambient-shadow">
            <h3 className="font-label text-[10px] tracking-widest uppercase text-secondary mb-6 font-bold">Enhancements</h3>
            <ul className="space-y-6">
              {addons.length > 0 ? addons.map((addon: string) => (
                <li key={addon} className="flex justify-between items-center group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 overflow-hidden rounded-lg bg-surface-container-highest">
                       <Wine className="w-full h-full p-3 text-primary-container" />
                    </div>
                    <div>
                      <p className="font-headline text-xl italic leading-none">{addonMap[addon] || addon}</p>
                      <p className="font-label text-[8px] tracking-widest uppercase text-outline mt-1 font-bold">Curated Selection</p>
                    </div>
                  </div>
                  <p className="font-body text-on-surface text-sm font-light">Included</p>
                </li>
              )) : (
                <li className="text-secondary font-body italic text-sm font-light">No additional enhancements selected.</li>
              )}
            </ul>
          </div>

          {/* Image Mosaic */}
          <div className="grid grid-cols-3 gap-4 h-56">
            <div className="col-span-2 overflow-hidden rounded-xl">
              <img className="w-full h-full object-cover grayscale opacity-80" src="https://images.unsplash.com/photo-1550966841-3bc2ad03d04c?auto=format&fit=crop&q=80&w=800" alt="Restaurant Ambiance" />
            </div>
            <div className="overflow-hidden rounded-xl">
              <img className="w-full h-full object-cover grayscale opacity-80" src="https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&q=80&w=400" alt="Detail" />
            </div>
          </div>
        </div>

        {/* Payment Column */}
        <div className="lg:col-span-5 lg:sticky lg:top-32">
          <div className="bg-surface-container-lowest p-10 rounded-xl border border-outline-variant/10 ambient-shadow space-y-8">
            <h2 className="font-headline text-3xl italic text-on-surface">Secure Your Table</h2>
            <div className="flex justify-between items-end pb-8 border-b border-outline-variant/20">
              <div>
                <p className="font-label text-[10px] tracking-widest uppercase text-secondary mb-1 font-bold">Deposit Required</p>
                <p className="font-body text-xs text-outline italic font-light">Refundable up to 48h prior</p>
              </div>
              <p className="font-headline text-4xl text-primary">$200.00</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-1">
                <label className="font-label text-[8px] tracking-widest uppercase text-outline ml-1 font-bold">Cardholder Name</label>
                <input 
                  defaultValue={guestDetails.name}
                  className="w-full bg-surface-container-low border-none rounded-lg p-4 font-body text-sm tracking-widest focus:ring-1 focus:ring-primary-container outline-none placeholder:opacity-30 uppercase" 
                  placeholder="IDENTITY ON CARD" 
                />
              </div>
              <div className="space-y-1">
                <label className="font-label text-[8px] tracking-widest uppercase text-outline ml-1 font-bold">Card Number</label>
                <div className="relative">
                  <input className="w-full bg-surface-container-low border-none rounded-lg p-4 font-body text-sm tracking-widest focus:ring-1 focus:ring-primary-container outline-none placeholder:opacity-30" placeholder="0000 0000 0000 0000" />
                  <CreditCard className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline/30" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-label text-[8px] tracking-widest uppercase text-outline ml-1 font-bold">Expiry</label>
                  <input className="w-full bg-surface-container-low border-none rounded-lg p-4 font-body text-sm tracking-widest focus:ring-1 focus:ring-primary-container outline-none text-center" placeholder="MM / YY" />
                </div>
                <div className="space-y-1">
                  <label className="font-label text-[8px] tracking-widest uppercase text-outline ml-1 font-bold">CVV</label>
                  <input className="w-full bg-surface-container-low border-none rounded-lg p-4 font-body text-sm tracking-widest focus:ring-1 focus:ring-primary-container outline-none text-center" placeholder="•••" />
                </div>
              </div>
            </div>

            <button 
              onClick={onNext}
              className="w-full bg-gold-gradient text-on-primary font-body text-xs tracking-[0.2em] uppercase py-5 rounded-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all duration-500 font-bold"
            >
              Complete Reservation
            </button>
          </div>

          <div className="mt-8 flex justify-center gap-8 opacity-40">
             <div className="flex flex-col items-center gap-1">
                <Lock className="w-4 h-4 text-outline" />
                <span className="font-label text-[7px] tracking-widest uppercase font-bold">SSL Secure</span>
             </div>
             <div className="flex flex-col items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-outline" />
                <span className="font-label text-[7px] tracking-widest uppercase font-bold">PCI Compliant</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
