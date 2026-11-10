"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  Hourglass,
  Loader2,
  MapPin,
  ShieldCheck,
  Smartphone,
  Ticket,
  User as UserIcon,
  X
} from "lucide-react";
import api from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/authStore";
import { NavBar } from "@/components/shared/NavBar";

/** Server error message from an axios error, or a fallback. */
const apiMessage = (err: unknown, fallback: string): string =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;

const LiveTicketQr = dynamic(() => import("@/components/shared/LiveTicketQr"), { ssr: false });

interface MySeat {
  _id: string;
  ticketCode: string;
  tierName: string;
  holderStatus: "pending" | "accepted";
  holderName: string;
  checkedIn: boolean;
}

interface ShareInvite {
  buyerName: string;
  event: {
    title: string;
    slug: string;
    date: string;
    startTime: string;
    endTime: string;
    venueName: string;
    venueAddress: string;
    flyerUrl?: string;
  };
  seatsTotal: number;
  seatsOpen: number;
  seatsPending: number;
  seatsAccepted: number;
  claimOpen: boolean;
  isBuyer: boolean;
  wasRejected: boolean;
  guestCancelDeadline?: string;
  mySeat: MySeat | null;
}

const COUNTRIES = [
  { id: "US", code: "+1", flag: "🇺🇸", digits: 10 },
  { id: "CA", code: "+1", flag: "🇨🇦", digits: 10 },
  { id: "IN", code: "+91", flag: "🇮🇳", digits: 10 }
] as const;
const OTP_LENGTH = 4;
type Step = "phone" | "otp" | "name";

const realName = (n?: string) => (n && n !== "Guest User" ? n : "");

export default function TicketSharePage() {
  const params = useParams();
  const token = String(params?.token || "");
  const { sendOTP, verifyOTP } = useAuth();
  const authUser = useAuthStore((s) => s.user);

  const [invite, setInvite] = useState<ShareInvite | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState<Step>("phone");
  const [countryId, setCountryId] = useState<(typeof COUNTRIES)[number]["id"]>("US");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const autoOpened = useRef(false);

  const country = COUNTRIES.find((c) => c.id === countryId)!;
  const fullPhone = `${country.code}${phone.replace(/\D/g, "")}`;

  /** fetch (not axios) so an expired login doesn't bounce an anonymous guest to /login. */
  const load = useCallback(async () => {
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || "/api";
      const t = Cookies.get("token");
      const res = await fetch(`${base}/tickets/share/${token}`, { headers: t ? { Authorization: `Bearer ${t}` } : {} });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Invalid invite link");
      setInvite(data.invite);
      return data.invite as ShareInvite;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not load this invite");
      return null;
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    void load().then((inv) => {
      if (inv && !inv.mySeat && !inv.isBuyer && inv.claimOpen && inv.seatsOpen > 0 && !autoOpened.current && !Cookies.get("token")) {
        autoOpened.current = true;
        setModalOpen(true);
      }
    });
  }, [token, load]);

  // While waiting for the buyer, check back every 20s so the ticket appears on its own
  useEffect(() => {
    if (invite?.mySeat?.holderStatus !== "pending") return;
    const id = setInterval(() => void load(), 20000);
    return () => clearInterval(id);
  }, [invite?.mySeat?.holderStatus, load]);

  const openClaim = () => {
    setFormError(null);
    const signedIn = !!Cookies.get("token") && authUser?.isPhoneVerified !== false && !!authUser?.phone;
    setName(realName(authUser?.name));
    setStep(signedIn ? "name" : "phone");
    setModalOpen(true);
  };

  const claim = async (guestName: string) => {
    setBusy(true);
    setFormError(null);
    try {
      const { data } = await api.post(`/tickets/share/${token}/claim`, { name: guestName.trim() });
      setModalOpen(false);
      toast.success(data.alreadyClaimed ? "You already requested a ticket" : "Request sent!");
      await load();
    } catch (err: unknown) {
      const res = (err as { response?: { data?: { code?: string; message?: string } } }).response?.data;
      if (res?.code === "PHONE_VERIFICATION_REQUIRED" || res?.code === "LOGIN_REQUIRED") setStep("phone");
      else if (res?.code === "NAME_REQUIRED") setStep("name");
      setFormError(res?.message || "Could not request a ticket. Please try again.");
      if (res?.code === "NO_SEATS" || res?.code === "REJECTED" || res?.code === "IS_BUYER") void load();
    } finally {
      setBusy(false);
    }
  };

  const cancelSeat = async () => {
    if (!invite?.mySeat) return;
    const pending = invite.mySeat.holderStatus === "pending";
    if (!window.confirm(pending ? "Withdraw your request?" : `Give your ticket back to ${invite.buyerName}? This can't be undone.`)) return;
    setCancelling(true);
    try {
      const { data } = await api.post(`/tickets/seats/${invite.mySeat._id}/cancel`);
      toast.success(data.message || "Cancelled");
      await load();
    } catch (err: unknown) {
      toast.error(apiMessage(err, "Could not cancel"));
    } finally {
      setCancelling(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (phone.replace(/\D/g, "").length !== country.digits) {
      setFormError(`Enter a valid ${country.digits}-digit mobile number`);
      return;
    }
    setBusy(true);
    try {
      await sendOTP(fullPhone);
      setOtp("");
      setStep("otp");
      toast.success("Code sent");
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Could not send the code");
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async (code: string) => {
    setBusy(true);
    setFormError(null);
    try {
      const data = await verifyOTP(fullPhone, code);
      const existing = realName(data?.user?.name);
      setName(existing);
      setStep("name"); // always confirm the name the buyer and door staff will see
      // Already on this order? show it instead of asking again
      const inv = await load();
      if (inv?.mySeat || inv?.isBuyer) setModalOpen(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Invalid or expired code");
      setOtp("");
    } finally {
      setBusy(false);
    }
  };

  /* ───────── render ───────── */

  if (error) {
    return (
      <div className="min-h-screen bg-[#070B09] text-white">
        <NavBar />
        <div className="min-h-screen flex flex-col items-center justify-center gap-3 p-6 text-center">
          <AlertCircle className="w-10 h-10 text-amber-300" />
          <h1 className="text-xl font-bold">Invite unavailable</h1>
          <p className="text-sm text-white/60 max-w-sm">{error}</p>
          <Link href="/" className="text-xs text-[#C8A96A] underline">
            Go to Tropica NYC
          </Link>
        </div>
      </div>
    );
  }

  if (!invite) {
    return (
      <div className="min-h-screen bg-[#070B09] flex items-center justify-center">
        <NavBar />
        <Loader2 className="w-8 h-8 animate-spin text-[#C8A96A]" />
      </div>
    );
  }

  const { event, mySeat } = invite;
  const dateLabel = new Date(event.date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  });
  const deadline = invite.guestCancelDeadline ? new Date(invite.guestCancelDeadline) : null;
  const canGiveBack = mySeat?.holderStatus === "accepted" && !mySeat.checkedIn && !!deadline && Date.now() <= deadline.getTime();
  const full = invite.seatsOpen === 0;

  return (
    <div className="min-h-screen bg-[#070B09] text-white">
      <NavBar />
      <div className="pt-28 md:pt-32 pb-12 px-4">
        <div className="max-w-md mx-auto space-y-6">
          {/* Invite card */}
          <div className="rounded-3xl border border-[#C8A96A]/30 bg-gradient-to-b from-[#141F1A] to-[#0A100D] overflow-hidden shadow-2xl">
            {event.flyerUrl && <img src={event.flyerUrl} alt="" className="w-full h-44 object-cover opacity-85" />}
            <div className="p-6 text-center space-y-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-[#C8A96A] font-bold">
                  {invite.buyerName} has a ticket for you
                </p>
                <h1 className="text-2xl font-headline italic mt-1">{event.title}</h1>
              </div>
              <div className="text-left rounded-2xl bg-white/[0.03] border border-white/10 p-4 space-y-2 text-sm">
                <p className="flex items-center gap-2.5">
                  <CalendarDays className="w-4 h-4 text-[#C8A96A]" /> {dateLabel}
                </p>
                <p className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-[#C8A96A]" /> {event.startTime} – {event.endTime}
                </p>
                <p className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#C8A96A] mt-0.5" />
                  <span>
                    {event.venueName}
                    <span className="block text-xs text-white/50">{event.venueAddress}</span>
                  </span>
                </p>
                <p className="flex items-center gap-2.5 text-white/60 text-xs">
                  <Ticket className="w-4 h-4 text-[#C8A96A]" />
                  {full ? "All tickets have been claimed" : `${invite.seatsOpen} of ${invite.seatsTotal} tickets still available`}
                </p>
              </div>

              {invite.isBuyer && (
                <p className="text-xs text-white/60">
                  These are your tickets! Send this link to your friends and accept them from{" "}
                  <Link href="/user/tickets" className="text-[#C8A96A] underline">
                    My Event Tickets
                  </Link>
                  .
                </p>
              )}

              {!mySeat && !invite.isBuyer && (
                <>
                  {invite.wasRejected ? (
                    <p className="text-sm text-rose-300">{invite.buyerName} declined your request for this event.</p>
                  ) : !invite.claimOpen ? (
                    <p className="text-sm text-white/60">This event has ended or was cancelled.</p>
                  ) : (
                    <button
                      onClick={openClaim}
                      disabled={full}
                      className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-[#C8A96A] via-[#E0C68E] to-[#C8A96A] text-[#0a120e] text-xs font-black uppercase tracking-[0.15em] disabled:opacity-40 cursor-pointer"
                    >
                      {full ? "No tickets left" : "Claim my ticket"} {!full && <ArrowRight className="w-4 h-4" />}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* My seat */}
          {mySeat && (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-center space-y-4">
              {mySeat.holderStatus === "pending" ? (
                <>
                  <Hourglass className="w-9 h-9 mx-auto text-amber-300" />
                  <p className="text-sm font-bold">Waiting for {invite.buyerName}</p>
                  <p className="text-xs text-white/60">
                    Your request was sent. Once {invite.buyerName} accepts, your ticket appears here and in{" "}
                    <Link href="/user/tickets" className="text-[#C8A96A] underline">
                      My Event Tickets
                    </Link>
                    .
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-bold inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> You&apos;re in, {realName(mySeat.holderName).split(" ")[0] || "friend"}!
                  </p>
                  <LiveTicketQr ticketId={mySeat._id} size={210} />
                  <p className="font-mono text-sm text-[#C8A96A]">{mySeat.ticketCode}</p>
                  <p className="text-xs text-white/55">{mySeat.tierName} · Show this live QR at the door.</p>
                </>
              )}

              {(mySeat.holderStatus === "pending" || canGiveBack) && (
                <button
                  onClick={cancelSeat}
                  disabled={cancelling}
                  className="text-[11px] text-rose-300 hover:text-rose-200 underline underline-offset-2 cursor-pointer disabled:opacity-50"
                >
                  {cancelling ? "Cancelling…" : mySeat.holderStatus === "pending" ? "Withdraw request" : "Cancel my ticket"}
                </button>
              )}
              {canGiveBack && deadline && (
                <p className="text-[10px] text-white/40">
                  You can cancel until {deadline.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Claim popup: phone OTP → name */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label="Claim your ticket"
          onClick={() => !busy && setModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-3xl border border-[#C8A96A]/30 bg-[#0c1612] p-6 space-y-5 shadow-2xl"
          >
            <button
              onClick={() => setModalOpen(false)}
              disabled={busy}
              aria-label="Close"
              className="absolute top-3 right-3 p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-center space-y-1">
              <p className="text-[10px] uppercase tracking-[0.25em] text-[#C8A96A] font-bold">{event.title}</p>
              <h2 className="text-xl font-bold">
                {step === "phone" ? "Verify your phone" : step === "otp" ? "Enter the code" : "What's your name?"}
              </h2>
              <p className="text-xs text-white/55">
                {step === "phone"
                  ? "We'll text you a 4-digit code. Your ticket will be linked to this number."
                  : step === "otp"
                  ? `Sent to ${country.flag} ${country.code} ${phone}`
                  : `${invite.buyerName} and the door staff will see this name.`}
              </p>
            </div>

            {formError && (
              <p className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2 flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {formError}
              </p>
            )}

            {step === "phone" && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="flex gap-2">
                  {COUNTRIES.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCountryId(c.id)}
                      className={`flex-1 rounded-xl border py-2 text-xs font-bold cursor-pointer ${
                        countryId === c.id ? "border-[#C8A96A] bg-[#C8A96A]/10" : "border-white/10 text-white/60"
                      }`}
                    >
                      {c.flag} {c.code}
                    </button>
                  ))}
                </div>
                <label className="flex items-center gap-2 rounded-xl bg-black/50 border border-white/15 focus-within:border-[#C8A96A] px-3">
                  <Smartphone className="w-4 h-4 text-white/40" />
                  <input
                    autoFocus
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^\d\s()-]/g, "").slice(0, 16))}
                    placeholder="Mobile number"
                    className="flex-1 bg-transparent py-3 text-base font-mono outline-none placeholder:text-white/25"
                  />
                </label>
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-3.5 rounded-xl bg-[#C8A96A] text-[#0a120e] text-xs font-black uppercase tracking-[0.15em] inline-flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />} Send code
                </button>
              </form>
            )}

            {step === "otp" && (
              <div className="space-y-4">
                <input
                  autoFocus
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={OTP_LENGTH}
                  value={otp}
                  disabled={busy}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH);
                    setOtp(v);
                    if (v.length === OTP_LENGTH) void handleVerify(v);
                  }}
                  placeholder="• • • •"
                  aria-label="Verification code"
                  className="w-full text-center tracking-[0.6em] font-mono text-3xl font-black rounded-xl bg-black/50 border border-white/15 focus:border-[#C8A96A] py-3 outline-none"
                />
                <div className="flex justify-between text-xs text-white/55">
                  <button type="button" onClick={() => setStep("phone")} className="hover:text-white cursor-pointer">
                    ← Change number
                  </button>
                  {busy && <Loader2 className="w-4 h-4 animate-spin text-[#C8A96A]" />}
                </div>
              </div>
            )}

            {step === "name" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (name.trim().length < 2) return setFormError("Please enter your full name");
                  void claim(name);
                }}
                className="space-y-4"
              >
                <label className="flex items-center gap-2 rounded-xl bg-black/50 border border-white/15 focus-within:border-[#C8A96A] px-3">
                  <UserIcon className="w-4 h-4 text-white/40" />
                  <input
                    autoFocus
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name"
                    className="flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-white/25"
                  />
                </label>
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#C8A96A] via-[#E0C68E] to-[#C8A96A] text-[#0a120e] text-xs font-black uppercase tracking-[0.15em] inline-flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Request ticket
                </button>
              </form>
            )}

            <p className="text-[10px] text-center text-white/35 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Your number is only shared with {invite.buyerName} and door staff.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
