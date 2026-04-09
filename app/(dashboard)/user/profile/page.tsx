"use client";

import { useAuthStore } from "@/store/authStore";
import { UserCircle, Mail, Shield, Calendar, Clock } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuthStore();

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-12 lg:p-24 space-y-16 md:space-y-24 text-on-surface">
      <header className="space-y-4">
        <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-primary block">Fishndrop Membership</span>
        <h2 className="text-5xl md:text-6xl lg:text-8xl font-headline italic tracking-tighter leading-[0.9] lg:leading-[0.85]">
          The curator <br className="hidden md:block" /> of taste.
        </h2>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        <div className="lg:col-span-4">
           <div className="bg-surface-container-low p-10 rounded-xl space-y-8 ambient-shadow border border-outline-variant/10">
              <div className="w-24 h-24 rounded-2xl bg-surface-container-highest flex items-center justify-center ambient-shadow overflow-hidden relative group">
                 <UserCircle className="w-16 h-16 text-on-surface-variant group-hover:scale-110 transition-transform duration-700" strokeWidth={0.5} />
                 <div className="absolute inset-0 bg-gold-gradient opacity-0 group-hover:opacity-10 transition-opacity" />
              </div>
              <div className="space-y-2">
                 <div className="flex items-center gap-3">
                    <p className="font-headline text-3xl italic">{user?.name}</p>
                    <div className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 flex items-center gap-1">
                       <Shield className="w-2.5 h-2.5 text-primary" />
                       <span className="text-[7px] uppercase tracking-widest font-bold text-primary">Verified</span>
                    </div>
                 </div>
                 <p className="text-[10px] uppercase tracking-widest text-primary font-bold">Priority Gold Member</p>
              </div>
              <div className="pt-8 space-y-6 border-t border-outline-variant/10">
                 <div className="flex items-center gap-4 group cursor-pointer">
                    <div className="w-8 h-8 rounded bg-surface-container-lowest flex items-center justify-center border border-outline-variant/10 group-hover:border-primary/30 transition-colors">
                       <Mail className="w-3.5 h-3.5 text-outline group-hover:text-primary" strokeWidth={1.5} />
                    </div>
                    <span className="text-sm font-body font-light italic truncate group-hover:text-on-surface transition-colors">{user?.email}</span>
                 </div>
              </div>

              {/* Membership Pulse */}
              <div className="p-6 bg-surface-container-lowest rounded-lg border border-outline-variant/5 space-y-4">
                 <div className="flex justify-between items-end">
                    <p className="text-[8px] uppercase tracking-widest text-outline font-bold">Fishndrop Credits</p>
                    <p className="font-headline text-2xl italic text-primary">1,250</p>
                 </div>
                 <div className="w-full h-1 bg-surface-container-high rounded-full overflow-hidden">
                    <div className="w-[65%] h-full bg-gold-gradient" />
                 </div>
                 <p className="text-[7px] uppercase tracking-widest text-outline text-right font-bold">750 pts to Platinum</p>
              </div>
           </div>
        </div>

        <div className="lg:col-span-8 space-y-16">
           <section className="space-y-10">
              <div className="flex justify-between items-end border-b border-outline-variant/10 pb-6">
                 <h3 className="font-headline text-4xl italic">Membership Portfolio</h3>
                 <span className="text-[9px] uppercase tracking-[0.3em] text-outline font-bold">Concierge ID: FND-{user?.id?.slice(-6).toUpperCase() || "NEW"}</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                 <div className="space-y-3">
                    <p className="text-[9px] uppercase tracking-widest font-bold text-outline">Member Since</p>
                    <div className="flex items-center gap-3">
                       <Calendar className="w-5 h-5 text-primary" strokeWidth={1.5} />
                       <p className="font-headline text-3xl italic">April &apos;26</p>
                    </div>
                 </div>
                 <div className="space-y-3">
                    <p className="text-[9px] uppercase tracking-widest font-bold text-outline">Total Journeys</p>
                    <div className="flex items-center gap-3">
                       <Shield className="w-5 h-5 text-primary" strokeWidth={1.5} />
                       <p className="font-headline text-3xl italic">14 Visits</p>
                    </div>
                 </div>
                 <div className="space-y-3">
                    <p className="text-[9px] uppercase tracking-widest font-bold text-outline">Primary Sanctuary</p>
                    <div className="flex items-center gap-3">
                       <span className="w-5 h-5 rounded-full bg-gold-gradient" />
                       <p className="font-headline text-3xl italic">The Reef</p>
                    </div>
                 </div>
              </div>
           </section>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-8 bg-surface-container-low rounded-xl border border-outline-variant/10 space-y-4">
                 <h4 className="font-headline text-2xl italic">Last Journey</h4>
                 <p className="text-sm text-secondary italic font-light">Your anniversary dinner in the Salon Vert was rated as "Perfect." The kitchen has noted your preference for the '95 Bordeaux.</p>
              </div>
              <div className="p-8 bg-primary/5 rounded-xl border border-primary/10 space-y-4">
                 <h4 className="font-headline text-2xl italic text-primary">Concierge Access</h4>
                 <p className="text-sm text-secondary italic font-light">As a Gold member, you have 24/7 direct access to our Maître d' via the Fishndrop app for priority adjustments.</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
