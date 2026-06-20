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
  ExternalLink,
  Award,
  Lock,
  TrendingUp,
  MessageSquare,
  AlertTriangle
} from "lucide-react";

export default function TeacherBlindEvaluationsPage() {
  const queryClient = useQueryClient();
  const [selectedEval, setSelectedEval] = useState<any | null>(null);
  const [renderIframe, setRenderIframe] = useState(false);
  
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

  React.useEffect(() => {
    if (selectedEval) {
      const timer = setTimeout(() => {
        setRenderIframe(true);
      }, 400); // delay to let modal entry animation complete
      return () => clearTimeout(timer);
    } else {
      setRenderIframe(false);
    }
  }, [selectedEval]);

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

  const handleUnitChange = (field: string, val: string, index: number) => {
    setIsDirty(true);
    
    // Clean input to only contain digits and up to one decimal point
    let cleaned = val.replace(/[^0-9.]/g, "");
    
    // Ensure only one dot is allowed
    const dotCount = (cleaned.match(/\./g) || []).length;
    if (dotCount > 1) {
      return;
    }
    
    setUnitMarks(prev => ({ ...prev, [field]: cleaned }));
    
    // Run validation
    if (cleaned === "") {
      setUnitErrors(prev => ({ ...prev, [field]: "" }));
    } else {
      const num = parseFloat(cleaned);
      if (isNaN(num)) {
        setUnitErrors(prev => ({ ...prev, [field]: "Invalid number" }));
      } else if (num < 0) {
        setUnitErrors(prev => ({ ...prev, [field]: "Cannot be negative" }));
      } else if (num > 20) {
        setUnitErrors(prev => ({ ...prev, [field]: "Maximum 20 marks" }));
      } else {
        setUnitErrors(prev => ({ ...prev, [field]: "" }));
        
        // Auto focus next field:
        // If string length is 2 (e.g. "12", "20") and doesn't end with a dot,
        // or if it includes a dot and has a decimal digit, automatically focus the next field.
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
      }, 2000);
    },
    onError: (err: any) => {
      alert(`Submission failed: ${err.message}`);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ensure all 5 units are evaluated
    const emptyUnits = Object.entries(unitMarks).filter(([_, val]) => val === "");
    if (emptyUnits.length > 0) {
      alert("Please enter marks for all 5 units.");
      return;
    }

    // Ensure there are no validation errors
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
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-2 md:p-6 transition-all"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 15 }}
              transition={{ type: "spring", duration: 0.45, bounce: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-[1440px] h-[95vh] shadow-2xl overflow-hidden flex flex-col md:flex-row"
            >
              {/* Left Side: PDF Viewer */}
              <div className="flex-1 bg-white relative flex flex-col h-full">
                <div className="bg-rose-500/10 border-b border-rose-500/20 p-3 flex items-center justify-between gap-2 text-rose-400 font-bold text-sm shadow-inner shrink-0">
                  <div className="flex items-center gap-2">
                    <ShieldAlert size={18} /> CONFIDENTIALITY ENFORCED: Page 1 (Student Identity) has been strictly masked.
                  </div>
                  <a
                    href={`${selectedEval.pdfUrl}#page=2`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 bg-rose-500 hover:bg-rose-600 text-white px-3 py-1 rounded-lg text-xs transition-colors font-bold shadow-md hover:scale-105 shrink-0"
                  >
                    <ExternalLink size={14} /> Open PDF in New Tab
                  </a>
                </div>
                
                {/* PDF rendering with #page=2 trick to skip identity page */}
                {renderIframe ? (
                  <iframe
                    src={`${selectedEval.pdfUrl}#page=2&toolbar=1`}
                    className="w-full flex-1 border-0 bg-white"
                    title="Confidential Answer Script"
                  />
                ) : (
                  <div className="flex-1 bg-white flex flex-col items-center justify-center text-slate-400 gap-2">
                    <div className="w-6 h-6 border-2 border-slate-300 border-t-primary rounded-full animate-spin" />
                    <span className="text-xs font-semibold">Loading Secure Document Viewer...</span>
                  </div>
                )}
              </div>

              {/* Right Side: Evaluation Form */}
              <div className="w-full md:w-[320px] bg-[#0B0F19] border-l border-slate-800/80 flex flex-col h-full shrink-0">
                <div className="p-6 border-b border-slate-800/80 flex justify-between items-center bg-slate-950/80 backdrop-blur-md shrink-0">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <EyeOff className="text-primary animate-pulse" size={20} /> Evaluation
                  </h2>
                  <button 
                    onClick={handleClose} 
                    className="text-slate-400 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 p-2 rounded-xl"
                  >
                    <X size={20} />
                  </button>
                </div>

                {showSuccessAnim ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-950/50"
                  >
                    <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-4 border border-emerald-500/30">
                      <CheckCircle2 size={36} className="animate-bounce" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Evaluation Completed</h3>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-[220px] mx-auto">
                      All marks and feedback notes have been securely compiled and synced to student results.
                    </p>
                  </motion.div>
                ) : (
                  <>
                    <div className="p-6 flex-1 overflow-y-auto space-y-6 scrollbar-thin">
                      {/* Subject Information */}
                      <div className="bg-slate-950/40 border border-slate-800/60 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                        <div>
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">📖 Active Subject</span>
                          <h3 className="font-bold text-sm text-white leading-tight">{selectedEval.course?.title}</h3>
                        </div>
                      </div>

                      {/* Blind Assessment Status */}
                      <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
                        <div className="bg-emerald-500/10 p-2 rounded-xl text-emerald-400 shrink-0">
                          <Lock size={16} />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-emerald-400">🔒 Blind Assessment Active</h4>
                          <p className="text-[10px] text-slate-400/80 mt-1 leading-relaxed">
                            Student identity is 100% masked. Script evaluation rules apply automatically.
                          </p>
                        </div>
                      </div>

                      {/* Evaluation Progress Card */}
                      <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 space-y-3 shadow-md">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-400">Evaluation Progress</span>
                          <span className="text-[10px] font-extrabold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                            Units: {evaluatedCount} / 5
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(evaluatedCount / 5) * 100}%` }}
                              className="h-full bg-emerald-500 rounded-full"
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                          <span className="text-xs font-black text-white">{(evaluatedCount / 5) * 100}%</span>
                        </div>
                      </div>

                      {/* Unit-wise Marks Entry */}
                      <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Unit-wise Marks Entry</label>
                        <div className="space-y-2">
                          {[1, 2, 3, 4, 5].map((unitNum, idx) => {
                            const fieldKey = `unit${unitNum}`;
                            const hasError = !!unitErrors[fieldKey];
                            return (
                              <div key={unitNum} className="space-y-1">
                                <div className={`flex items-center justify-between p-2.5 bg-slate-950/60 border ${hasError ? "border-rose-500/50" : "border-slate-800/60"} rounded-xl hover:border-slate-700/85 transition-all duration-200`}>
                                  <div className="flex items-center gap-2">
                                    <Award size={14} className="text-primary" />
                                    <span className="text-xs font-bold text-slate-300">Unit {unitNum} Marks</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <input
                                      ref={(el) => (inputRefs.current[idx] = el)}
                                      type="text"
                                      value={unitMarks[fieldKey]}
                                      onChange={(e) => handleUnitChange(fieldKey, e.target.value, idx)}
                                      onKeyDown={(e) => handleKeyDown(e, idx)}
                                      placeholder="0.0"
                                      className={`w-16 bg-slate-900 border ${hasError ? "border-rose-500 text-rose-400" : "border-slate-800 text-emerald-400 focus:border-emerald-500"} rounded-lg py-1 px-2 text-center text-xs font-extrabold focus:ring-1 focus:ring-emerald-500/20 transition-all outline-none`}
                                    />
                                    <span className="text-xs font-bold text-slate-500">/ 20</span>
                                  </div>
                                </div>
                                {hasError && (
                                  <span className="text-[10px] text-rose-400 font-bold block pl-2">
                                    ⚠ {unitErrors[fieldKey]}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Total Marks Card */}
                      <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 space-y-3.5 shadow-md">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Score</span>
                            <div className="flex items-baseline gap-1 mt-0.5">
                              <span className="text-2xl font-black text-emerald-400">{total}</span>
                              <span className="text-xs font-bold text-slate-500">/ 100</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Percentage</span>
                            <div className="text-2xl font-black text-primary mt-0.5">{total.toFixed(1)}%</div>
                          </div>
                        </div>

                        {/* Score Progress Bar */}
                        <div className="space-y-1">
                          <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${total}%` }}
                              className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full"
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Feedback Section */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-400">Feedback / Evaluation Notes (Optional)</label>
                        <textarea
                          ref={commentRef}
                          value={comments}
                          onChange={(e) => {
                            setComments(e.target.value);
                            setIsDirty(true);
                          }}
                          placeholder="Provide anonymous constructive feedback or notes regarding script correction..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none resize-none h-20 scrollbar-thin"
                        />
                      </div>
                    </div>

                    {/* Fixed Footer with Submit Button */}
                    <div className="p-6 border-t border-slate-800/80 bg-slate-950/90 shrink-0">
                      <button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={submitMutation.isPending || evaluatedCount < 5 || Object.values(unitErrors).some(err => err !== "")}
                        className="w-full py-3.5 rounded-xl font-black text-xs bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none cursor-pointer flex items-center justify-center gap-2"
                      >
                        {submitMutation.isPending ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Submitting Marks...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={14} />
                            <span>Submit Evaluation</span>
                          </>
                        )}
                      </button>
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
