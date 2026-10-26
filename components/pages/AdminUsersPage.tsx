"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuthStore } from "@/store/authStore";
import { AdminUser } from "@/types";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { cn } from "@/lib/utils";
import {
  Users,
  Search,
  Trash2,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  Phone,
  Mail,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckSquare,
  Square,
  AlertTriangle,
  Sparkles,
  UserCheck,
  RefreshCw,
  UserX
} from "lucide-react";

function formatDateTime(dateStr?: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function RoleBadge({ role }: { role: string }) {
  const isAdmin = role === "admin" || role === "owner";
  return (
    <span
      className={cn(
        "px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-widest font-extrabold border inline-flex items-center gap-1",
        isAdmin
          ? "bg-[#C8A96A]/15 text-[#E8CB8A] border-[#C8A96A]/30"
          : "bg-surface-container text-secondary border-outline-variant/20"
      )}
    >
      {isAdmin ? <ShieldCheck className="w-3 h-3 text-[#C8A96A]" /> : null}
      {role}
    </span>
  );
}

function VerificationBadge({ isVerified }: { isVerified?: boolean }) {
  if (isVerified) {
    return (
      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
        Verified
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
      <ShieldAlert className="w-3 h-3 text-amber-600" />
      Unverified
    </span>
  );
}

export default function AdminUsersPage() {
  const { getAllUsers, deleteUser, deleteBulkUsers } = useAdmin();
  const { user: currentUser } = useAuthStore();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "users" | "admins" | "verified">("all");
  const [counts, setCounts] = useState({
    totalUsers: 0,
    verifiedUsers: 0,
    adminUsers: 0
  });

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pendingDeleteAction, setPendingDeleteAction] = useState<{
    type: "single" | "bulk";
    userId?: string;
    userName?: string;
    count?: number;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const roleParam = activeTab === "admins" ? "admin" : activeTab === "users" ? "user" : "all";
      const verifiedParam = activeTab === "verified" ? "true" : "all";
      const data = await getAllUsers(page, search, roleParam, verifiedParam);
      setUsers(data.users);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      if (data.counts) {
        setCounts(data.counts);
      }
    } catch {
      setUsers([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [getAllUsers, page, search, activeTab]);

  useEffect(() => {
    void load();
  }, [load]);

  // Clean selections when page or filters change
  useEffect(() => {
    setSelectedIds([]);
  }, [page, activeTab, search]);

  const isAllOnPageSelected = useMemo(() => {
    if (users.length === 0) return false;
    const selectableUsers = users.filter((u) => u._id !== currentUser?.id);
    if (selectableUsers.length === 0) return false;
    return selectableUsers.every((u) => selectedIds.includes(u._id));
  }, [users, selectedIds, currentUser?.id]);

  const handleToggleSelectAll = () => {
    const selectableUsers = users.filter((u) => u._id !== currentUser?.id);
    if (isAllOnPageSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(selectableUsers.map((u) => u._id));
    }
  };

  const handleToggleSelect = (userId: string) => {
    if (userId === currentUser?.id) {
      toast.error("You cannot select your own active admin account");
      return;
    }
    setSelectedIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteAction) return;

    if (pendingDeleteAction.type === "single" && pendingDeleteAction.userId) {
      try {
        await deleteUser(pendingDeleteAction.userId);
        toast.success(`User ${pendingDeleteAction.userName || ""} deleted successfully`);
        setSelectedIds((prev) => prev.filter((id) => id !== pendingDeleteAction.userId));
        await load();
      } catch (err: any) {
        toast.error(err.message || "Failed to delete user");
      }
    } else if (pendingDeleteAction.type === "bulk" && selectedIds.length > 0) {
      try {
        const res = await deleteBulkUsers(selectedIds);
        toast.success(res.message || `Deleted ${selectedIds.length} users`);
        setSelectedIds([]);
        await load();
      } catch (err: any) {
        toast.error(err.message || "Failed to bulk delete users");
      }
    }

    setPendingDeleteAction(null);
  };

  return (
    <div className="p-6 md:p-10 space-y-8 min-h-screen max-w-7xl mx-auto">
      {/* Confirm Deletion Dialog */}
      <ConfirmDialog
        open={!!pendingDeleteAction}
        title={
          pendingDeleteAction?.type === "bulk"
            ? `Delete ${selectedIds.length} Selected Users`
            : `Delete User: ${pendingDeleteAction?.userName || "Account"}`
        }
        message={
          pendingDeleteAction?.type === "bulk"
            ? `Are you sure you want to permanently delete all ${selectedIds.length} selected user accounts? This cannot be undone.`
            : `Are you sure you want to permanently delete this user account? All access for this phone/email will be removed.`
        }
        confirmLabel={pendingDeleteAction?.type === "bulk" ? `Delete (${selectedIds.length})` : "Delete User"}
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDeleteAction(null)}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant/15 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-label text-[9px] tracking-[0.3em] uppercase text-emerald-600 font-bold block flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Customer &amp; User Accounts
            </span>
          </div>
          <h1 className="font-headline text-3xl md:text-5xl text-on-surface italic font-serif">
            User Directory
          </h1>
          <p className="text-sm text-secondary font-light">
            Manage customer accounts, search by phone number or email, review reservation histories, and perform multi-select bulk operations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => void load()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-outline-variant/30 text-xs font-bold uppercase tracking-wider text-secondary hover:text-on-surface hover:bg-surface-container transition-all"
            title="Refresh directory"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading ? "animate-spin text-emerald-600" : "")} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => { setActiveTab("all"); setPage(1); }}
          className={cn(
            "p-5 rounded-2xl border transition-all cursor-pointer",
            activeTab === "all"
              ? "bg-emerald-500/10 border-emerald-500/40 shadow-sm"
              : "bg-surface-container-lowest border-outline-variant/15 hover:border-outline-variant/40"
          )}
        >
          <span className="text-[10px] uppercase tracking-widest text-emerald-700 font-bold block mb-1">
            👥 Total Registered Accounts
          </span>
          <div className="flex items-baseline justify-between">
            <span className="font-headline text-3xl italic text-on-surface">{counts.totalUsers}</span>
            <span className="text-xs text-secondary font-light">All profiles</span>
          </div>
        </div>

        <div
          onClick={() => { setActiveTab("verified"); setPage(1); }}
          className={cn(
            "p-5 rounded-2xl border transition-all cursor-pointer",
            activeTab === "verified"
              ? "bg-blue-500/10 border-blue-500/40 shadow-sm"
              : "bg-surface-container-lowest border-outline-variant/15 hover:border-outline-variant/40"
          )}
        >
          <span className="text-[10px] uppercase tracking-widest text-blue-600 font-bold block mb-1">
            📱 Phone-Verified Users
          </span>
          <div className="flex items-baseline justify-between">
            <span className="font-headline text-3xl italic text-on-surface">{counts.verifiedUsers}</span>
            <span className="text-xs text-secondary font-light">OTP &amp; Manual Verified</span>
          </div>
        </div>

        <div
          onClick={() => { setActiveTab("admins"); setPage(1); }}
          className={cn(
            "p-5 rounded-2xl border transition-all cursor-pointer",
            activeTab === "admins"
              ? "bg-amber-500/10 border-amber-500/40 shadow-sm"
              : "bg-surface-container-lowest border-outline-variant/15 hover:border-outline-variant/40"
          )}
        >
          <span className="text-[10px] uppercase tracking-widest text-amber-700 font-bold block mb-1">
            🛡️ Admins &amp; Staff
          </span>
          <div className="flex items-baseline justify-between">
            <span className="font-headline text-3xl italic text-on-surface">{counts.adminUsers}</span>
            <span className="text-xs text-secondary font-light">Elevated privileges</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-outline absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search by name, phone (+1...), or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs text-on-surface focus:outline-none focus:border-emerald-600"
          />
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { key: "all", label: "All Users" },
            { key: "users", label: "Customers" },
            { key: "verified", label: "Verified" },
            { key: "admins", label: "Admins" }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key as any);
                setPage(1);
              }}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap",
                activeTab === tab.key
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-surface-container/60 text-secondary hover:bg-surface-container hover:text-on-surface"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Floating / Sticky Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-emerald-950 text-white px-5 py-3.5 rounded-2xl flex items-center justify-between gap-4 shadow-xl border border-emerald-800 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-emerald-700 flex items-center justify-center text-xs font-bold">
              {selectedIds.length}
            </span>
            <span className="text-xs font-semibold">
              {selectedIds.length} {selectedIds.length === 1 ? "user" : "users"} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 rounded-lg border border-white/20 text-[10px] uppercase tracking-wider font-bold hover:bg-white/10 transition-colors"
            >
              Deselect All
            </button>
            <button
              onClick={() =>
                setPendingDeleteAction({
                  type: "bulk",
                  count: selectedIds.length
                })
              }
              className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[10px] uppercase tracking-wider font-bold shadow-md flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-3">
            <LoadingSpinner />
            <p className="text-xs text-secondary font-light">Loading user accounts...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-4 text-center">
            <UserX className="w-12 h-12 text-outline/30" />
            <div className="space-y-1">
              <p className="font-headline text-xl italic text-secondary">No user accounts found</p>
              <p className="text-xs text-outline font-light">
                {search ? "Try adjusting your search criteria" : "New users will appear here automatically when created."}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container/60 border-b border-outline-variant/10 text-[9px] uppercase tracking-widest text-outline font-bold">
                <tr>
                  <th className="px-4 py-3.5 w-10">
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      className="p-1 rounded hover:bg-surface-container text-secondary transition-colors"
                      title={isAllOnPageSelected ? "Deselect all on this page" : "Select all on this page"}
                    >
                      {isAllOnPageSelected ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Square className="w-4 h-4 text-outline" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3.5">User / Host</th>
                  <th className="px-4 py-3.5">Phone Number</th>
                  <th className="px-4 py-3.5">Email</th>
                  <th className="px-4 py-3.5">Role</th>
                  <th className="px-4 py-3.5">Phone Status</th>
                  <th className="px-4 py-3.5">Bookings</th>
                  <th className="px-4 py-3.5">Registered</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10 text-xs">
                {users.map((u) => {
                  const isSelected = selectedIds.includes(u._id);
                  const isSelf = u._id === currentUser?.id;

                  return (
                    <tr
                      key={u._id}
                      className={cn(
                        "hover:bg-surface-container/30 transition-colors",
                        isSelected ? "bg-emerald-500/5" : ""
                      )}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          disabled={isSelf}
                          onClick={() => handleToggleSelect(u._id)}
                          className={cn(
                            "p-1 rounded transition-colors",
                            isSelf ? "opacity-30 cursor-not-allowed" : "hover:bg-surface-container"
                          )}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4 text-outline" />
                          )}
                        </button>
                      </td>

                      {/* Name / User */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center uppercase text-xs shrink-0">
                            {u.name?.charAt(0) || "U"}
                          </div>
                          <div className="space-y-0.5">
                            <span className="font-headline text-sm font-semibold text-on-surface block italic">
                              {u.name || "Unnamed Customer"}
                              {isSelf && (
                                <span className="ml-1.5 text-[8px] bg-primary/10 text-primary px-1.5 py-0.2 rounded font-mono uppercase font-bold not-italic">
                                  You
                                </span>
                              )}
                            </span>
                            <span className="text-[10px] text-outline font-mono block">ID: {u._id}</span>
                          </div>
                        </div>
                      </td>

                      {/* Phone Number */}
                      <td className="px-4 py-3.5">
                        {u.phone ? (
                          <div className="flex items-center gap-1.5 font-mono text-on-surface">
                            <Phone className="w-3 h-3 text-outline shrink-0" />
                            <span>{u.phone}</span>
                          </div>
                        ) : (
                          <span className="text-outline italic text-[11px]">No phone</span>
                        )}
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3.5">
                        {u.email && !u.email.includes("@fishndrop.com") ? (
                          <div className="flex items-center gap-1.5 text-secondary">
                            <Mail className="w-3 h-3 text-outline shrink-0" />
                            <span className="truncate max-w-[180px]">{u.email}</span>
                          </div>
                        ) : (
                          <span className="text-outline/60 italic text-[11px]">Auto Guest Email</span>
                        )}
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3.5">
                        <RoleBadge role={u.role} />
                      </td>

                      {/* Verification */}
                      <td className="px-4 py-3.5">
                        <VerificationBadge isVerified={u.isPhoneVerified} />
                      </td>

                      {/* Bookings */}
                      <td className="px-4 py-3.5">
                        <div className="space-y-0.5">
                          <span className="font-bold text-on-surface">
                            {u.totalBookings || 0} reservation(s)
                          </span>
                          {(u.venueBookings ?? 0) > 0 && (
                            <span className="text-[9px] text-[#C8A96A] font-bold block">
                              🏛️ {u.venueBookings} Venue Buyout(s)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Registered Date */}
                      <td className="px-4 py-3.5 text-secondary font-mono text-[11px]">
                        {formatDateTime(u.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        {!isSelf && (
                          <button
                            type="button"
                            onClick={() =>
                              setPendingDeleteAction({
                                type: "single",
                                userId: u._id,
                                userName: u.name || u.phone
                              })
                            }
                            className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider"
                            title="Delete this user"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Delete</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="flex items-center gap-1 px-4 py-2 rounded-full border border-outline-variant/20 text-[9px] uppercase tracking-widest font-bold text-secondary hover:text-on-surface hover:border-outline-variant/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-3 h-3" /> Previous
          </button>
          <span className="font-headline text-sm italic text-on-surface">
            {page} <span className="text-outline font-body not-italic text-xs">of</span> {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="flex items-center gap-1 px-4 py-2 rounded-full border border-outline-variant/20 text-[9px] uppercase tracking-widest font-bold text-secondary hover:text-on-surface hover:border-outline-variant/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Next <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}
