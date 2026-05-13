import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarProps {
  onSelect: (date: Date) => void;
  selectedDate: Date | null;
}

export const Calendar = ({ onSelect, selectedDate }: CalendarProps) => {
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
      <div className="w-full flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
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

  return (
    <div className="w-full">
      {/* Month Navigation */}
      <div className="flex justify-between items-center mb-4 md:mb-8 px-2">
        <button
          onClick={() => canGoPrev && setCurrentMonth(new Date(year, month - 1))}
          disabled={!canGoPrev}
          className={cn(
            "text-[#E3C281] transition-all",
            canGoPrev ? "hover:scale-125 opacity-100" : "opacity-20 cursor-not-allowed"
          )}
        >
          <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
        </button>
        <h2 className="font-headline text-lg md:text-3xl font-bold text-[#E3C281] tracking-[0.1em] uppercase">
          {monthName} {year}
        </h2>
        <button
          onClick={() => setCurrentMonth(new Date(year, month + 1))}
          className="text-[#E3C281] hover:scale-125 transition-all"
        >
          <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="text-center text-[8px] md:text-[10px] uppercase tracking-widest font-bold text-white/30 py-2 md:py-4">
            {day.substring(0, 3)}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 md:gap-2">
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

          const isPast = d.current && cellDate < today;
          const isDisabled = !d.current || isPast;

          return (
            <div
              key={i}
              className={cn(
                "aspect-[4/3] flex items-center justify-center relative transition-all duration-300",
                isDisabled ? "cursor-not-allowed" : "cursor-pointer"
              )}
              onClick={() => !isDisabled && onSelect(new Date(year, month, d.day))}
            >
              <div
                className={cn(
                  "w-full h-full rounded-lg flex flex-col items-center justify-center gap-1 transition-all duration-500",
                  isSelected
                    ? "bg-[#E3C281] text-[#0F3D2E] shadow-[0_0_25px_rgba(227,194,129,0.5)] scale-110 z-10"
                    : isDisabled
                      ? "text-white/10"
                      : "text-white/80 hover:bg-[#E3C281]/20 hover:text-white"
                )}
              >
                <span className={cn(
                  "text-lg md:text-xl font-headline italic font-bold",
                  isSelected ? "text-[#0F3D2E]" : ""
                )}>
                  {d.day}
                </span>
                {isSelected && (
                  <span className="text-[7px] uppercase tracking-widest font-bold opacity-80">Chosen</span>
                )}
                {isToday && !isSelected && (
                  <div className="absolute bottom-2 w-1 h-1 rounded-full bg-[#E3C281]" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
