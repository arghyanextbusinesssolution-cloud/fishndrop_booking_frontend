"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import { useAdmin } from "@/hooks/useAdmin";
import { Booking } from "@/types";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { cn } from "@/lib/utils";
import api from "@/lib/axios";
import {
  UtensilsCrossed,
  CalendarDays,
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  Music,
  CheckCircle2,
  Eye,
  ShieldCheck,
  X,
  DollarSign,
  Sparkles,
  ExternalLink,
  Users,
  Clock,
  Calendar,
  AlertCircle,
  XCircle,
  FileText,
  Copy,
  Check,
  LayoutGrid,
  Table as TableIcon,
  ChefHat,
  Send,
  Loader2,
  RefreshCw,
  Plus,
  Camera
} from "lucide-react";
import { CalendarDropdown } from "@/components/shared/CalendarDropdown";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { exportBookingsToCSV } from "@/lib/exportCsv";
import { CATERING_LABEL_MAP, CATERING_RESTAURANTS, parseCateringDetails, getCateringRestaurant } from "@/lib/cateringRestaurants";
import { OfferQuoteModal } from "@/components/admin/OfferQuoteModal";
import { EditBookingMenuModal } from "@/components/booking/EditBookingMenuModal";
import { QuoteHistoryTimeline } from "@/components/booking/QuoteHistoryTimeline";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function formatDateTime(dateStr?: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

export default function AdminCateringPage() {
  const { getAllBookings, adminCancelBooking, deleteBooking } = useAdmin();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedDate, setSelectedDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals & Actions
  const [quoteBooking, setQuoteBooking] = useState<Booking | null>(null);
  const [menuBooking, setMenuBooking] = useState<Booking | null>(null);
  const [proofModal, setProofModal] = useState<{ url: string; booking: Booking; proofType?: "deposit" | "balance" | "food" } | null>(null);
  const [pendingAction, setPendingAction] = useState<{ bookingId: string; action: "cancel" | "delete" } | null>(null);
  const [expandedNotesIds, setExpandedNotesIds] = useState<Record<string, boolean>>({});

  // Quick inline quote editing state per booking
  const [inlineQuoteId, setInlineQuoteId] = useState<string | null>(null);
  const [inlinePrice, setInlinePrice] = useState<string>("");
  const [inlineNotes, setInlineNotes] = useState<string>("");
  const [inlineApplyTotal, setInlineApplyTotal] = useState<boolean>(true);
  const [savingInline, setSavingInline] = useState(false);

  const handleCopy = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success("Booking ID copied");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // Pass type = "private_event" to fetch venue & catering bookings
      const data = await getAllBookings(page, status, selectedDate, 10, "private_event");
      setBookings(data.bookings || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch {
      setBookings([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getAllBookings, page, status, selectedDate]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleVerifyZelle = async (bookingId: string, action: "verify" | "reject", proofType?: "deposit" | "balance" | "food") => {
    try {
      const { data } = await api.patch(`/admin/bookings/${bookingId}/verify-zelle`, { action, proofType });
      if (data.success) {
        toast.success(action === "verify" ? "Zelle payment manually verified!" : "Zelle payment marked as mismatched.");
        setProofModal(null);
        await load();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update Zelle verification");
    }
  };

  const handleConfirmAction = async () => {
    if (!pendingAction) return;
    const { bookingId, action } = pendingAction;
    setPendingAction(null);
    try {
      if (action === "cancel") {
        await adminCancelBooking(bookingId);
        toast.success("Booking cancelled successfully");
      } else {
        await deleteBooking(bookingId);
        toast.success("Booking deleted successfully");
      }
      await load();
    } catch (err: any) {
      toast.error(err.message || "Action failed");
    }
  };

  const handleOpenInlineQuote = (b: Booking, e: React.MouseEvent) => {
    e.stopPropagation();
    if (inlineQuoteId === b._id) {
      setInlineQuoteId(null);
      return;
    }
    setInlineQuoteId(b._id);
    const initialBase = b.foodBasePrice !== undefined
      ? String(b.foodBasePrice)
      : (b.offerPrice !== undefined ? String(Math.max(0, b.offerPrice - 50)) : String(b.totalAmount));
    setInlinePrice(initialBase);
    setInlineNotes(b.negotiationNotes || "");
    setInlineApplyTotal(true);
  };

  const handleSaveInlineQuote = async (b: Booking, e: React.FormEvent) => {
    e.preventDefault();
    const parsedBase = parseFloat(inlinePrice);
    if (isNaN(parsedBase) || parsedBase <= 0) {
      toast.error("Please enter a valid base price");
      return;
    }
    const finalCustomerQuote = parsedBase + 50;

    setSavingInline(true);
    try {
      const catering = parseCateringDetails(b);
      const { data } = await api.patch(`/admin/bookings/${b._id}/offer`, {
        offerPrice: finalCustomerQuote,
        basePrice: parsedBase,
        alreadyHasMarkup: true,
        negotiationNotes: inlineNotes.trim(),
        dishQuantities: catering.dishQuantities
      });

      if (data.success) {
        toast.success(`Quote ($${finalCustomerQuote.toFixed(2)}) sent to guest!`);
        setInlineQuoteId(null);
        await load();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update quote");
    } finally {
      setSavingInline(false);
    }
  };

  // Filter query in memory for client-side search across name, email, phone, restaurant, dish
  const filtered = bookings.filter((b) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    const catering = parseCateringDetails(b);
    const dishMatch = catering.dishes.some((d) => d.toLowerCase().includes(q));
    return (
      (b.customerName || "").toLowerCase().includes(q) ||
      (b.customerEmail || "").toLowerCase().includes(q) ||
      (b.customerPhone || "").toLowerCase().includes(q) ||
      (catering.restaurantLabel || "").toLowerCase().includes(q) ||
      (b._id || "").toLowerCase().includes(q) ||
      dishMatch
    );
  });

  // Calculate summary counts
  const totalQuotedRevenue = bookings.reduce((sum, b) => sum + (b.offerPrice || b.totalAmount || 0), 0);
  const pendingQuotesCount = bookings.filter((b) => !b.offerPrice && b.status !== "cancelled").length;
  const activeQuotesCount = bookings.filter((b) => Boolean(b.offerPrice)).length;

  if (loading && !refreshing) return <LoadingSpinner />;

  return (
    <div className="p-6 md:p-10 space-y-8 min-h-screen">
      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={!!pendingAction}
        title={pendingAction?.action === "delete" ? "Delete Catering Booking" : "Cancel Catering Booking"}
        message={
          pendingAction?.action === "delete"
            ? "Are you sure you want to permanently delete this catering booking record?"
            : "Are you sure you want to cancel this catering buyout booking?"
        }
        confirmLabel={pendingAction?.action === "delete" ? "Delete Record" : "Cancel Booking"}
        onConfirm={() => void handleConfirmAction()}
        onCancel={() => setPendingAction(null)}
      />

      {/* Offer Quote Modal */}
      {quoteBooking && (
        <OfferQuoteModal
          isOpen={!!quoteBooking}
          booking={quoteBooking}
          onClose={() => setQuoteBooking(null)}
          onSuccess={() => void load()}
        />
      )}

      {/* Edit Booking Menu Modal */}
      {menuBooking && (
        <EditBookingMenuModal
          isOpen={!!menuBooking}
          booking={menuBooking}
          onClose={() => setMenuBooking(null)}
          onSuccess={(updated) => {
            setBookings((prev) => prev.map((b) => (b._id === updated._id ? { ...b, ...updated } : b)));
          }}
        />
      )}

      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-outline-variant/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-primary/10 text-primary border border-primary/20">
              Admin Portal
            </span>
            <span className="text-xs text-secondary">•</span>
            <span className="text-xs font-semibold text-secondary">Private Venue &amp; Catering Buyouts</span>
          </div>
          <h1 className="font-headline text-3xl md:text-4xl italic text-on-surface">
            Restaurants &amp; Catering Management
          </h1>
          <p className="text-xs md:text-sm text-secondary font-body mt-1 max-w-2xl">
            Review private buyout inquiries, partner catering selections (Jamaican Jerk House &amp; more), customize custom quotes, and deliver proposals in full view.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => void load(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-outline-variant/20 bg-surface-container-lowest text-secondary hover:text-on-surface text-xs font-bold uppercase tracking-wider transition-all"
            title="Refresh bookings"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin text-primary")} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => {
              if (filtered.length > 0) {
                exportBookingsToCSV(filtered, "catering_bookings");
                toast.success(`Exported ${filtered.length} records to CSV`);
              } else {
                toast.error("No records to export");
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-outline-variant/20 bg-surface-container-lowest text-secondary hover:text-on-surface text-xs font-bold uppercase tracking-wider transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-full border border-outline-variant/20 bg-surface-container-lowest p-0.5">
            <button
              onClick={() => setViewMode("cards")}
              className={cn(
                "px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wider uppercase flex items-center gap-1.5 transition-colors",
                viewMode === "cards" ? "bg-primary text-black" : "text-secondary hover:text-on-surface"
              )}
              title="Full-page Cards View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Full Cards</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={cn(
                "px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wider uppercase flex items-center gap-1.5 transition-colors",
                viewMode === "table" ? "bg-primary text-black" : "text-secondary hover:text-on-surface"
              )}
              title="Compact Table View"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>
        </div>
      </header>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/15 space-y-1">
          <span className="text-[10px] uppercase tracking-widest text-secondary font-bold flex items-center gap-1.5">
            <UtensilsCrossed className="w-3.5 h-3.5 text-primary" />
            Total Catering Buyouts
          </span>
          <div className="flex items-baseline justify-between">
            <span className="font-headline text-3xl italic text-on-surface">{total}</span>
            <span className="text-[11px] text-secondary font-body">Recorded inquiries</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-1">
          <span className="text-[10px] uppercase tracking-widest text-amber-500 font-bold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Awaiting Quote Proposal
          </span>
          <div className="flex items-baseline justify-between">
            <span className="font-headline text-3xl italic text-amber-400">{pendingQuotesCount}</span>
            <span className="text-[11px] text-amber-500/80 font-body">Pending offer price</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20 space-y-1">
          <span className="text-[10px] uppercase tracking-widest text-primary font-bold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Active Quoted Deals
          </span>
          <div className="flex items-baseline justify-between">
            <span className="font-headline text-3xl italic text-primary">{activeQuotesCount}</span>
            <span className="text-[11px] text-secondary font-body">Custom quoted</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/15 space-y-1">
          <span className="text-[10px] uppercase tracking-widest text-emerald-500 font-bold flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5" />
            Total Quoted Value
          </span>
          <div className="flex items-baseline justify-between">
            <span className="font-headline text-2xl italic text-on-surface">
              ${totalQuotedRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
            <span className="text-[11px] text-secondary font-body">Event pipeline</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs + Search Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: "all", label: "All Requests" },
            { key: "leads", label: "⚡ Inquiries / Unpaid" },
            { key: "bookings", label: "💳 Deposits & Paid" },
            { key: "cancelled", label: "❌ Cancelled" }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setStatus(tab.key);
                setPage(1);
              }}
              className={cn(
                "px-4 py-2 rounded-full text-[10px] uppercase tracking-widest font-bold transition-all border",
                status === tab.key
                  ? "bg-on-surface text-surface border-on-surface shadow-md"
                  : "bg-surface-container-lowest text-secondary border-outline-variant/20 hover:border-outline-variant/40 hover:text-on-surface"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Date Filter & Search Input */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="w-full sm:w-52">
            <CalendarDropdown
              value={selectedDate}
              onChange={(date) => {
                setSelectedDate(date);
                setPage(1);
              }}
              placeholder="Filter by Date"
            />
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
            <input
              type="text"
              placeholder="Search guest, restaurant, dish..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant/20 rounded-full text-xs font-body text-on-surface placeholder:text-outline/50 focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {filtered.length === 0 ? (
        <div className="py-24 flex flex-col items-center justify-center text-center space-y-4 rounded-2xl border border-dashed border-outline-variant/20 bg-surface-container-lowest">
          <UtensilsCrossed className="w-12 h-12 text-outline/30" />
          <div className="space-y-1">
            <h3 className="font-headline text-xl italic text-on-surface">No Catering Requests Found</h3>
            <p className="text-xs text-secondary max-w-sm">
              No private venue buyout catering requests match the current filters or query.
            </p>
          </div>
          {(status !== "all" || selectedDate || query) && (
            <button
              onClick={() => {
                setStatus("all");
                setSelectedDate("");
                setQuery("");
                setPage(1);
              }}
              className="text-xs text-primary font-bold underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : viewMode === "cards" ? (
        /* ================= FULLPAGE CARDS VIEW ================= */
        <div className="space-y-6">
          {filtered.map((b) => {
            const catering = parseCateringDetails(b);
            const restaurant = getCateringRestaurant(catering.restaurantKey);
            const isCancelled = b.status === "cancelled";
            const isInlineOpen = inlineQuoteId === b._id;

            return (
              <div
                key={b._id}
                className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest shadow-sm hover:border-outline-variant/30 transition-all overflow-hidden"
              >
                {/* Top Banner: Guest & Event Overview */}
                <div className="p-6 bg-surface-container-low/40 border-b border-outline-variant/10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0">
                      <span className="text-2xl">{restaurant?.emoji || "🍽️"}</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h2 className="font-headline text-2xl italic text-on-surface">
                          {b.customerName || b.user?.name || "Private Guest"}
                        </h2>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-primary/10 text-primary border border-primary/20">
                          ✨ {b.occasion}
                        </span>
                        {b.offerPrice ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-[#C8A96A]/20 text-[#E8CB8A] border border-[#C8A96A]/40">
                            Quoted: ${b.offerPrice.toFixed(2)}
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            Quote Pending
                          </span>
                        )}
                        {b.status === "cancelled" && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-red-500/10 text-red-400 border border-red-500/20">
                            Cancelled
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-secondary flex-wrap">
                        <span>{b.customerEmail || b.user?.email}</span>
                        <span>•</span>
                        <span className="font-mono">{b.customerPhone || "No phone provided"}</span>
                        <span>•</span>
                        <div className="inline-flex items-center gap-1 font-mono text-[11px] text-outline">
                          <span>ID: #{b._id.slice(-6).toUpperCase()}</span>
                          <button
                            onClick={(e) => handleCopy(b._id, e)}
                            className="p-1 rounded hover:bg-surface-container text-outline hover:text-primary transition-colors"
                            title="Copy full booking ID"
                          >
                            {copiedId === b._id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Event Schedule Info */}
                  <div className="flex items-center gap-6 text-xs text-secondary border-t lg:border-t-0 pt-3 lg:pt-0 border-outline-variant/10">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-outline block font-bold">Event Date &amp; Time</span>
                      <span className="font-semibold text-on-surface text-sm">{formatDate(b.bookingDate)}</span>
                      <span className="block text-[11px] text-outline">
                        {b.bookingTime} ({b.durationHours || 5} Hours Buyout)
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-outline block font-bold">Party Size</span>
                      <span className="font-headline text-lg italic text-on-surface">{b.partySize} Guests</span>
                      <span className="block text-[10px] text-primary font-bold">Exclusive Buyout</span>
                    </div>
                  </div>
                </div>

                {/* Body: Two Column Full-Page Inspection */}
                <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column (7 cols): Partner Restaurant, Custom Menu Dishes & Preferences */}
                  <div className="lg:col-span-7 space-y-4">
                    {/* Restaurant Partner Box */}
                    <div className="p-4 rounded-xl bg-surface-container-low/50 border border-outline-variant/15 space-y-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{restaurant?.emoji || "🍽️"}</span>
                          <div>
                            <h4 className="font-headline text-base italic text-on-surface font-semibold">
                              {catering.restaurantLabel}
                            </h4>
                            <p className="text-[11px] text-secondary">
                              {restaurant?.cuisine || "Custom Partner Cuisine"} • {restaurant?.rating || "Top Partner"}
                            </p>
                          </div>
                        </div>

                        {restaurant?.websiteUrl && (
                          <a
                            href={restaurant.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-bold bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-lg border border-primary/20 transition-colors"
                          >
                            <span>{restaurant.isDoorDash ? "DoorDash Store" : "Partner Site"}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      {restaurant?.shortDesc && (
                        <p className="text-xs text-secondary leading-relaxed font-body">
                          {restaurant.shortDesc}
                        </p>
                      )}

                      {/* Chosen Dishes Badges */}
                      <div className="pt-2 border-t border-outline-variant/10 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase tracking-wider text-outline font-bold flex items-center gap-1.5">
                            <ChefHat className="w-3.5 h-3.5 text-primary" />
                            Selected Dishes for Event ({catering.dishes.length})
                          </span>
                          <button
                            onClick={() => setMenuBooking(b)}
                            className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
                          >
                            <UtensilsCrossed className="w-3 h-3" />
                            Edit Menu
                          </button>
                        </div>

                        {catering.dishes.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {catering.dishes.map((dish, dI) => {
                              const qty = catering.dishQuantities[dish] || 1;
                              return (
                                <span
                                  key={dI}
                                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white/5 border border-white/10 text-on-surface flex items-center gap-1.5"
                                >
                                  <span>{dish}</span>
                                  <span className="text-[10px] font-bold text-[#C8A96A] bg-[#C8A96A]/20 px-1.5 py-0.5 rounded">
                                    {qty} {qty === 1 ? "platter" : "platters"}
                                  </span>
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-outline italic">
                            No individual dishes selected yet. Standard chef selection applies.
                          </p>
                        )}
                      </div>

                      {/* Dietary Notes Alert */}
                      {catering.dietaryNotes && (
                        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-0.5">
                          <span className="text-[10px] uppercase tracking-wider font-bold block">
                            ⚠️ Guest Dietary Requirements:
                          </span>
                          <p className="leading-relaxed">{catering.dietaryNotes}</p>
                        </div>
                      )}

                      {/* DJ & Add-on Preference */}
                      <div className="flex items-center gap-2 pt-1 text-xs text-secondary">
                        <Music className="w-3.5 h-3.5 text-primary" />
                        <span>
                          {b.needDj
                            ? "DJ Service Requested (+ $300 setup)"
                            : "No DJ Service Requested"}
                        </span>
                      </div>
                      {/* Photographer Add-On */}
                      {b.needPhotographer && (
                        <div className="flex items-center gap-2 text-xs text-secondary">
                          <span className="text-sm">📷</span>
                          <span className="font-semibold text-primary">
                            Photographer: {b.photographerHours || 2} hrs
                            {" "}(${300 + Math.max(0, (b.photographerHours || 2) - 2) * 150} — $300 base{(b.photographerHours || 2) > 2 ? ` + ${(b.photographerHours || 2) - 2} extra hr${(b.photographerHours || 2) - 2 > 1 ? "s" : ""} × $150` : " / 2 hrs"})
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Customer Notes / Raw Comments */}
                    {catering.baseNotes && (
                      <div className="p-3.5 rounded-xl bg-surface-container-low/30 border border-outline-variant/10 space-y-1">
                        <span className="text-[10px] uppercase tracking-wider text-outline font-bold block flex items-center gap-1">
                          <FileText className="w-3 h-3" /> Special Requests &amp; Notes from Guest
                        </span>
                        <p className="text-xs text-secondary leading-relaxed italic">
                          &ldquo;{catering.baseNotes}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right Column (5 cols): Pricing, Quote Details & Action Controls */}
                  <div className="lg:col-span-5 space-y-4">
                    {/* Quote Proposal Status & Pricing Box */}
                    <div className="p-5 rounded-2xl bg-surface-container-low/70 border border-outline-variant/20 space-y-4">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[10px] uppercase tracking-[0.2em] text-outline font-bold flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5 text-primary" />
                          Quote Proposal Status
                        </span>
                        {/* Status Badge */}
                        {b.offerStatus === "accepted" ? (
                          <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5 shadow-sm">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Accepted by Guest</span>
                          </span>
                        ) : b.offerStatus === "declined" ? (
                          <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/40 flex items-center gap-1.5 shadow-sm">
                            <XCircle className="w-3.5 h-3.5 text-red-400" />
                            <span>Declined by Guest</span>
                          </span>
                        ) : b.offerPrice ? (
                          <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#C8A96A]/20 text-[#E8CB8A] border border-[#C8A96A]/40 flex items-center gap-1.5 shadow-sm">
                            <Clock className="w-3.5 h-3.5 animate-pulse text-[#C8A96A]" />
                            <span>Awaiting Guest Response</span>
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            <span>Quote Pending</span>
                          </span>
                        )}
                      </div>

                      {/* === SEPARATED FINANCIAL BREAKDOWN === */}
                      <div className="space-y-3">

                        {/* Block 1: Venue Buyout Reservation — completely separate, never mixed with food */}
                        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 overflow-hidden">
                          <div className="px-4 py-2.5 bg-blue-500/10 border-b border-blue-500/15 flex items-center justify-between">
                            <span className="text-[10px] uppercase tracking-[0.15em] font-extrabold text-blue-300 flex items-center gap-1.5">
                              🏛️ Venue Buyout Reservation
                            </span>
                            <span className="font-headline text-sm italic font-bold text-on-surface">
                              ${(b.totalAmount || 0).toFixed(2)} Venue Total
                            </span>
                          </div>
                          <div className="px-4 py-3 space-y-2 text-xs">
                            {/* Inclusions in Total Cost: Base, Extra Hours, DJ, Photo */}
                            <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/15 space-y-1">
                              <span className="text-[9px] uppercase tracking-wider text-blue-300 font-bold block">
                                Inclusions in Venue Total:
                              </span>
                              <div className="flex justify-between items-center text-[11px] text-secondary">
                                <span>• Base Venue Buyout (5 hrs):</span>
                                <span className="font-mono text-on-surface font-semibold">$1,000.00</span>
                              </div>
                              {(b.durationHours || 5) > 5 && (
                                <div className="flex justify-between items-center text-[11px] text-secondary">
                                  <span>• Extra Duration ({((b.durationHours || 5) - 5)}h × $125):</span>
                                  <span className="font-mono text-on-surface font-semibold">
                                    +${(((b.durationHours || 5) - 5) * 125).toFixed(2)}
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between items-center text-[11px]">
                                <span className={b.needDj ? "text-primary font-semibold" : "text-secondary"}>
                                  • DJ Service Setup:
                                </span>
                                <span className="font-mono">
                                  {b.needDj ? (
                                    <span className="text-primary font-bold">+$300.00 (DJ Included)</span>
                                  ) : (
                                    <span className="text-outline">No DJ ($0.00)</span>
                                  )}
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-[11px]">
                                <span className={b.needPhotographer ? "text-[#E8CB8A] font-semibold" : "text-secondary"}>
                                  • Event Photographer:
                                </span>
                                <span className="font-mono">
                                  {b.needPhotographer ? (
                                    <span className="text-[#E8CB8A] font-bold">
                                      +${(300 + Math.max(0, (b.photographerHours || 2) - 2) * 150).toFixed(2)} ({b.photographerHours || 2}h Included)
                                    </span>
                                  ) : (
                                    <span className="text-outline">No Photographer ($0.00)</span>
                                  )}
                                </span>
                              </div>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-secondary">Deposit Paid (Secured Date):</span>
                              <span className="font-bold text-emerald-400 font-mono">
                                ✓ ${(b.depositAmount || 300).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-secondary">Venue Balance Remaining:</span>
                              <span className={cn(
                                "font-bold font-mono",
                                b.remainingPaymentStatus === "paid" ? "text-emerald-400" : "text-amber-400"
                              )}>
                                {b.remainingPaymentStatus === "paid"
                                  ? "$0.00 (Fully Settled)"
                                  : `$${(b.remainingAmount || 0).toFixed(2)} Due`}
                              </span>
                            </div>
                            <div className="pt-2 border-t border-blue-500/10 flex justify-between items-center font-bold">
                              <span className="text-[10px] uppercase text-blue-300">Venue Paid So Far:</span>
                              <span className="text-blue-300 font-mono text-sm">
                                ${(
                                  (b.depositAmount || 0) +
                                  (b.remainingPaymentStatus === "paid" ? (b.remainingAmount || 0) : 0)
                                ).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Block 2: Food Catering — completely separate from venue deposit */}
                        {b.offerPrice ? (
                          <div className="rounded-xl border border-primary/25 bg-primary/5 overflow-hidden">
                            <div className="px-4 py-2.5 bg-primary/10 border-b border-primary/15 flex items-center justify-between">
                              <span className="text-[10px] uppercase tracking-[0.15em] font-extrabold text-primary flex items-center gap-1.5">
                                🍽️ Restaurant Food Catering
                              </span>
                              <span className={cn(
                                "text-[9px] font-bold uppercase px-2 py-0.5 rounded border",
                                b.foodPaymentStatus === "paid"
                                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                  : b.foodPaymentStatus === "pending_verification"
                                  ? "bg-purple-500/15 text-purple-300 border-purple-500/30 animate-pulse"
                                  : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                              )}>
                                {b.foodPaymentStatus === "paid" ? "✓ Paid" : b.foodPaymentStatus === "pending_verification" ? "⏳ Pending" : "Unpaid"}
                              </span>
                            </div>
                            <div className="px-4 py-3 space-y-2 text-xs">
                              <div className="flex justify-between items-center">
                                <span className="text-secondary">Restaurant Food Cost:</span>
                                <span className="font-mono text-on-surface">
                                  ${(b.foodBasePrice || Math.max(0, b.offerPrice - 50)).toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-secondary">+ Tropica Catering Fee:</span>
                                <span className="font-mono text-primary">+$50.00</span>
                              </div>
                              <div className="pt-2 border-t border-primary/10 flex justify-between items-center font-bold">
                                <span className="text-[10px] uppercase text-primary">Food Quote Delivered to Guest:</span>
                                <span className="font-headline text-base italic text-primary">${b.offerPrice.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-secondary">Food Amount Collected:</span>
                                <span className={cn(
                                  "font-bold font-mono",
                                  b.foodPaymentStatus === "paid" ? "text-emerald-400" : "text-stone-500"
                                )}>
                                  {b.foodPaymentStatus === "paid" ? `$${b.offerPrice.toFixed(2)}` : "$0.00 (Not Paid Yet)"}
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-xl border border-outline-variant/15 bg-surface-container-low/30 px-4 py-3 flex items-center justify-between text-xs">
                            <span className="text-secondary flex items-center gap-1.5">🍽️ Restaurant Food Catering:</span>
                            <span className="text-amber-400 font-bold">Quote Not Yet Sent</span>
                          </div>
                        )}

                        {/* Grand Total Collected */}
                        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-4 py-3 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] uppercase tracking-[0.15em] font-extrabold text-emerald-400 block">Grand Total Collected for This Event</span>
                            <p className="text-[9px] text-secondary mt-0.5">Venue deposit + any paid balances + food (when settled)</p>
                          </div>
                          <span className="font-headline text-2xl italic font-bold text-emerald-400">
                            ${(
                              (b.depositAmount || 0) +
                              (b.remainingPaymentStatus === "paid" ? (b.remainingAmount || 0) : 0) +
                              (b.foodPaymentStatus === "paid" ? (b.offerPrice || 0) : 0)
                            ).toFixed(2)}
                          </span>
                        </div>

                      </div>

                      {/* Quoted Terms / Inclusions from Admin */}
                      {b.negotiationNotes && (
                        <div className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/10 space-y-1">
                          <span className="text-[10px] uppercase tracking-wider text-primary font-bold block flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Inclusions / Terms Sent with Quote:
                          </span>
                          <p className="text-xs text-secondary leading-relaxed italic">
                            &ldquo;{b.negotiationNotes}&rdquo;
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Quick Quote / Proposal Actions */}
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleOpenInlineQuote(b, e)}
                          className={cn(
                            "flex-1 py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm",
                            isInlineOpen
                              ? "bg-primary text-black"
                              : "bg-[#C8A96A] hover:bg-[#d8b97a] text-black"
                          )}
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>{b.offerPrice ? "Update Quote" : "Put Quote Details"}</span>
                        </button>

                        <button
                          onClick={() => setQuoteBooking(b)}
                          className="py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider border border-outline-variant/20 hover:border-outline-variant/40 text-secondary hover:text-on-surface transition-colors"
                          title="Open Full Quote Modal"
                        >
                          Modal
                        </button>
                      </div>

                      {/* Receipts & Verifications */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {b.zelleProofUrl && (
                          <button
                            onClick={() => setProofModal({ url: b.zelleProofUrl!, booking: b, proofType: "deposit" })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-300 border border-purple-500/25 hover:bg-purple-500/20 transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Deposit Receipt</span>
                          </button>
                        )}

                        {b.remainingZelleProofUrl && (
                          <button
                            onClick={() => setProofModal({ url: b.remainingZelleProofUrl!, booking: b, proofType: "balance" })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-300 border border-blue-500/25 hover:bg-blue-500/20 transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Balance Receipt</span>
                          </button>
                        )}

                        {b.foodZelleProofUrl && (
                          <button
                            onClick={() => setProofModal({ url: b.foodZelleProofUrl!, booking: b, proofType: "food" })}
                            className={cn(
                              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-colors",
                              b.foodPaymentStatus === "paid"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20"
                                : "bg-purple-500/15 text-purple-300 border-purple-500/30 hover:bg-purple-500/25 animate-pulse"
                            )}
                          >
                            <Eye className="w-3 h-3" />
                            <span>Food Receipt {b.foodPaymentStatus === "pending_verification" ? "(Pending Review)" : "(Verified)"}</span>
                          </button>
                        )}

                        {!isCancelled && (
                          <button
                            onClick={() => setPendingAction({ bookingId: b._id, action: "cancel" })}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <XCircle className="w-3 h-3" />
                            <span>Cancel</span>
                          </button>
                        )}

                        <button
                          onClick={() => setPendingAction({ bookingId: b._id, action: "delete" })}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-red-700/30 text-red-700 hover:bg-red-700/10 transition-colors"
                        >
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>

                    {/* Inline Quote Drawer / Form if open */}
                    {isInlineOpen && (
                      <form
                        onSubmit={(e) => handleSaveInlineQuote(b, e)}
                        className="p-4 rounded-xl bg-surface-container-low border border-primary/30 space-y-3 animate-in fade-in"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase tracking-wider font-bold text-primary flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5" /> Put Details of the Quote
                          </span>
                          <button
                            type="button"
                            onClick={() => setInlineQuoteId(null)}
                            className="text-outline hover:text-on-surface"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div>
                          <label className="text-[10px] uppercase font-bold text-outline block mb-1">
                            Base Food / Catering Cost ($ USD) *
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary font-bold text-xs">$</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              required
                              value={inlinePrice}
                              onChange={(e) => setInlinePrice(e.target.value)}
                              placeholder="e.g. 350.00"
                              className="w-full pl-8 pr-3 py-2 bg-surface-container-lowest border border-outline-variant/20 rounded-lg text-xs font-semibold text-on-surface focus:outline-none focus:border-primary/50"
                            />
                          </div>
                        </div>

                        {(parseFloat(inlinePrice) || 0) > 0 && (
                          <div className="p-2.5 rounded-lg bg-surface-container-lowest border border-primary/25 space-y-1 text-[11px]">
                            <div className="flex justify-between items-center text-secondary">
                              <span>Base Food Cost:</span>
                              <span className="font-mono text-on-surface font-semibold">${(parseFloat(inlinePrice) || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-[#C8A96A] font-bold">
                              <span>Tropica Fee (+ $50 extra):</span>
                              <span className="font-mono">+$50.00</span>
                            </div>
                            <div className="flex justify-between items-center pt-1 border-t border-outline-variant/15 font-bold text-on-surface">
                              <span className="text-primary text-[10px] uppercase">Final Delivered Quote:</span>
                              <span className="font-headline text-sm italic text-[#C8A96A]">
                                ${((parseFloat(inlinePrice) || 0) + 50).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        )}

                        <div>
                          <label className="text-[10px] uppercase font-bold text-outline block mb-1">
                            Quote Notes &amp; Terms
                          </label>
                          <textarea
                            rows={2}
                            value={inlineNotes}
                            onChange={(e) => setInlineNotes(e.target.value)}
                            placeholder="e.g. Quoted includes full Jerk Chicken buffet for 40 guests + free mocktails."
                            className="w-full p-2.5 bg-surface-container-lowest border border-outline-variant/20 rounded-lg text-xs font-body text-on-surface focus:outline-none focus:border-primary/50"
                          />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setInlineQuoteId(null)}
                            className="px-3 py-1.5 rounded-lg border border-outline-variant/20 text-[10px] font-bold uppercase tracking-wider text-secondary hover:text-on-surface"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={savingInline}
                            className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-black text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow"
                          >
                            {savingInline ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                            <span>
                              Deliver Quote ({((parseFloat(inlinePrice) || 0) > 0 ? `$${((parseFloat(inlinePrice) || 0) + 50).toFixed(2)}` : "$0.00")})
                            </span>
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>

                {/* Negotiation & Menu History Expandable Timeline Section */}
                <div className="p-6 pt-0 border-t border-outline-variant/10">
                  <QuoteHistoryTimeline booking={b} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ================= COMPACT TABLE VIEW ================= */
        <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest overflow-hidden shadow-sm">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left min-w-[1100px]">
              <thead className="bg-surface-container-low/70 border-b border-outline-variant/15 text-[10px] uppercase tracking-widest font-bold text-outline">
                <tr>
                  <th className="px-4 py-3.5">Guest &amp; Contact</th>
                  <th className="px-4 py-3.5">Event Date &amp; Time</th>
                  <th className="px-4 py-3.5">Party / Occasion</th>
                  <th className="px-4 py-3.5">Restaurant &amp; Menu</th>
                  <th className="px-4 py-3.5">DJ</th>
                  <th className="px-4 py-3.5">Photo</th>
                  <th className="px-4 py-3.5">Amount &amp; Quoted</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10 text-xs">
                {filtered.map((b) => {
                  const catering = parseCateringDetails(b);
                  return (
                    <tr key={b._id} className="hover:bg-surface-container-low/20 transition-colors">
                      {/* Guest */}
                      <td className="px-4 py-4 align-top space-y-0.5">
                        <div className="font-headline text-sm italic text-on-surface font-semibold">
                          {b.customerName || b.user?.name}
                        </div>
                        <div className="text-[11px] text-secondary">{b.customerEmail || b.user?.email}</div>
                        <div className="text-[10px] font-mono text-outline">{b.customerPhone || "—"}</div>
                      </td>

                      {/* Date & Time */}
                      <td className="px-4 py-4 align-top space-y-0.5 whitespace-nowrap">
                        <div className="font-medium text-on-surface">{formatDate(b.bookingDate)}</div>
                        <div className="text-[11px] text-secondary">{b.bookingTime} ({b.durationHours || 5}h)</div>
                      </td>

                      {/* Party */}
                      <td className="px-4 py-4 align-top space-y-1">
                        <div className="font-semibold text-on-surface">{b.partySize} Guests</div>
                        <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                          {b.occasion}
                        </span>
                      </td>

                      {/* Restaurant & Dishes */}
                      <td className="px-4 py-4 align-top space-y-1.5 max-w-[280px]">
                        <div className="flex items-center gap-1.5 font-semibold text-primary text-xs">
                          <UtensilsCrossed className="w-3 h-3 shrink-0" />
                          <span className="truncate">{catering.restaurantLabel}</span>
                        </div>
                        {catering.dishes.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {catering.dishes.slice(0, 3).map((d, i) => (
                              <span key={i} className="text-[9px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-white/80">
                                {d}
                              </span>
                            ))}
                            {catering.dishes.length > 3 && (
                              <span className="text-[9px] text-primary">+{catering.dishes.length - 3} more</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-outline italic">No dishes chosen</span>
                        )}
                      </td>

                      {/* DJ */}
                      <td className="px-4 py-4 align-top whitespace-nowrap">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border",
                          b.needDj ? "bg-primary/10 text-primary border-primary/25" : "bg-surface-container text-secondary border-outline-variant/15"
                        )}>
                          {b.needDj ? "DJ Yes" : "No DJ"}
                        </span>
                      </td>

                      {/* Photo */}
                      <td className="px-4 py-4 align-top whitespace-nowrap">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border",
                          b.needPhotographer
                            ? "bg-[#C8A96A]/15 text-[#E8CB8A] border-[#C8A96A]/30"
                            : "bg-surface-container text-secondary border-outline-variant/15"
                        )}>
                          {b.needPhotographer
                            ? `📷 ${b.photographerHours || 2}h ($${300 + Math.max(0, (b.photographerHours || 2) - 2) * 150})`
                            : "No Photo"}
                        </span>
                      </td>

                      {/* Amount & Quote */}
                      <td className="px-4 py-4 align-top space-y-1 whitespace-nowrap">
                        <div className="font-headline text-sm italic text-on-surface">${b.totalAmount}</div>
                        <div className="flex flex-col gap-0.5">
                          {b.needDj && (
                            <span className="text-[8px] font-bold text-primary bg-primary/10 border border-primary/25 px-1 py-0.2 rounded w-fit">
                              Incl. DJ (+$300)
                            </span>
                          )}
                          {b.needPhotographer && (
                            <span className="text-[8px] font-bold text-[#E8CB8A] bg-[#C8A96A]/10 border border-[#C8A96A]/25 px-1 py-0.2 rounded w-fit">
                              Incl. 📷 Photo (+${300 + Math.max(0, (b.photographerHours || 2) - 2) * 150})
                            </span>
                          )}
                        </div>
                        {b.offerPrice && (
                          <div className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/25 inline-block">
                            Quote: ${b.offerPrice}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4 align-top whitespace-nowrap">
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border inline-block",
                          b.status === "confirmed"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : b.status === "cancelled"
                            ? "bg-red-500/10 text-red-400 border-red-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        )}>
                          {b.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4 align-top text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setQuoteBooking(b)}
                            className="px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
                            title="Manage Quote"
                          >
                            <DollarSign className="w-3 h-3" />
                            <span>Quote</span>
                          </button>

                          <button
                            onClick={() => setMenuBooking(b)}
                            className="px-2.5 py-1 rounded-lg border border-outline-variant/20 hover:border-outline-variant/40 text-secondary hover:text-on-surface text-[10px] font-bold uppercase tracking-wider transition-colors"
                            title="Edit Menu"
                          >
                            <UtensilsCrossed className="w-3 h-3" />
                          </button>

                          {b.status === "confirmed" && (
                            <button
                              onClick={() => setPendingAction({ bookingId: b._id, action: "cancel" })}
                              className="px-2 py-1 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 text-[10px] font-bold transition-colors"
                              title="Cancel"
                            >
                              <XCircle className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Proof Lightbox Modal */}
      {proofModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#121417] border border-outline-variant/20 rounded-2xl max-w-lg w-full p-6 space-y-4 relative shadow-2xl text-on-surface">
            <button
              onClick={() => setProofModal(null)}
              className="absolute top-4 right-4 p-1.5 text-outline hover:text-on-surface rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className={cn(
                "text-[10px] uppercase tracking-widest font-bold block",
                proofModal.proofType === "food"
                  ? "text-[#C8A96A]"
                  : proofModal.proofType === "balance"
                  ? "text-blue-400"
                  : "text-purple-400"
              )}>
                {proofModal.proofType === "food"
                  ? "🍽️ Food Catering Payment Proof"
                  : proofModal.proofType === "balance"
                  ? "🏦 Balance Payment Proof"
                  : "💳 Deposit Payment Proof"}
              </span>
              <h3 className="text-lg font-bold text-on-surface">
                {proofModal.booking.customerName}
              </h3>
              <p className="text-xs text-secondary font-mono">ID: {proofModal.booking._id}</p>
            </div>

            <div className="rounded-xl overflow-hidden border border-outline-variant/20 bg-black max-h-[60vh] flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={proofModal.url}
                alt="Zelle Payment Proof"
                className="max-h-[60vh] w-auto object-contain"
              />
            </div>

            <div className="flex justify-between items-center pt-2 gap-3">
              <button
                onClick={() => handleVerifyZelle(proofModal.booking._id, "reject", proofModal.proofType)}
                className="px-4 py-2 border border-red-500/30 text-red-400 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-red-500/10"
              >
                Flag Mismatch
              </button>
              <button
                onClick={() => handleVerifyZelle(proofModal.booking._id, "verify", proofModal.proofType)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> Approve Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-4">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="flex items-center gap-1 px-4 py-2 rounded-full border border-outline-variant/20 text-[9px] uppercase tracking-widest font-bold text-secondary hover:text-on-surface hover:border-outline-variant/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-3 h-3" /> Previous
          </button>
          <span className="font-headline text-sm italic text-on-surface">
            {page} <span className="text-outline font-body not-italic text-xs">of</span> {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="flex items-center gap-1 px-4 py-2 rounded-full border border-outline-variant/20 text-[9px] uppercase tracking-widest font-bold text-secondary hover:text-on-surface hover:border-outline-variant/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Next <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}
