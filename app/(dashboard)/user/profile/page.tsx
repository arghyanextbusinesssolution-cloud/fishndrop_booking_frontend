"use client";

import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import {
  UserCircle,
  Mail,
  Phone,
  Shield,
  Calendar,
  CheckCircle2,
  Clock,
  Upload,
  Image as ImageIcon,
  Trash2,
  Plus,
  Loader2,
  Edit2,
  X,
  Sparkles,
  Eye,
  AlertCircle
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";

interface UserPhoto {
  _id: string;
  title: string;
  description?: string;
  imageUrl: string;
  category: string;
  status: "pending" | "approved" | "rejected";
  isPublished: boolean;
  rejectionReason?: string;
  createdAt: string;
}

export default function ProfilePage() {
  const { user, fetchMe } = useAuthStore();

  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Photos State
  const [myPhotos, setMyPhotos] = useState<UserPhoto[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);

  // Multi-Photo Upload Modal State (Up to 6 photos)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadCategory, setUploadCategory] = useState("dining");
  const [uploadDescription, setUploadDescription] = useState("");
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit Single Existing Photo Modal
  const [isEditPhotoModalOpen, setIsEditPhotoModalOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<UserPhoto | null>(null);
  const [editPhotoTitle, setEditPhotoTitle] = useState("");
  const [editPhotoCategory, setEditPhotoCategory] = useState("dining");
  const [editPhotoDescription, setEditPhotoDescription] = useState("");
  const [isUpdatingPhoto, setIsUpdatingPhoto] = useState(false);

  useEffect(() => {
    fetchMe();
    fetchUserPhotos();
  }, []);

  useEffect(() => {
    if (user) {
      setEditName(user.name || "");
      setEditPhone(user.phone || "");
    }
  }, [user]);

  const fetchUserPhotos = async () => {
    try {
      setLoadingPhotos(true);
      const res = await api.get("/gallery/my-photos");
      if (res.data?.success) {
        setMyPhotos(res.data.photos || []);
      }
    } catch (err) {
      console.error("Failed to fetch user photos", err);
    } finally {
      setLoadingPhotos(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingProfile(true);
      const res = await api.post("/auth/update-profile", {
        name: editName.trim(),
        phone: editPhone.trim()
      });
      if (res.data?.success) {
        toast.success("Profile details updated successfully");
        setIsEditing(false);
        fetchMe();
      } else {
        toast.error(res.data?.message || "Failed to update profile");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error updating profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = 6 - imagePreviews.length;
    if (remainingSlots <= 0) {
      toast.error("You can select up to 6 photos in total.");
      return;
    }

    const selectedFiles = files.slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      toast.error(`Only ${remainingSlots} more photo(s) added (maximum 6).`);
    }

    selectedFiles.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not a valid image file`);
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        toast.error(`${file.name} is larger than 8MB`);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => {
          if (prev.length >= 6) return prev;
          return [...prev, reader.result as string];
        });
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeSelectedImage = (indexToRemove: number) => {
    setImagePreviews((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmitPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (imagePreviews.length === 0) {
      toast.error("Please select at least one photo (up to 6)");
      return;
    }
    if (!uploadTitle.trim()) {
      toast.error("Please provide a photo title or caption");
      return;
    }

    try {
      setIsUploading(true);
      const uploadedUrls: string[] = [];

      for (let i = 0; i < imagePreviews.length; i++) {
        setUploadProgress(`Uploading photo ${i + 1} of ${imagePreviews.length}...`);
        const uploadRes = await api.post("/gallery/upload", {
          imageBase64: imagePreviews[i]
        });

        if (uploadRes.data?.success && uploadRes.data?.url) {
          uploadedUrls.push(uploadRes.data.url);
        } else {
          throw new Error(`Failed to upload photo ${i + 1}`);
        }
      }

      setUploadProgress("Submitting for concierge review...");

      const submitRes = await api.post("/gallery/submit", {
        title: uploadTitle.trim(),
        description: uploadDescription.trim(),
        category: uploadCategory,
        imageUrls: uploadedUrls
      });

      if (submitRes.data?.success) {
        toast.success(
          `${uploadedUrls.length} photo${uploadedUrls.length > 1 ? "s" : ""} submitted! Concierge admin will review and publish to Sanctuary Gallery.`
        );
        setIsUploadModalOpen(false);
        setImagePreviews([]);
        setUploadTitle("");
        setUploadDescription("");
        setUploadProgress("");
        fetchUserPhotos();
      } else {
        toast.error(submitRes.data?.message || "Failed to submit photos");
      }
    } catch (err: any) {
      console.error("Photo submission error:", err);
      toast.error(err.response?.data?.message || err.message || "Failed to submit photos");
    } finally {
      setIsUploading(false);
      setUploadProgress("");
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm("Are you sure you want to remove this photo?")) return;
    try {
      const res = await api.delete(`/gallery/my-photos/${photoId}`);
      if (res.data?.success) {
        toast.success("Photo deleted successfully");
        setMyPhotos((prev) => prev.filter((p) => p._id !== photoId));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete photo");
    }
  };

  const handleOpenEditPhoto = (photo: UserPhoto) => {
    setEditingPhoto(photo);
    setEditPhotoTitle(photo.title || "");
    setEditPhotoCategory(photo.category || "dining");
    setEditPhotoDescription(photo.description || "");
    setIsEditPhotoModalOpen(true);
  };

  const handleUpdatePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPhoto) return;
    try {
      setIsUpdatingPhoto(true);
      const res = await api.patch(`/gallery/admin/${editingPhoto._id}/publish`, {
        title: editPhotoTitle.trim(),
        category: editPhotoCategory,
        description: editPhotoDescription.trim()
      });
      if (res.data?.success) {
        toast.success("Photo details updated");
        setIsEditPhotoModalOpen(false);
        fetchUserPhotos();
      }
    } catch (err: any) {
      toast.error("Failed to update photo details");
    } finally {
      setIsUpdatingPhoto(false);
    }
  };

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "Member";

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-10 space-y-8 text-on-surface">
      {/* Header */}
      <header className="space-y-2">
        <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-emerald-400 block">
          Tropica Dining Sanctuary
        </span>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-headline italic tracking-tight text-white">
          Member Profile <span className="font-light text-emerald-300">&amp; Gallery Memories</span>
        </h1>
      </header>

      {/* Main Grid: User Details + Photo Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Original Details Card (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#0b3325]/85 p-6 sm:p-8 rounded-2xl border border-emerald-500/20 backdrop-blur-sm space-y-6 shadow-xl">
            {/* Avatar & Role Badge */}
            <div className="flex items-center justify-between">
              <div className="w-20 h-20 rounded-2xl bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center relative overflow-hidden">
                <UserCircle className="w-14 h-14 text-emerald-300" strokeWidth={1} />
              </div>
              <div className="text-right">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                  <Shield className="w-3 h-3 text-emerald-400" />
                  <span className="text-[10px] uppercase tracking-widest font-bold text-emerald-300">
                    {user?.role === "owner" ? "Owner" : user?.role === "admin" ? "Concierge Admin" : "Dining Member"}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-200/60 mt-1">Joined {memberSince}</p>
              </div>
            </div>

            {/* User Name & Quick Edit Toggle */}
            <div className="flex items-center justify-between border-b border-emerald-500/15 pb-4">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-emerald-300/60 font-medium">Display Name</span>
                <p className="font-headline text-2xl italic text-white">{user?.name || "Member"}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/30 text-xs font-medium text-emerald-300 hover:bg-emerald-900/40 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>{isEditing ? "Cancel" : "Edit Details"}</span>
              </button>
            </div>

            {/* Editable Form or Display List */}
            {isEditing ? (
              <form onSubmit={handleSaveProfile} className="space-y-4 pt-1">
                <div>
                  <label className="text-xs font-semibold text-emerald-200 block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-white text-sm focus:outline-none focus:border-emerald-400"
                    placeholder="Enter your name"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-emerald-200 block mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-white text-sm focus:outline-none focus:border-emerald-400"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-md"
                >
                  {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Save Changes</span>
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                {/* Registered Email */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-950/60 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Mail className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-emerald-300/60 font-semibold block">Registered Email</span>
                    <span className="text-sm font-body text-white">{user?.email || "No email linked"}</span>
                  </div>
                </div>

                {/* Registered Phone */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-950/60 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Phone className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-emerald-300/60 font-semibold block">Contact Number</span>
                    <span className="text-sm font-body text-white">{user?.phone || "No phone linked"}</span>
                  </div>
                </div>

                {/* Account Status */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-950/60 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-emerald-300/60 font-semibold block">Member Status</span>
                    <span className="text-xs font-semibold text-emerald-300 bg-emerald-900/40 px-2 py-0.5 rounded border border-emerald-500/30 inline-block mt-0.5">
                      Active Verified Member
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Community Photo Upload & Gallery Submissions (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#0b3325]/85 p-6 sm:p-8 rounded-2xl border border-emerald-500/20 backdrop-blur-sm space-y-6 shadow-xl">
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-500/15 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <h2 className="font-headline text-2xl italic text-white">Event Memories &amp; Gallery Photos</h2>
                </div>
                <p className="text-xs text-emerald-200/70 mt-1">
                  Upload multiple photos from your dining or private celebrations (up to 6 at once). Once approved by concierge, they will be published directly to the Sanctuary Gallery!
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setImagePreviews([]);
                  setIsUploadModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-md shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Submit Photos</span>
              </button>
            </div>

            {/* Photos Grid or Empty State */}
            {loadingPhotos ? (
              <div className="py-12 flex flex-col items-center justify-center text-xs text-emerald-300/60 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                <span>Loading your submitted photos...</span>
              </div>
            ) : myPhotos.length === 0 ? (
              <div className="py-12 px-4 text-center rounded-xl border border-dashed border-emerald-500/30 bg-emerald-950/20 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-900/40 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-sm text-white">No photos submitted yet</h3>
                <p className="text-xs text-emerald-200/60 max-w-sm mx-auto">
                  Captured a special celebration, cocktail toast, or greenhouse moment? Click "Submit Photos" above to share up to 6 photos with our concierge for gallery publication.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setImagePreviews([]);
                    setIsUploadModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-800/40 hover:bg-emerald-800/70 text-emerald-200 border border-emerald-500/30 text-xs font-semibold transition-colors mt-2"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Photos Now</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {myPhotos.map((photo) => (
                  <div
                    key={photo._id}
                    className="group relative rounded-xl overflow-hidden border border-emerald-500/20 bg-emerald-950/40 flex flex-col"
                  >
                    {/* Image Preview */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-black/40">
                      <img
                        src={photo.imageUrl}
                        alt={photo.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {/* Status Overlay Badge */}
                      <div className="absolute top-2 left-2">
                        {photo.status === "approved" || photo.isPublished ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-500/90 text-white shadow-sm backdrop-blur-sm">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Published
                          </span>
                        ) : photo.status === "rejected" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-red-600/90 text-white shadow-sm backdrop-blur-sm">
                            <AlertCircle className="w-2.5 h-2.5" /> Rejected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-500/90 text-black shadow-sm backdrop-blur-sm">
                            <Clock className="w-2.5 h-2.5" /> Under Review
                          </span>
                        )}
                      </div>

                      {/* Action buttons (Edit & Delete) */}
                      <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
                        <button
                          type="button"
                          onClick={() => handleOpenEditPhoto(photo)}
                          className="w-7 h-7 rounded-full bg-black/70 hover:bg-emerald-600 text-white flex items-center justify-center transition-colors shadow-sm"
                          title="Edit details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePhoto(photo._id)}
                          className="w-7 h-7 rounded-full bg-black/70 hover:bg-red-600 text-white flex items-center justify-center transition-colors shadow-sm"
                          title="Delete photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Photo Info */}
                    <div className="p-3 space-y-1 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-white line-clamp-1">{photo.title}</h4>
                        <span className="text-[10px] text-emerald-300/70 capitalize block">
                          Category: {photo.category.replace("_", " ")}
                        </span>
                      </div>

                      {photo.status === "rejected" && photo.rejectionReason && (
                        <p className="text-[10px] text-red-300/80 bg-red-950/40 p-1.5 rounded border border-red-500/20 mt-1">
                          Note: {photo.rejectionReason}
                        </p>
                      )}

                      <span className="text-[9px] text-emerald-200/50 block pt-1 border-t border-emerald-500/10">
                        Submitted {new Date(photo.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Multi-Photo Upload Modal (Up to 6 Photos, with sticky footer buttons) */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#0b3325] border border-emerald-500/30 rounded-2xl max-w-2xl w-full my-auto shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 sm:px-8 border-b border-emerald-500/20 flex items-start justify-between shrink-0 bg-[#07241a]/80">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">
                    Community Gallery
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Up to 6 Photos
                  </span>
                </div>
                <h3 className="font-headline text-2xl italic text-white">Submit Multiple Photos</h3>
                <p className="text-xs text-emerald-200/70">
                  Select up to 6 pictures from your event or visit. Our concierge admin will review and publish them to the Sanctuary Gallery.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setImagePreviews([]);
                }}
                className="text-emerald-300/60 hover:text-white p-1.5 rounded-lg hover:bg-emerald-900/40 transition-colors ml-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form id="upload-gallery-form" onSubmit={handleSubmitPhoto} className="flex-1 overflow-y-auto p-5 sm:px-8 space-y-5">
              {/* Multi-photo Selector & Previews */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-emerald-200 block">
                    Event Photos * (Max 6)
                  </label>
                  <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                    {imagePreviews.length} / 6 selected
                  </span>
                </div>

                {imagePreviews.length === 0 ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer border-2 border-dashed border-emerald-500/30 hover:border-emerald-400 rounded-xl p-8 flex flex-col items-center justify-center gap-2 bg-emerald-950/30 hover:bg-emerald-900/20 transition-all text-center group"
                  >
                    <div className="w-12 h-12 rounded-full bg-emerald-900/50 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-bold text-white">Click or drag to select multiple photos</span>
                    <span className="text-xs text-emerald-300/60">Select up to 6 images (JPG, PNG, WebP up to 8MB each)</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Previews Grid: 3 cols on sm, 2 on mobile */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {imagePreviews.map((preview, idx) => (
                        <div
                          key={idx}
                          className="relative aspect-square rounded-xl overflow-hidden border border-emerald-500/40 bg-black/40 group shadow-md"
                        >
                          <img
                            src={preview}
                            alt={`Preview ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/75 text-[9px] font-bold text-white">
                            Photo {idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeSelectedImage(idx)}
                            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/80 hover:bg-red-600 text-white flex items-center justify-center transition-colors shadow-md"
                            title="Remove this photo"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}

                      {/* Add more button tile if < 6 */}
                      {imagePreviews.length < 6 && (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="cursor-pointer aspect-square rounded-xl border-2 border-dashed border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-900/20 flex flex-col items-center justify-center gap-1.5 text-center p-2 transition-all"
                        >
                          <Plus className="w-6 h-6 text-emerald-400" />
                          <span className="text-[11px] font-bold text-emerald-200">Add More</span>
                          <span className="text-[9px] text-emerald-300/60">
                            {6 - imagePreviews.length} slots left
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Title / Caption */}
              <div>
                <label className="text-xs font-semibold text-emerald-200 block mb-1">
                  Collection Title / Caption *
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g., Anniversary Celebration in the Conservatory"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-white text-sm focus:outline-none focus:border-emerald-400"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-xs font-semibold text-emerald-200 block mb-1">Gallery Category</label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-white text-sm focus:outline-none focus:border-emerald-400"
                >
                  <option value="dining">Private Dining &amp; Tables</option>
                  <option value="garden">The Sanctuary Garden &amp; Ambience</option>
                  <option value="culinary">Culinary &amp; Food Arts</option>
                  <option value="cocktails">Signature Cocktails &amp; Elixirs</option>
                  <option value="events">Milestone Events &amp; Celebrations</option>
                  <option value="guest_memories">Guest Memories &amp; Moments</option>
                </select>
              </div>

              {/* Description (Optional) */}
              <div>
                <label className="text-xs font-semibold text-emerald-200 block mb-1">Description (Optional)</label>
                <textarea
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Share a short story about this celebration or evening..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-white text-sm focus:outline-none focus:border-emerald-400"
                />
              </div>
            </form>

            {/* Sticky Action Footer - ALWAYS fully visible & accessible */}
            <div className="p-4 sm:px-8 border-t border-emerald-500/20 bg-[#07241a] flex items-center justify-between shrink-0">
              <span className="text-xs text-emerald-300 font-medium">
                {uploadProgress || (imagePreviews.length > 0 ? `${imagePreviews.length} photo(s) selected` : "Select up to 6 photos")}
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsUploadModalOpen(false);
                    setImagePreviews([]);
                  }}
                  className="px-4 py-2 rounded-xl border border-emerald-500/30 text-xs font-medium text-emerald-200 hover:bg-emerald-900/40 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="upload-gallery-form"
                  disabled={isUploading || imagePreviews.length === 0 || !uploadTitle.trim()}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all"
                >
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  <span>{isUploading ? "Uploading..." : `Submit ${imagePreviews.length > 1 ? `${imagePreviews.length} Photos` : "Photo"}`}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Existing Single Photo Modal */}
      {isEditPhotoModalOpen && editingPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#0b3325] border border-emerald-500/30 rounded-2xl max-w-lg w-full my-auto shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden">
            <div className="p-5 sm:px-6 border-b border-emerald-500/20 flex items-start justify-between shrink-0 bg-[#07241a]/80">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">Edit Photo Details</span>
                <h3 className="font-headline text-xl italic text-white">{editingPhoto.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditPhotoModalOpen(false)}
                className="text-emerald-300/60 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdatePhoto} className="p-5 sm:px-6 space-y-4 flex-1 overflow-y-auto">
              <div className="aspect-video w-full rounded-xl overflow-hidden border border-emerald-500/30 bg-black/40">
                <img src={editingPhoto.imageUrl} alt={editingPhoto.title} className="w-full h-full object-cover" />
              </div>

              <div>
                <label className="text-xs font-semibold text-emerald-200 block mb-1">Title / Caption</label>
                <input
                  type="text"
                  value={editPhotoTitle}
                  onChange={(e) => setEditPhotoTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-white text-sm focus:outline-none focus:border-emerald-400"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-emerald-200 block mb-1">Category</label>
                <select
                  value={editPhotoCategory}
                  onChange={(e) => setEditPhotoCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-white text-sm focus:outline-none focus:border-emerald-400"
                >
                  <option value="dining">Private Dining &amp; Tables</option>
                  <option value="garden">The Sanctuary Garden &amp; Ambience</option>
                  <option value="culinary">Culinary &amp; Food Arts</option>
                  <option value="cocktails">Signature Cocktails &amp; Elixirs</option>
                  <option value="events">Milestone Events &amp; Celebrations</option>
                  <option value="guest_memories">Guest Memories &amp; Moments</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-emerald-200 block mb-1">Description</label>
                <textarea
                  value={editPhotoDescription}
                  onChange={(e) => setEditPhotoDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-white text-sm focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-emerald-500/20">
                <button
                  type="button"
                  onClick={() => setIsEditPhotoModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-emerald-500/30 text-xs font-medium text-emerald-200 hover:bg-emerald-900/40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingPhoto}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-md"
                >
                  {isUpdatingPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
