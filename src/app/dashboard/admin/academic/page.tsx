"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Library, Users, BookOpen, UserCircle } from "lucide-react";

export default function AcademicOverviewPage() {
  const [selectedDept, setSelectedDept] = useState<string>("");
  const [selectedSemester, setSelectedSemester] = useState<number>(1);

  // Fetch Departments
  const { data: deptsData } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await fetch("/api/departments");
      if (!res.ok) throw new Error("Failed to fetch departments");
      return res.json();
    },
  });
  const departments = deptsData?.data?.departments || [];

  // Fetch Academic Overview based on filters
  const { data: overviewData, isLoading } = useQuery({
    queryKey: ["academicOverview", selectedDept, selectedSemester],
    queryFn: async () => {
      if (!selectedDept || !selectedSemester) return null;
      const res = await fetch(`/api/admin/academic-overview?departmentId=${selectedDept}&semester=${selectedSemester}`);
      if (!res.ok) throw new Error("Failed to fetch overview");
      return res.json();
    },
    enabled: !!selectedDept && !!selectedSemester,
  });

  const courses = overviewData?.data?.courses || [];
  const students = overviewData?.data?.students || [];

  return (
    <div className="max-w-6xl mx-auto pb-12 relative z-10">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-3">
          <Library size={32} /> Academic Overview
        </h1>
        <p className="text-foreground/70">View courses, faculty assignments, and enrolled students by department and semester.</p>
      </motion.div>

      <div className="glass p-6 rounded-3xl border border-white/10 mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-2">Select Department</label>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors appearance-none"
          >
            <option value="" disabled>-- Choose Department --</option>
            {departments.map((d: any) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-2">Select Semester</label>
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(parseInt(e.target.value))}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors appearance-none"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
              <option key={sem} value={sem}>Semester {sem}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedDept && selectedSemester && (
        <div className="space-y-8">
          {/* Courses & Faculty Section */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
              <BookOpen size={24} className="text-primary" /> Active Courses & Faculty
            </h2>
            
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1,2,3,4].map(i => <div key={i} className="h-32 glass rounded-3xl animate-pulse" />)}
              </div>
            ) : courses.length === 0 ? (
              <div className="p-8 text-center text-foreground/50 glass rounded-3xl border border-white/10">
                No courses found for this semester and department.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                {courses.map((course: any, i: number) => (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
                    key={course.id} className="glass p-6 rounded-3xl border border-white/10 flex flex-col justify-between"
                  >
                    <div>
                      <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-bold rounded mb-3 inline-block">
                        {course.level}
                      </span>
                      <h3 className="text-xl font-bold text-foreground mb-1">{course.title}</h3>
                      <p className="text-sm text-foreground/50 line-clamp-2 mb-4">{course.description}</p>
                    </div>
                    <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                        <UserCircle size={24} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">{course.facultyName}</p>
                        <p className="text-xs text-foreground/50">Instructor ({course.facultyEmail})</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Student Roster Section */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Users size={24} className="text-primary" /> Enrolled Students ({students.length})
            </h2>
            
            {isLoading ? (
              <div className="p-4 space-y-4 glass rounded-3xl">
                {[1,2,3,4].map(i => <div key={i} className="h-12 bg-white/5 animate-pulse rounded-xl" />)}
              </div>
            ) : students.length === 0 ? (
              <div className="p-8 text-center text-foreground/50 glass rounded-3xl border border-white/10">
                No students enrolled in this batch yet.
              </div>
            ) : (
              <div className="glass rounded-3xl border border-white/10 overflow-hidden">
                <div className="grid grid-cols-3 bg-white/5 p-4 font-semibold text-foreground/80 border-b border-white/10 text-sm">
                  <div>Roll Number</div>
                  <div>Student Name</div>
                  <div>Email Address</div>
                </div>
                <div className="divide-y divide-white/5 max-h-[60vh] overflow-y-auto">
                  {students.map((student: any, i: number) => (
                    <motion.div 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                      key={student.id} className="grid grid-cols-3 p-4 items-center hover:bg-white/5 transition-colors text-sm"
                    >
                      <div className="font-bold text-primary uppercase tracking-wider">{student.rollNumber || 'N/A'}</div>
                      <div className="font-semibold text-foreground">{student.name}</div>
                      <div className="text-foreground/70">{student.email}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
