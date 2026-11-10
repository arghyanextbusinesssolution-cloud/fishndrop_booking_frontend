"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";
import { EventBookingsModal } from "@/components/events/EventBookingsModal";
import {
  Ticket,
  DollarSign,
  TrendingUp,
  Users,
  CheckCircle,
  AlertCircle,
  Plus,
  ArrowUpRight,
  ExternalLink,
  ShieldCheck,
  Building,
  Calendar,
  Clock,
  Lock,
  Mail,
  Smartphone,
  Share2,
  Copy
} from "lucide-react";

interface DashboardStats {
  totalEvents: number;
  totalTicketsSold: number;
  grossRevenue: number;
  platformFees: number;
  processingFees: number;
  refundTotal: number;
  netEarnings: number;
  checkInCount: number;
  stripeConnectOnboarded: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  promoterStatus: string;
}

interface PromoterEvent {
  _id: string;
  title: string;
  slug: string;
  date: string;
  startTime: string;
  endTime: string;
  venueName: string;
  status: string;
  flyerUrl: string;
  approvedAt?: string;
  approvedBy?: { name?: string } | string;
  rejectionReason?: string;
  totalTicketsSold: number;
  grossRevenue: number;
  netEarnings: number;
  checkInCount: number;
  ticketTiers: Array<{
    name: string;
    price: number;
    quantity: number;
    sold: number;
  }>;
}

export default function PromoterDashboardPage() {
  const { user, fetchMe } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [events, setEvents] = useState<PromoterEvent[]>([]);
  const [bookingsEvent, setBookingsEvent] = useState<{ id: string; title: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [statsRes, eventsRes] = await Promise.all([
        api.get("/events/promoter/dashboard-stats"),
        api.get("/events/my-events")
      ]);

      if (statsRes.data?.success) {
        setStats(statsRes.data.stats);
        if (statsRes.data.stats.promoterStatus && statsRes.data.stats.promoterStatus !== user?.promoterStatus) {
          void fetchMe();
        }
      }
      if (eventsRes.data?.success) {
        setEvents(eventsRes.data.events);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRequestApproval = async (eventId: string) => {
    try {
      const { data } = await api.patch(`/events/${eventId}/publish-request`);
      if (data.success) {
        toast.success("Event submitted for staff publication review!");
        fetchDashboardData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit event");
    }
  };

  const getPublicEventUrl = (slug: string) =>
    typeof window === "undefined" ? `/events/${slug}` : `${window.location.origin}/events/${slug}`;

  const copyPublicEventLink = async (slug: string) => {
    if (typeof window === "undefined") return;
    try {
      await navigator.clipboard.writeText(getPublicEventUrl(slug));
      toast.success("Public event link copied! Share it with your attendees.");
    } catch {
      toast.error("Couldn't copy automatically — select the link and copy it manually.");
    }
  };

  const shareEvent = async (evt: PromoterEvent) => {
    const url = getPublicEventUrl(evt.slug);
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title: evt.title, text: `Get your tickets for ${evt.title}`, url });
        return;
      } catch (err: any) {
        if (err?.name === "AbortError") return; // user closed the share sheet
      }
    }
    await copyPublicEventLink(evt.slug);
  };

  const statusLabel = (status: string) =>
    status === "published"
      ? "Verified"
      : status === "pending_approval"
      ? "Pending Verification"
      : status === "cancelled"
      ? "Rejected"
      : status.replace("_", " ");

  const statusBadgeClass = (status: string, onImage: boolean) =>
    status === "published"
      ? onImage ? "bg-emerald-500/80 text-white" : "bg-emerald-500/20 text-emerald-300"
      : status === "pending_approval"
      ? onImage ? "bg-amber-500/80 text-black" : "bg-amber-500/20 text-amber-300"
      : status === "cancelled"
      ? onImage ? "bg-red-500/80 text-white" : "bg-red-500/20 text-red-300"
      : onImage ? "bg-white/20 text-white" : "bg-white/10 text-white/70";

  const verifiedEventsCount = events.filter((e) => e.status === "published").length;
  const pendingEventsCount = events.filter((e) => e.status === "pending_approval").length;

  if (isLoading) {
    return (
      <div className="p-6 md:p-10 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-[#C8A96A]"></div>
      </div>
    );
  }

  const promoterStatus = stats?.promoterStatus || user?.promoterStatus || "pending";
  const isApproved = promoterStatus === "approved";

  // Dedicated Pending / Inactive Screen when not approved
  if (!isApproved) {
    return (
      <div className="p-6 md:p-12 min-h-screen max-w-4xl mx-auto space-y-8 animate-fade-in">
        {/* Header Badge */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-label text-[10px] uppercase font-bold tracking-[0.25em]">
            <Clock className="w-3.5 h-3.5 animate-pulse" />
            <span>Account Inactive / Pending Review</span>
          </div>
          <h1 className="font-headline text-3xl sm:text-5xl italic font-bold text-white tracking-tight">
            Account Pending Approval
          </h1>
          <p className="font-body text-white/60 text-sm sm:text-base max-w-lg mx-auto">
            Your promoter registration has been received. Ticket sales, payouts, and event management are inactive until staff verification.
          </p>
        </div>

        {/* The Exact Notification Message Card */}
        <div className="bg-[#0e1713] border-2 border-amber-500/40 rounded-3xl p-6 sm:p-10 text-center space-y-4 shadow-2xl shadow-amber-950/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 mx-auto flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>
          <h2 className="font-headline text-xl sm:text-3xl text-white font-bold max-w-2xl mx-auto leading-snug">
            Our employee will verify your data and then we will notify you.
          </h2>
          <p className="font-body text-xs sm:text-sm text-white/70 max-w-xl mx-auto leading-relaxed">
            Our management team reviews all event organizer applications and credentials. You will be notified via SMS and email as soon as your account is approved and activated.
          </p>
        </div>

        {/* Verification Pipeline */}
        <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-5 backdrop-blur-sm">
          <h3 className="font-headline text-base text-white font-bold tracking-tight">
            Verification Pipeline
          </h3>
          <div className="space-y-3.5">
            {/* Step 1: Completed */}
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-headline text-sm font-bold text-white">1. Phone OTP Verification</span>
                  <span className="text-[9px] uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">Completed</span>
                </div>
                <p className="text-xs text-white/60">Phone number verified and registration data securely submitted to admin.</p>
              </div>
            </div>

            {/* Step 2: Under Review */}
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 shadow-inner">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-headline text-sm font-bold text-white">2. Staff Data & ID Review</span>
                  <span className="text-[9px] uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300">Under Review</span>
                </div>
                <p className="text-xs text-amber-200/90 font-medium">Our employee will verify your data and then we will notify you.</p>
              </div>
            </div>

            {/* Step 3: Locked */}
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 opacity-50">
              <div className="w-8 h-8 rounded-full bg-white/10 text-white/40 flex items-center justify-center shrink-0 mt-0.5">
                <Lock className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-headline text-sm font-bold text-white">3. Live Ticket Sales & Dashboard Activation</span>
                  <span className="text-[9px] uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full bg-white/10 text-white/40">Locked</span>
                </div>
                <p className="text-xs text-white/50">Ticket creation, Stripe Connect bank payouts, and door check-in scanner will unlock immediately upon approval.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Submitted Details Summary */}
        <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-headline text-base text-white font-bold">Application Details</h3>
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full">
              Status: {promoterStatus === "rejected" ? "Rejected" : "Pending Staff Verification"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-white/40 uppercase tracking-wider text-[10px]">Organizer / Brand</span>
              <p className="text-white font-bold text-sm">{user?.companyName || "Independent Promoter"}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-white/40 uppercase tracking-wider text-[10px]">Contact Name</span>
              <p className="text-white font-bold text-sm">{user?.name || "N/A"}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-white/40 uppercase tracking-wider text-[10px]">Email Address</span>
              <p className="text-white font-bold text-sm">{user?.email || "N/A"}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-white/40 uppercase tracking-wider text-[10px]">Phone Number</span>
              <p className="text-white font-bold text-sm">{user?.phone || "Verified"}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/50">
            <span>Need organizer assistance or expedited onboarding?</span>
            <a
              href="mailto:events@tropica.nyc"
              className="text-[#C8A96A] hover:underline font-bold"
            >
              Contact Support: events@tropica.nyc
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Active Approved Promoter Command Center
  return (
    <div className="p-6 md:p-10 space-y-8 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-[#C8A96A] block">
            Promoter Command Center
          </span>
          <h1 className="text-3xl md:text-4xl font-headline italic text-white">Event & Ticket Sales</h1>
          <p className="text-xs text-white/60">
            Track gross ticket revenue, door check-ins, and Stripe Connect payouts.
          </p>
        </div>

        <Link
          href="/promoter/events/new"
          className="inline-flex items-center gap-2 bg-[#C8A96A] hover:bg-[#d8b97a] text-[#070B09] px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(200,169,106,0.3)] self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create New Event
        </Link>
      </div>

      {/* Stripe Connect Notice for Approved Promoters */}
      {(!stats?.stripeConnectOnboarded || !stats?.chargesEnabled) && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-white">Stripe Connect Payout Account Required</h3>
              <p className="text-xs text-white/70">
                To collect direct ticket payouts into your bank account, securely link your Stripe account.
              </p>
            </div>
          </div>
          <Link
            href="/promoter/payouts"
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shrink-0 cursor-pointer"
          >
            Connect Stripe <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {stats?.stripeConnectOnboarded && stats?.chargesEnabled && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 px-4 flex items-center justify-between text-xs text-emerald-400">
          <span className="flex items-center gap-2 font-medium">
            <ShieldCheck className="w-4 h-4" /> Stripe Connect verified & ready for automatic ticket payouts
          </span>
          <Link href="/promoter/payouts" className="hover:underline flex items-center gap-1 font-semibold">
            View Payouts <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-white/50 text-xs">
            <span>Tickets Sold</span>
            <Ticket className="w-4 h-4 text-[#C8A96A]" />
          </div>
          <div className="text-2xl font-bold text-white">{stats?.totalTicketsSold || 0}</div>
          <p className="text-[11px] text-white/50">Across {stats?.totalEvents || 0} event(s)</p>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-white/50 text-xs">
            <span>Gross Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">${(stats?.grossRevenue || 0).toLocaleString()}</div>
          <p className="text-[11px] text-white/50">Total sales volume</p>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-white/50 text-xs">
            <span>Platform Fees</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">${(stats?.platformFees || 0).toLocaleString()}</div>
          <p className="text-[11px] text-white/50">Tropica service fee</p>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-white/50 text-xs">
            <span>Net Earnings</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-headline">${(stats?.netEarnings || 0).toLocaleString()}</div>
          <p className="text-[11px] text-white/50">Eligible promoter payout</p>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-white/50 text-xs">
            <span>Door Check-Ins</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">{stats?.checkInCount || 0}</div>
          <p className="text-[11px] text-white/50">Verified admissions</p>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-headline text-xl text-white">Your Events</h2>
          <span className="text-xs text-white/50">
            {events.length} Total · <span className="text-emerald-400">{verifiedEventsCount} Verified</span>
            {pendingEventsCount > 0 && <> · <span className="text-amber-300">{pendingEventsCount} Pending</span></>}
          </span>
        </div>

        {events.length === 0 ? (
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-12 text-center space-y-3">
            <Ticket className="w-8 h-8 text-white/30 mx-auto" />
            <h3 className="font-bold text-white text-sm">No Events Created Yet</h3>
            <p className="text-xs text-white/50 max-w-sm mx-auto">
              Create your first event to start selling tickets and tracking attendees at Tropica NYC or external venues.
            </p>
            <Link
              href="/promoter/events/new"
              className="inline-flex items-center gap-2 bg-[#C8A96A] text-[#070B09] px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all mt-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Create Event
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map((evt) => (
              <div
                key={evt._id}
                className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden hover:border-[#C8A96A]/40 transition-all flex flex-col"
              >
                {evt.flyerUrl ? (
                  <div className="h-44 w-full relative overflow-hidden bg-black/40">
                    <img src={evt.flyerUrl} alt={evt.title} className="w-full h-full object-cover" />
                    <span
                      className={`absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full backdrop-blur-md ${statusBadgeClass(evt.status, true)}`}
                    >
                      {statusLabel(evt.status)}
                    </span>
                  </div>
                ) : (
                  <div className="h-28 w-full bg-gradient-to-br from-[#0F3D2E] to-[#0A1F18] p-4 flex items-center justify-between">
                    <span className="font-headline text-lg italic text-[#C8A96A] truncate max-w-[200px]">
                      {evt.title}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusBadgeClass(evt.status, false)}`}
                    >
                      {statusLabel(evt.status)}
                    </span>
                  </div>
                )}

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-bold text-white text-base leading-snug">{evt.title}</h3>
                    <div className="text-xs text-white/60 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#C8A96A]" />
                        <span>{new Date(evt.date).toLocaleDateString()}</span>
                        <Clock className="w-3.5 h-3.5 text-[#C8A96A] ml-2" />
                        <span>{evt.startTime} - {evt.endTime}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-[#C8A96A]" />
                        <span className="truncate">{evt.venueName}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Metrics */}
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/5 text-center text-xs">
                    <div>
                      <div className="text-white/40 text-[10px] uppercase">Sold</div>
                      <div className="font-bold text-white">{evt.totalTicketsSold}</div>
                    </div>
                    <div>
                      <div className="text-white/40 text-[10px] uppercase">Gross</div>
                      <div className="font-bold text-emerald-400">${evt.grossRevenue}</div>
                    </div>
                    <div>
                      <div className="text-white/40 text-[10px] uppercase">Door</div>
                      <div className="font-bold text-blue-400">{evt.checkInCount}</div>
                    </div>
                  </div>

                  {/* Actions & Public Sharing */}
                  <div className="pt-2 space-y-2">
                    {evt.status === "draft" && (
                      <button
                        onClick={() => handleRequestApproval(evt._id)}
                        className="w-full py-2.5 bg-[#C8A96A]/20 hover:bg-[#C8A96A] text-[#C8A96A] hover:text-black rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                      >
                        Submit for Verification
                      </button>
                    )}

                    {evt.status === "pending_approval" && (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 font-bold">
                          <Clock className="w-3.5 h-3.5 animate-pulse" />
                          <span>Under Staff Verification</span>
                        </div>
                        <p className="text-[11px] text-amber-200/70">
                          Our employee will verify your event before publication. Once verified, your public ticket link will be generated here.
                        </p>
                      </div>
                    )}

                    {evt.status === "cancelled" && (
                      <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs space-y-2">
                        <div className="font-bold">Not approved by Tropica staff</div>
                        {evt.rejectionReason && (
                          <p className="text-[11px] text-red-200/80">Reason: {evt.rejectionReason}</p>
                        )}
                        <button
                          onClick={() => handleRequestApproval(evt._id)}
                          className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                        >
                          Resubmit for Verification
                        </button>
                      </div>
                    )}

                    {evt.status === "published" && (
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2.5">
                        <div className="flex items-center gap-1.5 text-emerald-300 text-xs font-bold">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Verified &amp; live for ticket sales</span>
                        </div>
                        {(evt.approvedAt || (typeof evt.approvedBy === "object" && evt.approvedBy?.name)) && (
                          <p className="text-[10px] text-emerald-200/70">
                            Verified
                            {typeof evt.approvedBy === "object" && evt.approvedBy?.name ? ` by ${evt.approvedBy.name}` : ""}
                            {evt.approvedAt ? ` on ${new Date(evt.approvedAt).toLocaleDateString()}` : ""}
                          </p>
                        )}

                        {/* Public share link */}
                        <input
                          readOnly
                          value={getPublicEventUrl(evt.slug)}
                          onFocus={(e) => e.currentTarget.select()}
                          aria-label="Public event link"
                          className="w-full bg-black/30 border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-white/80 font-mono truncate focus:outline-none focus:border-[#C8A96A]/60"
                        />

                        <button
                          onClick={() => setBookingsEvent({ id: evt._id, title: evt.title })}
                          className="w-full py-2.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>View Bookings ({evt.totalTicketsSold} sold)</span>
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => shareEvent(evt)}
                            className="flex-1 py-2.5 bg-gradient-to-r from-[#C8A96A] via-[#E8CB8A] to-[#C8A96A] text-[#070B09] rounded-xl text-xs font-bold uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-md shadow-[#C8A96A]/20 flex items-center justify-center gap-1.5 cursor-pointer"
                            title="Share Public Link"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            <span>Share Link</span>
                          </button>
                          <button
                            onClick={() => copyPublicEventLink(evt.slug)}
                            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all flex items-center justify-center cursor-pointer"
                            title="Copy Link"
                            aria-label="Copy public link"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <Link
                            href={`/events/${evt.slug}`}
                            target="_blank"
                            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all flex items-center justify-center cursor-pointer"
                            title="Open Public Event Page"
                            aria-label="Open public event page"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <EventBookingsModal
        eventId={bookingsEvent?.id ?? null}
        eventTitle={bookingsEvent?.title}
        onClose={() => setBookingsEvent(null)}
      />
    </div>
  );
}
