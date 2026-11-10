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
  Crown,
  Loader2,
  MapPin,
  PartyPopper,
  ShieldCheck,
  Smartphone,
  User as UserIcon,
  Users,
  X
} from "lucide-react";
import api from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/authStore";
import { NavBar } from "@/components/shared/NavBar";
import { formatTimeTo12Hour } from "@/lib/utils";

const QrCodeCard = dynamic(() => import("@/components/shared/QrCodeCard"), { ssr: false });

interface MyPass {
  passCode: string;
  qrCodeToken: string;
  status: "approved" | "pending_approval" | "rejected" | "cancelled";
  guestName: string;
  checkedIn: boolean;
  cancelDeadline?: string | null;
  canCancel?: boolean;
}

interface Invitation {
  hostName: string;
  occasion: string;
  date: string;
  startTime: string;
  endTime?: string;
  venueName: string;
  venueAddress: string;
  capacity: number;
  registered: number;
  spotsRemaining: number;
  isCapacityFull: boolean;
  requireHostApproval: boolean;
  isHost: boolean;
  myPass: MyPass | null;
}

const COUNTRIES = [
  { id: "US", code: "+1", flag: "🇺🇸", digits: 10 },
  { id: "CA", code: "+1", flag: "🇨🇦", digits: 10 },
  { id: "IN", code: "+91", flag: "🇮🇳", digits: 10 }
] as const;
const OTP_LENGTH = 4;
type Step = "phone" | "otp" | "name";

const realName = (n?: string) => (n && n !== "Guest User" ? n : "");

export default function InvitePage() {
  const params = useParams();
  const token = String(params?.token || "");
  const { sendOTP, verifyOTP } = useAuth();
  const authUser = useAuthStore((s) => s.user);

  const [invite, setInvite] = useState<Invitation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState<Step>("phone");
  const [countryId, setCountryId] = useState<(typeof COUNTRIES)[number]["id"]>("US");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [welcome, setWelcome] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const autoOpened = useRef(false);

  const country = COUNTRIES.find((c) => c.id === countryId)!;
  const fullPhone = `${country.code}${phone.replace(/\D/g, "")}`;

  /** Load the invite; with a login token the server also returns the viewer's own pass. */
  const load = useCallback(async () => {
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || "/api";
      const t = Cookies.get("token");
      const res = await fetch(`${base}/invitations/${token}`, { headers: t ? { Authorization: `Bearer ${t}` } : {} });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Invalid invitation link");
      setInvite(data.invitation);
      return data.invitation as Invitation;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not load this invitation");
      return null;
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    void load().then((inv) => {
      // Not signed in (or not on the list yet) → show the join popup right away
      if (inv && !inv.myPass && !inv.isHost && !inv.isCapacityFull && !autoOpened.current && !Cookies.get("token")) {
        autoOpened.current = true;
        setModalOpen(true);
      }
    });
  }, [token, load]);

  const openJoin = () => {
    setFormError(null);
    const signedIn = !!Cookies.get("token") && authUser?.isPhoneVerified !== false && !!authUser?.phone;
    setName(realName(authUser?.name));
    setStep(signedIn ? "name" : "phone");
    setModalOpen(true);
  };

  const rsvp = async (guestName: string) => {
    setBusy(true);
    setFormError(null);
    try {
      const { data } = await api.post(`/invitations/${token}/rsvp`, { name: guestName.trim() });
      setModalOpen(false);
      setWelcome(!data.alreadyRegistered);
      if (data.alreadyRegistered) toast.success("You're already on the guest list");
      await load();
    } catch (err: any) {
      const res = err.response?.data;
      if (res?.code === "PHONE_VERIFICATION_REQUIRED" || res?.code === "LOGIN_REQUIRED") setStep("phone");
      else if (res?.code === "NAME_REQUIRED") setStep("name");
      setFormError(res?.message || "Could not join the guest list. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  /** Guest says they're not attending; the spot opens up again for someone else. */
  const cancelSpot = async () => {
    setCancelling(true);
    try {
      const { data } = await api.post(`/invitations/${token}/cancel`);
      toast.success(data.message || "You're off the guest list");
      setConfirmCancel(false);
      setWelcome(false);
      await load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Could not cancel. Please try again.");
      await load();
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
      setBusy(false);
      if (existing) await rsvp(existing);
      else setStep("name");
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Invalid or expired code");
      setOtp("");
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
          <h1 className="text-xl font-bold">Invitation unavailable</h1>
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

  const occasion = invite.occasion.replace(/_/g, " ");
  const dateLabel = new Date(invite.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
  const pass = invite.myPass;
  const isCancelled = pass?.status === "cancelled";
  const cancelByLabel = pass?.cancelDeadline
    ? new Date(pass.cancelDeadline).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
    : "";

  return (
    <div className="min-h-screen bg-[#070B09] text-white">
      <NavBar />
      <div className="pt-28 md:pt-32 pb-12 px-4">
        <div className="max-w-md mx-auto space-y-6">
          {/* Invitation card */}
          <div className="rounded-3xl border border-[#C8A96A]/30 bg-gradient-to-b from-[#141F1A] to-[#0A100D] p-6 text-center space-y-4 shadow-2xl">
            <PartyPopper className="w-10 h-10 mx-auto text-[#C8A96A]" />
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#C8A96A] font-bold">You&apos;re invited</p>
              <h1 className="text-3xl font-headline italic capitalize mt-1">
                {invite.hostName}&apos;s {occasion}
              </h1>
            </div>
            <div className="text-left rounded-2xl bg-white/[0.03] border border-white/10 p-4 space-y-2 text-sm">
              <p className="flex items-center gap-2.5">
                <CalendarDays className="w-4 h-4 text-[#C8A96A]" /> {dateLabel}
              </p>
              <p className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-[#C8A96A]" /> {formatTimeTo12Hour(invite.startTime)}
                {invite.endTime ? ` – ${invite.endTime}` : ""}
              </p>
              <p className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#C8A96A] mt-0.5" />
                <span>
                  {invite.venueName}
                  <span className="block text-xs text-white/50">{invite.venueAddress}</span>
                </span>
              </p>
              <p className="flex items-center gap-2.5 text-white/60 text-xs">
                <Users className="w-4 h-4 text-[#C8A96A]" />
                {invite.isCapacityFull ? "Guest list is full" : `${invite.spotsRemaining} of ${invite.capacity} spots left`}
              </p>
            </div>

            {invite.isHost && !pass && (
              <p className="text-xs text-white/60">
                This is your party! Manage guests from{" "}
                <Link href="/user/celebrations" className="text-[#C8A96A] underline">
                  Celebrations
                </Link>
                .
              </p>
            )}

            {(!pass || isCancelled) && !invite.isHost && (
              <button
                onClick={openJoin}
                disabled={invite.isCapacityFull}
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-[#C8A96A] via-[#E0C68E] to-[#C8A96A] text-[#0a120e] text-xs font-black uppercase tracking-[0.15em] disabled:opacity-40 cursor-pointer"
              >
                {invite.isCapacityFull ? "Guest list full" : isCancelled ? "I can come after all" : "Join the guest list"} {!invite.isCapacityFull && <ArrowRight className="w-4 h-4" />}
              </button>
            )}
          </div>

          {/* Welcome + pass */}
          {pass && isCancelled && (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-center space-y-2">
              <p className="text-sm font-bold">You&apos;re not attending</p>
              <p className="text-xs text-white/55">
                You cancelled your spot and {invite.hostName} was notified. Your old QR no longer works.
              </p>
            </div>
          )}

          {pass && !isCancelled && (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-center space-y-4">
              {welcome && (
                <div className="rounded-2xl bg-gradient-to-r from-[#C8A96A]/20 to-[#C8A96A]/5 border border-[#C8A96A]/40 p-4 space-y-1">
                  <Crown className="w-7 h-7 mx-auto text-[#E0C68E]" />
                  <p className="text-lg font-headline italic">You&apos;re an official member now!</p>
                  <p className="text-xs text-white/70">
                    Welcome to Tropica, {realName(pass.guestName).split(" ")[0] || "friend"}. Enjoy the exclusive perks of your membership, starting with this party.
                  </p>
                </div>
              )}

              {pass.status === "approved" ? (
                <>
                  <p className="text-sm font-bold inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> You&apos;re on the guest list
                  </p>
                  <div className={`mx-auto w-fit rounded-2xl bg-white p-3 ${pass.checkedIn ? "opacity-40" : ""}`}>
                    <QrCodeCard value={pass.qrCodeToken} size={210} />
                  </div>
                  <p className="font-mono text-sm text-[#C8A96A]">{pass.passCode}</p>
                  <p className="text-xs text-white/55">
                    {pass.checkedIn ? "You're checked in. Have fun!" : "Show this QR at the door. Staff will scan it to check you in."}
                  </p>
                  <Link href={`/invite/pass/${pass.qrCodeToken}`} className="text-xs text-[#C8A96A] underline">
                    Open full-screen pass
                  </Link>
                </>
              ) : pass.status === "pending_approval" ? (
                <p className="text-sm text-amber-200">Request sent! {invite.hostName} will approve you soon and your door QR will appear here.</p>
              ) : (
                <p className="text-sm text-rose-300">The host couldn&apos;t add you to this guest list.</p>
              )}

              {pass.canCancel && (
                <div className="pt-4 border-t border-white/10 space-y-2">
                  {!confirmCancel ? (
                    <>
                      <button
                        onClick={() => setConfirmCancel(true)}
                        className="text-xs font-bold text-rose-300 hover:text-rose-200 underline cursor-pointer"
                      >
                        Can&apos;t make it? Cancel my spot
                      </button>
                      {cancelByLabel && <p className="text-[11px] text-white/40">You can cancel until {cancelByLabel}</p>}
                    </>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-white/70">
                        Cancel your spot? Your QR will stop working and the spot opens up for someone else. {invite.hostName} will be notified.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setConfirmCancel(false)}
                          disabled={cancelling}
                          className="flex-1 py-2.5 rounded-xl border border-white/15 text-xs font-bold cursor-pointer"
                        >
                          Keep my spot
                        </button>
                        <button
                          onClick={cancelSpot}
                          disabled={cancelling}
                          className="flex-1 py-2.5 rounded-xl bg-rose-500/90 hover:bg-rose-500 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                        >
                          {cancelling && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Not attending
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Join popup: phone OTP → name */}
      {modalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" role="dialog" aria-modal="true" aria-label="Join the guest list" onClick={() => !busy && setModalOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-3xl border border-[#C8A96A]/30 bg-[#0c1612] p-6 space-y-5 shadow-2xl">
            <button onClick={() => setModalOpen(false)} disabled={busy} aria-label="Close" className="absolute top-3 right-3 p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <div className="text-center space-y-1">
              <p className="text-[10px] uppercase tracking-[0.25em] text-[#C8A96A] font-bold">{invite.hostName}&apos;s {occasion}</p>
              <h2 className="text-xl font-bold">
                {step === "phone" ? "Sign in with your phone" : step === "otp" ? "Enter the code" : "What's your name?"}
              </h2>
              <p className="text-xs text-white/55">
                {step === "phone"
                  ? "We'll text you a 4-digit code. This creates your free Tropica membership."
                  : step === "otp"
                  ? `Sent to ${country.flag} ${country.code} ${phone}`
                  : "So the host and our door staff know who you are."}
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
                      className={`flex-1 rounded-xl border py-2 text-xs font-bold cursor-pointer ${countryId === c.id ? "border-[#C8A96A] bg-[#C8A96A]/10" : "border-white/10 text-white/60"}`}
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
                <button type="submit" disabled={busy} className="w-full py-3.5 rounded-xl bg-[#C8A96A] text-[#0a120e] text-xs font-black uppercase tracking-[0.15em] inline-flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer">
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
                  void rsvp(name);
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
                <button type="submit" disabled={busy} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#C8A96A] via-[#E0C68E] to-[#C8A96A] text-[#0a120e] text-xs font-black uppercase tracking-[0.15em] inline-flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer">
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Join the guest list
                </button>
              </form>
            )}

            <p className="text-[10px] text-center text-white/35 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Your number is only shared with the host and door staff.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
