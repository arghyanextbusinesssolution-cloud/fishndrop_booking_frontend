"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  addMonths,
  endOfMonth,
  format,
  getDay,
  isSameDay,
  isSameMonth,
  startOfMonth,
  subMonths
} from "date-fns";
import { useBookings } from "@/hooks/useBookings";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function HomeReservationPreview() {
  const { getAvailability } = useBookings();
  const [monthCursor, setMonthCursor] = useState(new Date());
  const [date, setDate] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [slots, setSlots] = useState<{ slot: string; isAvailable: boolean; message: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const monthStart = startOfMonth(monthCursor);
  const monthEnd = endOfMonth(monthCursor);
  const leadingBlanks = getDay(monthStart);
  const daysInMonth = monthEnd.getDate();

  const dateCells: Array<{ type: "blank" } | { type: "day"; value: Date }> = [];
  for (let i = 0; i < leadingBlanks; i += 1) {
    dateCells.push({ type: "blank" });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    dateCells.push({ type: "day", value: new Date(monthCursor.getFullYear(), monthCursor.getMonth(), day) });
  }

  useEffect(() => {
    const run = async () => {
      if (!date) return;
      setLoading(true);
      try {
        const data = await getAvailability(date, partySize);
        setSlots(data.slots);
      } catch {
        setSlots([]);
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [date, partySize, getAvailability]);

  return (
    <div className="glass-card-high rounded-2xl p-6 relative overflow-hidden">
      {/* Top embellishment */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gold-gradient" />
      
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-headline italic text-3xl text-on-surface">Reservations</h2>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="font-label text-[10px] tracking-widest uppercase text-primary font-bold">Step 1 of 3</span>
        </div>
      </div>
      <p className="font-body text-xs text-on-surface/50 mb-8">Select your preferred date, then choose a time slot and guests to begin your journey.</p>

      <div className="mt-4 rounded-xl border border-outline-variant/10 glass-card p-4">
        <div className="mb-4 flex items-center justify-between">
          <button 
            type="button" 
            onClick={() => setMonthCursor(subMonths(monthCursor, 1))} 
            className="w-10 h-10 flex items-center justify-center rounded-full border border-outline-variant/20 text-on-surface/60 hover:text-primary hover:border-primary transition-all"
          >
            <ChevronLeft size={16} />
          </button>
          <p className="font-headline italic text-lg text-on-surface">{format(monthCursor, "MMMM yyyy")}</p>
          <button 
            type="button" 
            onClick={() => setMonthCursor(addMonths(monthCursor, 1))} 
            className="w-10 h-10 flex items-center justify-center rounded-full border border-outline-variant/20 text-on-surface/60 hover:text-primary hover:border-primary transition-all"
          >
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-2 text-center text-[10px] uppercase tracking-widest font-bold text-on-surface/30 mb-2">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((weekday) => <p key={weekday}>{weekday}</p>)}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {dateCells.map((cell, index) => {
            if (cell.type === "blank") {
              return <div key={`blank-${index}`} className="h-10 rounded-lg" />;
            }
            const isSelected = date ? isSameDay(new Date(date), cell.value) : false;
            const isCurrentMonth = isSameMonth(cell.value, monthCursor);
            const isPast = cell.value < new Date(new Date().setHours(0, 0, 0, 0));
            return (
              <button
                key={cell.value.toISOString()}
                type="button"
                disabled={!isCurrentMonth || isPast}
                onClick={() => setDate(format(cell.value, "yyyy-MM-dd"))}
                className={cn(
                  "h-10 rounded-lg text-[11px] font-headline italic transition-all border duration-500",
                  isSelected 
                    ? "bg-emerald-gradient border-primary text-on-primary shadow-xl shadow-primary/30 scale-105" 
                    : "border-outline-variant/10 text-on-surface/60 hover:border-primary/40 hover:text-on-surface",
                  isPast && "cursor-not-allowed opacity-10"
                )}
              >
                {format(cell.value, "d")}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <p className="font-label text-[10px] uppercase tracking-widest text-primary font-bold">Selected Date</p>
          <div className="bg-surface-container/30 border border-outline-variant/20 text-on-surface text-sm rounded-lg p-3 italic">
            {date ? format(new Date(date), "PPP") : "Pick a date..."}
          </div>
        </div>
        <div className="space-y-1.5">
          <p className="font-label text-[10px] uppercase tracking-widest text-primary font-bold">Guests</p>
          <input 
            type="number" 
            min={2} 
            max={8}
            value={partySize} 
            onChange={(event) => setPartySize(Number(event.target.value || 2))}
            className="w-full bg-surface-container/30 border border-outline-variant/20 text-on-surface text-sm rounded-lg p-3 focus:outline-none focus:border-primary transition-all"
          />
        </div>
      </div>

      {slots.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-2 md:grid-cols-4">
          {slots.map((slot) => (
            <div key={slot.slot} className={cn(
              "rounded-lg border px-3 py-2 text-center transition-all duration-500",
              slot.isAvailable 
                ? "border-primary/20 bg-primary/5 text-primary" 
                : "border-error/10 bg-error/5 text-on-surface/30 grayscale"
            )}>
              <p className="font-headline italic text-sm">{slot.slot}</p>
              <p className="text-[9px] uppercase tracking-widest font-bold">{slot.isAvailable ? "Available" : "Full"}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8">
        <Link href={`/book-table?date=${date}`} className="w-full">
          <button className="w-full py-4 bg-gold-gradient text-on-primary font-label text-[10px] tracking-[0.25em] uppercase font-bold rounded-lg shadow-2xl shadow-primary/40 hover:scale-[1.02] active:scale-95 transition-all duration-700">
            Continue Bespoke Reservation
          </button>
        </Link>
      </div>
      {loading && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <div className="w-3 h-3 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <span className="text-[10px] uppercase tracking-widest text-on-surface/30 italic">Curating availability...</span>
        </div>
      )}
    </div>
  );
}

