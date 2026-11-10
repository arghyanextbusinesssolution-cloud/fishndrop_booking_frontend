"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";
import { EventBookingsModal } from "@/components/events/EventBookingsModal";
import {
  Shield,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  CreditCard,
  Building,
  User,
  Clock,
  Filter,
  Trash2,
  Ticket,
  ExternalLink,
  Copy,
  Calendar,
  MapPin,
  Sparkles
} from "lucide-react";

interface PromoterItem {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
  idDocumentUrl?: string;
  promoterStatus: "pending" | "approved" | "rejected";
  stripeConnectAccountId?: string;
  stripeConnectOnboarded?: boolean;
  chargesEnabled?: boolean;
  platformFeeOverride?: number;
  createdAt: string;
  promoterApprovedBy?: {
    name: string;
  };
}

interface TicketTierItem {
  _id?: string;
  name: string;
  price: number;
  quantity: number;
  sold?: number;
  description?: string;
}

interface EventItem {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  venueName: string;
  venueAddress?: string;
  flyerUrl: string;
  status: "draft" | "pending_approval" | "published" | "cancelled" | "completed";
  ticketTiers: TicketTierItem[];
  promoter?: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    companyName?: string;
    promoterStatus?: string;
  };
  approvedBy?: {
    name: string;
  };
  approvedAt?: string;
  createdAt: string;
}

export default function AdminPromotersPage({ initialTab }: { initialTab?: "accounts" | "events" }) {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin" || user?.role === "owner";

  // Active Section: "accounts" vs "events"
  const [activeSection, setActiveSection] = useState<"accounts" | "events">(initialTab || "accounts");

  // Accounts state
  const [promoters, setPromoters] = useState<PromoterItem[]>([]);
  const [isLoadingPromoters, setIsLoadingPromoters] = useState(true);
  const [promoterFilter, setPromoterFilter] = useState<string>("all");
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);

  // Events state
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  // Open the events tab on the verification queue so staff see what needs action first
  const [bookingsEvent, setBookingsEvent] = useState<{ id: string; title: string } | null>(null);
  const [eventFilter, setEventFilter] = useState<string>(initialTab === "events" ? "pending_approval" : "all");

  // Check URL query param for initial tab on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab === "events") {
        setActiveSection("events");
      } else if (tab === "accounts") {
        setActiveSection("accounts");
      }
    }
  }, []);

  // Fetch Promoters
  const fetchPromoters = async () => {
    try {
      setIsLoadingPromoters(true);
      const url = promoterFilter === "all" ? "/admin/promoters" : `/admin/promoters?status=${promoterFilter}`;
      const { data } = await api.get(url);
      if (data.success) {
        setPromoters(data.promoters || []);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to fetch promoters");
    } finally {
      setIsLoadingPromoters(false);
    }
  };

  // Fetch Events
  const fetchEvents = async () => {
    try {
      setIsLoadingEvents(true);
      const url = eventFilter === "all" ? "/events/admin/all" : `/events/admin/all?status=${eventFilter}`;
      const { data } = await api.get(url);
      if (data.success) {
        setEvents(data.events || []);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to fetch events");
    } finally {
      setIsLoadingEvents(false);
    }
  };

  useEffect(() => {
    if (activeSection === "accounts") {
      fetchPromoters();
    } else {
      fetchEvents();
    }
  }, [activeSection, promoterFilter, eventFilter]);

  // Promoter Account Verification Handlers
  const handleVerifyPromoter = async (id: string, action: "approved" | "rejected") => {
    const override =
      action === "approved"
        ? prompt("Optional custom platform fee percentage override for this promoter (leave empty for standard platform default):")
        : undefined;

    const notes = action === "rejected" ? prompt("Reason for rejection:") : undefined;

    try {
      const payload: any = { action };
      if (override && !isNaN(parseFloat(override))) {
        payload.platformFeeOverride = parseFloat(override);
      }
      if (notes) {
        payload.notes = notes;
      }

      const { data } = await api.patch(`/admin/promoters/${id}/verify`, payload);
      if (data.success) {
        toast.success(data.message);
        fetchPromoters();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update promoter");
    }
  };

  const handleDeletePromoter = async (id: string, name: string) => {
    if (
      !window.confirm(
        `Are you sure you want to delete promoter application for "${name}"? This will permanently delete their account and data.`
      )
    ) {
      return;
    }
    try {
      const { data } = await api.delete(`/admin/promoters/${id}`);
      if (data.success) {
        toast.success(data.message || "Promoter deleted successfully");
        fetchPromoters();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete promoter");
    }
  };

  // Event Verification Handlers
  const handleVerifyEvent = async (id: string, action: "published" | "cancelled") => {
    const notes = action === "cancelled" ? prompt("Reason for event rejection:") : undefined;

    try {
      const { data } = await api.patch(`/events/${id}/admin-approve`, {
        action,
        notes
      });
      if (data.success) {
        toast.success(
          action === "published"
            ? "Event successfully verified & published! Public ticket link is now live."
            : "Event marked as cancelled."
        );
        fetchEvents();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update event status");
    }
  };

  const copyPublicLink = (slug: string) => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/events/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Public event viewing link copied to clipboard!");
  };

  const pendingEventsCount = events.filter((e) => e.status === "pending_approval").length;

  return (
    <div className="p-6 md:p-10 space-y-8 min-h-screen">
      {/* Top Header & Section Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-[#C8A96A] block">
            Partner Operations
          </span>
          <h1 className="text-3xl md:text-4xl font-headline italic text-white">
            {activeSection === "accounts" ? "Promoter Account Approvals" : "Promoter Event Approvals"}
          </h1>
          <p className="text-xs text-white/60">
            {activeSection === "accounts"
              ? "Review partner registrations. Verifying activates account privileges and dispatches verification webhook."
              : "Review organizer events. Events must be verified by staff before they are publicly published. Once verified, shareable ticket links are live."}
          </p>
        </div>

        {/* Section Tabs (Accounts vs Events) */}
        <div className="flex items-center rounded-2xl bg-black/40 border border-white/10 p-1.5 self-start sm:self-auto shadow-inner">
          <button
            onClick={() => setActiveSection("accounts")}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              activeSection === "accounts"
                ? "bg-gradient-to-r from-[#C8A96A] via-[#E8CB8A] to-[#C8A96A] text-black shadow-md shadow-[#C8A96A]/20"
                : "text-white/60 hover:text-white"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Promoter Accounts</span>
          </button>
          <button
            onClick={() => setActiveSection("events")}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 relative ${
              activeSection === "events"
                ? "bg-gradient-to-r from-[#C8A96A] via-[#E8CB8A] to-[#C8A96A] text-black shadow-md shadow-[#C8A96A]/20"
                : "text-white/60 hover:text-white"
            }`}
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>Promoter Events</span>
            {pendingEventsCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-500 text-black">
                {pendingEventsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ─── SECTION 1: PROMOTER ACCOUNTS ─── */}
      {activeSection === "accounts" && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-1">
              {["all", "pending", "approved", "rejected"].map((st) => (
                <button
                  key={st}
                  onClick={() => setPromoterFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    promoterFilter === st ? "bg-[#C8A96A] text-black" : "text-white/60 hover:text-white"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
            <span className="text-xs text-white/50">{promoters.length} Applications</span>
          </div>

          {/* Promoters Table */}
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            {isLoadingPromoters ? (
              <div className="p-12 text-center text-white/50 text-xs">Loading promoter applications...</div>
            ) : promoters.length === 0 ? (
              <div className="p-12 text-center text-white/50 text-xs">
                No promoter applications found for filter &apos;{promoterFilter}&apos;.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.02] text-white/50 uppercase tracking-wider text-[10px]">
                      <th className="p-4 pl-6">Organizer / Brand</th>
                      <th className="p-4">Contact</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Stripe Connect</th>
                      <th className="p-4">ID Document</th>
                      <th className="p-4 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {promoters.map((p) => (
                      <tr key={p._id} className="hover:bg-white/[0.01] transition-colors">
                        <td className="p-4 pl-6">
                          <div className="font-bold text-white text-sm">{p.name}</div>
                          <div className="text-[11px] text-[#C8A96A]">{p.companyName || "Independent"}</div>
                        </td>
                        <td className="p-4 text-white/70 space-y-0.5">
                          <div>{p.email}</div>
                          <div className="text-white/40">{p.phone || "No phone"}</div>
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              p.promoterStatus === "approved"
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : p.promoterStatus === "rejected"
                                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            }`}
                          >
                            {p.promoterStatus}
                          </span>
                        </td>
                        <td className="p-4">
                          {p.stripeConnectOnboarded ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 text-xs">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                            </span>
                          ) : (
                            <span className="text-white/40 text-xs">Not Onboarded</span>
                          )}
                        </td>
                        <td className="p-4">
                          {p.idDocumentUrl ? (
                            <button
                              onClick={() => setPreviewDocUrl(p.idDocumentUrl!)}
                              className="inline-flex items-center gap-1.5 text-xs text-[#C8A96A] hover:underline cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" /> View ID
                            </button>
                          ) : (
                            <span className="text-white/30 text-xs">Not Attached</span>
                          )}
                        </td>
                        <td className="p-4 pr-6 text-right space-x-2 whitespace-nowrap">
                          {p.promoterStatus !== "approved" && (
                            <button
                              onClick={() => handleVerifyPromoter(p._id, "approved")}
                              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer inline-flex items-center gap-1 shadow-md shadow-emerald-500/20"
                              title="Verify and Approve Promoter Application"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Verify &amp; Approve
                            </button>
                          )}
                          {p.promoterStatus !== "rejected" && (
                            <button
                              onClick={() => handleVerifyPromoter(p._id, "rejected")}
                              className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer inline-flex items-center gap-1"
                              title="Reject Promoter Application"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Reject
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              onClick={() => handleDeletePromoter(p._id, p.name)}
                              className="p-1.5 bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white rounded-lg text-xs transition-all inline-flex items-center justify-center cursor-pointer"
                              title="Delete Promoter Application"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── SECTION 2: PROMOTER EVENTS VERIFICATION ─── */}
      {activeSection === "events" && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-1">
              {["all", "pending_approval", "published", "draft", "cancelled"].map((st) => (
                <button
                  key={st}
                  onClick={() => setEventFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    eventFilter === st ? "bg-[#C8A96A] text-black" : "text-white/60 hover:text-white"
                  }`}
                >
                  {st.replace("_", " ")}
                </button>
              ))}
            </div>
            <span className="text-xs text-white/50">{events.length} Events</span>
          </div>

          {/* Events List / Cards */}
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            {isLoadingEvents ? (
              <div className="p-12 text-center text-white/50 text-xs">Loading promoter events...</div>
            ) : events.length === 0 ? (
              <div className="p-12 text-center text-white/50 text-xs">
                No events found matching filter &apos;{eventFilter}&apos;.
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {events.map((evt) => {
                  const isPublished = evt.status === "published";
                  const isPending = evt.status === "pending_approval";

                  return (
                    <div
                      key={evt._id}
                      className="p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 hover:bg-white/[0.01] transition-colors"
                    >
                      {/* Left: Flyer + Event Details */}
                      <div className="flex items-start gap-4 min-w-0">
                        {evt.flyerUrl ? (
                          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-black/40 shrink-0 border border-white/10">
                            <img src={evt.flyerUrl} alt={evt.title} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-[#0F3D2E] to-black flex items-center justify-center shrink-0 border border-white/10">
                            <Ticket className="w-8 h-8 text-[#C8A96A]/40" />
                          </div>
                        )}

                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-bold text-white truncate">{evt.title}</h3>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                isPublished
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                  : isPending
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse"
                                  : evt.status === "cancelled"
                                  ? "bg-red-500/20 text-red-300 border border-red-500/30"
                                  : "bg-white/10 text-white/60"
                              }`}
                            >
                              {evt.status.replace("_", " ")}
                            </span>
                          </div>

                          {/* Organizer Info */}
                          <div className="text-xs text-[#C8A96A] font-semibold flex items-center gap-1.5">
                            <Building className="w-3.5 h-3.5" />
                            <span>
                              {evt.promoter?.companyName || evt.promoter?.name || "Independent Promoter"}
                            </span>
                            {evt.promoter?.email && (
                              <span className="text-white/40 font-normal">({evt.promoter.email})</span>
                            )}
                          </div>

                          {/* Date & Location */}
                          <div className="text-xs text-white/60 flex flex-wrap items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-white/40" />
                              {new Date(evt.date).toLocaleDateString()} ({evt.startTime} - {evt.endTime})
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-white/40" />
                              {evt.venueName}
                            </span>
                          </div>

                          {/* Ticket Tiers */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            {evt.ticketTiers.map((tier, idx) => (
                              <span
                                key={tier._id || idx}
                                className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/10 text-[10px] text-white/70"
                              >
                                {tier.name}: <strong className="text-white">${tier.price}</strong> ({tier.quantity} cap)
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions & Share Link */}
                      <div className="flex flex-col sm:flex-row lg:flex-col items-stretch lg:items-end gap-2 w-full lg:w-auto shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-white/5">
                        {/* If Published: Share Public Link Button */}
                        {isPublished && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setBookingsEvent({ id: evt._id, title: evt.title })}
                              className="px-3.5 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                              title="See who booked tickets"
                            >
                              <Ticket className="w-3.5 h-3.5" />
                              <span>Bookings</span>
                            </button>
                            <button
                              onClick={() => copyPublicLink(evt.slug)}
                              className="px-3.5 py-2 bg-gradient-to-r from-[#C8A96A] via-[#E8CB8A] to-[#C8A96A] text-[#070B09] rounded-xl text-xs font-bold uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-md shadow-[#C8A96A]/20 flex items-center justify-center gap-1.5 cursor-pointer"
                              title="Copy Public Viewing Link"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Public Link</span>
                            </button>
                            <Link
                              href={`/events/${evt.slug}`}
                              target="_blank"
                              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                              title="Open Live Public Event Page"
                            >
                              <span>View</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        )}

                        {/* If NOT Published: Verification Controls */}
                        {!isPublished && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleVerifyEvent(evt._id, "published")}
                              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Verify &amp; Publish</span>
                            </button>
                            {evt.status !== "cancelled" && (
                              <button
                                onClick={() => handleVerifyEvent(evt._id, "cancelled")}
                                className="px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer inline-flex items-center justify-center gap-1"
                              >
                                <XCircle className="w-4 h-4" />
                                <span>Reject</span>
                              </button>
                            )}
                          </div>
                        )}

                        {/* Status Note */}
                        <div className="text-[10px] text-white/40 text-right">
                          {isPublished
                            ? `✓ Verified${evt.approvedBy?.name ? ` by ${evt.approvedBy.name}` : ""}${
                                evt.approvedAt ? ` on ${new Date(evt.approvedAt).toLocaleDateString()}` : ""
                              } · live for public viewing & ticket sales`
                            : "🔒 Blocked from public until verified"}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <EventBookingsModal
        eventId={bookingsEvent?.id ?? null}
        eventTitle={bookingsEvent?.title}
        onClose={() => setBookingsEvent(null)}
      />

      {/* Document Preview Lightbox Modal */}
      {previewDocUrl && (
        <div
          onClick={() => setPreviewDocUrl(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-xl max-h-[85vh] bg-[#0A100D] border border-white/20 rounded-2xl p-4 overflow-hidden space-y-4"
          >
            <div className="flex justify-between items-center text-xs text-white/60">
              <span className="font-bold text-white uppercase tracking-wider">Identity Document</span>
              <button onClick={() => setPreviewDocUrl(null)} className="hover:text-white text-base">
                ✕
              </button>
            </div>
            <div className="overflow-auto max-h-[70vh]">
              <img src={previewDocUrl} alt="Promoter ID" className="w-full h-auto rounded-lg" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

