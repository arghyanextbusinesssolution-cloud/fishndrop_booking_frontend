"use client";

import { useState } from "react";
import { ArrowRight, Gift, PartyPopper } from "lucide-react";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";
import Cookies from "js-cookie";
import { BirthdayPicker } from "@/components/shared/BirthdayPicker";
import { cn } from "@/lib/utils";

interface StepBirthdayProps {
  onNext: (data: { guestDetails?: { dateOfBirth: string } }) => void;
  initialDob?: string;
  /** Party date "YYYY-MM-DD", to tell the host when the party is near their birthday. */
  partyDate?: string | null;
}

/** Days from the party to the host's nearest birthday (negative = birthday before the party). */
const daysFromBirthday = (dob: string, partyDate: string): number | null => {
  const b = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob);
  const p = /^(\d{4})-(\d{2})-(\d{2})/.exec(partyDate);
  if (!b || !p) return null;
  const party = Date.UTC(Number(p[1]), Number(p[2]) - 1, Number(p[3]));
  const py = Number(p[1]);
  const nearest = [py - 1, py, py + 1]
    .map((y) => Date.UTC(y, Number(b[2]) - 1, Number(b[3])))
    .reduce((a, c) => (Math.abs(c - party) < Math.abs(a - party) ? c : a));
  return Math.round((nearest - party) / 86400000);
};

const ageOnParty = (dob: string, partyDate: string): number | null => {
  const b = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob);
  const p = /^(\d{4})-(\d{2})-(\d{2})/.exec(partyDate);
  if (!b || !p) return null;
  const [py, pm, pd] = [Number(p[1]), Number(p[2]), Number(p[3])];
  const hadBirthday = pm > Number(b[2]) || (pm === Number(b[2]) && pd >= Number(b[3]));
  return py - Number(b[1]) - (hadBirthday ? 0 : 1);
};


export const StepBirthday = ({ onNext, initialDob = "", partyDate }: StepBirthdayProps) => {
  const [dob, setDob] = useState(initialDob);
  const [saving, setSaving] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);

  const days = dob && partyDate ? daysFromBirthday(dob, partyDate) : null;
  const age = dob && partyDate ? ageOnParty(dob, partyDate) : null;
  const nearParty = days !== null && Math.abs(days) <= 7;

  const handleContinue = async () => {
    if (!dob) return;
    setSaving(true);
    // Host is phone-verified by now: keep the birthday on their account too (best effort)
    try {
      if (Cookies.get("token")) {
        const { data } = await api.post("/auth/update-profile", { dateOfBirth: dob });
        const token = Cookies.get("token");
        if (data?.success && data.user && token) setAuth(data.user, token);
      }
    } catch {
      /* still sent with the booking */
    } finally {
      setSaving(false);
    }
    onNext({ guestDetails: { dateOfBirth: dob } });
  };

  return (
    <div className="max-w-lg mx-auto space-y-8">
      {/* Header */}
      <header className="space-y-3 text-center">
        <div className="flex items-center justify-center gap-4">
          <span className="font-headline italic text-[#C8A96A] text-base">05.</span>
          <div className="h-[1px] w-8 bg-white/20"></div>
          <span className="font-label uppercase tracking-widest text-[10px] text-white/50 font-bold">Birthday Bonus</span>
        </div>
        <h2 className="font-headline italic text-4xl md:text-5xl text-white leading-tight">
          When&apos;s Your <span className="text-gold-gradient">Birthday?</span>
        </h2>
        <p className="text-white/60 font-body text-sm md:text-base font-light max-w-md mx-auto">
          Add your birthday to get a special bonus when you celebrate with us. It&apos;s optional.
        </p>
      </header>

      {/* Calendar */}
      <BirthdayPicker value={dob} onChange={setDob} />

      {/* Birthday bonus status */}
      {dob && (
        <div
          className={cn(
            "flex items-start gap-3 rounded-2xl border p-4",
            nearParty ? "border-emerald-400/40 bg-emerald-500/10" : "border-white/10 bg-white/[0.03]"
          )}
        >
          {nearParty ? (
            <PartyPopper className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
          ) : (
            <Gift className="w-5 h-5 text-[#C8A96A] shrink-0 mt-0.5" />
          )}
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-white">
              {nearParty ? (days === 0 ? "Your party is on your birthday!" : "Birthday bonus unlocked!") : "Birthday saved"}
            </p>
            <p className="text-xs text-white/60">
              {nearParty
                ? days === 0
                  ? "Happy birthday in advance. Our team will know it's your day."
                  : `Your party is ${Math.abs(days!)} day${Math.abs(days!) === 1 ? "" : "s"} ${days! > 0 ? "before" : "after"} your birthday.${
                      age !== null ? ` Here's to ${age + (days! > 0 ? 1 : 0)}!` : ""
                    }`
                : "We'll send you birthday perks when your big day comes around."}
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={handleContinue}
          disabled={!dob || saving}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-[#C8A96A] via-[#E8CB8A] to-[#C8A96A] text-[#0d1612] font-black font-label text-xs uppercase tracking-[0.2em] shadow-xl shadow-[#C8A96A]/30 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>{saving ? "Saving…" : "Continue"}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onNext({})}
          className="w-full py-2 text-white/50 hover:text-white font-label uppercase tracking-widest text-[11px] font-bold transition-colors cursor-pointer"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
};

export default StepBirthday;
