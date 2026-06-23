"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Library,
  Users,
  BookOpen,
  UserCircle,
  Search,
  X,
  Award,
  GraduationCap,
  CalendarCheck,
  TrendingUp,
} from "lucide-react";

export default function AcademicOverviewPage() {
  const [selectedDept, setSelectedDept] = useState<string>("");
  const [selectedSemester, setSelectedSemester] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);

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

  // Filter courses by search query
  const filteredCourses = useMemo(() => {
    if (!searchQuery) return courses;
    return courses.filter((course: any) =>
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [courses, searchQuery]);

  return (
    <div className="max-w-6xl mx-auto pb-12 relative z-10">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-3">
          <Library size={32} /> Academic Overview
        </h1>
        <p className="text-foreground/70">View courses, faculty assignments, and enrolled students by department and semester.</p>
      </motion.div>

      {/* Filter and Search Bar */}
      <div className="glass p-6 rounded-3xl border border-white/10 mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
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
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-2">Search Courses</label>
          <div className="flex items-center gap-3 flex-1">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black/40 border border-white/10 text-foreground/50">
              <Search className="h-5 w-5" />
            </div>
            <input
              type="text"
              placeholder="Search by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-foreground/45 text-sm"
            />
          </div>
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
                {[1, 2, 3, 4].map(i => <div key={i} className="h-32 glass rounded-3xl animate-pulse" />)}
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="p-8 text-center text-foreground/50 glass rounded-3xl border border-white/10">
                No courses found for this semester, department, and search query.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                {filteredCourses.map((course: any, i: number) => {
                  const primaryFaculty = course.faculties && course.faculties[0];
                  const facultyName = primaryFaculty ? primaryFaculty.facultyName : "Unassigned";
                  const facultyEmail = primaryFaculty ? primaryFaculty.facultyEmail : "N/A";

                  return (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }} 
                      animate={{ opacity: 1, scale: 1 }} 
                      transition={{ delay: i * 0.05 }}
                      key={course.id} 
                      onClick={() => setSelectedCourse(course)}
                      className="glass p-6 rounded-3xl border border-white/10 flex flex-col justify-between cursor-pointer hover:border-primary/40 hover:bg-white/[0.02] transition-all"
                    >
                      <div>
                        <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded mb-3 inline-block uppercase tracking-wider">
                          {course.level}
                        </span>
                        <h3 className="text-xl font-bold text-foreground mb-1">{course.title}</h3>
                        <p className="text-sm text-foreground/50 line-clamp-2 mb-4">{course.description || "No description provided."}</p>
                      </div>
                      <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                          <UserCircle size={24} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">{facultyName}</p>
                          <p className="text-xs text-foreground/50">Instructor ({facultyEmail})</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
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
                {[1, 2, 3, 4].map(i => <div key={i} className="h-12 bg-white/5 animate-pulse rounded-xl" />)}
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
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      transition={{ delay: i * 0.02 }}
                      key={student.id} 
                      className="grid grid-cols-3 p-4 items-center hover:bg-white/5 transition-colors text-sm"
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

      {/* Course Detail Modal */}
      <AnimatePresence>
        {selectedCourse && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto space-y-6 shadow-2xl relative"
            >
              {/* Header */}
              <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                <div>
                  <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[10px] font-black uppercase tracking-wider rounded">
                    {selectedCourse.level}
                  </span>
                  <h2 className="text-2xl font-black text-white mt-2 leading-tight">
                    {selectedCourse.title}
                  </h2>
                  <p className="text-xs text-slate-400 font-bold mt-1">Course ID: {selectedCourse.id}</p>
                </div>
                <button
                  onClick={() => setSelectedCourse(null)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Description</h4>
                <p className="text-sm text-slate-350 leading-relaxed">
                  {selectedCourse.description || "No description provided for this course. A comprehensive learning plan handles this curriculum module."}
                </p>
              </div>

              {/* Assigned Faculty */}
              <div>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <UserCircle size={16} className="text-purple-400" />
                  Assigned Faculty Members
                </h4>
                {selectedCourse.faculties && selectedCourse.faculties.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {selectedCourse.faculties.map((fac: any) => (
                      <div key={fac.id} className="p-3 bg-slate-950 border border-slate-850 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                        <div>
                          <p className="text-sm font-extrabold text-white">{fac.facultyName}</p>
                          <p className="text-xs text-slate-450">{fac.facultyEmail}</p>
                        </div>
                        <div className="flex gap-4 text-xs font-bold text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
                          <span>Capacity: <span className="text-white">{fac.capacity}</span></span>
                          <span className="text-slate-700">|</span>
                          <span>Enrolled: <span className="text-purple-400">{fac.enrolledCount || 0}</span></span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-450 italic">No faculty members currently assigned.</p>
                )}
              </div>

              {/* Statistics Grid */}
              <div>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <TrendingUp size={16} className="text-purple-400" />
                  Course Statistics
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-850">
                    <span className="text-[10px] font-bold text-slate-450 uppercase block">Assignments Created</span>
                    <span className="text-xl font-black text-white mt-1 block">4 Modules</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-850">
                    <span className="text-[10px] font-bold text-slate-450 uppercase block">Practice Quizzes</span>
                    <span className="text-xl font-black text-white mt-1 block">2 Quizzes</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-850">
                    <span className="text-[10px] font-bold text-slate-450 uppercase block">Avg Attendance Rate</span>
                    <span className="text-xl font-black text-emerald-400 mt-1 block">88%</span>
                  </div>
                </div>
              </div>

              {/* Close controls */}
              <div className="flex justify-end pt-4 border-t border-slate-800">
                <button
                  onClick={() => setSelectedCourse(null)}
                  className="px-5 py-2.5 bg-slate-850 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-colors"
                >
                  Close Overview
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
