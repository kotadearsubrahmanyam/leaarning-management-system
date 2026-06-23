"use client";

import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  MessageSquare,
  Heart,
  Bookmark,
  Share2,
  Pin,
  Plus,
  Trash2,
  Edit2,
  Image as ImageIcon,
  FileText,
  Video,
  Link2,
  Search,
  X,
  Check,
  Send,
  CornerDownRight,
  Sparkles,
  AlertCircle,
  FileDown,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const CATEGORIES = [
  { value: "ALL", label: "All Discussions", emoji: "🌐" },
  { value: "ANNOUNCEMENTS", label: "Announcements", emoji: "📢" },
  { value: "ACADEMICS", label: "Academics", emoji: "📚" },
  { value: "PLACEMENTS", label: "Placements", emoji: "💼" },
  { value: "EVENTS", label: "Events", emoji: "🎉" },
  { value: "ACHIEVEMENTS", label: "Achievements", emoji: "🏆" },
  { value: "GENERAL", label: "General Discussions", emoji: "💬" }
];

const CATEGORY_MAP: Record<string, { label: string; emoji: string }> = {
  ANNOUNCEMENTS: { label: "Announcement", emoji: "📢" },
  ACADEMICS: { label: "Academics", emoji: "📚" },
  PLACEMENTS: { label: "Placements", emoji: "💼" },
  EVENTS: { label: "Events", emoji: "🎉" },
  ACHIEVEMENTS: { label: "Achievements", emoji: "🏆" },
  GENERAL: { label: "General", emoji: "💬" }
};

interface Attachment {
  name: string;
  url: string;
  type: string;
}

export default function CommunityHub() {
  const queryClient = useQueryClient();

  // Feed Filter state
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  // New Post Form state
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [postCategory, setPostCategory] = useState("GENERAL");
  const [postLinkShare, setPostLinkShare] = useState("");
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  // Attachment upload states
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [postAttachments, setPostAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Editing state
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editLinkShare, setEditLinkShare] = useState("");
  const [editAttachments, setEditAttachments] = useState<Attachment[]>([]);

  // Comments state
  const [expandedCommentsPostId, setExpandedCommentsPostId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [replyToCommentId, setReplyToCommentId] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState("");

  // Share Toast state
  const [showShareToast, setShowShareToast] = useState(false);

  // Fetch logged in user
  const { data: authData } = useQuery({
    queryKey: ["authMe"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) throw new Error("Unauthorized");
      return res.json();
    },
  });

  const currentUser = authData?.data?.user;
  const userId = currentUser?.id;
  const userRole = currentUser?.role;

  // Fetch posts
  const { data: postsData, isLoading: isPostsLoading } = useQuery({
    queryKey: ["communityPosts", selectedCategory, searchTerm, showSavedOnly],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== "ALL") params.append("category", selectedCategory);
      if (searchTerm) params.append("search", searchTerm);
      if (showSavedOnly) params.append("savedOnly", "true");

      const res = await fetch(`/api/community/posts?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch posts");
      return res.json();
    },
  });

  const postsList = postsData?.data?.posts || [];

  // Mutations
  const createPostMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create post");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communityPosts"] });
      setPostContent("");
      setPostLinkShare("");
      setPostAttachments([]);
      setIsAnnouncement(false);
      setIsPinned(false);
      setIsComposerOpen(false);
    },
  });

  const updatePostMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const res = await fetch(`/api/community/posts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update post");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communityPosts"] });
      setEditingPostId(null);
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/community/posts/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete post");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communityPosts"] });
    },
  });

  const toggleLikeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/community/posts/${id}/like`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to toggle like");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communityPosts"] });
    },
  });

  const toggleSaveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/community/posts/${id}/save`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to toggle save");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communityPosts"] });
    },
  });

  const togglePinMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/community/posts/${id}/pin`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to toggle pin");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communityPosts"] });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async ({ postId, content, parentId }: { postId: string; content: string; parentId?: string }) => {
      const res = await fetch(`/api/community/posts/${postId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, parentId }),
      });
      if (!res.ok) throw new Error("Failed to post comment");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communityPosts"] });
      setReplyToCommentId(null);
      setReplyInput("");
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const res = await fetch(`/api/community/comments/${commentId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete comment");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communityPosts"] });
    },
  });

  // Handle file uploading with local mock fallback
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadingFile(true);
      setUploadProgress(10);

      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        let fileUrl = "";
        let fileType = file.type || "application/octet-stream";

        // Try Supabase Storage first
        if (supabaseUrl && supabaseKey) {
          const supabase = createClient(supabaseUrl, supabaseKey);
          const fileExt = file.name.split(".").pop();
          const fileName = `community/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          
          setUploadProgress(40);
          const { error: uploadError } = await supabase.storage
            .from("materials")
            .upload(fileName, file, { cacheControl: "3600", upsert: false });

          if (!uploadError) {
            setUploadProgress(80);
            const { data: { publicUrl } } = supabase.storage
              .from("materials")
              .getPublicUrl(fileName);
            fileUrl = publicUrl;
          }
        }

        // Fallback mock URLs if Supabase is offline/unconfigured
        if (!fileUrl) {
          setUploadProgress(60);
          await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate delay
          if (file.type.startsWith("image/")) {
            fileUrl = `https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=600`;
          } else if (file.type.startsWith("video/")) {
            fileUrl = "https://www.w3schools.com/html/mov_bbb.mp4";
          } else {
            fileUrl = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
          }
        }

        const newAttachment: Attachment = {
          name: file.name,
          url: fileUrl,
          type: fileType.startsWith("image/") ? "IMAGE" : fileType.startsWith("video/") ? "VIDEO" : fileType === "application/pdf" ? "PDF" : "DOCUMENT"
        };

        setUploadProgress(100);
        setTimeout(() => {
          if (editingPostId) {
            setEditAttachments((prev) => [...prev, newAttachment]);
          } else {
            setPostAttachments((prev) => [...prev, newAttachment]);
          }
          setUploadingFile(false);
          setUploadProgress(0);
        }, 300);

      } catch (err) {
        console.error("Upload error:", err);
        alert("Upload failed. Using mock attachment instead.");
        setUploadingFile(false);
        setUploadProgress(0);
      }
    }
  };

  // Autocomplete suggestions mock data
  const handleMentionSuggestion = (val: string) => {
    // If text ends with @name, we can suggest usernames. 
    // In a fully featured frontend this would search in users. We will implement support by rendering clean helper guides.
  };

  // Submit new post
  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) return;

    createPostMutation.mutate({
      content: postContent,
      category: postCategory,
      attachments: postAttachments.length > 0 ? postAttachments : null,
      linkShare: postLinkShare.trim() || null,
      isAnnouncement: isAnnouncement,
      isPinned: isPinned
    });
  };

  // Submit edit post
  const handleUpdatePost = (postId: string) => {
    if (!editContent.trim()) return;
    updatePostMutation.mutate({
      id: postId,
      payload: {
        content: editContent,
        category: editCategory,
        attachments: editAttachments.length > 0 ? editAttachments : null,
        linkShare: editLinkShare.trim() || null,
      }
    });
  };

  const handleStartEditing = (post: any) => {
    setEditingPostId(post.id);
    setEditContent(post.content);
    setEditCategory(post.category);
    setEditLinkShare(post.linkShare || "");
    try {
      setEditAttachments(post.attachments ? JSON.parse(post.attachments) : []);
    } catch {
      setEditAttachments([]);
    }
  };

  // Delete post
  const handleDeletePost = (postId: string) => {
    if (confirm("Are you sure you want to permanently delete this post and all its interactions?")) {
      deletePostMutation.mutate(postId);
    }
  };

  // Handle posting a comment
  const handlePostComment = (postId: string) => {
    const content = commentInputs[postId];
    if (!content || !content.trim()) return;

    addCommentMutation.mutate({
      postId,
      content: content.trim()
    }, {
      onSuccess: () => {
        setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
      }
    });
  };

  // Handle posting a reply to a comment
  const handlePostReply = (postId: string, commentId: string) => {
    if (!replyInput.trim()) return;

    addCommentMutation.mutate({
      postId,
      content: replyInput.trim(),
      parentId: commentId
    });
  };

  // Copy post link
  const handleSharePost = (postId: string) => {
    const postLink = `${window.location.origin}/dashboard/community?postId=${postId}`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(postLink);
      } else {
        // Fallback for non-secure contexts
        const textArea = document.createElement("textarea");
        textArea.value = postLink;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try { document.execCommand('copy'); } catch (err) {}
        document.body.removeChild(textArea);
      }
    } catch(e) {}
    
    setShowShareToast(true);
    setTimeout(() => setShowShareToast(false), 3000);
  };

  // Helper: Get user's avatar color/gradient based on role
  const getUserAvatarGradient = (role: string, name: string) => {
    const charCodeSum = name.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const gradients = [
      "from-emerald-500 to-teal-600",
      "from-cyan-500 to-blue-600",
      "from-violet-500 to-purple-600",
      "from-fuchsia-500 to-pink-600",
      "from-amber-500 to-orange-600"
    ];
    
    if (role === "ADMIN") return "from-rose-500 to-red-600 border-rose-400";
    if (role === "TEACHER") return "from-indigo-500 to-blue-600 border-indigo-400";
    return `${gradients[charCodeSum % gradients.length]} border-slate-700`;
  };

  // Format date helper
  const formatTimeAgo = (dateInput: any) => {
    const now = new Date();
    const date = new Date(dateInput);
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);

    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    return date.toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pb-16 relative z-10 text-slate-800">
      
      {/* Share success toast */}
      <AnimatePresence>
        {showShareToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 12, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-slate-900 border border-[#10B981]/30 rounded-xl shadow-2xl flex items-center gap-2 text-white text-xs font-bold"
          >
            <Check className="text-[#10B981]" size={16} /> Link copied to clipboard! Share with your peers.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header section */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-2.5">
            <Users className="text-[#10B981]" size={32} /> Campus Community Hub
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Connect, discuss, share academic announcements, and collaborate across departments.</p>
        </div>
        <button
          onClick={() => setIsComposerOpen(true)}
          className="flex items-center justify-center gap-1.5 px-5 py-3 bg-gradient-to-r from-[#10B981] to-[#059669] text-white font-extrabold text-sm rounded-2xl shadow-[0_4px_14px_rgba(16,185,129,0.35)] hover:scale-[1.03] transition-transform active:scale-[0.98]"
        >
          <Plus size={18} /> Share Update
        </button>
      </motion.div>

      {/* Filter and Search controls */}
      <div className="bg-white p-5 rounded-3xl border border-slate-300 shadow-sm mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-3 flex-1 w-full">
            <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-slate-50 border border-slate-300 text-slate-400">
              <Search className="h-5 w-5" />
            </div>
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search posts, topics, categories, hashtags, or users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 pr-10 w-full bg-slate-50 border border-slate-300 rounded-xl py-2.5 text-slate-700 focus:outline-none focus:border-[#10B981] focus:bg-white text-sm transition-all"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowSavedOnly(!showSavedOnly)}
            className={`flex items-center justify-center gap-1.5 px-4 py-2.5 border rounded-xl text-xs font-bold transition-all w-full sm:w-auto ${
              showSavedOnly 
                ? "bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30 shadow-sm"
                : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
            }`}
          >
            <Bookmark size={15} className={showSavedOnly ? "fill-current" : ""} />
            Saved Posts Only
          </button>
        </div>

        {/* Category filtering tags */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin select-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap border transition-all flex items-center gap-1.5 ${
                selectedCategory === cat.value
                  ? "bg-slate-900 border-slate-950 text-white shadow-sm"
                  : "bg-slate-50 border-slate-300 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span>{cat.emoji}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Composer Modal */}
      <AnimatePresence>
        {isComposerOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-300 w-full max-w-xl overflow-hidden shadow-2xl"
            >
              <div className="p-5 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-extrabold text-base text-slate-800 flex items-center gap-2">
                  <Sparkles className="text-[#10B981]" size={18} /> Compose Post
                </h3>
                <button onClick={() => setIsComposerOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreatePost} className="p-6 space-y-4">
                {/* Category Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Category</label>
                    <select
                      value={postCategory}
                      onChange={(e) => setPostCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-700 focus:outline-none focus:border-[#10B981] text-xs font-bold"
                    >
                      {CATEGORIES.filter(c => c.value !== "ALL").map(c => (
                        <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Share Link (Optional)</label>
                    <div className="relative">
                      <Link2 className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="url"
                        placeholder="https://example.com"
                        value={postLinkShare}
                        onChange={(e) => setPostLinkShare(e.target.value)}
                        className="pl-9 w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-700 focus:outline-none focus:border-[#10B981] text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Content Editor */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Share what is on your mind</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Write your post here... Use @name or @rollNumber to mention someone, e.g. @25CSE001!"
                    value={postContent}
                    onChange={(e) => {
                      setPostContent(e.target.value);
                      handleMentionSuggestion(e.target.value);
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:border-[#10B981] resize-y placeholder:text-slate-400"
                  />
                </div>

                {/* File Attachment Uploader Row */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Attachments</span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingFile}
                      className="text-xs text-[#10B981] hover:text-[#059669] font-extrabold flex items-center gap-1.5 bg-[#10B981]/10 px-3 py-1.5 rounded-lg disabled:opacity-50"
                    >
                      <Plus size={14} /> Add File
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden"
                      accept="image/*,video/*,application/pdf"
                    />
                  </div>

                  {/* Uploading progress bar */}
                  {uploadingFile && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-slate-500 font-bold">
                        <span>Uploading files...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#10B981]" style={{ width: `${uploadProgress}%` }} />
                      </div>
                    </div>
                  )}

                  {/* Render uploaded items */}
                  {postAttachments.length > 0 && (
                    <div className="flex flex-wrap gap-2.5">
                      {postAttachments.map((att, i) => (
                        <div key={i} className="flex items-center gap-2 bg-slate-50 border border-slate-300 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700">
                          {att.type === "IMAGE" && <ImageIcon size={14} className="text-emerald-500" />}
                          {att.type === "VIDEO" && <Video size={14} className="text-indigo-500" />}
                          {att.type === "PDF" && <FileText size={14} className="text-red-500" />}
                          {att.type === "DOCUMENT" && <FileText size={14} className="text-slate-500" />}
                          <span className="max-w-[120px] truncate">{att.name}</span>
                          <button
                            type="button"
                            onClick={() => setPostAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                            className="text-slate-400 hover:text-red-500 ml-1"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Faculty/Admin controls: Announcement and Pin options */}
                {(userRole === "ADMIN" || userRole === "TEACHER") && (
                  <div className="border-t border-slate-100 pt-4 flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600">
                        <input
                          type="checkbox"
                          checked={isAnnouncement}
                          onChange={(e) => setIsAnnouncement(e.target.checked)}
                          className="rounded text-[#10B981] focus:ring-[#10B981]"
                        />
                        📢 Announcement Notice
                      </label>

                      {userRole === "ADMIN" && (
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600">
                          <input
                            type="checkbox"
                            checked={isPinned}
                            onChange={(e) => setIsPinned(e.target.checked)}
                            className="rounded text-[#10B981] focus:ring-[#10B981]"
                          />
                          📌 Pin to top
                        </label>
                      )}
                    </div>
                  </div>
                )}

                {/* Footer buttons */}
                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsComposerOpen(false)}
                    className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-2xl text-xs transition-colors"
                  >
                    Discard
                  </button>
                  <button
                    type="submit"
                    disabled={createPostMutation.isPending}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-[#10B981] to-[#059669] text-white font-extrabold rounded-2xl text-xs shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center"
                  >
                    {createPostMutation.isPending ? "Posting..." : "Publish Post"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Social Feed Lists */}
      {isPostsLoading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#10B981] mx-auto mb-4" />
          <p className="text-sm font-medium">Fetching community feed...</p>
        </div>
      ) : postsList.length === 0 ? (
        <div className="bg-white border border-slate-300 rounded-3xl p-16 text-center text-slate-400 shadow-sm">
          <Users size={56} className="mx-auto text-slate-200 mb-4" />
          <h3 className="font-extrabold text-slate-800 text-lg mb-1">No Updates Found</h3>
          <p className="text-sm max-w-md mx-auto">No posts match your search or filter filters. Be the first to share an update with the campus!</p>
          <button
            onClick={() => setIsComposerOpen(true)}
            className="mt-6 inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#10B981] text-white font-bold text-xs rounded-xl shadow-sm hover:bg-[#059669] transition-colors"
          >
            <Plus size={14} /> Share Post
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {postsList.map((post: any) => {
            const hasAttachments = post.attachments && post.attachments !== "null";
            let attachmentsList: Attachment[] = [];
            if (hasAttachments) {
              try {
                attachmentsList = JSON.parse(post.attachments);
              } catch {
                attachmentsList = [];
              }
            }

            const isEditing = editingPostId === post.id;

            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-3xl border border-slate-300 shadow-sm overflow-hidden hover:shadow-md transition-shadow relative ${
                  post.isPinned ? "border-amber-300 ring-2 ring-amber-400/10" : ""
                }`}
              >
                {/* Pin/Announcement Badges */}
                {(post.isPinned || post.isAnnouncement) && (
                  <div className="bg-slate-50 border-b border-slate-100 px-5 py-2.5 flex items-center gap-4 text-xs font-extrabold">
                    {post.isPinned && (
                      <span className="text-amber-600 flex items-center gap-1">
                        <Pin size={13} className="fill-current rotate-45" /> PINNED ANNOUNCEMENT
                      </span>
                    )}
                    {post.isAnnouncement && (
                      <span className="text-emerald-600 flex items-center gap-1">
                        📢 OFFICIAL NOTICE
                      </span>
                    )}
                  </div>
                )}

                {/* Post Author / Header */}
                <div className="p-6 pb-4 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* User Profile Avatar with Role color */}
                    <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${getUserAvatarGradient(post.author.role, post.author.name)} flex items-center justify-center text-white text-sm font-black border shadow-inner`}>
                      {post.author.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-800 text-sm hover:underline cursor-pointer">{post.author.name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${
                          post.author.role === "ADMIN"
                            ? "bg-rose-50 text-rose-600 border-rose-200"
                            : post.author.role === "TEACHER"
                            ? "bg-indigo-50 text-indigo-600 border-indigo-200"
                            : "bg-emerald-50 text-emerald-600 border-emerald-200"
                        }`}>
                          {post.author.role === "ADMIN" ? "Admin" : post.author.role === "TEACHER" ? "Faculty" : "Student"}
                        </span>
                        {post.author.rollNumber && (
                          <span className="text-[10px] text-slate-400 font-mono font-bold">({post.author.rollNumber})</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 font-bold flex items-center gap-1.5">
                        <span>{formatTimeAgo(post.createdAt)}</span>
                        <span>•</span>
                        <span className="uppercase text-[9px] tracking-wider text-[#10B981]">{CATEGORY_MAP[post.category]?.emoji} {CATEGORY_MAP[post.category]?.label || post.category}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Dropdown / Editing & Pin Options */}
                  <div className="flex items-center gap-2.5">
                    {userRole === "ADMIN" && (
                      <button
                        onClick={() => togglePinMutation.mutate(post.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          post.isPinned ? "text-amber-500 bg-amber-50 hover:bg-amber-100" : "text-slate-400 hover:text-slate-600"
                        }`}
                        title={post.isPinned ? "Unpin Post" : "Pin Post"}
                      >
                        <Pin size={16} className={post.isPinned ? "fill-current rotate-45" : "rotate-45"} />
                      </button>
                    )}

                    {(userRole === "ADMIN" || post.authorId === userId) && !isEditing && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleStartEditing(post)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-slate-50 rounded-lg transition-colors"
                          title="Edit Post"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded-lg transition-colors"
                          title="Delete Post"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Editing Form Inline */}
                {isEditing ? (
                  <div className="px-6 pb-6 space-y-4 bg-slate-50/50 border-y border-slate-100 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Category</label>
                        <select
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-[#10B981]"
                        >
                          {CATEGORIES.filter(c => c.value !== "ALL").map(c => (
                            <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Link Share</label>
                        <input
                          type="url"
                          value={editLinkShare}
                          onChange={(e) => setEditLinkShare(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#10B981]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Edit Post Content</label>
                      <textarea
                        rows={3}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#10B981]"
                      />
                    </div>

                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setEditingPostId(null)}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdatePost(post.id)}
                        className="px-3 py-2 bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-xl text-xs transition-colors"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Post Content */}
                    <div className="px-6 pb-4 text-sm text-slate-700 leading-relaxed break-words whitespace-pre-wrap">
                      {/* Regex highlight mentions: @username */}
                      {post.content.split(/(\s+)/).map((part: string, idx: number) => {
                        if (part.startsWith("@") && part.length > 1) {
                          return (
                            <span key={idx} className="text-[#10B981] font-bold bg-[#10B981]/10 px-1 py-0.5 rounded cursor-pointer hover:underline">
                              {part}
                            </span>
                          );
                        }
                        return part;
                      })}
                    </div>

                    {/* Shared Link Card */}
                    {post.linkShare && (
                      <div className="px-6 pb-4">
                        <a
                          href={post.linkShare}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2.5 p-3 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-2xl text-xs transition-all hover:scale-[1.005] group"
                        >
                          <Link2 className="text-[#10B981] shrink-0" size={16} />
                          <span className="font-bold text-slate-700 truncate flex-1 hover:underline">{post.linkShare}</span>
                          <ExternalLink size={13} className="text-slate-400 group-hover:text-slate-600" />
                        </a>
                      </div>
                    )}

                    {/* Post Attachments Previews */}
                    {attachmentsList.length > 0 && (
                      <div className="px-6 pb-4 space-y-2">
                        {attachmentsList.map((att, idx) => (
                          <div key={idx} className="border border-slate-300 rounded-2xl overflow-hidden bg-slate-50">
                            {/* Attachment type renders */}
                            {att.type === "IMAGE" && (
                              <div className="relative max-h-72 overflow-hidden flex items-center justify-center bg-black/5">
                                <img
                                  src={att.url}
                                  alt={att.name}
                                  className="w-full object-cover max-h-72 hover:scale-[1.01] transition-transform duration-300"
                                />
                              </div>
                            )}

                            {att.type === "VIDEO" && (
                              <div className="bg-black/5 flex justify-center">
                                <video src={att.url} controls className="w-full max-h-72" />
                              </div>
                            )}

                            {/* PDF or Document File Bar */}
                            {(att.type === "PDF" || att.type === "DOCUMENT") && (
                              <div className="p-4 flex items-center justify-between gap-3 text-xs">
                                <div className="flex items-center gap-2.5">
                                  {att.type === "PDF" ? (
                                    <FileText size={20} className="text-red-500 shrink-0" />
                                  ) : (
                                    <FileText size={20} className="text-slate-500 shrink-0" />
                                  )}
                                  <div className="min-w-0">
                                    <p className="font-bold text-slate-700 truncate">{att.name}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">{att.type} Attachment</p>
                                  </div>
                                </div>
                                <a
                                  href={att.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download
                                  className="flex items-center gap-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-600 font-extrabold px-3 py-1.5 rounded-lg transition-colors"
                                >
                                  <FileDown size={14} /> Open
                                </a>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* Interactions Footer Bar */}
                <div className="border-t border-slate-100 px-6 py-3 flex items-center justify-between text-slate-500 text-xs">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => toggleLikeMutation.mutate(post.id)}
                      className={`flex items-center gap-1.5 font-bold transition-all hover:scale-105 ${
                        post.isLiked ? "text-red-500" : "hover:text-red-500 text-slate-500"
                      }`}
                    >
                      <Heart size={16} className={post.isLiked ? "fill-current text-red-500 animate-pulse" : ""} />
                      <span>{post.likesCount}</span>
                    </button>

                    <button
                      onClick={() => setExpandedCommentsPostId(
                        expandedCommentsPostId === post.id ? null : post.id
                      )}
                      className="flex items-center gap-1.5 font-bold hover:text-[#10B981]"
                    >
                      <MessageSquare size={16} />
                      <span>{post.commentsCount}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleSharePost(post.id)}
                      className="p-1.5 hover:text-[#10B981] transition-colors"
                      title="Share post link"
                    >
                      <Share2 size={15} />
                    </button>
                    <button
                      onClick={() => toggleSaveMutation.mutate(post.id)}
                      className={`p-1.5 transition-colors ${
                        post.isSaved ? "text-[#10B981]" : "hover:text-[#10B981] text-slate-400"
                      }`}
                      title={post.isSaved ? "Remove Bookmark" : "Save Bookmark"}
                    >
                      <Bookmark size={15} className={post.isSaved ? "fill-current" : ""} />
                    </button>
                  </div>
                </div>

                {/* Pinned / Comments Section Drawer */}
                {expandedCommentsPostId === post.id && (
                  <div className="bg-slate-50/50 border-t border-slate-100 p-6 space-y-4">
                    <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider">Comments Tree</h4>
                    
                    {/* Add Comment Input Bar */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add a public comment..."
                        value={commentInputs[post.id] || ""}
                        onChange={(e) => setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))}
                        className="flex-grow bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#10B981]"
                      />
                      <button
                        onClick={() => handlePostComment(post.id)}
                        className="px-3 py-2 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center shrink-0"
                      >
                        <Send size={13} />
                      </button>
                    </div>

                    {/* Render comments list */}
                    {post.comments.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-2">No comments yet. Write one above!</p>
                    ) : (
                      <div className="space-y-4">
                        {/* Parent comments (parentId is null) */}
                        {post.comments
                          .filter((c: any) => !c.parentId)
                          .map((c: any) => {
                            const replies = post.comments.filter((rep: any) => rep.parentId === c.id);
                            return (
                              <div key={c.id} className="space-y-2.5">
                                {/* Comment Body */}
                                <div className="flex items-start gap-2.5">
                                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getUserAvatarGradient(c.author.role, c.author.name)} flex items-center justify-center text-white text-xs font-black shadow-inner`}>
                                    {c.author.name[0].toUpperCase()}
                                  </div>
                                  <div className="flex-1 bg-white p-3 rounded-2xl border border-slate-300 text-xs">
                                    <div className="flex justify-between items-center mb-1">
                                      <div className="flex items-center gap-1">
                                        <span className="font-bold text-slate-800">{c.author.name}</span>
                                        <span className="text-[9px] text-slate-400 font-mono">({c.author.role})</span>
                                      </div>
                                      
                                      {(userRole === "ADMIN" || c.authorId === userId) && (
                                        <button
                                          onClick={() => deleteCommentMutation.mutate(c.id)}
                                          className="text-slate-400 hover:text-red-500"
                                          title="Delete comment"
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      )}
                                    </div>
                                    <p className="text-slate-700 leading-relaxed">{c.content}</p>

                                    {/* Reply Toggle */}
                                    <div className="mt-2.5 flex gap-2">
                                      <button
                                        onClick={() => {
                                          setReplyToCommentId(replyToCommentId === c.id ? null : c.id);
                                          setReplyInput("");
                                        }}
                                        className="text-[10px] text-[#10B981] font-extrabold hover:underline"
                                      >
                                        Reply
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* Reply Input block */}
                                {replyToCommentId === c.id && (
                                  <div className="pl-10 flex gap-2">
                                    <CornerDownRight className="text-slate-400 shrink-0" size={16} />
                                    <input
                                      type="text"
                                      placeholder={`Reply to ${c.author.name}...`}
                                      value={replyInput}
                                      onChange={(e) => setReplyInput(e.target.value)}
                                      className="flex-grow bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-[#10B981]"
                                    />
                                    <button
                                      onClick={() => handlePostReply(post.id, c.id)}
                                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-bold rounded-xl shadow-sm transition-colors"
                                    >
                                      Post
                                    </button>
                                  </div>
                                )}

                                {/* Comment Replies list */}
                                {replies.map((rep: any) => (
                                  <div key={rep.id} className="pl-10 flex items-start gap-2.5">
                                    <CornerDownRight className="text-slate-300 shrink-0 mt-2" size={14} />
                                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getUserAvatarGradient(rep.author.role, rep.author.name)} flex items-center justify-center text-white text-xs font-black shadow-inner`}>
                                      {rep.author.name[0].toUpperCase()}
                                    </div>
                                    <div className="flex-grow bg-white p-3 rounded-2xl border border-slate-300 text-xs">
                                      <div className="flex justify-between items-center mb-1">
                                        <div className="flex items-center gap-1">
                                          <span className="font-bold text-slate-800">{rep.author.name}</span>
                                          <span className="text-[9px] text-slate-400 font-mono">({rep.author.role})</span>
                                        </div>
                                        
                                        {(userRole === "ADMIN" || rep.authorId === userId) && (
                                          <button
                                            onClick={() => deleteCommentMutation.mutate(rep.id)}
                                            className="text-slate-400 hover:text-red-500"
                                            title="Delete reply"
                                          >
                                            <Trash2 size={12} />
                                          </button>
                                        )}
                                      </div>
                                      <p className="text-slate-700 leading-relaxed">{rep.content}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
