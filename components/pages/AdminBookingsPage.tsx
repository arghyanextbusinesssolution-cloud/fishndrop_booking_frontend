"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAdmin } from "@/hooks/useAdmin";
import { Booking } from "@/types";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { cn } from "@/lib/utils";
import { CalendarDays, Search, ChevronLeft, ChevronRight, XCircle, Download, Music, UtensilsCrossed } from "lucide-react";
import { CalendarDropdown } from "@/components/shared/CalendarDropdown";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { exportBookingsToCSV } from "@/lib/exportCsv";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(dateStr?: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    cancelled: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span className={cn("px-3 py-1 rounded-full border text-[9px] uppercase tracking-widest font-bold whitespace-nowrap inline-flex items-center justify-center shrink-0", map[status] || "bg-surface-container text-secondary border-outline-variant/20")}>
      {status}
    </span>
  );
}

function CategoryBadge({ status, paymentStatus }: { status: string; paymentStatus?: string }) {
  if (status === "cancelled") {
    return (
      <span className="px-3 py-1 rounded-full border text-[9px] uppercase tracking-widest font-bold bg-red-50 text-red-700 border-red-200 whitespace-nowrap inline-flex items-center justify-center shrink-0">
        Cancelled
      </span>
    );
  }
  if (paymentStatus === "paid" || paymentStatus === "deposit_paid") {
    return (
      <span className="px-3 py-1 rounded-full border text-[9px] uppercase tracking-widest font-bold bg-emerald-50 text-emerald-700 border-emerald-200 whitespace-nowrap inline-flex items-center justify-center shrink-0">
        Booking
      </span>
    );
  }
  return (
    <span className="px-3 py-1 rounded-full border text-[9px] uppercase tracking-widest font-bold bg-amber-50 text-amber-700 border-amber-200 whitespace-nowrap inline-flex items-center justify-center shrink-0">
      Lead
    </span>
  );
}

function PaymentBadge({ status, remainingStatus }: { status?: string, remainingStatus?: string }) {
  if (status === "paid" || (status === "deposit_paid" && remainingStatus === "paid")) {
    return (
      <span className="px-3 py-1 rounded-full border text-[9px] uppercase tracking-widest font-bold bg-emerald-50 text-emerald-700 border-emerald-200 whitespace-nowrap inline-flex items-center justify-center shrink-0">
        Paid
      </span>
    );
  }
  if (status === "deposit_paid") {
    return (
      <span className="px-3 py-1 rounded-full border text-[9px] uppercase tracking-widest font-bold bg-emerald-50/80 text-emerald-800 border-emerald-300 whitespace-nowrap inline-flex items-center justify-center shrink-0">
        Deposit Paid
      </span>
    );
  }
  return (
    <span className="px-3 py-1 rounded-full border text-[9px] uppercase tracking-widest font-bold bg-amber-50 text-amber-700 border-amber-200 whitespace-nowrap inline-flex items-center justify-center shrink-0">
      Unpaid (Lead)
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  const isPrivate = type === "private_event";
  return (
    <span className={cn(
      "px-3 py-1 rounded-full border text-[9px] uppercase tracking-widest font-bold whitespace-nowrap inline-flex items-center justify-center shrink-0",
      isPrivate
        ? "bg-primary/10 text-primary border-primary/20"
        : "bg-surface-container text-secondary border-outline-variant/20"
    )}>
      {isPrivate ? "Venue Buyout" : "Standard"}
    </span>
  );
}

function OccasionBadge({ occasion }: { occasion?: string }) {
  if (!occasion) return <span className="text-secondary text-xs">—</span>;
  const clean = occasion.replace(/^other:\s*/i, "");
  const map: Record<string, string> = {
    baby_shower: "Baby Shower",
    birthday: "Birthday",
    anniversary: "Anniversary",
    celebration: "Celebration",
    business: "Business",
    quiet: "Quiet Evening",
    other: "Other Event",
  };
  const label = map[clean] || clean;
  return (
    <span className="px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold whitespace-nowrap inline-flex items-center gap-1 shrink-0">
      ✨ {label}
    </span>
  );
}

const CATERING_LABEL_MAP: Record<string, string> = {
  seafood_buffet: "Seafood Extravaganza Buffet",
  tropica_signature: "Tropica Signature Experience",
  cocktail_canapes: "Cocktail and Canapes Reception",
  bbq_grill: "Tropical BBQ and Grill",
  vegan_garden: "Garden and Vegan Feast",
  kids_friendly: "Family and Kids Menu",
  custom: "Custom Menu",
};

function DjBadge({ needDj, bookingType }: { needDj?: boolean; bookingType: string }) {
  if (bookingType !== "private_event") return <span className="text-secondary text-xs">—</span>;
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] uppercase tracking-widest font-bold whitespace-nowrap shrink-0",
      needDj
        ? "bg-primary/10 text-primary border-primary/20"
        : "bg-surface-container text-secondary border-outline-variant/20"
    )}>
      <Music className="w-2.5 h-2.5" />
      {needDj ? "DJ Yes" : "No DJ"}
    </span>
  );
}

function CateringBadge({ cateringMenu, bookingType }: { cateringMenu?: string; bookingType: string }) {
  if (bookingType !== "private_event") return <span className="text-secondary text-xs">—</span>;
  const label = cateringMenu ? (CATERING_LABEL_MAP[cateringMenu] || cateringMenu) : "Not set";
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] uppercase tracking-widest font-bold whitespace-nowrap shrink-0 bg-primary/5 text-primary border-primary/15">
      <UtensilsCrossed className="w-2.5 h-2.5" />
      {label}
    </span>
  );
}

const FILTER_TABS = [
  { key: "all", label: "All Records", countKey: "all" },
  { key: "leads", label: "Leads", countKey: "leads" },
  { key: "bookings", label: "Bookings", countKey: "bookings" },
  { key: "cancelled", label: "Cancelled", countKey: "cancelled" },
] as const;

type PendingAction = { bookingId: string; action: "cancel" | "delete" } | null;

export default function AdminBookingsPage() {
  const { getAllBookings, adminCancelBooking, deleteBooking } = useAdmin();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<{ all: number; leads: number; bookings: number; cancelled: number }>({
    all: 0,
    leads: 0,
    bookings: 0,
    cancelled: 0,
  });
  const [selectedDate, setSelectedDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [isExporting, setIsExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllBookings(page, status, selectedDate);
      setBookings(data.bookings);
      setTotalPages(data.totalPages);
      setTotal(data.total);
      if (data.counts) {
        setCounts(data.counts);
      }
    } catch {
      setBookings([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [getAllBookings, page, status, selectedDate]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const data = await getAllBookings(1, status, selectedDate, 0);
      if (data && data.bookings && data.bookings.length > 0) {
        exportBookingsToCSV(data.bookings, `bookings_${status}`);
        toast.success(`Exported ${data.bookings.length} booking records to CSV`);
      } else {
        toast.error("No booking records found to export");
      }
    } catch {
      toast.error("Failed to export bookings");
    } finally {
      setIsExporting(false);
    }
  };

  const filtered = query
    ? bookings.filter((b) =>
      (b.customerName || b.user?.name || "").toLowerCase().includes(query.toLowerCase()) ||
      (b.customerEmail || b.user?.email || "").toLowerCase().includes(query.toLowerCase()) ||
      (b.customerPhone || "").toLowerCase().includes(query.toLowerCase())
    )
    : bookings;

  const handleConfirm = async () => {
    if (!pendingAction) return;
    const { bookingId, action } = pendingAction;
    setPendingAction(null);
    if (action === "cancel") {
      await adminCancelBooking(bookingId);
      toast.success("Booking cancelled");
    } else {
      await deleteBooking(bookingId);
      toast.success("Booking deleted successfully");
    }
    await load();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6 md:p-10 space-y-8 min-h-screen">
      <ConfirmDialog
        open={!!pendingAction}
        title={pendingAction?.action === "delete" ? "Delete Booking" : "Cancel Booking"}
        message={
          pendingAction?.action === "delete"
            ? "This will permanently remove the booking and release all associated table locks. This cannot be undone."
            : "The guest will be notified and this reservation will be marked as cancelled."
        }
        confirmLabel={pendingAction?.action === "delete" ? "Delete" : "Cancel Booking"}
        cancelLabel="Keep it"
        variant="danger"
        onConfirm={handleConfirm}
        onCancel={() => setPendingAction(null)}
      />

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <span className="font-label text-[9px] tracking-[0.3em] uppercase text-primary font-bold block">
            Administration
          </span>
          <h1 className="font-headline text-4xl md:text-5xl italic text-on-surface">
            Reservations & Leads
          </h1>
          <p className="text-sm text-secondary font-body font-light italic">
            Track leads, paid bookings, and cancelled reservations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            disabled={isExporting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-on-primary text-[10px] uppercase tracking-widest font-bold hover:bg-primary/90 transition-all shadow-sm border border-primary/20 disabled:opacity-50"
          >
            <Download className="w-4 h-4" strokeWidth={2} />
            <span>{isExporting ? "Exporting..." : "Export CSV"}</span>
          </button>
          <div className="hidden sm:flex items-center gap-2 border-l border-outline-variant/20 pl-3">
            <CalendarDays className="w-4 h-4 text-outline" strokeWidth={1.5} />
            <span className="font-label text-[9px] uppercase tracking-[0.2em] text-outline font-bold">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </span>
          </div>
        </div>
      </div>

      {/* Category Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => { setStatus("leads"); setPage(1); }}
          className={cn(
            "p-5 rounded-xl border transition-all cursor-pointer",
            status === "leads"
              ? "bg-amber-500/10 border-amber-500/40 shadow-sm"
              : "bg-surface-container-lowest border-outline-variant/15 hover:border-outline-variant/40"
          )}
        >
          <span className="text-[10px] uppercase tracking-widest text-amber-600 font-bold block mb-1">
            ⚡ Leads (Unpaid Attempts)
          </span>
          <div className="flex items-baseline justify-between">
            <span className="font-headline text-3xl italic text-on-surface">{counts.leads}</span>
            <span className="text-[11px] text-secondary font-body italic">Attempted but unpaid</span>
          </div>
        </div>

        <div
          onClick={() => { setStatus("bookings"); setPage(1); }}
          className={cn(
            "p-5 rounded-xl border transition-all cursor-pointer",
            status === "bookings"
              ? "bg-emerald-500/10 border-emerald-500/40 shadow-sm"
              : "bg-surface-container-lowest border-outline-variant/15 hover:border-outline-variant/40"
          )}
        >
          <span className="text-[10px] uppercase tracking-widest text-emerald-600 font-bold block mb-1">
            💳 Bookings (Paid / Deposit)
          </span>
          <div className="flex items-baseline justify-between">
            <span className="font-headline text-3xl italic text-on-surface">{counts.bookings}</span>
            <span className="text-[11px] text-secondary font-body italic">Deposit or full paid</span>
          </div>
        </div>

        <div
          onClick={() => { setStatus("cancelled"); setPage(1); }}
          className={cn(
            "p-5 rounded-xl border transition-all cursor-pointer",
            status === "cancelled"
              ? "bg-red-500/10 border-red-500/40 shadow-sm"
              : "bg-surface-container-lowest border-outline-variant/15 hover:border-outline-variant/40"
          )}
        >
          <span className="text-[10px] uppercase tracking-widest text-red-600 font-bold block mb-1">
            ❌ Cancelled
          </span>
          <div className="flex items-baseline justify-between">
            <span className="font-headline text-3xl italic text-on-surface">{counts.cancelled}</span>
            <span className="text-[11px] text-secondary font-body italic">Cancelled bookings</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs + Search */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {FILTER_TABS.map((tab) => {
            const countVal = counts[tab.countKey as keyof typeof counts];
            return (
              <button
                key={tab.key}
                onClick={() => { setStatus(tab.key); setPage(1); }}
                className={cn(
                  "px-5 py-2.5 rounded-full text-[9px] uppercase tracking-widest font-bold transition-all duration-300 border flex items-center gap-2",
                  status === tab.key
                    ? "bg-on-surface text-surface border-on-surface shadow-md"
                    : "bg-surface-container-lowest text-secondary border-outline-variant/20 hover:border-outline-variant/40 hover:text-on-surface"
                )}
              >
                <span>{tab.label}</span>
                <span className={cn(
                  "px-1.5 py-0.5 rounded-full text-[9px]",
                  status === tab.key ? "bg-surface text-on-surface font-extrabold" : "bg-surface-container text-secondary"
                )}>
                  {countVal}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Custom Calendar Dropdown */}
          <div className="w-full sm:w-52">
            <CalendarDropdown
              value={selectedDate}
              onChange={(date) => { setSelectedDate(date); setPage(1); }}
              placeholder="Filter by Date"
            />
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" strokeWidth={1.5} />
            <input
              type="text"
              placeholder="Search by name, email, phone..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant/20 rounded-full text-sm font-body text-on-surface placeholder:text-outline/50 focus:outline-none focus:border-primary/40 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Bookings Table / Mobile Cards */}
      <div className="rounded-xl shadow-sm border border-outline-variant/10 bg-surface-container-lowest overflow-hidden">
        {filtered.length === 0 ? (
          <p className="p-10 text-center font-body text-secondary italic text-sm">
            No records found for this category.
          </p>
        ) : (
          <>
            {/* Mobile Card Layout (Visible on Small Screens) */}
            <div className="block md:hidden divide-y divide-outline-variant/10">
              {filtered.map((b, i) => (
                <div key={b._id} className="p-5 space-y-4 hover:bg-surface-container/30 transition-colors">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-secondary font-bold">#{(page - 1) * 10 + i + 1}</span>
                      <CategoryBadge status={b.status} paymentStatus={b.paymentStatus} />
                      <TypeBadge type={b.bookingType} />
                    </div>
                    <StatusBadge status={b.status} />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="font-headline text-lg italic text-on-surface">
                        {b.customerName || b.user?.name}
                      </h3>
                      <OccasionBadge occasion={b.occasion} />
                    </div>
                    <p className="text-xs text-secondary font-body">{b.customerEmail || b.user?.email}</p>
                    <p className="text-xs font-mono text-secondary">{b.customerPhone || "—"}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-surface-container/40 text-xs font-body">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-outline block font-bold">Event Date</span>
                      <span className="text-on-surface font-semibold">{formatDate(b.bookingDate)}</span>
                      <span className="text-[10px] text-secondary block">{b.bookingTime}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-outline block font-bold">Party / Tables</span>
                      <span className="text-on-surface font-semibold">{b.partySize} pax</span>
                      <span className="text-[10px] text-primary block font-bold">
                        {b.bookingType === "private_event" ? "Full Venue" : (b.tables.map(t => `T-${t.tableNumber}`).join(", ") || "—")}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-outline block font-bold">Tried Date</span>
                      <span className="text-secondary text-[10px]">{formatDateTime(b.createdAt)}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-outline block font-bold">Amount &amp; Payment</span>
                      <span className="font-headline text-sm italic text-on-surface">${b.totalAmount}</span>
                      <div className="mt-0.5"><PaymentBadge status={b.paymentStatus} remainingStatus={b.remainingPaymentStatus} /></div>
                    </div>
                    {b.bookingType === "private_event" && (
                      <div className="col-span-2 pt-2 border-t border-outline-variant/10 space-y-2">
                        <span className="text-[9px] uppercase tracking-wider text-outline block font-bold">Event Preferences</span>
                        <div className="flex flex-wrap gap-2">
                          <DjBadge needDj={b.needDj} bookingType={b.bookingType} />
                          <CateringBadge cateringMenu={b.cateringMenu} bookingType={b.bookingType} />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    {b.status === "confirmed" && (
                      <button
                        onClick={() => setPendingAction({ bookingId: b._id, action: "cancel" })}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-red-200 text-red-600 text-[9px] uppercase tracking-widest font-bold hover:bg-red-50 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" strokeWidth={2} />
                        Cancel
                      </button>
                    )}
                    <button
                      onClick={() => setPendingAction({ bookingId: b._id, action: "delete" })}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-red-700 text-red-700 text-[9px] uppercase tracking-widest font-bold hover:bg-red-50/50 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table Layout (Visible on Medium+ Screens) */}
            <div className="hidden md:block overflow-x-auto w-full" style={{ WebkitOverflowScrolling: "touch" }}>
              <table className="min-w-[1200px] w-full text-left">
                <thead className="bg-surface-container border-b border-outline-variant/10">
                  <tr>
                    {["#", "Category", "Type", "Guest Name", "Occasion", "Email", "Phone", "Event Date", "Tried Date", "Time", "Party", "Tables", "DJ", "Catering Menu", "Amount", "Payment", "Status", "Actions"].map(h => (
                      <th key={h} className="px-4 py-4 text-[9px] uppercase tracking-widest text-outline font-bold whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {filtered.map((b, i) => (
                    <tr key={b._id} className="hover:bg-surface-container/50 transition-colors">
                      <td className="px-4 py-4 font-body text-sm text-secondary">{(page - 1) * 10 + i + 1}</td>
                      <td className="px-4 py-4"><CategoryBadge status={b.status} paymentStatus={b.paymentStatus} /></td>
                      <td className="px-4 py-4"><TypeBadge type={b.bookingType} /></td>
                      <td className="px-4 py-4 font-headline text-base italic text-on-surface whitespace-nowrap">
                        {b.customerName || b.user?.name}
                      </td>
                      <td className="px-4 py-4"><OccasionBadge occasion={b.occasion} /></td>
                      <td className="px-4 py-4 font-body text-sm text-secondary whitespace-nowrap">
                        {b.customerEmail || b.user?.email}
                      </td>
                      <td className="px-4 py-4 font-body text-sm text-secondary whitespace-nowrap font-mono">
                        {b.customerPhone || "—"}
                      </td>
                      <td className="px-4 py-4 font-body text-sm text-secondary whitespace-nowrap">
                        {formatDate(b.bookingDate)}
                      </td>
                      <td className="px-4 py-4 font-body text-xs text-secondary whitespace-nowrap">
                        {formatDateTime(b.createdAt)}
                      </td>
                      <td className="px-4 py-4 font-body text-sm text-secondary whitespace-nowrap">
                        <div className="flex flex-col">
                          <span>{b.bookingTime}</span>
                          {b.bookingType === "private_event" && (
                            <span className="text-[9px] text-primary font-bold uppercase tracking-widest">
                              {b.durationHours} Hours
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 font-body text-sm text-secondary">{b.partySize} pax</td>
                      <td className="px-4 py-4 font-body text-sm font-bold text-primary italic whitespace-nowrap">
                        {b.bookingType === "private_event" ? (
                          <span className="text-[10px] uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded border border-primary/10">Full Venue</span>
                        ) : (
                          b.tables.map(t => `T-${t.tableNumber}`).join(", ") || "—"
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <DjBadge needDj={b.needDj} bookingType={b.bookingType} />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap max-w-[160px]">
                        <CateringBadge cateringMenu={b.cateringMenu} bookingType={b.bookingType} />
                      </td>
                      <td className="px-4 py-4">
                        {b.bookingType === "private_event" ? (
                          <div className="flex flex-col gap-1">
                            <span className="font-headline text-base italic text-on-surface">${b.totalAmount} <span className="text-[10px] text-outline font-sans not-italic">Total</span></span>
                            {(b.depositAmount ?? 0) > 0 && <span className="text-[10px] text-primary uppercase tracking-widest font-bold">${b.depositAmount ?? 0} Deposit</span>}
                          </div>
                        ) : (
                          <span className="font-headline text-base italic text-on-surface">${b.totalAmount}</span>
                        )}
                      </td>
                      <td className="px-4 py-4"><PaymentBadge status={b.paymentStatus} remainingStatus={b.remainingPaymentStatus} /></td>
                      <td className="px-4 py-4"><StatusBadge status={b.status} /></td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          {b.status === "confirmed" && (
                            <button
                              onClick={() => setPendingAction({ bookingId: b._id, action: "cancel" })}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-red-200 text-red-600 text-[9px] uppercase tracking-widest font-bold hover:bg-red-50 transition-colors"
                            >
                              <XCircle className="w-3 h-3" strokeWidth={2} />
                              Cancel
                            </button>
                          )}
                          <button
                            onClick={() => setPendingAction({ bookingId: b._id, action: "delete" })}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-red-700 text-red-700 text-[9px] uppercase tracking-widest font-bold hover:bg-red-50/50 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
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
