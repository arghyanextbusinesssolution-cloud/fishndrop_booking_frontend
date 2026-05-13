"use client";

import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepTableSelectionProps {
  onNext: (data: { table: string }) => void;
  selectedTable: string | null;
  guests: number;
  assignedNote?: string;
}

const getTableNote = (guests: number): string => {
  if (guests === 2) return "1 x 2-Seater Table";
  if (guests === 3 || guests === 4) return "1 x 4-Seater OR 2 x 2-Seater Combination";
  if (guests === 5) return "4-Seater Base + Extra Chair Arrangement";
  if (guests === 6) return "1 x 4-Seater + 1 x 2-Seater Combination";
  if (guests === 7 || guests === 8) return "Flexible 4-Seater / 2-Seater Arrangement";
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

export const StepTableSelection = ({ onNext, selectedTable, guests, assignedNote }: StepTableSelectionProps) => {
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
    <div className="space-y-6">
      {/* Compact Header */}
      <header className="space-y-3">
        <div className="flex items-center gap-4">
          <span className="font-headline italic text-primary text-base">04.</span>
          <div className="h-[1px] w-8 bg-white/20"></div>
          <span className="font-label uppercase tracking-widest text-[10px] text-white/50 font-bold">The Setting</span>
        </div>
        <div className="flex items-center gap-6 flex-wrap">
          <h1 className="font-headline italic text-4xl md:text-5xl text-white leading-tight">
            Your <span className="text-gold-gradient">Sanctuary</span>
          </h1>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 glass-card rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="font-label text-[9px] uppercase tracking-widest font-bold text-white/60">
              {assignedNote || getTableNote(guests)}
            </span>
          </div>
        </div>
      </header>

      {/* Table Cards - compact fixed height */}
      <div className={cn(
        "grid gap-6 items-stretch",
        filteredOptions.length === 1 ? "grid-cols-1 max-w-2xl" : "grid-cols-1 md:grid-cols-2"
      )}>
        {filteredOptions.map((table) => {
          const isSelected = true; 
          return (
            <div 
              key={table.id} 
              className="group relative"
            >
              <div className="relative overflow-hidden rounded-xl glass-card p-2 transition-all duration-700 h-52 border-white/15">
                <div className="w-full h-full overflow-hidden rounded-lg relative">
                  <img 
                    src={table.img} 
                    alt={table.title} 
                    className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-1000" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-5 left-6 right-6 space-y-1">
                    <span className="font-label text-[9px] uppercase tracking-[0.3em] block font-bold text-white/50">{table.guests}</span>
                    <h3 className="font-headline italic text-2xl text-gold-gradient">{table.title}</h3>
                    <p className="font-body text-white/50 text-xs font-light italic line-clamp-1">{table.desc}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div className="flex justify-center pt-4 border-t border-white/10">
        <button
          onClick={() => onNext({ table: filteredOptions[0].id })}
          className="group relative inline-flex items-center gap-6 bg-[#E5E7EB] text-[#111412] font-label text-[10px] tracking-[0.3em] uppercase py-4 px-14 rounded-lg shadow-2xl shadow-black/40 hover:bg-white hover:scale-[1.05] active:scale-95 transition-all duration-500 font-bold"
        >
          Confirm &amp; Continue
          <div className="w-8 h-px bg-[#111412]/40 group-hover:w-12 transition-all" />
        </button>
      </div>
    </div>
  );
};
