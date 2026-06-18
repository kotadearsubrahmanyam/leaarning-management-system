"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckSquare, 
  X, 
  Check, 
  FileText, 
  Clock, 
  Download, 
  Info, 
  Send,
  Award,
  BookOpen,
  Mail,
  FileDown
} from "lucide-react";
import { CourseSelect } from "@/components/ui/course-select";

export default function TeacherEvaluationPage() {
  const queryClient = useQueryClient();
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  
  // Evaluation modal contains the currently active submission for split-screen review
  const [evalModal, setEvalModal] = useState<any>(null);
  const [marks, setMarks] = useState("");
  const [feedback, setFeedback] = useState("");

  const { data: coursesData } = useQuery({
    queryKey: ["teacherCourses"],
    queryFn: async () => {
      const res = await fetch("/api/courses?teacherOnly=true");
      if (!res.ok) throw new Error("Failed to fetch courses");
      return res.json();
    },
  });

  const { data: evalData, isLoading } = useQuery({
    queryKey: ["teacherEvaluations", selectedCourse],
    queryFn: async () => {
      const url = selectedCourse ? `/api/teacher/evaluation?courseId=${selectedCourse}` : "/api/teacher/evaluation";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch evaluations");
      return res.json();
    },
  });

  const courses = coursesData?.data?.courses || [];
  const evaluations = evalData?.data?.evaluations || [];

  useEffect(() => {
    if (courses.length === 1 && !selectedCourse) {
      setSelectedCourse(courses[0].id);
    }
  }, [courses, selectedCourse]);

  const gradeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/teacher/evaluation", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          submissionId: evalModal.id, 
          marks,
          feedback
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to save grade");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacherEvaluations", selectedCourse] });
      setEvalModal(null);
      setMarks("");
      setFeedback("");
      alert("Submission graded successfully!");
    },
    onError: (err: any) => {
      alert(`Error grading submission: ${err.message}`);
    }
  });

  const openEvalModal = (submission: any) => {
    setEvalModal(submission);
    setMarks(submission.marks !== null ? submission.marks.toString() : "");
    setFeedback(submission.feedback || "");
  };

  const handleGradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!marks || isNaN(Number(marks))) return;
    gradeMutation.mutate();
  };

  // Helper to render file previews based on extensions
  const renderFilePreview = (url: string) => {
    if (!url) return null;
    const ext = url.split(".").pop()?.toLowerCase() || "";
    const isImage = ["png", "jpg", "jpeg", "webp", "gif"].includes(ext);
    const isPdf = ext === "pdf";

    if (isImage) {
      return (
        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm max-w-full bg-slate-50 p-2 mt-2">
          <img src={url} alt="Submission preview" className="max-h-80 w-auto rounded-lg mx-auto object-contain" />
        </div>
      );
    }
    
    if (isPdf) {
      return (
        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm h-[420px] mt-2">
          <iframe src={`${url}#toolbar=0`} className="w-full h-full" title="Submission PDF Preview" />
        </div>
      );
    }

    return (
      <div className="flex items-center gap-4 p-4 border border-slate-200 bg-slate-50/50 rounded-2xl mt-2">
        <div className="p-3 bg-white border border-slate-200 text-emerald-600 rounded-xl shadow-sm font-bold text-xs uppercase">
          {ext.toUpperCase() || "FILE"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800 truncate">{url.split("/").pop()}</p>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">Format: {ext.toUpperCase()}</p>
        </div>
        <a 
          href={url} 
          download 
          target="_blank" 
          rel="noreferrer" 
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
        >
          Download File
        </a>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto pb-12 relative z-10 px-4 md:px-0">
      
      {/* Page Title */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-3">
          <CheckSquare size={32} className="text-emerald-500" /> Evaluation & Grading
        </h1>
        <p className="text-foreground/70 text-sm">
          Review student submissions, evaluate responses side-by-side with original questions, and provide scores and feedback.
        </p>
      </motion.div>

      {/* Course Filter */}
      <div className="mb-8 max-w-2xl bg-white/40 backdrop-blur-md border border-slate-200 p-4 rounded-3xl shadow-sm">
        <CourseSelect
          courses={courses}
          selectedCourse={selectedCourse}
          setSelectedCourse={setSelectedCourse}
          label="Filter by Course"
          placeholder="Choose a course to filter submissions..."
          showClear={true}
          compact={true}
        />
      </div>

      {/* Evaluations Table */}
      <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-6 bg-slate-50/70 p-4 font-bold text-slate-500 uppercase tracking-wider text-xs border-b border-slate-200">
          <div className="col-span-2">Student Info & Assignment</div>
          <div className="col-span-2">Course Subject</div>
          <div>Status</div>
          <div className="text-right">Action</div>
        </div>
        
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-slate-50 animate-pulse rounded-2xl border border-slate-100" />
            ))}
          </div>
        ) : evaluations.length === 0 ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <Info size={32} className="text-slate-300" />
            <p className="text-sm font-semibold">No submissions found matching filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto">
            {evaluations.map((sub: any, i: number) => {
              const isGraded = sub.status === "GRADED";
              
              return (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: i * 0.03 }}
                  key={sub.id} 
                  className="grid grid-cols-6 p-4 items-center hover:bg-slate-50/50 transition-colors text-sm"
                >
                  <div className="col-span-2 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 shadow-sm shrink-0 text-xs">
                      {sub.studentName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-slate-800 truncate">{sub.studentName}</span>
                      <span className="text-emerald-600 text-xs font-bold truncate">{sub.assignmentTitle}</span>
                    </div>
                  </div>
                  
                  <div className="col-span-2 text-slate-500 font-semibold truncate pr-4">
                    {sub.courseName}
                  </div>
                  
                  <div>
                    {isGraded ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center w-max gap-1">
                        <Check size={12} className="stroke-[3]" /> Graded: {sub.marks}/{sub.assignmentTotalMarks || 100}
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-black bg-orange-50 border border-orange-100 text-orange-600 w-max block">
                        Pending Review
                      </span>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <button 
                      onClick={() => openEvalModal(sub)}
                      className={`px-4 py-2 border font-bold text-xs rounded-xl shadow-sm transition-all ${
                        isGraded 
                          ? "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100" 
                          : "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
                      }`}
                    >
                      {isGraded ? "Edit Grade" : "Evaluate"}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Split-Screen Evaluation Screen Modal */}
      <AnimatePresence>
        {evalModal && (
          <div className="fixed inset-0 z-50 flex flex-col bg-[#F8FAFC]">
            
            {/* Header Row */}
            <div className="h-16 px-6 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 border border-emerald-100 rounded-lg uppercase tracking-wider">
                  {evalModal.courseName}
                </span>
                <span className="text-slate-300">|</span>
                <h2 className="text-sm font-black text-slate-800">
                  Review Submission: <span className="text-emerald-600 font-bold">{evalModal.assignmentTitle}</span>
                </h2>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-slate-800">{evalModal.studentName}</p>
                  <p className="text-[10px] text-slate-400 font-mono font-bold mt-0.5">
                    Roll: {evalModal.studentRollNumber || "N/A"}
                  </p>
                </div>
                <button 
                  onClick={() => setEvalModal(null)} 
                  className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:border-slate-300 bg-white text-slate-600 font-bold text-xs rounded-xl shadow-sm transition-all"
                >
                  <X size={14} /> Close Review
                </button>
              </div>
            </div>

            {/* Split Screen Layout */}
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2">
              
              {/* LEFT PANEL: Original Assignment Details */}
              <div className="overflow-y-auto p-6 md:p-8 border-r border-slate-200 bg-slate-50 flex flex-col gap-6">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Original Assignment</h3>
                  <h2 className="text-2xl font-black text-slate-800 leading-snug">{evalModal.assignmentTitle}</h2>
                </div>

                {/* Instructions */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                    <Info size={14} className="text-slate-400" /> Instructions & Description
                  </h4>
                  <p className="text-sm text-slate-600 bg-white border border-slate-150 p-4 rounded-2xl whitespace-pre-wrap leading-relaxed shadow-sm">
                    {evalModal.assignmentInstructions || evalModal.assignmentDescription || "No instructions provided."}
                  </p>
                </div>

                {/* Assignment Questions */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                    <BookOpen size={14} className="text-slate-400" /> Assigned Questions
                  </h4>
                  {!evalModal.assignmentQuestions || evalModal.assignmentQuestions.trim().length === 0 ? (
                    <p className="text-sm text-slate-400 italic bg-white border border-slate-150 p-4 rounded-2xl shadow-sm">
                      No specific questions entered. Please review the instructions list above.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {evalModal.assignmentQuestions.split("\n").filter((q: string) => q.trim().length > 0).map((question: string, index: number) => (
                        <div key={index} className="flex gap-4 p-4 border border-slate-150 bg-white rounded-2xl shadow-sm">
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
                {evalModal.assignmentAttachmentUrl && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                      <FileDown size={14} className="text-slate-400" /> Attached Reference file
                    </h4>
                    <div className="flex items-center gap-4 p-4 border border-slate-200 bg-white rounded-2xl shadow-sm">
                      <div className="p-3 bg-slate-50 border border-slate-200 text-emerald-600 rounded-xl font-bold text-xs uppercase">
                        {evalModal.assignmentAttachmentUrl.split(".").pop()?.toUpperCase() || "FILE"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">{evalModal.assignmentAttachmentUrl.split("/").pop()}</p>
                        <p className="text-xs text-slate-500 font-semibold mt-0.5">Reference Material</p>
                      </div>
                      <a 
                        href={evalModal.assignmentAttachmentUrl} 
                        download 
                        target="_blank" 
                        rel="noreferrer" 
                        className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-sm transition-all"
                      >
                        Download File
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT PANEL: Student Submission & Evaluation Form */}
              <div className="overflow-y-auto p-6 md:p-8 bg-white flex flex-col gap-6">
                
                {/* Submission Meta Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Student Submission</h4>
                    <h3 className="text-lg font-black text-slate-800 mt-0.5">{evalModal.studentName}</h3>
                  </div>
                  
                  <div className="flex items-center gap-1 text-xs text-slate-400 font-semibold bg-slate-50 border border-slate-150 px-3 py-1.5 rounded-xl self-start">
                    <Clock size={12} className="text-slate-400" />
                    <span>Submitted: {new Date(evalModal.submittedAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                </div>

                {/* Submission Text content */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Submission Content</h4>
                  {evalModal.content ? (
                    <div className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-2xl p-5 leading-relaxed whitespace-pre-wrap shadow-inner">
                      {evalModal.content}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-400 italic bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-inner">
                      No text description submitted.
                    </div>
                  )}
                </div>

                {/* Uploaded File attachments Preview / Download */}
                {evalModal.fileUrl && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Attached Work File</h4>
                    {renderFilePreview(evalModal.fileUrl)}
                  </div>
                )}

                {/* Evaluation Form */}
                <form onSubmit={handleGradeSubmit} className="border-t border-slate-100 pt-6 mt-6 space-y-5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                    <Award size={14} className="text-slate-400" /> Grading & Evaluation
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Marks Input */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                        Score Awarded (Max: {evalModal.assignmentTotalMarks || 100}) *
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          min="0"
                          max={evalModal.assignmentTotalMarks || 100}
                          value={marks}
                          onChange={(e) => setMarks(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 transition-colors"
                          required
                        />
                        <span className="absolute right-4 text-xs font-bold text-slate-400 uppercase">
                          / {evalModal.assignmentTotalMarks || 100} Marks
                        </span>
                      </div>
                    </div>

                    {/* Student email reminder (read-only info) */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                        Contact Info
                      </label>
                      <div className="flex items-center gap-2 py-3 px-4 bg-slate-50 border border-slate-100 rounded-xl text-slate-500 text-xs font-semibold">
                        <Mail size={14} className="text-slate-400" />
                        <span className="truncate">{evalModal.studentEmail}</span>
                      </div>
                    </div>
                  </div>

                  {/* Feedback Textarea */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                      Grading Feedback / Comments
                    </label>
                    <textarea
                      rows={4}
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Add grading comments, highlight areas for improvement..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 transition-colors resize-none leading-relaxed"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={gradeMutation.isPending}
                      className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Send size={14} />
                      {gradeMutation.isPending ? "Submitting Grade..." : "Submit Score & Feedback"}
                    </button>
                  </div>
                </form>
              </div>

            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
