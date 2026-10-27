import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTimeTo12Hour(timeStr: string | null | undefined): string {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  if (parts.length < 2) return timeStr;
  const hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  if (isNaN(hours)) return timeStr;
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes} ${ampm}`;
}

/**
 * Safely formats a booking calendar date (e.g. "2026-11-01" or "2026-11-01T00:00:00.000Z")
 * in a timezone-safe way.
 * Because booking dates are calendar dates stored as UTC midnight, interpreting them in a Western
 * timezone (such as US Eastern EDT/EST) shifts the date backward by 1 full day (e.g., Nov 1 becomes Oct 31).
 * This helper ensures the exact calendar date (YYYY-MM-DD) is preserved and displayed identically
 * across all client and server timezones.
 */
export function formatBookingDate(
  dateInput: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateInput) return "—";
  let d: Date;
  if (typeof dateInput === "string") {
    // If it has YYYY-MM-DD prefix, parse year/month/day directly to avoid timezone offset shifts
    if (/^\d{4}-\d{2}-\d{2}/.test(dateInput)) {
      const [year, month, day] = dateInput.slice(0, 10).split("-").map(Number);
      d = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    } else {
      d = new Date(dateInput);
    }
  } else if (dateInput instanceof Date) {
    d = new Date(Date.UTC(dateInput.getUTCFullYear(), dateInput.getUTCMonth(), dateInput.getUTCDate(), 12, 0, 0));
  } else {
    d = new Date(dateInput);
  }

  if (isNaN(d.getTime())) return "—";

  const defaultOptions: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
    ...options
  };

  return d.toLocaleDateString("en-US", defaultOptions);
}

/**
 * Formats an instant timestamp (such as booking createdAt / triedDate) in US Eastern Time
 * (New York / Brooklyn venue local time: America/New_York).
 */
export function formatVenueDateTime(
  dateInput: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateInput) return "—";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "—";

  return d.toLocaleString("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    ...options
  });
}


