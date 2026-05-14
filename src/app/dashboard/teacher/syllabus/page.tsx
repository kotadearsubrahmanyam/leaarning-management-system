"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, Reorder } from "framer-motion";
import { BookOpen, Plus, GripVertical, Trash2 } from "lucide-react";
import { AnimatedButton } from "@/components/ui/animated-button";
import { AnimatedInput } from "@/components/ui/animated-input";

export default function SyllabusBuilderPage() {
  const queryClient = useQueryClient();
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [newTopic, setNewTopic] = useState("");

  const { data: coursesData } = useQuery({
    queryKey: ["teacherCourses"],
    queryFn: async () => {
      const res = await fetch("/api/courses?teacherOnly=true");
      if (!res.ok) throw new Error("Failed to fetch courses");
      return res.json();
    },
  });

  const courses = coursesData?.data?.courses || [];

  useEffect(() => {
    if (courses.length === 1 && !selectedCourse) {
      setSelectedCourse(courses[0].id);
    }
  }, [courses, selectedCourse]);

  const { data: syllabusData, isLoading: isSyllabusLoading } = useQuery({
    queryKey: ["syllabus", selectedCourse],
    queryFn: async () => {
      if (!selectedCourse) return null;
      const res = await fetch(`/api/teacher/syllabus?courseId=${selectedCourse}`);
      if (!res.ok) throw new Error("Failed to fetch syllabus");
      return res.json();
    },
    enabled: !!selectedCourse,
  });

  const syllabusItems = syllabusData?.data?.syllabus || [];

  const addTopicMutation = useMutation({
    mutationFn: async (title: string) => {
      const res = await fetch("/api/teacher/syllabus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: selectedCourse, title }),
      });
      if (!res.ok) throw new Error("Failed to add topic");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["syllabus", selectedCourse] });
      setNewTopic("");
    },
  });

  const deleteTopicMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/teacher/syllabus?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete topic");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["syllabus", selectedCourse] });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (items: any[]) => {
      const payload = items.map((item, index) => ({ id: item.id, order: index }));
      const res = await fetch("/api/teacher/syllabus", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payload }),
      });
      if (!res.ok) throw new Error("Failed to reorder");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["syllabus", selectedCourse] });
    },
  });

  const handleReorder = (newOrder: any[]) => {
    // Optimistic update logic could go here, but for simplicity we mutate directly
    // This is safe because framer-motion Reorder controls the visual DOM state while dragging
    reorderMutation.mutate(newOrder);
  };

  const handleAddTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic.trim() || !selectedCourse) return;
    addTopicMutation.mutate(newTopic);
  };

  return (
    <div className="max-w-4xl mx-auto pb-12 relative z-10">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-3">
          <BookOpen size={32} /> Syllabus Builder
        </h1>
        <p className="text-foreground/70">Design the timeline and structure for your courses.</p>
      </motion.div>

      <div className="glass p-6 rounded-3xl border border-white/10 mb-8">
        <label className="block text-sm font-medium text-foreground/70 mb-2">Select Course</label>
        <select
          value={selectedCourse || ""}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors appearance-none"
        >
          <option value="" disabled>-- Choose a course --</option>
          {courses.map((c: any) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
      </div>

      {selectedCourse && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <form onSubmit={handleAddTopic} className="glass p-6 rounded-3xl border border-white/10 flex items-end gap-4">
            <div className="flex-1 w-full">
              <AnimatedInput
                label="New Topic Title"
                type="text"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                placeholder="e.g. Introduction to Variables"
                required
              />
            </div>
            <AnimatedButton type="submit" isLoading={addTopicMutation.isPending} className="mb-1 w-auto min-w-[120px]">
              <Plus size={18} className="mr-2 inline" /> Add
            </AnimatedButton>
          </form>

          {isSyllabusLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-16 glass rounded-xl animate-pulse" />)}
            </div>
          ) : syllabusItems.length === 0 ? (
            <div className="text-center p-12 glass rounded-3xl border border-white/10 text-foreground/50">
              No topics added to this syllabus yet.
            </div>
          ) : (
            <div className="glass p-6 rounded-3xl border border-white/10">
              <h3 className="font-bold text-lg mb-4 text-primary">Course Timeline</h3>
              <Reorder.Group axis="y" values={syllabusItems} onReorder={handleReorder} className="space-y-3">
                {syllabusItems.map((item: any, index: number) => (
                  <Reorder.Item 
                    key={item.id} 
                    value={item}
                    className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl cursor-grab active:cursor-grabbing hover:bg-white/10 transition-colors"
                  >
                    <GripVertical size={20} className="text-foreground/30" />
                    <div className="flex-1">
                      <span className="text-primary font-bold mr-3">Week {index + 1}:</span>
                      <span className="font-medium">{item.title}</span>
                    </div>
                    <button 
                      onClick={() => deleteTopicMutation.mutate(item.id)}
                      className="p-2 text-destructive hover:bg-destructive/20 rounded-lg transition-colors"
                      title="Remove Topic"
                    >
                      <Trash2 size={16} />
                    </button>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
