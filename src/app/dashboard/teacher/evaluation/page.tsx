"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckSquare, 
  X, 
  Check, 
  FileText, 
  Download, 
  BookOpen, 
  User, 
  Award, 
  Split, 
  Archive, 
  ExternalLink,
  Save,
  ArrowLeft
} from "lucide-react";
import { AnimatedButton } from "@/components/ui/animated-button";
import { CourseSelect } from "@/components/ui/course-select";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function TeacherEvaluationPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [evalModal, setEvalModal] = useState<any>(null);
  
  // Evaluation States
  const [marks, setMarks] = useState<string>("");
  const [generalFeedback, setGeneralFeedback] = useState("");
  
  // Panel Resize States
  const [leftWidth, setLeftWidth] = useState(55);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const isResizing = useRef(false);

  // Sidebar Width Observer
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const aside = document.querySelector("aside");
    if (aside) {
      setSidebarWidth(aside.getBoundingClientRect().width);
    }
    
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setSidebarWidth(entry.borderBoxSize?.[0]?.inlineSize || entry.contentRect.width);
      }
    });

    if (aside) {
      observer.observe(aside);
    }
    
    return () => observer.disconnect();
  }, []);

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

  // Responsive Check
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Panel drag handler
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing.current) return;
    const container = document.getElementById("split-screen-modal-container");
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const percentage = (relativeX / rect.width) * 100;
    
    if (percentage >= 30 && percentage <= 70) {
      setLeftWidth(percentage);
    }
  };

  const handleMouseUp = () => {
    isResizing.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  // Clean up drag events
  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const gradeMutation = useMutation({
    mutationFn: async ({ marks, feedback }: { marks: number; feedback: string }) => {
      const res = await fetch("/api/teacher/evaluation", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId: evalModal.id, marks, feedback }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to save grade");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacherEvaluations", selectedCourse] });
      setEvalModal(null);
      toast({
        title: "Evaluation Submitted",
        description: "Submission evaluated and graded successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Evaluation Failed",
        description: error.message || "Could not save grade.",
        variant: "destructive",
      });
    }
  });

  const openEvalModal = (submission: any) => {
    setEvalModal(submission);
    
    // Load local draft
    const savedDraft = localStorage.getItem(`eval-draft-${submission.id}`);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setMarks(parsed.marks ?? (submission.marks !== null ? submission.marks.toString() : ""));
        setGeneralFeedback(parsed.generalFeedback ?? (submission.feedback || ""));
      } catch (err) {
        console.error("Failed to parse draft:", err);
        setMarks(submission.marks !== null ? submission.marks.toString() : "");
        setGeneralFeedback(submission.feedback || "");
      }
    } else {
      setMarks(submission.marks !== null ? submission.marks.toString() : "");
      setGeneralFeedback(submission.feedback || "");
    }
  };

  const handleSaveDraft = () => {
    if (!evalModal) return;
    const draftData = {
      marks,
      generalFeedback,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(`eval-draft-${evalModal.id}`, JSON.stringify(draftData));
    toast({
      title: "Draft Saved",
      description: "Evaluation draft has been saved locally.",
    });
  };

  const handleSubmitEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evalModal) return;

    if (marks === undefined || marks === "") {
      toast({
        title: "Incomplete Grading",
        description: "Please enter a grade for this submission.",
        variant: "destructive",
      });
      return;
    }

    const score = Number(marks);
    const maxMarks = evalModal.assignmentTotalMarks || 100;
    if (isNaN(score) || score < 0 || score > maxMarks) {
      toast({
        title: "Invalid Score",
        description: `Score must be a number between 0 and ${maxMarks}.`,
        variant: "destructive",
      });
      return;
    }

    // Clear local draft backup on successful submission
    localStorage.removeItem(`eval-draft-${evalModal.id}`);

    // Submit evaluation
    gradeMutation.mutate({ marks: score, feedback: generalFeedback });
  };

  return (
    <div className="max-w-6xl mx-auto pb-12 relative z-10 space-y-6">
      {/* Back Button */}
      <Link href="/dashboard/teacher/assignments">
        <button className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary mb-2 transition-colors bg-white hover:bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl">
          <ArrowLeft size={16} /> Back to Assignments
        </button>
      </Link>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-3">
          <CheckSquare size={32} /> Assignment Grading
        </h1>
        <p className="text-foreground/70">Review student submissions and assign grades.</p>
      </motion.div>

      {/* Course Filter */}
      <div className="mb-8 max-w-2xl bg-white/40 backdrop-blur-md border border-slate-200 p-4 rounded-3xl shadow-sm relative z-30">
        <CourseSelect
          courses={courses}
          selectedCourse={selectedCourse}
          setSelectedCourse={setSelectedCourse}
          label="Filter by Course"
          placeholder="Choose a course to filter submissions..."
          showClear={true}
        />
      </div>

      <div className="glass rounded-3xl border border-white/10 overflow-hidden">
        <div className="grid grid-cols-6 bg-white/5 p-4 font-semibold text-foreground/80 border-b border-white/10 text-sm">
          <div className="col-span-2">Student & Assignment</div>
          <div className="col-span-2">Course</div>
          <div>Status</div>
          <div className="text-right">Action</div>
        </div>
        
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[1,2,3,4].map(i => <div key={i} className="h-16 bg-white/5 animate-pulse rounded-xl" />)}
          </div>
        ) : evaluations.length === 0 ? (
          <div className="p-12 text-center text-foreground/50">
            No submissions found.
          </div>
        ) : (
          <div className="divide-y divide-white/5 max-h-[60vh] overflow-y-auto">
            {evaluations.map((sub: any, i: number) => (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                key={sub.id} 
                className="grid grid-cols-6 p-4 items-center hover:bg-white/5 transition-colors text-sm"
              >
                <div className="col-span-2 flex flex-col">
                  <span className="font-bold text-foreground">{sub.studentName}</span>
                  <span className="text-primary text-xs font-semibold">{sub.assignmentTitle}</span>
                </div>
                <div className="col-span-2 text-foreground/70">
                  {sub.courseName}
                </div>
                <div>
                  {sub.status === "GRADED" ? (
                    <span className="px-2 py-1 rounded text-xs font-bold bg-green-500/20 text-green-500 flex items-center w-max gap-1">
                      <Check size={12} /> Graded: {sub.marks}/100
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded text-xs font-bold bg-orange-500/20 text-orange-500 w-max block">
                      Pending Review
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <AnimatedButton onClick={() => openEvalModal(sub)}>
                    {sub.status === "GRADED" ? "Edit" : "Evaluate"}
                  </AnimatedButton>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Split-Screen Evaluation Workspace Modal */}
      <AnimatePresence>
        {evalModal && (
          <>
            {/* Overlay Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEvalModal(null)}
              style={{ left: isMobile ? 0 : `${sidebarWidth}px` }}
              className="fixed top-0 bottom-0 right-0 z-[100] bg-black/50 backdrop-blur-sm transition-all duration-300"
            />
            
            {/* Centered Large Workspace Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ 
                left: isMobile ? "5vw" : `${sidebarWidth + 24}px`, 
                width: isMobile ? "90vw" : `calc(100vw - ${sidebarWidth + 48}px)` 
              }}
              className="fixed top-[2.5vh] h-[95vh] z-[110] flex flex-col bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden text-slate-900 transition-all duration-300"
              id="split-screen-modal-container"
            >
              {/* Header Bar */}
              <div className="flex items-center justify-between px-6 py-3 bg-slate-50 border-b border-slate-200 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-xl text-[#7C3AED]">
                    <Split size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Evaluation Workspace</h2>
                    <p className="text-[10px] text-slate-500 font-medium">Evaluate submissions side-by-side</p>
                  </div>
                </div>
                <button 
                  onClick={() => setEvalModal(null)} 
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors text-slate-600 hover:text-slate-900"
                >
                  <X size={16} />
                </button>
              </div>
              
              {/* Split Container */}
              <div className="flex flex-col md:flex-row flex-1 overflow-hidden w-full h-full relative">
                
                {/* LEFT PANEL (Document Viewer) */}
                <div 
                  style={{ width: isMobile ? '100%' : `${leftWidth}%` }} 
                  className="h-[45vh] md:h-full flex flex-col bg-slate-100 overflow-hidden border-b md:border-b-0 md:border-r border-slate-200"
                >
                  {/* Left Header info */}
                  <div className="flex items-center justify-between px-5 py-2.5 bg-white border-b border-slate-200 shrink-0">
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                          View Assignment
                        </span>
                        {evalModal.fileUrl && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold">
                            Open PDF/DOC in viewer
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-slate-800 truncate mt-1">
                        {evalModal.fileUrl ? evalModal.fileUrl.split('/').pop() || 'submission-document' : 'written-response.txt'}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Submitted</p>
                      <p className="text-xs font-bold text-slate-700 mt-0.5">
                        {new Date(evalModal.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  {/* Embedded Doc Viewer Wrapper (Scrollable) */}
                  <div className="flex-1 overflow-y-auto p-3 scrollbar-thin">
                    {evalModal.fileUrl ? (
                      (() => {
                        const ext = evalModal.fileUrl.slice(evalModal.fileUrl.lastIndexOf('.')).toLowerCase();
                        const isPdf = ext === '.pdf';
                        const isRelative = !evalModal.fileUrl.startsWith("http") && !evalModal.fileUrl.startsWith("blob:");
                        const isLocalOrBlob = evalModal.fileUrl.startsWith("blob:") || 
                                              evalModal.fileUrl.includes("localhost") || 
                                              evalModal.fileUrl.includes("127.0.0.1") ||
                                              isRelative;
                        
                        const docSrc = (isLocalOrBlob || isPdf)
                          ? evalModal.fileUrl 
                          : `https://docs.google.com/gview?url=${encodeURIComponent(evalModal.fileUrl)}&embedded=true`;
                        return (
                          <iframe 
                            src={docSrc}
                            className="w-full border border-slate-200 rounded-xl bg-white shadow-sm"
                            style={{ height: "calc(95vh - 110px)" }}
                            title="Assignment Document Viewer"
                          />
                        );
                      })()
                    ) : (
                      /* Styled Written response paper sheet */
                      <div 
                        className="bg-white text-slate-800 rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 overflow-y-auto font-sans leading-relaxed text-sm relative"
                        style={{ minHeight: "calc(95vh - 110px)" }}
                      >
                        <div className="absolute top-0 bottom-0 left-8 border-l border-red-200 pointer-events-none" />
                        <div className="border-b-2 border-slate-200 pb-3 mb-4 font-sans">
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Written Submission</p>
                          <p className="text-xs text-slate-500 mt-0.5">Submitted via online text editor</p>
                        </div>
                        {evalModal.content ? (
                          <div className="whitespace-pre-wrap pl-6 text-slate-800 leading-relaxed text-sm select-text">
                            {evalModal.content}
                          </div>
                        ) : (
                          <p className="text-slate-400 pl-6 italic">No text response or files attached to this submission.</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* DRAGGABLE RESIZER HANDLE */}
                {!isMobile && (
                  <div 
                    className="w-1 hover:w-1.5 bg-slate-200 hover:bg-purple-600 cursor-col-resize transition-all h-full self-stretch select-none z-10 relative flex items-center justify-center group"
                    onMouseDown={handleMouseDown}
                  >
                    <div className="w-0.5 h-8 bg-slate-400 group-hover:bg-white rounded-full transition-colors opacity-60" />
                  </div>
                )}
                
                {/* RIGHT PANEL (Evaluation Workspace Sidebar) */}
                <div 
                  style={{ width: isMobile ? '100%' : `${100 - leftWidth}%` }} 
                  className="flex-1 md:h-full flex flex-col bg-[#F8FAFC] overflow-hidden"
                >
                  {/* Scrollable contents wrapper */}
                  <form onSubmit={handleSubmitEvaluation} className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                      
                      {/* Section 1: Assignment Information */}
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                        <h3 className="text-xs font-black uppercase text-[#7C3AED] tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                          <User size={14} className="text-[#7C3AED]" /> Assignment Info
                        </h3>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <p className="text-slate-400 font-bold uppercase tracking-wide text-[9px]">Student</p>
                            <p className="text-slate-800 font-semibold mt-0.5">{evalModal.studentName}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 font-bold uppercase tracking-wide text-[9px]">Roll Number</p>
                            <p className="text-slate-800 font-semibold mt-0.5">{evalModal.studentRollNumber || "N/A"}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-slate-400 font-bold uppercase tracking-wide text-[9px]">Course</p>
                            <p className="text-slate-800 font-semibold mt-0.5">{evalModal.courseName}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 font-bold uppercase tracking-wide text-[9px]">Assignment Title</p>
                            <p className="text-slate-800 font-semibold mt-0.5">{evalModal.assignmentTitle}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 font-bold uppercase tracking-wide text-[9px]">Max Marks</p>
                            <p className="text-slate-800 font-semibold mt-0.5">{evalModal.assignmentTotalMarks || 100}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Section 2: Grading Details */}
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                        <h3 className="text-xs font-black uppercase text-[#7C3AED] tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                          <Award size={14} className="text-[#7C3AED]" /> Evaluation & Grading
                        </h3>
                        
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Marks Obtained (out of {evalModal.assignmentTotalMarks || 100})</label>
                          <input
                            type="number"
                            min="0"
                            max={evalModal.assignmentTotalMarks || 100}
                            placeholder="0"
                            value={marks}
                            onChange={(e) => setMarks(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-all"
                            required
                          />
                        </div>
                        
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">General Feedback</label>
                          <textarea
                            placeholder="Enter comprehensive general feedback and advice for the student..."
                            rows={6}
                            value={generalFeedback}
                            onChange={(e) => setGeneralFeedback(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-all resize-none leading-relaxed"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Section 4: Action Footer (Sticky bottom) */}
                    <div className="px-5 py-3.5 bg-white border-t border-slate-200 flex justify-end gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={handleSaveDraft}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                      >
                        <Save size={14} /> Save Draft
                      </button>
                      <button
                        type="submit"
                        disabled={gradeMutation.isPending}
                        className="px-5 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs rounded-xl transition-colors shadow-sm flex items-center justify-center gap-1.5"
                      >
                        Submit Evaluation
                      </button>
                    </div>
                  </form>
                </div>
                
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
