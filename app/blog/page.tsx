"use client";

import { useState, useEffect } from "react";
import { NavBar } from "@/components/shared/NavBar";
import { Footer } from "@/components/shared/Footer";
import { Calendar, ArrowRight, Search, Loader2, Tag, User, ChevronLeft, ChevronRight, X } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface Blog {
  _id: string;
  title: string;
  slug: string;
  description: string;
  coverImage: string;
  images: string[];
  author: string;
  tags: string[];
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
}

interface BlogDetail extends Blog {
  content: string;
}

export default function BlogPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal state for single blog view
  const [selectedBlog, setSelectedBlog] = useState<BlogDetail | null>(null);
  const [loadingBlog, setLoadingBlog] = useState(false);

  const fetchBlogs = async (pageNum: number) => {
    try {
      setLoading(true);
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "/api";
      const res = await fetch(`${apiBase}/blog?page=${pageNum}&limit=12`);
      const data = await res.json();
      if (data.success) {
        setBlogs(data.blogs);
        setTotalPages(data.pagination.pages);
      }
    } catch (err) {
      console.error("Failed to fetch blogs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs(page);
  }, [page]);

  const fetchBlogDetail = async (slug: string) => {
    try {
      setLoadingBlog(true);
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "/api";
      const res = await fetch(`${apiBase}/blog/${slug}`);
      const data = await res.json();
      if (data.success) {
        setSelectedBlog(data.blog);
      }
    } catch (err) {
      console.error("Failed to fetch blog detail", err);
    } finally {
      setLoadingBlog(false);
    }
  };

  const openBlog = (blog: Blog) => {
    fetchBlogDetail(blog.slug);
  };

  const closeBlog = () => {
    setSelectedBlog(null);
  };

  // Simple markdown to HTML renderer
  const renderContent = (md: string): string => {
    return md
      .replace(/## (.+)/g, '<h2 class="font-headline text-2xl md:text-3xl italic text-[#C8A96A] mt-10 mb-4">$1</h2>')
      .replace(/### (.+)/g, '<h3 class="font-headline text-xl italic text-[#C8A96A] mt-8 mb-3">$1</h3>')
      .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-[#C8A96A] underline hover:text-[#E8CB8A] transition-colors">$1</a>')
      .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-[#C8A96A]/30 pl-4 my-4 text-white/60 italic">$1</blockquote>')
      .replace(/^- (.+)$/gm, '<li class="text-white/80 ml-4 list-disc mb-1">$1</li>')
      .replace(/\n\n/g, '</p><p class="text-white/70 leading-relaxed mb-4">')
      .replace(/\n/g, '<br/>');
  };

  const filteredBlogs = blogs.filter(
    (b) =>
      b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="theme-astral min-h-screen bg-[#0F3D2E] text-on-surface font-body overflow-x-hidden">
      <NavBar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-[#071912] via-[#0F3D2E] to-[#0F3D2E]" />
        <div className="relative max-w-5xl mx-auto text-center">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-label text-[8px] md:text-[10px] uppercase tracking-[0.5em] text-[#C8A96A] font-bold"
          >
            Stories & Insights
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-headline text-4xl md:text-7xl text-white mt-4 mb-6 italic leading-tight"
          >
            The Tropica <span className="text-[#C8A96A]">Journal</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-body text-white/50 text-sm md:text-base max-w-2xl mx-auto leading-relaxed"
          >
            Discover behind-the-scenes stories, event highlights, culinary experiences, and everything that makes Tropica extraordinary.
          </motion.p>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 max-w-lg mx-auto relative"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C8A96A]/40" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search articles..."
              className="w-full bg-[#0a2e21]/80 backdrop-blur-sm border border-[#C8A96A]/15 rounded-full pl-11 pr-5 py-3.5 text-white placeholder:text-[#C8A96A]/30 focus:outline-none focus:border-[#C8A96A]/50 text-sm transition-colors"
            />
          </motion.div>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="px-4 md:px-12 pb-20 md:pb-32">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-32">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 text-[#C8A96A] animate-spin" />
                <p className="text-[#C8A96A]/50 text-xs uppercase tracking-widest font-bold">Loading articles...</p>
              </div>
            </div>
          ) : filteredBlogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <div className="w-20 h-20 rounded-full bg-[#C8A96A]/5 flex items-center justify-center">
                <Search className="w-8 h-8 text-[#C8A96A]/20" />
              </div>
              <p className="text-white/40 text-base font-headline italic">No articles found</p>
              <p className="text-white/20 text-sm">Check back soon for new stories</p>
            </div>
          ) : (
            <>
              {/* Featured Post (first post) */}
              {filteredBlogs.length > 0 && !searchTerm && page === 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7 }}
                  className="mb-16 cursor-pointer group"
                  onClick={() => openBlog(filteredBlogs[0])}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-[#0a2e21] rounded-2xl border border-[#C8A96A]/10 overflow-hidden hover:border-[#C8A96A]/25 transition-all duration-500">
                    <div className="aspect-video lg:aspect-auto overflow-hidden">
                      <img
                        src={filteredBlogs[0].coverImage}
                        alt={filteredBlogs[0].title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    </div>
                    <div className="p-8 md:p-12 flex flex-col justify-center">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-[10px] uppercase tracking-widest text-[#C8A96A] font-bold bg-[#C8A96A]/10 px-3 py-1 rounded-full">
                          Featured
                        </span>
                        {filteredBlogs[0].tags[0] && (
                          <span className="text-[10px] uppercase tracking-widest text-[#C8A96A]/50 font-bold">
                            {filteredBlogs[0].tags[0]}
                          </span>
                        )}
                      </div>
                      <h2 className="font-headline text-2xl md:text-4xl italic text-white mb-4 group-hover:text-[#C8A96A] transition-colors duration-300 leading-tight">
                        {filteredBlogs[0].title}
                      </h2>
                      <p className="text-white/50 text-sm mb-6 leading-relaxed line-clamp-3">
                        {filteredBlogs[0].description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-[10px] text-[#C8A96A]/40">
                          <span className="flex items-center gap-1.5">
                            <User className="w-3 h-3" /> {filteredBlogs[0].author}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3" />
                            {new Date(filteredBlogs[0].publishedAt || filteredBlogs[0].createdAt).toLocaleDateString("en-US", {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <span className="flex items-center gap-1.5 text-[#C8A96A] text-xs font-bold uppercase tracking-widest group-hover:gap-3 transition-all duration-300">
                          Read <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Blog Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {(searchTerm || page > 1 ? filteredBlogs : filteredBlogs.slice(1)).map((blog, idx) => (
                  <motion.div
                    key={blog._id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: idx * 0.08 }}
                    className="cursor-pointer group"
                    onClick={() => openBlog(blog)}
                  >
                    <div className="bg-[#0a2e21] rounded-2xl border border-[#C8A96A]/10 overflow-hidden hover:border-[#C8A96A]/25 hover:shadow-[0_20px_60px_-15px_rgba(200,169,106,0.1)] transition-all duration-500">
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={blog.coverImage}
                          alt={blog.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 brightness-[0.85] group-hover:brightness-100"
                        />
                      </div>
                      <div className="p-6">
                        {blog.tags.length > 0 && (
                          <div className="flex gap-2 mb-3">
                            {blog.tags.slice(0, 2).map((tag) => (
                              <span
                                key={tag}
                                className="text-[9px] uppercase tracking-widest text-[#C8A96A]/60 font-bold"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        <h3 className="font-headline text-lg italic text-white mb-2 group-hover:text-[#C8A96A] transition-colors duration-300 line-clamp-2 leading-snug">
                          {blog.title}
                        </h3>
                        <p className="text-white/40 text-xs mb-4 line-clamp-2 leading-relaxed">
                          {blog.description}
                        </p>
                        <div className="flex items-center justify-between pt-4 border-t border-[#C8A96A]/5">
                          <span className="text-[10px] text-[#C8A96A]/30 flex items-center gap-1.5">
                            <Calendar className="w-3 h-3" />
                            {new Date(blog.publishedAt || blog.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <span className="flex items-center gap-1 text-[#C8A96A]/60 text-[10px] font-bold uppercase tracking-widest group-hover:text-[#C8A96A] group-hover:gap-2 transition-all duration-300">
                            Read <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-16">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg border border-[#C8A96A]/15 text-[#C8A96A]/50 hover:text-[#C8A96A] hover:border-[#C8A96A]/30 disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-[#C8A96A]/50 text-xs font-bold uppercase tracking-widest">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg border border-[#C8A96A]/15 text-[#C8A96A]/50 hover:text-[#C8A96A] hover:border-[#C8A96A]/30 disabled:opacity-30 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Blog Detail Modal */}
      <AnimatePresence>
        {(selectedBlog || loadingBlog) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm overflow-y-auto"
            onClick={(e) => e.target === e.currentTarget && closeBlog()}
          >
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.4 }}
              className="max-w-4xl mx-auto my-8 md:my-16"
            >
              {loadingBlog && !selectedBlog ? (
                <div className="flex items-center justify-center py-32">
                  <Loader2 className="w-8 h-8 text-[#C8A96A] animate-spin" />
                </div>
              ) : selectedBlog ? (
                <article className="bg-[#0a2e21] rounded-2xl border border-[#C8A96A]/15 overflow-hidden shadow-2xl">
                  {/* Close button */}
                  <button
                    onClick={closeBlog}
                    className="fixed top-6 right-6 z-10 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors backdrop-blur-sm"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  {/* Cover Image */}
                  <div className="aspect-video md:aspect-[21/9] overflow-hidden relative">
                    <img
                      src={selectedBlog.coverImage}
                      alt={selectedBlog.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a2e21] via-transparent to-transparent" />
                  </div>

                  {/* Content */}
                  <div className="px-6 md:px-16 py-10 md:py-16 -mt-20 relative">
                    {/* Tags */}
                    {selectedBlog.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {selectedBlog.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[9px] uppercase tracking-widest text-[#C8A96A] font-bold bg-[#C8A96A]/10 px-3 py-1 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <h1 className="font-headline text-3xl md:text-5xl italic text-white mb-6 leading-tight">
                      {selectedBlog.title}
                    </h1>

                    {/* Meta */}
                    <div className="flex items-center gap-6 mb-10 pb-8 border-b border-[#C8A96A]/10">
                      <span className="flex items-center gap-2 text-xs text-[#C8A96A]/50">
                        <User className="w-3.5 h-3.5" /> {selectedBlog.author}
                      </span>
                      <span className="flex items-center gap-2 text-xs text-[#C8A96A]/50">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(selectedBlog.publishedAt || selectedBlog.createdAt).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-white/70 text-lg leading-relaxed mb-8 font-body italic border-l-4 border-[#C8A96A]/20 pl-6">
                      {selectedBlog.description}
                    </p>

                    {/* Blog Content */}
                    <div
                      className="prose prose-invert max-w-none text-white/70 leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: `<p class="text-white/70 leading-relaxed mb-4">${renderContent(selectedBlog.content)}</p>`,
                      }}
                    />

                    {/* Gallery Images */}
                    {selectedBlog.images.length > 0 && (
                      <div className="mt-12 pt-8 border-t border-[#C8A96A]/10">
                        <h3 className="font-headline text-xl italic text-[#C8A96A] mb-6">Gallery</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {selectedBlog.images.map((img, idx) => (
                            <div key={idx} className="aspect-square rounded-xl overflow-hidden">
                              <img
                                src={img}
                                alt={`Gallery ${idx + 1}`}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
