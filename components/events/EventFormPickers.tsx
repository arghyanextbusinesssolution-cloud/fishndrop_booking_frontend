"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, Clock, Loader2, MapPin, Search, X } from "lucide-react";
import api from "@/lib/axios";

/* ───────────── Venue-time helpers (events run on New York time) ───────────── */

export const VENUE_TZ = "America/New_York";
export const SALES_CLOSE_MINUTES = 5;

/** Current date ("YYYY-MM-DD") and minutes-since-midnight in New York. */
export const nyNow = () => {
  const parts: Record<string, string> = {};
  for (const p of new Intl.DateTimeFormat("en-CA", {
    timeZone: VENUE_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(new Date())) {
    parts[p.type] = p.value;
  }
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute)
  };
};

export const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

export const fmt12 = (t: string) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
};

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** Close a popover on outside click / Escape. */
function useDismiss(open: boolean, close: () => void, ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close, ref]);
}

const fieldBtn =
  "w-full flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-left focus:outline-none focus:border-[#C8A96A] hover:border-white/25 transition-colors cursor-pointer";
const popover =
  "absolute z-40 mt-2 rounded-2xl border border-[#C8A96A]/25 bg-[#0c1612] shadow-2xl shadow-black/60";

/* ───────────── Date picker ───────────── */

export function DatePickerField({
  value,
  onChange,
  minDate,
  id
}: {
  value: string;
  onChange: (v: string) => void;
  minDate: string; // "YYYY-MM-DD" — earlier days are disabled
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const initial = value || minDate;
  const [view, setView] = useState(() => ({ y: Number(initial.slice(0, 4)), m: Number(initial.slice(5, 7)) - 1 }));
  useDismiss(open, () => setOpen(false), ref);

  useEffect(() => {
    if (open) {
      const v = value || minDate;
      setView({ y: Number(v.slice(0, 4)), m: Number(v.slice(5, 7)) - 1 });
    }
  }, [open, value, minDate]);

  const minY = Number(minDate.slice(0, 4));
  const minM = Number(minDate.slice(5, 7)) - 1;
  const atMinMonth = view.y < minY || (view.y === minY && view.m <= minM);

  const cells = useMemo(() => {
    const first = new Date(view.y, view.m, 1).getDay();
    const days = new Date(view.y, view.m + 1, 0).getDate();
    return [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)] as (number | null)[];
  }, [view]);

  const shift = (delta: number) =>
    setView(({ y, m }) => {
      const d = new Date(y, m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });

  const label = value
    ? new Date(`${value}T12:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
    : "Select a date";

  return (
    <div ref={ref} className="relative">
      <button id={id} type="button" onClick={() => setOpen((o) => !o)} className={fieldBtn} aria-haspopup="dialog" aria-expanded={open}>
        <Calendar className="w-4 h-4 text-[#C8A96A] shrink-0" />
        <span className={value ? "text-white" : "text-white/35"}>{label}</span>
      </button>

      {open && (
        <div className={`${popover} left-0 w-[300px] max-w-[calc(100vw-2rem)] p-4`} role="dialog" aria-label="Choose event date">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => shift(-1)}
              disabled={atMinMonth}
              aria-label="Previous month"
              className="p-1.5 rounded-lg text-white/70 hover:bg-white/10 disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-headline italic text-[#E0C68E]">
              {MONTHS[view.m]} {view.y}
            </span>
            <button type="button" onClick={() => shift(1)} aria-label="Next month" className="p-1.5 rounded-lg text-white/70 hover:bg-white/10 cursor-pointer">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <div key={i} className="text-center text-[10px] font-bold uppercase text-white/35 py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              if (d === null) return <div key={`e${i}`} />;
              const key = ymd(view.y, view.m, d);
              const past = key < minDate;
              const selected = key === value;
              const today = key === minDate;
              return (
                <button
                  key={key}
                  type="button"
                  disabled={past}
                  onClick={() => {
                    onChange(key);
                    setOpen(false);
                  }}
                  aria-label={key}
                  aria-pressed={selected}
                  className={`h-9 rounded-lg text-xs font-semibold transition-colors relative ${
                    selected
                      ? "bg-[#C8A96A] text-[#0a120e]"
                      : past
                      ? "text-white/15 line-through cursor-not-allowed"
                      : "text-white hover:bg-[#C8A96A]/15 cursor-pointer"
                  } ${today && !selected ? "ring-1 ring-[#C8A96A]/50" : ""}`}
                >
                  {d}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-[10px] text-white/35">Past dates are unavailable.</p>
        </div>
      )}
    </div>
  );
}

/* ───────────── Time picker ───────────── */

const SLOTS = Array.from({ length: 96 }, (_, i) => `${pad(Math.floor(i / 4))}:${pad((i % 4) * 15)}`);

export function TimePickerField({
  value,
  onChange,
  minMinutes,
  badge,
  placeholder = "Select time",
  id
}: {
  value: string;
  onChange: (v: string) => void;
  minMinutes?: number; // slots strictly before this are disabled
  badge?: string;
  placeholder?: string;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  useDismiss(open, () => setOpen(false), ref);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const target =
      listRef.current.querySelector<HTMLElement>('[data-selected="true"]') ||
      listRef.current.querySelector<HTMLElement>('[data-enabled="true"]');
    target?.scrollIntoView({ block: "center" });
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button id={id} type="button" onClick={() => setOpen((o) => !o)} className={fieldBtn} aria-haspopup="listbox" aria-expanded={open}>
        <Clock className="w-4 h-4 text-[#C8A96A] shrink-0" />
        <span className={value ? "text-white" : "text-white/35"}>{value ? fmt12(value) : placeholder}</span>
        {badge && value && (
          <span className="ml-auto text-[9px] uppercase tracking-wider font-bold text-[#E0C68E] bg-[#C8A96A]/15 px-1.5 py-0.5 rounded">{badge}</span>
        )}
      </button>

      {open && (
        <div ref={listRef} role="listbox" className={`${popover} left-0 right-0 max-h-64 overflow-y-auto p-1.5`}>
          {SLOTS.map((t) => {
            const disabled = minMinutes !== undefined && toMinutes(t) < minMinutes;
            const selected = t === value;
            return (
              <button
                key={t}
                type="button"
                role="option"
                aria-selected={selected}
                disabled={disabled}
                data-selected={selected}
                data-enabled={!disabled}
                onClick={() => {
                  onChange(t);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  selected
                    ? "bg-[#C8A96A] text-[#0a120e] font-bold"
                    : disabled
                    ? "text-white/15 cursor-not-allowed"
                    : "text-white/85 hover:bg-[#C8A96A]/15 cursor-pointer"
                }`}
              >
                {fmt12(t)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ───────────── Venue autocomplete ───────────── */

export interface PickedPlace {
  id: string;
  name: string;
  address: string;
  lat?: number;
  lng?: number;
}

const newSession = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;

export function PlaceAutocomplete({ onSelect, id }: { onSelect: (p: PickedPlace) => void; id?: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PickedPlace[]>([]);
  const [provider, setProvider] = useState<"google" | "osm">("osm");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const session = useRef(newSession());
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(open, () => setOpen(false), ref);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) {
      setResults([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get("/places/autocomplete", { params: { q, session: session.current } });
        if (cancelled) return;
        setResults(data.suggestions || []);
        setProvider(data.provider === "google" ? "google" : "osm");
        setError(null);
        setActive(-1);
        setOpen(true);
      } catch {
        if (!cancelled) setError("Address search is unavailable. Type the venue details below.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

  const choose = async (p: PickedPlace) => {
    setOpen(false);
    setQuery(p.name);
    let place = p;
    if (p.lat === undefined && !p.id.startsWith("osm:")) {
      try {
        const { data } = await api.get("/places/details", { params: { id: p.id, session: session.current } });
        if (data.place) place = { ...p, ...data.place, name: data.place.name || p.name, address: data.place.address || p.address };
      } catch {
        /* keep the suggestion text */
      }
    }
    session.current = newSession(); // Google bills per session: end it after a pick
    onSelect(place);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open || !results.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a <= 0 ? results.length - 1 : a - 1));
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      void choose(results[active]);
    }
  };

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-xl px-4 focus-within:border-[#C8A96A] transition-colors">
        <Search className="w-4 h-4 text-[#C8A96A] shrink-0" />
        <input
          id={id}
          type="text"
          value={query}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search venue name or address…"
          className="flex-1 min-w-0 bg-transparent py-2.5 text-sm text-white placeholder-white/30 outline-none"
        />
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-white/40" />
        ) : query ? (
          <button type="button" aria-label="Clear" onClick={() => { setQuery(""); setResults([]); }} className="text-white/40 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        ) : null}
      </div>
      {error && <p className="mt-1.5 text-[11px] text-amber-300/80">{error}</p>}

      {open && query.trim().length >= 3 && (
        <div role="listbox" className={`${popover} left-0 right-0 overflow-hidden`}>
          {results.length === 0 && !loading ? (
            <p className="px-4 py-3 text-xs text-white/50">No places found. Try a different spelling or type the address below.</p>
          ) : (
            results.map((r, i) => (
              <button
                key={`${r.id}-${i}`}
                type="button"
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onClick={() => void choose(r)}
                className={`w-full flex items-start gap-3 px-4 py-2.5 text-left transition-colors cursor-pointer ${i === active ? "bg-[#C8A96A]/15" : "hover:bg-white/5"}`}
              >
                <MapPin className="w-4 h-4 text-[#C8A96A] mt-0.5 shrink-0" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-white truncate">{r.name}</span>
                  <span className="block text-[11px] text-white/50 truncate">{r.address}</span>
                </span>
              </button>
            ))
          )}
          <p className="px-4 py-1.5 text-[9px] text-right text-white/30 border-t border-white/5">
            {provider === "google" ? "Powered by Google" : "© OpenStreetMap contributors"}
          </p>
        </div>
      )}
    </div>
  );
}
