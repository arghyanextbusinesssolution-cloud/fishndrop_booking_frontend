"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarProps {
  onSelect: (date: Date) => void;
  selectedDate: Date | null;
}

export const Calendar = ({ onSelect, selectedDate }: CalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date()); 

  // Helper to generate days for the month
  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const monthName = currentMonth.toLocaleString("default", { month: "long" });
  const year = currentMonth.getFullYear();

  const days = [];
  const totalDays = daysInMonth(year, currentMonth.getMonth());
  const startDay = firstDayOfMonth(year, currentMonth.getMonth());

  // Previous month trailing days
  for (let i = startDay - 1; i >= 0; i--) {
    days.push({ day: 31 - i, current: false }); // Simplified trailing
  }

  // Current month days
  for (let i = 1; i <= totalDays; i++) {
    days.push({ day: i, current: true });
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-12">
        <button 
          onClick={() => setCurrentMonth(new Date(year, currentMonth.getMonth() - 1))}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-low transition-colors group"
        >
          <ChevronLeft className="w-5 h-5 text-secondary group-hover:text-primary" />
        </button>
        <h2 className="font-headline text-3xl md:text-4xl italic">{monthName} {year}</h2>
        <button 
          onClick={() => setCurrentMonth(new Date(year, currentMonth.getMonth() + 1))}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-low transition-colors group"
        >
          <ChevronRight className="w-5 h-5 text-secondary group-hover:text-primary" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-8 md:gap-y-12">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="text-center text-[10px] uppercase tracking-[0.2em] font-bold text-outline pb-4">
            {day}
          </div>
        ))}

        {days.map((d, i) => {
          const isSelected = selectedDate?.getDate() === d.day && selectedDate?.getMonth() === currentMonth.getMonth() && d.current;
          const isCurrentDay = d.day === 4 && d.current; // Mocking "04" as current date for aesthetic matching

          return (
            <div 
              key={i} 
              className={cn(
                "text-center font-headline italic text-2xl py-4 relative cursor-pointer transition-all duration-300",
                !d.current ? "text-outline/30" : "text-on-surface hover:text-primary-container",
                isSelected && "text-on-primary-container"
              )}
              onClick={() => d.current && onSelect(new Date(year, currentMonth.getMonth(), d.day))}
            >
              <div className="flex items-center justify-center relative">
                <div className={cn(
                  "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500",
                  isSelected ? "bg-primary-container shadow-xl shadow-primary-container/30 ring-8 ring-primary-container/10 scale-110" : "bg-transparent"
                )}>
                  {d.day.toString().padStart(2, '0')}
                </div>
                {isCurrentDay && !isSelected && (
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
