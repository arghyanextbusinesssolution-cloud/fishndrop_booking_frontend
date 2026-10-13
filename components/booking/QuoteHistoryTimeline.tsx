"use client";

import { useState } from "react";
import { Booking, QuoteHistoryItem } from "@/types";
import {
  History,
  ChevronDown,
  ChevronUp,
  Send,
  CheckCircle2,
  XCircle,
  UtensilsCrossed,
  Sparkles,
  Calendar,
  Clock,
  User,
  ShieldCheck,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CATERING_LABEL_MAP } from "@/lib/cateringRestaurants";

function formatDateTime(dateStr?: string | Date) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

interface QuoteHistoryTimelineProps {
  booking: Booking;
  defaultExpanded?: boolean;
}

export function QuoteHistoryTimeline({ booking, defaultExpanded = false }: QuoteHistoryTimelineProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // If booking has quoteHistory, use it. Otherwise, synthesize history from booking state
  const rawHistory: QuoteHistoryItem[] = booking.quoteHistory && booking.quoteHistory.length > 0
    ? booking.quoteHistory
    : (() => {
        const synth: QuoteHistoryItem[] = [];
        // 1. Initial inquiry
        synth.push({
          action: "inquiry_created",
          actor: "user",
          actorName: booking.customerName || "Customer",
          cateringMenu: booking.cateringMenu,
          notes: booking.notes || "Initial buyout inquiry submitted",
          createdAt: booking.bookingDate || new Date().toISOString()
        });

        // 2. If quote was offered
        if (booking.offerPrice) {
          synth.push({
            action: "quote_sent",
            actor: "admin",
            actorName: "Tropica Admin",
            price: booking.offerPrice,
            notes: booking.negotiationNotes || "Custom event package quote",
            createdAt: booking.bookingDate || new Date().toISOString()
          });

          // 3. If accepted or declined
          if (booking.offerStatus === "accepted") {
            synth.push({
              action: "quote_accepted",
              actor: "user",
              actorName: booking.customerName || "Customer",
              price: booking.offerPrice,
              notes: "Guest accepted the custom quoted package",
              createdAt: new Date().toISOString()
            });
          } else if (booking.offerStatus === "declined") {
            synth.push({
              action: "quote_rejected",
              actor: "user",
              actorName: booking.customerName || "Customer",
              price: booking.offerPrice,
              notes: "Guest declined the quote proposal",
              createdAt: new Date().toISOString()
            });
          }
        }
        return synth;
      })();

  return (
    <div className="w-full rounded-xl border border-outline-variant/15 bg-surface-container-low/40 overflow-hidden">
      {/* Expand/Collapse Toggle Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded((prev) => !prev);
        }}
        className="w-full px-4 py-3 flex items-center justify-between text-xs hover:bg-surface-container-low transition-colors select-none text-left"
      >
        <div className="flex items-center gap-2">
          <History className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="font-bold uppercase tracking-wider text-on-surface">
            Negotiation &amp; Menu History
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-primary/10 text-primary border border-primary/20">
            {rawHistory.length} {rawHistory.length === 1 ? "event" : "events"}
          </span>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-secondary">
          <span>{isExpanded ? "Collapse History" : "Expand History"}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>

      {/* Expanded Timeline Content */}
      {isExpanded && (
        <div className="p-4 pt-2 border-t border-outline-variant/10 space-y-4 animate-in fade-in duration-200">
          <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-outline-variant/20">
            {rawHistory.map((item, idx) => {
              const isLast = idx === rawHistory.length - 1;

              // Action styles
              let icon = <Sparkles className="w-3.5 h-3.5 text-primary" />;
              let title = "Event Updated";
              let badgeBg = "bg-primary/10 text-primary border-primary/20";

              if (item.action === "quote_sent") {
                icon = <Send className="w-3.5 h-3.5 text-[#C8A96A]" />;
                title = `Admin Sent Quote: $${item.price?.toFixed(2) || "0.00"}`;
                badgeBg = "bg-[#C8A96A]/20 text-[#E8CB8A] border-[#C8A96A]/40";
              } else if (item.action === "quote_accepted") {
                icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
                title = `Quote Accepted by Customer ($${item.price?.toFixed(2) || "0.00"})`;
                badgeBg = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
              } else if (item.action === "quote_rejected") {
                icon = <XCircle className="w-3.5 h-3.5 text-red-400" />;
                title = "Quote Declined by Customer";
                badgeBg = "bg-red-500/10 text-red-400 border-red-500/30";
              } else if (item.action === "menu_updated") {
                icon = <UtensilsCrossed className="w-3.5 h-3.5 text-blue-400" />;
                title = "Menu Dishes / Preferences Updated";
                badgeBg = "bg-blue-500/10 text-blue-400 border-blue-500/30";
              } else if (item.action === "inquiry_created") {
                icon = <Calendar className="w-3.5 h-3.5 text-amber-400" />;
                title = "Initial Buyout Inquiry Submitted";
                badgeBg = "bg-amber-500/10 text-amber-400 border-amber-500/30";
              }

              return (
                <div key={idx} className="relative group text-xs">
                  {/* Timeline Node Dot */}
                  <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-surface-container border border-outline-variant/40 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  </div>

                  <div className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/10 space-y-1.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        {icon}
                        <span className="font-headline italic text-on-surface text-sm font-semibold">
                          {title}
                        </span>
                      </div>
                      <span className="text-[10px] text-outline font-mono">
                        {formatDateTime(item.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-secondary flex-wrap">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-outline" />
                        <span>By {item.actorName || (item.actor === "admin" ? "Admin" : "Customer")}</span>
                      </span>
                      {item.cateringMenu && (
                        <span>
                          • Restaurant: <strong className="text-on-surface">{CATERING_LABEL_MAP[item.cateringMenu] || item.cateringMenu}</strong>
                        </span>
                      )}
                    </div>

                    {/* Dishes badges if menu updated */}
                    {item.dishes && item.dishes.length > 0 && (
                      <div className="pt-1 flex flex-wrap gap-1">
                        {item.dishes.map((dish, dI) => (
                          <span
                            key={dI}
                            className="px-2 py-0.5 rounded text-[10px] bg-white/5 border border-white/10 text-on-surface"
                          >
                            {dish}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Notes / Terms */}
                    {item.notes && (
                      <p className="text-[11px] text-secondary leading-relaxed bg-surface-container-low/40 p-2 rounded-lg border border-outline-variant/10 italic">
                        &ldquo;{item.notes}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
