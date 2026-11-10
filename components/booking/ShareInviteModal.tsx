"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import toast from "react-hot-toast";
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
    "inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-colors";

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md" onClick={onClose} role="dialog" aria-modal="true" aria-label="Share your invite">
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full sm:max-w-md max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-[#C8A96A]/30 bg-[#0c1612] text-white shadow-2xl"
      >
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#C8A96A] to-transparent" />
        <button onClick={onClose} aria-label="Close" className="absolute top-3 right-3 p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 cursor-pointer">
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 space-y-5">
          <div className="text-center space-y-1.5">
            <PartyPopper className="w-9 h-9 mx-auto text-[#C8A96A]" />
            <h2 className="text-xl font-headline italic">Hi{hostName ? ` ${hostName}` : ""}! Share your invite</h2>
            <p className="text-xs text-white/60">
              Send this QR or link to your guests. They sign in with their phone, join your guest list and get their own door pass. Our staff scan it when they arrive.
            </p>
            {note && <p className="text-[11px] text-amber-200 bg-amber-400/10 border border-amber-400/30 rounded-lg px-3 py-1.5">{note}</p>}
          </div>

          <div className="mx-auto w-fit rounded-2xl bg-white p-3">
            {qr ? <img src={qr} alt="Invite QR code" className="w-52 h-52" /> : <div className="w-52 h-52 animate-pulse bg-black/10 rounded-lg" />}
          </div>

          <div className="flex items-stretch gap-2">
            <input readOnly value={inviteLink} onFocus={(e) => e.target.select()} className="flex-1 min-w-0 bg-black/40 border border-white/15 rounded-xl px-3 py-2.5 text-xs font-mono text-white/80" />
            <button onClick={copy} className="shrink-0 inline-flex items-center gap-1.5 px-4 rounded-xl bg-[#C8A96A] hover:bg-[#E0C68E] text-[#0a120e] text-xs font-bold cursor-pointer">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer" className={`${chip} bg-emerald-600/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-600/25`}>
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
            <a href={`sms:?&body=${encodeURIComponent(message)}`} className={`${chip} bg-sky-600/15 border-sky-500/30 text-sky-300 hover:bg-sky-600/25`}>
              <Smartphone className="w-4 h-4" /> Text message
            </a>
            <a href={`mailto:?subject=${encodeURIComponent("You're invited to Tropica NYC")}&body=${encodeURIComponent(message)}`} className={`${chip} bg-white/5 border-white/15 text-white/80 hover:border-[#C8A96A]`}>
              <Mail className="w-4 h-4" /> Email
            </a>
            <button onClick={download} disabled={!qr} className={`${chip} bg-white/5 border-white/15 text-white/80 hover:border-[#C8A96A] cursor-pointer disabled:opacity-40`}>
              <Download className="w-4 h-4" /> Save QR
            </button>
          </div>

          <button onClick={nativeShare} className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-[#C8A96A] via-[#E0C68E] to-[#C8A96A] text-[#0a120e] text-xs font-black uppercase tracking-[0.15em] cursor-pointer">
            <Share2 className="w-4 h-4" /> Share anywhere
          </button>
        </div>
      </div>
    </div>
  );
}
