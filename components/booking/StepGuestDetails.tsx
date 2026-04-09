"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";

const guestSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Invalid phone number"),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
});

interface StepGuestDetailsProps {
  onNext: (data: { guestDetails: any }) => void;
  initialData: any;
}

export const StepGuestDetails = ({ onNext, initialData }: StepGuestDetailsProps) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(guestSchema),
    defaultValues: initialData,
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
      {/* Editorial Left Column */}
      <div className="lg:col-span-5 space-y-8">
        <header className="space-y-4">
          <span className="font-label text-[10px] tracking-widest text-primary uppercase font-bold">Step 05 of 08</span>
          <h1 className="font-headline text-5xl md:text-6xl text-on-surface leading-tight tracking-tight">
            05. <span className="font-headline italic">Confirm Your</span> Presence
          </h1>
        </header>
        <p className="text-secondary font-body text-lg leading-relaxed max-w-sm font-light">
          The beauty of hospitality lies in the anticipation of our guests&apos; needs. Creating an account allows us to curate your future journeys.
        </p>
        <div className="pt-8 border-t border-outline-variant/20">
          <div className="flex items-center gap-4 group">
            <div className="w-12 h-12 rounded-full overflow-hidden ambient-shadow">
              <img 
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" 
                alt="Concierge"
                src="https://images.unsplash.com/photo-1550966841-3bc2ad03d04c?auto=format&fit=crop&q=80&w=200"
              />
            </div>
            <div>
              <p className="font-label text-[10px] uppercase tracking-widest text-secondary font-bold">Your Concierge</p>
              <p className="font-headline italic text-on-surface text-xl">Jean-Luc</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Right Column */}
      <div className="lg:col-span-7 bg-surface-container-low p-8 md:p-12 rounded-xl ambient-shadow border border-outline-variant/10">
        <form onSubmit={handleSubmit((data) => onNext({ guestDetails: data }))} className="space-y-10">
          {/* Input: Full Name */}
          <div className="group relative space-y-2">
            <label className="block font-headline italic text-2xl text-on-surface-variant transition-all duration-300 group-focus-within:text-primary">
              Full Name
            </label>
            <input 
              {...register("name")}
              placeholder="E.g. Alexander Sterling"
              className={cn(
                "w-full bg-transparent border-0 border-b py-3 px-0 focus:ring-0 transition-colors placeholder:text-outline/40 font-body text-xl text-on-surface",
                errors.name ? "border-error" : "border-outline-variant/40 focus:border-primary"
              )}
            />
            {errors.name && <p className="text-[10px] uppercase tracking-widest text-error font-bold">{errors.name.message as string}</p>}
          </div>

          {/* Input: Email Address */}
          <div className="group relative space-y-2">
            <label className="block font-headline italic text-2xl text-on-surface-variant transition-all duration-300 group-focus-within:text-primary">
              Email Address
            </label>
            <input 
              {...register("email")}
              placeholder="guest@fishndrop.com"
              className={cn(
                "w-full bg-transparent border-0 border-b py-3 px-0 focus:ring-0 transition-colors placeholder:text-outline/40 font-body text-xl text-on-surface",
                errors.email ? "border-error" : "border-outline-variant/40 focus:border-primary"
              )}
            />
            {errors.email && <p className="text-[10px] uppercase tracking-widest text-error font-bold">{errors.email.message as string}</p>}
          </div>

          {/* Input: Phone Number */}
          <div className="group relative space-y-2">
            <label className="block font-headline italic text-2xl text-on-surface-variant transition-all duration-300 group-focus-within:text-primary">
              Phone Number
            </label>
            <input 
              {...register("phone")}
              placeholder="+1 (555) 000 0000"
              className={cn(
                "w-full bg-transparent border-0 border-b py-3 px-0 focus:ring-0 transition-colors placeholder:text-outline/40 font-body text-xl text-on-surface",
                errors.phone ? "border-error" : "border-outline-variant/40 focus:border-primary"
              )}
            />
             {errors.phone && <p className="text-[10px] uppercase tracking-widest text-error font-bold">{errors.phone.message as string}</p>}
          </div>

          {/* Input: Password (Account Creation) */}
          <div className="group relative space-y-2 pt-4">
            <div className="flex justify-between items-end">
              <label className="block font-headline italic text-2xl text-on-surface-variant transition-all duration-300 group-focus-within:text-primary">
                Create Portal Password
              </label>
              <span className="text-[9px] uppercase tracking-widest text-outline font-bold">Optional</span>
            </div>
            <input 
              type="password"
              {...register("password")}
              placeholder="••••••••"
              className={cn(
                "w-full bg-transparent border-0 border-b py-3 px-0 focus:ring-0 transition-colors placeholder:text-outline/40 font-body text-xl text-on-surface",
                errors.password ? "border-error" : "border-outline-variant/40 focus:border-primary"
              )}
            />
            <p className="text-[9px] text-secondary font-body font-light italic">Enter a password to automatically create your Fishndrop portal account.</p>
             {errors.password && <p className="text-[10px] uppercase tracking-widest text-error font-bold">{errors.password.message as string}</p>}
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center gap-8">
            <button 
              type="submit"
              className="w-full sm:w-auto bg-gold-gradient text-on-primary font-body text-xs tracking-[0.2em] uppercase px-16 py-5 rounded-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all duration-500 font-bold"
            >
              Continue to Finalize
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
