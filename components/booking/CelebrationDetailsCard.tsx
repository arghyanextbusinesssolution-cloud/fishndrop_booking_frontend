"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { ImagePlus, Loader2, PencilLine, RefreshCw, Save, Trash2 } from "lucide-react";
import api from "@/lib/axios";
import { resizeImageFile } from "@/lib/imageResize";

interface Props {
  bookingId: string;
  eventTitle: string;
  flyerUrl: string;
  /** What guests see when no name is set, e.g. "Arty's private party". */
  defaultTitle: string;
  onSaved: (v: { eventTitle: string; flyerUrl: string }) => void;
}

/** Host names their party and uploads / changes / removes the flyer shown on the invite. */
export function CelebrationDetailsCard({ bookingId, eventTitle, flyerUrl, defaultTitle, onSaved }: Props) {
  const [title, setTitle] = useState(eventTitle);
  const [flyer, setFlyer] = useState(flyerUrl); // https URL, new data URL, or ""
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Keep in sync when the page reloads its data
  useEffect(() => setTitle(eventTitle), [eventTitle]);
  useEffect(() => setFlyer(flyerUrl), [flyerUrl]);

  const dirty = title.trim() !== eventTitle || flyer !== flyerUrl;

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      toast.error("That image is too large. Please pick one under 25MB.");
      return;
    }
    setReading(true);
    try {
      setFlyer(await resizeImageFile(file));
    } catch (err: any) {
      toast.error(err.message || "Could not read that image");
    } finally {
      setReading(false);
    }
  };

  const save = async () => {
    const body: Record<string, string> = {};
    if (title.trim() !== eventTitle) body.eventTitle = title.trim();
    if (flyer !== flyerUrl) body.flyerUrl = flyer;
    if (!Object.keys(body).length) return;
    setBusy(true);
    try {
      const { data } = await api.patch(`/invitations/booking/${bookingId}/details`, body);
      toast.success("Event details saved. Your invite is updated.");
      onSaved(data.event);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Could not save event details");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[#C8A96A]/25 bg-gradient-to-b from-[#1a140c]/80 to-[#0a0705]/90 p-5 sm:p-6 space-y-5">
      <div>
        <h3 className="font-headline font-bold text-xl text-white flex items-center gap-2">
          <PencilLine className="w-5 h-5 text-[#E0C68E]" /> Event details
        </h3>
        <p className="text-xs text-white/55 mt-1">Name your party and add a flyer. Guests see them on your invite link and their door pass.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-5">
        {/* Flyer */}
        <div className="space-y-2">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pick} />
          {flyer ? (
            <div className="relative group rounded-xl overflow-hidden border border-[#C8A96A]/30 bg-black/40 aspect-[4/5]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={flyer} alt="Party flyer" className="w-full h-full object-contain bg-black" />
              {reading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-[#E0C68E]" />
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={reading}
              className="w-full aspect-[4/5] rounded-xl border-2 border-dashed border-[#C8A96A]/35 bg-black/30 hover:border-[#E0C68E] hover:bg-[#C8A96A]/5 flex flex-col items-center justify-center gap-2 text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              {reading ? <Loader2 className="w-7 h-7 animate-spin text-[#E0C68E]" /> : <ImagePlus className="w-8 h-8 text-[#E0C68E]" />}
              <span className="text-xs font-bold uppercase tracking-wider">Upload flyer</span>
              <span className="text-[10px] text-white/40">JPG, PNG or WebP</span>
            </button>
          )}
          {flyer && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={reading || busy}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg border border-[#C8A96A]/35 text-[#E0C68E] text-[11px] font-bold uppercase tracking-wider hover:bg-[#C8A96A]/10 cursor-pointer disabled:opacity-40"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Change
              </button>
              <button
                type="button"
                onClick={() => setFlyer("")}
                disabled={reading || busy}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-red-500/30 text-red-300 text-[11px] font-bold uppercase tracking-wider hover:bg-red-500/10 cursor-pointer disabled:opacity-40"
                aria-label="Remove flyer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Name */}
        <div className="space-y-4">
          <div>
            <label htmlFor="cel-title" className="block text-[11px] font-bold uppercase tracking-[0.18em] text-[#E0C68E]/80 mb-1.5">
              Event name
            </label>
            <input
              id="cel-title"
              value={title}
              maxLength={80}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={defaultTitle}
              className="w-full rounded-xl bg-black/55 border border-[#C8A96A]/30 px-4 py-3 text-base text-white outline-none placeholder:text-white/30 focus:border-[#E0C68E] focus:shadow-[0_0_0_3px_rgba(200,169,106,0.15)]"
            />
            <p className="text-[11px] text-white/40 mt-1.5 flex justify-between">
              <span>Leave empty to show “{defaultTitle}”.</span>
              <span>{title.length}/80</span>
            </p>
          </div>

          <div className="rounded-xl bg-black/35 border border-[#C8A96A]/15 p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">Guests will see</p>
            <p className="font-headline text-2xl font-bold text-white mt-1 break-words capitalize">{title.trim() || defaultTitle}</p>
          </div>

          <button
            type="button"
            onClick={save}
            disabled={!dirty || busy || reading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-b from-[#F1D9A0] via-[#D9B872] to-[#B8934E] text-[#1a1208] text-xs font-black uppercase tracking-[0.15em] shadow-[0_8px_24px_-8px_rgba(224,184,110,0.6)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {busy ? "Saving…" : "Save event details"}
          </button>
        </div>
      </div>
    </div>
  );
}
