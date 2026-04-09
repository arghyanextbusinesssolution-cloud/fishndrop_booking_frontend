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
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-3xl font-semibold text-[var(--text-primary)]">Reservation</h2>
        <p className="text-xs text-[var(--text-secondary)]">Step 1 of 3</p>
      </div>
      <p className="text-sm text-[var(--text-secondary)]">Select date, then choose a time slot and guests.</p>

      <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
        <div className="mb-3 flex items-center justify-between">
          <button type="button" onClick={() => setMonthCursor(subMonths(monthCursor, 1))} className="rounded-md border border-[var(--border)] p-2 text-[var(--text-secondary)]">
            <ChevronLeft size={16} />
          </button>
          <p className="text-sm font-semibold text-[var(--text-primary)]">{format(monthCursor, "MMMM yyyy")}</p>
          <button type="button" onClick={() => setMonthCursor(addMonths(monthCursor, 1))} className="rounded-md border border-[var(--border)] p-2 text-[var(--text-secondary)]">
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-2 text-center text-[11px] text-[var(--text-secondary)]">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((weekday) => <p key={weekday}>{weekday}</p>)}
        </div>
        <div className="mt-2 grid grid-cols-7 gap-2">
          {dateCells.map((cell, index) => {
            if (cell.type === "blank") {
              return <div key={`blank-${index}`} className="h-9 rounded-md" />;
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
                className={`h-9 rounded-md text-xs ${isSelected ? "border border-pink-500 bg-pink-500/20 text-pink-700" : "border border-[var(--border)] text-[var(--text-primary)]"} ${isPast ? "cursor-not-allowed opacity-40" : ""}`}
              >
                {format(cell.value, "d")}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div>
          <p className="mb-1 text-xs text-[var(--text-secondary)]">Selected Date</p>
          <Input id="home-date" type="text" readOnly value={date ? format(new Date(date), "PPP") : "Pick a date from calendar"} />
        </div>
        <div>
          <p className="mb-1 text-xs text-[var(--text-secondary)]">Guests</p>
          <Input id="home-party" type="number" min={2} value={partySize} onChange={(event) => setPartySize(Number(event.target.value || 2))} />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
        {slots.map((slot) => (
          <div key={slot.slot} className={`rounded-md border px-2 py-2 text-xs ${slot.isAvailable ? "border-emerald-500/40 bg-emerald-500/10" : "border-red-500/40 bg-red-500/10"}`}>
            <p className="font-medium">{slot.slot}</p>
            <p>{slot.isAvailable ? "Available" : "Fully booked"}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 flex gap-3">
        <Link href="/login" className="w-full">
          <Button className="w-full bg-[var(--accent)] text-black hover:bg-[var(--accent-hover)]">Continue Reservation</Button>
        </Link>
      </div>
      {loading ? <p className="mt-2 text-xs text-[var(--text-secondary)]">Loading slots...</p> : null}
    </div>
  );
}

