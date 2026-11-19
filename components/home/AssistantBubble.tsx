"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths
} from "date-fns";
import {
  ArrowLeft,
  CalendarCheck,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MessageSquareText,
  Phone,
  Send,
  Sparkles,
  X
} from "lucide-react";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";

/**
 * Homepage assistant bubble (bottom-right): greets visitors and offers
 *   • Book the venue  • Call us  • Send a quick inquiry (→ POST /api/inquiries → GHL lead)
 * Closable; once closed it stays a small button for the rest of the visit.
 */

const PHONE_DISPLAY = "1-866-990-7422";
const PHONE_TEL = "tel:+18669907422";
const DISMISS_KEY = "tropica_assistant_dismissed";

type View = "menu" | "form" | "sent";

const INTERESTS = [
  { value: "venue", label: "Private venue / party" },
  { value: "walkthrough", label: "Walkthrough / tour" },
  { value: "catering", label: "Catering" },
  { value: "event", label: "Corporate or other event" },
  { value: "other", label: "Something else" }
];

/** "YYYY-MM-DD" ↔ local Date (no timezone shifts) */
const toYmd = (d: Date) => format(d, "yyyy-MM-dd");
const fromYmd = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/** Tropica-themed date picker that opens inline (the panel scrolls, so no floating popover to get clipped). */
function ThemedDatePicker({ value, onChange }: { value: string; onChange: (ymd: string) => void }) {
  const [open, setOpen] = useState(false);
  const today = startOfDay(new Date());
  const selected = value ? fromYmd(value) : null;
  const [month, setMonth] = useState<Date>(selected || today);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month));
    const end = endOfWeek(endOfMonth(month));
    const out: Date[] = [];
    for (let d = start; !isBefore(end, d); d = addDays(d, 1)) out.push(d);
    return out;
  }, [month]);

  const canGoBack = isBefore(startOfMonth(today), startOfMonth(month));

  return (
    <div className="space-y-1.5">
      <span className="text-[11px] text-white/50">Event date</span>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={cn(
          "w-full flex items-center justify-between gap-2 bg-white/[0.06] border rounded-xl px-3 py-2.5 text-sm transition-colors text-left",
          open ? "border-[#C8A96A]" : "border-white/15 hover:border-white/30"
        )}
      >
        <span className={selected ? "text-white" : "text-white/35"}>{selected ? format(selected, "EEE, MMM d, yyyy") : "Pick a date"}</span>
        <CalendarDays className="w-4 h-4 text-[#C8A96A] shrink-0" />
      </button>

      {open && (
        <div className="assistant-drop rounded-2xl border border-[#C8A96A]/35 bg-[#0F3D2E] p-3 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => canGoBack && setMonth((m) => subMonths(m, 1))}
              disabled={!canGoBack}
              aria-label="Previous month"
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-25 disabled:hover:bg-transparent"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-headline italic text-base text-[#E3C281]">{format(month, "MMMM yyyy")}</span>
            <button
              type="button"
              onClick={() => setMonth((m) => addMonths(m, 1))}
              aria-label="Next month"
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:bg-white/10 hover:text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 text-center text-[10px] uppercase tracking-wider text-[#C8A96A]/70 font-bold mb-1">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <span key={d} className="py-1">
                {d}
              </span>
            ))}
          </div>
          <div key={format(month, "yyyy-MM")} className="grid grid-cols-7 gap-0.5 assistant-rise">
            {days.map((d) => {
              const past = isBefore(d, today);
              const inMonth = isSameMonth(d, month);
              const isSel = selected ? isSameDay(d, selected) : false;
              const isToday = isSameDay(d, today);
              return (
                <button
                  key={d.toISOString()}
                  type="button"
                  disabled={past}
                  onClick={() => {
                    onChange(toYmd(d));
                    setOpen(false);
                  }}
                  className={cn(
                    "h-8 rounded-lg text-xs font-semibold transition-all",
                    isSel
                      ? "bg-[#C8A96A] text-[#0F3D2E] shadow-[0_0_14px_rgba(200,169,106,0.5)]"
                      : past
                        ? "text-white/15 cursor-not-allowed"
                        : inMonth
                          ? "text-white/85 hover:bg-[#C8A96A]/20 hover:text-white"
                          : "text-white/30 hover:bg-white/5",
                    isToday && !isSel && "ring-1 ring-[#C8A96A]/70"
                  )}
                >
                  {format(d, "d")}
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between pt-2 mt-1 border-t border-white/10 text-xs">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="text-white/50 hover:text-white"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                setMonth(today);
                onChange(toYmd(today));
                setOpen(false);
              }}
              className="text-[#C8A96A] font-bold hover:text-[#E3C281]"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function AssistantBubble({ showGreeting = true }: { showGreeting?: boolean } = {}) {
  const [open, setOpen] = useState(false);
  const [teaser, setTeaser] = useState(false);
  const [view, setView] = useState<View>("menu");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", eventDate: "", guests: "", interest: "venue", message: "", website: "" });

  // Show a small greeting a few seconds after landing — unless they closed it earlier this visit
  useEffect(() => {
    if (!showGreeting) return;
    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      /* storage blocked */
    }
    if (dismissed) return;
    const t = setTimeout(() => setTeaser(true), 4000);
    return () => clearTimeout(t);
  }, [showGreeting]);

  const dismissTeaser = () => {
    setTeaser(false);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* storage blocked */
    }
  };

  const openPanel = () => {
    setTeaser(false);
    setOpen(true);
  };

  const closePanel = () => {
    setOpen(false);
    dismissTeaser();
    if (view === "sent") {
      setView("menu");
      setForm((f) => ({ ...f, message: "" }));
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.name.trim() || form.phone.replace(/\D/g, "").length < 10) {
      setError("Please add your name and a valid phone number.");
      return;
    }
    setSending(true);
    try {
      await api.post("/inquiries", { ...form, guests: form.guests ? Number(form.guests) : undefined, page: typeof window !== "undefined" ? window.location.pathname : "/" });
      setView("sent");
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          `We couldn't send that right now — please call us at ${PHONE_DISPLAY}.`
      );
    } finally {
      setSending(false);
    }
  };

  const field =
    "assistant-field w-full bg-white/[0.06] border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/35 outline-none focus:border-[#C8A96A] transition-colors";

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[90] flex flex-col items-end gap-3 max-w-[calc(100vw-2rem)]">
      {/* Greeting teaser */}
      {teaser && !open && (
        <div className="assistant-pop relative w-72 max-w-full rounded-2xl rounded-br-md bg-[#0d1612] border border-[#C8A96A]/40 shadow-2xl p-4 pr-9">
          <button
            type="button"
            onClick={dismissTeaser}
            aria-label="Close message"
            className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={openPanel} className="text-left space-y-1">
            <p className="text-sm font-bold text-white">Hi! Planning a celebration? 🎉</p>
            <p className="text-xs text-white/70 leading-relaxed">
              Book Tropica for your event, call us, or send a quick inquiry — we&apos;re happy to help.
            </p>
          </button>
        </div>
      )}

      {/* Panel */}
      {open && (
        <div
          role="dialog"
          aria-label="Tropica assistant"
          className="assistant-pop w-[22rem] max-w-full max-h-[min(38rem,calc(100vh-7rem))] overflow-y-auto rounded-2xl bg-[#0d1612] border border-[#C8A96A]/40 shadow-2xl"
        >
          <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-[#0F3D2E] border-b border-[#C8A96A]/25">
            {view === "form" ? (
              <button
                type="button"
                onClick={() => setView("menu")}
                aria-label="Back"
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <span className="w-9 h-9 rounded-full bg-[#C8A96A] text-[#0F3D2E] flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </span>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white leading-tight">Tropica Assistant</p>
              <p className="text-[11px] text-[#C8A96A]">Private venue · Brooklyn, NY</p>
            </div>
            <button
              type="button"
              onClick={closePanel}
              aria-label="Close assistant"
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {view === "menu" && (
            <div className="p-4 space-y-3">
              <div className="assistant-rise rounded-2xl rounded-tl-md bg-white/[0.06] border border-white/10 px-3.5 py-3 text-sm text-white/85 leading-relaxed">
                Welcome to Tropica! 👋 Would you like to reserve the venue for your event, talk to our team, or send us a quick inquiry?
              </div>
              <div className="grid gap-2 assistant-stagger">
                <Link
                  href="/book-venue"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl bg-[#C8A96A] text-[#0F3D2E] px-4 py-3 text-sm font-bold hover:brightness-110 transition"
                >
                  <CalendarCheck className="w-4 h-4 shrink-0" /> Book the venue
                </Link>
                <a
                  href={PHONE_TEL}
                  className="flex items-center gap-3 rounded-xl border border-[#C8A96A]/40 text-white px-4 py-3 text-sm font-semibold hover:bg-white/5 transition"
                >
                  <Phone className="w-4 h-4 shrink-0 text-[#C8A96A]" />
                  <span>
                    Call us <span className="text-white/60 font-normal">· {PHONE_DISPLAY}</span>
                  </span>
                </a>
                <button
                  type="button"
                  onClick={() => setView("form")}
                  className="flex items-center gap-3 rounded-xl border border-[#C8A96A]/40 text-white px-4 py-3 text-sm font-semibold hover:bg-white/5 transition text-left"
                >
                  <MessageSquareText className="w-4 h-4 shrink-0 text-[#C8A96A]" /> Send a quick inquiry
                </button>
              </div>
              <p className="text-[11px] text-white/45 text-center">Up to 30 seated · 40 standing · from $50 per guest</p>
            </div>
          )}

          {view === "form" && (
            <form onSubmit={submit} className="assistant-rise p-4 space-y-3" noValidate>
              <p className="text-sm text-white/80">Tell us a little about your event and our team will reach out.</p>
              <input className={field} placeholder="Full name *" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input
                className={field}
                placeholder="Mobile number *"
                inputMode="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              <input
                className={field}
                placeholder="Email (optional)"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <ThemedDatePicker value={form.eventDate} onChange={(eventDate) => setForm((f) => ({ ...f, eventDate }))} />
              <label className="block space-y-1.5">
                <span className="text-[11px] text-white/50">Number of guests</span>
                <input
                  className={field}
                  inputMode="numeric"
                  placeholder="e.g. 25"
                  value={form.guests}
                  onChange={(e) => setForm({ ...form, guests: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                />
              </label>
              <select className={cn(field, "cursor-pointer")} value={form.interest} onChange={(e) => setForm({ ...form, interest: e.target.value })}>
                {INTERESTS.map((i) => (
                  <option key={i.value} value={i.value} className="bg-[#0d1612]">
                    {i.label}
                  </option>
                ))}
              </select>
              <textarea
                className={cn(field, "resize-none")}
                rows={3}
                placeholder="Anything else? (occasion, catering, questions…)"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
              {/* Honeypot — hidden from people, bots fill it */}
              <input
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="hidden"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
              />
              {error && <p className="text-xs text-red-300">{error}</p>}
              <button
                type="submit"
                disabled={sending}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#C8A96A] text-[#0F3D2E] px-4 py-3 text-sm font-bold hover:brightness-110 transition disabled:opacity-60"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send inquiry
              </button>
              <p className="text-[11px] text-white/45 text-center">
                Prefer to talk now? Call{" "}
                <a href={PHONE_TEL} className="text-[#C8A96A] underline">
                  {PHONE_DISPLAY}
                </a>
              </p>
            </form>
          )}

          {view === "sent" && (
            <div className="assistant-pop p-6 text-center space-y-3">
              <span className="w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-300 flex items-center justify-center mx-auto">
                <Check className="w-6 h-6" />
              </span>
              <p className="text-base font-bold text-white">Thanks, {form.name.split(" ")[0] || "there"}!</p>
              <p className="text-sm text-white/70">Our team has your inquiry and will reach out shortly at {form.phone}.</p>
              <Link
                href="/book-venue"
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#C8A96A] text-[#0F3D2E] px-4 py-2.5 text-sm font-bold hover:brightness-110"
              >
                <CalendarCheck className="w-4 h-4" /> See available dates
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Launcher */}
      <button
        type="button"
        onClick={() => (open ? closePanel() : openPanel())}
        aria-label={open ? "Close assistant" : "Open Tropica assistant"}
        className={cn(
          "assistant-pop w-14 h-14 rounded-full bg-[#C8A96A] text-[#0F3D2E] shadow-[0_8px_30px_rgba(0,0,0,0.45)] flex items-center justify-center hover:scale-105 active:scale-95 transition-transform",
          // gentle gold pulse while closed, to draw the eye
          !open && "assistant-pulse"
        )}
      >
        <span key={open ? "x" : "spark"} className="assistant-icon-in flex">
          {open ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
        </span>
      </button>
    </div>
  );
}

export default AssistantBubble;
