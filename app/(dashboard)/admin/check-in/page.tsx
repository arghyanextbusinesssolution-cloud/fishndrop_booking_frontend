"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import { CameraQrScanner } from "@/components/checkin/CameraQrScanner";
import {
  Scan,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserCheck,
  Ticket,
  Calendar,
  Clock,
  ShieldCheck,
  RefreshCw
} from "lucide-react";

/** QR may hold the raw token or a full ticket URL (…/tickets/<token>). */
const extractToken = (raw: string): string => {
  const value = raw.trim();
  const match = value.match(/\/tickets\/([A-Za-z0-9-]+)\/?(?:[?#].*)?$/);
  return match ? match[1] : value;
};

interface ScanResult {
  success: boolean;
  code: string;
  message: string;
  ticket?: {
    ticketCode: string;
    customerName: string;
    customerEmail?: string;
    tierName: string;
    eventTitle?: string;
    checkedInAt?: string;
    checkedInByName?: string;
  };
}

export default function AdminCheckInPage() {
  const [activeTab, setActiveTab] = useState<"scan" | "search">("scan");
  const [inputCode, setInputCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);

  // Manual search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleProcessScan = async (codeToVerify?: string) => {
    const code = extractToken(codeToVerify || inputCode);
    if (!code) {
      toast.error("Please enter or scan a ticket code / QR token");
      return;
    }

    setIsProcessing(true);
    setLastResult(null);

    try {
      const { data } = await api.post("/check-in/scan", { token: code });
      setLastResult(data);
      if (data.success) {
        toast.success(data.message);
        setInputCode("");
      } else {
        toast.error(data.message);
      }
    } catch (err: any) {
      const errorData = err.response?.data;
      if (errorData) {
        setLastResult(errorData);
        toast.error(errorData.message || "Ticket rejected");
      } else {
        setLastResult({
          success: false,
          code: "ERROR",
          message: "Network or server error verifying ticket"
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      toast.error("Please enter at least 2 characters");
      return;
    }

    setIsSearching(true);
    try {
      const { data } = await api.get(`/check-in/search?q=${encodeURIComponent(searchQuery)}`);
      if (data.success) {
        setSearchResults(data.tickets || []);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Search failed");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-2xl mx-auto space-y-6 min-h-screen">
      {/* Header */}
      <div className="text-center space-y-1">
        <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-[#C8A96A] block">
          Venue Door Control
        </span>
        <h1 className="text-3xl font-headline italic text-white">Door QR Check-In</h1>
        <p className="text-xs text-white/60">
          Scan QR passes or search guest name to validate admissions and prevent duplicates.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 gap-1">
        <button
          onClick={() => setActiveTab("scan")}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === "scan"
              ? "bg-[#C8A96A] text-black shadow-md"
              : "text-white/60 hover:text-white"
          }`}
        >
          <Scan className="w-4 h-4" /> QR Scanner / Code
        </button>
        <button
          onClick={() => setActiveTab("search")}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === "search"
              ? "bg-[#C8A96A] text-black shadow-md"
              : "text-white/60 hover:text-white"
          }`}
        >
          <Search className="w-4 h-4" /> Manual Guest Search
        </button>
      </div>

      {/* Tab 1: Scanner Input */}
      {activeTab === "scan" && (
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-5 shadow-2xl">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-[#C8A96A]/10 border border-[#C8A96A]/30 flex items-center justify-center mx-auto text-[#C8A96A]">
              <Scan className="w-8 h-8" />
            </div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Scan or Enter Pass Token
            </h2>
            <p className="text-[11px] text-white/50 max-w-xs mx-auto">
              Scan the guest&apos;s QR with this device&apos;s camera, or type the Ticket Code below.
            </p>
          </div>

          <CameraQrScanner paused={isProcessing} onDetected={(value) => handleProcessScan(value)} />

          <div className="flex items-center gap-3 text-[10px] uppercase tracking-wider text-white/30">
            <span className="h-px flex-1 bg-white/10" /> or enter code <span className="h-px flex-1 bg-white/10" />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleProcessScan();
            }}
            className="space-y-3"
          >
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="e.g. TRP-TK-8F4A2B or QR Token"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3.5 text-center font-mono text-base text-white tracking-wider placeholder-white/30 focus:outline-none focus:border-[#C8A96A]"
            />

            <button
              type="submit"
              disabled={isProcessing || !inputCode.trim()}
              className="w-full py-3.5 bg-[#C8A96A] hover:bg-[#d8b97a] text-[#070B09] font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(200,169,106,0.3)] disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isProcessing ? "Validating Admission..." : "Validate & Check In"}
            </button>
          </form>

          {/* Result Banner */}
          {lastResult && (
            <div
              className={`rounded-2xl p-5 border text-center space-y-3 animate-fade-in ${
                lastResult.code === "CHECK_IN_SUCCESS"
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                  : lastResult.code === "ALREADY_CHECKED_IN"
                  ? "bg-red-500/15 border-red-500/40 text-red-300"
                  : "bg-amber-500/15 border-amber-500/40 text-amber-300"
              }`}
            >
              <div className="flex items-center justify-center">
                {lastResult.code === "CHECK_IN_SUCCESS" ? (
                  <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                ) : lastResult.code === "ALREADY_CHECKED_IN" ? (
                  <XCircle className="w-12 h-12 text-red-400" />
                ) : (
                  <AlertTriangle className="w-12 h-12 text-amber-400" />
                )}
              </div>

              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wider">
                  {lastResult.code.replace(/_/g, " ")}
                </h3>
                <p className="text-xs font-medium mt-1">{lastResult.message}</p>
              </div>

              {lastResult.ticket && (
                <div className="bg-black/40 rounded-xl p-3 text-left space-y-1 text-xs border border-white/10">
                  <div className="text-white font-bold">{lastResult.ticket.customerName}</div>
                  <div className="text-[#C8A96A] font-semibold">{lastResult.ticket.tierName}</div>
                  <div className="text-white/60 font-mono text-[11px]">{lastResult.ticket.ticketCode}</div>
                  {lastResult.ticket.checkedInByName && (
                    <div className="text-white/40 text-[10px] pt-1">
                      Processed by: {lastResult.ticket.checkedInByName}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Manual Search */}
      {activeTab === "search" && (
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-5 shadow-2xl">
          <form onSubmit={handleSearch} className="space-y-3">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search guest name, email, phone, or ticket code..."
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pl-10 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#C8A96A]"
              />
              <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-3.5" />
            </div>

            <button
              type="submit"
              disabled={isSearching}
              className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSearching ? "Searching..." : "Search Tickets"}
            </button>
          </form>

          {/* Search Results */}
          <div className="space-y-3 pt-2">
            {searchResults.length === 0 && !isSearching && searchQuery && (
              <p className="text-center text-xs text-white/40 py-4">No matching tickets found.</p>
            )}

            {searchResults.map((t) => (
              <div
                key={t._id}
                className="bg-white/[0.02] border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{t.customerName}</span>
                    {t.checkedIn ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                        Checked In
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                        Valid Pass
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#C8A96A] font-semibold">{t.tierName} &bull; {t.event?.title}</div>
                  <div className="text-[11px] text-white/50 font-mono">{t.ticketCode} &bull; {t.customerPhone}</div>
                </div>

                {!t.checkedIn ? (
                  <button
                    onClick={() => handleProcessScan(t.ticketCode)}
                    disabled={isProcessing}
                    className="inline-flex items-center gap-1.5 bg-[#C8A96A] hover:bg-[#d8b97a] text-black px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all self-start sm:self-auto cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" /> Check In
                  </button>
                ) : (
                  <div className="text-right text-[11px] text-white/40">
                    Checked in {t.checkedInAt ? new Date(t.checkedInAt).toLocaleTimeString("en-US") : ""}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

