"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Calendar, CheckCircle, XCircle, Save } from "lucide-react";
import { AnimatedButton } from "@/components/ui/animated-button";

export default function TeacherAttendancePage() {
  const queryClient = useQueryClient();
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [attendanceState, setAttendanceState] = useState<Record<string, string>>({});

  const { data: coursesData } = useQuery({
    queryKey: ["teacherCourses"],
    queryFn: async () => {
      const res = await fetch("/api/courses?teacherOnly=true");
      if (!res.ok) throw new Error("Failed to fetch courses");
      return res.json();
    },
  });

  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ["teacherAttendance", selectedCourse, selectedDate],
    queryFn: async () => {
      if (!selectedCourse || !selectedDate) return null;
      const res = await fetch(`/api/teacher/attendance?courseId=${selectedCourse}&date=${selectedDate}`);
      if (!res.ok) throw new Error("Failed to fetch attendance");
      return res.json();
    },
    enabled: !!selectedCourse && !!selectedDate,
  });

  const students = attendanceData?.data?.attendance || [];
  const courses = coursesData?.data?.courses || [];

  // Sync state when data loads
  useEffect(() => {
    const fetchedStudents = attendanceData?.data?.attendance || [];
    if (fetchedStudents.length > 0) {
      const newState: Record<string, string> = {};
      fetchedStudents.forEach((s: any) => {
        newState[s.id] = s.status || "PRESENT"; // Default to present if unmarked
      });
      setAttendanceState(newState);
    } else {
      setAttendanceState({});
    }
  }, [attendanceData]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const records = Object.keys(attendanceState).map(userId => ({
        userId,
        status: attendanceState[userId]
      }));

      const res = await fetch("/api/teacher/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: selectedCourse, date: selectedDate, records }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to save attendance");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacherAttendance", selectedCourse, selectedDate] });
      alert("Attendance saved successfully! It is now locked for 24 hours.");
    },
    onError: (err: any) => {
      alert(err.message);
    }
  });

  const handleStatusChange = (userId: string, status: string) => {
    if (isAlreadySaved) return;
    setAttendanceState(prev => ({ ...prev, [userId]: status }));
  };

  const isAlreadySaved = students.some((s: any) => s.status !== null);

  return (
    <div className="max-w-5xl mx-auto pb-12 relative z-10">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-3">
          <Calendar size={32} /> Attendance Tracking
        </h1>
        <p className="text-foreground/70">Mark attendance for your enrolled students.</p>
      </motion.div>

      <div className="glass p-6 rounded-3xl border border-white/10 mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-2">Select Course</label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors appearance-none"
          >
            <option value="" disabled>-- Choose a course --</option>
            {courses.map((c: any) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-2">Select Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      {selectedCourse && selectedDate && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-3xl border border-white/10 overflow-hidden">
          <div className="p-4 bg-white/5 border-b border-white/10 flex justify-between items-center">
            <h2 className="font-bold">Student Roster</h2>
            {isAlreadySaved ? (
              <span className="text-sm font-semibold text-green-500 bg-green-500/10 px-3 py-1.5 rounded-xl border border-green-500/20">
                Attendance Saved & Locked
              </span>
            ) : (
              <AnimatedButton onClick={() => saveMutation.mutate()} isLoading={saveMutation.isPending}>
                <Save size={18} className="mr-2 inline" /> Save Attendance
              </AnimatedButton>
            )}
          </div>
          
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1,2,3,4].map(i => <div key={i} className="h-12 bg-white/5 animate-pulse rounded-xl" />)}
            </div>
          ) : students.length === 0 ? (
            <div className="p-12 text-center text-foreground/50">
              No students enrolled in this course yet.
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {students.map((student: any) => (
                <div key={student.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div>
                    <p className="font-bold text-foreground">{student.name}</p>
                    <p className="text-sm text-foreground/50">{student.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStatusChange(student.id, "PRESENT")}
                      disabled={isAlreadySaved}
                      className={`px-4 py-2 rounded-xl flex items-center gap-2 font-semibold transition-all ${
                        attendanceState[student.id] === "PRESENT" 
                          ? "bg-green-500/20 text-green-500 border border-green-500/50" 
                          : "bg-white/5 text-foreground/50 hover:bg-white/10"
                      } ${isAlreadySaved ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <CheckCircle size={16} /> Present
                    </button>
                    <button
                      onClick={() => handleStatusChange(student.id, "ABSENT")}
                      disabled={isAlreadySaved}
                      className={`px-4 py-2 rounded-xl flex items-center gap-2 font-semibold transition-all ${
                        attendanceState[student.id] === "ABSENT" 
                          ? "bg-red-500/20 text-red-500 border border-red-500/50" 
                          : "bg-white/5 text-foreground/50 hover:bg-white/10"
                      } ${isAlreadySaved ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <XCircle size={16} /> Absent
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
