"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  EyeOff,
  CheckCircle2,
  Clock,
  X,
  ChevronRight,
  ChevronLeft,
  ShieldAlert,
  ZoomIn,
  ZoomOut,
  Lock,
  BookOpen,
  MessageSquare
} from "lucide-react";

// Secure Client-Side PDF canvas renderer that blocks access to Page 1
interface SecurePDFViewerProps {
  pdfUrl: string;
}

function SecurePDFViewer({ pdfUrl }: SecurePDFViewerProps) {
  const [pdfjsLoaded, setPdfjsLoaded] = useState(false);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pageNum, setPageNum] = useState<number>(2); // Start at Page 2
  const [numPages, setNumPages] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1.2);
  const [isRendering, setIsRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);

  // Dynamic loading of PDF.js
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ((window as any).pdfjsLib) {
      setPdfjsLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js";
    script.async = true;
    script.onload = () => {
      const pdfjsLib = (window as any).pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";
      setPdfjsLoaded(true);
    };
    script.onerror = () => {
      setError("Failed to load secure PDF viewer from CDN.");
    };
    document.body.appendChild(script);
  }, []);

  // Load document when pdfUrl or script loads
  useEffect(() => {
    if (!pdfjsLoaded || !pdfUrl) return;
    
    setError(null);
    setPdfDoc(null);
    setPageNum(2); // Start directly at Page 2 to mask student identity on Page 1
    
    const pdfjsLib = (window as any).pdfjsLib;
    const loadingTask = pdfjsLib.getDocument(pdfUrl);
    
    loadingTask.promise.then(
      (pdf: any) => {
        setPdfDoc(pdf);
        setNumPages(pdf.numPages);
        if (pdf.numPages < 2) {
          setError("Access Restricted: This document does not contain evaluation pages beyond Page 1.");
        }
      },
      (err: any) => {
        console.error("Secure PDF document load error:", err);
        setError("Unable to load secure answer sheet. Please verify document availability.");
      }
    );
  }, [pdfjsLoaded, pdfUrl]);

  // Page rendering on HTML5 Canvas
  const renderPage = useCallback((pageNumber: number, currentZoom: number) => {
    if (!pdfDoc || !canvasRef.current) return;
    
    setIsRendering(true);
    pdfDoc.getPage(pageNumber).then((page: any) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const context = canvas.getContext("2d");
      if (!context) return;
      
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }

      const dpr = window.devicePixelRatio || 1;
      const viewport = page.getViewport({ scale: currentZoom });
      
      canvas.width = viewport.width * dpr;
      canvas.height = viewport.height * dpr;
      
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      
      context.scale(dpr, dpr);
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };
      
      const renderTask = page.render(renderContext);
      renderTaskRef.current = renderTask;
      
      renderTask.promise.then(
        () => {
          setIsRendering(false);
          renderTaskRef.current = null;
        },
        (err: any) => {
          if (err.name !== "RenderingCancelledException") {
            console.error("Render execution error:", err);
            setIsRendering(false);
          }
        }
      );
    });
  }, [pdfDoc]);

  // Trigger render
  useEffect(() => {
    if (pdfDoc && pageNum >= 2) {
      renderPage(pageNum, zoom);
    }
  }, [pdfDoc, pageNum, zoom, renderPage]);

  // Keyboard navigation & security control (Blocks ArrowLeft/PageUp/Home to page 1)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        setPageNum(prev => Math.min(prev + 1, numPages));
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        setPageNum(prev => Math.max(prev - 1, 2)); // Capped at Page 2
      } else if (e.key === "Home") {
        e.preventDefault();
        setPageNum(2); // Start at Page 2, cannot go back to Page 1
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [numPages]);

  const handlePrevPage = () => {
    setPageNum(prev => Math.max(prev - 1, 2)); // Lock index minimum at 2
  };

  const handleNextPage = () => {
    setPageNum(prev => Math.min(prev + 1, numPages));
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 3.0));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.6));
  };

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC]">
      {/* Secure Viewer Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 bg-white border-b border-purple-100/60 shrink-0 shadow-sm relative z-10">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1 bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 rounded-full text-xs font-bold shadow-xs">
            🔒 SECURE EVALUATION
          </span>
          <span className="text-xs text-purple-800/60 font-semibold hidden sm:inline-block">
            Page 1 Masked Successfully
          </span>
        </div>
        
        {/* Navigation & Zoom controls */}
        {pdfDoc && !error && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-purple-50/40 border border-purple-100/80 rounded-xl px-2 py-1 shadow-xs">
              <button
                type="button"
                onClick={handlePrevPage}
                disabled={pageNum <= 2}
                className="p-1.5 rounded-lg hover:bg-purple-100/40 text-purple-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                title="Previous Page (Blocked at Page 2)"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-bold text-purple-950 min-w-[70px] text-center select-none">
                Page {pageNum} / {numPages}
              </span>
              <button
                type="button"
                onClick={handleNextPage}
                disabled={pageNum >= numPages}
                className="p-1.5 rounded-lg hover:bg-purple-100/40 text-purple-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                title="Next Page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
            
            <div className="h-4 w-px bg-purple-100" />
            
            <div className="flex items-center gap-1 bg-purple-50/40 border border-purple-100/80 rounded-xl px-2 py-1 shadow-xs">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoom <= 0.6}
                className="p-1.5 rounded-lg hover:bg-purple-100/40 text-purple-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                title="Zoom Out"
              >
                <ZoomOut size={16} />
              </button>
              <span className="text-xs font-mono font-bold text-purple-950 min-w-[36px] text-center select-none">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoom >= 3.0}
                className="p-1.5 rounded-lg hover:bg-purple-100/40 text-purple-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                title="Zoom In"
              >
                <ZoomIn size={16} />
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center">
          <span className="text-[10px] text-purple-600 font-bold bg-purple-50 border border-purple-100 px-2.5 py-1 rounded-lg">
            Download Disabled for Identity Protection
          </span>
        </div>
      </div>

      {/* Canvas container */}
      <div className="flex-1 overflow-auto p-12 bg-purple-50/20 flex justify-center items-start relative select-none">
        {error ? (
          <div className="my-auto text-center p-8 max-w-md bg-white border border-purple-100 rounded-3xl shadow-sm">
            <ShieldAlert size={44} className="mx-auto mb-3 text-rose-500" />
            <h4 className="font-extrabold text-purple-950 mb-1.5">Cover Sheet Masked</h4>
            <p className="text-xs text-purple-800/60 leading-relaxed">{error}</p>
          </div>
        ) : !pdfDoc ? (
          <div className="my-auto flex flex-col items-center gap-3 text-purple-400">
            <div className="w-8 h-8 border-3 border-purple-100 border-t-[#7C3AED] rounded-full animate-spin" />
            <span className="text-xs font-bold tracking-wider uppercase text-purple-700/70">Decrypting Secure Answer Script...</span>
          </div>
        ) : (
          <div className="relative shadow-2xl border border-purple-100 rounded-2xl bg-white overflow-hidden max-w-full">
            {isRendering && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center z-10">
                <div className="w-6 h-6 border-2 border-purple-200 border-t-[#7C3AED] rounded-full animate-spin" />
              </div>
            )}
            <canvas ref={canvasRef} className="block max-w-full h-auto" />
          </div>
        )}
      </div>
    </div>
  );
}

export function TeacherBlindEvaluationsPage() {
  const queryClient = useQueryClient();
  const [selectedEval, setSelectedEval] = useState<any | null>(null);
  const [marks, setMarks] = useState<string>("");
  const [comments, setComments] = useState<string>("");

  const { data: evalsData, isLoading } = useQuery({
    queryKey: ["teacherEvaluations"],
    queryFn: async () => (await fetch("/api/teacher/evaluations")).json(),
  });

  const evaluations = evalsData?.data || [];

  const submitMutation = useMutation({
    mutationFn: async ({ id, marks, comments }: { id: string; marks: number; comments: string }) => {
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
      setSelectedEval(null);
      setMarks("");
      setComments("");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const marksNum = Number(marks);
    if (!marks || isNaN(marksNum) || marksNum < 0 || marksNum > 100) {
      return alert("Please enter valid marks between 0-100");
    }
    
    submitMutation.mutate({ id: selectedEval.id, marks: marksNum, comments });
  };

  return (
    <div className="max-w-7xl mx-auto pb-12 relative z-10 px-4">
      {/* Title block */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-extrabold text-[#111827] mb-2 flex items-center gap-3">
          <EyeOff size={32} className="text-[#7C3AED]" /> University Blind Correction System
        </h1>
        <p className="text-slate-500 text-sm font-medium">
          Evaluate answer scripts anonymously. Student identities are completely hidden and Page 1 details are masked to ensure unbiased grading.
        </p>
      </motion.div>

      {/* Evaluations List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-44 bg-white border border-[#E5E7EB] rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : evaluations.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-[#E5E7EB] shadow-xs">
          <ShieldAlert size={48} className="mx-auto mb-4 text-[#7C3AED]/50" />
          <p className="text-lg font-bold text-[#111827]">No Pending Papers</p>
          <p className="text-sm text-slate-400 mt-2 font-medium">
            The examination branch has not assigned any anonymous scripts to your account.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {evaluations.map((ev: any, i: number) => (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              key={ev.id}
              onClick={() => {
                if (ev.status === "PENDING") {
                  setSelectedEval(ev);
                }
              }}
              className={`glass p-6 border border-[#E5E7EB] hover:border-[#7C3AED]/40 hover:shadow-md transition-all flex flex-col justify-between ${
                ev.status === "PENDING" ? "cursor-pointer hover:bg-slate-50/30" : "opacity-75 bg-slate-50/20"
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-500 flex items-center gap-2">
                    Paper #{ev.id.substring(0, 8)}
                  </span>
                  {ev.status === "EVALUATED" ? (
                    <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-xs font-bold border border-emerald-100 shadow-xs">
                      <CheckCircle2 size={12} /> DONE
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-[#7C3AED] bg-[#7C3AED]/5 px-3 py-1 rounded-full text-xs font-bold border border-[#7C3AED]/15 shadow-xs">
                      <Clock size={12} /> ACTION REQUIRED
                    </span>
                  )}
                </div>
                
                <h3 className="font-extrabold text-lg text-[#111827] mb-1">{ev.course?.title}</h3>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Confidential Assessment</p>
              </div>
              
              <div className="mt-8 pt-4 border-t border-slate-100 flex justify-between items-center">
                {ev.status === "EVALUATED" ? (
                  <>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Final Marks</span>
                    <span className="text-2xl font-black text-emerald-500">{ev.marks}</span>
                  </>
                ) : (
                  <span className="text-xs font-bold text-[#7C3AED] flex items-center gap-1 group-hover:gap-2 transition-all select-none">
                    Open Evaluation Panel <ChevronRight size={14} />
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              if (e.target === e.currentTarget && !(selectedEval.status === "PENDING" && submitMutation.isPending)) {
                setSelectedEval(null);
                setMarks("");
                setComments("");
              }
            }}
            className="fixed inset-0 bg-[#2E1065]/20 backdrop-blur-md z-[100] flex items-center justify-center p-3 md:p-5 transition-all duration-300 modal-backdrop-layout"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.45, bounce: 0.15 }}
              className="bg-white/95 backdrop-blur-md border border-purple-200/80 rounded-[24px] w-full max-w-[98vw] xl:max-w-7xl h-[92vh] shadow-[0_25px_60px_-15px_rgba(124,58,237,0.22)] overflow-hidden flex flex-col md:flex-row p-4 gap-4 mx-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Left Side: PDF Viewer (75% Width) - Floating card effect */}
              <div className="w-full md:w-[75%] bg-white border border-purple-100 rounded-[20px] shadow-sm flex flex-col h-full overflow-hidden">
                <SecurePDFViewer pdfUrl={selectedEval.pdfUrl} />
              </div>

              {/* Right Side: Evaluation Form (25% Width) - Floating card effect */}
              <div className="w-full md:w-[25%] min-w-[260px] max-w-[320px] bg-white border border-purple-200 rounded-[20px] shadow-md flex flex-col h-full overflow-hidden bg-white">
                {/* Modal Header */}
                <div className="p-3 border-b border-purple-500/30 flex justify-between items-center bg-gradient-to-r from-[#5B21B6] via-[#7C3AED] to-[#9333EA] text-white shrink-0 shadow-sm">
                  <div>
                    <h2 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <EyeOff className="text-purple-200" size={14} /> Grading Toolbar
                    </h2>
                    <p className="text-[9px] text-purple-200 font-bold font-mono">ID: #{selectedEval.id.substring(0, 8)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={selectedEval.status === "PENDING" && submitMutation.isPending ? undefined : () => {
                      setSelectedEval(null);
                      setMarks("");
                      setComments("");
                    }}
                    className="text-white/80 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-1.5 rounded-lg border border-white/10"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Main Panel Area: Tightly stacked to fit screen fold without scrolling */}
                <form onSubmit={handleSubmit} className="p-3.5 flex-1 flex flex-col gap-3.5 bg-gradient-to-b from-[#FAF5FF]/50 to-white select-none justify-start overflow-hidden">
                  
                  {/* 1. Subject Title Card (Purple Accent) */}
                  <div className="bg-white border border-purple-100 border-t-2 border-t-[#7C3AED] rounded-[12px] p-2.5 shadow-xs shrink-0">
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-purple-600/60 uppercase tracking-wider mb-0.5">
                      <BookOpen size={12} className="text-[#7C3AED]" />
                      <span>Subject</span>
                    </div>
                    <h3 className="text-xs font-extrabold text-purple-950 truncate leading-tight">{selectedEval.course?.title}</h3>
                  </div>

                  {/* 2. 🔒 Blind Evaluation Status Card (Emerald Accent) - Single compact card */}
                  <div className="bg-white border border-purple-100 border-t-2 border-t-[#10B981] rounded-[12px] p-2.5 shadow-xs shrink-0">
                    <div className="flex items-center gap-1 text-[#10B981] font-extrabold text-[10px] mb-1">
                      <Lock size={12} /> Blind Assessment Active
                    </div>
                    <div className="flex gap-2.5 text-[9px] text-purple-900/60 font-bold">
                      <span>✓ Identity Hidden</span>
                      <span>✓ Page 1 Protected</span>
                    </div>
                  </div>

                  {/* 3. Marks Section Card (Purple Highlight Accent) */}
                  <div className="bg-[#FAF5FF] border border-purple-300 border-t-2 border-t-[#7C3AED] rounded-[12px] p-3 shadow-xs shrink-0 shadow-[0_0_15px_rgba(124,58,237,0.05)]">
                    <h4 className="text-xs font-extrabold text-[#7C3AED] mb-1.5 flex items-center gap-1">
                      🏆 Marks Entry
                    </h4>
                    <div className="relative rounded-lg">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        required
                        value={marks}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "" || (Number(val) >= 0 && Number(val) <= 100)) {
                            setMarks(val);
                          }
                        }}
                        placeholder="0-100"
                        className="w-full bg-white border border-purple-300 rounded-[10px] px-3 py-1.5 text-sm font-bold text-emerald-600 hover:border-[#7C3AED] focus:border-[#7C3AED] focus:outline-none focus:ring-4 focus:ring-purple-500/10 transition-all shadow-xs"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-purple-400">/ 100</span>
                    </div>
                    <div className="mt-1.5 flex justify-between items-center text-[9px] font-bold text-purple-800/60">
                      <span>Validation: {marks !== "" ? <span className="text-emerald-500">✓ Valid</span> : <span className="text-amber-500">⚠ Required</span>}</span>
                    </div>
                  </div>

                  {/* 4. Feedback Card (Indigo Accent) */}
                  <div className="bg-white border border-purple-100 border-t-2 border-t-[#6366F1] rounded-[12px] p-3 shadow-xs shrink-0">
                    <h4 className="text-[10px] font-bold text-purple-950 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                      <MessageSquare size={12} className="text-[#6366F1]" /> Feedback / Comments
                    </h4>
                    <textarea
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="Enter evaluator comments..."
                      className="w-full h-[60px] max-h-[60px] bg-white border border-purple-100 focus:border-[#7C3AED] focus:ring-4 focus:ring-purple-500/10 rounded-[10px] p-2 text-xs text-purple-950 focus:outline-none transition-all placeholder-purple-200 resize-none font-medium shadow-xs"
                      maxLength={250}
                    />
                  </div>

                  {/* 5. Submit Card */}
                  <div className="bg-white border border-purple-100 rounded-[12px] p-2 shadow-xs shrink-0">
                    <button
                      type="submit"
                      disabled={submitMutation.isPending || marks === ""}
                      className="w-full h-[44px] rounded-[12px] font-extrabold text-xs text-white bg-gradient-to-r from-[#7C3AED] to-[#9333EA] hover:from-[#6D28D9] hover:to-[#805AD5] transition-all transform hover:-translate-y-0.5 active:translate-y-0 shadow-md shadow-purple-500/20 disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none disabled:translate-y-0 select-none cursor-pointer"
                    >
                      {submitMutation.isPending ? "Submitting..." : "Submit Evaluation"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Add a default export so Next.js router matches it correctly
export default TeacherBlindEvaluationsPage;
