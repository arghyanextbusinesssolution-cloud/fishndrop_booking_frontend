"use client";

import { ReactNode, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Clock,
  Copy,
  DollarSign,
  ImagePlus,
  KeyRound,
  ListChecks,
  Loader2,
  MapPin,
  Palette,
  Plus,
  Trash2,
  UserRound,
  X
} from "lucide-react";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";
import { resizeImageFile } from "@/lib/imageResize";
import type { VenueDayHours, VenueTheme } from "@/types";
import { WeeklyHoursEditor, dayHoursLabel, toWeeklyHours } from "@/components/marketplace/WeeklyHoursEditor";
import { VenueThemeProvider, contrastRatio } from "@/components/marketplace/VenueThemeProvider";
import { PlaceAutocomplete } from "@/components/events/EventFormPickers";

/* ─── Shared form state ──────────────────────────────────────────────── */

export interface VenuePackageForm {
  _id?: string;
  name: string;
  price: number | "";
  hours: number | "";
  description: string;
}

export interface VenueForm {
  name: string;
  tagline: string;
  venueType: string;
  description: string;
  address: string;
  neighborhood: string;
  city: string;
  /** Filled from the OpenStreetMap address search (map pin + directions). */
  lat?: number;
  lng?: number;
  placeId?: string;
  minGuests: number | "";
  maxGuests: number | "";
  openTime: string;
  closeTime: string;
  operatingDays: number[];
  weeklyHours: VenueDayHours[];
  slotStepMins: 30 | 60;
  pricingMode: "hourly" | "flat";
  basePrice: number | "";
  minHours: number | "";
  packages: VenuePackageForm[];
  amenities: string[];
  rules: string;
  cancellationPolicy: string;
  theme: VenueTheme;
  logoUrl: string;
  coverUrl: string;
  flyerUrl: string;
  photos: string[];
  internalNotes: string;
}

export interface AdminVenueRow extends Partial<Omit<VenueForm, "rules">> {
  _id: string;
  slug: string;
  name: string;
  status: "draft" | "published" | "paused";
  rules?: string[];
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  owner?: { _id: string; name?: string; email?: string; lastLoginAt?: string } | null;
  partnerDiscountPct: number;
  customerDiscountPct: number;
  depositPct: number;
  commissionSet: boolean;
  openRequests: number;
  chargesEnabled?: boolean;
  commissionPreview: {
    regularPrice: number;
    customerPrice: number;
    venuePayout: number;
    commission: number;
    depositAmount: number;
    basis: string;
  };
  createdAt: string;
}

export const VENUE_TYPES: Array<{ value: string; label: string }> = [
  { value: "event_space", label: "Event space" },
  { value: "rooftop", label: "Rooftop" },
  { value: "lounge", label: "Lounge / bar" },
  { value: "restaurant", label: "Restaurant" },
  { value: "banquet_hall", label: "Banquet hall" },
  { value: "garden", label: "Garden / outdoor" },
  { value: "loft", label: "Loft" },
  { value: "studio", label: "Studio" },
  { value: "other", label: "Other" }
];

const AMENITY_PRESETS = [
  "Sound system",
  "DJ booth",
  "Private bar",
  "Kitchen access",
  "Tables & chairs",
  "Projector & screens",
  "Stage",
  "Wi-Fi",
  "Restrooms",
  "Wheelchair accessible",
  "Elevator access",
  "Outdoor space",
  "Parking nearby",
  "Coat check",
  "Outside catering allowed"
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const THEME_PRESETS: Array<{ name: string; theme: VenueTheme }> = [
  {
    name: "Tropica Emerald",
    theme: { primary: "#E3C281", primaryContainer: "#0F3D2E", onPrimary: "#0F3D2E", background: "#0F3D2E", surface: "#16553F", onSurface: "#FFFFFF", accent: "#A2D1BB" }
  },
  {
    name: "Midnight Sunset",
    theme: { primary: "#F2A65A", primaryContainer: "#1D2D44", onPrimary: "#1D2D44", background: "#0D1321", surface: "#1D2D44", onSurface: "#F0EBD8", accent: "#748CAB" }
  },
  {
    name: "Velvet Night",
    theme: { primary: "#C9184A", primaryContainer: "#590D22", onPrimary: "#FFFFFF", background: "#14080E", surface: "#2B0F1C", onSurface: "#FFE5EC", accent: "#FF8FA3" }
  },
  {
    name: "Garden Fresh",
    theme: { primary: "#4F772D", primaryContainer: "#ECF39E", onPrimary: "#FFFFFF", background: "#F7F9EF", surface: "#ECF2DC", onSurface: "#132A13", accent: "#90A955" }
  },
  {
    name: "Harbor Blue",
    theme: { primary: "#0077B6", primaryContainer: "#CAF0F8", onPrimary: "#FFFFFF", background: "#F4FAFD", surface: "#E3F2FA", onSurface: "#03045E", accent: "#00B4D8" }
  },
  {
    name: "Gallery White",
    theme: { primary: "#111111", primaryContainer: "#EDEDED", onPrimary: "#FFFFFF", background: "#FFFFFF", surface: "#F5F5F5", onSurface: "#111111", accent: "#FF5A1F" }
  }
];

const THEME_FIELDS: Array<{ key: keyof VenueTheme; label: string; hint: string }> = [
  { key: "primary", label: "Main color", hint: "Buttons, highlights" },
  { key: "onPrimary", label: "Text on main color", hint: "Button text" },
  { key: "background", label: "Page background", hint: "Behind everything" },
  { key: "surface", label: "Cards", hint: "Panels & cards" },
  { key: "onSurface", label: "Text color", hint: "Body text" },
  { key: "accent", label: "Accent", hint: "Secondary highlights" },
  { key: "primaryContainer", label: "Soft main color", hint: "Badges, chips" }
];

export const emptyVenueForm = (): VenueForm => ({
  name: "",
  tagline: "",
  venueType: "event_space",
  description: "",
  address: "",
  neighborhood: "",
  city: "New York",
  minGuests: 10,
  maxGuests: 100,
  openTime: "12:00",
  closeTime: "23:00",
  operatingDays: [0, 1, 2, 3, 4, 5, 6],
  weeklyHours: [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, open: true, openTime: "12:00", closeTime: "23:00" })),
  slotStepMins: 60,
  pricingMode: "hourly",
  basePrice: "",
  minHours: 3,
  packages: [],
  amenities: [],
  rules: "",
  cancellationPolicy: "",
  theme: { ...THEME_PRESETS[0].theme },
  logoUrl: "",
  coverUrl: "",
  flyerUrl: "",
  photos: [],
  internalNotes: ""
});

export const venueToForm = (v: AdminVenueRow): VenueForm => ({
  ...emptyVenueForm(),
  ...Object.fromEntries(Object.entries(v).filter(([, val]) => val !== undefined && val !== null)),
  rules: (v.rules || []).join("\n"),
  weeklyHours: toWeeklyHours(v),
  packages: (v.packages || []).map((p) => ({ ...p, description: p.description || "" })),
  theme: { ...THEME_PRESETS[0].theme, ...(v.theme || {}) }
}) as VenueForm;

const formToPayload = (f: VenueForm) => ({
  ...f,
  // Explicit nulls so a hand-typed address clears an old map pin on save
  lat: f.lat ?? null,
  lng: f.lng ?? null,
  placeId: f.placeId ?? null,
  minGuests: Number(f.minGuests) || 1,
  maxGuests: Number(f.maxGuests) || 1,
  basePrice: Number(f.basePrice) || 0,
  minHours: Number(f.minHours) || 1,
  packages: f.packages
    .filter((p) => p.name.trim() && Number(p.price) > 0)
    .map((p) => ({ ...p, price: Number(p.price), hours: Number(p.hours) || 1 })),
  rules: f.rules.split("\n").map((r) => r.trim()).filter(Boolean)
});

/* ─── Small UI helpers (dashboard look: dark + Tropica gold) ─────────── */

const inputCls =
  "w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#C8A96A]";
const labelCls = "block text-xs font-semibold text-white/80 uppercase tracking-wider mb-2";

const Field = ({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) => (
  <div className={className}>
    <label className={labelCls}>{label}</label>
    {children}
    {hint && <p className="text-[11px] text-white/40 mt-1.5">{hint}</p>}
  </div>
);

const money = (n = 0) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

/* ─── Wizard ─────────────────────────────────────────────────────────── */

interface Props {
  /** Edit an existing venue (skips the account step). */
  venue?: AdminVenueRow | null;
  onClose: () => void;
  onSaved: () => void;
}

const STEPS = [
  { key: "owner", title: "Owner account", icon: UserRound },
  { key: "basics", title: "Venue details", icon: Building2 },
  { key: "capacity", title: "Capacity & hours", icon: Clock },
  { key: "pricing", title: "Pricing", icon: DollarSign },
  { key: "features", title: "Amenities & rules", icon: ListChecks },
  { key: "brand", title: "Photos & theme", icon: Palette },
  { key: "review", title: "Review", icon: Check }
] as const;
type StepKey = (typeof STEPS)[number]["key"];

export const VenueOwnerWizard = ({ venue, onClose, onSaved }: Props) => {
  const isEdit = Boolean(venue);
  const steps = useMemo(() => STEPS.filter((s) => !isEdit || s.key !== "owner"), [isEdit]);
  const [stepIndex, setStepIndex] = useState(0);
  const step: StepKey = steps[stepIndex].key;

  const [owner, setOwner] = useState({ name: "", email: "", phone: "", password: "", autoPassword: true });
  const [form, setForm] = useState<VenueForm>(() => (venue ? venueToForm(venue) : emptyVenueForm()));
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<{ email: string; password: string; venueName: string } | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  const set = <K extends keyof VenueForm>(key: K, value: VenueForm[K]) => setForm((f) => ({ ...f, [key]: value }));

  /** Returns an error message for the current step, or null when it's complete. */
  const stepError = (key: StepKey): string | null => {
    switch (key) {
      case "owner":
        if (!owner.name.trim()) return "Enter the owner's name.";
        if (!/^\S+@\S+\.\S+$/.test(owner.email.trim())) return "Enter a valid email — the login details are sent there.";
        if (!owner.autoPassword && owner.password.length < 8) return "Password must be at least 8 characters.";
        return null;
      case "basics":
        if (!form.name.trim()) return "Enter the venue name.";
        if (!form.address.trim()) return "Enter the venue address.";
        return null;
      case "capacity":
        if (!Number(form.minGuests) || !Number(form.maxGuests)) return "Enter the minimum and maximum guests.";
        if (Number(form.minGuests) > Number(form.maxGuests)) return "Minimum guests can't be more than maximum.";
        if (!form.weeklyHours.some((d) => d.open)) return "Turn on at least one open day.";
        return null;
      case "pricing": {
        const hasPackage = form.packages.some((p) => p.name.trim() && Number(p.price) > 0);
        if (!hasPackage && !(Number(form.basePrice) > 0)) return "Enter a price or add at least one package.";
        return null;
      }
      default:
        return null;
    }
  };

  const next = () => {
    const err = stepError(step);
    if (err) {
      toast.error(err);
      return;
    }
    setStepIndex((i) => Math.min(steps.length - 1, i + 1));
  };

  const upload = async (file: File, kind: "logo" | "cover" | "flyer" | "photo") => {
    setUploading(kind);
    try {
      const imageBase64 = await resizeImageFile(file, kind === "logo" ? 400 : 1800);
      const { data } = await api.post("/admin/marketplace/media", { imageBase64, kind }, { timeout: 60000 });
      return data.url as string;
    } catch {
      toast.error("Upload failed — please try another image.");
      return null;
    } finally {
      setUploading(null);
    }
  };

  const save = async () => {
    for (const s of steps) {
      const err = stepError(s.key);
      if (err) {
        setStepIndex(steps.findIndex((x) => x.key === s.key));
        toast.error(err);
        return;
      }
    }
    setSaving(true);
    try {
      if (isEdit && venue) {
        await api.patch(`/admin/marketplace/venues/${venue._id}`, formToPayload(form));
        toast.success(`${form.name} updated`);
        onSaved();
        onClose();
      } else {
        const { data } = await api.post("/admin/marketplace/venues", {
          owner: {
            name: owner.name.trim(),
            email: owner.email.trim(),
            phone: owner.phone.trim(),
            password: owner.autoPassword ? undefined : owner.password
          },
          venue: formToPayload(form)
        });
        setCreated({ ...data.credentials, venueName: form.name });
        onSaved();
      }
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Couldn't save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  /* Success screen with the login details (shown once) */
  if (created) {
    return (
      <Shell onClose={onClose} title="Venue owner created">
        <div className="max-w-lg mx-auto text-center space-y-5 py-4">
          <div className="w-14 h-14 rounded-full bg-emerald-500/15 text-emerald-300 flex items-center justify-center mx-auto">
            <Check className="w-7 h-7" />
          </div>
          <h3 className="text-2xl font-headline italic text-white">{created.venueName} is set up</h3>
          <p className="text-sm text-white/60">
            We emailed these login details to the owner. The venue is <strong className="text-white">live on the booking page now</strong>, using
            the opening hours you set. An admin can set Tropica&apos;s commission in <em>Settings → Partner Venue Commission</em>.
          </p>
          <div className="text-left bg-white/5 border border-white/10 rounded-xl p-4 space-y-2 text-sm">
            <CopyRow label="Login page" value={`${typeof window !== "undefined" ? window.location.origin : ""}/partner-login`} />
            <CopyRow label="Email" value={created.email} />
            <CopyRow label="Temporary password" value={created.password} />
          </div>
          <button onClick={onClose} className="rounded-full bg-[#C8A96A] text-[#0d1612] px-8 py-3 text-xs font-bold uppercase tracking-widest">
            Done
          </button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell onClose={onClose} title={isEdit ? `Edit ${venue?.name}` : "Add venue owner"}>
      {/* Stepper */}
      <div className="flex gap-1.5 overflow-x-auto pb-3 mb-6 border-b border-white/10">
        {steps.map((s, i) => {
          const Icon = s.icon;
          const done = i < stepIndex;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => (i <= stepIndex || !steps.slice(0, i).some((x) => stepError(x.key)) ? setStepIndex(i) : undefined)}
              className={cn(
                "flex items-center gap-2 shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors",
                i === stepIndex ? "bg-[#C8A96A] text-[#0d1612]" : done ? "text-[#C8A96A] bg-[#C8A96A]/10" : "text-white/40"
              )}
            >
              {done ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{s.title}</span>
              <span className="sm:hidden">{i + 1}</span>
            </button>
          );
        })}
      </div>

      <div className="min-h-[360px]">
        {step === "owner" && (
          <Section title="Who owns this venue?" subtitle="We'll create their partner login and email them the details.">
            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="Owner full name *">
                <input className={inputCls} value={owner.name} onChange={(e) => setOwner({ ...owner, name: e.target.value })} placeholder="Maya Chen" />
              </Field>
              <Field label="Owner email *" hint="This is their login.">
                <input type="email" className={inputCls} value={owner.email} onChange={(e) => setOwner({ ...owner, email: e.target.value })} placeholder="maya@skylineloft.com" />
              </Field>
              <Field label="Owner phone">
                <input className={inputCls} value={owner.phone} onChange={(e) => setOwner({ ...owner, phone: e.target.value })} placeholder="+1 212 555 0100" />
              </Field>
              <Field label="Password">
                <label className="flex items-center gap-2 text-sm text-white/80 mb-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={owner.autoPassword}
                    onChange={(e) => setOwner({ ...owner, autoPassword: e.target.checked })}
                    className="accent-[#C8A96A]"
                  />
                  Generate a secure temporary password
                </label>
                {!owner.autoPassword && (
                  <input
                    type="text"
                    className={inputCls}
                    value={owner.password}
                    onChange={(e) => setOwner({ ...owner, password: e.target.value })}
                    placeholder="At least 8 characters"
                  />
                )}
              </Field>
            </div>
          </Section>
        )}

        {step === "basics" && (
          <Section title="Venue details" subtitle="What customers see at the top of the listing.">
            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="Venue name *">
                <input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Skyline Loft" />
              </Field>
              <Field label="Venue type">
                <select className={cn(inputCls, "bg-[#0D1612]")} value={form.venueType} onChange={(e) => set("venueType", e.target.value)}>
                  {VENUE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Tagline" hint="One line, shown on the venue card." className="sm:col-span-2">
                <input className={inputCls} maxLength={160} value={form.tagline} onChange={(e) => set("tagline", e.target.value)} placeholder="Rooftop loft with Manhattan skyline views" />
              </Field>
              <Field label="Description" className="sm:col-span-2">
                <textarea
                  rows={4}
                  className={inputCls}
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Describe the space, the vibe and what kind of events it suits."
                />
              </Field>
              <Field
                label="Street address *"
                hint="Search and pick the address — it fills in the neighborhood, city and map pin. You can still edit it below."
                className="sm:col-span-2"
              >
                <PlaceAutocomplete
                  placeholder="Search address, e.g. 123 Kent Ave Brooklyn"
                  onSelect={(p) =>
                    setForm((f) => ({
                      ...f,
                      address: p.address || p.name,
                      lat: p.lat,
                      lng: p.lng,
                      placeId: p.id,
                      neighborhood: p.neighborhood || f.neighborhood,
                      city: p.city || f.city
                    }))
                  }
                />
                <div className="mt-2 flex items-center gap-2">
                  <input
                    className={inputCls}
                    value={form.address}
                    // Typing by hand drops the old map pin so it can't point at the wrong place
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value, lat: undefined, lng: undefined, placeId: undefined }))}
                    placeholder="Selected address appears here (or type it manually)"
                  />
                  {form.lat !== undefined && form.lng !== undefined && (
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${form.lat}&mlon=${form.lng}#map=17/${form.lat}/${form.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 inline-flex items-center gap-1 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2.5 text-[11px] font-bold text-emerald-300"
                      title="Open map pin"
                    >
                      <MapPin className="w-3.5 h-3.5" /> On map
                    </a>
                  )}
                </div>
              </Field>
              <Field label="Neighborhood" hint="Used for search, e.g. Williamsburg.">
                <input className={inputCls} value={form.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} />
              </Field>
              <Field label="City">
                <input className={inputCls} value={form.city} onChange={(e) => set("city", e.target.value)} />
              </Field>
            </div>
          </Section>
        )}

        {step === "capacity" && (
          <Section title="Capacity & opening hours" subtitle="Customers only see time slots inside these hours.">
            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="Minimum guests *">
                <input type="number" min={1} className={inputCls} value={form.minGuests} onChange={(e) => set("minGuests", e.target.value === "" ? "" : Number(e.target.value))} />
              </Field>
              <Field label="Maximum guests *">
                <input type="number" min={1} className={inputCls} value={form.maxGuests} onChange={(e) => set("maxGuests", e.target.value === "" ? "" : Number(e.target.value))} />
              </Field>
              <Field
                label="Opening hours *"
                hint="Turn days on/off and set hours for each. A closing time before opening means it closes after midnight. The owner can change these later."
                className="sm:col-span-2"
              >
                <WeeklyHoursEditor value={form.weeklyHours} onChange={(h) => set("weeklyHours", h)} minHours={Number(form.minHours) || undefined} />
              </Field>
              <Field label="Start times every">
                <select className={cn(inputCls, "bg-[#0D1612]")} value={form.slotStepMins} onChange={(e) => set("slotStepMins", Number(e.target.value) === 30 ? 30 : 60)}>
                  <option value={60}>Hour (12:00, 13:00…)</option>
                  <option value={30}>Half hour (12:00, 12:30…)</option>
                </select>
              </Field>
            </div>
          </Section>
        )}

        {step === "pricing" && (
          <Section title="Pricing" subtitle="The venue's regular price. Tropica's commission is set separately by an admin.">
            <div className="grid sm:grid-cols-3 gap-5">
              <Field label="Pricing type">
                <select className={cn(inputCls, "bg-[#0D1612]")} value={form.pricingMode} onChange={(e) => set("pricingMode", e.target.value === "flat" ? "flat" : "hourly")}>
                  <option value="hourly">Per hour</option>
                  <option value="flat">Flat fee per booking</option>
                </select>
              </Field>
              <Field label={form.pricingMode === "hourly" ? "Price per hour ($)" : "Flat price ($)"}>
                <input type="number" min={0} className={inputCls} value={form.basePrice} onChange={(e) => set("basePrice", e.target.value === "" ? "" : Number(e.target.value))} placeholder="500" />
              </Field>
              <Field label="Minimum hours">
                <input type="number" min={1} max={24} className={inputCls} value={form.minHours} onChange={(e) => set("minHours", e.target.value === "" ? "" : Number(e.target.value))} />
              </Field>
            </div>

            <div className="mt-7 space-y-3">
              <div className="flex items-center justify-between">
                <p className={labelCls + " mb-0"}>Packages (optional)</p>
                <button
                  type="button"
                  onClick={() => set("packages", [...form.packages, { name: "", price: "", hours: Number(form.minHours) || 4, description: "" }])}
                  className="inline-flex items-center gap-1.5 text-xs text-[#C8A96A] font-bold uppercase tracking-wider"
                >
                  <Plus className="w-3.5 h-3.5" /> Add package
                </button>
              </div>
              {form.packages.length === 0 && (
                <p className="text-xs text-white/40">If the venue sells fixed packages (e.g. &quot;Half day — $2,000&quot;), add them here. Customers then pick a package instead of hours.</p>
              )}
              {form.packages.map((p, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-start bg-white/[0.03] border border-white/10 rounded-xl p-3">
                  <input className={cn(inputCls, "col-span-12 sm:col-span-4")} placeholder="Package name" value={p.name} onChange={(e) => set("packages", form.packages.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                  <input type="number" className={cn(inputCls, "col-span-5 sm:col-span-2")} placeholder="Price $" value={p.price} onChange={(e) => set("packages", form.packages.map((x, j) => (j === i ? { ...x, price: e.target.value === "" ? "" : Number(e.target.value) } : x)))} />
                  <input type="number" className={cn(inputCls, "col-span-5 sm:col-span-2")} placeholder="Hours" value={p.hours} onChange={(e) => set("packages", form.packages.map((x, j) => (j === i ? { ...x, hours: e.target.value === "" ? "" : Number(e.target.value) } : x)))} />
                  <button type="button" aria-label="Remove package" onClick={() => set("packages", form.packages.filter((_, j) => j !== i))} className="col-span-2 sm:col-span-1 h-10 flex items-center justify-center text-white/40 hover:text-rose-300">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <input className={cn(inputCls, "col-span-12 sm:col-span-3")} placeholder="What's included" value={p.description} onChange={(e) => set("packages", form.packages.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))} />
                </div>
              ))}
            </div>

            <p className="mt-6 text-xs text-white/50 bg-[#C8A96A]/5 border border-[#C8A96A]/20 rounded-xl p-3">
              Discounts and Tropica&apos;s commission are agreed with the owner and entered by an admin in <strong>Settings → Partner Venue Commission</strong>.
            </p>
          </Section>
        )}

        {step === "features" && (
          <Section title="Amenities & rules" subtitle="Helps customers decide, and powers the amenity filters.">
            <Field label="Amenities">
              <div className="flex flex-wrap gap-2">
                {[...new Set([...AMENITY_PRESETS, ...form.amenities])].map((a) => {
                  const on = form.amenities.includes(a);
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => set("amenities", on ? form.amenities.filter((x) => x !== a) : [...form.amenities, a])}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs",
                        on ? "border-[#C8A96A] bg-[#C8A96A]/15 text-[#C8A96A] font-semibold" : "border-white/15 text-white/60"
                      )}
                    >
                      {on && <Check className="inline w-3 h-3 mr-1" />}
                      {a}
                    </button>
                  );
                })}
              </div>
              <CustomAmenity onAdd={(a) => !form.amenities.includes(a) && set("amenities", [...form.amenities, a])} />
            </Field>
            <div className="grid sm:grid-cols-2 gap-5 mt-6">
              <Field label="House rules" hint="One rule per line.">
                <textarea rows={5} className={inputCls} value={form.rules} onChange={(e) => set("rules", e.target.value)} placeholder={"No confetti\nMusic off by 1:00 AM"} />
              </Field>
              <Field label="Cancellation policy">
                <textarea rows={5} className={inputCls} value={form.cancellationPolicy} onChange={(e) => set("cancellationPolicy", e.target.value)} placeholder="Full refund up to 14 days before the event…" />
              </Field>
              <Field label="Internal notes (staff only)" className="sm:col-span-2">
                <textarea rows={2} className={inputCls} value={form.internalNotes} onChange={(e) => set("internalNotes", e.target.value)} placeholder="Agreement details, best contact time…" />
              </Field>
            </div>
          </Section>
        )}

        {step === "brand" && (
          <Section title="Photos & theme" subtitle="The booking pages switch to these colors when a customer picks this venue. The owner can change them later.">
            <div className="grid sm:grid-cols-3 gap-4">
              <ImageSlot label="Logo" url={form.logoUrl} round busy={uploading === "logo"} onPick={async (f) => { const u = await upload(f, "logo"); if (u) set("logoUrl", u); }} onClear={() => set("logoUrl", "")} />
              <ImageSlot label="Cover photo" url={form.coverUrl} busy={uploading === "cover"} onPick={async (f) => { const u = await upload(f, "cover"); if (u) set("coverUrl", u); }} onClear={() => set("coverUrl", "")} />
              <ImageSlot label="Flyer" url={form.flyerUrl} busy={uploading === "flyer"} onPick={async (f) => { const u = await upload(f, "flyer"); if (u) set("flyerUrl", u); }} onClear={() => set("flyerUrl", "")} />
            </div>

            <div className="mt-5">
              <p className={labelCls}>Gallery photos</p>
              <div className="flex flex-wrap gap-3">
                {form.photos.map((p) => (
                  <div key={p} className="relative w-28 h-20 rounded-lg overflow-hidden border border-white/10">
                    <img src={p} alt="" className="w-full h-full object-cover" />
                    <button type="button" aria-label="Remove photo" onClick={() => set("photos", form.photos.filter((x) => x !== p))} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <label className="w-28 h-20 rounded-lg border border-dashed border-white/20 text-white/50 flex flex-col items-center justify-center text-[11px] cursor-pointer hover:border-[#C8A96A]">
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
                        if (u) setForm((prev) => ({ ...prev, photos: [...prev.photos, u] }));
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            <ThemeEditor theme={form.theme} onChange={(t) => set("theme", t)} venueName={form.name || "Your venue"} logoUrl={form.logoUrl} coverUrl={form.coverUrl} />
          </Section>
        )}

        {step === "review" && (
          <Section title="Review" subtitle={isEdit ? "Save your changes." : "Creating this sends the owner their login details."}>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              {!isEdit && (
                <ReviewCard title="Owner account" onEdit={() => setStepIndex(steps.findIndex((s) => s.key === "owner"))}>
                  <p className="text-white">{owner.name}</p>
                  <p className="text-white/60">{owner.email}{owner.phone && ` · ${owner.phone}`}</p>
                  <p className="text-white/40 text-xs flex items-center gap-1"><KeyRound className="w-3 h-3" /> {owner.autoPassword ? "Temporary password will be generated" : "Custom password"}</p>
                </ReviewCard>
              )}
              <ReviewCard title="Venue" onEdit={() => setStepIndex(steps.findIndex((s) => s.key === "basics"))}>
                <p className="text-white">{form.name}</p>
                <p className="text-white/60">{VENUE_TYPES.find((t) => t.value === form.venueType)?.label} · {form.neighborhood || form.city}</p>
                <p className="text-white/40 text-xs">{form.address}</p>
              </ReviewCard>
              <ReviewCard title="Capacity & hours" onEdit={() => setStepIndex(steps.findIndex((s) => s.key === "capacity"))}>
                <p className="text-white">{form.minGuests}–{form.maxGuests} guests</p>
                {[1, 2, 3, 4, 5, 6, 0].map((i) => {
                  const d = form.weeklyHours.find((x) => x.day === i);
                  return (
                    <p key={i} className={cn("text-xs flex justify-between gap-3", d?.open ? "text-white/70" : "text-white/30")}>
                      <span>{DAYS[i]}</span>
                      <span>{dayHoursLabel(d)}</span>
                    </p>
                  );
                })}
              </ReviewCard>
              <ReviewCard title="Pricing" onEdit={() => setStepIndex(steps.findIndex((s) => s.key === "pricing"))}>
                {Number(form.basePrice) > 0 && (
                  <p className="text-white">
                    {money(Number(form.basePrice))} {form.pricingMode === "hourly" ? "/ hour" : "flat"} · {form.minHours}h minimum
                  </p>
                )}
                {form.packages.filter((p) => p.name).map((p) => (
                  <p key={p.name} className="text-white/60">{p.name}: {money(Number(p.price))} ({p.hours}h)</p>
                ))}
              </ReviewCard>
              <ReviewCard title="Amenities & rules" onEdit={() => setStepIndex(steps.findIndex((s) => s.key === "features"))}>
                <p className="text-white/70">{form.amenities.join(", ") || "No amenities selected"}</p>
                <p className="text-white/40 text-xs">{form.rules.split("\n").filter(Boolean).length} rules</p>
              </ReviewCard>
              <ReviewCard title="Photos & theme" onEdit={() => setStepIndex(steps.findIndex((s) => s.key === "brand"))}>
                <div className="flex items-center gap-2">
                  {[form.theme.primary, form.theme.accent, form.theme.background, form.theme.onSurface].map((c, i) => (
                    <span key={i} className="w-5 h-5 rounded-full border border-white/30" style={{ background: c }} />
                  ))}
                  <span className="text-white/60 text-xs ml-1">
                    {[form.logoUrl && "logo", form.coverUrl && "cover", form.flyerUrl && "flyer"].filter(Boolean).join(", ") || "no images yet"}
                    {form.photos.length > 0 && ` + ${form.photos.length} photos`}
                  </span>
                </div>
              </ReviewCard>
            </div>
            {!isEdit && (
              <p className="mt-5 text-xs text-white/50">
                The venue goes <strong className="text-white">live for customers</strong> as soon as you create it. An admin sets Tropica&apos;s commission in Settings.
              </p>
            )}
          </Section>
        )}
      </div>

      {/* Footer nav */}
      <div className="mt-8 pt-5 border-t border-white/10 flex items-center justify-between">
        <button
          type="button"
          onClick={() => (stepIndex === 0 ? onClose() : setStepIndex((i) => i - 1))}
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/60 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" /> {stepIndex === 0 ? "Cancel" : "Back"}
        </button>
        {step === "review" ? (
          <button
            type="button"
            onClick={save}
            disabled={saving || Boolean(uploading)}
            className="inline-flex items-center gap-2 rounded-full bg-[#C8A96A] text-[#0d1612] px-7 py-3 text-xs font-bold uppercase tracking-widest disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {isEdit ? "Save changes" : "Create owner & venue"}
          </button>
        ) : (
          <button
            type="button"
            onClick={next}
            className="inline-flex items-center gap-2 rounded-full bg-[#C8A96A] text-[#0d1612] px-7 py-3 text-xs font-bold uppercase tracking-widest"
          >
            Next <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </Shell>
  );
};

/* ─── Pieces ─────────────────────────────────────────────────────────── */

const Shell = ({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) => (
  <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm overflow-y-auto p-3 sm:p-8" role="dialog" aria-modal="true">
    <div className="max-w-4xl mx-auto bg-[#0d1612] border border-white/10 rounded-2xl shadow-2xl p-5 sm:p-8">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-2xl font-headline italic text-white">{title}</h2>
        <button type="button" onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-full border border-white/15 text-white/60 hover:text-white flex items-center justify-center">
          <X className="w-4 h-4" />
        </button>
      </div>
      {children}
    </div>
  </div>
);

const Section = ({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) => (
  <div>
    <h3 className="text-lg font-bold text-white">{title}</h3>
    {subtitle && <p className="text-xs text-white/50 mb-6">{subtitle}</p>}
    {children}
  </div>
);

const ReviewCard = ({ title, onEdit, children }: { title: string; onEdit: () => void; children: ReactNode }) => (
  <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 space-y-1">
    <div className="flex items-center justify-between mb-1">
      <p className="text-[10px] uppercase tracking-widest text-[#C8A96A] font-bold">{title}</p>
      <button type="button" onClick={onEdit} className="text-[11px] text-white/50 hover:text-white underline">
        Edit
      </button>
    </div>
    {children}
  </div>
);

const CopyRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between gap-3">
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-widest text-white/40">{label}</p>
      <p className="text-white font-mono text-sm truncate">{value}</p>
    </div>
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(value);
        toast.success(`${label} copied`);
      }}
      className="shrink-0 w-8 h-8 rounded-lg border border-white/15 text-white/60 hover:text-white flex items-center justify-center"
      aria-label={`Copy ${label}`}
    >
      <Copy className="w-3.5 h-3.5" />
    </button>
  </div>
);

const CustomAmenity = ({ onAdd }: { onAdd: (a: string) => void }) => {
  const [value, setValue] = useState("");
  const add = () => {
    const v = value.trim();
    if (v) onAdd(v);
    setValue("");
  };
  return (
    <div className="flex gap-2 mt-3 max-w-sm">
      <input
        className={inputCls}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
        placeholder="Add another amenity"
      />
      <button type="button" onClick={add} className="shrink-0 rounded-xl border border-white/15 px-3 text-white/70 hover:text-white">
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
};

export const ImageSlot = ({
  label,
  url,
  round,
  busy,
  onPick,
  onClear
}: {
  label: string;
  url: string;
  round?: boolean;
  busy?: boolean;
  onPick: (f: File) => void;
  onClear: () => void;
}) => (
  <div>
    <p className={labelCls}>{label}</p>
    <label
      className={cn(
        "relative flex items-center justify-center border border-dashed border-white/20 bg-white/[0.03] cursor-pointer overflow-hidden hover:border-[#C8A96A]",
        round ? "w-28 h-28 rounded-full" : "w-full h-28 rounded-xl"
      )}
    >
      {url ? (
        <img src={url} alt="" className="w-full h-full object-cover" />
      ) : busy ? (
        <Loader2 className="w-5 h-5 animate-spin text-white/50" />
      ) : (
        <span className="flex flex-col items-center text-[11px] text-white/50">
          <ImagePlus className="w-5 h-5 mb-1" /> Upload
        </span>
      )}
      <input
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) onPick(f);
        }}
      />
    </label>
    {url && (
      <button type="button" onClick={onClear} className="mt-1.5 text-[11px] text-white/40 hover:text-rose-300">
        Remove
      </button>
    )}
  </div>
);

/** Preset + custom colors with a live preview rendered through VenueThemeProvider. */
export const ThemeEditor = ({
  theme,
  onChange,
  venueName,
  logoUrl,
  coverUrl
}: {
  theme: VenueTheme;
  onChange: (t: VenueTheme) => void;
  venueName: string;
  logoUrl?: string;
  coverUrl?: string;
}) => {
  const textContrast = contrastRatio(theme.onSurface, theme.background);
  const buttonContrast = contrastRatio(theme.onPrimary, theme.primary);
  return (
    <div className="mt-7 grid lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div>
          <p className={labelCls}>Start from a preset</p>
          <div className="flex flex-wrap gap-2">
            {THEME_PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => onChange({ ...p.theme })}
                className="flex items-center gap-2 rounded-full border border-white/15 pl-1.5 pr-3 py-1 text-xs text-white/70 hover:border-[#C8A96A]"
              >
                <span className="flex">
                  {[p.theme.primary, p.theme.background].map((c, i) => (
                    <span key={i} className="w-4 h-4 rounded-full border border-white/40 -ml-0.5 first:ml-0" style={{ background: c }} />
                  ))}
                </span>
                {p.name}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {THEME_FIELDS.map((f) => (
            <label key={f.key} className="flex items-center gap-3 bg-white/[0.03] border border-white/10 rounded-xl p-2.5 cursor-pointer">
              <input
                type="color"
                value={theme[f.key]}
                onChange={(e) => onChange({ ...theme, [f.key]: e.target.value.toUpperCase() })}
                className="w-9 h-9 rounded-lg bg-transparent border-0 cursor-pointer"
              />
              <span className="min-w-0">
                <span className="block text-xs text-white font-semibold">{f.label}</span>
                <span className="block text-[10px] text-white/40">{f.hint}</span>
              </span>
            </label>
          ))}
        </div>
        {(textContrast < 4.5 || buttonContrast < 3) && (
          <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
            {textContrast < 4.5 && "Text may be hard to read on this background. "}
            {buttonContrast < 3 && "Button text may be hard to read on the main color."}
          </p>
        )}
      </div>

      {/* Live preview — what customers see in the booking flow */}
      <div>
        <p className={labelCls}>Customer preview</p>
        <VenueThemeProvider theme={theme} className="rounded-2xl overflow-hidden border border-white/10 bg-brand-bg">
          <div
            className="h-24 bg-cover bg-center"
            style={coverUrl ? { backgroundImage: `url(${coverUrl})` } : { background: `linear-gradient(135deg, ${theme.background}, ${theme.primary})` }}
          />
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              {logoUrl ? (
                <img src={logoUrl} alt="" className="w-9 h-9 rounded-full object-cover border border-brand/50" />
              ) : (
                <span className="w-9 h-9 rounded-full bg-brand text-brand-ink flex items-center justify-center font-headline">{venueName.charAt(0)}</span>
              )}
              <div>
                <p className="font-headline text-lg text-brand-fg leading-tight">{venueName}</p>
                <p className="text-[10px] uppercase tracking-widest text-brand-fg/50">Booked through Tropica NYC</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {["6:00 PM", "7:00 PM", "8:00 PM"].map((t, i) => (
                <span
                  key={t}
                  className={cn(
                    "rounded-lg border py-2 text-center text-xs",
                    i === 1 ? "border-brand bg-brand text-brand-ink font-bold" : "border-brand-fg/15 text-brand-fg"
                  )}
                >
                  {t}
                </span>
              ))}
            </div>
            <div className="rounded-xl bg-surface p-3 text-xs text-brand-fg/80 flex justify-between">
              <span>Total</span>
              <span className="text-brand-light font-bold">$1,900</span>
            </div>
            <span className="block text-center rounded-full bg-brand text-brand-ink py-2.5 text-[11px] font-bold uppercase tracking-widest">
              Send booking request
            </span>
          </div>
        </VenueThemeProvider>
      </div>
    </div>
  );
};

export default VenueOwnerWizard;
