"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import toast from "react-hot-toast";
import { tropicaGoldButton } from "@/components/auth/TropicaAuthShell";
import { Check, Copy, Download, Mail, MessageCircle, PartyPopper, Share2, Smartphone, X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  inviteLink: string;
  hostName?: string;
  occasion?: string;
  dateLabel?: string;
  /** Optional note shown under the title (e.g. Zelle still verifying). */
  note?: string;
}

/** "Share your invite" popup: QR + link, sendable anywhere. */
export function ShareInviteModal({ open, onClose, inviteLink, hostName, occasion, dateLabel, note }: Props) {
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open || !inviteLink) return;
    QRCode.toDataURL(inviteLink, { width: 560, margin: 2, errorCorrectionLevel: "M" })
      .then(setQr)
      .catch(() => setQr(null));
  }, [open, inviteLink]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const what = (occasion || "celebration").replace(/_/g, " ");
  const message = `You're invited to ${hostName ? `${hostName}'s` : "my"} ${what} at Tropica NYC${
    dateLabel ? ` on ${dateLabel}` : ""
  }! Tap to join the guest list and get your door pass: ${inviteLink}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast.success("Invite link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy the link");
    }
  };

  const nativeShare = async () => {
    try {
      const files: File[] = [];
      if (qr) {
        const blob = await (await fetch(qr)).blob();
        files.push(new File([blob], "tropica-invite-qr.png", { type: "image/png" }));
      }
      const data: ShareData = { title: "You're invited to Tropica NYC", text: message, url: inviteLink };
      if (files.length && navigator.canShare?.({ files })) data.files = files;
      if (navigator.share) await navigator.share(data);
      else await copy();
    } catch {
      /* user cancelled */
    }
  };

  const download = () => {
    if (!qr) return;
    const a = document.createElement("a");
    a.href = qr;
    a.download = "tropica-invite-qr.png";
    a.click();
  };

  const chip =
    "inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold border border-[#C8A96A]/25 bg-black/40 text-white/85 hover:border-[#E0C68E] hover:bg-[#C8A96A]/10 hover:text-white transition-colors cursor-pointer";

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-[#050302]/85 backdrop-blur-md sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Share your invite"
    >
      {/* warm lantern glow behind the card */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_45%_at_50%_45%,rgba(255,176,80,0.18),transparent_70%)]" aria-hidden />

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full sm:max-w-md max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-[#C8A96A]/55 bg-gradient-to-b from-[#1a140c] via-[#0e0b07] to-[#090705] text-white shadow-[0_0_70px_-12px_rgba(224,184,110,0.55),0_30px_60px_-20px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,235,190,0.18)]"
      >
        <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#F1D9A0] to-transparent" />
        <div className="pointer-events-none absolute inset-[5px] rounded-t-[1.25rem] sm:rounded-[1.25rem] border border-[#C8A96A]/15" />
        <button onClick={onClose} aria-label="Close" className="absolute top-3.5 right-3.5 z-10 p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 cursor-pointer">
          <X className="w-5 h-5" />
        </button>

        <div className="relative p-6 sm:p-7 space-y-5">
          <div className="text-center space-y-2">
            <div className="mx-auto w-14 h-14 rounded-full border border-[#C8A96A]/40 bg-[#C8A96A]/10 flex items-center justify-center shadow-[0_0_30px_-6px_rgba(255,190,90,0.6)]">
              <PartyPopper className="w-7 h-7 text-[#F1D9A0]" />
            </div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-[#E0C68E] font-bold pt-1">Your guest list is open</p>
            <h2 className="text-2xl sm:text-3xl font-headline font-bold">Hi{hostName ? ` ${hostName}` : ""}! Share your invite</h2>
            <p className="text-xs text-white/60 max-w-sm mx-auto">
              Send this QR or link to your guests. They sign in with their phone, join your guest list and get their own door pass. Our staff scan it when they arrive.
            </p>
            {note && <p className="text-[11px] text-amber-200 bg-amber-400/10 border border-amber-400/30 rounded-lg px-3 py-1.5">{note}</p>}
          </div>

          <div className="mx-auto w-fit rounded-2xl bg-white p-3 ring-2 ring-[#C8A96A]/60 shadow-[0_0_40px_-8px_rgba(255,190,90,0.6)]">
            {qr ? <img src={qr} alt="Invite QR code" className="w-52 h-52" /> : <div className="w-52 h-52 animate-pulse bg-black/10 rounded-lg" />}
          </div>

          <div className="flex items-stretch gap-2">
            <input
              readOnly
              value={inviteLink}
              onFocus={(e) => e.target.select()}
              className="flex-1 min-w-0 bg-black/55 border border-[#C8A96A]/30 rounded-xl px-3 py-2.5 text-xs font-mono text-white/80 outline-none focus:border-[#E0C68E]"
            />
            <button
              onClick={copy}
              className="shrink-0 inline-flex items-center gap-1.5 px-4 rounded-xl bg-gradient-to-b from-[#F1D9A0] to-[#C8A96A] hover:brightness-110 text-[#1a1208] text-xs font-bold cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer" className={chip}>
              <MessageCircle className="w-4 h-4 text-emerald-400" /> WhatsApp
            </a>
            <a href={`sms:?&body=${encodeURIComponent(message)}`} className={chip}>
              <Smartphone className="w-4 h-4 text-sky-300" /> Text message
            </a>
            <a href={`mailto:?subject=${encodeURIComponent("You're invited to Tropica NYC")}&body=${encodeURIComponent(message)}`} className={chip}>
              <Mail className="w-4 h-4 text-[#E0C68E]" /> Email
            </a>
            <button onClick={download} disabled={!qr} className={`${chip} disabled:opacity-40`}>
              <Download className="w-4 h-4 text-[#E0C68E]" /> Save QR
            </button>
          </div>

          <button onClick={nativeShare} className={tropicaGoldButton}>
            <Share2 className="w-4 h-4" /> Share anywhere
          </button>
        </div>
      </div>
    </div>
  );
}
