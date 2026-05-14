"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Plus, X, Calendar as CalendarIcon } from "lucide-react";
import { AnimatedButton } from "@/components/ui/animated-button";
import { AnimatedInput } from "@/components/ui/animated-input";

export default function AdminSchedulesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    courseId: "",
    teacherId: "",
    date: "",
    time: "",
  });

  const { data: schedulesData, isLoading } = useQuery({
    queryKey: ["schedules"],
    queryFn: async () => {
      const res = await fetch("/api/admin/schedules");
      if (!res.ok) throw new Error("Failed to fetch schedules");
      return res.json();
    },
  });

  const { data: coursesData } = useQuery({
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

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to create schedule");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      setIsModalOpen(false);
      setFormData({ courseId: "", teacherId: "", date: "", time: "" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.courseId || !formData.teacherId || !formData.date || !formData.time) return;
    createMutation.mutate();
  };

  const schedules = schedulesData?.data?.schedules || [];
  const courses = coursesData?.data?.courses || [];
  const teachers = teachersData?.data?.teachers || [];

  return (
    <div className="max-w-6xl mx-auto pb-12 relative z-10">
      <div className="flex justify-between items-end mb-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-3">
            <Clock size={32} /> Master Schedule
          </h1>
          <p className="text-foreground/70">Manage all class timings and faculty allocations.</p>
        </motion.div>
        <AnimatedButton onClick={() => setIsModalOpen(true)}>
          <Plus size={18} className="mr-2 inline" /> Schedule Class
        </AnimatedButton>
      </div>

      <div className="glass rounded-3xl border border-white/10 overflow-hidden">
        <div className="grid grid-cols-4 bg-white/5 p-4 font-semibold text-foreground/80 border-b border-white/10 text-sm">
          <div>Date & Time</div>
          <div className="col-span-2">Course Name</div>
          <div>Faculty Member</div>
        </div>
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-10 bg-white/5 animate-pulse rounded" />)}
          </div>
        ) : schedules.length === 0 ? (
          <div className="p-8 text-center text-foreground/50">No classes scheduled yet.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {schedules.map((schedule: any, i: number) => (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                key={schedule.id} className="grid grid-cols-4 p-4 items-center hover:bg-white/5 transition-colors text-sm"
              >
                <div className="flex items-center gap-2 text-primary font-medium">
                  <CalendarIcon size={16} />
                  {new Date(schedule.date).toLocaleDateString()} at {schedule.time}
                </div>
                <div className="col-span-2 font-bold text-foreground/90">{schedule.courseName}</div>
                <div className="text-foreground/70">{schedule.teacherName}</div>
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
                <h2 className="text-2xl font-bold mb-6 text-primary">Schedule a Class</h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground/70 mb-1 ml-1">Select Course</label>
                    <select 
                      value={formData.courseId}
                      onChange={(e) => {
                        const selectedCourse = courses.find((c: any) => c.id === e.target.value);
                        setFormData({...formData, courseId: e.target.value, teacherId: selectedCourse?.teacherName ? courses.find((c: any) => c.id === e.target.value).teacherId : ''}); // teacherId usually mapped in DB, but we didn't fetch it explicitly in this query! Let's just pass teacherId from the frontend if we can.
                        // Actually, I can just fetch teacherId from the selected course.
                      }}
                      required
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors appearance-none"
                    >
                      <option value="">Select a Course</option>
                      {courses.map((c: any) => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                  </div>

                  {/* To keep it simple, we require user to select teacher. It's safer. */}
                  <div>
                    <label className="block text-sm font-medium text-foreground/70 mb-1 ml-1">Confirm Faculty</label>
                    <select 
                      value={formData.teacherId}
                      onChange={(e) => setFormData({...formData, teacherId: e.target.value})}
                      required
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors appearance-none"
                    >
                      <option value="">Select Faculty</option>
                      {teachers.map((t: any) => <option key={t.id} value={t.id}>{t.name} ({t.email})</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <AnimatedInput
                      label="Date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      required
                    />
                    <AnimatedInput
                      label="Time"
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({...formData, time: e.target.value})}
                      required
                    />
                  </div>

                  <div className="pt-4 flex justify-end">
                    <AnimatedButton type="submit" isLoading={createMutation.isPending}>
                      Create Schedule
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
