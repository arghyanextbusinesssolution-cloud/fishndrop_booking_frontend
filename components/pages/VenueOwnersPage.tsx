"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Building2, Clock, Inbox, KeyRound, Loader2, Mail, Pencil, Phone, Plus, Search, Trash2, Users } from "lucide-react";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { AdminVenueRow, VENUE_TYPES, VenueOwnerWizard } from "@/components/marketplace/admin/VenueOwnerWizard";

const STATUS_BADGE: Record<AdminVenueRow["status"], { label: string; cls: string }> = {
  draft: { label: "Draft · hidden", cls: "bg-white/10 text-white/70" },
  published: { label: "Live", cls: "bg-emerald-500/15 text-emerald-300" },
  paused: { label: "Paused", cls: "bg-amber-500/15 text-amber-300" }
};

const timeAgo = (iso?: string) => {
  if (!iso) return "Never logged in";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `Last login ${mins}m ago`;
  if (mins < 60 * 24) return `Last login ${Math.round(mins / 60)}h ago`;
  return `Last login ${Math.round(mins / 1440)}d ago`;
};

/** Venue owners list + "Add venue owner" wizard. Used by /employee/venue-owners and /admin/venue-owners. */
export default function VenueOwnersPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin" || user?.role === "owner";
  const [venues, setVenues] = useState<AdminVenueRow[] | null>(null);
  const [query, setQuery] = useState("");
  const [wizard, setWizard] = useState<{ open: boolean; venue: AdminVenueRow | null }>({ open: false, venue: null });
  const [resetting, setResetting] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState<AdminVenueRow | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminVenueRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const deleteVenue = async (v: AdminVenueRow) => {
    setDeleting(true);
    try {
      const { data } = await api.delete(`/admin/marketplace/venues/${v._id}`);
      toast.success(data.message || "Venue owner deleted");
      setVenues((list) => list?.filter((x) => x._id !== v._id) ?? list);
      setConfirmDelete(null);
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Couldn't delete this venue owner");
    } finally {
      setDeleting(false);
    }
  };

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/admin/marketplace/venues");
      setVenues(data.venues || []);
    } catch {
      toast.error("Couldn't load venue owners");
      setVenues((v) => v ?? []);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !venues) return venues;
    return venues.filter((v) =>
      [v.name, v.ownerName, v.ownerEmail, v.neighborhood, v.owner?.email].some((f) => String(f || "").toLowerCase().includes(q))
    );
  }, [venues, query]);

  const resetPassword = async (v: AdminVenueRow) => {
    setConfirmReset(null);
    setResetting(v._id);
    try {
      const { data } = await api.post(`/admin/marketplace/venues/${v._id}/owner/reset-password`);
      toast.success(`${data.message}. Temporary password: ${data.credentials.password}`, { duration: 12000 });
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Couldn't reset the password");
    } finally {
      setResetting(null);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8 min-h-screen">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-[#C8A96A] block">Partner Venues</span>
          <h1 className="text-3xl md:text-4xl font-headline italic text-white">Venue Owners</h1>
          <p className="text-xs text-white/60 max-w-xl">
            Create a login and venue profile for each partner. New venues go live on the booking page right away; an admin sets their commission in{" "}
            {isAdmin ? (
              <Link href="/admin/settings#partner-commission" className="text-[#C8A96A] underline">
                Settings
              </Link>
            ) : (
              "Settings"
            )}
            .
          </p>
        </div>
        <button
          type="button"
          onClick={() => setWizard({ open: true, venue: null })}
          className="inline-flex items-center gap-2 rounded-full bg-[#C8A96A] text-[#0d1612] px-6 py-3 text-xs font-bold uppercase tracking-widest shadow-lg"
        >
          <Plus className="w-4 h-4" /> Add venue owner
        </button>
      </header>

      {venues && venues.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-3" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search venue, owner or email"
            className="w-full bg-white/5 border border-white/15 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#C8A96A]"
          />
        </div>
      )}

      {!venues && (
        <p className="flex items-center gap-2 text-white/60 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading venue owners…
        </p>
      )}

      {venues?.length === 0 && (
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-10 text-center space-y-3">
          <Building2 className="w-10 h-10 text-[#C8A96A] mx-auto" />
          <p className="text-white font-semibold">No venue owners yet</p>
          <p className="text-sm text-white/50">Add the first partner venue — it takes about five minutes.</p>
        </div>
      )}

      <div className="grid gap-4">
        {filtered?.map((v) => {
          const badge = STATUS_BADGE[v.status];
          return (
            <div key={v._id} className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden flex flex-col md:flex-row">
              <div
                className="md:w-56 h-32 md:h-auto shrink-0 bg-cover bg-center relative"
                style={
                  v.coverUrl
                    ? { backgroundImage: `url(${v.coverUrl})` }
                    : { background: `linear-gradient(135deg, ${v.theme?.background || "#0F3D2E"}, ${v.theme?.primary || "#C8A96A"})` }
                }
              >
                {v.logoUrl && (
                  <img src={v.logoUrl} alt="" className="absolute bottom-3 left-3 w-11 h-11 rounded-full object-cover border-2 border-white/80" />
                )}
              </div>
              <div className="flex-1 p-5 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-bold text-white">{v.name}</h2>
                    <p className="text-xs text-white/50">
                      {VENUE_TYPES.find((t) => t.value === v.venueType)?.label || v.venueType} · {v.neighborhood || v.city}
                      <span className="inline-flex items-center gap-1 ml-2">
                        <Users className="w-3 h-3" /> {v.minGuests}–{v.maxGuests}
                      </span>
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={cn("rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider", badge.cls)}>{badge.label}</span>
                    {!v.commissionSet && (
                      <span className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300">
                        Commission not set
                      </span>
                    )}
                    {v.openRequests > 0 && (
                      <span className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-sky-500/15 text-sky-300 inline-flex items-center gap-1">
                        <Inbox className="w-3 h-3" /> {v.openRequests} awaiting owner
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-3 text-xs">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-widest text-white/40">Owner</p>
                    <p className="text-white">{v.owner?.name || v.ownerName || "—"}</p>
                    <p className="text-white/60 flex items-center gap-1 truncate">
                      <Mail className="w-3 h-3 shrink-0" /> {v.owner?.email || v.ownerEmail || "—"}
                    </p>
                    {v.ownerPhone && (
                      <p className="text-white/60 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {v.ownerPhone}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-widest text-white/40">Account</p>
                    <p className={cn("flex items-center gap-1", v.owner?.lastLoginAt ? "text-white/80" : "text-amber-300/80")}>
                      <Clock className="w-3 h-3" /> {v.owner ? timeAgo(v.owner.lastLoginAt) : "No login created"}
                    </p>
                    <p className={v.chargesEnabled ? "text-emerald-300/80" : "text-white/50"}>
                      {v.chargesEnabled ? "Stripe connected" : "Stripe not connected yet"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-widest text-white/40">Terms</p>
                    {v.commissionSet ? (
                      <p className="text-white/80">
                        Partner −{v.partnerDiscountPct}% · Customer −{v.customerDiscountPct}% · Deposit {v.depositPct}%
                      </p>
                    ) : (
                      <p className="text-white/50">Waiting for admin</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setWizard({ open: true, venue: v })}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-white/80 hover:border-[#C8A96A] hover:text-[#C8A96A]"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit profile
                  </button>
                  {v.owner && (
                    <button
                      type="button"
                      onClick={() => setConfirmReset(v)}
                      disabled={resetting === v._id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-white/80 hover:border-[#C8A96A] hover:text-[#C8A96A] disabled:opacity-50"
                    >
                      {resetting === v._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
                      Resend login
                    </button>
                  )}
                  {isAdmin && (
                    <Link
                      href="/admin/settings#partner-commission"
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#C8A96A]/40 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-[#C8A96A]"
                    >
                      Set commission
                    </Link>
                  )}
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(v)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-red-500/40 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {wizard.open && (
        <VenueOwnerWizard venue={wizard.venue} onClose={() => setWizard({ open: false, venue: null })} onSaved={load} />
      )}

      {confirmReset && (
        <div
          className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setConfirmReset(null)}
        >
          <div className="w-full max-w-md bg-[#0d1612] border border-white/10 rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="h-1 bg-[#C8A96A]" />
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#C8A96A]/15 text-[#C8A96A] flex items-center justify-center shrink-0">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-white/40 font-bold">Resend login</p>
                  <h2 className="text-xl font-headline italic text-white">Send a new password?</h2>
                </div>
              </div>
              <p className="text-sm text-white/70 leading-relaxed">
                {confirmReset.owner?.name || confirmReset.ownerName || "The owner"} of <strong className="text-white">{confirmReset.name}</strong> will be
                emailed a new temporary password at {confirmReset.owner?.email || confirmReset.ownerEmail}. Their current password will stop working.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmReset(null)}
                  className="rounded-full px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white/60 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  autoFocus
                  onClick={() => resetPassword(confirmReset)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#C8A96A] px-6 py-2.5 text-[11px] font-bold uppercase tracking-wider text-[#0d1612]"
                >
                  <KeyRound className="w-4 h-4" /> Send new password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div
          className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => !deleting && setConfirmDelete(null)}
        >
          <div className="w-full max-w-md bg-[#0d1612] border border-white/10 rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="h-1 bg-red-500" />
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-red-500/15 text-red-300 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-white/40 font-bold">Delete venue owner</p>
                  <h2 className="text-xl font-headline italic text-white">Delete {confirmDelete.name}?</h2>
                </div>
              </div>
              <p className="text-sm text-white/70 leading-relaxed">
                This permanently deletes the venue profile, the login for{" "}
                <strong className="text-white">{confirmDelete.owner?.email || confirmDelete.ownerEmail}</strong>, and all of this venue&apos;s bookings and
                calendar blocks. The venue disappears from the booking page. This can&apos;t be undone.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => setConfirmDelete(null)}
                  className="rounded-full px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white/60 hover:text-white disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => deleteVenue(confirmDelete)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-red-500 px-6 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white disabled:opacity-60"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Delete permanently
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
