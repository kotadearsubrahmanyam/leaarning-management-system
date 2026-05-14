"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { FileEdit, CheckCircle, Clock, X, Upload } from "lucide-react";
import { AnimatedButton } from "@/components/ui/animated-button";

export default function AssignmentsPage() {
  const queryClient = useQueryClient();
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [submissionContent, setSubmissionContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["assignments"],
    queryFn: async () => {
      const res = await fetch("/api/student/assignments");
      if (!res.ok) throw new Error("Failed to fetch assignments");
      return res.json();
    },
  });

  const submitMutation = useMutation({
    mutationFn: async ({ id, content, fileUrl }: { id: string, content: string, fileUrl?: string }) => {
      const res = await fetch(`/api/student/assignments/${id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, fileUrl }),
      });
      if (!res.ok) throw new Error("Failed to submit assignment");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      setSelectedAssignment(null);
      setSubmissionContent("");
      setSelectedFile(null);
    },
  });

  const assignments = data?.data?.assignments || [];

  return (
    <div className="max-w-5xl mx-auto pb-12 relative z-10">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-3">
          <FileEdit size={32} /> Assignments
        </h1>
        <p className="text-foreground/70">View and submit your course assignments.</p>
      </motion.div>

      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-32 glass rounded-3xl animate-pulse" />)}
        </div>
      ) : assignments.length === 0 ? (
        <div className="glass p-12 rounded-3xl border border-white/10 text-center">
          <FileEdit size={48} className="mx-auto text-foreground/20 mb-4" />
          <p className="text-foreground/50">No assignments posted for your courses.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((a: any, i: number) => {
            const isSubmitted = a.submissionStatus !== null;
            const isGraded = a.submissionStatus === "GRADED";
            
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                className="glass p-6 rounded-3xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded uppercase tracking-wider">{a.courseName}</span>
                    <span className="text-xs text-foreground/50 flex items-center gap-1">
                      <Clock size={12} /> Due {new Date(a.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-1">{a.title}</h3>
                  <p className="text-sm text-foreground/70 line-clamp-2">{a.description}</p>
                </div>
                
                <div className="shrink-0 flex flex-col items-end gap-3">
                  {isGraded ? (
                    <div className="text-right">
                      <p className="text-xs text-foreground/50 mb-1">Marks Awarded</p>
                      <p className="text-2xl font-bold text-green-500">{a.marks}<span className="text-sm text-foreground/50 font-normal">/100</span></p>
                    </div>
                  ) : isSubmitted ? (
                    <span className="inline-flex items-center gap-2 bg-green-500/20 text-green-500 px-4 py-2 rounded-xl font-bold text-sm">
                      <CheckCircle size={18} /> Submitted
                    </span>
                  ) : (
                    <AnimatedButton onClick={() => setSelectedAssignment(a)}>
                      Submit Work
                    </AnimatedButton>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Submission Modal */}
      <AnimatePresence>
        {selectedAssignment && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedAssignment(null)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: "10%" }} animate={{ opacity: 1, scale: 1, y: "-50%" }} exit={{ opacity: 0, scale: 0.95, y: "10%" }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 z-50 w-full max-w-2xl"
            >
              <div className="glass p-8 rounded-3xl border border-white/20 shadow-2xl relative">
                <button onClick={() => setSelectedAssignment(null)} className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                  <X size={20} />
                </button>
                <h2 className="text-2xl font-bold mb-2">Submit Assignment</h2>
                <p className="text-primary font-medium mb-6">{selectedAssignment.title}</p>
                
                <textarea
                  value={submissionContent}
                  onChange={(e) => setSubmissionContent(e.target.value)}
                  placeholder="Type your submission content or paste a link to your work here..."
                  className="w-full h-32 bg-black/20 border border-white/10 rounded-xl p-4 text-foreground focus:outline-none focus:border-primary transition-colors resize-none mb-4"
                />

                <div className="mb-6">
                  <label className="block text-sm font-medium text-foreground/70 mb-2">Attach Document (Optional)</label>
                  <div className="relative">
                    <input
                      type="file"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      accept=".pdf,.doc,.docx,.zip"
                    />
                    <div className={`w-full flex items-center justify-center gap-3 p-4 border-2 border-dashed rounded-xl transition-colors ${selectedFile ? "border-primary bg-primary/10 text-primary" : "border-white/20 hover:border-white/40 text-foreground/50"}`}>
                      <Upload size={20} />
                      <span className="font-semibold text-sm">
                        {selectedFile ? selectedFile.name : "Click to select a file or drag and drop"}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3">
                  <button onClick={() => { setSelectedAssignment(null); setSelectedFile(null); setSubmissionContent(""); }} className="px-6 py-2 rounded-xl hover:bg-white/5 transition-colors font-medium">Cancel</button>
                  <AnimatedButton 
                    onClick={async () => {
                      let fileUrl = undefined;
                      if (selectedFile) {
                        setIsUploading(true);
                        // Mock file upload delay
                        await new Promise(r => setTimeout(r, 1000));
                        fileUrl = URL.createObjectURL(selectedFile); // Mock URL
                        setIsUploading(false);
                      }
                      submitMutation.mutate({ id: selectedAssignment.id, content: submissionContent, fileUrl });
                    }}
                    isLoading={submitMutation.isPending || isUploading}
                    disabled={!submissionContent.trim() && !selectedFile}
                  >
                    Confirm Submission
                  </AnimatedButton>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
