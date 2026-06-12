"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BarChart, TrendingUp } from "lucide-react";
import { CourseSelect } from "@/components/ui/course-select";

export default function TeacherProgressPage() {
  const [selectedCourse, setSelectedCourse] = useState<string>("");

  const { data: coursesData } = useQuery({
    queryKey: ["teacherCourses"],
    queryFn: async () => {
      const res = await fetch("/api/courses?teacherOnly=true");
      if (!res.ok) throw new Error("Failed to fetch courses");
      return res.json();
    },
  });

  const { data: progressData, isLoading } = useQuery({
    queryKey: ["teacherProgress", selectedCourse],
    queryFn: async () => {
      if (!selectedCourse) return null;
      const res = await fetch(`/api/teacher/progress?courseId=${selectedCourse}`);
      if (!res.ok) throw new Error("Failed to fetch progress");
      return res.json();
    },
    enabled: !!selectedCourse,
  });

  const students = progressData?.data?.progress || [];
  const courses = coursesData?.data?.courses || [];

  useEffect(() => {
    if (courses.length === 1 && !selectedCourse) {
      setSelectedCourse(courses[0].id);
    }
  }, [courses, selectedCourse]);

  return (
    <div className="max-w-5xl mx-auto pb-12 relative z-10">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-3">
          <BarChart size={32} /> Student Progress
        </h1>
        <p className="text-foreground/70">Monitor academic progress and attendance rates.</p>
      </motion.div>

      <div className="mb-8 max-w-2xl">
        <CourseSelect
          courses={courses}
          selectedCourse={selectedCourse}
          setSelectedCourse={setSelectedCourse}
          label="Select Course"
          placeholder="Choose a course to view progress..."
          showClear={true}
        />
      </div>

      {selectedCourse && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-3xl border border-white/10 overflow-hidden">
          <div className="grid grid-cols-4 bg-white/5 p-4 font-semibold text-foreground/80 border-b border-white/10 text-sm">
            <div className="col-span-2">Student</div>
            <div>Course Progress</div>
            <div>Attendance</div>
          </div>
          
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[1,2,3,4].map(i => <div key={i} className="h-12 bg-white/5 animate-pulse rounded-xl" />)}
            </div>
          ) : students.length === 0 ? (
            <div className="p-12 text-center text-foreground/50">
              No students enrolled in this course yet.
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {students.map((student: any) => (
                <div key={student.id} className="grid grid-cols-4 p-4 items-center hover:bg-white/5 transition-colors">
                  <div className="col-span-2 flex flex-col">
                    <span className="font-bold text-foreground">{student.name}</span>
                    <span className="text-xs text-foreground/50">{student.email}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 pr-4">
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-1000" 
                        style={{ width: `${student.progressPct}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold min-w-[3ch]">{student.progressPct}%</span>
                  </div>

                  <div className="flex items-center gap-3 pr-4">
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${
                          student.attendancePct >= 75 ? 'bg-green-500' : 
                          student.attendancePct >= 50 ? 'bg-orange-500' : 'bg-red-500'
                        }`} 
                        style={{ width: `${student.attendancePct}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold min-w-[3ch]">{student.attendancePct}%</span>
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
