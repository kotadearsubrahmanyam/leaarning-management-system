"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Save, 
  Search, 
  ChevronDown, 
  BookOpen, 
  Users, 
  Check, 
  RotateCcw, 
  Percent, 
  GraduationCap, 
  Code, 
  Database, 
  Cpu, 
  RefreshCw, 
  X,
  AlertCircle,
  ClipboardList,
  Play,
  UserCheck,
  Clock
} from "lucide-react";
import { AnimatedButton } from "@/components/ui/animated-button";
import { CourseSelect } from "@/components/ui/course-select";

const COURSE_ICONS = [BookOpen, Code, Database, Cpu, GraduationCap];

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

const getAvatarColor = (name: string) => {
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colors = [
    "bg-blue-50 text-blue-600 border-blue-100",
    "bg-indigo-50 text-indigo-600 border-indigo-100",
    "bg-purple-50 text-purple-600 border-purple-100",
    "bg-pink-50 text-pink-600 border-pink-100",
    "bg-amber-50 text-amber-600 border-amber-100",
    "bg-cyan-50 text-cyan-600 border-cyan-100",
    "bg-teal-50 text-teal-600 border-teal-100",
  ];
  return colors[hash % colors.length];
};

const getCourseCode = (course: any) => {
  if (!course?.title) return "CRS-101";
  const acronym = course.title
    .split(" ")
    .filter((w: string) => w.length > 1 && !["and", "for", "the", "using", "of", "&"].includes(w.toLowerCase()))
    .map((w: string) => w[0])
    .join("")
    .toUpperCase();
  const sem = course.semester || 1;
  return `${acronym}-${sem}01`;
};

const getCourseAesthetics = (course: any) => {
  if (!course?.title) return { gradient: "from-emerald-500 to-teal-600", IconComponent: BookOpen };
  const hash = course.title.split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
  const gradients = [
    "from-emerald-500 to-teal-600",
    "from-blue-500 to-indigo-600",
    "from-purple-500 to-violet-600",
    "from-cyan-500 to-blue-600",
    "from-orange-500 to-amber-600",
  ];
  const gradient = gradients[hash % gradients.length];
  const IconComponent = COURSE_ICONS[hash % COURSE_ICONS.length];
  return { gradient, IconComponent };
};

export default function TeacherAttendancePage() {
  const queryClient = useQueryClient();
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [attendanceState, setAttendanceState] = useState<Record<string, string>>({});
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSessionStarted, setIsSessionStarted] = useState(false);

  const isLocked = useMemo(() => {
    if (!selectedDate) return false;
    const targetDate = new Date(selectedDate);
    const timeDiffMs = new Date().getTime() - targetDate.getTime();
    return timeDiffMs > 24 * 60 * 60 * 1000;
  }, [selectedDate]);

  const [selectedSession, setSelectedSession] = useState<string>("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newSessionData, setNewSessionData] = useState({
    startTime: "09:00",
    endTime: "10:00",
    sessionType: "LECTURE",
    sectionId: "CSE-A",
  });

  const { data: coursesData } = useQuery({
    queryKey: ["teacherCourses"],
    queryFn: async () => {
      const res = await fetch("/api/courses?teacherOnly=true");
      if (!res.ok) throw new Error("Failed to fetch courses");
      return res.json();
    },
  });

  const { data: sessionsData, isLoading: isSessionsLoading, refetch: refetchSessions } = useQuery({
    queryKey: ["teacherSessions", selectedCourse, selectedDate],
    queryFn: async () => {
      if (!selectedCourse || !selectedDate) return null;
      const res = await fetch(`/api/teacher/sessions?courseId=${selectedCourse}&date=${selectedDate}`);
      if (!res.ok) throw new Error("Failed to fetch sessions");
      return res.json();
    },
    enabled: !!selectedCourse && !!selectedDate,
  });

  const sessions = sessionsData?.data?.sessions || [];

  useEffect(() => {
    if (sessions.length > 0) {
      const exists = sessions.some((s: any) => s.id === selectedSession);
      if (!exists) {
        setSelectedSession(sessions[0].id);
      }
    } else {
      setSelectedSession("");
    }
  }, [sessions, selectedSession]);

  const { data: attendanceData, isLoading, refetch } = useQuery({
    queryKey: ["teacherAttendance", selectedSession],
    queryFn: async () => {
      if (!selectedSession) return null;
      const res = await fetch(`/api/teacher/attendance?sessionId=${selectedSession}`);
      if (!res.ok) throw new Error("Failed to fetch attendance");
      return res.json();
    },
    enabled: !!selectedSession,
  });

  const students = attendanceData?.data?.attendance || [];
  const courses = coursesData?.data?.courses || [];

  const currentCourseDetails = useMemo(() => {
    return courses.find((c: any) => c.id === selectedCourse);
  }, [courses, selectedCourse]);

  useEffect(() => {
    const fetchedStudents = attendanceData?.data?.attendance || [];
    if (fetchedStudents.length > 0) {
      const newState: Record<string, string> = {};
      const hasPreExistingAttendance = fetchedStudents.some((s: any) => s.status !== null);
      
      fetchedStudents.forEach((s: any) => {
        newState[s.id] = s.status || ""; 
      });
      setAttendanceState(newState);

      if (hasPreExistingAttendance) {
        setIsSessionStarted(true);
      } else {
        setIsSessionStarted(false);
      }
    } else {
      setAttendanceState({});
      setIsSessionStarted(false);
    }
  }, [attendanceData]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const total = students.length;
      const marked = Object.values(attendanceState).filter(status => status === "PRESENT" || status === "ABSENT").length;
      const remaining = total - marked;

      if (remaining > 0) {
        const confirmSave = window.confirm(
          `You still have ${remaining} students whose attendance is not marked. Do you want to continue?`
        );
        if (!confirmSave) {
          throw new Error("Save aborted by teacher to complete markings.");
        }
      }

      const records = Object.keys(attendanceState).map(userId => ({
        userId,
        status: attendanceState[userId] || null
      }));

      const res = await fetch("/api/teacher/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: selectedSession, records }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to save attendance");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacherAttendance", selectedSession] });
      alert("Attendance saved successfully!");
    },
    onError: (err: any) => {
      if (err.message !== "Save aborted by teacher to complete markings.") {
        alert(err.message);
      }
    }
  });

  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/teacher/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: selectedCourse,
          date: selectedDate,
          ...newSessionData,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create session");
      }
      return res.json();
    },
    onSuccess: (resData) => {
      queryClient.invalidateQueries({ queryKey: ["teacherSessions", selectedCourse, selectedDate] });
      setIsCreateModalOpen(false);
      if (resData?.data?.session?.id) {
        setSelectedSession(resData.data.session.id);
      }
      alert("Extra/Makeup session created successfully!");
    },
    onError: (err: any) => {
      alert(err.message);
    }
  });

  const handleStatusChange = (userId: string, status: string) => {
    setAttendanceState(prev => ({ ...prev, [userId]: status }));
  };

  const isUpdating = students.some((s: any) => s.status !== null);

  const stats = useMemo(() => {
    const total = students.length;
    const present = students.filter((s: any) => attendanceState[s.id] === "PRESENT").length;
    const absent = students.filter((s: any) => attendanceState[s.id] === "ABSENT").length;
    const marked = present + absent;
    const remaining = total - marked;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    return { total, present, absent, marked, remaining, percentage };
  }, [students, attendanceState]);

  const filteredCourses = useMemo(() => {
    if (!searchQuery) return courses;
    const q = searchQuery.toLowerCase();
    return courses.filter((c: any) => 
      c.title.toLowerCase().includes(q) || 
      getCourseCode(c).toLowerCase().includes(q)
    );
  }, [courses, searchQuery]);

  return (
    <div className="max-w-6xl mx-auto pb-16 relative z-10 px-4">
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }}
        className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <span className="p-2 bg-emerald-100 text-emerald-600 rounded-2xl shadow-sm">
              <Calendar size={28} className="stroke-[2.5]" />
            </span>
            Attendance Management
          </h1>
          <p className="text-slate-500 mt-1 text-sm md:text-base">
            Select a course and date to record and analyze student attendance.
          </p>
        </div>
      </motion.div>

      {/* Course Selection Row (Spacious Full Width) */}
      <div className="mb-6 relative z-30">
        <CourseSelect
          courses={courses}
          selectedCourse={selectedCourse}
          setSelectedCourse={(courseId) => {
            setSelectedCourse(courseId);
            setIsSessionStarted(false);
          }}
          label="Active Course Selection"
          placeholder="Choose a course to load the roster..."
          showClear={true}
          onRefresh={() => {
            refetchSessions();
          }}
        />
      </div>

      {/* Date & Session Selection Row (Side-by-Side 2-Column Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700 ml-1">
            Target Date
          </label>
          <div className="relative flex items-center bg-white border border-slate-200 rounded-2xl p-1 px-4 shadow-sm hover:border-emerald-500 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 transition-all duration-300">
            <Calendar className="w-5 h-5 text-emerald-500 mr-2 flex-shrink-0" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setIsSessionStarted(false);
              }}
              className="w-full bg-transparent py-3 text-slate-800 focus:outline-none font-semibold text-sm cursor-pointer"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center ml-1">
            <label className="block text-sm font-semibold text-slate-700">
              Class Session
            </label>
            {selectedCourse && selectedDate && (
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-bold hover:underline"
              >
                + Create Extra Class
              </button>
            )}
          </div>
          <div className="relative flex items-center bg-white border border-slate-200 rounded-2xl p-1 px-4 shadow-sm hover:border-emerald-500 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 transition-all duration-300">
            <Clock className="w-5 h-5 text-emerald-500 mr-2 flex-shrink-0" />
            <select
              value={selectedSession}
              onChange={(e) => {
                setSelectedSession(e.target.value);
                setIsSessionStarted(false);
              }}
              disabled={!selectedCourse || !selectedDate || sessions.length === 0}
              className="w-full bg-transparent py-3 text-slate-800 focus:outline-none border-none outline-none font-semibold text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
              style={{ border: "none", outline: "none", boxShadow: "none", background: "transparent" }}
            >
              {sessions.length === 0 ? (
                <option value="">No sessions found</option>
              ) : (
                sessions.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.startTime} - {s.endTime} ({s.sessionType}) - {s.sectionId}
                  </option>
                ))
              )}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 pointer-events-none" />
          </div>
        </div>
      </div>

      {selectedCourse && selectedDate ? (
        isSessionsLoading || isLoading ? (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-white animate-pulse rounded-2xl border border-slate-200" />)}
            </div>
            <div className="h-96 bg-white animate-pulse rounded-2xl border border-slate-200" />
          </div>
        ) : sessions.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-200 rounded-2xl p-16 text-center shadow-sm flex flex-col items-center justify-center gap-6 max-w-2xl mx-auto"
          >
            <div className="p-4 bg-amber-50 text-amber-500 rounded-full shadow-inner">
              <Clock size={36} className="stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-xl">No Class Sessions Found</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mt-2 leading-relaxed">
                There are no scheduled timetable classes for <span className="font-semibold text-slate-800">{currentCourseDetails?.title}</span> on this date. You can manually create an Extra class, Makeup class, or Supplementary class session to record attendance.
              </p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base rounded-2xl transition-all duration-300 shadow-lg shadow-emerald-600/20 hover:shadow-emerald-700/30 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
            >
              <Play size={18} className="fill-white stroke-none" />
              Create Class Session
            </button>
          </motion.div>
        ) : !isSessionStarted ? (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-200 rounded-2xl p-16 text-center shadow-sm flex flex-col items-center justify-center gap-6 max-w-2xl mx-auto"
          >
            <div className="p-4 bg-emerald-50 text-emerald-500 rounded-full shadow-inner">
              <UserCheck size={36} className="stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-xl">Start Attendance Session</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mt-2 leading-relaxed">
                Click below to begin manually taking attendance for the selected class session of <span className="font-semibold text-slate-800">{currentCourseDetails?.title}</span>. Students will start as "Not Marked".
              </p>
            </div>
            <button
              onClick={() => setIsSessionStarted(true)}
              className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base rounded-2xl transition-all duration-300 shadow-lg shadow-emerald-600/20 hover:shadow-emerald-700/30 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
            >
              <Play size={18} className="fill-white stroke-none" />
              Take Attendance
            </button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between overflow-hidden relative group">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Roster</span>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">{stats.total}</h3>
                  </div>
                  <div className="p-2.5 bg-blue-50 text-blue-500 rounded-xl group-hover:scale-[1.15] transition-transform duration-300">
                    <Users size={18} className="stroke-[2.5]" />
                  </div>
                  <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-blue-500/5 rounded-full blur-xl animate-pulse" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between overflow-hidden relative group">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Present Today</span>
                    <h3 className="text-2xl font-black text-emerald-600 mt-1">{stats.present}</h3>
                  </div>
                  <div className="p-2.5 bg-emerald-50 text-emerald-500 rounded-xl group-hover:scale-[1.15] transition-transform duration-300">
                    <CheckCircle size={18} className="stroke-[2.5]" />
                  </div>
                  <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-emerald-500/5 rounded-full blur-xl animate-pulse" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between overflow-hidden relative group">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Absent Today</span>
                    <h3 className="text-2xl font-black text-rose-500 mt-1">{stats.absent}</h3>
                  </div>
                  <div className="p-2.5 bg-rose-50 text-rose-500 rounded-xl group-hover:scale-[1.15] transition-transform duration-300">
                    <XCircle size={18} className="stroke-[2.5]" />
                  </div>
                  <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-rose-500/5 rounded-full blur-xl animate-pulse" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between overflow-hidden relative group">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Attendance Rate</span>
                    <h3 className="text-2xl font-black text-violet-600 mt-1">{stats.percentage}%</h3>
                  </div>
                  <div className="p-2.5 bg-violet-50 text-violet-500 rounded-xl group-hover:scale-[1.15] transition-transform duration-300">
                    <Percent size={18} className="stroke-[2.5]" />
                  </div>
                  <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-violet-500/5 rounded-full blur-xl animate-pulse" />
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                    <Percent size={16} className="text-emerald-500" />
                    Attendance Progress
                  </h3>
                  <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <span className="block text-[10px] font-semibold text-slate-400 uppercase">Total</span>
                      <span className="text-base font-bold text-slate-800">{stats.total}</span>
                    </div>
                    <div className="bg-emerald-50/50 p-2 rounded-xl border border-emerald-100">
                      <span className="block text-[10px] font-semibold text-emerald-600 uppercase">Marked</span>
                      <span className="text-base font-bold text-emerald-700">{stats.marked}</span>
                    </div>
                    <div className="bg-amber-50/50 p-2 rounded-xl border border-amber-100">
                      <span className="block text-[10px] font-semibold text-amber-600 uppercase">Remaining</span>
                      <span className="text-base font-bold text-amber-700">{stats.remaining}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
                    <span>Marking Completion</span>
                    <span className="text-emerald-600">{stats.total > 0 ? Math.round((stats.marked / stats.total) * 100) : 0}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <motion.div 
                      className="bg-emerald-500 h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${stats.total > 0 ? (stats.marked / stats.total) * 100 : 0}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden"
            >
              <div className="p-5 bg-slate-50 border-b border-slate-200/60 flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div className="flex items-center gap-2 flex-wrap order-2 md:order-1">
                  <button
                    onClick={() => {
                      const newState = { ...attendanceState };
                      students.forEach((s: any) => {
                        newState[s.id] = "PRESENT";
                      });
                      setAttendanceState(newState);
                    }}
                    className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <CheckCircle size={13} className="text-emerald-500" />
                    Mark All Present
                  </button>
                  <button
                    onClick={() => {
                      const newState = { ...attendanceState };
                      students.forEach((s: any) => {
                        newState[s.id] = "ABSENT";
                      });
                      setAttendanceState(newState);
                    }}
                    className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <XCircle size={13} className="text-rose-500" />
                    Mark All Absent
                  </button>
                  <button
                    onClick={() => {
                      const newState = { ...attendanceState };
                      students.forEach((s: any) => {
                        newState[s.id] = "";
                      });
                      setAttendanceState(newState);
                    }}
                    className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-500 border border-slate-200 hover:border-slate-300 font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <RotateCcw size={13} />
                    Clear Attendance
                  </button>
                </div>
                <div className="flex-shrink-0 order-1 md:order-2 self-start md:self-auto">
                  {!isLocked && (
                    <AnimatedButton 
                      onClick={() => saveMutation.mutate()} 
                      isLoading={saveMutation.isPending}
                      className="!py-2.5 !px-5 rounded-xl text-sm shadow-sm flex items-center justify-center gap-2"
                    >
                      <Save size={16} /> 
                      {isUpdating ? "Update Attendance" : "Save Attendance"}
                    </AnimatedButton>
                  )}
                </div>
              </div>
              
              {isLocked && (
                <div className="p-4 bg-amber-50 border-b border-amber-100 text-amber-700 text-xs sm:text-sm font-semibold flex items-center gap-2">
                  <AlertCircle size={16} className="text-amber-600 flex-shrink-0" />
                  This attendance sheet is locked. Modifications are restricted to within 24 hours of the class date.
                </div>
              )}
              
              {students.length === 0 ? (
                <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                  <Users size={36} className="stroke-[1.5] text-slate-300" />
                  <div>
                    <p className="font-semibold text-slate-700">No Students Enrolled</p>
                    <p className="text-xs text-slate-400 mt-0.5">No enrollment records exist for this course yet.</p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {students.map((student: any) => {
                    const status = attendanceState[student.id];
                    const isPresent = status === "PRESENT";
                    const isAbsent = status === "ABSENT";
                    const isUnmarked = !status;
                    const avatarColor = getAvatarColor(student.name);
                    
                    return (
                      <div 
                        key={student.id} 
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/40 transition-colors"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className={`w-11 h-11 rounded-full border flex items-center justify-center font-bold text-sm shadow-sm ${avatarColor} flex-shrink-0`}>
                            {getInitials(student.name)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm md:text-base leading-tight">
                              {student.name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-slate-400 font-semibold">
                                {student.rollNumber || "No Roll #"}
                              </span>
                              <span className="text-slate-300 text-xs">•</span>
                              <span className="text-xs text-slate-400 truncate max-w-[150px] md:max-w-none">
                                {student.email}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-6 border-t border-slate-50 pt-3 sm:pt-0 sm:border-0">
                          <div className="flex-shrink-0">
                            {isPresent && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Present
                              </span>
                            )}
                            {isAbsent && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                Absent
                              </span>
                            )}
                            {isUnmarked && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                Not Marked
                              </span>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => !isLocked && handleStatusChange(student.id, "PRESENT")}
                              disabled={isLocked}
                              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all border ${
                                isPresent 
                                  ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20" 
                                  : "bg-white text-slate-400 border-slate-200 hover:bg-slate-50 hover:text-slate-600"
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              Present
                            </button>
                            <button
                              onClick={() => !isLocked && handleStatusChange(student.id, "ABSENT")}
                              disabled={isLocked}
                              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all border ${
                                isAbsent 
                                  ? "bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-500/20" 
                                  : "bg-white text-slate-400 border-slate-200 hover:bg-slate-50 hover:text-slate-600"
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              Absent
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>
        )
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 rounded-2xl p-16 text-center shadow-sm flex flex-col items-center justify-center gap-4"
        >
          <div className="p-4 bg-emerald-50 text-emerald-500 rounded-full shadow-inner animate-pulse">
            <ClipboardList size={32} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Select Course & Date</h3>
            <p className="text-sm text-slate-400 max-w-sm mx-auto mt-1">
              Select a course from the dropdown above and verify the date to load the student roster and statistics.
            </p>
          </div>
        </motion.div>
      )}

      
    </div>
  );
}
