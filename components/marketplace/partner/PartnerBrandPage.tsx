"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ImagePlus, Loader2, Save, X } from "lucide-react";
import api from "@/lib/axios";
import { resizeImageFile } from "@/lib/imageResize";
import type { MarketplaceVenue, VenueTheme } from "@/types";
import { ImageSlot, ThemeEditor } from "@/components/marketplace/admin/VenueOwnerWizard";
import { PortalHeader, apiError } from "./shared";

interface Brand {
  theme: VenueTheme;
  logoUrl: string;
  coverUrl: string;
  flyerUrl: string;
  photos: string[];
}

/** Venue owner: choose colors, logo, cover, flyer and gallery — the look customers see when booking. */
export default function PartnerBrandPage() {
  const [venue, setVenue] = useState<MarketplaceVenue | null>(null);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [saved, setSaved] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/marketplace/partner/venue")
      .then(({ data }) => {
        if (cancelled) return;
        const v: MarketplaceVenue = data.venue;
        const b = { theme: v.theme, logoUrl: v.logoUrl || "", coverUrl: v.coverUrl || "", flyerUrl: v.flyerUrl || "", photos: v.photos || [] };
        setVenue(v);
        setBrand(b);
        setSaved(JSON.stringify(b));
      })
      .catch((err) => toast.error(apiError(err, "Couldn't load your venue")));
    return () => {
      cancelled = true;
    };
  }, []);

  if (!venue || !brand)
    return (
      <p className="p-10 flex items-center gap-2 text-white/60 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading…
      </p>
    );

  const dirty = JSON.stringify(brand) !== saved;

  const upload = async (file: File, kind: "logo" | "cover" | "flyer" | "photo") => {
    setUploading(kind);
    try {
      const imageBase64 = await resizeImageFile(file, kind === "logo" ? 400 : 1800);
      const { data } = await api.post("/marketplace/partner/media", { imageBase64, kind }, { timeout: 60000 });
      return data.url as string;
    } catch (err) {
      toast.error(apiError(err, "Upload failed — try another image"));
      return null;
    } finally {
      setUploading(null);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.patch("/marketplace/partner/venue/brand", brand);
      setSaved(JSON.stringify(brand));
      toast.success("Saved — customers now see your new look");
    } catch (err) {
      toast.error(apiError(err, "Couldn't save"));
    } finally {
      setSaving(false);
    }
  };

  const set = <K extends keyof Brand>(k: K, v: Brand[K]) => setBrand((b) => (b ? { ...b, [k]: v } : b));

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8 min-h-screen pb-28">
      <PortalHeader
        title="Brand & Theme"
        subtitle="When customers pick your venue on Tropica, the booking pages switch to your colors, logo and photos."
      />

      <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-5">
        <h2 className="text-base font-bold text-white">Images</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <ImageSlot label="Logo" url={brand.logoUrl} round busy={uploading === "logo"} onPick={async (f) => { const u = await upload(f, "logo"); if (u) set("logoUrl", u); }} onClear={() => set("logoUrl", "")} />
          <ImageSlot label="Cover photo" url={brand.coverUrl} busy={uploading === "cover"} onPick={async (f) => { const u = await upload(f, "cover"); if (u) set("coverUrl", u); }} onClear={() => set("coverUrl", "")} />
          <ImageSlot label="Flyer" url={brand.flyerUrl} busy={uploading === "flyer"} onPick={async (f) => { const u = await upload(f, "flyer"); if (u) set("flyerUrl", u); }} onClear={() => set("flyerUrl", "")} />
        </div>
        <div>
          <p className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-2">Gallery photos</p>
          <div className="flex flex-wrap gap-3">
            {brand.photos.map((p) => (
              <div key={p} className="relative w-32 h-24 rounded-lg overflow-hidden border border-white/10">
                <img src={p} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  aria-label="Remove photo"
                  onClick={() => set("photos", brand.photos.filter((x) => x !== p))}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <label className="w-32 h-24 rounded-lg border border-dashed border-white/20 text-white/50 flex flex-col items-center justify-center text-[11px] cursor-pointer hover:border-[#C8A96A]">
              {uploading === "photo" ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
              Add photos
              <input
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={async (e) => {
                  const files = Array.from(e.target.files || []);
                  e.target.value = "";
                  for (const f of files) {
                    const u = await upload(f, "photo");
                    if (u) setBrand((b) => (b ? { ...b, photos: [...b.photos, u] } : b));
                  }
                }}
              />
            </label>
          </div>
        </div>
      </section>

      <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
        <h2 className="text-base font-bold text-white">Colors</h2>
        <ThemeEditor theme={brand.theme} onChange={(t) => set("theme", t)} venueName={venue.name} logoUrl={brand.logoUrl} coverUrl={brand.coverUrl} />
      </section>

      {/* Sticky save bar */}
      <div className="fixed bottom-0 right-0 left-0 lg:left-72 z-40 border-t border-white/10 bg-[#0b0704]/95 backdrop-blur px-6 py-3 flex items-center justify-end gap-4">
        <span className="text-xs text-white/50">{dirty ? "Unsaved changes" : "All changes saved"}</span>
        <button
          type="button"
          onClick={save}
          disabled={!dirty || saving || Boolean(uploading)}
          className="inline-flex items-center gap-2 rounded-full bg-[#C8A96A] text-[#0d1612] px-6 py-2.5 text-[11px] font-bold uppercase tracking-widest disabled:opacity-40"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
        </button>
      </div>
    </div>
  );
}
