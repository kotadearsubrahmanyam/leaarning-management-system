"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  FileEdit,
  CheckCircle,
  Clock,
  Upload,
  ArrowLeft,
  Paperclip,
  BookOpen,
  FileText,
  User,
  Award
} from "lucide-react";
import { AnimatedButton } from "@/components/ui/animated-button";
import { getQuestionsForAssignment } from "@/lib/assignment-questions";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export default function AssignmentDetailsPage({ params }: { params: { id: string } }) {
  const assignmentId = params.id;
  const queryClient = useQueryClient();
  const router = useRouter();
  const { toast } = useToast();

  const [submissionContent, setSubmissionContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["assignments"],
    queryFn: async () => {
      const res = await fetch("/api/student/assignments");
      if (!res.ok) throw new Error("Failed to fetch assignments");
      return res.json();
    },
  });

  const assignments = data?.data?.assignments || [];
  const a = assignments.find((item: any) => item.id === assignmentId);

  const submitMutation = useMutation({
    mutationFn: async ({
      content,
      fileUrl,
      fileName,
      fileSize
    }: {
      content: string;
      fileUrl?: string;
      fileName?: string;
      fileSize?: number;
    }) => {
      const res = await fetch(`/api/student/assignments/${assignmentId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, fileUrl, fileName, fileSize }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to submit assignment");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      setSubmissionContent("");
      setSelectedFile(null);
      toast({
        title: "Assignment Submitted",
        description: data.message || "Your assignment has been submitted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "There was an error submitting your assignment.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto pb-12 space-y-6">
        <div className="h-10 w-48 bg-slate-200 animate-pulse rounded-xl" />
        <div className="h-40 glass animate-pulse rounded-3xl" />
        <div className="h-60 glass animate-pulse rounded-3xl" />
        <div className="h-40 glass animate-pulse rounded-3xl" />
      </div>
    );
  }

  if (!a) {
    return (
      <div className="max-w-4xl mx-auto pb-12 text-center py-20">
        <p className="text-foreground/50 mb-4">Assignment not found or unauthorized.</p>
        <Link href="/dashboard/assignments">
          <button className="px-6 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary/95 transition-colors">
            Back to Assignments
          </button>
        </Link>
      </div>
    );
  }

  const isSubmitted = a.submissionStatus !== null;
  const isGraded = a.submissionStatus === "GRADED";
  
  const questions = a.questions 
    ? a.questions.split("\n").filter((q: string) => q.trim().length > 0).map((q: string, idx: number) => ({
        questionNumber: idx + 1,
        description: q,
        marks: Math.round((a.totalMarks || 100) / a.questions.split("\n").filter((q: string) => q.trim().length > 0).length) || 10
      }))
    : getQuestionsForAssignment(a.title, a.courseName);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submissionContent.trim() && !selectedFile) return;

    let fileUrl = undefined;
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "File size exceeds the 10MB limit.",
          variant: "destructive",
        });
        return;
      }
      setIsUploading(true);
      // Mock file upload delay
      await new Promise((r) => setTimeout(r, 1000));
      fileUrl = URL.createObjectURL(selectedFile); // Mock URL
      setIsUploading(false);
    }

    submitMutation.mutate({
      content: submissionContent,
      fileUrl,
      fileName: selectedFile?.name,
      fileSize: selectedFile?.size,
    });
  };

  return (
    <div className="max-w-4xl mx-auto pb-12 relative z-10 space-y-6">
      {/* Back Button */}
      <Link href="/dashboard/assignments">
        <button className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary mb-2 transition-colors bg-white hover:bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl">
          <ArrowLeft size={16} /> Back to Assignments
        </button>
      </Link>

      {/* Header Info Panel */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-8 rounded-3xl border border-slate-300"
      >
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-wider">
            {a.courseName}
          </span>
          {isGraded ? (
            <span className="inline-flex items-center gap-1.5 bg-green-500/10 text-green-600 border border-green-500/20 px-3 py-1 rounded-full font-bold text-xs">
              <Award size={12} /> Graded ({a.marks}/100)
            </span>
          ) : isSubmitted ? (
            <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-3 py-1 rounded-full font-bold text-xs">
              <CheckCircle size={12} /> Submitted
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-600 border border-amber-500/20 px-3 py-1 rounded-full font-bold text-xs">
              Pending
            </span>
          )}
        </div>
        <h1 className="text-3xl font-black text-slate-800 mb-4">{a.title}</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-slate-200/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-100 rounded-xl text-slate-500">
              <User size={18} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Faculty</p>
              <p className="text-sm font-bold text-slate-700">{a.facultyName || "Professor Demo"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-100 rounded-xl text-slate-500">
              <Clock size={18} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Due Date</p>
              <p className="text-sm font-bold text-slate-700">{new Date(a.dueDate).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-100 rounded-xl text-slate-500">
              <Award size={18} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Total Marks</p>
              <p className="text-sm font-bold text-slate-700">{a.totalMarks || 100} Marks</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isSubmitted ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
              <CheckCircle size={18} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Status</p>
              <p className="text-sm font-bold text-slate-700">{isGraded ? "Graded" : isSubmitted ? "Submitted" : "Not Submitted"}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Questions Card (Single Container) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass p-6 rounded-3xl border border-slate-300"
      >
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <FileText size={18} className="text-primary" /> Questions
        </h3>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 max-h-[300px] overflow-y-auto scrollbar-thin">
          <div className="space-y-4 text-sm font-medium text-slate-700">
            {questions.map((q: any) => (
              <div key={q.questionNumber} className="flex gap-2 items-start justify-between border-b border-slate-100 last:border-0 pb-3 last:pb-0">
                <div className="flex items-start gap-2.5">
                  <span className="text-primary font-bold">{q.questionNumber}.</span>
                  <span className="text-slate-700 leading-relaxed">{q.description}</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded shrink-0 ml-4 mt-0.5">
                  {q.marks} Marks
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Instructions Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass p-6 rounded-3xl border border-slate-300"
      >
        <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
          <BookOpen size={18} className="text-primary" /> Instructions
        </h3>
        <div className="text-sm text-slate-600 space-y-3 leading-relaxed">
          {a.instructions || a.description ? (
            <p className="font-semibold text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100 whitespace-pre-wrap">{a.instructions || a.description}</p>
          ) : (
            <p>Please read each question carefully and address all elements in your report. Standard submission guidelines apply:</p>
          )}
          <ul className="list-disc pl-5 space-y-1.5 text-slate-500 text-xs">
            <li>All submissions should follow normal formatting, citing sources correctly.</li>
            <li>You can write your response in the rich text area below, or link to external documents.</li>
            <li>If submitting scripts or multiple documents, please package them as a single ZIP file.</li>
            <li>Solutions can be edited as many times as you like before the teacher reviews and grades them.</li>
          </ul>
        </div>
      </motion.div>

      {/* Attachments Card (Reference Materials & Attachments) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass p-6 rounded-3xl border border-slate-300"
      >
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Paperclip size={18} className="text-primary" /> Reference Materials & Attachments
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {a.attachmentUrl ? (
            <a 
              href={a.attachmentUrl} 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100/50 cursor-pointer transition-colors"
            >
              <div className="p-2 bg-primary/10 text-primary rounded-lg">
                <Paperclip size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-700 truncate">{a.attachmentUrl.split("/").pop()}</p>
                <p className="text-[10px] text-slate-400 font-semibold">Attached Reference Material</p>
              </div>
            </a>
          ) : (
            <>
              <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100/50 cursor-pointer transition-colors">
                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                  <FileText size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-700 truncate">Course Syllabus Guide.pdf</p>
                  <p className="text-[10px] text-slate-400 font-semibold">1.4 MB • PDF Document</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100/50 cursor-pointer transition-colors">
                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                  <BookOpen size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-700 truncate">Core Reference Textbook.epub</p>
                  <p className="text-[10px] text-slate-400 font-semibold">12.8 MB • EPUB Book</p>
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Submission Card (Submission Content / Form Area) */}
      {(isSubmitted || isGraded) ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="glass p-6 rounded-3xl border border-emerald-500/25 bg-emerald-500/[0.02]"
        >
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <CheckCircle size={18} className="text-emerald-500" /> Your Submission
          </h3>
          <div className="space-y-4 text-sm text-slate-600">
            {a.submissionContent && (
              <div className="bg-white border border-slate-200/80 rounded-xl p-4 whitespace-pre-wrap text-xs font-medium max-h-48 overflow-y-auto">
                <strong className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">Response content:</strong>
                {a.submissionContent}
              </div>
            )}
            {a.submissionFileUrl && (
              <div className="text-xs text-slate-500 flex items-center gap-1.5 bg-white border border-slate-200/80 rounded-xl px-3 py-2 w-max">
                <Paperclip size={12} className="text-slate-400" />
                <span className="font-bold text-slate-600 truncate max-w-[200px]">Uploaded Document</span>
                <span className="text-[9px] text-slate-400 bg-slate-100 px-1 py-0.5 rounded font-bold">PDF</span>
              </div>
            )}
            
            {isGraded ? (
              <div className="mt-4 pt-4 border-t border-slate-200/80 bg-green-500/5 p-4 rounded-xl border border-green-500/10 space-y-2.5">
                <p className="text-xs text-slate-500 font-semibold mb-0.5">Teacher Grade Remarks</p>
                <p className="text-2xl font-black text-green-500">
                  {a.marks} <span className="text-sm font-normal text-slate-400">/ {a.totalMarks || 100}</span>
                </p>
                {a.feedback && (
                  <div className="bg-white border border-slate-150 rounded-2xl p-4 text-xs font-semibold text-slate-600 leading-relaxed shadow-sm mt-2">
                    <strong className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">Teacher Feedback:</strong>
                    {a.feedback}
                  </div>
                )}
                <p className="text-xs text-slate-400 mt-1 italic">Submission graded. Review complete.</p>
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic">
                Submitted on {new Date().toLocaleDateString()}. Pending faculty evaluation.
              </div>
            )}
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass p-8 rounded-3xl border border-slate-300"
        >
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Upload size={18} className="text-primary" /> Rich Text Submission Area
          </h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            <textarea
              value={submissionContent}
              onChange={(e) => setSubmissionContent(e.target.value)}
              placeholder="Type your submission content, draft answers, or paste links to your project repository..."
              className="w-full h-48 bg-white border border-slate-300 rounded-2xl p-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none font-medium text-sm leading-relaxed"
            />

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 ml-1">File Upload Area (Optional)</label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative w-full flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed rounded-2xl transition-all duration-200 cursor-pointer ${
                  isDragging
                    ? "border-primary bg-primary/5 text-primary scale-[0.99]"
                    : selectedFile
                    ? "border-primary bg-primary/[0.02] text-primary"
                    : "border-slate-300 hover:border-primary/50 text-slate-400 bg-slate-50/50"
                }`}
              >
                <input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  accept=".pdf,.doc,.docx,.zip"
                />
                <Upload size={24} className={isDragging ? "animate-bounce" : ""} />
                <span className="font-bold text-sm">
                  {selectedFile ? selectedFile.name : "Drag and drop your file here, or click to browse"}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">
                  Supports PDF, DOCX, and ZIP formats (Max 10MB)
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Link href="/dashboard/assignments">
                <button
                  type="button"
                  className="px-6 py-2.5 rounded-xl hover:bg-slate-100 transition-colors font-bold text-sm text-slate-500 border border-slate-200 bg-white"
                >
                  Cancel
                </button>
              </Link>
              <AnimatedButton
                type="submit"
                isLoading={submitMutation.isPending || isUploading}
                disabled={!submissionContent.trim() && !selectedFile}
              >
                Submit Assignment
              </AnimatedButton>
            </div>
          </form>
        </motion.div>
      )}
    </div>
  );
}
