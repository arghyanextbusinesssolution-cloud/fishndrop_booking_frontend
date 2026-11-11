"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Loader2, Mail, Phone, Save, User as UserIcon, X } from "lucide-react";
import api from "@/lib/axios";
import type { AdminUser } from "@/types";

const field =
  "w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:border-emerald-600";
const label = "flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-outline font-bold mb-1.5";

/** Auto-generated guest emails aren't real addresses; show them as empty so admins can type a real one. */
const realEmail = (e?: string) => (e && !e.includes("@fishndrop.com") ? e : "");

interface Props {
  user: AdminUser;
  onClose: () => void;
  onSaved: () => void;
}

export function EditUserModal({ user, onClose, onSaved }: Props) {
  const original = { name: user.name || "", email: realEmail(user.email), phone: user.phone || "" };
  const [form, setForm] = useState(original);
  const [syncBookings, setSyncBookings] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const phoneChanged = form.phone.trim() !== original.phone;
  const hasBookings = (user.totalBookings || 0) > 0;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const body: Record<string, unknown> = {};
    (["name", "email", "phone"] as const).forEach((k) => {
      if (form[k].trim() !== original[k]) body[k] = form[k].trim();
    });
    // Leaving an auto guest email blank means "keep it", not "delete it"
    if (body.email === "" && !original.email) delete body.email;
    if (!Object.keys(body).length) {
      onClose();
      return;
    }

    setSaving(true);
    try {
      const { data } = await api.patch(`/admin/users/${user._id}`, { ...body, updateUpcomingBookings: hasBookings && syncBookings });
      toast.success(data.message || "User updated");
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Could not update this user");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Edit user" onClick={() => !saving && onClose()}>
      <form onSubmit={save} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-surface-container-lowest border border-outline-variant/20 shadow-2xl p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-[9px] tracking-[0.3em] uppercase text-emerald-600 font-bold">User account</span>
            <h2 className="font-headline text-2xl italic text-on-surface">Edit user details</h2>
          </div>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Close" className="p-1.5 rounded-full text-secondary hover:bg-surface-container">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="eu-name" className={label}>
              <UserIcon className="w-3 h-3" /> Full name
            </label>
            <input id="eu-name" minLength={2} maxLength={100} value={form.name} onChange={set("name")} placeholder="Full name" className={field} />
          </div>
          <div>
            <label htmlFor="eu-email" className={label}>
              <Mail className="w-3 h-3" /> Email
            </label>
            <input id="eu-email" type="email" value={form.email} onChange={set("email")} placeholder={original.email ? "" : "No email yet"} className={field} />
          </div>
          <div>
            <label htmlFor="eu-phone" className={label}>
              <Phone className="w-3 h-3" /> Phone
            </label>
            <input id="eu-phone" type="tel" value={form.phone} onChange={set("phone")} placeholder="+1 555 000 0000" className={`${field} font-mono`} />
            {phoneChanged && form.phone.trim() && (
              <p className="text-[11px] text-amber-700 mt-1.5">The new number shows as unverified until they sign in with a text code.</p>
            )}
          </div>

          {hasBookings && (
            <label className="flex items-start gap-2 text-xs text-secondary cursor-pointer">
              <input type="checkbox" checked={syncBookings} onChange={(e) => setSyncBookings(e.target.checked)} className="mt-0.5 accent-emerald-600" />
              <span>
                Update their upcoming bookings too
                <span className="block text-outline">Past and cancelled bookings keep the details they were made with.</span>
              </span>
            </label>
          )}
        </div>

        {error && <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={saving} className="px-4 py-2.5 rounded-full border border-outline-variant/30 text-[10px] font-bold uppercase tracking-wider text-secondary hover:bg-surface-container">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 disabled:opacity-50">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
          </button>
        </div>
      </form>
    </div>
  );
}
