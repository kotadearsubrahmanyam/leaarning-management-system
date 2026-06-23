"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ClipboardList, 
  Check, 
  Users, 
  BookOpen, 
  AlertCircle
} from "lucide-react";
import { AnimatedButton } from "@/components/ui/animated-button";
import { CourseSelect } from "@/components/ui/course-select";
import { useToast } from "@/hooks/use-toast";

export default function TeacherInternalsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showSavedNotification, setShowSavedNotification] = useState(false);
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Local Marks Ledger State
  const [localMarks, setLocalMarks] = useState<Record<string, { mid1: string; mid2: string; assignmentMarks: string; classExternal: string }>>({});

  useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  const { data: coursesData } = useQuery({
    queryKey: ["teacherCourses"],
    queryFn: async () => {
      const res = await fetch("/api/courses?teacherOnly=true");
      if (!res.ok) throw new Error("Failed to fetch courses");
      return res.json();
    },
  });

  const { data: courseResultsData, isLoading: resultsLoading } = useQuery({
    queryKey: ["courseResults", selectedCourse],
    queryFn: async () => {
      if (!selectedCourse) return { data: { students: [] } };
      const res = await fetch(`/api/teacher/courses/${selectedCourse}/results`);
      if (!res.ok) throw new Error("Failed to fetch course results");
      return res.json();
    },
    enabled: !!selectedCourse,
  });

  const courses = coursesData?.data?.courses || [];
  const courseResults = courseResultsData?.data?.students || [];

  useEffect(() => {
    if (courses.length === 1 && !selectedCourse) {
      setSelectedCourse(courses[0].id);
    }
  }, [courses, selectedCourse]);

  useEffect(() => {
    if (courseResults.length > 0) {
      const initial: Record<string, { mid1: string; mid2: string; assignmentMarks: string; classExternal: string }> = {};
      courseResults.forEach((s: any) => {
        initial[s.id] = {
          mid1: String(s.mid1 ?? 0),
          mid2: String(s.mid2 ?? 0),
          assignmentMarks: String(s.assignmentMarks ?? 0),
          classExternal: String(s.classExternal ?? 0),
        };
      });
      setLocalMarks(initial);
    }
  }, [courseResults]);

  const saveResultsMutation = useMutation({
    mutationFn: async (resultsPayload: any[]) => {
      const res = await fetch(`/api/teacher/courses/${selectedCourse}/results`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ results: resultsPayload }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to save internal marks");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courseResults", selectedCourse] });
      toast({
        title: "Internal Marks Saved",
        description: "Draft internal marks have been saved successfully.",
      });
      setShowSavedNotification(true);
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
      notificationTimeoutRef.current = setTimeout(() => {
        setShowSavedNotification(false);
      }, 4000);
    },
    onError: (error: any) => {
      toast({
        title: "Saving Failed",
        description: error.message || "Could not save internal marks.",
        variant: "destructive",
      });
    }
  });

  const handleLocalMarkChange = (studentId: string, field: "mid1" | "mid2" | "assignmentMarks" | "classExternal", value: string) => {
    let clean = value.replace(/[^0-9]/g, "");
    if (clean !== "") {
      const num = parseInt(clean);
      if (field === "mid1" && num > 16) clean = "16";
      if (field === "mid2" && num > 24) clean = "24";
      if (field === "assignmentMarks" && num > 10) clean = "10";
      if (field === "classExternal" && num > 50) clean = "50";
      if (num < 0) clean = "0";
    }
    setLocalMarks(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId] || { mid1: "0", mid2: "0", assignmentMarks: "0", classExternal: "0" },
        [field]: clean
      }
    }));
  };

  const getCalculatedClassInternal = (studentId: string) => {
    const marks = localMarks[studentId];
    if (!marks) return 0;
    const m1 = parseInt(marks.mid1) || 0;
    const m2 = parseInt(marks.mid2) || 0;
    const am = parseInt(marks.assignmentMarks) || 0;
    return m1 + m2 + am;
  };

  const getCalculatedInternal = (studentId: string) => {
    const marks = localMarks[studentId];
    if (!marks) return 0;
    const cInt = getCalculatedClassInternal(studentId);
    const cExt = parseInt(marks.classExternal) || 0;
    return Math.round((cInt + cExt) / 2);
  };

  const handleSaveLedger = () => {
    const payload = Object.entries(localMarks).map(([studentId, marks]) => ({
      studentId,
      mid1: parseInt(marks.mid1) || 0,
      mid2: parseInt(marks.mid2) || 0,
      assignmentMarks: parseInt(marks.assignmentMarks) || 0,
      classExternal: parseInt(marks.classExternal) || 0,
    }));
    saveResultsMutation.mutate(payload);
  };

  const filteredStudents = courseResults.filter((student: any) => {
    const term = searchQuery.toLowerCase();
    return (
      student.name.toLowerCase().includes(term) ||
      (student.rollNumber || "").toLowerCase().includes(term)
    );
  });

  return (
    <div className="max-w-6xl mx-auto pb-12 relative z-10">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-3">
          <ClipboardList size={32} /> Internal Marks Ledger
        </h1>
        <p className="text-foreground/70">Manage class internal marks (Max 50: Mid 1 (16) + Mid 2 (24) + Assignment (10)) and class external marks (Max 50). The system averages both values automatically.</p>
      </motion.div>

      {/* Course Filter & Search Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 items-end relative z-30">
        <div className="md:col-span-2 bg-white/45 border border-slate-200 p-4 rounded-3xl shadow-sm">
          <CourseSelect
            courses={courses}
            selectedCourse={selectedCourse}
            setSelectedCourse={setSelectedCourse}
            label="Filter by Course"
            placeholder="Choose a course to load student list..."
            showClear={true}
          />
        </div>
        {selectedCourse && (
          <div className="bg-white/45 border border-slate-200 p-4 rounded-3xl shadow-sm">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Search Students</label>
            <input
              type="text"
              placeholder="Search by name or roll number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent text-sm transition-all"
            />
          </div>
        )}
      </div>

      {!selectedCourse ? (
        <div className="p-12 text-center text-foreground/50 glass rounded-3xl border border-white/10">
          <BookOpen size={48} className="mx-auto mb-4 opacity-30 text-[#7C3AED]" />
          <p className="text-lg font-bold">No Course Selected</p>
          <p className="text-sm mt-1">Please select a course to view and edit student internal marks.</p>
        </div>
      ) : resultsLoading ? (
        <div className="p-4 space-y-4">
          {[1,2,3,4].map(i => <div key={i} className="h-16 bg-white/5 animate-pulse rounded-xl" />)}
        </div>
      ) : courseResults.length === 0 ? (
        <div className="p-12 text-center text-foreground/50 glass rounded-3xl border border-white/10">
          <Users size={48} className="mx-auto mb-4 opacity-30 text-[#7C3AED]" />
          <p className="text-lg font-bold">No Registered Students</p>
          <p className="text-sm mt-1">There are no students enrolled in your sections for this course.</p>
        </div>
      ) : (
        <div className="glass rounded-3xl border border-white/10 overflow-hidden shadow-xl">
          {/* Legend Banner */}
          <div className="bg-purple-900/20 px-6 py-3 border-b border-white/10 flex flex-wrap gap-4 text-xs font-semibold text-purple-200/90 items-center justify-between">
            <span className="flex items-center gap-1.5"><AlertCircle size={14} className="text-[#7C3AED]" /> <strong>Legend:</strong></span>
            <span>Mid 1: Max 16</span>
            <span>Mid 2: Max 24</span>
            <span>Assignment: Max 10</span>
            <span>Class Internal: Max 50 (Mid 1 + Mid 2 + Assignment)</span>
            <span>Class External: Max 50</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-white/5 font-semibold text-foreground/80 border-b border-white/10 text-xs uppercase tracking-wider">
                  <th className="p-4">Student</th>
                  <th className="p-4 text-center">Mid 1 (16)</th>
                  <th className="p-4 text-center">Mid 2 (24)</th>
                  <th className="p-4 text-center">Assign (10)</th>
                  <th className="p-4 text-center">Class Internal (50)</th>
                  <th className="p-4 text-center">Class External (50)</th>
                  <th className="p-4 text-center">Averaged (50)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredStudents.map((student: any) => {
                  const marksState = localMarks[student.id] || { mid1: "0", mid2: "0", assignmentMarks: "0", classExternal: "0" };
                  const computedClassInternal = getCalculatedClassInternal(student.id);
                  const computedInternal = getCalculatedInternal(student.id);

                  return (
                    <tr key={student.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground">{student.name}</span>
                          <span className="text-foreground/50 text-xs font-mono">{student.rollNumber || "N/A"}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <input
                          type="text"
                          value={marksState.mid1}
                          onChange={(e) => handleLocalMarkChange(student.id, "mid1", e.target.value)}
                          placeholder="0"
                          className="w-16 h-10 px-2 py-1 bg-white/5 border border-white/10 rounded-xl text-center text-sm font-bold text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                        />
                      </td>
                      <td className="p-4 text-center">
                        <input
                          type="text"
                          value={marksState.mid2}
                          onChange={(e) => handleLocalMarkChange(student.id, "mid2", e.target.value)}
                          placeholder="0"
                          className="w-16 h-10 px-2 py-1 bg-white/5 border border-white/10 rounded-xl text-center text-sm font-bold text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                        />
                      </td>
                      <td className="p-4 text-center">
                        <input
                          type="text"
                          value={marksState.assignmentMarks}
                          onChange={(e) => handleLocalMarkChange(student.id, "assignmentMarks", e.target.value)}
                          placeholder="0"
                          className="w-16 h-10 px-2 py-1 bg-white/5 border border-white/10 rounded-xl text-center text-sm font-bold text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                        />
                      </td>
                      <td className="p-4 text-center font-bold text-foreground/80">
                        {computedClassInternal}
                      </td>
                      <td className="p-4 text-center">
                        <input
                          type="text"
                          value={marksState.classExternal}
                          onChange={(e) => handleLocalMarkChange(student.id, "classExternal", e.target.value)}
                          placeholder="0"
                          className="w-20 h-10 px-2 py-1 bg-white/5 border border-white/10 rounded-xl text-center text-sm font-bold text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                        />
                      </td>
                      <td className="p-4 text-center">
                        <span className="px-2.5 py-1.5 rounded-xl bg-primary/10 text-primary font-black text-sm">
                          {computedInternal}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-white/5 border-t border-white/10 flex justify-end">
            <AnimatedButton
              onClick={handleSaveLedger}
              disabled={saveResultsMutation.isPending}
            >
              {saveResultsMutation.isPending ? "Saving Ledger..." : "Save Draft Ledger"}
            </AnimatedButton>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showSavedNotification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9, x: 0 }}
            animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
            exit={{ opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.2 } }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-4 bg-slate-900/95 backdrop-blur-md border border-emerald-500/30 text-white px-5 py-4 rounded-2xl shadow-2xl shadow-emerald-950/20 max-w-sm"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 shadow-inner">
              <Check className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm text-slate-100">Draft Ledger Saved</h3>
              <p className="text-xs text-slate-400 mt-0.5">Your internal marks drafts have been saved successfully.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
