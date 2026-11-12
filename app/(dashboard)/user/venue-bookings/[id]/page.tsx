"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios";
import { ShareInviteModal } from "@/components/booking/ShareInviteModal";
import { formatTimeTo12Hour, toCurrentSiteUrl } from "@/lib/utils";
import toast, { Toaster } from "react-hot-toast";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  Users,
  Calendar,
  Clock,
  Copy,
  Check,
  Share2,
  MessageCircle,
  Mail,
  Smartphone,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Loader2,
  UserCheck,
  QrCode,
  UserMinus,
  Undo2
} from "lucide-react";

interface GuestPass {
  _id: string;
  guestName: string;
  guestEmail?: string;
  guestPhone: string;
  passCode: string;
  qrCodeToken: string;
  status: "approved" | "pending_approval" | "rejected" | "cancelled" | "removed";
  checkedIn: boolean;
  checkedInAt?: string;
  createdAt: string;
}

interface AttendanceData {
  inviteLink: string;
  invitesActive?: boolean;
  event?: { date: string; startTime: string; endTime?: string; occasion: string; hostName: string };
  invitationToken: string;
  requireHostApproval: boolean;
  capacityLimit: number;
  totalRegistered: number;
  approvedCount: number;
  checkedInCount: number;
  guests: GuestPass[];
}

export default function BookingGuestsPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AttendanceData | null>(null);
  const [copied, setCopied] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<GuestPass | null>(null);
  const [shareNote, setShareNote] = useState<string | undefined>(undefined);

  // After payment we land here with ?share=1 (or ?share=zelle) → open the share popup
  useEffect(() => {
    const share = new URLSearchParams(window.location.search).get("share");
    if (share) {
      setShareOpen(true);
      if (share === "zelle") setShareNote("Your Zelle payment is being verified. You can already invite guests.");
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  const fetchGuests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/invitations/booking/${bookingId}/guests`);
      if (res.data.success) {
        setData({ ...res.data, inviteLink: toCurrentSiteUrl(res.data.inviteLink) });
      } else {
        toast.error(res.data.message || "Failed to load guest passes");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Could not load guest passes");
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    if (bookingId) fetchGuests();
  }, [bookingId, fetchGuests]);

  const handleCopyLink = () => {
    if (!data?.inviteLink) return;
    navigator.clipboard.writeText(data.inviteLink);
    setCopied(true);
    toast.success("Invitation link copied!");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleStatusUpdate = async (passId: string, status: "approved" | "rejected") => {
    setUpdatingId(passId);
    try {
      const res = await api.patch(`/invitations/passes/${passId}/status`, { status });
      if (res.data.success) {
        toast.success(`Guest ${status === "approved" ? "approved" : "rejected"}`);
        await fetchGuests();
      } else {
        toast.error(res.data.message || "Update failed");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update pass status");
    } finally {
      setUpdatingId(null);
    }
  };

  /** Host takes a guest off the list: their QR stops working and the spot opens up. */
  const handleRemove = async () => {
    if (!removeTarget) return;
    const guest = removeTarget;
    setRemoveTarget(null);
    setUpdatingId(guest._id);
    try {
      const res = await api.delete(`/invitations/passes/${guest._id}`);
      toast.success(res.data.message || `${guest.guestName} was removed`);
      await fetchGuests();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Could not remove this guest");
      await fetchGuests();
    } finally {
      setUpdatingId(null);
    }
  };

  const handleNativeShare = async () => {
    if (!data?.inviteLink) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Tropica NYC Private Event Invitation",
          text: "You're invited to my private event at Tropica NYC! Register for your admission pass:",
          url: data.inviteLink,
        });
      } catch {
        // User cancelled or unsupported
      }
    } else {
      handleCopyLink();
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#C8A96A] animate-spin" />
      </div>
    );
  }

  const spotsRemaining = Math.max(0, (data?.capacityLimit || 0) - (data?.approvedCount || 0));

  return (
    <div className="space-y-6 animate-fade-in p-4 sm:p-6 max-w-6xl mx-auto">
      <Toaster position="top-center" />
      <ConfirmDialog
        open={!!removeTarget}
        title={`Remove ${removeTarget?.guestName || "this guest"}?`}
        message={
          removeTarget?.checkedIn
            ? "This guest has already checked in at the door. Removing them takes them off your guest list, voids their QR pass so it can't be used again, and opens their spot. Our staff aren't notified automatically, so let the door team know if they need to leave."
            : "They'll be taken off your guest list and their QR door pass will stop working right away. Their spot opens up for someone else, and they won't be able to rejoin from your invite link unless you add them back."
        }
        confirmLabel="Remove guest"
        cancelLabel="Keep"
        variant="danger"
        onConfirm={handleRemove}
        onCancel={() => setRemoveTarget(null)}
      />

      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/user/celebrations")}
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Celebrations</span>
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C8A96A]">
            Event Host Dashboard
          </span>
          <h1 className="font-headline italic text-3xl sm:text-4xl text-white">
            Guest List &amp; Invitations
          </h1>
          {data?.event && (
            <p className="text-sm text-[#E0C68E] mt-1 capitalize">
              {data.event.occasion.replace(/_/g, " ")} ·{" "}
              {new Date(data.event.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })} ·{" "}
              {formatTimeTo12Hour(data.event.startTime)}
            </p>
          )}
          <p className="text-white/60 text-sm mt-1">
            Share your unique invite link with friends. Only approved guests receive valid door QR passes.
          </p>
        </div>
        {data?.inviteLink && data.invitesActive !== false && (
          <button
            onClick={() => setShareOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#C8A96A] hover:bg-[#d8b97a] text-[#0d1612] text-xs font-black uppercase tracking-wider shrink-0 cursor-pointer"
          >
            <QrCode className="w-4 h-4" /> Share invite QR
          </button>
        )}
      </div>

      {data?.invitesActive === false && (
        <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-xs text-amber-200">
          Invitations open once your deposit is paid (or your Zelle screenshot is submitted).
        </div>
      )}

      <ShareInviteModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        inviteLink={data?.inviteLink || ""}
        hostName={data?.event?.hostName}
        occasion={data?.event?.occasion}
        dateLabel={
          data?.event
            ? new Date(data.event.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" })
            : undefined
        }
        note={shareNote}
      />

      {/* Key Metric Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 space-y-1">
          <p className="text-xs uppercase tracking-widest text-white/50 font-bold">Paid Capacity</p>
          <p className="font-headline text-3xl text-white font-bold">{data?.capacityLimit || 0}</p>
          <p className="text-[11px] text-white/40">Max admission passes</p>
        </div>

        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 space-y-1">
          <p className="text-xs uppercase tracking-widest text-[#C8A96A] font-bold">Approved Passes</p>
          <p className="font-headline text-3xl text-[#E3C281] font-bold">{data?.approvedCount || 0}</p>
          <p className="text-[11px] text-white/40">Of {data?.capacityLimit || 0} allowed</p>
        </div>

        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 space-y-1">
          <p className="text-xs uppercase tracking-widest text-emerald-400 font-bold">Spots Remaining</p>
          <p className="font-headline text-3xl text-emerald-400 font-bold">{spotsRemaining}</p>
          <p className="text-[11px] text-white/40">Available to invite</p>
        </div>

        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 space-y-1">
          <p className="text-xs uppercase tracking-widest text-blue-400 font-bold">Door Check-Ins</p>
          <p className="font-headline text-3xl text-blue-400 font-bold">{data?.checkedInCount || 0}</p>
          <p className="text-[11px] text-white/40">Scanned at Tropica</p>
        </div>
      </div>

      {/* Invitation Link & Sharing Section */}
      <div className="rounded-2xl border border-[#C8A96A]/30 bg-gradient-to-r from-[#C8A96A]/10 via-[#C8A96A]/5 to-transparent p-6 space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Share2 className="w-5 h-5 text-[#C8A96A]" />
              Your Private Event Invitation Link
            </h3>
            <p className="text-xs text-white/60 mt-0.5">
              Send this link to your guests. They can RSVP directly on mobile and receive their admission pass.
            </p>
          </div>
          {spotsRemaining === 0 && (
            <span className="text-xs px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold self-start md:self-auto">
              Capacity Full ({data?.capacityLimit})
            </span>
          )}
        </div>

        {/* Link Input + Copy Button */}
        <div className="flex flex-col sm:flex-row items-stretch gap-2">
          <input
            type="text"
            readOnly
            value={data?.inviteLink || ""}
            className="flex-1 bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-sm text-white font-mono select-all focus:outline-none focus:border-[#C8A96A]"
          />
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#C8A96A] text-[#0d1612] font-black text-xs uppercase tracking-wider rounded-xl hover:bg-[#d8b97a] transition-all shrink-0 cursor-pointer shadow-lg"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? "Copied!" : "Copy Link"}</span>
          </button>
        </div>

        {/* Social Share Buttons */}
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-white/10">
          <span className="text-xs text-white/50 uppercase font-bold tracking-wider mr-2">Share via:</span>

          {/* WhatsApp */}
          <a
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`You're invited to my private event at Tropica NYC! RSVP for your guest pass here: ${data?.inviteLink}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-600/30 text-xs font-semibold transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </a>

          {/* SMS */}
          <a
            href={`sms:?&body=${encodeURIComponent(`You're invited to my private event at Tropica NYC! Register for your pass: ${data?.inviteLink}`)}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-300 hover:bg-blue-600/30 text-xs font-semibold transition-colors"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>SMS</span>
          </a>

          {/* Email */}
          <a
            href={`mailto:?subject=${encodeURIComponent("Invitation: Private Event at Tropica NYC")}&body=${encodeURIComponent(`Hi,\n\nYou're invited to join my private event at Tropica NYC!\n\nPlease register here for your QR admission pass:\n${data?.inviteLink}\n\nSee you there!`)}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/20 border border-purple-500/30 text-purple-300 hover:bg-purple-600/30 text-xs font-semibold transition-colors"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email</span>
          </a>

          {/* Native Share */}
          <button
            onClick={handleNativeShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 text-xs font-semibold transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>More Options</span>
          </button>
        </div>
      </div>

      {/* Guest Attendance List */}
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-white/10 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-bold text-lg text-white">Registered Guests ({data?.guests.length || 0})</h3>
            <p className="text-xs text-white/50">
              {data?.requireHostApproval ? "Host approval required before issuing QR passes" : "Instant QR passes enabled upon RSVP"}
            </p>
          </div>
          <button
            onClick={fetchGuests}
            className="text-xs text-[#C8A96A] hover:underline cursor-pointer"
          >
            ↻ Refresh List
          </button>
        </div>

        {!data?.guests || data.guests.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Users className="w-12 h-12 text-white/20 mx-auto" />
            <p className="text-white font-semibold">No guests have registered yet</p>
            <p className="text-xs text-white/50 max-w-sm mx-auto">
              Copy your invitation link above and send it to your guests so they can register and receive their door passes.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.02] border-b border-white/10 text-white/50 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Guest Name</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Pass Code</th>
                  <th className="py-3 px-4">Pass Status</th>
                  <th className="py-3 px-4">Door Check-In</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/80">
                {data.guests.map((guest) => (
                  <tr key={guest._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {guest.guestName}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-white/60">
                      <div>{guest.guestPhone}</div>
                      {guest.guestEmail && <div className="text-[10px] text-white/40">{guest.guestEmail}</div>}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#C8A96A]">
                      {guest.passCode}
                    </td>
                    <td className="py-3.5 px-4">
                      {guest.status === "approved" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" /> Approved
                        </span>
                      ) : guest.status === "pending_approval" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          <Clock className="w-3 h-3" /> Pending Host
                        </span>
                      ) : guest.status === "removed" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white/60 border border-white/15">
                          <UserMinus className="w-3 h-3" /> Removed
                        </span>
                      ) : guest.status === "cancelled" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white/60 border border-white/15">
                          <XCircle className="w-3 h-3" /> Not Attending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                          <XCircle className="w-3 h-3" /> Rejected
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {guest.checkedIn ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold text-[10px]">
                          ✓ Checked In {guest.checkedInAt ? new Date(guest.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                        </span>
                      ) : (
                        <span className="text-white/40 text-[11px]">— Not Checked In</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-3">
                      {guest.status === "pending_approval" && (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={updatingId === guest._id}
                            onClick={() => handleStatusUpdate(guest._id, "approved")}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] uppercase tracking-wider transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={updatingId === guest._id}
                            onClick={() => handleStatusUpdate(guest._id, "rejected")}
                            className="px-2 py-1 rounded border border-red-500/30 text-red-400 hover:bg-red-500/10 font-bold text-[10px] uppercase tracking-wider transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {guest.status === "approved" && (
                        <Link
                          href={`/invite/pass/${guest.qrCodeToken}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-[11px] text-[#C8A96A] hover:underline"
                        >
                          <QrCode className="w-3 h-3" />
                          <span>View QR</span>
                        </Link>
                      )}
                      {(guest.status === "approved" || guest.status === "pending_approval") && (
                        <button
                          type="button"
                          disabled={updatingId === guest._id}
                          onClick={() => setRemoveTarget(guest)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded border border-red-500/30 text-red-300 hover:bg-red-500/10 font-bold text-[10px] uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-40"
                          title="Remove from the guest list"
                        >
                          {updatingId === guest._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserMinus className="w-3 h-3" />} Remove
                        </button>
                      )}
                      {guest.status === "removed" && (
                        <button
                          type="button"
                          disabled={updatingId === guest._id}
                          onClick={() => handleStatusUpdate(guest._id, "approved")}
                          className="inline-flex items-center gap-1 text-[11px] text-[#C8A96A] hover:underline cursor-pointer disabled:opacity-40"
                          title="Put this guest back on the list with a new QR pass"
                        >
                          <Undo2 className="w-3 h-3" /> Add back
                        </button>
                      )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

