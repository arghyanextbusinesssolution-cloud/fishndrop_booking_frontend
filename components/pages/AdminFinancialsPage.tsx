"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/axios";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { cn, formatTimeTo12Hour, formatBookingDate, formatVenueDateTime } from "@/lib/utils";
import toast from "react-hot-toast";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Clock,
  Briefcase,
  PiggyBank,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Filter,
  ArrowUpRight,
  Eye,
  Check,
  RotateCcw,
  RefreshCw,
  X,
  FileSpreadsheet,
  ChevronRight,
  ShieldAlert
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from "recharts";

interface FinancialSummary {
  totalContractedRevenue: number;
  totalCollected: number;
  outstandingBalance: number;
  upcomingExpected: number;
  vendorPayables: number;
  vendorPaid: number;
  totalRefunds: number;
  netProfit: number;
  confirmedBookingsCount: number;
}

interface RevenueChartItem {
  label: string;
  contracted: number;
  collected: number;
  outstanding: number;
}

interface UpcomingPaymentItem {
  _id: string;
  bookingId: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  eventType: string;
  bookingType: string;
  eventDate: string;
  bookingTime: string;
  contractedAmount: number;
  amountPaid: number;
  balanceDue: number;
  paymentDueDate: string;
  status: string;
  rawPaymentStatus: string;
}

interface ProfitabilityItem {
  _id: string;
  bookingId: string;
  customer: string;
  customerEmail: string;
  eventDate: string;
  bookingTime: string;
  eventType: string;
  totalRevenue: number;
  totalCollected: number;
  totalCosts: number;
  netProfit: number;
  profitMargin: number;
  breakdown: {
    revenue: {
      baseVenueAmount: number;
      extraHours: number;
      cateringCustomerCharge: number;
      djCharge: number;
      photographyCharge: number;
      otherAddons: number;
      discounts: number;
      totalContracted: number;
      totalCollected: number;
    };
    expenses: {
      vendorCosts: any[];
      totalExpenses: number;
      refunds: number;
    };
    netProfit: number;
    profitMargin: number;
  };
}

interface VendorPayableItem {
  bookingId: string;
  bookingMongoId: string;
  eventDate: string;
  customerName: string;
  vendorIndex: number;
  vendorName: string;
  vendorType: string;
  amountOwed: number;
  amountPaid: number;
  remaining: number;
  paymentStatus: string;
  paymentDate?: string;
  paymentMethod?: string;
  notes?: string;
  markedPaidBy?: string;
}

interface RefundItem {
  _id: string;
  bookingId: string;
  customer: string;
  customerEmail: string;
  eventDate: string;
  cancellationDate: string;
  originalContractValue: number;
  amountPaid: number;
  refundAmount: number;
  refundStatus: string;
  cancellationReason: string;
  processedBy: string;
  processedAt: string;
}

export default function AdminFinancialsPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  // Role Protection check
  const isSarahOrStaff =
    user?.role === "staff" ||
    user?.name?.toLowerCase().includes("sarah") ||
    user?.email?.toLowerCase().includes("sarah");

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<"all" | "today" | "week" | "month" | "year">("month");
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("month");
  const [activeTab, setActiveTab] = useState<"all" | "upcoming" | "profitability" | "vendors" | "refunds">("all");

  // Data states
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [chartData, setChartData] = useState<RevenueChartItem[]>([]);
  const [upcomingPayments, setUpcomingPayments] = useState<UpcomingPaymentItem[]>([]);
  const [profitability, setProfitability] = useState<ProfitabilityItem[]>([]);
  const [vendorPayables, setVendorPayables] = useState<VendorPayableItem[]>([]);
  const [refunds, setRefunds] = useState<RefundItem[]>([]);

  // Filter states
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [eventTypeFilter, setEventTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [selectedProfitDetail, setSelectedProfitDetail] = useState<ProfitabilityItem | null>(null);
  const [payingVendor, setPayingVendor] = useState<VendorPayableItem | null>(null);
  const [payAmountInput, setPayAmountInput] = useState<number>(0);
  const [payMethodInput, setPayMethodInput] = useState<string>("Zelle");
  const [payNotesInput, setPayNotesInput] = useState<string>("");
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Fetch all financial data
  const loadFinancialData = async () => {
    try {
      setRefreshing(true);
      const [statsRes, upcomingRes, profitRes, vendorsRes, refundsRes] = await Promise.all([
        api.get("/admin/financials/stats", { params: { timeRange, groupBy } }),
        api.get("/admin/financials/upcoming-payments", { params: { eventType: eventTypeFilter } }),
        api.get("/admin/financials/profitability"),
        api.get("/admin/financials/vendor-payables"),
        api.get("/admin/financials/refunds")
      ]);

      if (statsRes.data?.success) {
        setSummary(statsRes.data.data.summary);
        setChartData(statsRes.data.data.revenueChart || []);
      }
      if (upcomingRes.data?.success) {
        setUpcomingPayments(upcomingRes.data.data || []);
      }
      if (profitRes.data?.success) {
        setProfitability(profitRes.data.data || []);
      }
      if (vendorsRes.data?.success) {
        setVendorPayables(vendorsRes.data.data || []);
      }
      if (refundsRes.data?.success) {
        setRefunds(refundsRes.data.data || []);
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        toast.error("Access denied: You do not have permission to view Financial Reports.");
        router.push("/admin");
      } else {
        toast.error("Failed to load financial data.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isSarahOrStaff) {
      toast.error("Access restricted: Staff role cannot view Financial Dashboard.");
      router.push("/admin");
      return;
    }
    loadFinancialData();
  }, [timeRange, groupBy, eventTypeFilter]);

  // Handle Mark as Paid
  const handleConfirmVendorPayment = async () => {
    if (!payingVendor) return;
    setSubmittingPayment(true);
    try {
      const res = await api.patch(`/admin/financials/vendor-payables/${payingVendor.bookingMongoId}/pay`, {
        vendorIndex: payingVendor.vendorIndex,
        paidAmount: payAmountInput,
        paymentMethod: payMethodInput,
        notes: payNotesInput
      });
      if (res.data?.success) {
        toast.success(`Recorded $${payAmountInput} payment to ${payingVendor.vendorName}`);
        setPayingVendor(null);
        loadFinancialData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update vendor payment.");
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Filtered upcoming payments
  const filteredUpcoming = useMemo(() => {
    return upcomingPayments.filter((p) => {
      const matchSearch =
        p.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.bookingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.customer.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = paymentStatusFilter === "all" || p.status === paymentStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [upcomingPayments, searchQuery, paymentStatusFilter]);

  // Filtered profitability
  const filteredProfitability = useMemo(() => {
    return profitability.filter((p) => {
      return (
        p.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.bookingId.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [profitability, searchQuery]);

  // Filtered vendors
  const filteredVendors = useMemo(() => {
    return vendorPayables.filter((v) => {
      return (
        v.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.bookingId.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [vendorPayables, searchQuery]);

  // Filtered refunds
  const filteredRefunds = useMemo(() => {
    return refunds.filter((r) => {
      return (
        r.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.bookingId.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [refunds, searchQuery]);

  if (isSarahOrStaff) {
    return (
      <div className="min-h-screen p-10 flex flex-col items-center justify-center text-center space-y-4">
        <ShieldAlert className="w-16 h-16 text-rose-500" />
        <h1 className="text-2xl font-headline italic text-white">Access Restricted</h1>
        <p className="text-white/60 text-sm max-w-md">
          Staff users do not have clearance to view executive revenue or financial profitability reports.
        </p>
      </div>
    );
  }

  if (loading && !summary) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-4 sm:p-6 md:p-10 space-y-8 min-h-screen">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-label text-[10px] tracking-[0.25em] uppercase text-[#C8A96A] font-bold">
              Executive Financial Suite
            </span>
            <span className="bg-[#C8A96A]/20 text-[#E8CB8A] text-[9px] px-2 py-0.5 rounded-full font-bold border border-[#C8A96A]/30">
              Owner Verified
            </span>
          </div>
          <h1 className="font-headline text-3xl md:text-5xl italic text-white mt-1">
            Financial <span className="text-[#C8A96A] not-italic">Dashboard</span>
          </h1>
          <p className="text-white/60 text-xs md:text-sm font-light mt-1 max-w-xl">
            Track revenue, collected payments, outstanding balances, vendor costs, and event profitability.
          </p>
        </div>

        {/* Global Action & Refresh */}
        <div className="flex items-center gap-3">
          <button
            onClick={loadFinancialData}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 hover:border-[#C8A96A]/40 bg-[#0b1410] text-[#E8CB8A] text-xs font-bold transition-all"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin text-[#C8A96A]")} />
            <span>{refreshing ? "Refreshing..." : "Refresh Data"}</span>
          </button>
        </div>
      </div>

      {/* 2. Responsive Summary Cards (Clickable for drill-down) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total Contracted Revenue */}
        <div
          onClick={() => setActiveTab("all")}
          className={cn(
            "p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group",
            activeTab === "all"
              ? "bg-[#0b1410] border-[#C8A96A] shadow-lg shadow-[#C8A96A]/10"
              : "bg-[#0b1410]/70 border-white/10 hover:border-[#C8A96A]/50 hover:bg-[#0b1410]"
          )}
        >
          <div className="flex items-start justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#C8A96A] font-bold">
              Contracted Revenue
            </span>
            <DollarSign className="w-4 h-4 text-[#C8A96A]/60 group-hover:text-[#C8A96A] transition-colors" />
          </div>
          <div className="mt-4">
            <p className="font-headline text-2xl lg:text-3xl italic text-white">
              ${(summary?.totalContractedRevenue || 0).toLocaleString()}
            </p>
            <p className="text-[10px] text-white/50 mt-1">Confirmed booking value</p>
          </div>
        </div>

        {/* Total Collected */}
        <div
          onClick={() => setActiveTab("all")}
          className={cn(
            "p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group",
            "bg-[#0b1410]/70 border-white/10 hover:border-emerald-500/50 hover:bg-[#0b1410]"
          )}
        >
          <div className="flex items-start justify-between">
            <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold">
              Total Collected
            </span>
            <CreditCard className="w-4 h-4 text-emerald-400/60 group-hover:text-emerald-400 transition-colors" />
          </div>
          <div className="mt-4">
            <p className="font-headline text-2xl lg:text-3xl italic text-emerald-400">
              ${(summary?.totalCollected || 0).toLocaleString()}
            </p>
            <p className="text-[10px] text-white/50 mt-1">Actually received in bank</p>
          </div>
        </div>

        {/* Outstanding Balance */}
        <div
          onClick={() => setActiveTab("upcoming")}
          className={cn(
            "p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group",
            activeTab === "upcoming"
              ? "bg-[#0b1410] border-amber-500 shadow-lg shadow-amber-500/10"
              : "bg-[#0b1410]/70 border-white/10 hover:border-amber-500/50 hover:bg-[#0b1410]"
          )}
        >
          <div className="flex items-start justify-between">
            <span className="text-[10px] uppercase tracking-wider text-amber-400 font-bold">
              Outstanding Balance
            </span>
            <Clock className="w-4 h-4 text-amber-400/60 group-hover:text-amber-400 transition-colors" />
          </div>
          <div className="mt-4">
            <p className="font-headline text-2xl lg:text-3xl italic text-amber-400">
              ${(summary?.outstandingBalance || 0).toLocaleString()}
            </p>
            <p className="text-[10px] text-white/50 mt-1">Remaining customer balance</p>
          </div>
        </div>

        {/* Upcoming Expected */}
        <div
          onClick={() => setActiveTab("upcoming")}
          className={cn(
            "p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group",
            "bg-[#0b1410]/70 border-white/10 hover:border-blue-400/50 hover:bg-[#0b1410]"
          )}
        >
          <div className="flex items-start justify-between">
            <span className="text-[10px] uppercase tracking-wider text-blue-400 font-bold">
              Upcoming Expected
            </span>
            <TrendingUp className="w-4 h-4 text-blue-400/60 group-hover:text-blue-400 transition-colors" />
          </div>
          <div className="mt-4">
            <p className="font-headline text-2xl lg:text-3xl italic text-blue-300">
              ${(summary?.upcomingExpected || 0).toLocaleString()}
            </p>
            <p className="text-[10px] text-white/50 mt-1">Due before event dates</p>
          </div>
        </div>

        {/* Vendor Payables */}
        <div
          onClick={() => setActiveTab("vendors")}
          className={cn(
            "p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group",
            activeTab === "vendors"
              ? "bg-[#0b1410] border-rose-500 shadow-lg shadow-rose-500/10"
              : "bg-[#0b1410]/70 border-white/10 hover:border-rose-500/50 hover:bg-[#0b1410]"
          )}
        >
          <div className="flex items-start justify-between">
            <span className="text-[10px] uppercase tracking-wider text-rose-400 font-bold">
              Vendor Payables
            </span>
            <Briefcase className="w-4 h-4 text-rose-400/60 group-hover:text-rose-400 transition-colors" />
          </div>
          <div className="mt-4">
            <p className="font-headline text-2xl lg:text-3xl italic text-rose-400">
              ${(summary?.vendorPayables || 0).toLocaleString()}
            </p>
            <p className="text-[10px] text-white/50 mt-1">Owed to DJs, catering &amp; photo</p>
          </div>
        </div>

        {/* Net Profit */}
        <div
          onClick={() => setActiveTab("profitability")}
          className={cn(
            "p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group",
            activeTab === "profitability"
              ? "bg-gradient-to-br from-[#0c2419] to-[#081810] border-[#C8A96A] shadow-lg shadow-[#C8A96A]/20"
              : "bg-gradient-to-br from-[#0a1e15] to-[#07150e] border-[#C8A96A]/30 hover:border-[#C8A96A]"
          )}
        >
          <div className="flex items-start justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#C8A96A] font-bold">
              Net Profit
            </span>
            <PiggyBank className="w-4 h-4 text-[#C8A96A]" />
          </div>
          <div className="mt-4">
            <p className="font-headline text-2xl lg:text-3xl italic text-white">
              ${(summary?.netProfit || 0).toLocaleString()}
            </p>
            <p className="text-[10px] text-[#C8A96A]/80 mt-1">Collected less costs &amp; refunds</p>
          </div>
        </div>
      </section>

      {/* 3. Filter Controls & Tab Switcher */}
      <div className="p-4 rounded-2xl bg-[#0b1410] border border-white/10 flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto">
          {[
            { id: "all", label: "Overview & Revenue" },
            { id: "upcoming", label: "Upcoming Payments" },
            { id: "profitability", label: "Event Profitability" },
            { id: "vendors", label: "Vendor Payables" },
            { id: "refunds", label: "Refunds & Cancellations" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider",
                activeTab === tab.id
                  ? "bg-[#C8A96A] text-[#0a120e] shadow-md shadow-[#C8A96A]/20"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
          {/* Time Range Filter */}
          <div className="flex items-center rounded-xl bg-black/40 border border-white/10 p-1">
            {(["today", "week", "month", "year", "all"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={cn(
                  "px-2.5 py-1 text-[11px] font-bold uppercase rounded-lg transition-colors",
                  timeRange === r
                    ? "bg-[#C8A96A]/20 text-[#E8CB8A] border border-[#C8A96A]/30"
                    : "text-white/50 hover:text-white"
                )}
              >
                {r === "all" ? "All Time" : r}
              </button>
            ))}
          </div>

          {/* Group By selector (for Chart) */}
          {activeTab === "all" && (
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as any)}
              className="bg-black/60 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-[#E8CB8A] outline-none"
            >
              <option value="day">Group by Day</option>
              <option value="week">Group by Week</option>
              <option value="month">Group by Month</option>
            </select>
          )}

          {/* Search Bar */}
          <input
            type="text"
            placeholder="Search booking or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-black/60 border border-white/15 focus:border-[#C8A96A] rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-white/30 outline-none w-48"
          />
        </div>
      </div>

      {/* 4. Revenue Overview Chart (Shown when on Overview tab) */}
      {activeTab === "all" && (
        <section className="p-6 rounded-2xl bg-[#0b1410] border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-headline text-2xl italic text-white">Revenue Overview</h2>
              <p className="text-white/50 text-xs mt-0.5">
                Contracted Revenue vs. Collected Revenue vs. Outstanding Balance
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-white/70">
                <span className="w-3 h-3 rounded-sm bg-[#C8A96A]" /> Contracted
              </span>
              <span className="flex items-center gap-1.5 text-white/70">
                <span className="w-3 h-3 rounded-sm bg-emerald-500" /> Collected
              </span>
              <span className="flex items-center gap-1.5 text-white/70">
                <span className="w-3 h-3 rounded-sm bg-amber-500" /> Outstanding
              </span>
            </div>
          </div>

          <div className="h-80 w-full pt-4">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a3b33" vertical={false} />
                  <XAxis dataKey="label" stroke="#8c9e94" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#8c9e94"
                    fontSize={11}
                    tickFormatter={(val) => `$${val.toLocaleString()}`}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#08130e",
                      borderColor: "#C8A96A",
                      borderRadius: "12px",
                      color: "#fff",
                      fontSize: "12px"
                    }}
                    formatter={(val: any) => [`$${Number(val).toLocaleString()}`, ""]}
                  />
                  <Bar dataKey="contracted" name="Contracted" fill="#C8A96A" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="collected" name="Collected" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="outstanding" name="Outstanding" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-white/40 text-sm">
                No revenue records in the selected time range
              </div>
            )}
          </div>
        </section>
      )}

      {/* 5. Upcoming Payments Section */}
      {(activeTab === "all" || activeTab === "upcoming") && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-headline text-2xl italic text-white">Upcoming Payments</h2>
              <p className="text-white/50 text-xs">Customer balance due schedules and payment deadlines</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="bg-[#0b1410] border border-white/15 rounded-xl px-3 py-1.5 text-xs text-[#E8CB8A] outline-none"
              >
                <option value="all">All Payment Statuses</option>
                <option value="Pending Deposit">Pending Deposit</option>
                <option value="Deposit Paid">Deposit Paid</option>
                <option value="Balance Due">Balance Due</option>
                <option value="Fully Paid">Fully Paid</option>
                <option value="Refunded">Refunded</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0b1410]">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/40 text-[#C8A96A] font-bold uppercase tracking-wider text-[10px] border-b border-white/10">
                <tr>
                  <th className="p-4">Booking ID</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Event Type</th>
                  <th className="p-4">Event Date</th>
                  <th className="p-4">Contracted</th>
                  <th className="p-4">Amount Paid</th>
                  <th className="p-4">Balance Due</th>
                  <th className="p-4">Payment Due Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/80">
                {filteredUpcoming.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-white/40">
                      No upcoming payment records match your filters
                    </td>
                  </tr>
                ) : (
                  filteredUpcoming.map((item) => (
                    <tr key={item._id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 font-mono font-bold text-[#E8CB8A]">#{item.bookingId}</td>
                      <td className="p-4">
                        <div className="font-semibold text-white">{item.customer.name}</div>
                        <div className="text-[11px] text-white/50">{item.customer.phone || item.customer.email}</div>
                      </td>
                      <td className="p-4 text-white/70">{item.eventType}</td>
                      <td className="p-4">
                        <div>{formatBookingDate(item.eventDate, { month: "short", day: "numeric", year: "numeric" })}</div>
                        <div className="text-[11px] text-white/40">{formatTimeTo12Hour(item.bookingTime)}</div>
                      </td>
                      <td className="p-4 font-semibold text-white">${item.contractedAmount.toLocaleString()}</td>
                      <td className="p-4 text-emerald-400 font-semibold">${item.amountPaid.toLocaleString()}</td>
                      <td className="p-4 text-amber-400 font-semibold">${item.balanceDue.toLocaleString()}</td>
                      <td className="p-4 text-white/60">
                        {formatVenueDateTime(item.paymentDueDate, { month: "short", day: "numeric" })}
                      </td>
                      <td className="p-4">
                        <span
                          className={cn(
                            "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block",
                            item.status === "Fully Paid"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : item.status === "Balance Due"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : item.status === "Deposit Paid"
                              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                              : "bg-white/5 text-white/60 border border-white/10"
                          )}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => router.push(`/admin/bookings?search=${item.bookingId}`)}
                          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-[#C8A96A]/20 hover:text-[#E8CB8A] border border-white/10 text-[11px] font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-1"
                        >
                          <span>View Details</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 6. Event Profitability Section */}
      {(activeTab === "all" || activeTab === "profitability") && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-headline text-2xl italic text-white">Event Profitability</h2>
              <p className="text-white/50 text-xs">Customer revenue vs. vendor expenses &amp; net margins</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0b1410]">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/40 text-[#C8A96A] font-bold uppercase tracking-wider text-[10px] border-b border-white/10">
                <tr>
                  <th className="p-4">Booking ID</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Event Date</th>
                  <th className="p-4">Total Revenue</th>
                  <th className="p-4">Total Costs</th>
                  <th className="p-4">Net Profit</th>
                  <th className="p-4">Profit Margin</th>
                  <th className="p-4 text-right">Breakdown</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/80">
                {filteredProfitability.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-white/40">
                      No event profitability records found
                    </td>
                  </tr>
                ) : (
                  filteredProfitability.map((item) => (
                    <tr key={item._id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 font-mono font-bold text-[#E8CB8A]">#{item.bookingId}</td>
                      <td className="p-4 font-semibold text-white">{item.customer}</td>
                      <td className="p-4">
                        {formatBookingDate(item.eventDate, { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="p-4 font-bold text-white">${item.totalRevenue.toLocaleString()}</td>
                      <td className="p-4 text-rose-400 font-semibold">${item.totalCosts.toLocaleString()}</td>
                      <td className="p-4 text-emerald-400 font-bold text-sm">${item.netProfit.toLocaleString()}</td>
                      <td className="p-4">
                        <span
                          className={cn(
                            "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                            item.profitMargin >= 50
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : item.profitMargin >= 25
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                          )}
                        >
                          {item.profitMargin}%
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setSelectedProfitDetail(item)}
                          className="px-3 py-1.5 rounded-lg bg-[#C8A96A]/10 hover:bg-[#C8A96A]/20 text-[#E8CB8A] border border-[#C8A96A]/30 text-[11px] font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Details</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 8. Vendor Payables Section */}
      {(activeTab === "all" || activeTab === "vendors") && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-headline text-2xl italic text-white">Vendor Payables</h2>
              <p className="text-white/50 text-xs">Direct event vendor payouts (DJs, Catering, Photographers)</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0b1410]">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/40 text-[#C8A96A] font-bold uppercase tracking-wider text-[10px] border-b border-white/10">
                <tr>
                  <th className="p-4">Vendor</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Booking ID</th>
                  <th className="p-4">Event Date</th>
                  <th className="p-4">Amount Owed</th>
                  <th className="p-4">Amount Paid</th>
                  <th className="p-4">Remaining</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/80">
                {filteredVendors.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-white/40">
                      No vendor payables currently listed
                    </td>
                  </tr>
                ) : (
                  filteredVendors.map((v, i) => (
                    <tr key={`${v.bookingId}-${v.vendorIndex}-${i}`} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 font-semibold text-white">{v.vendorName}</td>
                      <td className="p-4 uppercase text-[10px] font-bold text-[#E8CB8A]">{v.vendorType}</td>
                      <td className="p-4 font-mono font-bold text-white/70">#{v.bookingId}</td>
                      <td className="p-4">
                        {formatBookingDate(v.eventDate, { month: "short", day: "numeric" })}
                      </td>
                      <td className="p-4 font-bold text-white">${v.amountOwed.toLocaleString()}</td>
                      <td className="p-4 text-emerald-400 font-semibold">${v.amountPaid.toLocaleString()}</td>
                      <td className="p-4 text-rose-400 font-semibold">${v.remaining.toLocaleString()}</td>
                      <td className="p-4">
                        <span
                          className={cn(
                            "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                            v.paymentStatus === "paid"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : v.paymentStatus === "partially_paid"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                          )}
                        >
                          {v.paymentStatus.replace("_", " ")}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {v.remaining > 0 ? (
                          <button
                            onClick={() => {
                              setPayingVendor(v);
                              setPayAmountInput(v.remaining);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Mark Paid</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-400 flex items-center justify-end gap-1 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Settled</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 9. Refunds and Cancellation Log Section */}
      {(activeTab === "all" || activeTab === "refunds") && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-headline text-2xl italic text-white">Refunds &amp; Cancellations</h2>
              <p className="text-white/50 text-xs">Cancelled booking logs and refund tracking records</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0b1410]">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/40 text-[#C8A96A] font-bold uppercase tracking-wider text-[10px] border-b border-white/10">
                <tr>
                  <th className="p-4">Booking ID</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Event Date</th>
                  <th className="p-4">Contract Value</th>
                  <th className="p-4">Amount Paid</th>
                  <th className="p-4">Refund Amount</th>
                  <th className="p-4">Refund Status</th>
                  <th className="p-4">Cancellation Reason</th>
                  <th className="p-4 text-right">Processed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/80">
                {filteredRefunds.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-white/40">
                      No cancellations or refund events recorded
                    </td>
                  </tr>
                ) : (
                  filteredRefunds.map((r) => (
                    <tr key={r._id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 font-mono font-bold text-[#E8CB8A]">#{r.bookingId}</td>
                      <td className="p-4 font-semibold text-white">{r.customer}</td>
                      <td className="p-4">
                        {formatBookingDate(r.eventDate, { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="p-4 text-white">${r.originalContractValue.toLocaleString()}</td>
                      <td className="p-4 text-emerald-400 font-semibold">${r.amountPaid.toLocaleString()}</td>
                      <td className="p-4 text-rose-400 font-bold">${r.refundAmount.toLocaleString()}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/30">
                          {r.refundStatus.replace("_", " ")}
                        </span>
                      </td>
                      <td className="p-4 text-white/70 max-w-xs truncate">{r.cancellationReason}</td>
                      <td className="p-4 text-right text-white/50">{r.processedBy}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 7. Event Profit Details Modal */}
      {selectedProfitDetail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#0b1410] border border-[#C8A96A]/40 rounded-3xl max-w-2xl w-full p-6 md:p-8 space-y-6 shadow-2xl relative">
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#C8A96A]">
                  Event Profit Details · #{selectedProfitDetail.bookingId}
                </span>
                <h3 className="font-headline text-2xl italic text-white mt-1">
                  {selectedProfitDetail.customer}
                </h3>
                <p className="text-white/50 text-xs">
                  Event Date: {formatBookingDate(selectedProfitDetail.eventDate, { month: "long", day: "numeric", year: "numeric" })}
                </p>
              </div>
              <button
                onClick={() => setSelectedProfitDetail(null)}
                className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Revenue Column */}
              <div className="space-y-3 bg-black/40 p-4 rounded-2xl border border-white/5">
                <h4 className="font-bold uppercase tracking-wider text-[#C8A96A] text-[11px] flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5" />
                  Revenue Breakdown
                </h4>
                <div className="space-y-2 text-white/80">
                  <div className="flex justify-between">
                    <span>Base Venue Buyout (5h)</span>
                    <span className="font-bold">${selectedProfitDetail.breakdown.revenue.baseVenueAmount.toLocaleString()}</span>
                  </div>
                  {selectedProfitDetail.breakdown.revenue.extraHours > 0 && (
                    <div className="flex justify-between text-amber-300">
                      <span>Extra Hours</span>
                      <span>+${selectedProfitDetail.breakdown.revenue.extraHours.toLocaleString()}</span>
                    </div>
                  )}
                  {selectedProfitDetail.breakdown.revenue.cateringCustomerCharge > 0 && (
                    <div className="flex justify-between">
                      <span>Catering Charge</span>
                      <span>+${selectedProfitDetail.breakdown.revenue.cateringCustomerCharge.toLocaleString()}</span>
                    </div>
                  )}
                  {selectedProfitDetail.breakdown.revenue.djCharge > 0 && (
                    <div className="flex justify-between">
                      <span>DJ Sound &amp; Equipment</span>
                      <span>+${selectedProfitDetail.breakdown.revenue.djCharge.toLocaleString()}</span>
                    </div>
                  )}
                  {selectedProfitDetail.breakdown.revenue.photographyCharge > 0 && (
                    <div className="flex justify-between">
                      <span>Photography Coverage</span>
                      <span>+${selectedProfitDetail.breakdown.revenue.photographyCharge.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-white/10 flex justify-between font-bold text-white">
                    <span>Total Contracted</span>
                    <span>${selectedProfitDetail.breakdown.revenue.totalContracted.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>Total Collected</span>
                    <span>${selectedProfitDetail.breakdown.revenue.totalCollected.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Expenses Column */}
              <div className="space-y-3 bg-black/40 p-4 rounded-2xl border border-white/5">
                <h4 className="font-bold uppercase tracking-wider text-rose-400 text-[11px] flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5" />
                  Expenses &amp; Vendors
                </h4>
                <div className="space-y-2 text-white/80">
                  {selectedProfitDetail.breakdown.expenses.vendorCosts.map((v, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="truncate pr-2">{v.vendorName} ({v.vendorType})</span>
                      <span className="text-rose-400 font-semibold">${v.amountOwed.toLocaleString()}</span>
                    </div>
                  ))}
                  {selectedProfitDetail.breakdown.expenses.refunds > 0 && (
                    <div className="flex justify-between text-rose-400">
                      <span>Refunds Issued</span>
                      <span>-${selectedProfitDetail.breakdown.expenses.refunds.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-white/10 flex justify-between font-bold text-rose-400">
                    <span>Total Costs</span>
                    <span>${selectedProfitDetail.breakdown.expenses.totalExpenses.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Final Profit Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#C8A96A]/20 via-[#E8CB8A]/10 to-transparent border border-[#C8A96A]/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#C8A96A] font-bold">
                  Net Event Profit
                </span>
                <p className="font-headline text-3xl italic text-white mt-0.5">
                  ${selectedProfitDetail.netProfit.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider text-white/60 font-bold">
                  Profit Margin
                </span>
                <p className="font-headline text-3xl italic text-emerald-400 mt-0.5">
                  {selectedProfitDetail.profitMargin}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Record Vendor Payment Modal */}
      {payingVendor && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#0b1410] border border-[#C8A96A]/40 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="font-headline text-xl italic text-white">Record Vendor Payout</h3>
                <p className="text-xs text-white/60">{payingVendor.vendorName} · #{payingVendor.bookingId}</p>
              </div>
              <button
                onClick={() => setPayingVendor(null)}
                className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-white/70 font-semibold">Payment Amount ($)</label>
                <input
                  type="number"
                  value={payAmountInput}
                  onChange={(e) => setPayAmountInput(Number(e.target.value))}
                  className="w-full bg-black/60 border border-white/15 focus:border-[#C8A96A] rounded-xl px-4 py-2.5 text-base font-mono text-white outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-white/70 font-semibold">Payment Method</label>
                <select
                  value={payMethodInput}
                  onChange={(e) => setPayMethodInput(e.target.value)}
                  className="w-full bg-black/60 border border-white/15 focus:border-[#C8A96A] rounded-xl px-3 py-2.5 text-xs text-white outline-none"
                >
                  <option value="Zelle">Zelle</option>
                  <option value="Card">Credit / Debit Card</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer (ACH / Wire)</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-white/70 font-semibold">Notes / Reference</label>
                <input
                  type="text"
                  placeholder="e.g. Sent via Zelle confirmation #..."
                  value={payNotesInput}
                  onChange={(e) => setPayNotesInput(e.target.value)}
                  className="w-full bg-black/60 border border-white/15 focus:border-[#C8A96A] rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setPayingVendor(null)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-white/70 hover:text-white font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submittingPayment || payAmountInput <= 0}
                  onClick={handleConfirmVendorPayment}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#C8A96A] to-[#E8CB8A] text-[#0a120e] font-bold uppercase tracking-wider flex items-center gap-2 hover:opacity-95 disabled:opacity-50"
                >
                  {submittingPayment ? "Processing..." : "Confirm Payout"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
