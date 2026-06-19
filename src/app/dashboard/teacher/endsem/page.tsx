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
  ExternalLink
} from "lucide-react";

export default function TeacherBlindEvaluationsPage() {
  const queryClient = useQueryClient();
  const [selectedEval, setSelectedEval] = useState<any | null>(null);
  const [renderIframe, setRenderIframe] = useState(false);
  const [marks, setMarks] = useState<string>("");

  React.useEffect(() => {
    if (selectedEval) {
      const timer = setTimeout(() => {
        setRenderIframe(true);
      }, 400); // 400ms delay to let modal entry animation complete
      return () => clearTimeout(timer);
    } else {
      setRenderIframe(false);
    }
  }, [selectedEval]);

  const { data: evalsData, isLoading } = useQuery({
    queryKey: ["teacherEvaluations"],
    queryFn: async () => (await fetch("/api/teacher/evaluations")).json(),
  });

  const evaluations = evalsData?.data || [];

  const submitMutation = useMutation({
    mutationFn: async ({ id, marks }: { id: string, marks: number }) => {
      const res = await fetch(`/api/teacher/evaluations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marks })
      });
      if (!res.ok) throw new Error("Failed to submit");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacherEvaluations"] });
      setSelectedEval(null);
      setMarks("");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!marks || isNaN(Number(marks)) || Number(marks) < 0 || Number(marks) > 100) return alert("Please enter valid marks between 0-100");
    
    submitMutation.mutate({ id: selectedEval.id, marks: Number(marks) });
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
          <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-2 md:p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-7xl h-[95vh] shadow-2xl overflow-hidden flex flex-col md:flex-row"
            >
              {/* Left Side: PDF Viewer */}
              <div className="flex-1 bg-white relative flex flex-col">
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
              <div className="w-full md:w-96 bg-slate-900 border-l border-slate-800 flex flex-col">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <EyeOff className="text-primary" size={20} /> Evaluation
                  </h2>
                  <button onClick={() => setSelectedEval(null)} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-lg">
                    <X size={20} />
                  </button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
                  <div className="mb-6">
                    <h3 className="text-sm font-black text-slate-500 uppercase tracking-wider mb-1">Subject</h3>
                    <p className="text-lg font-bold text-white">{selectedEval.course?.title}</p>
                  </div>

                  <div className="mb-8 p-4 bg-primary/10 border border-primary/20 rounded-2xl text-primary text-sm leading-relaxed">
                    <strong>Instructions:</strong> Please evaluate the answers starting from page 2. Do not attempt to scroll back to page 1 or identify the student. Enter the final total marks below.
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block text-lg font-black text-white mb-3 text-center">Awarded Marks</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={marks}
                        onChange={(e) => setMarks(e.target.value)}
                        placeholder="0-100"
                        className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl px-6 py-6 text-center text-4xl font-black text-emerald-400 focus:border-emerald-500 transition-colors shadow-inner"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitMutation.isPending || !marks}
                      className="w-full py-4 rounded-2xl font-black text-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none"
                    >
                      {submitMutation.isPending ? "Submitting..." : "Submit Confidential Marks"}
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
