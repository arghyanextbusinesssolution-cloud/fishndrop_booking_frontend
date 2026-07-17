"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAdmin } from "@/hooks/useAdmin";
import { Coupon } from "@/types";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { cn } from "@/lib/utils";
import { Tag, Plus, Check, X, Megaphone, Trash2, Edit2, TrendingUp } from "lucide-react";

export default function AdminCouponsPage() {
    const { getCoupons, createCoupon, updateCoupon, deleteCoupon, loading } = useAdmin();
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [pageLoading, setPageLoading] = useState(true);

    // Form State
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        code: "",
        promoterName: "",
        promoterEmail: "",
        discountType: "percentage",
        discountValue: 10,
        maxUses: "",
        expiryDate: "",
        isActive: true
    });

    const load = useCallback(async () => {
        setPageLoading(true);
        try {
            const data = await getCoupons();
            setCoupons(data);
        } catch {
            setCoupons([]);
        } finally {
            setPageLoading(false);
        }
    }, [getCoupons]);

    useEffect(() => {
        void load();
    }, [load]);

    const openForm = (coupon?: Coupon) => {
        if (coupon) {
            setEditingId(coupon._id);
            setFormData({
                code: coupon.code,
                promoterName: coupon.promoterName,
                promoterEmail: coupon.promoterEmail || "",
                discountType: coupon.discountType,
                discountValue: coupon.discountValue,
                maxUses: coupon.maxUses ? String(coupon.maxUses) : "",
                expiryDate: coupon.expiryDate ? new Date(coupon.expiryDate).toISOString().split('T')[0] : "",
                isActive: coupon.isActive
            });
        } else {
            setEditingId(null);
            setFormData({
                code: "",
                promoterName: "",
                promoterEmail: "",
                discountType: "percentage",
                discountValue: 10,
                maxUses: "",
                expiryDate: "",
                isActive: true
            });
        }
        setIsFormOpen(true);
    };

    const handleCreateOrUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            ...formData,
            maxUses: formData.maxUses ? parseInt(formData.maxUses, 10) : undefined,
            expiryDate: formData.expiryDate ? new Date(formData.expiryDate).toISOString() : undefined,
            discountValue: Number(formData.discountValue)
        };

        try {
            if (editingId) {
                await updateCoupon(editingId, payload);
                toast.success("Coupon updated successfully");
            } else {
                await createCoupon(payload);
                toast.success("Coupon created successfully");
            }
            setIsFormOpen(false);
            void load();
        } catch (err: any) {
            toast.error(err.message || "Operation failed");
        }
    };

    const handleDelete = async (id: string, code: string) => {
        if (!confirm(`Are you sure you want to delete coupon ${code}?`)) return;
        try {
            await deleteCoupon(id);
            toast.success("Coupon deleted");
            void load();
        } catch (err: any) {
            toast.error(err.message || "Failed to delete coupon");
        }
    };

    if (pageLoading) return <LoadingSpinner />;

    const activeCount = coupons.filter(c => c.isActive).length;
    const totalUsages = coupons.reduce((acc, c) => acc + c.usageCount, 0);

    return (
        <div className="p-6 md:p-10 space-y-10 min-h-screen">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-2">
                    <span className="font-label text-[9px] tracking-[0.3em] uppercase text-primary font-bold block">
                        Marketing
                    </span>
                    <h1 className="font-headline text-4xl md:text-5xl italic text-on-surface">
                        Referral Coupons
                    </h1>
                    <p className="text-sm text-secondary font-body font-light italic">
                        Manage promoter discount codes and track referral performance.
                    </p>
                </div>
                <button
                    onClick={() => openForm()}
                    className="bg-gold-gradient px-6 py-3 rounded-lg text-on-primary font-label tracking-[0.2em] uppercase text-[9px] font-bold shadow-lg shadow-primary/10 hover:scale-[1.02] transition-all active:scale-95 flex items-center gap-2 max-w-fit"
                >
                    <Plus className="w-4 h-4" />
                    Create Coupon
                </button>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="rounded-xl p-6 flex flex-col justify-between h-36 border border-outline-variant/20 bg-surface-container-lowest shadow-sm transition-all duration-300 hover:shadow-md">
                    <div className="flex items-start justify-between">
                        <p className="text-[9px] uppercase tracking-widest font-bold text-outline">Total Coupons</p>
                        <Tag className="w-4 h-4 text-outline/40" strokeWidth={1.5} />
                    </div>
                    <div>
                        <p className="font-headline text-4xl italic text-on-surface">{coupons.length}</p>
                        <span className="text-[9px] font-body italic text-outline">{activeCount} currently active</span>
                    </div>
                </div>
                <div className="rounded-xl p-6 flex flex-col justify-between h-36 border border-outline-variant/20 bg-surface-container-lowest shadow-sm transition-all duration-300 hover:shadow-md">
                    <div className="flex items-start justify-between">
                        <p className="text-[9px] uppercase tracking-widest font-bold text-outline">Total Redemptions</p>
                        <TrendingUp className="w-4 h-4 text-outline/40" strokeWidth={1.5} />
                    </div>
                    <div>
                        <p className="font-headline text-4xl italic text-on-surface">{totalUsages}</p>
                        <span className="text-[9px] font-body italic text-outline">Total successful usages across all codes</span>
                    </div>
                </div>
                <div className="rounded-xl p-6 flex flex-col justify-between h-36 border border-outline-variant/20 bg-surface-container-lowest shadow-sm transition-all duration-300 hover:shadow-md">
                    <div className="flex items-start justify-between">
                        <p className="text-[9px] uppercase tracking-widest font-bold text-outline">Active Promoters</p>
                        <Megaphone className="w-4 h-4 text-outline/40" strokeWidth={1.5} />
                    </div>
                    <div>
                        <p className="font-headline text-4xl italic text-on-surface">
                            {new Set(coupons.map(c => c.promoterName)).size}
                        </p>
                        <span className="text-[9px] font-body italic text-outline">Unique referral partners</span>
                    </div>
                </div>
            </div>

            {/* Form Overlay */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                    <div className="bg-surface-container-lowest rounded-xl max-w-lg w-full p-6 shadow-2xl border border-outline-variant/20 overflow-y-auto max-h-[90vh]">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="font-headline text-2xl italic text-on-surface">
                                {editingId ? "Edit Coupon" : "Create New Coupon"}
                            </h2>
                            <button onClick={() => setIsFormOpen(false)} className="p-2 rounded-full hover:bg-surface-container-low transition-colors">
                                <X className="w-5 h-5 text-secondary" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateOrUpdate} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1 col-span-2">
                                    <label className="text-[9px] uppercase tracking-widest font-bold text-outline">Coupon Code *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        placeholder="e.g. SUMMER2026"
                                        className="w-full bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 py-2 font-body text-sm outline-none focus:border-primary transition-colors"
                                    />
                                </div>

                                <div className="space-y-1 col-span-2 sm:col-span-1">
                                    <label className="text-[9px] uppercase tracking-widest font-bold text-outline">Promoter Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.promoterName}
                                        onChange={(e) => setFormData({ ...formData, promoterName: e.target.value })}
                                        className="w-full bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 py-2 font-body text-sm outline-none focus:border-primary transition-colors"
                                    />
                                </div>

                                <div className="space-y-1 col-span-2 sm:col-span-1">
                                    <label className="text-[9px] uppercase tracking-widest font-bold text-outline">Promoter Email</label>
                                    <input
                                        type="email"
                                        value={formData.promoterEmail}
                                        onChange={(e) => setFormData({ ...formData, promoterEmail: e.target.value })}
                                        className="w-full bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 py-2 font-body text-sm outline-none focus:border-primary transition-colors"
                                    />
                                </div>

                                <div className="space-y-1 col-span-2 sm:col-span-1">
                                    <label className="text-[9px] uppercase tracking-widest font-bold text-outline">Discount Type *</label>
                                    <select
                                        value={formData.discountType}
                                        onChange={(e) => setFormData({ ...formData, discountType: e.target.value as any })}
                                        className="w-full bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 py-2 font-body text-sm outline-none focus:border-primary transition-colors"
                                    >
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="fixed">Fixed Amount ($)</option>
                                    </select>
                                </div>

                                <div className="space-y-1 col-span-2 sm:col-span-1">
                                    <label className="text-[9px] uppercase tracking-widest font-bold text-outline">Discount Value *</label>
                                    <input
                                        type="number"
                                        required
                                        min={0}
                                        step={formData.discountType === "percentage" ? 1 : 0.01}
                                        value={formData.discountValue}
                                        onChange={(e) => setFormData({ ...formData, discountValue: e.target.value as any })}
                                        className="w-full bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 py-2 font-body text-sm outline-none focus:border-primary transition-colors"
                                    />
                                </div>

                                <div className="space-y-1 col-span-2 sm:col-span-1">
                                    <label className="text-[9px] uppercase tracking-widest font-bold text-outline">Max Uses (Optional)</label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={formData.maxUses}
                                        onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                                        className="w-full bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 py-2 font-body text-sm outline-none focus:border-primary transition-colors"
                                    />
                                </div>

                                <div className="space-y-1 col-span-2 sm:col-span-1">
                                    <label className="text-[9px] uppercase tracking-widest font-bold text-outline">Expiry Date (Optional)</label>
                                    <input
                                        type="date"
                                        value={formData.expiryDate}
                                        onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                                        className="w-full bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 py-2 font-body text-sm outline-none focus:border-primary transition-colors"
                                    />
                                </div>

                                <div className="col-span-2 flex items-center gap-2 mt-2">
                                    <input
                                        type="checkbox"
                                        id="isActive"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        className="w-4 h-4 rounded border-outline-variant/20 text-primary focus:ring-primary"
                                    />
                                    <label htmlFor="isActive" className="text-sm font-body text-on-surface">
                                        Coupon is Active
                                    </label>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsFormOpen(false)}
                                    className="px-6 py-2.5 rounded-lg border border-outline-variant text-[9px] uppercase tracking-widest font-bold text-outline hover:bg-surface-container-low transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-6 py-2.5 rounded-lg bg-gold-gradient text-on-primary text-[9px] uppercase tracking-widest font-bold shadow-lg shadow-primary/10 hover:scale-[1.02] transition-all disabled:opacity-50"
                                >
                                    {editingId ? "Save Changes" : "Create Coupon"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Coupons List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {coupons.length === 0 ? (
                    <div className="col-span-full bg-surface-container-lowest rounded-xl border border-outline-variant/10 p-16 text-center">
                        <p className="font-headline text-xl italic text-outline/40">No coupons created yet.</p>
                        <p className="text-xs text-outline font-body italic mt-2">Click 'Create Coupon' to get started.</p>
                    </div>
                ) : (
                    coupons.map((coupon) => (
                        <div key={coupon._id} className={cn(
                            "rounded-xl p-6 border transition-all duration-300 hover:shadow-md relative overflow-hidden flex flex-col bg-surface-container-lowest",
                            coupon.isActive ? "border-emerald-200/50" : "border-outline-variant/20 opacity-80 bg-surface-container-low"
                        )}>
                            <div className={cn(
                                "absolute top-0 left-0 right-0 h-1",
                                coupon.isActive ? "bg-emerald-400" : "bg-outline"
                            )} />

                            <div className="flex justify-between items-start mb-4 pt-1">
                                <div>
                                    <h3 className="font-headline text-2xl italic tracking-wide text-primary">
                                        {coupon.code}
                                    </h3>
                                    <p className="text-[9px] uppercase tracking-widest font-bold text-outline mt-1">
                                        {coupon.discountType === "percentage" ? `${coupon.discountValue}%` : `$${coupon.discountValue}`} OFF
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => openForm(coupon)} className="p-1.5 text-outline-variant hover:text-primary transition-colors">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(coupon._id, coupon.code)} className="p-1.5 text-outline-variant hover:text-red-500 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4 flex-1">
                                <div className="bg-surface-container py-3 px-4 rounded-lg flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Megaphone className="w-4 h-4 text-secondary" />
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-outline tracking-wider">Promoter</p>
                                            <p className="text-sm font-body font-medium text-on-surface truncate pr-2 max-w-[150px]">{coupon.promoterName}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[9px] uppercase tracking-widest font-bold text-outline">Usages</p>
                                        <p className="font-headline text-xl text-on-surface">
                                            {coupon.usageCount}
                                            <span className="text-sm text-outline font-body ml-1">
                                                {coupon.maxUses ? `/ ${coupon.maxUses}` : ""}
                                            </span>
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] uppercase tracking-widest font-bold text-outline">Status</p>
                                        <div className="flex items-center gap-1.5 mt-1.5">
                                            {coupon.isActive ? (
                                                <>
                                                    <Check className="w-3 h-3 text-emerald-500" />
                                                    <span className="text-xs font-bold text-emerald-600">Active</span>
                                                </>
                                            ) : (
                                                <>
                                                    <X className="w-3 h-3 text-red-400" />
                                                    <span className="text-xs font-bold text-red-500">Inactive</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {coupon.expiryDate && (
                                    <div>
                                        <p className="text-[9px] uppercase tracking-widest font-bold text-outline">Expires</p>
                                        <p className={cn(
                                            "text-sm font-body",
                                            new Date(coupon.expiryDate) < new Date() ? "text-red-500" : "text-secondary"
                                        )}>
                                            {new Date(coupon.expiryDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
