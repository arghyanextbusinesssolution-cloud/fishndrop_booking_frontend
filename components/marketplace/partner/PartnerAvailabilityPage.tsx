"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { CalendarDays, CalendarX, Clock, Loader2, Lock, Plus, Save, Trash2 } from "lucide-react";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";
import type { VenueDayHours } from "@/types";
import { DAY_SHORT, WeeklyHoursEditor, dayHoursLabel, toWeeklyHours } from "@/components/marketplace/WeeklyHoursEditor";
import { PortalHeader, apiError, dateLabel } from "./shared";

interface Block {
  _id: string;
  date: string;
  startMin: number;
  endMin: number;
  reason: "manual" | "booking";
  note?: string;
  booking?: { bookingNumber: string; customerName: string; guests: number };
}

const minToLabel = (min: number) => {
  const m = ((min % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = String(m % 60).padStart(2, "0");
  return `${h % 12 || 12}:${mm} ${h < 12 ? "AM" : "PM"}`;
};
const isWholeDay = (b: Block) => b.startMin <= 0 && b.endMin >= 1440;

const todayNY = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());
const addDays = (ymd: string, n: number) => {
  const d = new Date(`${ymd}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const weekdayOf = (ymd: string) => new Date(`${ymd}T12:00:00Z`).getUTCDay();

const inputCls =
  "w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#C8A96A] [color-scheme:dark]";

/** Venue owner: weekly opening hours, a 2-week overview, and one-off blocked dates/times. */
export default function PartnerAvailabilityPage() {
  const [hours, setHours] = useState<VenueDayHours[] | null>(null);
  const [savedHours, setSavedHours] = useState("");
  const [minHours, setMinHours] = useState(1);
  const [savingHours, setSavingHours] = useState(false);
  const [blocks, setBlocks] = useState<Block[] | null>(null);
  const [form, setForm] = useState({ date: todayNY(), allDay: true, startTime: "18:00", endTime: "23:00", note: "" });
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const loadBlocks = useCallback(async () => {
    try {
      const { data } = await api.get("/marketplace/partner/blocks");
      setBlocks(data.blocks || []);
    } catch (err) {
      toast.error(apiError(err, "Couldn't load your calendar"));
      setBlocks((b) => b ?? []);
    }
  }, []);

  useEffect(() => {
    void loadBlocks();
    api
      .get("/marketplace/partner/venue")
      .then(({ data }) => {
        const h = toWeeklyHours(data.venue);
        setHours(h);
        setSavedHours(JSON.stringify(h));
        setMinHours(data.venue.minHours || 1);
      })
      .catch((err) => toast.error(apiError(err, "Couldn't load your opening hours")));
  }, [loadBlocks]);

  const hoursDirty = hours !== null && JSON.stringify(hours) !== savedHours;

  const saveHours = async () => {
    if (!hours) return;
    setSavingHours(true);
    try {
      const { data } = await api.patch("/marketplace/partner/venue/hours", { weeklyHours: hours });
      const h = toWeeklyHours({ weeklyHours: data.weeklyHours });
      setHours(h);
      setSavedHours(JSON.stringify(h));
      toast.success("Opening hours saved — customers now see these times");
    } catch (err) {
      toast.error(apiError(err, "Couldn't save opening hours"));
    } finally {
      setSavingHours(false);
    }
  };

  const addBlock = async () => {
    setSaving(true);
    try {
      await api.post("/marketplace/partner/blocks", form);
      toast.success(`${dateLabel(form.date, "MMM d")} blocked`);
      setForm((f) => ({ ...f, note: "" }));
      void loadBlocks();
    } catch (err) {
      toast.error(apiError(err, "Couldn't block that time"));
    } finally {
      setSaving(false);
    }
  };

  const removeBlock = async (b: Block) => {
    setRemoving(b._id);
    try {
      await api.delete(`/marketplace/partner/blocks/${b._id}`);
      toast.success("Unblocked");
      setBlocks((list) => list?.filter((x) => x._id !== b._id) ?? null);
    } catch (err) {
      toast.error(apiError(err, "Couldn't remove this block"));
    } finally {
      setRemoving(null);
    }
  };

  /** Next 14 days: closed by schedule / fully blocked / partly blocked or booked / open. */
  const twoWeeks = useMemo(() => {
    if (!hours) return [];
    const today = todayNY();
    // Uses saved hours so the overview matches what customers actually see.
    const live: VenueDayHours[] = savedHours ? JSON.parse(savedHours) : hours;
    return Array.from({ length: 14 }, (_, i) => {
      const date = addDays(today, i);
      const day = live.find((d) => d.day === weekdayOf(date));
      const dayBlocks = (blocks || []).filter((b) => b.date === date);
      const booked = dayBlocks.filter((b) => b.reason === "booking");
      const fullyBlocked = dayBlocks.some((b) => b.reason === "manual" && isWholeDay(b));
      const state: "closed" | "blocked" | "partial" | "open" = !day?.open
        ? "closed"
        : fullyBlocked
          ? "blocked"
          : dayBlocks.length
            ? "partial"
            : "open";
      return { date, day, state, booked: booked.length };
    });
  }, [hours, savedHours, blocks]);

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8 min-h-screen">
      <PortalHeader
        title="Availability"
        subtitle="Set the days and hours customers can book your venue, and block one-off dates when you're busy. Paid Tropica bookings are blocked automatically."
      />

      {/* Weekly opening hours */}
      <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#C8A96A]" /> Weekly opening hours
            </h2>
            <p className="text-xs text-white/50 mt-1">
              Customers can only pick start times inside these hours. Bookings are at least {minHours} hour{minHours === 1 ? "" : "s"}.
            </p>
          </div>
          <button
            type="button"
            onClick={saveHours}
            disabled={!hoursDirty || savingHours}
            className="inline-flex items-center gap-2 rounded-full bg-[#C8A96A] text-[#0d1612] px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest disabled:opacity-40"
          >
            {savingHours ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {hoursDirty ? "Save hours" : "Saved"}
          </button>
        </div>
        {hours ? (
          <WeeklyHoursEditor value={hours} onChange={setHours} minHours={minHours} />
        ) : (
          <p className="flex items-center gap-2 text-white/60 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading hours…
          </p>
        )}
      </section>

      {/* Next 14 days overview */}
      {twoWeeks.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-[#C8A96A]" /> Next 2 weeks
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {twoWeeks.map(({ date, day, state, booked }) => (
              <button
                type="button"
                key={date}
                onClick={() => setForm((f) => ({ ...f, date }))}
                title="Click to block this date"
                className={cn(
                  "text-left rounded-xl border p-3 transition-colors hover:border-[#C8A96A]/60",
                  state === "open" && "border-emerald-400/25 bg-emerald-500/[0.06]",
                  state === "partial" && "border-amber-400/30 bg-amber-500/[0.07]",
                  state === "blocked" && "border-rose-400/30 bg-rose-500/[0.07]",
                  state === "closed" && "border-white/5 bg-white/[0.02] opacity-60"
                )}
              >
                <p className="text-[10px] uppercase tracking-widest text-white/50">{DAY_SHORT[weekdayOf(date)]}</p>
                <p className="text-lg font-headline text-white leading-tight">{dateLabel(date, "MMM d")}</p>
                <p
                  className={cn(
                    "text-[11px] mt-1 leading-snug",
                    state === "open" ? "text-emerald-300" : state === "partial" ? "text-amber-300" : state === "blocked" ? "text-rose-300" : "text-white/40"
                  )}
                >
                  {state === "closed" ? "Closed" : state === "blocked" ? "Blocked" : dayHoursLabel(day)}
                </p>
                {booked > 0 && <p className="text-[10px] text-emerald-300 mt-0.5">{booked} booking{booked > 1 ? "s" : ""}</p>}
                {state === "partial" && booked === 0 && <p className="text-[10px] text-amber-300/80 mt-0.5">Some hours blocked</p>}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-4 text-[11px] text-white/50">
            <Legend cls="bg-emerald-400" label="Open for requests" />
            <Legend cls="bg-amber-400" label="Partly blocked / booked" />
            <Legend cls="bg-rose-400" label="Blocked all day" />
            <Legend cls="bg-white/30" label="Closed (weekly hours)" />
          </div>
        </section>
      )}

      {/* Block a one-off date/time */}
      <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-5">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Lock className="w-4 h-4 text-[#C8A96A]" /> Block a date or time
        </h2>
        <div className="grid sm:grid-cols-4 gap-4 items-end">
          <label className="block">
            <span className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-2">Date</span>
            <input type="date" min={todayNY()} className={inputCls} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </label>
          <label className="flex items-center gap-2 text-sm text-white/80 pb-3 cursor-pointer">
            <input type="checkbox" checked={form.allDay} onChange={(e) => setForm({ ...form, allDay: e.target.checked })} className="accent-[#C8A96A]" />
            Whole day
          </label>
          {!form.allDay && (
            <>
              <label className="block">
                <span className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-2">From</span>
                <input type="time" className={inputCls} value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
              </label>
              <label className="block">
                <span className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-2">Until</span>
                <input type="time" className={inputCls} value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
              </label>
            </>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            className={inputCls}
            value={form.note}
            maxLength={300}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            placeholder="Note for yourself (optional), e.g. Private wedding"
          />
          <button
            type="button"
            onClick={addBlock}
            disabled={saving || !form.date}
            className="shrink-0 inline-flex items-center justify-center gap-2 rounded-full bg-[#C8A96A] text-[#0d1612] px-6 py-2.5 text-[11px] font-bold uppercase tracking-widest disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Block
          </button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-white">Upcoming blocked times</h2>
        {!blocks && (
          <p className="flex items-center gap-2 text-white/60 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </p>
        )}
        {blocks?.length === 0 && (
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 text-center space-y-2">
            <CalendarX className="w-9 h-9 text-[#C8A96A] mx-auto" />
            <p className="text-sm text-white/60">Nothing blocked — customers can request any time inside your opening hours.</p>
          </div>
        )}
        {blocks?.map((b) => (
          <div key={b._id} className="flex flex-wrap items-center justify-between gap-3 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3">
            <div>
              <p className="text-white font-semibold">{dateLabel(b.date)}</p>
              <p className="text-xs text-white/60">
                {isWholeDay(b) ? "Whole day" : `${minToLabel(b.startMin)} – ${minToLabel(b.endMin)}`}
                {b.reason === "booking" && b.booking && (
                  <> · Tropica booking #{b.booking.bookingNumber} ({b.booking.customerName}, {b.booking.guests} guests)</>
                )}
                {b.note && <> · {b.note}</>}
              </p>
            </div>
            {b.reason === "manual" ? (
              <button
                type="button"
                onClick={() => removeBlock(b)}
                disabled={removing === b._id}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-white/70 hover:text-rose-300 hover:border-rose-400/40 disabled:opacity-50"
              >
                {removing === b._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />} Unblock
              </button>
            ) : (
              <span className="rounded-full bg-emerald-500/15 text-emerald-300 px-3 py-1 text-[10px] font-bold uppercase tracking-wider">Booked</span>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}

const Legend = ({ cls, label }: { cls: string; label: string }) => (
  <span className="inline-flex items-center gap-1.5">
    <span className={cn("w-2.5 h-2.5 rounded-full", cls)} /> {label}
  </span>
);
