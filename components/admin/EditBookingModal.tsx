"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { CalendarDays, CreditCard, Loader2, Mail, Phone, Save, Sparkles, User as UserIcon, X } from "lucide-react";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";

const STATUSES = ["pending", "confirmed", "cancelled"];
const PAY_METHODS: [string, string][] = [["card", "Card"], ["zelle", "Zelle"], ["cash", "Cash"], ["bank_transfer", "Bank transfer"], ["other", "Other"]];
const CATERING_OPTIONS: [string, string][] = [
  ["none", "No partner catering (self-managed)"],
  ["jamaican_jerk_house", "Jamaican Jerk House (Caribbean)"],
  ["east_coast_street_tacos", "East Coast Street Tacos (Mexican)"],
  ["cooklyn_eats", "Cooklyn Eats (Soul Food)"],
  ["custom_catering", "Custom / multi-restaurant mix"]
];
const OCCASIONS = ["birthday", "anniversary", "graduation", "baby_shower", "business", "quiet", "other"];

const toDateInput = (d?: string) => (d ? String(d).slice(0, 10) : "");
const nice = (s: string) => s.replace(/_/g, " ");

const field = "w-full rounded-lg bg-black/30 border border-white/15 px-3 py-2.5 text-sm text-white outline-none focus:border-[#C8A96A] placeholder:text-white/25";
const label = "block text-[10px] uppercase tracking-[0.15em] text-white/50 font-bold mb-1.5";

interface Props {
  booking: any;
  onClose: () => void;
  onSaved: () => void;
}

/** Admin / staff form to edit a booking's customer details, guests, occasion, notes and schedule. */
export function EditBookingModal({ booking: b, onClose, onSaved }: Props) {
  const isPrivate = b.bookingType === "private_event";
  const original = {
    customerName: b.customerName || b.user?.name || "",
    customerEmail: b.customerEmail || "",
    customerPhone: b.customerPhone || "",
    partySize: String(b.partySize ?? ""),
    occasion: b.occasion || "other",
    notes: b.notes || "",
    bookingDate: toDateInput(b.bookingDate),
    bookingTime: b.bookingTime || "",
    durationHours: String(b.durationHours || (isPrivate ? 5 : 2)),
    status: b.status || "pending",
    totalAmount: String(b.totalAmount ?? 0),
    amountPaid: String(Math.max(0, (b.totalAmount || 0) - (b.remainingAmount || 0))),
    paymentMethod: b.paymentMethod || "card",
    paymentNote: "",
    needDj: b.needDj ? "yes" : "no",
    needPhotographer: b.needPhotographer ? "yes" : "no",
    photographerHours: String(b.photographerHours || 2),
    cateringMenu: b.cateringMenu || "none",
    complimentaryDrinks: String(b.complimentaryDrinks ?? 0)
  };
  const role = useAuthStore((s) => s.user?.role);
  const canEditMoney = role === "admin" || role === "owner";
  const [form, setForm] = useState(original);
  const [updateAccount, setUpdateAccount] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const cateringOptions: [string, string][] = CATERING_OPTIONS.some(([k]) => k === original.cateringMenu)
    ? CATERING_OPTIONS
    : [[original.cateringMenu, original.cateringMenu.replace(/_/g, " ")], ...CATERING_OPTIONS];
  const remaining = Math.round(((Number(form.totalAmount) || 0) - (Number(form.amountPaid) || 0)) * 100) / 100;
  const moneyChanged = form.totalAmount !== original.totalAmount || form.amountPaid !== original.amountPaid;
  const occasions = OCCASIONS.includes(original.occasion) ? OCCASIONS : [original.occasion, ...OCCASIONS];
  const contactChanged =
    form.customerName !== original.customerName || form.customerEmail !== original.customerEmail || form.customerPhone !== original.customerPhone;
  const scheduleChanged =
    form.bookingDate !== original.bookingDate || form.bookingTime !== original.bookingTime || (isPrivate && form.durationHours !== original.durationHours);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Only send what changed
    const details: Record<string, unknown> = {};
    (["customerName", "customerEmail", "customerPhone", "occasion", "notes"] as const).forEach((k) => {
      if (form[k].trim() !== original[k]) details[k] = form[k].trim();
    });
    if (form.partySize !== original.partySize) details.partySize = Number(form.partySize);
    if (form.complimentaryDrinks !== original.complimentaryDrinks) details.complimentaryDrinks = Number(form.complimentaryDrinks);
    if (isPrivate) {
      if (form.needDj !== original.needDj) details.needDj = form.needDj === "yes";
      if (form.needPhotographer !== original.needPhotographer) details.needPhotographer = form.needPhotographer === "yes";
      if (form.photographerHours !== original.photographerHours) details.photographerHours = Number(form.photographerHours);
      if (form.cateringMenu !== original.cateringMenu) details.cateringMenu = form.cateringMenu;
    }
    if (canEditMoney) {
      if (form.status !== original.status) details.status = form.status;
      if (form.paymentMethod !== original.paymentMethod) details.paymentMethod = form.paymentMethod;
      if (moneyChanged) {
        if (remaining < 0) {
          setError("Amount paid can't be more than the total");
          return;
        }
        details.totalAmount = Number(form.totalAmount);
        details.amountPaid = Number(form.amountPaid);
        if (form.paymentNote.trim()) details.paymentNote = form.paymentNote.trim();
      }
    }

    if (!Object.keys(details).length && !scheduleChanged) {
      onClose();
      return;
    }

    setSaving(true);
    let detailsSaved = false;
    try {
      if (Object.keys(details).length) {
        await api.patch(`/admin/bookings/${b._id}/details`, { ...details, updateAccount: contactChanged && updateAccount });
        detailsSaved = true;
      }
      if (scheduleChanged) {
        await api.patch(`/admin/bookings/${b._id}/reschedule`, {
          bookingDate: form.bookingDate,
          bookingTime: form.bookingTime,
          ...(isPrivate ? { durationHours: Number(form.durationHours) } : {}),
          reason: "Admin edited booking"
        });
      }
      toast.success("Booking updated");
      onSaved();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Could not save the booking";
      if (detailsSaved) {
        // Details went through; only the reschedule failed
        onSaved();
        setError(`Details saved, but the date/time wasn't changed: ${msg}`);
      } else {
        setError(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Edit booking" onClick={() => !saving && onClose()}>
      <form
        onSubmit={save}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl border border-[#C8A96A]/45 bg-gradient-to-b from-[#1a140c] via-[#0e0b07] to-[#090705] p-5 sm:p-6 text-white space-y-5 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#C8A96A] font-bold">Booking #{String(b._id).slice(-6).toUpperCase()}</p>
            <h2 className="text-xl font-bold mt-0.5">Edit booking</h2>
          </div>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Close" className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customer */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold flex items-center gap-2 text-[#E0C68E]">
            <UserIcon className="w-4 h-4" /> Customer
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label htmlFor="eb-name" className={label}>Name</label>
              <input id="eb-name" required minLength={2} maxLength={100} value={form.customerName} onChange={set("customerName")} className={field} />
            </div>
            <div>
              <label htmlFor="eb-email" className={label}>
                <Mail className="w-3 h-3 inline mr-1" /> Email
              </label>
              <input id="eb-email" type="email" required value={form.customerEmail} onChange={set("customerEmail")} className={field} />
            </div>
            <div>
              <label htmlFor="eb-phone" className={label}>
                <Phone className="w-3 h-3 inline mr-1" /> Phone
              </label>
              <input id="eb-phone" type="tel" required value={form.customerPhone} onChange={set("customerPhone")} placeholder="+1 555 000 0000" className={`${field} font-mono`} />
            </div>
          </div>
          {contactChanged && b.user && (
            <label className="flex items-start gap-2 text-xs text-white/70 cursor-pointer">
              <input type="checkbox" checked={updateAccount} onChange={(e) => setUpdateAccount(e.target.checked)} className="mt-0.5 accent-[#C8A96A]" />
              <span>
                Also update the customer&apos;s account
                <span className="block text-white/40">Their login name, email and phone change too. A new phone number must be confirmed by text code at next sign in.</span>
              </span>
            </label>
          )}
        </section>

        {/* Event */}
        <section className="space-y-3 pt-4 border-t border-white/10">
          <h3 className="text-xs font-bold flex items-center gap-2 text-[#E0C68E]">
            <CalendarDays className="w-4 h-4" /> Event
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label htmlFor="eb-date" className={label}>Date</label>
              <input id="eb-date" type="date" required value={form.bookingDate} onChange={set("bookingDate")} className={`${field} [color-scheme:dark]`} />
            </div>
            <div>
              <label htmlFor="eb-time" className={label}>Start time</label>
              <input id="eb-time" type="time" required value={form.bookingTime} onChange={set("bookingTime")} className={`${field} [color-scheme:dark]`} />
            </div>
            {isPrivate && (
              <div>
                <label htmlFor="eb-duration" className={label}>Hours</label>
                <input id="eb-duration" type="number" min={1} max={12} required value={form.durationHours} onChange={set("durationHours")} className={field} />
              </div>
            )}
            <div>
              <label htmlFor="eb-guests" className={label}>Guests</label>
              <input id="eb-guests" type="number" min={2} max={1000} required value={form.partySize} onChange={set("partySize")} className={field} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label htmlFor="eb-occasion" className={label}>Occasion</label>
              <select id="eb-occasion" value={form.occasion} onChange={set("occasion")} className={`${field} capitalize cursor-pointer`}>
                {occasions.map((o) => (
                  <option key={o} value={o} className="bg-[#140f09]">
                    {nice(o)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {scheduleChanged && (
            <p className="text-[11px] text-amber-200/90 bg-amber-500/10 border border-amber-500/25 rounded-lg px-3 py-2">
              Changing the date or time reschedules the booking and sends the update to GHL{isPrivate ? " and Google Calendar" : ""}. Table assignments aren&apos;t changed.
            </p>
          )}
          {form.partySize !== original.partySize && (
            <p className="text-[11px] text-white/45">Changing guests doesn&apos;t change the price{canEditMoney ? ". Adjust the total below if it should" : ""}.</p>
          )}
          <div>
            <label htmlFor="eb-notes" className={label}>Notes</label>
            <textarea id="eb-notes" rows={3} maxLength={3000} value={form.notes} onChange={set("notes")} className={`${field} resize-y`} placeholder="Special requests, seating notes…" />
          </div>
        </section>

        {/* Status & payment (admin / owner) */}
        {canEditMoney && (
          <section className="space-y-3 pt-4 border-t border-white/10">
            <h3 className="text-xs font-bold flex items-center gap-2 text-[#E0C68E]">
              <CreditCard className="w-4 h-4" /> Status &amp; payment
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label htmlFor="eb-status" className={label}>Status</label>
                <select id="eb-status" value={form.status} onChange={set("status")} className={`${field} capitalize cursor-pointer`}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s} className="bg-[#140f09]">{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="eb-total" className={label}>Total ($)</label>
                <input id="eb-total" type="number" min={0} step="0.01" required value={form.totalAmount} onChange={set("totalAmount")} className={field} />
              </div>
              <div>
                <label htmlFor="eb-paid" className={label}>Paid ($)</label>
                <input id="eb-paid" type="number" min={0} step="0.01" required value={form.amountPaid} onChange={set("amountPaid")} className={field} />
              </div>
              <div>
                <span className={label}>Remaining</span>
                <p className={`px-3 py-2.5 text-sm font-semibold ${remaining < 0 ? "text-rose-300" : remaining === 0 ? "text-emerald-300" : "text-white"}`}>
                  ${remaining.toFixed(2)}
                </p>
              </div>
              <div className="col-span-2">
                <label htmlFor="eb-method" className={label}>Payment method</label>
                <select id="eb-method" value={form.paymentMethod} onChange={set("paymentMethod")} className={`${field} cursor-pointer`}>
                  {PAY_METHODS.map(([v, l]) => (
                    <option key={v} value={v} className="bg-[#140f09]">{l}</option>
                  ))}
                </select>
              </div>
              {moneyChanged && (
                <div className="col-span-2">
                  <label htmlFor="eb-paynote" className={label}>Reason for change</label>
                  <input id="eb-paynote" maxLength={300} value={form.paymentNote} onChange={set("paymentNote")} placeholder="e.g. Cash balance received at door" className={field} />
                </div>
              )}
            </div>
            {moneyChanged && (
              <p className="text-[11px] text-white/45">
                Payment status is set from these numbers (fully paid, deposit paid or unpaid), and the change is logged in the payment history.
              </p>
            )}
            {form.status === "cancelled" && original.status !== "cancelled" && (
              <p className="text-[11px] text-amber-200/90 bg-amber-500/10 border border-amber-500/25 rounded-lg px-3 py-2">
                Cancelling frees the slot. No refund is issued automatically.
              </p>
            )}
          </section>
        )}

        {/* Add-ons */}
        <section className="space-y-3 pt-4 border-t border-white/10">
          <h3 className="text-xs font-bold flex items-center gap-2 text-[#E0C68E]">
            <Sparkles className="w-4 h-4" /> {isPrivate ? "Add-ons & drinks" : "Drinks"}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {isPrivate && (
              <>
                <div>
                  <label htmlFor="eb-dj" className={label}>DJ</label>
                  <select id="eb-dj" value={form.needDj} onChange={set("needDj")} className={`${field} cursor-pointer`}>
                    <option value="no" className="bg-[#140f09]">No</option>
                    <option value="yes" className="bg-[#140f09]">Yes</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="eb-photo" className={label}>Photographer</label>
                  <select id="eb-photo" value={form.needPhotographer} onChange={set("needPhotographer")} className={`${field} cursor-pointer`}>
                    <option value="no" className="bg-[#140f09]">No</option>
                    <option value="yes" className="bg-[#140f09]">Yes</option>
                  </select>
                </div>
                {form.needPhotographer === "yes" && (
                  <div>
                    <label htmlFor="eb-photo-hrs" className={label}>Photo hours</label>
                    <input id="eb-photo-hrs" type="number" min={1} max={12} value={form.photographerHours} onChange={set("photographerHours")} className={field} />
                  </div>
                )}
                <div className="col-span-2">
                  <label htmlFor="eb-catering" className={label}>Catering</label>
                  <select id="eb-catering" value={form.cateringMenu} onChange={set("cateringMenu")} className={`${field} cursor-pointer`}>
                    {cateringOptions.map(([v, l]) => (
                      <option key={v} value={v} className="bg-[#140f09]">{l}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
            <div>
              <label htmlFor="eb-drinks" className={label}>Free drinks</label>
              <input id="eb-drinks" type="number" min={0} max={5000} value={form.complimentaryDrinks} onChange={set("complimentaryDrinks")} className={field} />
            </div>
          </div>
          {isPrivate && (
            <p className="text-[11px] text-white/45">Add-on changes don&apos;t change the price. Adjust the total above if they should.</p>
          )}
        </section>

        {error && <p className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex gap-2 justify-end pt-1">
          <button type="button" onClick={onClose} disabled={saving} className="px-4 py-2.5 rounded-lg border border-white/15 text-xs font-bold hover:bg-white/5 cursor-pointer">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#C8A96A] via-[#E0C68E] to-[#C8A96A] text-[#0a120e] text-xs font-black uppercase tracking-wider inline-flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save changes
          </button>
        </div>
      </form>
    </div>
  );
}
