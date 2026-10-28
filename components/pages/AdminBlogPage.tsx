"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Upload,
  X,
  Save,
  ArrowLeft,
  Image as ImageIcon,
  FileText,
  Calendar,
  Tag,
  Search,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";

interface Blog {
  _id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  coverImage: string;
  images: string[];
  author: string;
  tags: string[];
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

type ViewMode = "list" | "create" | "edit";

export default function AdminBlogPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [author, setAuthor] = useState("Tropica");
  const [tagsInput, setTagsInput] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const fetchBlogs = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/blog/admin/all");
      if (data.success) setBlogs(data.blogs);
    } catch (err) {
      toast.error("Failed to fetch blog posts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setContent("");
    setCoverImage("");
    setImages([]);
    setAuthor("Tropica");
    setTagsInput("");
    setIsPublished(false);
    setSelectedBlog(null);
  };

  const handleCreateNew = () => {
    resetForm();
    setViewMode("create");
  };

  const handleEdit = (blog: Blog) => {
    setSelectedBlog(blog);
    setTitle(blog.title);
    setDescription(blog.description);
    setContent(blog.content);
    setCoverImage(blog.coverImage);
    setImages(blog.images);
    setAuthor(blog.author);
    setTagsInput(blog.tags.join(", "));
    setIsPublished(blog.isPublished);
    setViewMode("edit");
  };

  const handleBack = () => {
    resetForm();
    setViewMode("list");
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const { data } = await api.post("/blog/upload-image", {
            imageBase64: reader.result,
          });
          if (data.success) {
            resolve(data.url);
          } else {
            toast.error("Upload failed");
            resolve(null);
          }
        } catch (err) {
          toast.error("Upload failed");
          resolve(null);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB");
      return;
    }

    setUploadingCover(true);
    const url = await uploadImage(file);
    if (url) setCoverImage(url);
    setUploadingCover(false);
    if (coverInputRef.current) coverInputRef.current.value = "";
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploadingGallery(true);
    const newImages: string[] = [];
    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 10MB limit`);
        continue;
      }
      const url = await uploadImage(file);
      if (url) newImages.push(url);
    }
    setImages((prev) => [...prev, ...newImages]);
    setUploadingGallery(false);
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  };

  const removeGalleryImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    if (!description.trim()) { toast.error("Description is required"); return; }
    if (!content.trim()) { toast.error("Content is required"); return; }
    if (!coverImage) { toast.error("Cover image is required"); return; }

    const tags = tagsInput.split(",").map(t => t.trim()).filter(Boolean);
    const payload = { title, description, content, coverImage, images, author, tags, isPublished };

    setSaving(true);
    try {
      if (viewMode === "edit" && selectedBlog) {
        const { data } = await api.patch(`/blog/admin/${selectedBlog._id}`, payload);
        if (data.success) {
          toast.success("Blog post updated!");
          fetchBlogs();
          handleBack();
        }
      } else {
        const { data } = await api.post("/blog/admin", payload);
        if (data.success) {
          toast.success("Blog post created!");
          fetchBlogs();
          handleBack();
        }
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this blog post?")) return;
    setDeleting(id);
    try {
      const { data } = await api.delete(`/blog/admin/${id}`);
      if (data.success) {
        toast.success("Blog post deleted");
        fetchBlogs();
      }
    } catch (err) {
      toast.error("Failed to delete");
    } finally {
      setDeleting(null);
    }
  };

  const handleTogglePublish = async (blog: Blog) => {
    try {
      const { data } = await api.patch(`/blog/admin/${blog._id}`, {
        isPublished: !blog.isPublished,
      });
      if (data.success) {
        toast.success(blog.isPublished ? "Post unpublished" : "Post published!");
        fetchBlogs();
      }
    } catch (err) {
      toast.error("Failed to update");
    }
  };

  const insertFormatting = (format: string) => {
    const textarea = contentRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);

    let newText = "";
    switch (format) {
      case "bold":
        newText = `**${selectedText || "bold text"}**`;
        break;
      case "italic":
        newText = `*${selectedText || "italic text"}*`;
        break;
      case "heading":
        newText = `\n## ${selectedText || "Heading"}\n`;
        break;
      case "list":
        newText = `\n- ${selectedText || "List item"}\n`;
        break;
      case "link":
        newText = `[${selectedText || "link text"}](url)`;
        break;
      case "quote":
        newText = `\n> ${selectedText || "Quote"}\n`;
        break;
      default:
        return;
    }

    const newContent = content.substring(0, start) + newText + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + newText.length, start + newText.length);
    }, 0);
  };

  const filteredBlogs = blogs.filter((b) =>
    b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // ─────────── EDITOR VIEW ─────────── //
  if (viewMode === "create" || viewMode === "edit") {
    return (
      <div className="p-4 md:p-8 lg:p-12 min-h-screen" style={{ backgroundColor: "#0F3D2E" }}>
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={handleBack} className="p-2 rounded-lg hover:bg-[#C8A96A]/10 text-[#C8A96A] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-headline text-2xl md:text-3xl italic text-[#C8A96A]">
              {viewMode === "create" ? "Create Blog Post" : "Edit Blog Post"}
            </h1>
            <p className="text-[#C8A96A]/50 text-xs uppercase tracking-widest font-bold mt-1">
              {viewMode === "create" ? "Compose a new article" : `Editing: ${selectedBlog?.title}`}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Content Area */}
          <div className="xl:col-span-2 space-y-6">
            {/* Title */}
            <div className="bg-[#0a2e21] rounded-xl border border-[#C8A96A]/10 p-6">
              <label className="block text-[9px] uppercase tracking-widest text-[#C8A96A]/60 font-bold mb-3">
                Post Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter your blog post title..."
                className="w-full bg-[#0F3D2E] border border-[#C8A96A]/15 rounded-lg px-4 py-3 text-white placeholder:text-[#C8A96A]/30 focus:outline-none focus:border-[#C8A96A]/50 transition-colors text-lg font-headline italic"
              />
            </div>

            {/* Description */}
            <div className="bg-[#0a2e21] rounded-xl border border-[#C8A96A]/10 p-6">
              <label className="block text-[9px] uppercase tracking-widest text-[#C8A96A]/60 font-bold mb-3">
                Short Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A brief summary that appears in blog cards..."
                rows={3}
                maxLength={500}
                className="w-full bg-[#0F3D2E] border border-[#C8A96A]/15 rounded-lg px-4 py-3 text-white placeholder:text-[#C8A96A]/30 focus:outline-none focus:border-[#C8A96A]/50 transition-colors text-sm resize-none"
              />
              <p className="text-right text-[10px] text-[#C8A96A]/40 mt-1">{description.length}/500</p>
            </div>

            {/* Content Editor */}
            <div className="bg-[#0a2e21] rounded-xl border border-[#C8A96A]/10 p-6">
              <label className="block text-[9px] uppercase tracking-widest text-[#C8A96A]/60 font-bold mb-3">
                Content (Markdown Supported)
              </label>
              {/* Toolbar */}
              <div className="flex items-center gap-1 mb-3 bg-[#0F3D2E] rounded-lg p-2 border border-[#C8A96A]/10 flex-wrap">
                {[
                  { label: "B", format: "bold", title: "Bold" },
                  { label: "I", format: "italic", title: "Italic" },
                  { label: "H", format: "heading", title: "Heading" },
                  { label: "•", format: "list", title: "List" },
                  { label: "🔗", format: "link", title: "Link" },
                  { label: "❝", format: "quote", title: "Quote" },
                ].map((btn) => (
                  <button
                    key={btn.format}
                    onClick={() => insertFormatting(btn.format)}
                    title={btn.title}
                    className="px-3 py-1.5 text-sm font-bold text-[#C8A96A]/70 hover:text-[#C8A96A] hover:bg-[#C8A96A]/10 rounded transition-colors"
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
              <textarea
                ref={contentRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your blog content here... You can use **bold**, *italic*, ## headings, - lists, > quotes, and [links](url)."
                rows={18}
                className="w-full bg-[#0F3D2E] border border-[#C8A96A]/15 rounded-lg px-4 py-3 text-white placeholder:text-[#C8A96A]/30 focus:outline-none focus:border-[#C8A96A]/50 transition-colors text-sm font-mono resize-y leading-relaxed"
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Publish Settings */}
            <div className="bg-[#0a2e21] rounded-xl border border-[#C8A96A]/10 p-6">
              <h3 className="text-[9px] uppercase tracking-widest text-[#C8A96A]/60 font-bold mb-4">
                Publish Settings
              </h3>
              <div className="flex items-center justify-between mb-6">
                <span className="text-sm text-[#C8A96A]/80">Status</span>
                <button
                  onClick={() => setIsPublished(!isPublished)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                    isPublished
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                  }`}
                >
                  {isPublished ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  {isPublished ? "Published" : "Draft"}
                </button>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full bg-gradient-to-r from-[#C8A96A] to-[#E8CB8A] text-[#0F3D2E] py-3 rounded-lg text-xs uppercase tracking-widest font-bold hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? "Saving..." : viewMode === "edit" ? "Update Post" : "Save Post"}
                </button>
              </div>
            </div>

            {/* Cover Image */}
            <div className="bg-[#0a2e21] rounded-xl border border-[#C8A96A]/10 p-6">
              <h3 className="text-[9px] uppercase tracking-widest text-[#C8A96A]/60 font-bold mb-4">
                Cover Image
              </h3>
              {coverImage ? (
                <div className="relative group rounded-lg overflow-hidden mb-3">
                  <img src={coverImage} alt="Cover" className="w-full aspect-video object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={() => setCoverImage("")}
                      className="p-2 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => coverInputRef.current?.click()}
                  className="border-2 border-dashed border-[#C8A96A]/20 rounded-lg p-8 text-center cursor-pointer hover:border-[#C8A96A]/40 transition-colors"
                >
                  {uploadingCover ? (
                    <Loader2 className="w-8 h-8 text-[#C8A96A] mx-auto animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-[#C8A96A]/40 mx-auto mb-2" />
                      <p className="text-xs text-[#C8A96A]/40">Click to upload cover image</p>
                    </>
                  )}
                </div>
              )}
              <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
            </div>

            {/* Gallery Images */}
            <div className="bg-[#0a2e21] rounded-xl border border-[#C8A96A]/10 p-6">
              <h3 className="text-[9px] uppercase tracking-widest text-[#C8A96A]/60 font-bold mb-4">
                Gallery Images
              </h3>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group rounded-lg overflow-hidden aspect-square">
                    <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeGalleryImage(idx)}
                      className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => galleryInputRef.current?.click()}
                disabled={uploadingGallery}
                className="w-full border border-dashed border-[#C8A96A]/20 rounded-lg py-3 text-xs text-[#C8A96A]/50 hover:border-[#C8A96A]/40 hover:text-[#C8A96A]/70 transition-colors flex items-center justify-center gap-2"
              >
                {uploadingGallery ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {uploadingGallery ? "Uploading..." : "Add Images"}
              </button>
              <input ref={galleryInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryUpload} />
            </div>

            {/* Author & Tags */}
            <div className="bg-[#0a2e21] rounded-xl border border-[#C8A96A]/10 p-6 space-y-4">
              <div>
                <label className="block text-[9px] uppercase tracking-widest text-[#C8A96A]/60 font-bold mb-2">
                  Author
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full bg-[#0F3D2E] border border-[#C8A96A]/15 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#C8A96A]/50"
                />
              </div>
              <div>
                <label className="block text-[9px] uppercase tracking-widest text-[#C8A96A]/60 font-bold mb-2">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="e.g. dining, events, private"
                  className="w-full bg-[#0F3D2E] border border-[#C8A96A]/15 rounded-lg px-3 py-2 text-white text-sm placeholder:text-[#C8A96A]/30 focus:outline-none focus:border-[#C8A96A]/50"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─────────── LIST VIEW ─────────── //
  return (
    <div className="p-4 md:p-8 lg:p-12 min-h-screen" style={{ backgroundColor: "#0F3D2E" }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-headline text-2xl md:text-4xl italic text-[#C8A96A]">Blog Management</h1>
          <p className="text-[#C8A96A]/50 text-xs uppercase tracking-widest font-bold mt-1">
            {blogs.length} post{blogs.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          className="bg-gradient-to-r from-[#C8A96A] to-[#E8CB8A] text-[#0F3D2E] px-6 py-3 rounded-lg text-xs uppercase tracking-widest font-bold hover:brightness-110 transition-all flex items-center gap-2 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" /> New Post
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C8A96A]/40" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search posts..."
          className="w-full md:w-96 bg-[#0a2e21] border border-[#C8A96A]/15 rounded-lg pl-11 pr-4 py-3 text-white placeholder:text-[#C8A96A]/30 focus:outline-none focus:border-[#C8A96A]/50 text-sm"
        />
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-[#C8A96A] animate-spin" />
            <p className="text-[#C8A96A]/50 text-xs uppercase tracking-widest font-bold">Loading posts...</p>
          </div>
        </div>
      ) : filteredBlogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <FileText className="w-16 h-16 text-[#C8A96A]/20" />
          <p className="text-[#C8A96A]/40 text-sm">
            {searchTerm ? "No posts match your search" : "No blog posts yet"}
          </p>
          {!searchTerm && (
            <button
              onClick={handleCreateNew}
              className="text-[#C8A96A] text-xs uppercase tracking-widest font-bold hover:text-[#E8CB8A] transition-colors"
            >
              Create your first post →
            </button>
          )}
        </div>
      ) : (
        /* Blog List */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredBlogs.map((blog) => (
            <div
              key={blog._id}
              className="bg-[#0a2e21] rounded-xl border border-[#C8A96A]/10 overflow-hidden group hover:border-[#C8A96A]/30 transition-all duration-300"
            >
              {/* Cover Image */}
              <div className="relative aspect-video overflow-hidden">
                <img
                  src={blog.coverImage}
                  alt={blog.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      blog.isPublished
                        ? "bg-emerald-500/80 text-white"
                        : "bg-yellow-500/80 text-white"
                    }`}
                  >
                    {blog.isPublished ? "Published" : "Draft"}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="font-headline text-lg italic text-[#C8A96A] mb-2 line-clamp-2">
                  {blog.title}
                </h3>
                <p className="text-white/60 text-xs mb-4 line-clamp-2">{blog.description}</p>

                {/* Tags */}
                {blog.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {blog.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-[#C8A96A]/10 text-[#C8A96A]/70 rounded text-[10px] font-bold uppercase tracking-wider"
                      >
                        {tag}
                      </span>
                    ))}
                    {blog.tags.length > 3 && (
                      <span className="text-[10px] text-[#C8A96A]/40">+{blog.tags.length - 3}</span>
                    )}
                  </div>
                )}

                {/* Meta */}
                <div className="flex items-center gap-3 text-[10px] text-[#C8A96A]/40 mb-4">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(blog.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                  {blog.images.length > 0 && (
                    <span className="flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" />
                      {blog.images.length} photos
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-[#C8A96A]/10">
                  <button
                    onClick={() => handleEdit(blog)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] uppercase tracking-widest font-bold text-[#C8A96A]/60 hover:text-[#C8A96A] hover:bg-[#C8A96A]/10 rounded-lg transition-colors"
                  >
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                  <button
                    onClick={() => handleTogglePublish(blog)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] uppercase tracking-widest font-bold text-[#C8A96A]/60 hover:text-[#C8A96A] hover:bg-[#C8A96A]/10 rounded-lg transition-colors"
                  >
                    {blog.isPublished ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {blog.isPublished ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    onClick={() => handleDelete(blog._id)}
                    disabled={deleting === blog._id}
                    className="p-2 text-red-400/60 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                  >
                    {deleting === blog._id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
