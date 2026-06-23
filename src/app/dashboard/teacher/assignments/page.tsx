"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileEdit, 
  Plus, 
  X, 
  Calendar, 
  Download, 
  Eye, 
  Archive, 
  Copy, 
  FileText, 
  CheckCircle, 
  Clock, 
  Trash2, 
  Users, 
  Layers, 
  Award,
  Sparkles,
  Search,
  Filter,
  ChevronDown
} from "lucide-react";
import { AnimatedButton } from "@/components/ui/animated-button";
import { AnimatedInput } from "@/components/ui/animated-input";
import { CourseSelect } from "@/components/ui/course-select";
import { useRouter } from "next/navigation";

export default function TeacherAssignmentsPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PUBLISHED" | "DRAFT" | "ARCHIVED">("ALL");

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<any>(null);
  const [viewingAssignment, setViewingAssignment] = useState<any>(null);

  // Form states
  const [formData, setFormData] = useState({
    courseId: "",
    title: "",
    instructions: "",
    questions: "",
    attachmentUrl: "",
    dueDate: "",
    totalMarks: "100",
    status: "PUBLISHED",
  });

  const { data: coursesData } = useQuery({
    queryKey: ["teacherCourses"],
    queryFn: async () => {
      const res = await fetch("/api/courses?teacherOnly=true");
      if (!res.ok) throw new Error("Failed to fetch courses");
      return res.json();
    },
  });

  const { data: assignmentsData, isLoading } = useQuery({
    queryKey: ["teacherAssignments"],
    queryFn: async () => {
      const res = await fetch("/api/teacher/assignments");
      if (!res.ok) throw new Error("Failed to fetch assignments");
      return res.json();
    },
  });

  const courses = coursesData?.data?.courses || [];
  const assignments = assignmentsData?.data?.assignments || [];

  useEffect(() => {
    if (courses.length === 1 && !formData.courseId) {
      setFormData(prev => ({ ...prev, courseId: courses[0].id }));
    }
  }, [courses, formData.courseId]);

  // Handle Edit Assignment click (pre-fills form)
  const openEditModal = (a: any) => {
    // Format date string to YYYY-MM-DD for input element
    const rawDate = new Date(a.dueDate);
    const year = rawDate.getFullYear();
    const month = String(rawDate.getMonth() + 1).padStart(2, '0');
    const day = String(rawDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    setEditingAssignment(a);
    setFormData({
      courseId: a.courseId,
      title: a.title,
      instructions: a.instructions || a.description || "",
      questions: a.questions || "",
      attachmentUrl: a.attachmentUrl || "",
      dueDate: dateStr,
      totalMarks: a.totalMarks ? a.totalMarks.toString() : "100",
      status: a.status || "PUBLISHED",
    });
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/teacher/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to create assignment");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacherAssignments"] });
      setIsCreateOpen(false);
      resetForm();
      alert("Assignment published successfully!");
    },
    onError: (err: any) => {
      alert(`Error creating assignment: ${err.message}`);
    }
  });

  const editMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/teacher/assignments/${editingAssignment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update assignment");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacherAssignments"] });
      setEditingAssignment(null);
      resetForm();
      alert("Assignment updated successfully!");
    },
    onError: (err: any) => {
      alert(`Error updating assignment: ${err.message}`);
    }
  });

  const archiveMutation = useMutation({
    mutationFn: async ({ id, archive }: { id: string; archive: boolean }) => {
      const res = await fetch(`/api/teacher/assignments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: archive ? "ARCHIVED" : "PUBLISHED" }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to archive assignment");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["teacherAssignments"] });
      alert(`Assignment successfully ${variables.archive ? "archived" : "unarchived"}!`);
    },
    onError: (err: any) => {
      alert(`Error: ${err.message}`);
    }
  });

  const duplicateMutation = useMutation({
    mutationFn: async (a: any) => {
      const res = await fetch("/api/teacher/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: a.courseId,
          title: `Copy of ${a.title}`,
          instructions: a.instructions || a.description || "",
          questions: a.questions || "",
          attachmentUrl: a.attachmentUrl || "",
          dueDate: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // default +7 days
          totalMarks: a.totalMarks || 100,
          status: "DRAFT", // duplicates start as draft
        }),
      });
      if (!res.ok) throw new Error("Failed to duplicate assignment");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacherAssignments"] });
      alert("Assignment duplicated as DRAFT copy successfully!");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/teacher/assignments/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to delete assignment");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacherAssignments"] });
      alert("Assignment deleted successfully.");
    },
    onError: (err: any) => {
      alert(`Error: ${err.message}`);
    }
  });

  const resetForm = () => {
    setFormData({
      courseId: courses.length === 1 ? courses[0].id : "",
      title: "",
      instructions: "",
      questions: "",
      attachmentUrl: "",
      dueDate: "",
      totalMarks: "100",
      status: "PUBLISHED",
    });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.courseId || !formData.title || !formData.dueDate) return;
    createMutation.mutate();
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.courseId || !formData.title || !formData.dueDate) return;
    editMutation.mutate();
  };

  // Filter & Search assignments
  const filteredAssignments = useMemo(() => {
    let list = [...assignments];

    // Course filter
    if (selectedCourse) {
      list = list.filter(a => a.courseId === selectedCourse);
    }

    // Status filter
    if (statusFilter !== "ALL") {
      list = list.filter(a => (a.status || "PUBLISHED") === statusFilter);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(a => a.title.toLowerCase().includes(q) || a.courseName.toLowerCase().includes(q));
    }

    return list;
  }, [assignments, selectedCourse, statusFilter, searchQuery]);

  return (
    <div className="max-w-6xl mx-auto pb-12 relative z-10 px-4 md:px-0">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-3">
            <FileEdit size={32} className="text-emerald-500 animate-pulse" /> Assignment Management
          </h1>
          <p className="text-foreground/70 text-sm">
            Publish, edit, and organize academic assignments, review detailed question lists, and track submissions.
          </p>
        </motion.div>
        <button 
          onClick={() => { resetForm(); setIsCreateOpen(true); }}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
        >
          <Plus size={18} /> Create Assignment
        </button>
      </div>

      {/* Filter and Control Row */}
      <div className="bg-white/70 backdrop-blur-md border border-slate-200 p-4 rounded-3xl shadow-sm mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Course Selection */}
        <div className="relative z-40 w-full md:w-72">
          <CourseSelect
            courses={courses}
            selectedCourse={selectedCourse}
            setSelectedCourse={setSelectedCourse}
            label=""
            placeholder="All Courses"
            showClear={true}
            compact={true}
          />
        </div>

        {/* Search */}
        <div className="flex items-center gap-3 flex-1 w-full max-w-md">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-50 border border-slate-200 text-slate-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            placeholder="Search assignments by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
          />
        </div>

        {/* Status Filter */}
        <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-3 py-1.5 text-sm font-semibold text-slate-700 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 mr-2" />
          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="bg-transparent py-1.5 pr-8 focus:outline-none cursor-pointer appearance-none text-slate-700 font-semibold"
          >
            <option value="ALL">All Statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Drafts</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
        </div>
      </div>

      {/* Roster / Grid of Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-64 bg-slate-100 animate-pulse rounded-3xl border border-slate-200" />
          ))}
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="bg-white/80 border border-slate-200 p-16 rounded-3xl shadow-sm text-center">
          <FileText size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="font-extrabold text-slate-800 text-lg">No Assignments Found</h3>
          <p className="text-sm text-slate-500 mt-1">There are no assignments matching your current search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredAssignments.map((a: any, index: number) => {
            const isArchived = (a.status || "PUBLISHED") === "ARCHIVED";
            const isDraft = (a.status || "PUBLISHED") === "DRAFT";
            
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, scale: 0.97, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between min-h-[260px]"
              >
                <div>
                  {/* Category Header Row */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 border border-emerald-100 rounded-lg uppercase tracking-wider truncate">
                        {a.courseName}
                      </span>
                      {a.semester && (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-1 border border-slate-150 rounded-lg">
                          Sem {a.semester}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isDraft ? (
                        <span className="text-[11px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 uppercase tracking-wider">
                          Draft
                        </span>
                      ) : isArchived ? (
                        <span className="text-[11px] font-black text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 uppercase tracking-wider">
                          Archived
                        </span>
                      ) : (
                        <span className="text-[11px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase tracking-wider animate-pulse">
                          Published
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Publish Dates */}
                  <h3 className="text-xl font-bold text-slate-800 line-clamp-2 leading-snug mb-2">
                    {a.title}
                  </h3>

                  <div className="flex flex-col gap-1.5 text-xs text-slate-400 font-semibold mb-4">
                    <span className="flex items-center gap-1">
                      <Clock size={12} className="text-slate-400" /> Published: {a.publishDate ? new Date(a.publishDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : new Date().toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1 text-orange-600">
                      <Calendar size={12} /> Due Date: {new Date(a.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", weekday: "short" })}
                    </span>
                  </div>
                </div>

                <div>
                  {/* Submission and Evaluation Stats */}
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-center justify-between text-xs font-bold text-slate-600 mb-5">
                    <div className="flex items-center gap-1.5">
                      <Users size={14} className="text-slate-400" />
                      <span>Submissions: <strong className="text-slate-800">{a.submissionCount || 0}</strong> / {a.enrolledCount || 0}</span>
                    </div>
                    <div>
                      <span>Marks: <strong className="text-emerald-600">{a.totalMarks || 100} M</strong></span>
                    </div>
                  </div>

                  {/* Actions Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setViewingAssignment(a)}
                      className="flex items-center justify-center gap-1 py-2 bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl shadow-inner-sm transition-all"
                    >
                      <Eye size={12} /> Questions
                    </button>
                    
                    <button
                      onClick={() => router.push(`/dashboard/teacher/evaluation?courseId=${a.courseId}`)}
                      className="flex items-center justify-center gap-1 py-2 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100/70 text-emerald-700 font-bold text-xs rounded-xl transition-all"
                    >
                      <Users size={12} /> Submissions
                    </button>

                    <button
                      onClick={() => openEditModal(a)}
                      className="flex items-center justify-center gap-1 py-2 bg-blue-50 border border-blue-150 hover:bg-blue-100/70 text-blue-700 font-bold text-xs rounded-xl transition-all"
                    >
                      <FileEdit size={12} /> Edit Details
                    </button>
                  </div>

                  {/* Advanced Actions Secondary Row */}
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100 text-xs">
                    <div className="flex gap-3">
                      <button
                        onClick={() => duplicateMutation.mutate(a)}
                        className="text-slate-400 hover:text-slate-600 font-semibold flex items-center gap-1 transition-colors"
                        title="Duplicate Assignment as Draft"
                      >
                        <Copy size={12} /> Duplicate
                      </button>
                      
                      <button
                        onClick={() => archiveMutation.mutate({ id: a.id, archive: !isArchived })}
                        className="text-slate-400 hover:text-slate-600 font-semibold flex items-center gap-1 transition-colors"
                        title={isArchived ? "Publish Assignment" : "Archive Assignment"}
                      >
                        <Archive size={12} /> {isArchived ? "Unarchive" : "Archive"}
                      </button>

                      <button
                        onClick={() => {
                          if (confirm("Are you sure you want to permanently delete this assignment?")) {
                            deleteMutation.mutate(a.id);
                          }
                        }}
                        className="text-rose-500 hover:text-rose-600 font-bold flex items-center gap-1 transition-colors"
                        title="Delete Assignment"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>

                    {a.attachmentUrl && (
                      <a
                        href={a.attachmentUrl}
                        download
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 transition-colors"
                      >
                        <Download size={12} /> Attachment
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* View Questions details Modal */}
      <AnimatePresence>
        {viewingAssignment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setViewingAssignment(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, y: 15, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-white border border-slate-200 w-full max-w-2xl rounded-3xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 border border-emerald-100 rounded uppercase tracking-wide">
                    {viewingAssignment.courseName}
                  </span>
                  <h3 className="text-lg font-black text-slate-800 mt-1">{viewingAssignment.title}</h3>
                </div>
                <button 
                  onClick={() => setViewingAssignment(null)}
                  className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-100 text-slate-500 transition-colors text-sm font-bold animate-in spin-in-12"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                {/* Instructions */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                    Instructions & Description
                  </h4>
                  <p className="text-sm text-slate-600 bg-slate-50 border border-slate-100 p-4 rounded-2xl whitespace-pre-wrap leading-relaxed shadow-inner">
                    {viewingAssignment.instructions || viewingAssignment.description || "No instructions provided."}
                  </p>
                </div>

                {/* Total Marks */}
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="font-semibold">Maximum Score:</span>
                  <span className="px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 font-extrabold rounded-lg text-xs">
                    {viewingAssignment.totalMarks || 100} Marks
                  </span>
                </div>

                {/* Questions */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                    Assignment Questions
                  </h4>
                  {!viewingAssignment.questions || viewingAssignment.questions.trim().length === 0 ? (
                    <p className="text-sm text-slate-400 italic">No specific questions entered. Please refer to instructions/description.</p>
                  ) : (
                    <div className="space-y-3">
                      {viewingAssignment.questions.split("\n").filter((q: string) => q.trim().length > 0).map((question: string, index: number) => (
                        <div key={index} className="flex gap-4 p-4 border border-slate-100 bg-slate-50/30 rounded-2xl">
                          <div className="w-7 h-7 bg-emerald-50 text-emerald-600 font-extrabold text-sm border border-emerald-100 rounded-full flex items-center justify-center shrink-0 shadow-inner">
                            {index + 1}
                          </div>
                          <p className="text-sm font-semibold text-slate-700 leading-relaxed self-center">
                            {question}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Attachment */}
                {viewingAssignment.attachmentUrl && (
                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                      Attached Resource Material
                    </h4>
                    <div className="flex items-center gap-4 p-4 border border-slate-200 bg-slate-50/50 rounded-2xl">
                      <div className="p-3 bg-white border border-slate-200 text-emerald-600 rounded-xl shadow-sm font-bold text-xs uppercase">
                        {viewingAssignment.attachmentUrl.split(".").pop()?.toUpperCase() || "FILE"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">
                          {viewingAssignment.attachmentUrl.split("/").pop()}
                        </p>
                        <p className="text-xs text-slate-500 font-semibold mt-0.5">External Published Document</p>
                      </div>
                      <a 
                        href={viewingAssignment.attachmentUrl} 
                        download 
                        target="_blank" 
                        rel="noreferrer" 
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                      >
                        Download File
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 text-right">
                <button
                  onClick={() => setViewingAssignment(null)}
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm rounded-xl transition-all"
                >
                  Close details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Creation Modal */}
      <AnimatePresence>
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsCreateOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ scale: 0.95, y: 15, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-white border border-slate-200 w-full max-w-lg rounded-3xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h2 className="text-lg font-black text-slate-800">Publish New Assignment</h2>
                <button onClick={() => setIsCreateOpen(false)} className="text-slate-500 font-bold">✕</button>
              </div>

              <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="relative z-50">
                  <CourseSelect
                    courses={courses}
                    selectedCourse={formData.courseId}
                    setSelectedCourse={(courseId) => setFormData(prev => ({ ...prev, courseId }))}
                    label="Course Subject *"
                    placeholder="Choose course subject..."
                    showClear={false}
                  />
                </div>
                
                <AnimatedInput
                  label="Assignment Title *"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                />
                
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Instructions / Description</label>
                  <textarea 
                    value={formData.instructions}
                    onChange={(e) => setFormData({...formData, instructions: e.target.value})}
                    placeholder="Enter instructions, description or general topics..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm font-semibold focus:outline-none focus:border-emerald-500 transition-colors h-24"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Assignment Questions</label>
                  <textarea 
                    value={formData.questions}
                    onChange={(e) => setFormData({...formData, questions: e.target.value})}
                    placeholder="Explain process scheduling.&#10;Compare deadlock prevention and avoidance.&#10;(Enter each question on a new line...)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm font-semibold focus:outline-none focus:border-emerald-500 transition-colors h-32 leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <AnimatedInput
                    label="Maximum Marks *"
                    type="number"
                    value={formData.totalMarks}
                    onChange={(e) => setFormData({...formData, totalMarks: e.target.value})}
                    required
                  />

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Due Date *</label>
                    <input 
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm font-semibold focus:outline-none focus:border-emerald-500 transition-colors"
                      required
                    />
                  </div>
                </div>

                <AnimatedInput
                  label="Attachment URL (PDF, PPT, Images, ZIP)"
                  type="text"
                  placeholder="https://example.com/materials/questions.pdf"
                  value={formData.attachmentUrl}
                  onChange={(e) => setFormData({...formData, attachmentUrl: e.target.value})}
                />

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Publish Status</label>
                  <div className="relative">
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm font-semibold focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer appearance-none"
                    >
                      <option value="PUBLISHED">Published (visible to students)</option>
                      <option value="DRAFT">Draft copy (hidden)</option>
                      <option value="ARCHIVED">Archived (inactive)</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button 
                    type="submit" 
                    disabled={createMutation.isPending}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-all shadow-md active:scale-95 disabled:opacity-50"
                  >
                    {createMutation.isPending ? "Publishing..." : "Publish Assignment"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingAssignment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setEditingAssignment(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ scale: 0.95, y: 15, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-white border border-slate-200 w-full max-w-lg rounded-3xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h2 className="text-lg font-black text-slate-800">Edit Assignment Details</h2>
                <button onClick={() => setEditingAssignment(null)} className="text-slate-500 font-bold">✕</button>
              </div>

              <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="relative z-50">
                  <CourseSelect
                    courses={courses}
                    selectedCourse={formData.courseId}
                    setSelectedCourse={(courseId) => setFormData(prev => ({ ...prev, courseId }))}
                    label="Course Subject *"
                    placeholder="Choose course subject..."
                    showClear={false}
                  />
                </div>
                
                <AnimatedInput
                  label="Assignment Title *"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                />
                
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Instructions / Description</label>
                  <textarea 
                    value={formData.instructions}
                    onChange={(e) => setFormData({...formData, instructions: e.target.value})}
                    placeholder="Enter instructions, description or general topics..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm font-semibold focus:outline-none focus:border-emerald-500 transition-colors h-24"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Assignment Questions</label>
                  <textarea 
                    value={formData.questions}
                    onChange={(e) => setFormData({...formData, questions: e.target.value})}
                    placeholder="Enter each question on a new line..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm font-semibold focus:outline-none focus:border-emerald-500 transition-colors h-32 leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <AnimatedInput
                    label="Maximum Marks *"
                    type="number"
                    value={formData.totalMarks}
                    onChange={(e) => setFormData({...formData, totalMarks: e.target.value})}
                    required
                  />

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Due Date *</label>
                    <input 
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm font-semibold focus:outline-none focus:border-emerald-500 transition-colors"
                      required
                    />
                  </div>
                </div>

                <AnimatedInput
                  label="Attachment URL"
                  type="text"
                  value={formData.attachmentUrl}
                  onChange={(e) => setFormData({...formData, attachmentUrl: e.target.value})}
                />

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Publish Status</label>
                  <div className="relative">
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm font-semibold focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer appearance-none"
                    >
                      <option value="PUBLISHED">Published (visible to students)</option>
                      <option value="DRAFT">Draft copy (hidden)</option>
                      <option value="ARCHIVED">Archived (inactive)</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div className="pt-4 flex justify-between items-center gap-4">
                  <button 
                    type="button" 
                    onClick={() => {
                      if (window.confirm("Are you sure you want to delete this assignment? Already submitted files will not be deleted but they will lose references.")) {
                        deleteMutation.mutate(editingAssignment.id);
                        setEditingAssignment(null);
                      }
                    }}
                    className="flex items-center justify-center gap-1.5 py-3 px-6 border border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100 font-bold rounded-2xl transition-all"
                  >
                    <Trash2 size={16} /> Delete
                  </button>

                  <button 
                    type="submit" 
                    disabled={editMutation.isPending}
                    className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-all shadow-md active:scale-95 disabled:opacity-50"
                  >
                    {editMutation.isPending ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
