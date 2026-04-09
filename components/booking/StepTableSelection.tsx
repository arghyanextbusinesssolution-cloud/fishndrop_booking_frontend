"use client";

import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepTableSelectionProps {
  onNext: (data: { table: string }) => void;
  selectedTable: string | null;
}

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
    img: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=800",
    ratio: "aspect-[16/10]",
    span: "md:col-span-6 md:mt-24"
  }
];

export const StepTableSelection = ({ onNext, selectedTable }: StepTableSelectionProps) => {
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
        <p className="font-body text-secondary text-lg md:text-xl leading-relaxed font-light">
          Choose the sanctuary that suits your evening&apos;s intentions. From velvet-lined intimacy to the vibrant pulse of our main salon.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-stretch">
        {tableOptions.map((table, index) => {
          const isSelected = selectedTable === table.id;
          
          return (
            <div 
              key={table.id} 
              className={cn(table.span, "group cursor-pointer")}
              onClick={() => onNext({ table: table.id })}
            >
              <div className={cn(
                "relative overflow-hidden rounded-xl bg-surface-container-low p-2 transition-all duration-500 border",
                table.ratio,
                isSelected ? "border-primary-container ambient-shadow" : "border-outline-variant/10 hover:ambient-shadow"
              )}>
                <div className="w-full h-full overflow-hidden rounded-lg relative">
                  <img 
                    src={table.img} 
                    alt={table.title} 
                    className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-105" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-on-surface/80 via-on-surface/20 to-transparent opacity-80"></div>
                  <div className="absolute bottom-8 left-8 right-8 text-white space-y-2">
                    <span className="font-label text-[10px] uppercase tracking-[0.3em] block opacity-80 font-bold">{table.guests}</span>
                    <h3 className="font-headline italic text-4xl">{table.title}</h3>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 flex justify-between items-start">
                <div className="max-w-[280px]">
                  <p className="font-body text-secondary text-sm leading-relaxed font-light italic">
                    {table.desc}
                  </p>
                </div>
                <div className={cn(
                  "w-10 h-10 rounded-full border border-outline-variant/40 flex items-center justify-center transition-all duration-500",
                  isSelected ? "bg-primary border-primary text-on-primary ring-4 ring-primary/10" : "group-hover:bg-primary group-hover:border-primary group-hover:text-on-primary"
                )}>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Philosophy Section */}
      <section className="mt-40 grid grid-cols-1 md:grid-cols-2 gap-24 items-center border-t border-outline-variant/10 pt-20">
        <div className="space-y-12">
          <h4 className="font-label uppercase tracking-widest text-[10px] text-primary font-bold">The Philosophy of Space</h4>
          <div className="space-y-10">
            {[
              { letter: "A", text: "Each table is treated as a separate stage, distanced to ensure auditory privacy while maintaining the visual connection to the room’s energy." },
              { letter: "B", text: "Our lighting is tailored specifically to each table's orientation, creating a warm, golden pool that frames the culinary presentation." }
            ].map(item => (
              <div key={item.letter} className="flex gap-8">
                <span className="font-headline italic text-3xl text-primary/30">{item.letter}.</span>
                <p className="font-body text-secondary text-base leading-relaxed font-light">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="relative group">
          <div className="bg-surface-container-low p-8 rounded-xl border border-outline-variant/20 relative z-10 ambient-shadow">
             <div className="border border-outline-variant/20 p-2 rounded-lg bg-surface">
                <img 
                  src="https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&q=80&w=800" 
                  className="w-full aspect-square object-cover rounded shadow-inner filter grayscale group-hover:grayscale-0 transition-all duration-1000" 
                  alt="Setting details" 
                />
             </div>
          </div>
          <div className="absolute -top-4 -right-4 w-32 h-32 border-t border-r border-primary/20 pointer-events-none" />
          <div className="absolute -bottom-4 -left-4 w-32 h-32 border-b border-l border-primary/20 pointer-events-none" />
        </div>
      </section>
    </div>
  );
};
