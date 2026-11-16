"use client";

import { CSSProperties, ReactNode, useEffect, useMemo } from "react";
import type { VenueTheme } from "@/types";

/** "#RRGGBB" → "R G B" (the channel format our Tailwind CSS variables use). */
export const hexToChannels = (hex?: string): string | null => {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex || "");
  if (!m) return null;
  return `${parseInt(m[1], 16)} ${parseInt(m[2], 16)} ${parseInt(m[3], 16)}`;
};

/** Relative luminance (WCAG) — used for the owner's contrast warning. */
export const luminance = (hex: string): number => {
  const ch = hexToChannels(hex);
  if (!ch) return 0;
  const [r, g, b] = ch.split(" ").map((v) => {
    const c = Number(v) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const contrastRatio = (a: string, b: string): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/** Map a venue theme onto every CSS variable the booking UI reads. */
export const themeToCssVars = (theme?: VenueTheme | null): Record<string, string> => {
  if (!theme) return {};
  const pairs: Array<[string, string | undefined]> = [
    // Booking-wizard brand tokens (bg-brand, text-brand-fg, …)
    ["--brand", theme.primary],
    ["--brand-light", theme.accent],
    ["--brand-ink", theme.onPrimary],
    ["--brand-fg", theme.onSurface],
    ["--brand-bg", theme.background],
    // Material-style tokens (bg-primary, bg-background, text-on-surface, …)
    ["--primary", theme.primary],
    ["--on-primary", theme.onPrimary],
    ["--primary-container", theme.primaryContainer],
    ["--background", theme.background],
    ["--surface", theme.surface],
    ["--surface-container", theme.surface],
    ["--surface-container-low", theme.surface],
    ["--surface-container-high", theme.surface],
    ["--on-surface", theme.onSurface],
    ["--secondary", theme.accent]
  ];
  const vars: Record<string, string> = {};
  for (const [name, hex] of pairs) {
    const ch = hexToChannels(hex);
    if (ch) vars[name] = ch;
  }
  return vars;
};

interface Props {
  theme?: VenueTheme | null;
  children: ReactNode;
  className?: string;
  /**
   * Also apply the variables to <html> so the page background, nav bar and anything
   * outside this wrapper switch too. Cleaned up when the theme is cleared or unmounted.
   */
  applyToDocument?: boolean;
}

/**
 * Re-skins everything inside it with a partner venue's colors. With no theme it renders
 * children untouched, so Tropica's own flow keeps its default look.
 */
export const VenueThemeProvider = ({ theme, children, className, applyToDocument = false }: Props) => {
  const vars = useMemo(() => themeToCssVars(theme), [theme]);

  useEffect(() => {
    if (!applyToDocument || !Object.keys(vars).length) return;
    const root = document.documentElement;
    const previous = Object.keys(vars).map((k) => [k, root.style.getPropertyValue(k)] as const);
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
    return () => {
      previous.forEach(([k, v]) => (v ? root.style.setProperty(k, v) : root.style.removeProperty(k)));
    };
  }, [vars, applyToDocument]);

  return (
    <div className={className} style={vars as CSSProperties} data-venue-themed={theme ? "true" : undefined}>
      {children}
    </div>
  );
};

export default VenueThemeProvider;
