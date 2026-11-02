"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarProps {
  onSelect: (date: Date) => void;
  selectedDate: Date | null;
  showAvailabilityBadges?: boolean;
}

export const Calendar = ({ onSelect, selectedDate, showAvailabilityBadges = true }: CalendarProps) => {
  const [mounted, setMounted] = useState(false);
  const [today, setToday] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    setMounted(true);
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    setToday(date);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full flex items-center justify-center min-h-[380px] bg-white rounded-2xl sm:rounded-3xl">
        <div className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-[#C8A96A] animate-spin" />
      </div>
    );
  }

  // Helper to generate days for the month
  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const monthName = currentMonth.toLocaleString("default", { month: "long" });
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const days: { day: number; current: boolean }[] = [];
  const totalDays = daysInMonth(year, month);
  const startDay = firstDayOfMonth(year, month);

  // Previous month trailing days
  const prevMonthDays = daysInMonth(year, month - 1);
  for (let i = startDay - 1; i >= 0; i--) {
    days.push({ day: prevMonthDays - i, current: false });
  }

  // Current month days
  for (let i = 1; i <= totalDays; i++) {
    days.push({ day: i, current: true });
  }

  // Prevent navigating to past months
  const canGoPrev = !(year === today.getFullYear() && month <= today.getMonth());

  // Determine status for each date: NO SOLD OUT!
  // Only specific dates in a row have "1 LEFT" (e.g. Days 5, 6, 7 and Day 17)
  const isOneLeftDate = (cellDate: Date, dayNum: number): boolean => {
    if (cellDate < today) return false;
    if (!showAvailabilityBadges) return false;
    return dayNum === 5 || dayNum === 6 || dayNum === 7 || dayNum === 17;
  };

  return (
    <div className="w-full bg-white text-gray-900 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 md:p-8 shadow-xl border border-gray-100/80 select-none">
      {/* Top Header */}
      <div className="text-center mb-4 sm:mb-6">
        <h2 className="font-headline italic text-2xl sm:text-3xl md:text-4xl text-gray-900 tracking-tight">
          Pick a Date
        </h2>
        <p className="text-gray-500 font-sans text-[11px] sm:text-xs md:text-sm mt-0.5 sm:mt-1">
          Check availability instantly
        </p>
      </div>

      {/* Month Navigation Row */}
      <div className="flex items-center justify-center gap-4 sm:gap-6 mb-4 sm:mb-6">
        <button
          type="button"
          onClick={() => canGoPrev && setCurrentMonth(new Date(year, month - 1))}
          disabled={!canGoPrev}
          aria-label="Previous Month"
          className={cn(
            "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all",
            canGoPrev
              ? "text-gray-600 hover:bg-gray-100 active:scale-95 cursor-pointer"
              : "text-gray-300 cursor-not-allowed opacity-30"
          )}
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <h3 className="font-headline text-lg sm:text-xl md:text-2xl font-bold text-gray-900 tracking-tight min-w-[150px] sm:min-w-[180px] text-center">
          {monthName} <span className="font-sans font-semibold text-gray-700">{year}</span>
        </h3>

        <button
          type="button"
          onClick={() => setCurrentMonth(new Date(year, month + 1))}
          aria-label="Next Month"
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 active:scale-95 transition-all cursor-pointer"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* Day Name Headers (S M T W T F S) */}
      <div className="grid grid-cols-7 mb-2 sm:mb-3">
        {["S", "M", "T", "W", "T", "F", "S"].map((day, idx) => (
          <div
            key={idx}
            className="text-center font-sans font-bold text-[11px] sm:text-xs md:text-sm text-gray-700 py-0.5"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-y-1.5 sm:gap-y-3 gap-x-0.5 sm:gap-x-1.5">
        {days.map((d, i) => {
          const cellDate = new Date(year, month, d.day);
          cellDate.setHours(0, 0, 0, 0);

          const isSelected =
            selectedDate &&
            selectedDate.getDate() === d.day &&
            selectedDate.getMonth() === month &&
            selectedDate.getFullYear() === year &&
            d.current;

          const isToday =
            d.current &&
            d.day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear();

          const isTrailing = !d.current;
          const isPast = isTrailing || cellDate < today;
          const isOneLeft = !isPast && isOneLeftDate(cellDate, d.day);
          const isDisabled = isPast;

          return (
            <div
              key={i}
              className={cn(
                "min-h-[46px] sm:min-h-[54px] md:min-h-[60px] flex flex-col items-center justify-start relative transition-all duration-200",
                isDisabled ? "cursor-not-allowed" : "cursor-pointer group"
              )}
              onClick={() => !isDisabled && onSelect(new Date(year, month, d.day))}
            >
              {/* Date Number Container */}
              <div
                className={cn(
                  "w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center relative transition-all duration-200",
                  isSelected
                    ? "bg-[#0F3D2E] text-[#E3C281] shadow-md scale-105"
                    : isToday && !isSelected
                      ? "text-[#B45309] font-extrabold"
                      : isPast
                        ? "text-gray-300"
                        : "text-gray-900 group-hover:bg-gray-100"
                )}
              >
                <span
                  className={cn(
                    "text-sm sm:text-base md:text-lg font-headline font-bold leading-none",
                    isToday && !isSelected && "text-[#B45309]"
                  )}
                >
                  {d.day}
                </span>

                {/* Today indicator dot */}
                {isToday && !isSelected && (
                  <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#B45309]" />
                )}
              </div>

              {/* Status Label (Only 1 LEFT for select dates, NO SOLD OUT) */}
              <div className="h-3 sm:h-3.5 flex items-center justify-center mt-0.5">
                {isOneLeft && !isSelected && (
                  <span className="text-[8px] sm:text-[9px] font-extrabold text-[#C05621] uppercase tracking-wider font-sans whitespace-nowrap">
                    1 LEFT
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend at bottom: NO SOLD OUT */}
      <div className="mt-5 sm:mt-7 pt-3.5 sm:pt-4 border-t border-gray-100 flex items-center justify-center gap-6 sm:gap-8 text-[11px] sm:text-xs font-sans text-gray-600">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-gray-400" />
          <span className="font-medium text-gray-700">Available</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#C05621]" />
          <span className="font-medium text-gray-700">1 Left</span>
        </div>
      </div>
    </div>
  );
};
