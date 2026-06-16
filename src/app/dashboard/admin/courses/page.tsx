"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Plus, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { AnimatedButton } from "@/components/ui/animated-button";
import { AnimatedInput } from "@/components/ui/animated-input";

export default function AdminCoursesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    level: "Beginner",
    teacherId: "",
    categoryId: "",
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editCourse, setEditCourse] = useState<any>(null);
  const [editTeacherId, setEditTeacherId] = useState("");

  const { data: coursesData, isLoading } = useQuery({
    queryKey: ["adminCourses"],
    queryFn: async () => {
      const res = await fetch("/api/admin/courses");
      if (!res.ok) throw new Error("Failed to fetch courses");
      return res.json();
    },
  });

  const { data: teachersData } = useQuery({
    queryKey: ["teachers"],
    queryFn: async () => {
      const res = await fetch("/api/admin/teachers");
      if (!res.ok) throw new Error("Failed to fetch teachers");
      return res.json();
    },
  });

  const { data: departmentsData } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await fetch("/api/admin/departments");
      if (!res.ok) throw new Error("Failed to fetch departments");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to create course");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCourses"] });
      setIsModalOpen(false);
      setFormData({ title: "", description: "", level: "Beginner", teacherId: "", categoryId: "" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create course", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/courses/${editCourse.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId: editTeacherId }),
      });
      if (!res.ok) throw new Error("Failed to reassign teacher");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCourses"] });
      setIsEditModalOpen(false);
      toast({ title: "Success", description: "Teacher reassigned successfully!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to reassign teacher", variant: "destructive" });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.teacherId) return;
    createMutation.mutate();
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTeacherId) return;
    updateMutation.mutate();
  };

  const courses = coursesData?.data?.courses || [];
  const teachers = teachersData?.data?.teachers || [];
  const departments = departmentsData?.data?.departments || [];

  return (
    <div className="max-w-6xl mx-auto pb-12 relative z-10">
      <div className="flex justify-between items-end mb-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-3">
            <BookOpen size={32} /> Course Management
          </h1>
          <p className="text-foreground/70">Oversee all courses and assign faculty members.</p>
        </motion.div>
        <AnimatedButton onClick={() => setIsModalOpen(true)}>
          <Plus size={18} className="mr-2 inline" /> Create Course
        </AnimatedButton>
      </div>

      <div className="glass rounded-3xl border border-white/10 overflow-hidden">
        <div className="grid grid-cols-6 bg-white/5 p-4 text-xs font-bold text-foreground/50 uppercase tracking-wider border-b border-white/10">
          <div className="col-span-2">Course Name</div>
          <div>Department</div>
          <div>Level</div>
          <div>Assigned Teacher</div>
          <div className="text-right">Actions</div>
        </div>
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-10 bg-white/5 animate-pulse rounded" />)}
          </div>
        ) : courses.length === 0 ? (
          <div className="p-8 text-center text-foreground/50">No courses found.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {courses.map((course: any, i: number) => (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                key={course.id} className="grid grid-cols-6 p-4 items-center hover:bg-white/5 transition-colors text-sm"
              >
                <div className="col-span-2 font-bold text-primary">{course.title}</div>
                <div className="text-foreground/70">{course.departmentName || "Unassigned"}</div>
                <div>
                  <span className="bg-white/10 px-2 py-1 rounded text-xs">{course.level}</span>
                </div>
                <div className="text-foreground/90 font-medium">{course.teacherName}</div>
                <div className="text-right">
                  <button 
                    onClick={() => { setEditCourse(course); setEditTeacherId(course.teacherId); setIsEditModalOpen(true); }} 
                    className="text-emerald-400 hover:text-emerald-300 text-xs px-3 py-1 bg-emerald-500/10 rounded-md transition-colors"
                  >
                    Reassign
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

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
              className="fixed left-1/2 top-1/2 -translate-x-1/2 z-50 w-full max-w-xl"
            >
              <div className="glass p-8 rounded-3xl border border-white/20 shadow-2xl relative">
                <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                  <X size={20} />
                </button>
                <h2 className="text-2xl font-bold mb-6 text-primary">Create New Course</h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <AnimatedInput
                    label="Course Title"
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
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors resize-none"
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground/70 mb-1 ml-1">Level</label>
                      <select 
                        value={formData.level}
                        onChange={(e) => setFormData({...formData, level: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors appearance-none"
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground/70 mb-1 ml-1">Department</label>
                      <select 
                        value={formData.categoryId}
                        onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors appearance-none"
                      >
                        <option value="">Select Department</option>
                        {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground/70 mb-1 ml-1">Assign Teacher</label>
                    <select 
                      value={formData.teacherId}
                      onChange={(e) => setFormData({...formData, teacherId: e.target.value})}
                      required
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors appearance-none"
                    >
                      <option value="">Select a Teacher</option>
                      {teachers.map((t: any) => <option key={t.id} value={t.id}>{t.name} ({t.email})</option>)}
                    </select>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <AnimatedButton type="submit" isLoading={createMutation.isPending}>
                      Create Course
                    </AnimatedButton>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditModalOpen && editCourse && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsEditModalOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: "10%" }} animate={{ opacity: 1, scale: 1, y: "-50%" }} exit={{ opacity: 0, scale: 0.95, y: "10%" }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 z-50 w-full max-w-xl"
            >
              <div className="glass p-8 rounded-3xl border border-white/20 shadow-2xl relative">
                <button onClick={() => setIsEditModalOpen(false)} className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                  <X size={20} />
                </button>
                <h2 className="text-2xl font-bold mb-6 text-primary">Reassign Teacher</h2>
                <div className="mb-4 p-4 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-sm text-foreground/70 mb-1">Course</p>
                  <p className="font-semibold text-lg">{editCourse.title}</p>
                </div>
                
                <form onSubmit={handleUpdate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground/70 mb-1 ml-1">Assign New Teacher</label>
                    <select 
                      value={editTeacherId}
                      onChange={(e) => setEditTeacherId(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors appearance-none"
                      required
                    >
                      <option value="">Select a Teacher</option>
                      {teachers.map((t: any) => <option key={t.id} value={t.id}>{t.name} ({t.email})</option>)}
                    </select>
                  </div>
                  <div className="pt-4 flex justify-end gap-3">
                    <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={updateMutation.isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[120px]">
                      {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                    </Button>
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
