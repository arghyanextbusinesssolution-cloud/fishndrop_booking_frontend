"use client";

import { useEffect, useRef, useState } from "react";
import api from "@/lib/axios";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { cn } from "@/lib/utils";
import { CreditCard, Users, DollarSign, Calendar } from "lucide-react";

interface TourCheckout {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  amount: number;   // already in dollars (backend divides cents by 100)
  status: string;
  created: string;  // ISO date string from backend
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    succeeded: {
      label: "Succeeded",
      cls: "bg-emerald-900/40 text-emerald-300 border-emerald-700",
    },
    processing: {
      label: "Processing",
      cls: "bg-amber-900/40 text-amber-300 border-amber-700",
    },
    payment_failed: {
      label: "Failed",
      cls: "bg-red-900/40 text-red-300 border-red-700",
    },
    requires_payment_method: {
      label: "Incomplete",
      cls: "bg-orange-900/40 text-orange-300 border-orange-700",
    },
    requires_confirmation: {
      label: "Pending",
      cls: "bg-blue-900/40 text-blue-300 border-blue-700",
    },
  };
  const cfg = map[status] ?? {
    label: status,
    cls: "bg-zinc-800 text-zinc-400 border-zinc-600",
  };
  return (
    <span
      className={cn(
        "inline-block rounded-full border px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest",
        cfg.cls
      )}
    >
      {cfg.label}
    </span>
  );
}

function formatDate(isoStr: string) {
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminTourCheckoutsPage() {
  const [checkouts, setCheckouts] = useState<TourCheckout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const load = async () => {
      try {
        const { data } = await api.get("/payments/tour-checkouts");
        setCheckouts(data.tourCheckouts ?? []);
      } catch (err) {
        setError("Failed to load tour checkout data.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  if (loading) return <LoadingSpinner />;

  const succeeded = checkouts.filter((c) => c.status === "succeeded");
  const totalRevenue = succeeded.reduce((acc, c) => acc + c.amount, 0);

  const stats = [
    {
      label: "Total Submissions",
      value: checkouts.length,
      icon: Users,
      sub: "Physical tour requests",
    },
    {
      label: "Confirmed Payments",
      value: succeeded.length,
      icon: CreditCard,
      sub: "Stripe succeeded",
    },
    {
      label: "Revenue Collected",
      value: `$${totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      sub: "$25 × confirmed",
    },
    {
      label: "Pending / Incomplete",
      value: checkouts.length - succeeded.length,
      icon: Calendar,
      sub: "Not yet succeeded",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a2318] p-6 text-white">
      {/* Header */}
      <div className="mb-8">
        <p className="mb-1 text-xs uppercase tracking-[0.2em] text-[#7a9e8e]">
          Admin · Physical Tour
        </p>
        <h1 className="font-heading text-3xl text-[#c8a96e]">
          Venue Booking Checkout
        </h1>
        <p className="mt-1 text-sm text-[#7a9e8e]">
          All $25 physical tour deposits collected via Stripe
        </p>
      </div>

      {/* Stat Cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-[#1e4535] bg-[#0F2D24] p-5"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs uppercase tracking-widest text-[#7a9e8e]">
                {s.label}
              </p>
              <s.icon className="h-4 w-4 text-[#c8a96e]" />
            </div>
            <p className="font-heading text-2xl text-white">{s.value}</p>
            <p className="mt-1 text-[11px] text-[#5a7e6e]">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-700 bg-red-900/20 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Table */}
      {checkouts.length === 0 ? (
        <div className="rounded-xl border border-[#1e4535] bg-[#0F2D24] py-20 text-center">
          <CreditCard className="mx-auto mb-4 h-10 w-10 text-[#2e5a40]" />
          <p className="text-[#7a9e8e]">No tour deposits found yet.</p>
          <p className="mt-1 text-xs text-[#4a6e5e]">
            Completed $25 tour bookings will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#1e4535] bg-[#0F2D24]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1e4535] text-left">
                {["#", "Customer", "Phone", "Email", "Amount", "Status", "Date"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-[#7a9e8e]"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {checkouts.map((c, i) => (
                <tr
                  key={c.id}
                  className="border-b border-[#132b1e] transition-colors hover:bg-[#0d2a1c]"
                >
                  <td className="px-4 py-3 text-xs text-[#5a7e6e]">
                    {i + 1}
                  </td>
                  <td className="px-4 py-3 font-medium text-white">
                    {c.customerName || (
                      <span className="text-[#5a7e6e] italic">Unknown</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#aac4b4]">
                    {c.customerPhone || (
                      <span className="text-[#5a7e6e]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#aac4b4]">
                    {c.customerEmail || (
                      <span className="text-[#5a7e6e]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold text-[#c8a96e]">
                    ${c.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-[#7a9e8e]">
                    {formatDate(c.created)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
