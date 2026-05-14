"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { CheckSquare, X, Check, FileText } from "lucide-react";
import { AnimatedButton } from "@/components/ui/animated-button";
import { AnimatedInput } from "@/components/ui/animated-input";

export default function TeacherEvaluationPage() {
  const queryClient = useQueryClient();
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [evalModal, setEvalModal] = useState<any>(null);
  const [marks, setMarks] = useState("");

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
        body: JSON.stringify({ submissionId: evalModal.id, marks }),
      });
      if (!res.ok) throw new Error("Failed to save grade");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacherEvaluations", selectedCourse] });
      setEvalModal(null);
      setMarks("");
    },
  });

  const openEvalModal = (submission: any) => {
    setEvalModal(submission);
    setMarks(submission.marks ? submission.marks.toString() : "");
  };

  const handleGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!marks || isNaN(Number(marks))) return;
    gradeMutation.mutate();
  };

  return (
    <div className="max-w-6xl mx-auto pb-12 relative z-10">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-3">
          <CheckSquare size={32} /> Evaluation & Grading
        </h1>
        <p className="text-foreground/70">Review student submissions and assign grades.</p>
      </motion.div>

      <div className="glass p-6 rounded-3xl border border-white/10 mb-8 max-w-md">
        <label className="block text-sm font-medium text-foreground/70 mb-2">Filter by Course</label>
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors appearance-none"
        >
          <option value="">All Courses</option>
          {courses.map((c: any) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
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

      {/* Evaluation Modal */}
      <AnimatePresence>
        {evalModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setEvalModal(null)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: "10%" }} animate={{ opacity: 1, scale: 1, y: "-50%" }} exit={{ opacity: 0, scale: 0.95, y: "10%" }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 z-50 w-full max-w-lg"
            >
              <div className="glass p-8 rounded-3xl border border-white/20 shadow-2xl relative max-h-[80vh] overflow-y-auto">
                <button onClick={() => setEvalModal(null)} className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                  <X size={20} />
                </button>
                <h2 className="text-2xl font-bold mb-2 text-primary">Evaluate Submission</h2>
                <p className="text-foreground/70 mb-6">{evalModal.studentName} - {evalModal.assignmentTitle}</p>
                
                <div className="bg-black/30 p-4 rounded-xl border border-white/5 mb-6">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <FileText size={16} className="text-primary"/> Student Submission
                  </h3>
                  {evalModal.content ? (
                    <p className="text-sm text-foreground/80 whitespace-pre-wrap">{evalModal.content}</p>
                  ) : (
                    <p className="text-sm text-foreground/50 italic">No text content provided.</p>
                  )}
                  {evalModal.fileUrl && (
                    <a href={evalModal.fileUrl} target="_blank" rel="noreferrer" className="mt-4 block text-sm text-primary hover:underline">
                      View Attached File
                    </a>
                  )}
                </div>

                <form onSubmit={handleGrade} className="space-y-4">
                  <AnimatedInput
                    label="Marks (out of 100)"
                    type="number"
                    min="0"
                    max="100"
                    value={marks}
                    onChange={(e) => setMarks(e.target.value)}
                    required
                  />

                  <div className="pt-4 flex justify-end">
                    <AnimatedButton type="submit" isLoading={gradeMutation.isPending} className="w-full">
                      Submit Grade
                    </AnimatedButton>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
