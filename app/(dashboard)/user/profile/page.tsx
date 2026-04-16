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

      <div className="max-w-2xl">
         <div className="bg-surface-container-low p-12 md:p-16 rounded-xl space-y-12 ambient-shadow border border-outline-variant/10">
            <div className="w-24 h-24 rounded-2xl bg-surface-container-highest flex items-center justify-center ambient-shadow overflow-hidden relative group">
               <UserCircle className="w-16 h-16 text-on-surface-variant group-hover:scale-110 transition-transform duration-700" strokeWidth={0.5} />
               <div className="absolute inset-0 bg-gold-gradient opacity-0 group-hover:opacity-10 transition-opacity" />
            </div>
            
            <div className="space-y-4">
               <div className="flex items-center gap-4">
                  <p className="font-headline text-4xl italic text-on-surface">{user?.name}</p>
                  <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 flex items-center gap-1.5">
                     <Shield className="w-3 h-3 text-primary" />
                     <span className="text-[9px] uppercase tracking-widest font-bold text-primary">Member</span>
                  </div>
               </div>
            </div>

            <div className="pt-8 space-y-6 border-t border-outline-variant/10">
               <div className="flex flex-col gap-2">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-outline">Registered Email</span>
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded bg-surface-container-lowest flex items-center justify-center border border-outline-variant/10">
                        <Mail className="w-4 h-4 text-primary" strokeWidth={1.5} />
                     </div>
                     <span className="text-lg font-body font-light italic text-on-surface">{user?.email}</span>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
