"use client";

import { Sliders, Wine, Utensils, Music, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const PreferenceCard = ({ icon: Icon, title, description, selected }: any) => (
  <div className={cn(
    "p-8 bg-surface-container-lowest rounded-xl border transition-all duration-500 cursor-pointer hover:ambient-shadow",
    selected ? "border-primary shadow-lg shadow-primary/5" : "border-outline-variant/10 hover:border-primary/30"
  )}>
    <div className="flex gap-6 items-start">
      <div className={cn(
        "w-12 h-12 rounded-lg flex items-center justify-center transition-colors",
        selected ? "bg-primary text-on-primary" : "bg-surface-container-low text-outline"
      )}>
        <Icon className="w-5 h-5" strokeWidth={1.5} />
      </div>
      <div className="space-y-2">
        <p className="font-headline text-2xl italic leading-none">{title}</p>
        <p className="text-sm text-secondary font-body font-light italic leading-relaxed">{description}</p>
      </div>
    </div>
  </div>
);

export default function PreferencesPage() {
  return (
    <div className="max-w-7xl mx-auto p-6 md:p-12 lg:p-24 space-y-16 md:space-y-24 text-on-surface">
      <header className="space-y-4">
        <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-primary block">Dining Settings</span>
        <h2 className="text-5xl md:text-6xl lg:text-8xl font-headline italic tracking-tighter leading-[0.9] lg:leading-[0.85]">
          A canvas for <br className="hidden md:block" /> your desires.
        </h2>
        <p className="text-base md:text-lg text-secondary leading-relaxed font-body font-light max-w-sm italic pt-2 md:pt-4">
          Tailor the ambience, the menu, and the experience to match your requirements for every visit.
        </p>
      </header>

      <div className="space-y-16">
        {/* Sanctuary Preferences */}
        <section className="space-y-8">
           <h3 className="font-headline text-4xl italic border-b border-outline-variant/10 pb-4">Sanctuary Atmosphere</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <PreferenceCard 
                icon={MapPin} 
                title="Window Seating" 
                description="Our salon windows overlook the illuminated gardens. We prioritize these for you."
                selected={true}
              />
              <PreferenceCard 
                icon={Music} 
                title="Acoustic Privacy" 
                description="We prioritize alcoves with sound-absorbing textures for your evening."
                selected={false}
              />
           </div>
        </section>

        {/* Service Preferences */}
        <section className="space-y-8">
           <h3 className="font-headline text-4xl italic border-b border-outline-variant/10 pb-4">Cellar & Service</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <PreferenceCard 
                icon={Wine} 
                title="Immediate Decanting" 
                description="Upon confirmation of your arrival, your preferred vintage is moved to glass."
                selected={true}
              />
              <PreferenceCard 
                icon={Sliders} 
                title="Minimum Interruption" 
                description="A subtle service style where the staff remains largely invisible."
                selected={true}
              />
           </div>
        </section>

        {/* Dietary Preferences */}
        <section className="space-y-8">
           <h3 className="font-headline text-4xl italic border-b border-outline-variant/10 pb-4">The Fishndrop Palette</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <PreferenceCard 
                icon={Utensils} 
                title="Seasonal Plant-Focus" 
                description="The chef will prepare an additional vegetable-forward arrival for your course."
                selected={false}
              />
           </div>
        </section>
      </div>

      <section className="pt-16 pb-32 border-t border-outline-variant/10">
         <div className="max-w-xl space-y-8">
            <h3 className="font-headline text-4xl italic">Concierge Policy</h3>
            <p className="text-sm font-body font-light text-secondary italic leading-relaxed">
              These settings are the foundational blueprint of your experience. While our Maître d' strives to honor every preference, specific evening adjustments should be noted in your reservation details.
            </p>
            <button className="bg-gold-gradient px-12 py-4 rounded-lg text-on-primary font-label tracking-[0.2em] uppercase text-[10px] font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all">
               Update Fishndrop Profile
            </button>
         </div>
      </section>
    </div>
  );
}
