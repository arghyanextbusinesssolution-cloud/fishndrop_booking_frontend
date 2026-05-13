"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface StepAddonsProps {
  onNext: (data: { addons: string[] }) => void;
  selectedAddons: string[];
}

const addonOptions = [
  {
    id: "krug",
    label: "Vintage Krug Pairings",
    desc: "A curated selection of Krug's finest vintages, expertly paired with each course of your evening.",
    price: 150,
    img: "https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "truffle",
    label: "Winter Truffle Supplement",
    desc: "Elevate your dining experience with fresh Alba white truffles, shaved table-side over your main course.",
    price: 85,
    img: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "custom_cake",
    label: "Custom Celebration Cake",
    desc: "A bespoke creation from our head pastry chef, designed entirely to your specifications.",
    price: 0, // Computed dynamically in the cake details step
    img: "https://images.unsplash.com/photo-1585645187768-b6c10786fa14?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTR8fGJpcnRoZGF5Y2FrZXxlbnwwfHwwfHx8MA%3D%3D"
  },
  {
    id: "flowers",
    label: "Floral Arrangement",
    desc: "A seasonal bouquet of exotic blooms arranged by our in-house florist, waiting at your table.",
    price: 120,
    img: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=400"
  }
];

export const StepAddons = ({ onNext, selectedAddons }: StepAddonsProps) => {
  const toggleAddon = (id: string) => {
    const newAddons = selectedAddons.includes(id) 
      ? selectedAddons.filter(a => a !== id) 
      : [...selectedAddons, id];
    // We don't call onNext immediately here to allow multiple selection
    // But for the sake of the wizard loop in the demo, we'll add a "Continue" button elsewhere or handle it in state
  };

  return (
    <div className="space-y-12">
      <div className="text-center md:text-left space-y-4">
        <span className="font-label tracking-[0.2em] text-primary text-[10px] uppercase mb-2 block font-bold transition-all animate-in fade-in slide-in-from-left-4 duration-500">Bespoke Enhancements</span>
        <h1 className="font-headline italic text-5xl md:text-7xl mb-6 tracking-tight text-on-surface">07. <span className="text-gold-gradient">The Adornments</span></h1>
        <p className="font-body text-on-surface/70 text-lg md:text-xl max-w-2xl font-light">Subtle details that elevate an evening into a lifetime memory.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {addonOptions.map(option => {
          const isSelected = selectedAddons.includes(option.id);

          return (
            <button 
              key={option.id}
              onClick={() => {
                onNext({ addons: [option.id] });
              }}
              className={cn(
                "group relative flex items-center gap-6 p-6 transition-all duration-500 rounded-2xl border text-left",
                isSelected 
                  ? "bg-[#E5E7EB] border-[#E5E7EB] shadow-2xl shadow-black/40" 
                  : "glass-card border-transparent hover:bg-[#E5E7EB]/8 hover:border-[#E5E7EB]/20"
              )}
            >
              <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden border border-[#E5E7EB]/10">
                <img src={option.img} alt={option.label} className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-700" />
              </div>

              <div className="flex-grow space-y-2">
                <div className="flex justify-between items-start">
                   <h3 className={cn(
                     "font-headline italic text-2xl leading-none",
                     isSelected ? "text-[#111412]" : "text-[#E5E7EB]/80"
                   )}>{option.label}</h3>
                   {isSelected && <Check className="w-4 h-4 text-[#111412]/60" />}
                </div>
                <p className={cn(
                  "font-body text-xs leading-relaxed font-light italic line-clamp-2",
                  isSelected ? "text-[#111412]/60" : "text-[#E5E7EB]/40"
                )}>{option.desc}</p>
                <p className={cn(
                  "font-label text-[10px] tracking-widest font-bold uppercase",
                  isSelected ? "text-[#111412]/60" : "text-[#C8A96A]/70"
                )}>+ ${option.price}.00</p>
              </div>

              {isSelected && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-gold-gradient" />
              )}
            </button>
          );
        })}
      </div>

      <div className="pt-12 flex justify-center">
         <button 
          onClick={() => onNext({ addons: [] })}
          className="text-[#E5E7EB]/30 hover:text-[#E5E7EB]/70 font-label text-[10px] uppercase tracking-[0.3em] font-bold transition-all duration-500"
         >
           Skip Enhancements
         </button>
      </div>
    </div>
  );
};
