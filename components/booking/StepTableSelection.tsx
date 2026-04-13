"use client";

import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepTableSelectionProps {
  onNext: (data: { table: string }) => void;
  selectedTable: string | null;
  guests: number;
}

const getTableNote = (guests: number): string => {
  if (guests === 2) return "1 x 2-Seater Table";
  if (guests === 3 || guests === 4) return "1 x 4-Seater Table";
  if (guests === 5) return "1 x 4-Seater + Extra Chair Arrangement";
  if (guests === 6) return "1 x 4-Seater + 1 x 2-Seater Combination";
  if (guests === 7 || guests === 8) return "2 x 4-Seater Table Arrangement";
  return "Custom Arrangement";
};

const tableOptions = [
  {
    id: "alcove",
    title: "The Intimate Alcove",
    guests: "2 Guests",
    desc: "A secluded nook designed for hushed conversations and shared secrets. Wrapped in dark mohair and soft shadow.",
    img: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=800",
    ratio: "aspect-[4/5]",
    span: "md:col-span-5"
  },
  {
    id: "salon",
    title: "The Grand Salon",
    guests: "4+ Guests",
    desc: "Bask in the theatre of the dining room. Expansive round tables under hand-blown glass chandeliers, perfect for celebration and ceremony.",
    img: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8cmVzdHVyYW50fGVufDB8fDB8fHww",
    ratio: "aspect-[16/10]",
    span: "md:col-span-6 md:mt-24"
  }
];

export const StepTableSelection = ({ onNext, selectedTable, guests }: StepTableSelectionProps) => {
  // Filter table options based on guest count
  const filteredOptions = tableOptions.reduce((acc, opt) => {
    // 2 guests: Only show Alcove
    if (guests === 2 && opt.id === "alcove") {
      acc.push(opt);
    } 
    // 3, 4, 5 guests: Only show Salon
    else if ((guests >= 3 && guests <= 5) && opt.id === "salon") {
      if (guests === 5) {
        acc.push({
          ...opt,
          title: "Salon with Extra Seating",
          desc: "Your party of five will be seated at a Grand Salon table with an additional bespoke corner chair arrangement."
        });
      } else {
        acc.push(opt);
      }
    }
    // 6 guests: Show BOTH (since arrangement uses 1x4 and 1x2)
    else if (guests === 6) {
      if (opt.id === "salon") {
        acc.push({
          ...opt,
          title: "The Salon Arrangement",
          desc: "The primary setting for your party of six. One grand 4-seater table serving as the centerpiece of your experience."
        });
      } else if (opt.id === "alcove") {
        acc.push({
          ...opt,
          title: "The Alcove Addition",
          desc: "Completing your arrangement for six. One intimate 2-seater table joined seamlessly to ensure collective dining."
        });
      }
    }
    // 7, 8 guests: Show Salon only (representing the 2x4 arrangement)
    else if (guests >= 7 && opt.id === "salon") {
      acc.push({
        ...opt,
        title: "Grand Salon Cluster",
        desc: "To accommodate your large party, we will prepare two premium 4-seater tables arranged side-by-side in our Grand Salon."
      });
    }
    return acc;
  }, [] as typeof tableOptions);

  return (
    <div className="space-y-20">
      <header className="max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <span className="font-headline italic text-primary text-xl">04.</span>
          <div className="h-[1px] w-12 bg-outline-variant opacity-40"></div>
          <span className="font-label uppercase tracking-widest text-[10px] text-secondary font-bold">Table Selection</span>
        </div>
        <h1 className="font-headline italic text-5xl md:text-7xl text-on-surface leading-tight">
          Your <span className="text-gold-gradient">Setting</span>
        </h1>
        <div className="inline-flex items-center gap-3 px-4 py-2 bg-primary/5 border border-primary/20 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="font-label text-[10px] uppercase tracking-widest font-bold text-primary">
            Arrangement: {getTableNote(guests)}
          </span>
        </div>
        <p className="font-body text-secondary text-lg md:text-xl leading-relaxed font-light">
          We have curated the perfect seating arrangement for your party size. Select your preferred sanctuary below.
        </p>
      </header>

      <div className={cn(
        "grid grid-cols-1 md:grid-cols-12 gap-12 items-stretch",
        filteredOptions.length === 1 && "flex justify-center"
      )}>
        {filteredOptions.map((table) => {
          // For now, if there's only one arrangement (1 or 2 cards), it's "selected" by default
          const isSelected = true; 
          
          return (
            <div 
              key={table.id} 
              className={cn(
                filteredOptions.length === 1 ? "md:col-span-8" : "md:col-span-6", 
                "group relative"
              )}
            >
              <div className={cn(
                "relative overflow-hidden rounded-xl bg-surface-container-low p-2 transition-all duration-700 border",
                table.ratio,
                isSelected ? "border-primary-container ambient-shadow scale-[1.01]" : "border-outline-variant/10"
              )}>
                <div className="w-full h-full overflow-hidden rounded-lg relative">
                  <img 
                    src={table.img} 
                    alt={table.title} 
                    className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-1000" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-on-surface/90 via-on-surface/20 to-transparent opacity-80"></div>
                  <div className="absolute bottom-8 left-8 right-8 text-white space-y-2">
                    <span className="font-label text-[10px] uppercase tracking-[0.3em] block opacity-80 font-bold">{table.guests}</span>
                    <h3 className="font-headline italic text-4xl">{table.title}</h3>
                  </div>
                </div>
              </div>
              
              <div className="mt-8">
                <p className="font-body text-secondary text-sm leading-relaxed font-light italic max-w-md">
                  {table.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modern Next Button at Bottom */}
      <div className="flex justify-center pt-12 border-t border-outline-variant/10">
        <button
          onClick={() => onNext({ table: filteredOptions[0].id })}
          className="group relative inline-flex items-center gap-6 bg-gold-gradient text-on-primary font-label text-[10px] tracking-[0.3em] uppercase py-6 px-16 rounded-lg shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all duration-500 font-bold"
        >
          Confirm & Continue
          <div className="w-8 h-px bg-on-primary/60 group-hover:w-12 transition-all" />
        </button>
      </div>

    </div>
  );
};
