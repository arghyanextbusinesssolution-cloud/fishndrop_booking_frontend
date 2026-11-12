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
} from "lucide-react";
import api from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/authStore";
import { NavBar } from "@/components/shared/NavBar";
import { formatTimeTo12Hour } from "@/lib/utils";
import { formatPhoneInput, phonePlaceholder } from "@/lib/phoneFormat";
import {
  LoungeBackdrop,
  TropicaPanel,
  TropicaPopup,
  tropicaChip,
  tropicaField,
  tropicaGoldButton,
  tropicaInput,
  tropicaOtpInput,
} from "@/components/auth/TropicaAuthShell";

const QrCodeCard = dynamic(() => import("@/components/shared/QrCodeCard"), {
  ssr: false,
});

interface MyPass {
  passCode: string;
  qrCodeToken: string;
  status: "approved" | "pending_approval" | "rejected" | "cancelled" | "removed";
  guestName: string;
  checkedIn: boolean;
  cancelDeadline?: string | null;
  canCancel?: boolean;
}

interface Invitation {
  hostName: string;
  occasion: string;
  eventTitle?: string;
  flyerUrl?: string;
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
  { id: "IN", code: "+91", flag: "🇮🇳", digits: 10 },
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
  const [countryId, setCountryId] =
    useState<(typeof COUNTRIES)[number]["id"]>("US");
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
      const res = await fetch(`${base}/invitations/${token}`, {
        headers: t ? { Authorization: `Bearer ${t}` } : {},
      });
      const data = await res.json();
      if (!data.success)
        throw new Error(data.message || "Invalid invitation link");
      setInvite(data.invitation);
      return data.invitation as Invitation;
    } catch (e: unknown) {
      setError(
        e instanceof Error ? e.message : "Could not load this invitation",
      );
      return null;
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    void load().then((inv) => {
      // Not signed in (or not on the list yet) → show the join popup right away
      if (
        inv &&
        !inv.myPass &&
        !inv.isHost &&
        !inv.isCapacityFull &&
        !autoOpened.current &&
        !Cookies.get("token")
      ) {
        autoOpened.current = true;
        setModalOpen(true);
      }
    });
  }, [token, load]);

  const openJoin = () => {
    setFormError(null);
    const signedIn =
      !!Cookies.get("token") &&
      authUser?.isPhoneVerified !== false &&
      !!authUser?.phone;
    setName(realName(authUser?.name));
    setStep(signedIn ? "name" : "phone");
    setModalOpen(true);
  };

  const rsvp = async (guestName: string) => {
    setBusy(true);
    setFormError(null);
    try {
      const { data } = await api.post(`/invitations/${token}/rsvp`, {
        name: guestName.trim(),
      });
      setModalOpen(false);
      setWelcome(!data.alreadyRegistered);
      if (data.alreadyRegistered)
        toast.success("You're already on the guest list");
      await load();
    } catch (err: any) {
      const res = err.response?.data;
      if (
        res?.code === "PHONE_VERIFICATION_REQUIRED" ||
        res?.code === "LOGIN_REQUIRED"
      )
        setStep("phone");
      else if (res?.code === "NAME_REQUIRED") setStep("name");
      setFormError(
        res?.message || "Could not join the guest list. Please try again.",
      );
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
      toast.error(
        err.response?.data?.message || "Could not cancel. Please try again.",
      );
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
      setFormError(
        err instanceof Error ? err.message : "Could not send the code",
      );
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
      setFormError(
        err instanceof Error ? err.message : "Invalid or expired code",
      );
      setOtp("");
      setBusy(false);
    }
  };

  /* ───────── render ───────── */

  if (error) {
    return (
      <div className="relative min-h-screen bg-[#0b0704] text-white">
        <LoungeBackdrop />
        <NavBar />
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center gap-3 p-6 text-center">
          <AlertCircle className="w-10 h-10 text-amber-300" />
          <h1 className="text-xl font-bold">Invitation unavailable</h1>
          <p className="text-sm text-white/60 max-w-sm">{error}</p>
          <Link href="/" className="text-xs text-[#E0C68E] underline">
            Go to Tropica NYC
          </Link>
        </div>
      </div>
    );
  }

  if (!invite) {
    return (
      <div className="relative min-h-screen bg-[#0b0704] flex items-center justify-center">
        <LoungeBackdrop />
        <NavBar />
        <Loader2 className="relative z-10 w-8 h-8 animate-spin text-[#E0C68E]" />
      </div>
    );
  }

  const occasion = invite.occasion.replace(/_/g, " ");
  const partyName = invite.eventTitle?.trim() || `${invite.hostName}'s ${occasion}`;
  const dateLabel = new Date(invite.date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  const pass = invite.myPass;
  const isCancelled = pass?.status === "cancelled";
  const cancelByLabel = pass?.cancelDeadline
    ? new Date(pass.cancelDeadline).toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "";

  return (
    <div className="relative min-h-screen bg-[#0b0704] text-white overflow-x-hidden">
      <LoungeBackdrop />
      <NavBar />
      <div className="relative z-10 pt-28 md:pt-36 pb-16 px-4">
        <div className="max-w-md mx-auto space-y-6">
          {/* Invitation card */}
          <TropicaPanel className="text-center">
            {invite.flyerUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={invite.flyerUrl} alt={`${partyName} flyer`} className="block w-full h-auto border-b border-[#C8A96A]/30" />
            )}
            <div className="p-6 sm:p-8 space-y-5">
              {!invite.flyerUrl && (
                <div className="mx-auto w-16 h-16 rounded-full border border-[#C8A96A]/40 bg-[#C8A96A]/10 flex items-center justify-center shadow-[0_0_30px_-6px_rgba(255,190,90,0.6)]">
                  <PartyPopper className="w-8 h-8 text-[#F1D9A0]" />
                </div>
              )}
              <div>
                <p className="text-[11px] uppercase tracking-[0.35em] text-[#E0C68E] font-bold">
                  You&apos;re invited
                </p>
                <h1 className="text-3xl sm:text-4xl font-headline font-bold capitalize mt-2 break-words">
                  {partyName}
                </h1>
                {invite.eventTitle && (
                  <p className="text-xs text-white/55 mt-1.5 capitalize">
                    Hosted by {invite.hostName} · {occasion}
                  </p>
                )}
              </div>
              <div className="text-left rounded-2xl bg-black/40 border border-[#C8A96A]/20 p-4 sm:p-5 space-y-3 text-sm">
                <p className="flex items-center gap-2.5">
                  <CalendarDays className="w-4 h-4 text-[#E0C68E]" />{" "}
                  {dateLabel}
                </p>
                <p className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-[#C8A96A]" />{" "}
                  {formatTimeTo12Hour(invite.startTime)}
                  {invite.endTime ? ` – ${invite.endTime}` : ""}
                </p>
                <p className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#C8A96A] mt-0.5" />
                  <span>
                    {invite.venueName}
                    <span className="block text-xs text-white/50">
                      {invite.venueAddress}
                    </span>
                  </span>
                </p>
                <p className="flex items-center gap-2.5 text-white/60 text-xs">
                  <Users className="w-4 h-4 text-[#C8A96A]" />
                  {invite.isCapacityFull
                    ? "Guest list is full"
                    : `${invite.spotsRemaining} of ${invite.capacity} spots left`}
                </p>
              </div>

              {invite.isHost && !pass && (
                <p className="text-xs text-white/60">
                  This is your party! Manage guests from{" "}
                  <Link
                    href="/user/celebrations"
                    className="text-[#C8A96A] underline"
                  >
                    Celebrations
                  </Link>
                  .
                </p>
              )}

              {(!pass || isCancelled) && !invite.isHost && (
                <button
                  onClick={openJoin}
                  disabled={invite.isCapacityFull}
                  className={tropicaGoldButton}
                >
                  {invite.isCapacityFull
                    ? "Guest list full"
                    : isCancelled
                      ? "I can come after all"
                      : "Join the guest list"}{" "}
                  {!invite.isCapacityFull && <ArrowRight className="w-4 h-4" />}
                </button>
              )}
            </div>
          </TropicaPanel>

          {/* Welcome + pass */}
          {pass && isCancelled && (
            <TropicaPanel className="p-6 text-center">
              <div className="space-y-2">
                <p className="text-sm font-bold">You&apos;re not attending</p>
                <p className="text-xs text-white/55">
                  You cancelled your spot and {invite.hostName} was notified.
                  Your old QR no longer works.
                </p>
              </div>
            </TropicaPanel>
          )}

          {pass && !isCancelled && (
            <TropicaPanel className="p-6 text-center">
              <div className="space-y-4">
                {welcome && (
                  <div className="rounded-2xl bg-gradient-to-r from-[#C8A96A]/20 to-[#C8A96A]/5 border border-[#C8A96A]/40 p-4 space-y-1">
                    <Crown className="w-7 h-7 mx-auto text-[#E0C68E]" />
                    <p className="text-lg font-headline italic">
                      You&apos;re an official member now!
                    </p>
                    <p className="text-xs text-white/70">
                      Welcome to Tropica,{" "}
                      {realName(pass.guestName).split(" ")[0] || "friend"}.
                      Enjoy the exclusive perks of your membership, starting
                      with this party.
                    </p>
                  </div>
                )}

                {pass.status === "approved" ? (
                  <>
                    <p className="text-sm font-bold inline-flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />{" "}
                      You&apos;re on the guest list
                    </p>
                    <div
                      className={`mx-auto w-fit rounded-2xl bg-white p-3 ring-2 ring-[#C8A96A]/60 shadow-[0_0_40px_-8px_rgba(255,190,90,0.6)] ${pass.checkedIn ? "opacity-40" : ""}`}
                    >
                      <QrCodeCard value={pass.qrCodeToken} size={210} />
                    </div>
                    <p className="font-mono text-sm tracking-widest text-[#F1D9A0]">
                      {pass.passCode}
                    </p>
                    <p className="text-xs text-white/55">
                      {pass.checkedIn
                        ? "You're checked in. Have fun!"
                        : "Show this QR at the door. Staff will scan it to check you in."}
                    </p>
                    <Link
                      href={`/invite/pass/${pass.qrCodeToken}`}
                      className="text-xs text-[#C8A96A] underline"
                    >
                      Open full-screen pass
                    </Link>
                  </>
                ) : pass.status === "pending_approval" ? (
                  <p className="text-sm text-amber-200">
                    Request sent! {invite.hostName} will approve you soon and
                    your door QR will appear here.
                  </p>
                ) : pass.status === "removed" ? (
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-rose-200">You&apos;re no longer on this guest list</p>
                    <p className="text-xs text-white/55">
                      {invite.hostName} removed you from the list, so your door pass no longer works. Please contact {invite.hostName} if you think this is a mistake.
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-rose-300">
                    The host couldn&apos;t add you to this guest list.
                  </p>
                )}

                {pass.canCancel && (
                  <div className="pt-4 border-t border-[#C8A96A]/15 space-y-2">
                    {!confirmCancel ? (
                      <>
                        <button
                          onClick={() => setConfirmCancel(true)}
                          className="text-xs font-bold text-rose-300 hover:text-rose-200 underline cursor-pointer"
                        >
                          Can&apos;t make it? Cancel my spot
                        </button>
                        {cancelByLabel && (
                          <p className="text-[11px] text-white/40">
                            You can cancel until {cancelByLabel}
                          </p>
                        )}
                      </>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-xs text-white/70">
                          Cancel your spot? Your QR will stop working and the
                          spot opens up for someone else. {invite.hostName} will
                          be notified.
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
                            {cancelling && (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            )}{" "}
                            Not attending
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TropicaPanel>
          )}
        </div>
      </div>

      {/* Join popup: phone OTP → name (Tropica lounge theme) */}
      {modalOpen && (
        <TropicaPopup
          label="Join the guest list"
          busy={busy}
          onClose={() => setModalOpen(false)}
          eyebrow={<span className="capitalize">{partyName}</span>}
          title={
            step === "phone"
              ? "Sign in with your phone"
              : step === "otp"
                ? "Enter the code"
                : "What's your name?"
          }
          subtitle={
            step === "phone"
              ? "We'll text you a 4-digit code. This creates your free Tropica membership."
              : step === "otp"
                ? `Sent to ${country.flag} ${country.code} ${phone}`
                : "So the host and our door staff know who you are."
          }
          footer={
            <p className="text-[11px] text-center text-white/45 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />{" "}
              Your number is only shared with the host and door staff.
            </p>
          }
        >
          {formError && (
            <p className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2 flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />{" "}
              {formError}
            </p>
          )}

          {step === "phone" && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="flex gap-2">
                {COUNTRIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setCountryId(c.id);
                      setPhone((p) => formatPhoneInput(p, c.id));
                    }}
                    className={tropicaChip(countryId === c.id)}
                  >
                    {c.flag} {c.code}
                  </button>
                ))}
              </div>
              <label className={tropicaField}>
                <Smartphone className="w-4 h-4 text-[#C8A96A]/70 shrink-0" />
                <input
                  autoFocus
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  value={phone}
                  onChange={(e) =>
                    setPhone(formatPhoneInput(e.target.value, countryId))
                  }
                  placeholder={phonePlaceholder(countryId)}
                  aria-label="Mobile number"
                  className={`${tropicaInput} text-base font-mono`}
                />
              </label>
              <button
                type="submit"
                disabled={busy}
                className={tropicaGoldButton}
              >
                {busy ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}{" "}
                Send code
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
                  const v = e.target.value
                    .replace(/\D/g, "")
                    .slice(0, OTP_LENGTH);
                  setOtp(v);
                  if (v.length === OTP_LENGTH) void handleVerify(v);
                }}
                placeholder="• • • •"
                aria-label="Verification code"
                className={tropicaOtpInput}
              />
              <div className="flex justify-between text-xs text-white/55">
                <button
                  type="button"
                  onClick={() => setStep("phone")}
                  className="hover:text-white cursor-pointer"
                >
                  ← Change number
                </button>
                {busy && (
                  <Loader2 className="w-4 h-4 animate-spin text-[#C8A96A]" />
                )}
              </div>
            </div>
          )}

          {step === "name" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (name.trim().length < 2)
                  return setFormError("Please enter your full name");
                void rsvp(name);
              }}
              className="space-y-4"
            >
              <label className={tropicaField}>
                <UserIcon className="w-4 h-4 text-[#C8A96A]/70 shrink-0" />
                <input
                  autoFocus
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  className={tropicaInput}
                />
              </label>
              <button
                type="submit"
                disabled={busy}
                className={tropicaGoldButton}
              >
                {busy ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}{" "}
                Join the guest list
              </button>
            </form>
          )}
        </TropicaPopup>
      )}
    </div>
  );
}
