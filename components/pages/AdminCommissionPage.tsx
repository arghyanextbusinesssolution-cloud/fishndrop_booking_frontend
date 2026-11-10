"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { AlertTriangle, History, Info, Loader2, Percent, Save } from "lucide-react";
import api from "@/lib/axios";

type FeeMode = "customer_paid" | "promoter_paid";

interface AuditEntry {
  modifiedByName?: string;
  modifiedAt: string;
  changes: Record<string, { previous: unknown; current: unknown }>;
  notes?: string;
}

const FEE_KEYS = ["platformFeePercent", "platformFixedFee", "feeMode"];
const FEE_LABEL: Record<string, string> = {
  platformFeePercent: "Commission %",
  platformFixedFee: "Fixed fee / ticket",
  feeMode: "Who pays"
};

// Stripe's standard US card pricing, used only for the estimate shown to the admin
const STRIPE_PCT = 2.9;
const STRIPE_FIXED = 0.3;

const money = (n: number) =>
  `$${(Number.isFinite(n) ? n : 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const round2 = (n: number) => Math.round(n * 100) / 100;
const showVal = (k: string, v: unknown) =>
  k === "feeMode"
    ? v === "promoter_paid"
      ? "Promoter (deducted)"
      : "Customer (added on top)"
    : k === "platformFeePercent"
    ? `${v}%`
    : money(Number(v));

export default function AdminCommissionPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<{ pct: number; fixed: number; mode: FeeMode } | null>(null);
  const [pct, setPct] = useState("3");
  const [fixed, setFixed] = useState("0");
  const [mode, setMode] = useState<FeeMode>("customer_paid");
  const [notes, setNotes] = useState("");
  const [history, setHistory] = useState<AuditEntry[]>([]);

  // Example calculator
  const [exPrice, setExPrice] = useState("50");
  const [exQty, setExQty] = useState("2");

  const load = async () => {
    try {
      const { data } = await api.get("/admin/settings/pricing");
      const s = data.settings || {};
      const next = { pct: s.platformFeePercent ?? 3, fixed: s.platformFixedFee ?? 0, mode: (s.feeMode || "customer_paid") as FeeMode };
      setSaved(next);
      setPct(String(next.pct));
      setFixed(String(next.fixed));
      setMode(next.mode);
      setHistory(
        ((s.auditHistory || []) as AuditEntry[])
          .filter((h) => Object.keys(h.changes || {}).some((k) => FEE_KEYS.includes(k)))
          .reverse()
          .slice(0, 15)
      );
    } catch {
      toast.error("Could not load commission settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const pctNum = Number(pct);
  const fixedNum = Number(fixed);
  const pctValid = pct.trim() !== "" && Number.isFinite(pctNum) && pctNum >= 0 && pctNum <= 50;
  const fixedValid = fixed.trim() !== "" && Number.isFinite(fixedNum) && fixedNum >= 0 && fixedNum <= 100;
  const dirty = !!saved && (pctNum !== saved.pct || fixedNum !== saved.fixed || mode !== saved.mode);

  /* Same formula as the server checkout */
  const example = useMemo(() => {
    const price = Math.max(0, Number(exPrice) || 0);
    const qty = Math.max(1, Math.floor(Number(exQty) || 1));
    const subtotal = round2(price * qty);
    const fee = round2((subtotal * (pctValid ? pctNum : 0)) / 100 + (fixedValid ? fixedNum : 0) * qty);
    const buyerPays = mode === "customer_paid" ? round2(subtotal + fee) : subtotal;
    const promoterGets = round2(buyerPays - fee);
    const stripeCost = buyerPays > 0 ? round2((buyerPays * STRIPE_PCT) / 100 + STRIPE_FIXED) : 0;
    const tropicaNet = round2(fee - stripeCost);
    return { price, qty, subtotal, fee, buyerPays, promoterGets, stripeCost, tropicaNet };
  }, [exPrice, exQty, pctNum, fixedNum, mode, pctValid, fixedValid]);

  const save = async () => {
    if (!pctValid) return toast.error("Commission must be between 0% and 50%");
    if (!fixedValid) return toast.error("Fixed fee must be between $0 and $100");
    setSaving(true);
    try {
      const { data } = await api.patch("/admin/settings/pricing", {
        platformFeePercent: round2(pctNum),
        platformFixedFee: round2(fixedNum),
        feeMode: mode,
        notes: notes.trim() || "Ticket commission updated from Commission page"
      });
      if (data.success) {
        toast.success(data.changesMade ? "Commission updated. New ticket orders use it right away." : "No changes to save");
        setNotes("");
        await load();
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Failed to save commission");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-32 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#C8A96A]" />
      </div>
    );
  }

  const share = (n: number) => (example.buyerPays > 0 ? Math.max(0, (n / example.buyerPays) * 100) : 0);
  const input =
    "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#C8A96A]";

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-5xl mx-auto text-white space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.25em] text-[#C8A96A] font-bold">Event Ticketing</p>
        <h1 className="text-3xl font-headline italic">Commission</h1>
        <p className="text-xs text-white/50 mt-1">
          Tropica&apos;s cut of every event ticket sale. Stripe sends it to the Tropica account automatically and pays the rest to the promoter.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Settings */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 space-y-5">
          <div>
            <label htmlFor="cm-pct" className="block text-xs font-medium text-white/80 uppercase tracking-wider mb-1.5">
              Commission percentage
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={20}
                step={0.5}
                value={pctValid ? Math.min(pctNum, 20) : 0}
                onChange={(e) => setPct(e.target.value)}
                className="flex-1 accent-[#C8A96A]"
                aria-label="Commission percentage slider"
              />
              <div className="relative w-28">
                <input
                  id="cm-pct"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={50}
                  step={0.1}
                  value={pct}
                  onChange={(e) => setPct(e.target.value)}
                  className={`${input} pr-9 text-right font-bold ${pctValid ? "" : "border-rose-500/60"}`}
                />
                <Percent className="w-4 h-4 text-[#C8A96A] absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
            {!pctValid && <p className="text-[11px] text-rose-300 mt-1">Enter a value from 0 to 50.</p>}
          </div>

          <div>
            <label htmlFor="cm-fixed" className="block text-xs font-medium text-white/80 uppercase tracking-wider mb-1.5">
              Extra fixed fee per ticket (optional)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-white/50">$</span>
              <input
                id="cm-fixed"
                type="number"
                inputMode="decimal"
                min={0}
                step={0.05}
                value={fixed}
                onChange={(e) => setFixed(e.target.value)}
                className={`${input} pl-8 ${fixedValid ? "" : "border-rose-500/60"}`}
              />
            </div>
          </div>

          <div>
            <p className="block text-xs font-medium text-white/80 uppercase tracking-wider mb-1.5">Who pays the commission?</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" role="radiogroup">
              {(
                [
                  ["customer_paid", "Customer", "Added on top of the ticket price at checkout"],
                  ["promoter_paid", "Promoter", "Taken out of the promoter's payout"]
                ] as const
              ).map(([value, title, sub]) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={mode === value}
                  onClick={() => setMode(value)}
                  className={`text-left rounded-xl border p-3 transition-colors cursor-pointer ${
                    mode === value ? "border-[#C8A96A] bg-[#C8A96A]/10" : "border-white/10 hover:border-white/25"
                  }`}
                >
                  <span className="block text-sm font-bold">{title}</span>
                  <span className="block text-[11px] text-white/50">{sub}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="cm-notes" className="block text-xs font-medium text-white/80 uppercase tracking-wider mb-1.5">
              Reason for change (saved in history)
            </label>
            <input
              id="cm-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Holiday season rate"
              className={input}
            />
          </div>

          <button
            type="button"
            onClick={save}
            disabled={saving || !dirty || !pctValid || !fixedValid}
            className="w-full py-3.5 bg-[#C8A96A] hover:bg-[#d8b97a] text-[#070B09] font-bold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving…" : dirty ? "Save commission" : "Saved"}
          </button>

          <p className="flex items-start gap-2 text-[11px] text-white/45">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#C8A96A]" />
            Applies to new ticket orders immediately. A custom rate set for a specific promoter (Verify Promoters) still takes priority over this default.
          </p>
        </div>

        {/* Example */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 space-y-5">
          <h2 className="text-sm font-bold">Example sale</h2>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-[11px] text-white/60">
              Ticket price
              <input type="number" min={0} value={exPrice} onChange={(e) => setExPrice(e.target.value)} className={`${input} mt-1`} />
            </label>
            <label className="text-[11px] text-white/60">
              Tickets
              <input type="number" min={1} value={exQty} onChange={(e) => setExQty(e.target.value)} className={`${input} mt-1`} />
            </label>
          </div>

          {/* Where the buyer's money goes */}
          <div>
            <div className="flex h-3 rounded-full overflow-hidden gap-[2px] bg-[#0c1a14]" aria-hidden>
              <div className="bg-[#4A86CF]" style={{ width: `${share(example.promoterGets)}%` }} />
              <div className="bg-[#B8872A]" style={{ width: `${share(example.fee)}%` }} />
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-white/70">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#4A86CF]" /> Promoter
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#B8872A]" /> Tropica commission
              </span>
            </div>
          </div>

          <dl className="divide-y divide-white/5 text-sm tabular-nums">
            <div className="flex justify-between py-2">
              <dt className="text-white/60">Tickets ({example.qty} × {money(example.price)})</dt>
              <dd>{money(example.subtotal)}</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-white/60">Buyer pays</dt>
              <dd className="font-bold">{money(example.buyerPays)}</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-white/60">Promoter receives</dt>
              <dd className="font-bold">{money(example.promoterGets)}</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-white/60">Tropica commission</dt>
              <dd className="font-bold text-[#E0C68E]">{money(example.fee)}</dd>
            </div>
            <div className="flex justify-between py-2 text-white/50 text-xs">
              <dt>Stripe card fee, paid by Tropica (est. {STRIPE_PCT}% + {money(STRIPE_FIXED)})</dt>
              <dd>−{money(example.stripeCost)}</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-white/60">Tropica keeps (estimate)</dt>
              <dd className={`font-bold ${example.tropicaNet < 0 ? "text-rose-300" : "text-emerald-300"}`}>{money(example.tropicaNet)}</dd>
            </div>
          </dl>

          {example.tropicaNet < 0 && (
            <p className="flex items-start gap-2 text-[11px] text-amber-200 bg-amber-400/10 border border-amber-400/30 rounded-xl px-3 py-2.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              At this rate Stripe&apos;s card fee is bigger than the commission, so Tropica loses money on this sale. Consider a higher percentage or a small fixed fee per ticket.
            </p>
          )}
        </div>
      </div>

      {/* History */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 flex items-center gap-2">
          <History className="w-4 h-4 text-[#C8A96A]" />
          <h2 className="text-sm font-bold">Change history</h2>
        </div>
        {history.length === 0 ? (
          <p className="px-5 py-6 text-xs text-white/40">No commission changes yet. The default is 3%.</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {history.map((h, i) => (
              <li key={i} className="px-5 py-3 text-xs space-y-1">
                <div className="flex flex-wrap justify-between gap-2 text-white/50">
                  <span>{h.modifiedByName || "Admin"}</span>
                  <span>{new Date(h.modifiedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</span>
                </div>
                {Object.entries(h.changes)
                  .filter(([k]) => FEE_KEYS.includes(k))
                  .map(([k, c]) => (
                    <p key={k}>
                      <span className="text-white/60">{FEE_LABEL[k]}:</span> {showVal(k, c.previous)} → <strong>{showVal(k, c.current)}</strong>
                    </p>
                  ))}
                {h.notes && <p className="text-white/40 italic">{h.notes}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
