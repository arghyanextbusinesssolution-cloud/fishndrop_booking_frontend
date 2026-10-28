"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { NavBar } from "@/components/shared/NavBar";
import { Footer } from "@/components/shared/Footer";
import {
  Upload,
  CheckCircle2,
  X,
  FileVideo,
  Sparkles,
  Camera,
  Star,
  Search,
  Loader2,
  ArrowRight
} from "lucide-react";
import toast from "react-hot-toast";

interface BookingInfo {
  id: string;
  bookingId: string;
  shortId: string;
  customerName: string;
  customerEmail: string;
  bookingDate: string;
  bookingTime: string;
  eventEndTime?: string;
  occasion: string;
  bookingType: string;
  existingMediaCount: number;
  marketingConsent: boolean;
}

interface MediaItem {
  id: string;
  file: File;
  previewUrl: string;
  mediaType: "photo" | "video";
  originalName: string;
  sizeBytes: number;
}

function UploadPageContent() {
  const searchParams = useSearchParams();
  const initialBookingId = searchParams.get("bookingId") || searchParams.get("id") || "";

  const [bookingIdQuery, setBookingIdQuery] = useState(initialBookingId);
  const [bookingInfo, setBookingInfo] = useState<BookingInfo | null>(null);
  const [loadingBooking, setLoadingBooking] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [marketingConsent, setMarketingConsent] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchBookingInfo = async (query: string) => {
    if (!query.trim()) return;
    try {
      setLoadingBooking(true);
      setLookupError(null);
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "/api";
      const res = await fetch(`${apiBase}/bookings/upload-info/${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (data.success && data.booking) {
        setBookingInfo(data.booking);
        setMarketingConsent(data.booking.marketingConsent ?? true);
      } else {
        setLookupError(data.message || "Reservation not found. Please verify your reference or email.");
        setBookingInfo(null);
      }
    } catch (err: any) {
      setLookupError("Unable to connect to reservation service. Please try again.");
    } finally {
      setLoadingBooking(false);
    }
  };

  useEffect(() => {
    if (initialBookingId) {
      fetchBookingInfo(initialBookingId);
    }
  }, [initialBookingId]);

  const handleFilesSelected = (files: FileList | null) => {
    if (!files) return;
    const newItems: MediaItem[] = [];

    Array.from(files).forEach((file) => {
      // 50MB limit per file
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 50MB limit`);
        return;
      }

      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");

      if (!isImage && !isVideo) {
        toast.error(`${file.name} is not a valid photo or video`);
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      newItems.push({
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        file,
        previewUrl,
        mediaType: isVideo ? "video" : "photo",
        originalName: file.name,
        sizeBytes: file.size
      });
    });

    setMediaItems((prev) => [...prev, ...newItems]);
  };

  const removeMediaItem = (id: string) => {
    setMediaItems((prev) => {
      const filtered = prev.filter((item) => item.id !== id);
      return filtered;
    });
  };

  // Convert file to base64
  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleUploadSubmit = async () => {
    if (!bookingInfo) {
      toast.error("Please find your reservation first");
      return;
    }

    if (mediaItems.length === 0) {
      toast.error("Please select at least one photo or video to upload");
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(10);

      // Convert files to base64
      const mediaList = [];
      for (let i = 0; i < mediaItems.length; i++) {
        const item = mediaItems[i];
        const dataUrl = await readFileAsDataUrl(item.file);
        mediaList.push({
          dataUrl,
          mediaType: item.mediaType,
          originalName: item.originalName,
          sizeBytes: item.sizeBytes
        });
        setUploadProgress(10 + Math.round(((i + 1) / mediaItems.length) * 40));
      }

      setUploadProgress(60);
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "/api";
      const res = await fetch(`${apiBase}/bookings/upload-media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: bookingInfo.id,
          mediaList,
          marketingConsent
        })
      });

      const data = await res.json();
      setUploadProgress(100);

      if (data.success) {
        setUploadedCount(mediaItems.length);
        setUploadSuccess(true);
        toast.success("Photos & videos uploaded successfully!");
      } else {
        toast.error(data.message || "Upload failed. Please try again.");
      }
    } catch (err: any) {
      toast.error("Failed to upload media. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#071912] text-[#E5E7EB] font-body selection:bg-[#C8A96A]/30 selection:text-[#C8A96A] overflow-x-hidden">
      <NavBar />

      <main className="pt-28 md:pt-36 pb-24 px-4 sm:px-6 md:px-12 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 border border-[#C8A96A]/35 bg-[#C8A96A]/10 px-4 py-1.5 rounded-full mb-4 backdrop-blur-md">
            <Camera className="w-3.5 h-3.5 text-[#E5C77A]" />
            <span className="font-label text-[10px] md:text-xs uppercase tracking-[0.25em] text-[#E5C77A] font-bold">
              Guest Memories & Stories
            </span>
          </div>

          <h1 className="font-headline text-3xl sm:text-5xl md:text-6xl text-[#C8A96A] mb-3 leading-tight">
            Share Your <span className="italic font-light">Sanctuary Moments</span>
          </h1>

          <p className="text-white/70 text-sm md:text-base max-w-xl mx-auto italic font-body">
            Upload your favorite photos and videos from your evening at Tropica Sanctuary.
          </p>
        </div>

        {uploadSuccess ? (
          /* Success Screen */
          <div className="bg-[#0a2e21]/90 border border-[#C8A96A]/30 rounded-3xl p-8 sm:p-12 text-center shadow-2xl backdrop-blur-xl animate-fade-in-up">
            <div className="w-20 h-20 rounded-full bg-[#C8A96A]/15 border border-[#C8A96A]/40 text-[#E5C77A] flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h2 className="font-headline text-2xl sm:text-4xl text-white mb-3">
              Thank You, {bookingInfo?.customerName}!
            </h2>

            <p className="text-white/80 text-sm sm:text-base max-w-lg mx-auto mb-8 font-body leading-relaxed">
              We received your {uploadedCount} memory {uploadedCount === 1 ? "file" : "files"}. It was an honor hosting your {bookingInfo?.occasion || "celebration"} in our botanical sanctuary.
            </p>

            <div className="pt-6 border-t border-[#C8A96A]/20 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href={process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL || "https://api.leadconnectorhq.com/widget/booking/hh2gGpKwljrlKAb3FzN1"}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#C8A96A] text-[#071912] px-8 py-3.5 rounded-full font-label text-xs uppercase tracking-[0.2em] font-black hover:brightness-110 transition-all shadow-lg shadow-[#C8A96A]/20"
              >
                <Star className="w-4 h-4 fill-current" />
                Leave a Google Review
              </a>

              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-[#C8A96A]/40 text-[#E5C77A] px-7 py-3.5 rounded-full font-label text-xs uppercase tracking-[0.2em] font-bold hover:bg-[#C8A96A]/10 transition-all"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                Tag Us on Instagram
              </a>
            </div>

            <div className="mt-8">
              <Link href="/" className="text-white/50 text-xs hover:text-white transition-colors underline">
                Return to Tropica Home
              </Link>
            </div>
          </div>
        ) : (
          /* Upload Workflow */
          <div className="space-y-8">
            {/* Reservation Lookup Box (if not already found) */}
            {!bookingInfo && (
              <div className="bg-[#0a2e21]/70 border border-[#C8A96A]/25 rounded-2xl p-6 sm:p-8 backdrop-blur-md">
                <h3 className="font-headline text-xl text-white mb-2">Find Your Reservation</h3>
                <p className="text-white/60 text-xs sm:text-sm mb-5 font-body">
                  Enter your Booking Reference, Email Address, or Phone Number to associate your media:
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C8A96A]/50" />
                    <input
                      type="text"
                      value={bookingIdQuery}
                      onChange={(e) => setBookingIdQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && fetchBookingInfo(bookingIdQuery)}
                      placeholder="e.g. #6F2A8B or your reservation email"
                      className="w-full bg-[#071912] border border-[#C8A96A]/30 rounded-xl pl-11 pr-4 py-3 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-[#C8A96A]"
                    />
                  </div>
                  <button
                    onClick={() => fetchBookingInfo(bookingIdQuery)}
                    disabled={loadingBooking || !bookingIdQuery.trim()}
                    className="cursor-pointer bg-[#C8A96A] text-[#071912] px-6 py-3 rounded-xl font-label text-xs uppercase tracking-[0.2em] font-bold hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {loadingBooking ? <Loader2 className="w-4 h-4 animate-spin" /> : "Find Booking"}
                  </button>
                </div>

                {lookupError && (
                  <p className="text-red-400 text-xs mt-3 flex items-center gap-1.5">
                    <span>⚠️</span> {lookupError}
                  </p>
                )}
              </div>
            )}

            {/* Event Summary Card */}
            {bookingInfo && (
              <div className="bg-[#0a2e21]/80 border border-[#C8A96A]/30 rounded-2xl p-5 sm:p-6 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-label text-[10px] uppercase tracking-[0.2em] px-2.5 py-0.5 rounded-full bg-[#C8A96A]/20 text-[#E5C77A] border border-[#C8A96A]/30">
                      Ref #{bookingInfo.shortId}
                    </span>
                    <span className="text-white/40 text-xs capitalize">{bookingInfo.occasion || "Celebration"}</span>
                  </div>
                  <h3 className="font-headline text-xl text-white font-medium">
                    {bookingInfo.customerName}
                  </h3>
                  <p className="text-white/60 text-xs font-body mt-0.5">
                    Date: {bookingInfo.bookingDate} {bookingInfo.bookingTime && `at ${bookingInfo.bookingTime}`}
                  </p>
                </div>

                <button
                  onClick={() => setBookingInfo(null)}
                  className="cursor-pointer text-xs text-[#C8A96A]/70 hover:text-[#C8A96A] underline self-start sm:self-center"
                >
                  Change Reservation
                </button>
              </div>
            )}

            {/* Dropzone & File Uploader */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFilesSelected(e.dataTransfer.files);
              }}
              className="border-2 border-dashed border-[#C8A96A]/35 hover:border-[#C8A96A] bg-[#0a2e21]/40 hover:bg-[#0a2e21]/70 rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-300 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={(e) => handleFilesSelected(e.target.files)}
                className="hidden"
              />

              <div className="w-16 h-16 rounded-full bg-[#C8A96A]/10 border border-[#C8A96A]/30 text-[#E5C77A] flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Upload className="w-7 h-7" />
              </div>

              <h4 className="font-headline text-lg sm:text-xl text-white mb-1">
                Drop your photos & videos here, or <span className="text-[#C8A96A] underline">browse</span>
              </h4>
              <p className="text-white/50 text-xs font-body">
                Supports JPG, PNG, HEIC, MP4, MOV up to 50MB per file
              </p>
            </div>

            {/* Media Items Preview Grid */}
            {mediaItems.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-label text-xs uppercase tracking-[0.2em] text-[#C8A96A] font-bold">
                    Selected Files ({mediaItems.length})
                  </h4>
                  <button
                    onClick={() => setMediaItems([])}
                    className="text-xs text-white/40 hover:text-red-400 transition-colors"
                  >
                    Clear All
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {mediaItems.map((item) => (
                    <div
                      key={item.id}
                      className="group relative rounded-xl overflow-hidden bg-[#071912] border border-[#C8A96A]/20 aspect-square"
                    >
                      {item.mediaType === "photo" ? (
                        <img
                          src={item.previewUrl}
                          alt={item.originalName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-[#071912] p-2 text-center">
                          <FileVideo className="w-8 h-8 text-[#E5C77A] mb-1" />
                          <span className="text-[10px] text-white/70 truncate max-w-full px-1">
                            {item.originalName}
                          </span>
                        </div>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeMediaItem(item.id);
                        }}
                        aria-label="Remove item"
                        className="cursor-pointer absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 hover:bg-red-500 text-white flex items-center justify-center transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Marketing Consent Checkbox */}
            <div className="bg-[#0a2e21]/60 border border-[#C8A96A]/25 rounded-2xl p-5 sm:p-6 backdrop-blur-md">
              <label className="flex items-start gap-3.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={marketingConsent}
                  onChange={(e) => setMarketingConsent(e.target.checked)}
                  className="mt-1 h-5 w-5 rounded border-[#C8A96A]/40 bg-[#071912] text-[#C8A96A] focus:ring-[#C8A96A] accent-[#C8A96A] cursor-pointer"
                />
                <div className="space-y-1">
                  <span className="font-headline text-base text-white font-medium block">
                    Allow Tropica to feature my photos & videos
                  </span>
                  <p className="text-white/60 text-xs sm:text-sm font-body leading-relaxed">
                    I grant Tropica Sanctuary permission to showcase my submitted photos and videos on social media (e.g. Instagram reels, stories), website galleries, and promotional spotlights.
                  </p>
                </div>
              </label>
            </div>

            {/* Upload Button */}
            <div className="pt-2">
              {uploading && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-[#E5C77A] mb-1">
                    <span>Uploading media...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-[#071912] h-2 rounded-full overflow-hidden border border-[#C8A96A]/20">
                    <div
                      className="bg-gradient-to-r from-[#C8A96A] to-[#E5C77A] h-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleUploadSubmit}
                disabled={uploading || mediaItems.length === 0 || !bookingInfo}
                className="cursor-pointer w-full bg-gradient-to-r from-[#C8A96A] via-[#E8CB8A] to-[#C8A96A] text-[#071912] py-4 rounded-full font-label text-xs uppercase tracking-[0.25em] font-black hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100 transition-all shadow-xl shadow-[#C8A96A]/20 flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Uploading {mediaItems.length} Files...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Submit Memories ({mediaItems.length})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function UploadPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#071912] flex items-center justify-center text-[#C8A96A]">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      }
    >
      <UploadPageContent />
    </Suspense>
  );
}
