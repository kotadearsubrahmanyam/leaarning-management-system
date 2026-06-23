"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  Download, 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Info, 
  Send, 
  Calendar, 
  Clock, 
  ArrowUpDown, 
  ChevronDown, 
  GraduationCap,
  Filter,
  Mail,
  Sparkles
} from "lucide-react";
import { CourseSelect } from "@/components/ui/course-select";

export default function CourseAttendanceAnalyticsPage() {
  const queryClient = useQueryClient();
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "GOOD" | "WARNING" | "CRITICAL" | "FAILED">("ALL");
  const [sortOrder, setSortOrder] = useState<"none" | "asc" | "desc">("none");

  // Modals state
  const [historyStudent, setHistoryStudent] = useState<any>(null);
  const [warningStudent, setWarningStudent] = useState<any>(null);
  const [warningTitle, setWarningTitle] = useState("");
  const [warningMessage, setWarningMessage] = useState("");

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isGeneratingPath, setIsGeneratingPath] = useState<string | null>(null);

  const { data: studentDetailsData, isLoading: isStudentDetailsLoading, refetch: refetchStudentDetails } = useQuery({
    queryKey: ["studentDetails", selectedStudentId],
    queryFn: async () => {
      if (!selectedStudentId) return null;
      const res = await fetch(`/api/teacher/students/${selectedStudentId}`);
      if (!res.ok) throw new Error("Failed to fetch student details");
      return res.json();
    },
    enabled: !!selectedStudentId,
  });

  const studentDetails = studentDetailsData?.data?.student;

  const handleGeneratePathway = async (courseId: string) => {
    if (!selectedStudentId) return;
    setIsGeneratingPath(courseId);
    try {
      const res = await fetch("/api/teacher/mentoring/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudentId,
          courseId,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.message || "Failed to generate learning pathway");
        return;
      }
      alert("Mentoring plan and recovery learning path generated successfully!");
      refetchStudentDetails();
    } catch (e) {
      console.error(e);
      alert("An error occurred while generating learning pathway.");
    } finally {
      setIsGeneratingPath(null);
    }
  };

  const { data: coursesData } = useQuery({
    queryKey: ["teacherCourses"],
    queryFn: async () => {
      const res = await fetch("/api/courses?teacherOnly=true");
      if (!res.ok) throw new Error("Failed to fetch courses");
      return res.json();
    },
  });

  const { data: progressData, isLoading, refetch } = useQuery({
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

  const currentCourse = useMemo(() => {
    return courses.find((c: any) => c.id === selectedCourse);
  }, [courses, selectedCourse]);

  useEffect(() => {
    if (courses.length === 1 && !selectedCourse) {
      setSelectedCourse(courses[0].id);
    }
  }, [courses, selectedCourse]);

  // Set up default warning message when warning student changes
  useEffect(() => {
    if (warningStudent && currentCourse) {
      setWarningTitle(`Attendance Warning: ${currentCourse.title}`);
      setWarningMessage(
        `Dear ${warningStudent.name} (${warningStudent.rollNumber || "N/A"}),\n\n` +
        `Your current attendance in "${currentCourse.title}" is ${warningStudent.attendancePct}%. ` +
        `This has fallen below the minimum required threshold of 75% (${warningStudent.attendedClasses} out of ${warningStudent.totalClasses} classes attended).\n\n` +
        `Please make sure to attend the upcoming sessions regularly to avoid detention or exam eligibility issues.\n\n` +
        `Regards,\nCourse Faculty`
      );
    }
  }, [warningStudent, currentCourse]);

  // Mutation to send warning notification
  const sendWarningMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/teacher/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: warningStudent.id,
          title: warningTitle,
          message: warningMessage,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to send warning");
      }
      return res.json();
    },
    onSuccess: () => {
      alert(`Attendance warning successfully sent to ${warningStudent.name}!`);
      setWarningStudent(null);
    },
    onError: (err: any) => {
      alert(`Error sending warning: ${err.message}`);
    }
  });

  // Compute status helpers
  const getStatus = (pct: number) => {
    if (pct >= 75) return { label: "Good", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20", pctColor: "bg-emerald-500" };
    if (pct >= 65) return { label: "Warning", color: "text-amber-500 bg-amber-500/10 border-amber-500/20", pctColor: "bg-amber-500" };
    return { label: "Critical", color: "text-rose-500 bg-rose-500/10 border-rose-500/20", pctColor: "bg-rose-500" };
  };

  // KPI Calculations
  const metrics = useMemo(() => {
    if (students.length === 0) return { total: 0, average: 0, criticalCount: 0 };
    const total = students.length;
    const sum = students.reduce((acc: number, s: any) => acc + s.attendancePct, 0);
    const average = Math.round(sum / total);
    const criticalCount = students.filter((s: any) => s.attendancePct < 65).length;
    return { total, average, criticalCount };
  }, [students]);

  // Filter & Sort Students
  const processedStudents = useMemo(() => {
    let list = [...students];

    // Search query filter (name / rollNumber)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s: any) => 
          s.name.toLowerCase().includes(q) || 
          (s.rollNumber && s.rollNumber.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (statusFilter !== "ALL") {
      list = list.filter((s: any) => {
        if (statusFilter === "GOOD") return s.attendancePct >= 75;
        if (statusFilter === "WARNING") return s.attendancePct >= 65 && s.attendancePct < 75;
        if (statusFilter === "FAILED") return !!s.hasFailedThisSubject;
        return s.attendancePct < 65;
      });
    }

    // Sort order by attendancePct
    if (sortOrder !== "none") {
      list.sort((a: any, b: any) => {
        if (sortOrder === "asc") return a.attendancePct - b.attendancePct;
        return b.attendancePct - a.attendancePct;
      });
    }

    return list;
  }, [students, searchQuery, statusFilter, sortOrder]);

  // Export CSV Handler
  const exportToCSV = () => {
    if (processedStudents.length === 0) return;
    
    const headers = ["Student Name", "Email", "Roll Number", "Attendance Percentage", "Classes Attended", "Total Classes", "Status"];
    const rows = processedStudents.map((s: any) => {
      const statusObj = getStatus(s.attendancePct);
      return [
        s.name,
        s.email,
        s.rollNumber || "N/A",
        `${s.attendancePct}%`,
        s.attendedClasses,
        s.totalClasses,
        statusObj.label
      ];
    });

    const csvContent = 
      "data:text/csv;charset=utf-8," + 
      [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    const courseCode = currentCourse ? currentCourse.title.replace(/\s+/g, "_") : "Course";
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Attendance_Report_${courseCode}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto pb-12 relative z-10 px-4 md:px-0">
      {/* Title block */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-3">
            <Sparkles size={32} className="text-emerald-500" /> Student Analytics
          </h1>
          <p className="text-foreground/70 text-sm">
            Monitor attendance metrics, evaluate warning thresholds, view session logs, and contact critical status students.
          </p>
        </div>
      </motion.div>

      {/* Course Selection */}
      <div className="mb-8 max-w-2xl bg-white/40 backdrop-blur-md border border-slate-200 p-4 rounded-3xl shadow-sm relative z-30">
        <CourseSelect
          courses={courses}
          selectedCourse={selectedCourse}
          setSelectedCourse={setSelectedCourse}
          label="Target Course Overview"
          placeholder="Select an active course subject..."
          showClear={true}
          compact={true}
        />
      </div>

      {selectedCourse && (
        <>
          {/* KPI Dashboard Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <motion.div 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/70 backdrop-blur-md p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5"
            >
              <div className="p-3.5 bg-blue-50 text-blue-500 rounded-2xl shadow-inner">
                <Users size={28} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Enrolled</p>
                <h3 className="text-2xl font-black text-slate-800 mt-1">{metrics.total} Students</h3>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/70 backdrop-blur-md p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5"
            >
              <div className={`p-3.5 rounded-2xl shadow-inner ${
                metrics.average >= 75 ? 'bg-emerald-50 text-emerald-500' :
                metrics.average >= 65 ? 'bg-amber-50 text-amber-500' : 'bg-rose-50 text-rose-500'
              }`}>
                <GraduationCap size={28} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Average Attendance</p>
                <h3 className="text-2xl font-black text-slate-800 mt-1">{metrics.average}%</h3>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/70 backdrop-blur-md p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5"
            >
              <div className={`p-3.5 rounded-2xl shadow-inner ${
                metrics.criticalCount > 0 ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'
              }`}>
                <AlertTriangle size={28} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Critical Status</p>
                <h3 className="text-2xl font-black text-slate-800 mt-1">{metrics.criticalCount} Cases</h3>
              </div>
            </motion.div>
          </div>

          {/* Interactive Filters and Controls Row */}
          <div className="bg-white/70 backdrop-blur-md border border-slate-200 p-4 rounded-3xl shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-50 border border-slate-200 text-slate-400">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="Search student name or roll number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
              />
            </div>

            {/* Filter & Sort Controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Status Filter */}
              <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-3 py-1 text-sm font-semibold text-slate-700">
                <Filter className="w-4 h-4 text-slate-400 mr-2" />
                <select
                  value={statusFilter}
                  onChange={(e: any) => setStatusFilter(e.target.value)}
                  className="bg-transparent py-2 pr-4 focus:outline-none cursor-pointer appearance-none text-slate-700 font-semibold"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="GOOD">Good (≥75%)</option>
                  <option value="WARNING">Warning (65% - 74%)</option>
                  <option value="CRITICAL">Critical (&lt;65%)</option>
                  <option value="FAILED">Failed Students</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
              </div>

              {/* Sort Toggle */}
              <button
                onClick={() => {
                  if (sortOrder === "none") setSortOrder("asc");
                  else if (sortOrder === "asc") setSortOrder("desc");
                  else setSortOrder("none");
                }}
                className={`flex items-center gap-2 px-4 py-3 border rounded-2xl text-sm font-bold transition-all ${
                  sortOrder !== "none" 
                    ? "bg-emerald-50 border-emerald-200 text-emerald-600 shadow-sm"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <ArrowUpDown className="w-4 h-4" />
                Sort Attendance: {sortOrder === "none" ? "Default" : sortOrder === "asc" ? "Lowest First" : "Highest First"}
              </button>

              {/* Export Button */}
              <button
                onClick={exportToCSV}
                disabled={processedStudents.length === 0}
                className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl transition-all shadow-md shadow-emerald-600/10 hover:shadow-emerald-700/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>
          </div>

          {/* Roster Table */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-md border border-slate-200 rounded-3xl shadow-sm overflow-hidden mb-8"
          >
            {isLoading ? (
              <div className="p-12 space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-16 bg-slate-50 border border-slate-100 animate-pulse rounded-2xl" />
                ))}
              </div>
            ) : processedStudents.length === 0 ? (
              <div className="p-20 text-center flex flex-col items-center justify-center gap-4">
                <Info size={40} className="text-slate-400" />
                <div>
                  <h3 className="font-extrabold text-slate-800 text-lg">No Students Match Filters</h3>
                  <p className="text-sm text-slate-500 mt-1">Try refining your search keyword or changing status filters.</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-4 px-6">Student Info</th>
                      <th className="py-4 px-6">Roll Number</th>
                      <th className="py-4 px-6">Attendance Rate</th>
                      <th className="py-4 px-6 text-center">Sessions Count</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {processedStudents.map((student: any) => {
                      const status = getStatus(student.attendancePct);
                      return (
                        <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                          {/* Student Info */}
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 shadow-sm shrink-0">
                                {student.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-800 truncate">{student.name}</span>
                                  {student.hasFailedThisSubject && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-100 text-[10px] font-black uppercase tracking-wider shrink-0">
                                      Failed
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                  <Mail size={12} /> {student.email}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Roll Number */}
                          <td className="py-4 px-6 font-mono text-xs font-bold text-slate-600">
                            {student.rollNumber || (
                              <span className="text-slate-300 font-normal italic">N/A</span>
                            )}
                          </td>

                          {/* Attendance Percent + Bar */}
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3 max-w-[200px]">
                              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                                <div 
                                  className={`h-full rounded-full transition-all duration-1000 ${status.pctColor}`} 
                                  style={{ width: `${student.attendancePct}%` }}
                                />
                              </div>
                              <span className="text-sm font-black text-slate-700 min-w-[4ch] text-right">
                                {student.attendancePct}%
                              </span>
                            </div>
                          </td>

                          {/* Classes Count */}
                          <td className="py-4 px-6 text-center">
                            <span className="text-sm font-extrabold text-slate-700">
                              {student.attendedClasses}
                            </span>
                            <span className="text-xs text-slate-400 font-semibold">
                              {" "}/{" "}{student.totalClasses}
                            </span>
                          </td>

                          {/* Status Badge */}
                          <td className="py-4 px-6">
                            <span className={`inline-flex px-3 py-1 border rounded-full text-xs font-extrabold tracking-wide ${status.color}`}>
                              {status.label}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setSelectedStudentId(student.id)}
                                className="px-3.5 py-2 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-sm transition-all"
                              >
                                View Profile
                              </button>
                              
                              <button
                                onClick={() => setHistoryStudent(student)}
                                className="px-3.5 py-2 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-sm transition-all"
                              >
                                View History
                              </button>
                              
                              <button
                                onClick={() => setWarningStudent(student)}
                                disabled={student.attendancePct >= 75}
                                className={`flex items-center gap-1 px-3.5 py-2 border font-bold text-xs rounded-xl shadow-sm transition-all ${
                                  student.attendancePct >= 75 
                                    ? "bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed shadow-none"
                                    : "bg-rose-50 border-rose-200 hover:bg-rose-100/70 text-rose-600 hover:border-rose-300"
                                }`}
                              >
                                <Send size={12} /> Warning
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </>
      )}

      {/* History Log Modal */}
      <AnimatePresence>
        {historyStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setHistoryStudent(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-white border border-slate-200 w-full max-w-2xl rounded-3xl shadow-2xl relative z-10 flex flex-col max-h-[85vh] overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h3 className="text-lg font-black text-slate-800">Attendance Log History</h3>
                  <p className="text-xs text-slate-500 font-semibold mt-1">
                    Student: <span className="font-bold text-slate-700">{historyStudent.name}</span> ({historyStudent.rollNumber || "N/A"})
                  </p>
                </div>
                <button 
                  onClick={() => setHistoryStudent(null)}
                  className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-100 text-slate-500 transition-colors text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                {historyStudent.history.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <Info size={36} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-semibold">No class attendance logs recorded for this student.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {historyStudent.history.map((record: any) => (
                      <div 
                        key={record.id} 
                        className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl shadow-sm hover:border-slate-200 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-2.5 rounded-xl border ${
                            record.status === "PRESENT" 
                              ? "bg-emerald-50 text-emerald-500 border-emerald-100" 
                              : "bg-rose-50 text-rose-500 border-rose-100"
                          }`}>
                            {record.status === "PRESENT" ? <CheckCircle size={20} /> : <XCircle size={20} />}
                          </div>
                          <div>
                            <p className="font-extrabold text-sm text-slate-800">
                              {record.sessionType} Session
                            </p>
                            <div className="flex items-center gap-3 text-xs text-slate-400 font-semibold mt-0.5">
                              <span className="flex items-center gap-1">
                                <Calendar size={12} /> {new Date(record.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock size={12} /> {record.startTime} - {record.endTime}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className={`px-3 py-1 border rounded-lg text-xs font-black tracking-wide ${
                          record.status === "PRESENT" 
                            ? "bg-emerald-50 text-emerald-600 border-emerald-200" 
                            : "bg-rose-50 text-rose-600 border-rose-200"
                        }`}>
                          {record.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="p-4 bg-slate-50 border-t border-slate-100 text-right">
                <button
                  onClick={() => setHistoryStudent(null)}
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-950 text-white font-bold text-sm rounded-xl shadow-md transition-colors"
                >
                  Close Log
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Warning Dispatch Modal */}
      <AnimatePresence>
        {warningStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setWarningStudent(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-white border border-slate-200 w-full max-w-lg rounded-3xl shadow-2xl relative z-10 overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                    <Send size={18} className="text-rose-500 animate-pulse" /> Dispatch Attendance Warning
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mt-1">
                    Student receiver: <span className="font-bold text-slate-700">{warningStudent.name}</span> ({warningStudent.rollNumber || "N/A"})
                  </p>
                </div>
                <button 
                  onClick={() => setWarningStudent(null)}
                  className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-100 text-slate-500 transition-colors text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-4 flex-1">
                {/* Warning Title */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Warning Title
                  </label>
                  <input
                    type="text"
                    value={warningTitle}
                    onChange={(e) => setWarningTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                {/* Warning Message */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Custom Message
                  </label>
                  <textarea
                    rows={8}
                    value={warningMessage}
                    onChange={(e) => setWarningMessage(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 transition-colors resize-none leading-relaxed font-sans"
                  />
                </div>
              </div>
              
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  onClick={() => setWarningStudent(null)}
                  className="px-5 py-2.5 border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-sm rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => sendWarningMutation.mutate()}
                  disabled={sendWarningMutation.isPending || !warningTitle.trim() || !warningMessage.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendWarningMutation.isPending ? "Sending..." : "Dispatch Warning"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Student Profile Modal */}
      <AnimatePresence>
        {selectedStudentId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedStudentId(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-white/95 border border-slate-200 w-full max-w-3xl rounded-3xl shadow-2xl relative z-10 flex flex-col max-h-[85vh] overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                    <GraduationCap className="text-emerald-500" size={24} /> Student Profile & Performance
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mt-1">
                    Detailed academic, attendance, and activity records.
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedStudentId(null)}
                  className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-100 text-slate-500 transition-colors text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                {isStudentDetailsLoading ? (
                  <div className="py-12 space-y-4">
                    <div className="h-20 bg-slate-100 animate-pulse rounded-2xl" />
                    <div className="h-32 bg-slate-100 animate-pulse rounded-2xl" />
                    <div className="h-32 bg-slate-100 animate-pulse rounded-2xl" />
                  </div>
                ) : !studentDetails ? (
                  <div className="p-12 text-center text-slate-500">Student details not found.</div>
                ) : (
                  <>
                    {/* Header Card */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border border-emerald-500/10">
                      <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/20 flex items-center justify-center font-black text-2xl text-emerald-600 shadow-sm shrink-0">
                        {studentDetails.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 text-center sm:text-left min-w-0">
                        <h4 className="text-xl font-bold text-slate-800 truncate">{studentDetails.name}</h4>
                        <p className="text-sm font-semibold text-slate-500 mt-1 flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1">
                          <span>Roll Number: <span className="font-bold text-slate-700">{studentDetails.rollNumber || "N/A"}</span></span>
                          <span className="text-slate-300">•</span>
                          <span>Dept: <span className="font-bold text-slate-700">{studentDetails.department?.name || "N/A"}</span></span>
                          <span className="text-slate-300">•</span>
                          <span>Semester: <span className="font-bold text-slate-700">{studentDetails.semester || "N/A"}</span></span>
                        </p>
                        <p className="text-xs text-slate-400 mt-1 font-semibold flex items-center justify-center sm:justify-start gap-1">
                          <Mail size={12} /> {studentDetails.email}
                        </p>
                      </div>
                    </div>

                    {/* Academic Result for Selected Course */}
                    <div className="space-y-3">
                      <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Subject Performance & Mentoring</h5>
                      <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white">
                        {(() => {
                          const r = studentDetails.results?.find((res: any) => res.courseId === selectedCourse);
                          if (!r) {
                            return (
                              <div className="p-6 text-center text-xs text-slate-400 font-semibold">
                                No result record found for the selected subject.
                              </div>
                            );
                          }
                          return (
                            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-800 text-xs">{r.subjectName || r.course?.title || "Unknown Subject"}</span>
                                  <span className="text-[10px] font-mono text-slate-400 font-bold">({r.subjectCode || "N/A"})</span>
                                </div>
                                <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold mt-1.5">
                                  <span>Marks: {r.marks}</span>
                                  <span>•</span>
                                  <span>Grade: {r.grade}</span>
                                  <span>•</span>
                                  <span className={r.status === "FAIL" ? "text-rose-500 font-black" : "text-emerald-500 font-black"}>
                                    {r.status}
                                  </span>
                                </div>
                              </div>
                              {r.canGeneratePathway && (
                                <button
                                  onClick={() => handleGeneratePathway(r.courseId)}
                                  disabled={isGeneratingPath === r.courseId}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                                >
                                  <Sparkles size={11} className={isGeneratingPath === r.courseId ? "animate-spin" : ""} />
                                  {isGeneratingPath === r.courseId ? "Generating Pathway..." : "Generate Pathway"}
                                </button>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setSelectedStudentId(null)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm rounded-xl transition-colors shadow-sm"
                >
                  Close Profile
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
