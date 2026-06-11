"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { FileEdit, Plus, X, Calendar } from "lucide-react";
import { AnimatedButton } from "@/components/ui/animated-button";
import { AnimatedInput } from "@/components/ui/animated-input";

export default function TeacherAssignmentsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    courseId: "",
    title: "",
    description: "",
    dueDate: "",
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
      setIsModalOpen(false);
      setFormData({ courseId: "", title: "", description: "", dueDate: "" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.courseId || !formData.title || !formData.dueDate) return;
    createMutation.mutate();
  };

  return (
    <div className="max-w-5xl mx-auto pb-12 relative z-10">
      <div className="flex justify-between items-end mb-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-3">
            <FileEdit size={32} /> Assignment Management
          </h1>
          <p className="text-foreground/70">Create and manage assignments for your courses.</p>
        </motion.div>
        <AnimatedButton onClick={() => setIsModalOpen(true)}>
          <Plus size={18} className="mr-2 inline" /> Create Assignment
        </AnimatedButton>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-32 glass rounded-3xl animate-pulse" />)}
        </div>
      ) : assignments.length === 0 ? (
        <div className="glass p-12 rounded-3xl border border-white/10 text-center">
          <FileEdit size={48} className="mx-auto text-foreground/20 mb-4" />
          <p className="text-foreground/50">No assignments created yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {assignments.map((a: any, i: number) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
              className="glass p-6 rounded-3xl border border-white/10 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded uppercase tracking-wider">{a.courseName}</span>
                  <span className="text-xs text-orange-500 font-semibold flex items-center gap-1 bg-orange-500/10 px-2 py-1 rounded">
                    <Calendar size={12} /> Due {new Date(a.dueDate).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">{a.title}</h3>
                {a.description && (
                  <div className="text-sm text-foreground/80 mb-4 whitespace-pre-wrap border-l-2 border-primary/40 pl-3 bg-white/5 py-2.5 rounded-r-xl">
                    <strong className="text-xs text-primary block mb-1">Question / Instructions:</strong>
                    {a.description}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Creation Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: "10%" }} animate={{ opacity: 1, scale: 1, y: "-50%" }} exit={{ opacity: 0, scale: 0.95, y: "10%" }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 z-50 w-full max-w-md"
            >
              <div className="glass p-8 rounded-3xl border border-white/20 shadow-2xl relative">
                <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                  <X size={20} />
                </button>
                <h2 className="text-2xl font-bold mb-6 text-primary">New Assignment</h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground/70 mb-1 ml-1">Course *</label>
                    <select 
                      value={formData.courseId}
                      onChange={(e) => setFormData({...formData, courseId: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors appearance-none"
                      required
                    >
                      <option value="" disabled>Select Course</option>
                      {courses.map((c: any) => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                  </div>
                  
                  <AnimatedInput
                    label="Assignment Title *"
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                  />
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground/70 mb-1 ml-1">Description</label>
                    <textarea 
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors resize-none h-24"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground/70 mb-1 ml-1">Due Date *</label>
                    <input 
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors"
                      required
                    />
                  </div>

                  <div className="pt-4 flex justify-end">
                    <AnimatedButton type="submit" isLoading={createMutation.isPending} className="w-full">
                      Create Assignment
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
