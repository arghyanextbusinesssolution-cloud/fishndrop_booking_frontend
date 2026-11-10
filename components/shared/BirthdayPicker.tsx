"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Birthday calendar.
 *  • Opens straight on the date calendar.
 *  • Tap the month or year in the header to change it (quick grids), or use ‹ › to step months.
 * Value is a plain calendar date "YYYY-MM-DD" ("" until a day is chosen).
 */

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MIN_YEAR = 1920;
const MIN_AGE = 13;

const pad = (n: number) => String(n).padStart(2, "0");
const parse = (v: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || "");
  return m ? { year: Number(m[1]), month: Number(m[2]) - 1, day: Number(m[3]) } : null;
};
const daysIn = (year: number, month: number) => new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
const firstWeekday = (year: number, month: number) => new Date(Date.UTC(year, month, 1)).getUTCDay();

export const formatBirthday = (v: string) => {
  const p = parse(v);
  return p ? `${MONTHS[p.month]} ${p.day}, ${p.year}` : "";
};

type View = "years" | "months" | "days";

interface BirthdayPickerProps {
  value: string;
  onChange: (value: string) => void;
  /** Tighter layout for popups / modals. */
  compact?: boolean;
  className?: string;
}

export function BirthdayPicker({ value, onChange, compact = false, className }: BirthdayPickerProps) {
  const selected = parse(value);
  const latest = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - MIN_AGE);
    return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
  }, []);

  const [view, setView] = useState<View>("days");
  const [viewYear, setViewYear] = useState(selected?.year ?? latest.year - 12);
  const [viewMonth, setViewMonth] = useState(selected?.month ?? new Date().getMonth());
  const yearGridRef = useRef<HTMLDivElement>(null);

  const years = useMemo(() => Array.from({ length: latest.year - MIN_YEAR + 1 }, (_, i) => latest.year - i), [latest.year]);

  // Year grid: centre the current year inside the grid (never scrolls the page)
  useEffect(() => {
    if (view !== "years" || !yearGridRef.current) return;
    const el = yearGridRef.current.querySelector<HTMLElement>(`[data-year="${viewYear}"]`);
    if (el) yearGridRef.current.scrollTop = el.offsetTop - yearGridRef.current.clientHeight / 2 + el.clientHeight / 2;
  }, [view, viewYear]);

  const isAfterLatest = (y: number, m: number, d: number) =>
    y > latest.year || (y === latest.year && (m > latest.month || (m === latest.month && d > latest.day)));

  const pickYear = (y: number) => {
    setViewYear(y);
    if (y === latest.year && viewMonth > latest.month) setViewMonth(latest.month);
    setView("days");
  };

  const pickMonth = (m: number) => {
    setViewMonth(m);
    setView("days");
  };

  const pickDay = (d: number) => {
    onChange(`${viewYear}-${pad(viewMonth + 1)}-${pad(d)}`);
  };

  const shiftMonth = (delta: number) => {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    if (y < MIN_YEAR || y > latest.year || (y === latest.year && m > latest.month)) return;
    setViewMonth(m);
    setViewYear(y);
  };

  const cell = compact ? "h-10 text-sm" : "h-11 sm:h-12 text-sm sm:text-base";
  const canPrev = !(viewYear === MIN_YEAR && viewMonth === 0);
  const canNext = !(viewYear === latest.year && viewMonth >= latest.month);

  return (
    <div className={cn("w-full", className)}>
      {/* Selected value */}
      <div
        className={cn(
          "flex items-center gap-3 rounded-2xl border px-4 transition-colors",
          compact ? "py-3 mb-3" : "py-4 mb-4",
          selected ? "border-[#C8A96A]/60 bg-[#C8A96A]/10" : "border-white/10 bg-white/[0.03]"
        )}
      >
        <CalendarDays className={cn("w-5 h-5 shrink-0", selected ? "text-[#E0C68E]" : "text-white/35")} />
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/45">Your birthday</p>
          <p className={cn("font-semibold truncate", compact ? "text-sm" : "text-base", selected ? "text-white" : "text-white/35")}>
            {selected ? formatBirthday(value) : "Select a date"}
          </p>
        </div>
      </div>

      {/* Calendar card */}
      <div className={cn("rounded-2xl border border-white/10 bg-[#0b1511]/80", compact ? "p-3" : "p-4 sm:p-5")}>
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            disabled={view !== "days" || !canPrev}
            aria-label="Previous month"
            className="h-9 w-9 flex items-center justify-center rounded-full text-white/70 hover:bg-white/10 disabled:opacity-0 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setView(view === "months" ? "days" : "months")}
              aria-label="Change month"
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors cursor-pointer",
                view === "months" ? "border-[#C8A96A] bg-[#C8A96A] text-[#0d1612]" : "border-white/15 text-white hover:bg-white/10"
              )}
            >
              {MONTHS[viewMonth]}
              <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", view === "months" && "rotate-180")} />
            </button>
            <button
              type="button"
              onClick={() => setView(view === "years" ? "days" : "years")}
              aria-label="Change year"
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-semibold tabular-nums transition-colors cursor-pointer",
                view === "years" ? "border-[#C8A96A] bg-[#C8A96A] text-[#0d1612]" : "border-white/15 text-white hover:bg-white/10"
              )}
            >
              {viewYear}
              <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", view === "years" && "rotate-180")} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => shiftMonth(1)}
            disabled={view !== "days" || !canNext}
            aria-label="Next month"
            className="h-9 w-9 flex items-center justify-center rounded-full text-white/70 hover:bg-white/10 disabled:opacity-0 cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Hint */}
        <p className="text-center text-[11px] text-white/45 mb-3">
          {view === "years" ? "Select the year" : view === "months" ? "Select the month" : "Tap the month or year above to change it"}
        </p>

        {/* Years */}
        {view === "years" && (
          <div
            ref={yearGridRef}
            className={cn("grid grid-cols-4 gap-2 overflow-y-auto pr-1 [scrollbar-width:thin]", compact ? "max-h-52" : "max-h-64")}
          >
            {years.map((y) => {
              const isSel = selected?.year === y;
              const isView = viewYear === y;
              return (
                <button
                  key={y}
                  data-year={y}
                  type="button"
                  onClick={() => pickYear(y)}
                  className={cn(
                    "rounded-xl tabular-nums font-medium transition-colors cursor-pointer",
                    cell,
                    isSel || isView ? "bg-[#C8A96A] text-[#0d1612] font-bold" : "text-white/80 hover:bg-white/10"
                  )}
                >
                  {y}
                </button>
              );
            })}
          </div>
        )}

        {/* Months */}
        {view === "months" && (
          <div className="grid grid-cols-3 gap-2">
            {MONTHS.map((name, m) => {
              const disabled = viewYear === latest.year && m > latest.month;
              const isSel = selected?.year === viewYear && selected.month === m;
              return (
                <button
                  key={name}
                  type="button"
                  disabled={disabled}
                  onClick={() => pickMonth(m)}
                  className={cn(
                    "rounded-xl font-medium transition-colors cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed",
                    cell,
                    isSel ? "bg-[#C8A96A] text-[#0d1612] font-bold" : viewMonth === m ? "bg-white/10 text-white" : "text-white/80 hover:bg-white/10"
                  )}
                >
                  {name.slice(0, 3)}
                </button>
              );
            })}
          </div>
        )}

        {/* Days */}
        {view === "days" && (
          <div>
            <div className="grid grid-cols-7 gap-1 mb-1">
              {WEEKDAYS.map((w) => (
                <span key={w} className="text-center text-[11px] font-bold uppercase tracking-wider text-white/35 py-1">
                  {w}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstWeekday(viewYear, viewMonth) }, (_, i) => (
                <span key={`b${i}`} aria-hidden />
              ))}
              {Array.from({ length: daysIn(viewYear, viewMonth) }, (_, i) => i + 1).map((d) => {
                const disabled = isAfterLatest(viewYear, viewMonth, d);
                const isSel = selected?.year === viewYear && selected.month === viewMonth && selected.day === d;
                return (
                  <button
                    key={d}
                    type="button"
                    disabled={disabled}
                    aria-pressed={isSel}
                    aria-label={`${MONTHS[viewMonth]} ${d}, ${viewYear}`}
                    onClick={() => pickDay(d)}
                    className={cn(
                      "rounded-full font-medium tabular-nums transition-colors cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed",
                      cell,
                      isSel ? "bg-[#C8A96A] text-[#0d1612] font-bold shadow-lg shadow-[#C8A96A]/30" : "text-white/85 hover:bg-white/10"
                    )}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BirthdayPicker;
