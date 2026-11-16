"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Handshake, Loader2, Save } from "lucide-react";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";
import type { AdminVenueRow } from "./VenueOwnerWizard";

type Terms = { partnerDiscountPct: number; customerDiscountPct: number; depositPct: number; status: AdminVenueRow["status"] };

const money = (n = 0) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
const r2 = (n: number) => Math.round(n * 100) / 100;

/** Same math as the backend pricing service — shown live while the admin types. */
const preview = (regular: number, t: Terms) => {
  const customerPrice = r2(regular * (1 - t.customerDiscountPct / 100));
  const venuePayout = r2(regular * (1 - t.partnerDiscountPct / 100));
  return { customerPrice, venuePayout, commission: r2(customerPrice - venuePayout), deposit: r2(customerPrice * (t.depositPct / 100)) };
};

/**
 * Settings → Partner Venue Commission (admin/owner). One row per venue owner: the negotiated
 * partner discount, the discount passed on to customers, deposit %, and live/hidden status.
 */
export const VenueCommissionSettings = () => {
  const [venues, setVenues] = useState<AdminVenueRow[] | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Terms>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/admin/marketplace/venues");
      const list: AdminVenueRow[] = data.venues || [];
      setVenues(list);
      setDrafts(
        Object.fromEntries(
          list.map((v) => [
            v._id,
            { partnerDiscountPct: v.partnerDiscountPct, customerDiscountPct: v.customerDiscountPct, depositPct: v.depositPct, status: v.status }
          ])
        )
      );
    } catch {
      setVenues([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const update = (id: string, patch: Partial<Terms>) => setDrafts((d) => ({ ...d, [id]: { ...d[id], ...patch } }));

  const save = async (v: AdminVenueRow) => {
    const t = drafts[v._id];
    if (t.customerDiscountPct > t.partnerDiscountPct) {
      toast.error("Customer discount can't be bigger than the partner discount.");
      return;
    }
    setSaving(v._id);
    try {
      const { data } = await api.patch(`/admin/marketplace/venues/${v._id}/commission`, t);
      setVenues((list) => list?.map((x) => (x._id === v._id ? { ...x, ...data.venue } : x)) ?? null);
      toast.success(`${v.name}: terms saved${t.status === "published" ? " — venue is live" : ""}`);
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Couldn't save terms");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div id="partner-commission" className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl scroll-mt-24">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#C8A96A]/10 border border-[#C8A96A]/30 flex items-center justify-center text-[#C8A96A]">
            <Handshake className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Partner Venue Commission</h2>
            <p className="text-xs text-white/50">
              Partner discount = what the venue gives Tropica. Customer discount = what we pass on. The difference is Tropica&apos;s commission.
            </p>
          </div>
        </div>
        <Link href="/admin/venue-owners" className="text-xs text-[#C8A96A] font-bold uppercase tracking-wider">
          Manage venue owners →
        </Link>
      </div>

      {!venues && (
        <p className="flex items-center gap-2 text-white/60 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading venues…
        </p>
      )}
      {venues?.length === 0 && (
        <p className="text-sm text-white/50">
          No partner venues yet. Employees add them from <strong className="text-white">Venue Owners</strong>.
        </p>
      )}

      <div className="space-y-4">
        {venues?.map((v) => {
          const t = drafts[v._id];
          if (!t) return null;
          const regular = v.commissionPreview?.regularPrice || 0;
          const p = preview(regular, t);
          const invalid = t.customerDiscountPct > t.partnerDiscountPct;
          const dirty =
            t.partnerDiscountPct !== v.partnerDiscountPct ||
            t.customerDiscountPct !== v.customerDiscountPct ||
            t.depositPct !== v.depositPct ||
            t.status !== v.status;
          return (
            <div key={v._id} className="bg-white/[0.02] border border-white/10 rounded-xl p-4 sm:p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-8 rounded-full" style={{ background: v.theme?.primary || "#C8A96A" }} />
                  <div>
                    <p className="text-white font-semibold">{v.name}</p>
                    <p className="text-[11px] text-white/50">
                      {v.owner?.name || v.ownerName} · {v.owner?.email || v.ownerEmail}
                    </p>
                  </div>
                </div>
                <select
                  value={t.status}
                  onChange={(e) => update(v._id, { status: e.target.value as Terms["status"] })}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-bold bg-[#0D1612] focus:outline-none",
                    t.status === "published" ? "border-emerald-400/40 text-emerald-300" : t.status === "paused" ? "border-amber-400/40 text-amber-300" : "border-white/15 text-white/70"
                  )}
                >
                  <option value="draft">Draft · hidden</option>
                  <option value="published">Live on website</option>
                  <option value="paused">Paused</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <PctField label="Partner discount" hint="Off the venue's regular price" value={t.partnerDiscountPct} onChange={(n) => update(v._id, { partnerDiscountPct: n })} />
                <PctField label="Customer discount" hint="Passed on to the customer" value={t.customerDiscountPct} onChange={(n) => update(v._id, { customerDiscountPct: n })} invalid={invalid} />
                <PctField label="Deposit to confirm" hint="100% = pay in full" value={t.depositPct} min={1} onChange={(n) => update(v._id, { depositPct: n })} />
              </div>

              {regular > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                  <Stat label={`Regular (${v.commissionPreview.basis})`} value={money(regular)} />
                  <Stat label="Customer pays" value={money(p.customerPrice)} />
                  <Stat label="Venue receives" value={money(p.venuePayout)} />
                  <Stat label="Tropica earns" value={money(p.commission)} highlight={!invalid} warn={invalid} />
                  <Stat label="Deposit" value={money(p.deposit)} />
                </div>
              )}
              {invalid && <p className="text-xs text-rose-300">Customer discount is bigger than the partner discount — Tropica would lose money.</p>}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => save(v)}
                  disabled={!dirty || invalid || saving === v._id}
                  className="inline-flex items-center gap-2 rounded-full bg-[#C8A96A] text-[#0d1612] px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest disabled:opacity-40"
                >
                  {saving === v._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save terms
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const PctField = ({
  label,
  hint,
  value,
  onChange,
  min = 0,
  invalid
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  invalid?: boolean;
}) => (
  <div>
    <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-2">{label}</label>
    <div className="relative">
      <input
        type="number"
        step="0.5"
        min={min}
        max={100}
        value={value}
        onChange={(e) => onChange(Math.min(100, Math.max(min, parseFloat(e.target.value) || 0)))}
        className={cn(
          "w-full bg-white/5 border rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none",
          invalid ? "border-rose-400/60" : "border-white/15 focus:border-[#C8A96A]"
        )}
      />
      <span className="absolute right-4 top-2.5 text-xs text-white/40 font-bold">%</span>
    </div>
    <p className="text-[11px] text-white/40 mt-1.5">{hint}</p>
  </div>
);

const Stat = ({ label, value, highlight, warn }: { label: string; value: string; highlight?: boolean; warn?: boolean }) => (
  <div className={cn("rounded-lg border px-3 py-2", highlight ? "border-[#C8A96A]/40 bg-[#C8A96A]/10" : warn ? "border-rose-400/40 bg-rose-500/10" : "border-white/10")}>
    <p className="text-[10px] uppercase tracking-wider text-white/40 truncate">{label}</p>
    <p className={cn("font-bold", highlight ? "text-[#C8A96A]" : warn ? "text-rose-300" : "text-white")}>{value}</p>
  </div>
);

export default VenueCommissionSettings;
