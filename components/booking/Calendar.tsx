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
      <div className="flex justify-between items-center mb-10">
        <button
          onClick={() => canGoPrev && setCurrentMonth(new Date(year, month - 1))}
          disabled={!canGoPrev}
          className={cn(
            "w-12 h-12 flex items-center justify-center rounded-full transition-all group",
            canGoPrev
              ? "hover:bg-surface-container-low cursor-pointer"
              : "opacity-30 cursor-not-allowed"
          )}
        >
          <ChevronLeft className="w-5 h-5 text-secondary group-hover:text-primary" />
        </button>
        <h2 className="font-headline text-3xl md:text-4xl italic text-on-surface">{monthName} {year}</h2>
        <button
          onClick={() => setCurrentMonth(new Date(year, month + 1))}
          className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-surface-container-low transition-colors group"
        >
          <ChevronRight className="w-5 h-5 text-secondary group-hover:text-primary" />
        </button>
      </div>

      {/* Current Date Display */}
      <div className="flex items-center justify-center gap-3 mb-8 py-3 px-6 bg-primary/5 rounded-full border border-primary/10 mx-auto w-fit">
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary">
          Today is {today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </span>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-y-6 md:gap-y-8">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="text-center text-[10px] uppercase tracking-[0.2em] font-bold text-outline pb-4 border-b border-outline-variant/10">
            {day}
          </div>
        ))}

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
                "text-center font-headline italic text-lg md:text-2xl py-1 md:py-3 relative transition-all duration-300",
                isDisabled
                  ? "text-outline/20 cursor-not-allowed"
                  : "cursor-pointer hover:text-primary-container",
                isSelected && "text-on-primary-container",
                isToday && !isSelected && "text-primary font-bold"
              )}
              onClick={() => !isDisabled && onSelect(new Date(year, month, d.day))}
            >
              <div className="flex items-center justify-center relative">
                <div
                  className={cn(
                    "w-9 h-9 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-500",
                    isSelected
                      ? "bg-primary-container shadow-xl shadow-primary-container/30 ring-4 md:ring-8 ring-primary-container/10 scale-110"
                      : isToday
                        ? "bg-primary/10 ring-2 ring-primary/30"
                        : "bg-transparent",
                    !isDisabled && !isSelected && !isToday && "hover:bg-surface-container-low"
                  )}
                >
                  {d.day.toString().padStart(2, "0")}
                </div>

                {/* Today dot indicator */}
                {isToday && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
