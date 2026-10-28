"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  Trash2,
  Eye,
  Filter,
  Loader2,
  Clock,
  Sparkles,
  ExternalLink,
  User,
  Mail,
  Phone,
  AlertCircle,
  Plus,
  Pencil,
  Upload,
  X,
  Save,
  Tag,
  Layers,
  LayoutGrid,
  CheckCheck
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Link from "next/link";

interface AdminPhoto {
  _id: string;
  userName: string;
  userEmail?: string;
  userPhone?: string;
  title: string;
  description?: string;
  imageUrl: string;
  category: "all" | "garden" | "dining" | "culinary" | "cocktails" | "events" | "guest_memories";
  status: "pending" | "approved" | "rejected";
  isPublished: boolean;
  rejectionReason?: string;
  createdAt: string;
}

interface GroupedSubmission {
  groupId: string;
  userName: string;
  userEmail?: string;
  userPhone?: string;
  baseTitle: string;
  description?: string;
  category: string;
  createdAt: string;
  photos: AdminPhoto[];
  allPublished: boolean;
  hasPending: boolean;
  hasRejected: boolean;
}

const CATEGORY_OPTIONS = [
  { value: "garden", label: "The Sanctuary (Garden & Ambiance)" },
  { value: "dining", label: "Private Dining" },
  { value: "culinary", label: "Culinary Art" },
  { value: "cocktails", label: "Signature Cocktails" },
  { value: "events", label: "Private Events & Buyouts" },
  { value: "guest_memories", label: "Guest Celebration Memories" }
];

export default function AdminGalleryPage() {
  const [photos, setPhotos] = useState<AdminPhoto[]>([]);
  const [counts, setCounts] = useState({ all: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grouped" | "individual">("grouped");
  const [previewPhoto, setPreviewPhoto] = useState<AdminPhoto | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<AdminPhoto | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState<string>("garden");
  const [formIsPublished, setFormIsPublished] = useState(true);
  const [formStatus, setFormStatus] = useState<"pending" | "approved" | "rejected">("approved");
  const [formRejectionReason, setFormRejectionReason] = useState("");
  const [formImagePreview, setFormImagePreview] = useState<string | null>(null);
  const [isNewImageSelected, setIsNewImageSelected] = useState(false);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPhotos();
  }, [filterStatus, filterCategory]);

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const res = await api.get("/gallery/admin/all", {
        params: {
          status: filterStatus,
          category: filterCategory !== "all" ? filterCategory : undefined
        }
      });
      if (res.data?.success) {
        setPhotos(res.data.photos || []);
        if (res.data.counts) {
          setCounts(res.data.counts);
        }
      }
    } catch (err) {
      console.error("Failed to load gallery submissions", err);
      toast.error("Failed to load photo submissions");
    } finally {
      setLoading(false);
    }
  };

  // Group photos under customer details
  const groupedSubmissions = useMemo(() => {
    const groups: { [key: string]: GroupedSubmission } = {};

    photos.forEach((photo) => {
      // Strip trailing (1), (2), etc.
      const baseTitle = photo.title.replace(/\s*\(\d+\)$/, "").trim();
      // Group by user & base title & date (15-min window)
      const dateKey = photo.createdAt ? new Date(photo.createdAt).toISOString().slice(0, 15) : "unknown";
      const key = `${photo.userEmail || photo.userName}_${baseTitle}_${photo.category}_${dateKey}`;

      if (!groups[key]) {
        groups[key] = {
          groupId: key,
          userName: photo.userName,
          userEmail: photo.userEmail,
          userPhone: photo.userPhone,
          baseTitle,
          description: photo.description,
          category: photo.category,
          createdAt: photo.createdAt,
          photos: [],
          allPublished: true,
          hasPending: false,
          hasRejected: false
        };
      }

      groups[key].photos.push(photo);
      if (!photo.isPublished) groups[key].allPublished = false;
      if (photo.status === "pending") groups[key].hasPending = true;
      if (photo.status === "rejected") groups[key].hasRejected = true;
    });

    return Object.values(groups);
  }, [photos]);

  const handleTogglePublish = async (photo: AdminPhoto) => {
    try {
      setActionLoadingId(photo._id);
      const targetPublish = !photo.isPublished;
      const res = await api.patch(`/gallery/admin/${photo._id}/publish`, {
        isPublished: targetPublish
      });
      if (res.data?.success) {
        toast.success(targetPublish ? "Photo published to Sanctuary Gallery!" : "Photo unpublished");
        fetchPhotos();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update status");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Batch publish all photos under a customer's submission
  const handleBatchPublish = async (submission: GroupedSubmission, targetPublish: boolean) => {
    try {
      setActionLoadingId(submission.groupId);
      await Promise.all(
        submission.photos.map((p) =>
          api.patch(`/gallery/admin/${p._id}/publish`, { isPublished: targetPublish })
        )
      );
      toast.success(
        targetPublish
          ? `All ${submission.photos.length} photos published live to Sanctuary Gallery!`
          : `All ${submission.photos.length} photos unpublished.`
      );
      fetchPhotos();
    } catch (err: any) {
      toast.error("Failed to update photos in batch");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleBatchReject = async (submission: GroupedSubmission) => {
    const reason = prompt(
      "Enter rejection reason for this customer submission:",
      "Does not meet gallery publication guidelines"
    );
    if (reason === null) return;
    try {
      setActionLoadingId(submission.groupId);
      await Promise.all(
        submission.photos.map((p) => api.patch(`/gallery/admin/${p._id}/reject`, { reason }))
      );
      toast.success("Submission marked as rejected.");
      fetchPhotos();
    } catch (err: any) {
      toast.error("Failed to reject submission");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleBatchDelete = async (submission: GroupedSubmission) => {
    if (
      !confirm(
        `Are you sure you want to permanently delete all ${submission.photos.length} photos from ${submission.userName}?`
      )
    )
      return;
    try {
      setActionLoadingId(submission.groupId);
      await Promise.all(submission.photos.map((p) => api.delete(`/gallery/admin/${p._id}`)));
      toast.success("Customer submission deleted.");
      fetchPhotos();
    } catch (err: any) {
      toast.error("Failed to delete submission");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (photo: AdminPhoto) => {
    const reason = prompt("Enter rejection reason (optional):", "Image quality or guideline mismatch");
    if (reason === null) return;

    try {
      setActionLoadingId(photo._id);
      const res = await api.patch(`/gallery/admin/${photo._id}/reject`, { reason });
      if (res.data?.success) {
        toast.success("Photo submission rejected");
        fetchPhotos();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to reject photo");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (photoId: string) => {
    if (!confirm("Are you sure you want to permanently delete this photo?")) return;
    try {
      setActionLoadingId(photoId);
      const res = await api.delete(`/gallery/admin/${photoId}`);
      if (res.data?.success) {
        toast.success("Photo removed");
        fetchPhotos();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete photo");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenCreate = () => {
    setFormTitle("");
    setFormDescription("");
    setFormCategory("garden");
    setFormIsPublished(true);
    setFormStatus("approved");
    setFormRejectionReason("");
    setFormImagePreview(null);
    setIsNewImageSelected(false);
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (photo: AdminPhoto) => {
    setEditingPhoto(photo);
    setFormTitle(photo.title);
    setFormDescription(photo.description || "");
    setFormCategory(photo.category || "garden");
    setFormIsPublished(photo.isPublished);
    setFormStatus(photo.status);
    setFormRejectionReason(photo.rejectionReason || "");
    setFormImagePreview(photo.imageUrl);
    setIsNewImageSelected(false);
    setIsEditModalOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image file must be under 8MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormImagePreview(reader.result as string);
      setIsNewImageSelected(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formImagePreview) {
      toast.error("Please select an image file to upload");
      return;
    }
    if (!formTitle.trim()) {
      toast.error("Photo title is required");
      return;
    }

    try {
      setIsFormSubmitting(true);
      const uploadRes = await api.post("/gallery/upload", {
        imageBase64: formImagePreview
      });

      if (!uploadRes.data?.success || !uploadRes.data?.url) {
        throw new Error(uploadRes.data?.message || "Failed to upload image");
      }

      const imageUrl = uploadRes.data.url;

      const createRes = await api.post("/gallery/submit", {
        title: formTitle.trim(),
        description: formDescription.trim(),
        category: formCategory,
        imageUrl,
        isPublished: formIsPublished,
        status: formStatus
      });

      if (createRes.data?.success) {
        if (formIsPublished && createRes.data.photo?._id) {
          await api.patch(`/gallery/admin/${createRes.data.photo._id}/publish`, {
            isPublished: true
          });
        }
        toast.success(
          formIsPublished
            ? "Photo added and published to the Sanctuary Gallery!"
            : "Photo added successfully as draft."
        );
        setIsCreateModalOpen(false);
        fetchPhotos();
      } else {
        toast.error(createRes.data?.message || "Failed to create photo");
      }
    } catch (err: any) {
      console.error("Create photo error:", err);
      toast.error(err.response?.data?.message || err.message || "Failed to add photo");
    } finally {
      setIsFormSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPhoto) return;

    if (!formTitle.trim()) {
      toast.error("Photo title is required");
      return;
    }

    try {
      setIsFormSubmitting(true);
      let imageUrl = editingPhoto.imageUrl;

      if (isNewImageSelected && formImagePreview && formImagePreview.startsWith("data:")) {
        const uploadRes = await api.post("/gallery/upload", {
          imageBase64: formImagePreview
        });
        if (!uploadRes.data?.success || !uploadRes.data?.url) {
          throw new Error(uploadRes.data?.message || "Failed to upload new image");
        }
        imageUrl = uploadRes.data.url;
      }

      const updateRes = await api.patch(`/gallery/admin/${editingPhoto._id}`, {
        title: formTitle.trim(),
        description: formDescription.trim(),
        category: formCategory,
        imageUrl,
        isPublished: formIsPublished,
        status: formStatus,
        rejectionReason: formStatus === "rejected" ? formRejectionReason : ""
      });

      if (updateRes.data?.success) {
        toast.success("Photo details updated successfully!");
        setIsEditModalOpen(false);
        setEditingPhoto(null);
        fetchPhotos();
      } else {
        toast.error(updateRes.data?.message || "Failed to update photo");
      }
    } catch (err: any) {
      console.error("Update photo error:", err);
      toast.error(err.response?.data?.message || err.message || "Failed to update photo");
    } finally {
      setIsFormSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-10 space-y-8 text-on-surface">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-500/20 pb-6">
        <div>
          <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-emerald-400 block">
            Concierge Management
          </span>
          <h1 className="text-3xl md:text-4xl font-headline italic text-white flex items-center gap-3">
            <span>Gallery &amp; Photo Management</span>
            {counts.pending > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-black not-italic animate-pulse">
                {counts.pending} Pending Review
              </span>
            )}
          </h1>
          <p className="text-xs text-emerald-200/70 mt-1">
            Review guest-uploaded celebration photos grouped by customer, verify images, and publish them to the Sanctuary Gallery.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold-gradient hover:opacity-90 text-black text-xs font-bold uppercase tracking-wider transition-all shadow-lg active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Upload New Photo</span>
          </button>

          <Link
            href="/gallery"
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-200 text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Public Gallery</span>
          </Link>
        </div>
      </div>

      {/* Filter and View Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilterStatus("pending")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              filterStatus === "pending"
                ? "bg-amber-500 text-black shadow-md font-extrabold"
                : "bg-emerald-950/40 border border-emerald-500/20 text-emerald-200 hover:bg-emerald-900/40"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending ({counts.pending})</span>
          </button>

          <button
            onClick={() => setFilterStatus("approved")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              filterStatus === "approved"
                ? "bg-emerald-600 text-white shadow-md font-extrabold"
                : "bg-emerald-950/40 border border-emerald-500/20 text-emerald-200 hover:bg-emerald-900/40"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Published ({counts.approved})</span>
          </button>

          <button
            onClick={() => setFilterStatus("rejected")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              filterStatus === "rejected"
                ? "bg-red-600 text-white shadow-md font-extrabold"
                : "bg-emerald-950/40 border border-emerald-500/20 text-emerald-200 hover:bg-emerald-900/40"
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Rejected ({counts.rejected})</span>
          </button>

          <button
            onClick={() => setFilterStatus("all")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              filterStatus === "all"
                ? "bg-white text-black shadow-md font-extrabold"
                : "bg-emerald-950/40 border border-emerald-500/20 text-emerald-200 hover:bg-emerald-900/40"
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>All ({counts.all})</span>
          </button>
        </div>

        {/* Right Controls: Category Filter + View Mode Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Toggle: Customer Grouped vs Individual Cards */}
          <div className="flex items-center bg-emerald-950/70 p-1 rounded-xl border border-emerald-500/30">
            <button
              type="button"
              onClick={() => setViewMode("grouped")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "grouped"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-emerald-300/70 hover:text-white"
              }`}
              title="Group multiple photos under customer details"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Customer Groups</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("individual")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "individual"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-emerald-300/70 hover:text-white"
              }`}
              title="View each photo card separately"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Single Grid</span>
            </button>
          </div>

          {/* Category Filter Dropdown */}
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-emerald-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 rounded-xl bg-emerald-950/70 border border-emerald-500/30 text-xs font-medium text-emerald-100 focus:outline-none focus:border-emerald-400"
            >
              <option value="all">All Categories</option>
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-emerald-300/60 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
          <span className="text-xs uppercase tracking-wider font-bold">Loading gallery photos...</span>
        </div>
      ) : photos.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-dashed border-emerald-500/20 bg-emerald-950/20 space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-900/40 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-base text-white">No photos found</h3>
          <p className="text-xs text-emerald-200/60 max-w-sm mx-auto">
            {filterStatus === "pending"
              ? "All submitted guest photos have been reviewed! New submissions will appear here."
              : "No photos matching this filter status."}
          </p>
        </div>
      ) : viewMode === "grouped" ? (
        /* ================= GROUPED BY CUSTOMER SUBMISSION ================= */
        <div className="space-y-6">
          {groupedSubmissions.map((submission) => {
            const hasMultiplePhotos = submission.photos.length > 1;
            const isBatchLoading = actionLoadingId === submission.groupId;

            return (
              <div
                key={submission.groupId}
                className="rounded-2xl border border-emerald-500/25 bg-[#0b3325]/85 backdrop-blur-sm shadow-xl p-5 sm:p-6 space-y-5 transition-all hover:border-emerald-500/40"
              >
                {/* 1. Customer Details Header Bar */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-emerald-500/15 pb-4">
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-300 shrink-0 shadow-inner">
                      <User className="w-6 h-6" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-headline text-xl italic text-white font-semibold">
                          {submission.userName}
                        </h2>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {submission.photos.length} Photo{hasMultiplePhotos ? "s" : ""}
                        </span>
                        {submission.allPublished ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-500 text-white shadow-sm">
                            <CheckCircle2 className="w-2.5 h-2.5" /> All Published Live
                          </span>
                        ) : submission.hasPending ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-500 text-black shadow-sm">
                            <Clock className="w-2.5 h-2.5" /> Needs Verification
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-red-600 text-white shadow-sm">
                            <XCircle className="w-2.5 h-2.5" /> Rejected
                          </span>
                        )}
                      </div>

                      {/* Contact metadata */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-emerald-200/70 pt-0.5">
                        {submission.userEmail && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{submission.userEmail}</span>
                          </span>
                        )}
                        {submission.userPhone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{submission.userPhone}</span>
                          </span>
                        )}
                        <span className="text-[11px] text-emerald-300/50">
                          Submitted on {new Date(submission.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Batch Action Buttons for this Customer */}
                  <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                    <button
                      type="button"
                      disabled={isBatchLoading}
                      onClick={() => handleBatchPublish(submission, !submission.allPublished)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md ${
                        submission.allPublished
                          ? "bg-amber-600/80 hover:bg-amber-600 text-white"
                          : "bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95"
                      }`}
                    >
                      {isBatchLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCheck className="w-4 h-4" />
                      )}
                      <span>
                        {submission.allPublished
                          ? `Unpublish All (${submission.photos.length})`
                          : `Publish All (${submission.photos.length}) Live`}
                      </span>
                    </button>

                    {!submission.allPublished && !submission.hasRejected && (
                      <button
                        type="button"
                        disabled={isBatchLoading}
                        onClick={() => handleBatchReject(submission)}
                        className="px-3 py-2 rounded-xl border border-red-500/30 text-red-300 hover:bg-red-950/40 text-xs font-semibold transition-colors"
                        title="Reject entire submission"
                      >
                        Reject All
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={isBatchLoading}
                      onClick={() => handleBatchDelete(submission)}
                      className="p-2 rounded-xl border border-outline-variant/20 text-emerald-300/60 hover:text-red-300 hover:bg-red-950/30 transition-colors"
                      title="Delete all photos in this submission"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 2. Collection Caption & Category */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-300/60 block">
                      Collection Title
                    </span>
                    <span className="font-headline text-lg italic text-white font-medium">
                      {submission.baseTitle}
                    </span>
                    {submission.description && (
                      <p className="text-xs text-emerald-200/70 mt-0.5">{submission.description}</p>
                    )}
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-[11px] text-emerald-200 capitalize font-medium">
                    Category: {submission.category.replace("_", " ")}
                  </span>
                </div>

                {/* 3. MULTIPLE PHOTOS GRID UNDER CUSTOMER DETAILS */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 pt-1">
                  {submission.photos.map((photo, pIdx) => (
                    <div
                      key={photo._id}
                      className="rounded-xl overflow-hidden border border-emerald-500/30 bg-emerald-950/50 flex flex-col group relative shadow-md transition-all hover:border-emerald-400"
                    >
                      {/* Image Thumbnail with Lightbox click */}
                      <div
                        onClick={() => setPreviewPhoto(photo)}
                        className="relative aspect-square w-full overflow-hidden bg-black/50 cursor-pointer"
                      >
                        <img
                          src={photo.imageUrl}
                          alt={photo.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />

                        {/* Status Overlay */}
                        <div className="absolute top-1.5 left-1.5">
                          {photo.isPublished ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-emerald-500 text-white shadow-sm">
                              Live
                            </span>
                          ) : photo.status === "rejected" ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-red-600 text-white shadow-sm">
                              Rejected
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-amber-500 text-black shadow-sm">
                              Pending
                            </span>
                          )}
                        </div>

                        {/* Photo Number Pill */}
                        <div className="absolute bottom-1.5 left-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-sm text-[9px] font-bold text-white">
                            #{pIdx + 1}
                          </span>
                        </div>

                        {/* Hover Zoom overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center">
                            <Eye className="w-4 h-4" />
                          </span>
                        </div>
                      </div>

                      {/* Photo Bottom Info & Quick Toggle */}
                      <div className="p-2 space-y-1.5 flex-1 flex flex-col justify-between text-[11px] bg-emerald-950/70">
                        <span className="font-semibold text-white line-clamp-1 block" title={photo.title}>
                          {photo.title}
                        </span>

                        <div className="flex items-center justify-between gap-1 pt-1 border-t border-emerald-500/15">
                          <button
                            type="button"
                            disabled={actionLoadingId === photo._id}
                            onClick={() => handleTogglePublish(photo)}
                            className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors text-center ${
                              photo.isPublished
                                ? "bg-amber-600/70 hover:bg-amber-600 text-white"
                                : "bg-emerald-600 hover:bg-emerald-500 text-white"
                            }`}
                          >
                            {photo.isPublished ? "Unpublish" : "Publish"}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(photo)}
                            className="p-1 rounded text-emerald-300 hover:text-white hover:bg-emerald-900/60 transition-colors"
                            title="Edit photo details"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>

                          <button
                            type="button"
                            disabled={actionLoadingId === photo._id}
                            onClick={() => handleDelete(photo._id)}
                            className="p-1 rounded text-emerald-300/60 hover:text-red-400 hover:bg-red-950/40 transition-colors"
                            title="Delete photo"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ================= INDIVIDUAL SINGLE CARD GRID ================= */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {photos.map((photo) => (
            <div
              key={photo._id}
              className="rounded-2xl overflow-hidden border border-emerald-500/20 bg-[#0b3325]/80 backdrop-blur-sm shadow-xl flex flex-col transition-all hover:border-emerald-500/40"
            >
              {/* Photo Image Preview */}
              <div
                onClick={() => setPreviewPhoto(photo)}
                className="relative aspect-[16/10] w-full overflow-hidden bg-black/40 cursor-pointer group"
              >
                <img
                  src={photo.imageUrl}
                  alt={photo.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/70 text-white text-xs font-semibold backdrop-blur-sm">
                    <Eye className="w-3.5 h-3.5" /> Full Preview
                  </span>
                </div>

                {/* Status Badge */}
                <div className="absolute top-3 left-3">
                  {photo.isPublished || photo.status === "approved" ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500 text-white shadow-md">
                      <CheckCircle2 className="w-3 h-3" /> Live on Gallery
                    </span>
                  ) : photo.status === "rejected" ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-600 text-white shadow-md">
                      <XCircle className="w-3 h-3" /> Rejected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-black shadow-md">
                      <Clock className="w-3 h-3" /> Pending Review
                    </span>
                  )}
                </div>

                <div className="absolute bottom-3 right-3">
                  <span className="px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-sm text-[10px] text-emerald-200 capitalize font-medium border border-white/10">
                    {photo.category.replace("_", " ")}
                  </span>
                </div>
              </div>

              {/* Photo Metadata & Submitter Info */}
              <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-headline text-lg italic text-white line-clamp-1">{photo.title}</h3>
                    {photo.description ? (
                      <p className="text-xs text-emerald-200/70 mt-1 line-clamp-2">{photo.description}</p>
                    ) : (
                      <p className="text-xs text-emerald-300/40 italic mt-1">No description provided</p>
                    )}
                  </div>

                  {/* Submitter Box */}
                  <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/15 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-white font-semibold">
                        <User className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{photo.userName}</span>
                      </div>
                      <span className="text-[10px] text-emerald-300/50">
                        {new Date(photo.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {photo.userEmail && (
                      <div className="flex items-center gap-1.5 text-emerald-200/70 text-[11px]">
                        <Mail className="w-3 h-3 text-emerald-400" />
                        <span>{photo.userEmail}</span>
                      </div>
                    )}
                    {photo.userPhone && (
                      <div className="flex items-center gap-1.5 text-emerald-200/70 text-[11px]">
                        <Phone className="w-3 h-3 text-emerald-400" />
                        <span>{photo.userPhone}</span>
                      </div>
                    )}
                  </div>

                  {photo.status === "rejected" && photo.rejectionReason && (
                    <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/30 text-xs text-red-300 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>Rejection note: {photo.rejectionReason}</span>
                    </div>
                  )}
                </div>

                {/* Admin Action Buttons */}
                <div className="pt-3 border-t border-emerald-500/15 flex items-center gap-2">
                  <button
                    type="button"
                    disabled={actionLoadingId === photo._id}
                    onClick={() => handleTogglePublish(photo)}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md ${
                      photo.isPublished
                        ? "bg-amber-600/80 hover:bg-amber-600 text-white"
                        : "bg-emerald-600 hover:bg-emerald-500 text-white"
                    }`}
                  >
                    {actionLoadingId === photo._id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    <span>{photo.isPublished ? "Unpublish" : "Publish Live"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(photo)}
                    className="p-2 rounded-xl border border-emerald-500/30 text-emerald-200 hover:bg-emerald-900/40 transition-colors"
                    title="Edit details"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  {!photo.isPublished && photo.status !== "rejected" && (
                    <button
                      type="button"
                      disabled={actionLoadingId === photo._id}
                      onClick={() => handleReject(photo)}
                      className="p-2 rounded-xl border border-red-500/30 text-red-300 hover:bg-red-950/40 transition-colors"
                      title="Reject photo"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={actionLoadingId === photo._id}
                    onClick={() => handleDelete(photo._id)}
                    className="p-2 rounded-xl border border-outline-variant/20 text-emerald-300/60 hover:text-red-300 hover:bg-red-950/30 transition-colors"
                    title="Delete permanently"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Preview Modal */}
      {previewPhoto && (
        <div
          onClick={() => setPreviewPhoto(null)}
          className="fixed inset-0 z-50 p-4 bg-black/85 backdrop-blur-md flex items-center justify-center"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-3xl w-full bg-[#0b3325] border border-emerald-500/30 rounded-2xl overflow-hidden shadow-2xl space-y-4 p-5"
          >
            <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden bg-black/50">
              <img src={previewPhoto.imageUrl} alt={previewPhoto.title} className="w-full h-full object-contain" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-headline text-xl italic text-white">{previewPhoto.title}</h3>
                <p className="text-xs text-emerald-200/70">
                  By {previewPhoto.userName} &bull; {previewPhoto.category.replace("_", " ")}
                </p>
              </div>
              <button
                onClick={() => setPreviewPhoto(null)}
                className="px-4 py-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/30 text-xs font-bold uppercase text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create New Photo Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#0b3325] border border-emerald-500/30 rounded-2xl max-w-lg w-full my-auto shadow-2xl p-6 sm:p-8 space-y-5 relative">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-4 right-4 text-emerald-300/60 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">Venue Curator</span>
              <h2 className="font-headline text-2xl italic text-white">Upload Showcase Photo</h2>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-emerald-200 block mb-1">Image File *</label>
                {formImagePreview ? (
                  <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden border border-emerald-500/40 bg-black/40">
                    <img src={formImagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFormImagePreview(null)}
                      className="absolute top-2 right-2 px-2.5 py-1 rounded bg-black/70 hover:bg-red-600 text-white text-xs font-medium"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer border-2 border-dashed border-emerald-500/30 hover:border-emerald-400 rounded-xl p-8 flex flex-col items-center justify-center gap-2 bg-emerald-950/30 hover:bg-emerald-900/20 text-center"
                  >
                    <Upload className="w-7 h-7 text-emerald-400" />
                    <span className="text-xs font-bold text-white">Click to upload image</span>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
              </div>

              <div>
                <label className="text-xs font-semibold text-emerald-200 block mb-1">Photo Title *</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g., Golden Canopy Dining Enclave"
                  className="w-full px-3 py-2 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-white text-xs focus:outline-none focus:border-emerald-400"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-emerald-200 block mb-1">Category</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-white text-xs focus:outline-none focus:border-emerald-400"
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-emerald-200 block mb-1">Description (Optional)</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Short description for the visual chronicle..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-white text-xs focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="createPublish"
                  checked={formIsPublished}
                  onChange={(e) => setFormIsPublished(e.target.checked)}
                  className="rounded border-emerald-500 text-emerald-600 focus:ring-0"
                />
                <label htmlFor="createPublish" className="text-xs font-semibold text-emerald-200">
                  Publish live to public gallery immediately
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-emerald-500/20">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-emerald-500/30 text-xs font-medium text-emerald-200 hover:bg-emerald-900/40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isFormSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-md"
                >
                  {isFormSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save Photo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Photo Modal */}
      {isEditModalOpen && editingPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#0b3325] border border-emerald-500/30 rounded-2xl max-w-lg w-full my-auto shadow-2xl p-6 sm:p-8 space-y-5 relative">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-4 right-4 text-emerald-300/60 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">Edit Photo</span>
              <h2 className="font-headline text-2xl italic text-white">{editingPhoto.title}</h2>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-emerald-200 block mb-1">Image</label>
                <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden border border-emerald-500/40 bg-black/40">
                  <img src={formImagePreview || editingPhoto.imageUrl} alt="Edit" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute top-2 right-2 px-2.5 py-1 rounded bg-black/70 hover:bg-emerald-600 text-white text-xs font-medium"
                  >
                    Replace Image
                  </button>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
              </div>

              <div>
                <label className="text-xs font-semibold text-emerald-200 block mb-1">Title *</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-white text-xs focus:outline-none focus:border-emerald-400"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-emerald-200 block mb-1">Category</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-white text-xs focus:outline-none focus:border-emerald-400"
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-emerald-200 block mb-1">Description</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-white text-xs focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editPublish"
                  checked={formIsPublished}
                  onChange={(e) => setFormIsPublished(e.target.checked)}
                  className="rounded border-emerald-500 text-emerald-600 focus:ring-0"
                />
                <label htmlFor="editPublish" className="text-xs font-semibold text-emerald-200">
                  Live on Public Gallery
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-emerald-500/20">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-emerald-500/30 text-xs font-medium text-emerald-200 hover:bg-emerald-900/40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isFormSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-md"
                >
                  {isFormSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Update Photo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
