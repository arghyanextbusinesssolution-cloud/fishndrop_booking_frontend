"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import {
  DollarSign,
  TrendingUp,
  Percent,
  Clock,
  Shield,
  Save,
  History,
  CheckCircle2,
  AlertCircle,
  Building,
  Music,
  Camera
} from "lucide-react";

interface AuditEntry {
  modifiedByName?: string;
  modifiedAt: string;
  changes: Record<string, { previous: any; current: any }>;
  notes?: string;
}

interface SystemSettings {
  platformFeePercent: number;
  platformFixedFee: number;
  feeMode: "customer_paid" | "promoter_paid";
  perGuestPrice: number;
  maxGuestCapacity: number;
  djPrice: number;
  photographerBasePrice: number;
  photographerExtraHourPrice: number;
  extraHourPrice: number;
  minDepositAmount: number;
  auditHistory: AuditEntry[];
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notes, setNotes] = useState("");

  // Editable fields
  const [platformFeePercent, setPlatformFeePercent] = useState<number>(3.0);
  const [platformFixedFee, setPlatformFixedFee] = useState<number>(0.0);
  const [feeMode, setFeeMode] = useState<"customer_paid" | "promoter_paid">("customer_paid");
  const [perGuestPrice, setPerGuestPrice] = useState<number>(50);
  const [maxGuestCapacity, setMaxGuestCapacity] = useState<number>(40);
  const [djPrice, setDjPrice] = useState<number>(300);
  const [photographerBasePrice, setPhotographerBasePrice] = useState<number>(300);
  const [photographerExtraHourPrice, setPhotographerExtraHourPrice] = useState<number>(150);
  const [extraHourPrice, setExtraHourPrice] = useState<number>(125);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get("/admin/settings/pricing");
      if (data.success && data.settings) {
        const s = data.settings;
        setSettings(s);
        setPlatformFeePercent(s.platformFeePercent ?? 3.0);
        setPlatformFixedFee(s.platformFixedFee ?? 0.0);
        setFeeMode(s.feeMode ?? "customer_paid");
        setPerGuestPrice(s.perGuestPrice ?? 50);
        setMaxGuestCapacity(s.maxGuestCapacity ?? 40);
        setDjPrice(s.djPrice ?? 300);
        setPhotographerBasePrice(s.photographerBasePrice ?? 300);
        setPhotographerExtraHourPrice(s.photographerExtraHourPrice ?? 150);
        setExtraHourPrice(s.extraHourPrice ?? 125);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load pricing settings");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { data } = await api.patch("/admin/settings/pricing", {
        platformFeePercent,
        platformFixedFee,
        feeMode,
        perGuestPrice,
        maxGuestCapacity,
        djPrice,
        photographerBasePrice,
        photographerExtraHourPrice,
        extraHourPrice,
        notes
      });

      if (data.success) {
        toast.success("Pricing and platform fees updated with audit trail!");
        setSettings(data.settings);
        setNotes("");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 md:p-10 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-[#C8A96A]"></div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8 min-h-screen">
      <header className="space-y-1">
        <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-[#C8A96A] block">
          Platform Configuration
        </span>
        <h1 className="text-3xl md:text-4xl font-headline italic text-white">Pricing &amp; Platform Fees</h1>
        <p className="text-xs text-white/60">
          Configure venue per-guest pricing, promoter ticketing platform fees, and add-on services. All changes are validated and logged with an audit trail.
        </p>
      </header>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Section 1: Ticketing Platform Fees */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex items-center gap-3 pb-4 border-b border-white/10">
            <div className="w-10 h-10 rounded-xl bg-[#C8A96A]/10 border border-[#C8A96A]/30 flex items-center justify-center text-[#C8A96A]">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Promoter Ticketing Platform Fees</h2>
              <p className="text-xs text-white/50">
                Revenue automatically routed to Andrew&apos;s Tropica Stripe account per ticket sale.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-2">
                Service Fee Rate (%) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="50"
                  value={platformFeePercent}
                  onChange={(e) => setPlatformFeePercent(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-[#C8A96A]"
                />
                <span className="absolute right-4 top-2.5 text-xs text-white/40 font-bold">%</span>
              </div>
              <p className="text-[11px] text-white/40 mt-1.5">Provisional default: 3.0%</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-2">
                Fixed Fee per Ticket ($)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-2.5 text-xs text-white/40 font-bold">$</span>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  value={platformFixedFee}
                  onChange={(e) => setPlatformFixedFee(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white/5 border border-white/15 rounded-xl pl-8 pr-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-[#C8A96A]"
                />
              </div>
              <p className="text-[11px] text-white/40 mt-1.5">Optional flat surcharge per ticket</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-2">
                Fee Collection Mode *
              </label>
              <select
                value={feeMode}
                onChange={(e) => setFeeMode(e.target.value as any)}
                className="w-full bg-[#0D1612] border border-white/15 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-[#C8A96A]"
              >
                <option value="customer_paid">Customer-Paid (Added at Checkout)</option>
                <option value="promoter_paid">Promoter-Paid (Deducted from Payout)</option>
              </select>
              <p className="text-[11px] text-white/40 mt-1.5">Determines who pays platform fee</p>
            </div>
          </div>
        </div>

        {/* Section 2: Venue Per-Guest Booking & Capacity Rules */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex items-center gap-3 pb-4 border-b border-white/10">
            <div className="w-10 h-10 rounded-xl bg-[#C8A96A]/10 border border-[#C8A96A]/30 flex items-center justify-center text-[#C8A96A]">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Private Venue Booking Per-Guest Pricing</h2>
              <p className="text-xs text-white/50">
                New pricing model: Base price calculated per guest with hard capacity limit.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-2">
                Price Per Guest ($) *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-2.5 text-xs text-white/40 font-bold">$</span>
                <input
                  type="number"
                  min="1"
                  value={perGuestPrice}
                  onChange={(e) => setPerGuestPrice(parseFloat(e.target.value) || 50)}
                  className="w-full bg-white/5 border border-white/15 rounded-xl pl-8 pr-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-[#C8A96A]"
                />
              </div>
              <p className="text-[11px] text-white/40 mt-1.5">Current specification: ${perGuestPrice} per guest</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-2">
                Maximum Guest Capacity *
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={maxGuestCapacity}
                onChange={(e) => setMaxGuestCapacity(parseInt(e.target.value) || 40)}
                className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-[#C8A96A]"
              />
              <p className="text-[11px] text-white/40 mt-1.5">Current specification: Maximum 40 guests</p>
            </div>
          </div>
        </div>

        {/* Section 3: Add-on Services Rates */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex items-center gap-3 pb-4 border-b border-white/10">
            <div className="w-10 h-10 rounded-xl bg-[#C8A96A]/10 border border-[#C8A96A]/30 flex items-center justify-center text-[#C8A96A]">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Venue Add-On Rates</h2>
              <p className="text-xs text-white/50">
                Service rates applied during the private booking wizard.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-white/80 uppercase tracking-wider mb-1.5">
                DJ Fee ($)
              </label>
              <input
                type="number"
                min="0"
                value={djPrice}
                onChange={(e) => setDjPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-white/5 border border-white/15 rounded-xl px-3.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#C8A96A]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-white/80 uppercase tracking-wider mb-1.5">
                Photographer Base ($)
              </label>
              <input
                type="number"
                min="0"
                value={photographerBasePrice}
                onChange={(e) => setPhotographerBasePrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-white/5 border border-white/15 rounded-xl px-3.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#C8A96A]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-white/80 uppercase tracking-wider mb-1.5">
                Photo Extra Hr ($)
              </label>
              <input
                type="number"
                min="0"
                value={photographerExtraHourPrice}
                onChange={(e) => setPhotographerExtraHourPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-white/5 border border-white/15 rounded-xl px-3.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#C8A96A]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-white/80 uppercase tracking-wider mb-1.5">
                Venue Extra Hr ($)
              </label>
              <input
                type="number"
                min="0"
                value={extraHourPrice}
                onChange={(e) => setExtraHourPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-white/5 border border-white/15 rounded-xl px-3.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#C8A96A]"
              />
            </div>
          </div>
        </div>

        {/* Change Reason Note */}
        <div>
          <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-1.5">
            Audit Reason / Notes (Saved to History)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Updated platform fee to 3.0% and venue per-guest rate to $50"
            className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#C8A96A]"
          />
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="w-full py-4 bg-[#C8A96A] hover:bg-[#d8b97a] text-[#070B09] font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(200,169,106,0.3)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isSaving ? "Saving Configuration..." : "Save Pricing & Log Audit Trail"}
        </button>
      </form>

      {/* Audit History Log */}
      {settings?.auditHistory && settings.auditHistory.length > 0 && (
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <History className="w-4 h-4 text-[#C8A96A]" /> Pricing Change Audit History
          </div>

          <div className="space-y-3">
            {[...settings.auditHistory].reverse().map((entry, idx) => (
              <div key={idx} className="bg-white/[0.02] border border-white/5 rounded-xl p-3 text-xs space-y-1">
                <div className="flex items-center justify-between text-white/60 text-[11px]">
                  <span className="font-semibold text-white">{entry.modifiedByName || "Andrew (Owner)"}</span>
                  <span>{new Date(entry.modifiedAt).toLocaleString("en-US")}</span>
                </div>
                {entry.notes && <p className="text-white/80 italic">{entry.notes}</p>}
                <div className="flex flex-wrap gap-2 pt-1 text-[10px] text-[#C8A96A] font-mono">
                  {Object.entries(entry.changes).map(([k, v]: [string, any]) => (
                    <span key={k} className="bg-white/5 px-2 py-0.5 rounded">
                      {k}: {v.previous} &rarr; {v.current}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
