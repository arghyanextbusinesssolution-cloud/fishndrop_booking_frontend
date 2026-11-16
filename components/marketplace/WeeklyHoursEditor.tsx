"use client";

import { Copy, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VenueDayHours } from "@/types";

export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
/** Show the week Monday-first, like most venues think about it. */
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

export const time12 = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return `${h % 12 || 12}${m ? `:${String(m).padStart(2, "0")}` : ""} ${h < 12 ? "AM" : "PM"}`;
};

export const closesAfterMidnight = (d: Pick<VenueDayHours, "openTime" | "closeTime">) => d.closeTime <= d.openTime;

export const dayHoursLabel = (d?: VenueDayHours) =>
  !d || !d.open ? "Closed" : `${time12(d.openTime)} – ${time12(d.closeTime)}${closesAfterMidnight(d) ? " (next day)" : ""}`;

/** Build a 7-day schedule from legacy fields when a venue has no per-day hours yet. */
export const toWeeklyHours = (v: {
  weeklyHours?: VenueDayHours[];
  operatingDays?: number[];
  openTime?: string;
  closeTime?: string;
}): VenueDayHours[] => {
  if (v.weeklyHours?.length === 7) return [...v.weeklyHours].sort((a, b) => a.day - b.day);
  const days = v.operatingDays?.length ? v.operatingDays : [0, 1, 2, 3, 4, 5, 6];
  return [0, 1, 2, 3, 4, 5, 6].map((day) => ({
    day,
    open: days.includes(day),
    openTime: v.openTime || "12:00",
    closeTime: v.closeTime || "23:00"
  }));
};

const durationHours = (d: VenueDayHours) => {
  const [oh, om] = d.openTime.split(":").map(Number);
  const [ch, cm] = d.closeTime.split(":").map(Number);
  let mins = ch * 60 + cm - (oh * 60 + om);
  if (mins <= 0) mins += 1440;
  return mins / 60;
};

const timeInput =
  "bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C8A96A] [color-scheme:dark] disabled:opacity-30";

/**
 * 7-row opening-hours table: open/closed toggle + from/until per day, "copy to all open days",
 * and a hint when a day closes after midnight or is shorter than the minimum booking.
 */
export const WeeklyHoursEditor = ({
  value,
  onChange,
  minHours
}: {
  value: VenueDayHours[];
  onChange: (v: VenueDayHours[]) => void;
  minHours?: number;
}) => {
  const update = (day: number, patch: Partial<VenueDayHours>) => onChange(value.map((d) => (d.day === day ? { ...d, ...patch } : d)));
  const copyToAll = (src: VenueDayHours) =>
    onChange(value.map((d) => (d.open ? { ...d, openTime: src.openTime, closeTime: src.closeTime } : d)));

  return (
    <div className="rounded-xl border border-white/10 divide-y divide-white/5 overflow-hidden">
      {WEEK_ORDER.map((dayIdx) => {
        const d = value.find((x) => x.day === dayIdx);
        if (!d) return null;
        const short = d.open && minHours ? durationHours(d) < minHours : false;
        return (
          <div key={d.day} className={cn("flex flex-wrap items-center gap-3 px-4 py-3", d.open ? "bg-white/[0.02]" : "bg-transparent")}>
            <label className="flex items-center gap-3 w-36 cursor-pointer">
              <button
                type="button"
                role="switch"
                aria-checked={d.open}
                aria-label={`${DAY_NAMES[d.day]} open`}
                onClick={() => update(d.day, { open: !d.open })}
                className={cn("relative w-10 h-6 rounded-full transition-colors shrink-0", d.open ? "bg-[#C8A96A]" : "bg-white/15")}
              >
                <span className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all", d.open ? "left-[18px]" : "left-0.5")} />
              </button>
              <span className={cn("text-sm font-semibold", d.open ? "text-white" : "text-white/40")}>{DAY_NAMES[d.day]}</span>
            </label>

            {d.open ? (
              <>
                <div className="flex items-center gap-2">
                  <input type="time" aria-label={`${DAY_NAMES[d.day]} opens`} className={timeInput} value={d.openTime} onChange={(e) => update(d.day, { openTime: e.target.value })} />
                  <span className="text-white/40 text-xs">to</span>
                  <input type="time" aria-label={`${DAY_NAMES[d.day]} closes`} className={timeInput} value={d.closeTime} onChange={(e) => update(d.day, { closeTime: e.target.value })} />
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  {closesAfterMidnight(d) && (
                    <span className="inline-flex items-center gap-1 text-sky-300/80">
                      <Moon className="w-3 h-3" /> closes next day
                    </span>
                  )}
                  {short && <span className="text-amber-300">shorter than {minHours}h minimum</span>}
                  <button type="button" onClick={() => copyToAll(d)} className="inline-flex items-center gap-1 text-white/40 hover:text-[#C8A96A]">
                    <Copy className="w-3 h-3" /> copy to all open days
                  </button>
                </div>
              </>
            ) : (
              <span className="text-sm text-white/40">Closed</span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default WeeklyHoursEditor;
