"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  EyeOff,
  CheckCircle2,
  Clock,
  X,
  ChevronRight,
  ShieldAlert,
  Lock,
  ChevronLeft,
  ZoomIn,
  ZoomOut
} from "lucide-react";

declare global {
  interface Window {
    pdfjsLib: any;
  }
}

let pdfjsPromise: Promise<any> | null = null;

const loadPdfJS = () => {
  if (pdfjsPromise) return pdfjsPromise;
  
  pdfjsPromise = new Promise<any>((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Browser only"));
      return;
    }
    
    if ((window as any).pdfjsLib) {
      resolve((window as any).pdfjsLib);
      return;
    }

    const script = document.createElement("script");
    script.src = "/pdf.min.js";
    script.onload = () => {
      const pdfjsLib = (window as any).pdfjsLib;
      if (pdfjsLib) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
        resolve(pdfjsLib);
      } else {
        reject(new Error("pdfjsLib not found on window"));
      }
    };
    script.onerror = () => {
      pdfjsPromise = null;
      reject(new Error("Failed to load PDF.js script"));
    };
    document.head.appendChild(script);
  });

  return pdfjsPromise;
};

export default function TeacherBlindEvaluationsPage() {
  const queryClient = useQueryClient();
  const [selectedEval, setSelectedEval] = useState<any | null>(null);
  
  // PDF.js State
  const [pdf, setPdf] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState<number>(2);
  const [numPages, setNumPages] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1.2);
  const [pdfLoading, setPdfLoading] = useState<boolean>(false);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const renderTaskRef = React.useRef<any>(null);

  // Marks and Comments State
  const [unitMarks, setUnitMarks] = useState<Record<string, string>>({
    unit1: "",
    unit2: "",
    unit3: "",
    unit4: "",
    unit5: ""
  });
  const [unitErrors, setUnitErrors] = useState<Record<string, string>>({
    unit1: "",
    unit2: "",
    unit3: "",
    unit4: "",
    unit5: ""
  });
  const [comments, setComments] = useState<string>("");
  const [isDirty, setIsDirty] = useState(false);
  const [showSuccessAnim, setShowSuccessAnim] = useState(false);

  const inputRefs = React.useRef<any[]>([]);
  const commentRef = React.useRef<any>(null);

  // Load PDF when selected evaluation changes
  React.useEffect(() => {
    if (!selectedEval || !selectedEval.pdfUrl) {
      setPdf(null);
      setNumPages(0);
      setPdfLoading(false);
      return;
    }

    let active = true;
    setPdfLoading(true);
    setPdf(null);
    setCurrentPage(2); // Automatically start PDF from Page 2

    const timer = setTimeout(() => {
      loadPdfJS()
        .then((pdfjs) => {
          if (!active) return;
          return pdfjs.getDocument(selectedEval.pdfUrl).promise;
        })
        .then((loadedPdf) => {
          if (!active || !loadedPdf) return;
          setPdf(loadedPdf);
          setNumPages(loadedPdf.numPages);
          setPdfLoading(false);
        })
        .catch((err) => {
          console.error("Error loading PDF:", err);
          if (active) {
            setPdfLoading(false);
          }
        });
    }, 450);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [selectedEval]);

  // Render canvas when pdf, currentPage or zoom changes
  React.useEffect(() => {
    if (!pdf) return;
    if (currentPage === 1) return;

    let active = true;

    const renderPage = async () => {
      try {
        const page = await pdf.getPage(currentPage);
        if (!active) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext("2d");
        if (!context) return;

        const viewport = page.getViewport({ scale: zoom });

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;
        
        await renderTask.promise;
        if (active) {
          renderTaskRef.current = null;
        }
      } catch (err: any) {
        if (err.name !== "RenderingCancelledException") {
          console.error("PDF page render error:", err);
        }
      }
    };

    renderPage();

    return () => {
      active = false;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
    };
  }, [pdf, currentPage, zoom]);

  // PDF Page Keyboard Navigation Shortcut (Left/Right, PageUp/PageDown)
  React.useEffect(() => {
    const handlePdfKeyDown = (e: KeyboardEvent) => {
      if (!selectedEval || pdfLoading || !pdf) return;

      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")) {
        return;
      }

      if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        setCurrentPage((prev) => Math.max(2, prev - 1)); // Block Page 1
      } else if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        setCurrentPage((prev) => Math.min(numPages, prev + 1));
      }
    };

    window.addEventListener("keydown", handlePdfKeyDown);
    return () => window.removeEventListener("keydown", handlePdfKeyDown);
  }, [selectedEval, pdf, numPages, pdfLoading]);

  // Counts how many valid units have been evaluated
  const evaluatedCount = Object.keys(unitMarks).filter(key => {
    const val = unitMarks[key];
    const num = parseFloat(val);
    return val !== "" && !isNaN(num) && num >= 0 && num <= 20 && !unitErrors[key];
  }).length;

  // Calculates the sum of unit marks
  const total = Object.entries(unitMarks).reduce((sum, [key, val]) => {
    const error = unitErrors[key];
    if (error || val === "") return sum;
    const num = parseFloat(val);
    return sum + (isNaN(num) ? 0 : num);
  }, 0);

  const getGrade = (score: number) => {
    if (score >= 90) return "O";
    if (score >= 80) return "A+";
    if (score >= 70) return "A";
    if (score >= 60) return "B+";
    if (score >= 50) return "B";
    if (score >= 45) return "C";
    if (score >= 40) return "P";
    return "F";
  };

  const handleUnitChange = (field: string, val: string, index: number) => {
    setIsDirty(true);
    
    let cleaned = val.replace(/[^0-9.]/g, "");
    
    const dotCount = (cleaned.match(/\./g) || []).length;
    if (dotCount > 1) {
      return;
    }
    
    setUnitMarks(prev => ({ ...prev, [field]: cleaned }));
    
    if (cleaned === "") {
      setUnitErrors(prev => ({ ...prev, [field]: "" }));
    } else {
      const num = parseFloat(cleaned);
      if (isNaN(num)) {
        setUnitErrors(prev => ({ ...prev, [field]: "Invalid" }));
      } else if (num < 0) {
        setUnitErrors(prev => ({ ...prev, [field]: "Negative" }));
      } else if (num > 20) {
        setUnitErrors(prev => ({ ...prev, [field]: "Max 20" }));
      } else {
        setUnitErrors(prev => ({ ...prev, [field]: "" }));
        
        if (
          (cleaned.length >= 2 && !cleaned.includes(".")) || 
          (cleaned.includes(".") && cleaned.split(".")[1].length >= 1)
        ) {
          if (index < 4) {
            setTimeout(() => {
              inputRefs.current[index + 1]?.focus();
              inputRefs.current[index + 1]?.select();
            }, 100);
          }
        }
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (index < 4) {
        inputRefs.current[index + 1]?.focus();
        inputRefs.current[index + 1]?.select();
      } else {
        commentRef.current?.focus();
      }
    } else if (e.key === "ArrowDown") {
      if (index < 4) {
        inputRefs.current[index + 1]?.focus();
        inputRefs.current[index + 1]?.select();
      }
    } else if (e.key === "ArrowUp") {
      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        inputRefs.current[index - 1]?.select();
      }
    }
  };

  const handleClose = () => {
    if (isDirty) {
      const confirmClose = window.confirm("You have unsaved evaluation marks. Are you sure you want to close?");
      if (!confirmClose) return;
    }
    setSelectedEval(null);
    setUnitMarks({ unit1: "", unit2: "", unit3: "", unit4: "", unit5: "" });
    setUnitErrors({ unit1: "", unit2: "", unit3: "", unit4: "", unit5: "" });
    setComments("");
    setIsDirty(false);
    setPdf(null);
    setNumPages(0);
    setCurrentPage(2);
    setZoom(1.2);
  };

  React.useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedEval) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [selectedEval, isDirty, unitMarks, comments]);

  const { data: evalsData, isLoading } = useQuery({
    queryKey: ["teacherEvaluations"],
    queryFn: async () => (await fetch("/api/teacher/evaluations")).json(),
  });

  const evaluations = evalsData?.data || [];

  const submitMutation = useMutation({
    mutationFn: async ({ id, marks, comments }: { id: string, marks: number, comments: string }) => {
      const res = await fetch(`/api/teacher/evaluations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marks, comments })
      });
      if (!res.ok) throw new Error("Failed to submit");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacherEvaluations"] });
      setShowSuccessAnim(true);
      setTimeout(() => {
        setSelectedEval(null);
        setShowSuccessAnim(false);
        setUnitMarks({ unit1: "", unit2: "", unit3: "", unit4: "", unit5: "" });
        setUnitErrors({ unit1: "", unit2: "", unit3: "", unit4: "", unit5: "" });
        setComments("");
        setIsDirty(false);
        setPdf(null);
        setNumPages(0);
        setCurrentPage(2);
        setZoom(1.2);
      }, 2000);
    },
    onError: (err: any) => {
      alert(`Submission failed: ${err.message}`);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const emptyUnits = Object.entries(unitMarks).filter(([_, val]) => val === "");
    if (emptyUnits.length > 0) {
      alert("Please enter marks for all 5 units.");
      return;
    }

    const hasErrors = Object.values(unitErrors).some(err => err !== "");
    if (hasErrors) {
      alert("Please fix all validation errors before submitting.");
      return;
    }

    submitMutation.mutate({ 
      id: selectedEval.id, 
      marks: total,
      comments: comments 
    });
  };

  return (
    <div className="max-w-7xl mx-auto pb-12 relative z-10">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-3">
          <EyeOff size={32} /> Confidential End-Sem Evaluation
        </h1>
        <p className="text-foreground/70">Evaluate answer scripts anonymously. Student identities are completely hidden to ensure unbiased grading.</p>
      </motion.div>

      {/* Evaluations List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-32 glass rounded-3xl animate-pulse" />)}
        </div>
      ) : evaluations.length === 0 ? (
        <div className="p-12 text-center text-foreground/50 glass rounded-3xl border border-white/10">
          <ShieldAlert size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-xl font-semibold">No Pending Papers</p>
          <p className="text-sm mt-2">The administration has not assigned any anonymous papers to you yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {evaluations.map((ev: any, i: number) => (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              key={ev.id}
              onClick={() => { if (ev.status === "PENDING") setSelectedEval(ev); }}
              className={`glass p-6 rounded-3xl border border-white/10 flex flex-col justify-between transition-all ${ev.status === "PENDING" ? "cursor-pointer hover:border-primary/40 hover:bg-white/[0.02]" : "opacity-60"}`}
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="px-3 py-1 bg-black/40 border border-white/10 rounded-lg text-xs font-mono text-foreground/70 flex items-center gap-2">
                    Paper #{ev.id.substring(0,8)}
                  </span>
                  {ev.status === "EVALUATED" ? (
                    <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full text-xs font-bold border border-emerald-400/20">
                      <CheckCircle2 size={14} /> DONE
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full text-xs font-bold border border-amber-400/20">
                      <Clock size={14} /> ACTION REQUIRED
                    </span>
                  )}
                </div>
                
                <h3 className="font-bold text-lg text-foreground mb-1">{ev.course?.title}</h3>
                <p className="text-sm text-foreground/50">Confidential Evaluation</p>
              </div>
              
              <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center">
                {ev.status === "EVALUATED" ? (
                  <>
                    <span className="text-sm font-bold text-foreground/50">Final Marks</span>
                    <span className="text-2xl font-black text-emerald-400">{ev.marks}</span>
                  </>
                ) : (
                  <span className="text-sm font-bold text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                    Open Viewer <ChevronRight size={16} />
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Blind Evaluation Modal Viewer */}
      <AnimatePresence>
        {selectedEval && (
          <div 
            onClick={handleClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 md:p-4 transition-all modal-backdrop-layout"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 15 }}
              transition={{ type: "spring", duration: 0.45, bounce: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#F8FAFC] border border-slate-200 rounded-[24px] w-full max-w-6xl h-[90vh] shadow-2xl overflow-hidden flex flex-col md:flex-row p-2 gap-2"
            >
              {/* Left Side: PDF Viewer (78%) */}
              <div className="w-full md:flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
                {/* Custom PDF Toolbar */}
                <div className="bg-slate-50 border-b border-slate-200 p-2.5 flex items-center justify-between gap-4 text-xs shadow-sm shrink-0">
                  <div className="flex items-center gap-2">
                    {/* Page Controls */}
                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded p-0.5 shadow-xs">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(2, prev - 1))}
                        disabled={currentPage <= 2 || pdfLoading}
                        className="p-1 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent rounded text-slate-700 transition-colors"
                        title="Previous Page (Page 1 is protected)"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span className="px-2.5 font-mono font-bold text-slate-600 min-w-[70px] text-center select-none">
                        {pdfLoading ? "..." : `${currentPage} / ${numPages}`}
                      </span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(numPages, prev + 1))}
                        disabled={currentPage >= numPages || pdfLoading}
                        className="p-1 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent rounded text-slate-700 transition-colors"
                        title="Next Page"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>

                    {/* Zoom Controls */}
                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded p-0.5 shadow-xs">
                      <button
                        onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))}
                        disabled={pdfLoading || !pdf}
                        className="p-1 hover:bg-slate-100 rounded text-slate-700 transition-colors"
                        title="Zoom Out"
                      >
                        <ZoomOut size={14} />
                      </button>
                      <span className="px-1 font-mono text-[10px] font-bold text-slate-500 w-10 text-center select-none">
                        {Math.round(zoom * 100)}%
                      </span>
                      <button
                        onClick={() => setZoom(prev => Math.min(2.5, prev + 0.1))}
                        disabled={pdfLoading || !pdf}
                        className="p-1 hover:bg-slate-100 rounded text-slate-700 transition-colors"
                        title="Zoom In"
                      >
                        <ZoomIn size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-rose-600 bg-rose-50 border border-rose-100 px-2 py-1 rounded-lg font-extrabold text-[10px]">
                      <Lock size={12} /> IDENTITY MASKED (PAGE 1 PROTECTED)
                    </span>
                  </div>
                </div>

                {/* PDF Page Container */}
                {pdfLoading ? (
                  <div className="flex-1 bg-slate-50 flex flex-col items-center justify-center text-slate-400 gap-2">
                    <div className="w-6 h-6 border-2 border-slate-300 border-t-primary rounded-full animate-spin" />
                    <span className="text-xs font-semibold">Loading Secure Document Viewer...</span>
                  </div>
                ) : currentPage === 1 ? (
                  <div className="flex-1 bg-slate-50 flex flex-col items-center justify-center text-slate-700 p-8 text-center select-none">
                    <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-4 border border-rose-100 shadow-sm animate-pulse">
                      <Lock size={32} />
                    </div>
                    <h3 className="text-base font-black text-rose-700">🔒 Student Identity Protected</h3>
                    <p className="text-xs text-slate-500 max-w-md mt-2 leading-relaxed">
                      Under blind evaluation regulations, student identity sheets (Page 1) are strictly hidden from evaluators. Grading must be performed solely on the answer script starting from Page 2.
                    </p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-auto bg-slate-100 flex items-start justify-center p-4">
                    <canvas ref={canvasRef} className="shadow-lg bg-white border border-slate-300 rounded" />
                  </div>
                )}
              </div>

              {/* Right Side: Evaluation Form (22%) */}
              <div className="w-full md:w-[22%] bg-[#F8FAFC] border border-slate-200 rounded-2xl shadow-sm flex flex-col h-full shrink-0 overflow-hidden">
                <div className="p-2 border-b border-slate-200 flex justify-between items-center bg-white shrink-0">
                  <h2 className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <EyeOff className="text-[#7C3AED] animate-pulse" size={14} /> Evaluation
                  </h2>
                  <button 
                    onClick={handleClose} 
                    className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors border border-slate-200 p-1 rounded"
                  >
                    <X size={14} />
                  </button>
                </div>

                {showSuccessAnim ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex-1 flex flex-col items-center justify-center text-center p-4 bg-white"
                  >
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-3 border border-emerald-200 shadow-sm">
                      <CheckCircle2 size={24} className="animate-bounce" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 mb-1">Evaluation Completed</h3>
                    <p className="text-[11px] text-slate-500 leading-relaxed max-w-[160px] mx-auto">
                      All marks and feedback notes have been securely compiled and synced.
                    </p>
                  </motion.div>
                ) : (
                  <>
                    <div className="p-2.5 flex-1 flex flex-col justify-between gap-2 overflow-y-auto scrollbar-thin bg-[#F8FAFC]">
                      <div className="space-y-2">
                        {/* Subject Information */}
                        <div className="bg-white border border-slate-200 rounded-lg p-2 flex justify-between items-center text-[11px] shadow-xs">
                          <span className="text-slate-400 font-bold uppercase tracking-wider">📖 Subject</span>
                          <span className="font-bold text-slate-700 truncate max-w-[130px]" title={selectedEval.course?.title}>
                            {selectedEval.course?.title}
                          </span>
                        </div>

                        {/* Blind Assessment Status */}
                        <div className="bg-purple-50 border border-purple-100 rounded-lg p-2 flex items-center justify-between shadow-xs text-purple-700 text-[11px]">
                          <span className="flex items-center gap-1 font-bold text-purple-700">
                            <Lock size={12} className="text-purple-500" /> Status:
                          </span>
                          <span className="font-extrabold text-[10px] bg-purple-100/50 px-1.5 py-0.5 rounded">🔒 Protected</span>
                        </div>

                        {/* Unit-wise Marks Table */}
                        <div className="bg-white border border-slate-200 rounded-lg p-2.5 shadow-xs space-y-2">
                          <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Marks Entry</span>
                            <span className="text-[10px] font-bold text-[#7C3AED] bg-purple-50 px-1.5 py-0.5 rounded-full">
                              {evaluatedCount}/5 Units
                            </span>
                          </div>
                          
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="text-slate-400 font-bold text-[9px] uppercase tracking-wider border-b border-slate-100">
                                <th className="text-left pb-1 font-semibold">Unit</th>
                                <th className="text-right pb-1 font-semibold">Marks</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {[1, 2, 3, 4, 5].map((unitNum, idx) => {
                                const fieldKey = `unit${unitNum}`;
                                const hasError = !!unitErrors[fieldKey];
                                return (
                                  <tr key={unitNum} className="hover:bg-slate-50/50">
                                    <td className="py-1 text-xs font-semibold text-slate-600">Unit {unitNum}</td>
                                    <td className="py-1 text-right">
                                      <div className="inline-flex items-center gap-1">
                                        <input
                                          ref={(el) => { inputRefs.current[idx] = el; }}
                                          type="text"
                                          value={unitMarks[fieldKey]}
                                          onChange={(e) => handleUnitChange(fieldKey, e.target.value, idx)}
                                          onKeyDown={(e) => handleKeyDown(e, idx)}
                                          placeholder="0.0"
                                          className={`w-14 h-7 bg-white border ${hasError ? "border-rose-400 text-rose-600 font-bold" : "border-slate-200 text-slate-800 focus:border-[#7C3AED]"} rounded text-center text-xs font-bold focus:ring-1 focus:ring-[#7C3AED]/20 transition-all outline-none`}
                                        />
                                        <span className="text-[10px] text-slate-400 font-bold">/20</span>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>

                          {/* Inline Combined Validation Error Alert */}
                          {Object.values(unitErrors).some(err => err !== "") && (
                            <div className="text-[9px] text-rose-500 font-bold text-center bg-rose-50 border border-rose-100 rounded py-1 px-1.5 animate-pulse flex items-center justify-center gap-1">
                              <span>⚠️ {Object.values(unitErrors).find(err => err !== "")}</span>
                            </div>
                          )}
                        </div>

                        {/* Total Marks Section */}
                        <div className="bg-purple-50/60 border border-purple-100 rounded-lg p-2.5 shadow-xs space-y-1 text-xs text-slate-700">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500 font-medium">Total Marks:</span>
                            <span className="font-black text-[14px] text-[#7C3AED]">{total} <span className="text-[10px] text-slate-400">/ 100</span></span>
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1 border-t border-purple-100/50">
                            <span>Percent: {total.toFixed(1)}%</span>
                            <span className="font-extrabold text-[#7C3AED] bg-white px-1 py-0.5 rounded border border-purple-100">Grade: {getGrade(total)}</span>
                          </div>
                        </div>

                        {/* Feedback Section */}
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-500">Feedback / Notes (Optional)</label>
                          <textarea
                            ref={commentRef}
                            value={comments}
                            onChange={(e) => {
                              setComments(e.target.value);
                              setIsDirty(true);
                            }}
                            placeholder="Feedback notes..."
                            className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 placeholder-slate-400 focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]/20 transition-all outline-none resize-none h-14 scrollbar-thin"
                          />
                        </div>
                      </div>

                      {/* Submit Button (Locked to bottom) */}
                      <div className="pt-2 border-t border-slate-200 shrink-0">
                        <button
                          type="submit"
                          onClick={handleSubmit}
                          disabled={submitMutation.isPending || evaluatedCount < 5 || Object.values(unitErrors).some(err => err !== "")}
                          className="w-full py-2 rounded-lg font-extrabold text-xs bg-[#7C3AED] hover:bg-[#6D28D9] text-white transition-all shadow-md shadow-[#7C3AED]/15 hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none cursor-pointer flex items-center justify-center gap-2"
                        >
                          {submitMutation.isPending ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Submitting...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 size={13} />
                              <span>Submit Evaluation</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
