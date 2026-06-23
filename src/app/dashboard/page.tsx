"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { AnalyticsCard } from "@/components/ui/analytics-card";
import { ContinueLearningCard } from "@/components/dashboard/continue-learning-card";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { AnimatedChart } from "@/components/dashboard/animated-chart";
import { Users, BookOpen, GraduationCap, TrendingUp, Clock, FileEdit, CheckSquare, Calendar, CreditCard, Activity, Building, Award } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area } from "recharts";
import { AdminDashboardView } from "./admin-overview";

const COLORS = ["#7C3AED", "#A855F7", "#E2E8F0"];

const assignmentCompletionData = [
  { name: "Graded", value: 65 },
  { name: "Pending", value: 20 },
  { name: "Unsubmitted", value: 15 },
];

const quizPerformanceData = [
  { name: "DBMS Quiz", score: 82 },
  { name: "Web Tech Quiz", score: 75 },
  { name: "Cloud Quiz", score: 90 },
  { name: "Dist. Systems", score: 85 },
];

const attendanceTrendsData = [
  { week: "Wk 1", attendance: 88 },
  { week: "Wk 2", attendance: 91 },
  { week: "Wk 3", attendance: 85 },
  { week: "Wk 4", attendance: 92 },
  { week: "Wk 5", attendance: 95 },
  { week: "Wk 6", attendance: 89 },
];

const ChartTooltip = ({ active, payload, label, unit }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 rounded-xl border border-slate-100 shadow-lg bg-white text-slate-800 min-w-[120px] font-sans">
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-1">{label}</p>
        <div className="flex items-center space-x-2 mt-1">
          <div className="w-2 h-2 rounded-full bg-[#7C3AED] shadow-[0_0_8px_rgba(124,58,237,0.4)]" />
          <p className="text-sm text-slate-900 font-extrabold">
            {payload[0].value}{unit || ""}
          </p>
        </div>
      </div>
    );
  }
  return null;
};

function ActivityItem({ emoji, text, time }: { emoji: string; text: string; time: string }) {
  return (
    <div className="flex gap-3 text-xs items-start">
      <span className="text-base select-none shrink-0 mt-0.5">{emoji}</span>
      <div className="flex-1">
        <p className="font-semibold text-slate-800 leading-snug">{text}</p>
        <span className="text-[10px] text-slate-400 font-bold block mt-0.5">{time}</span>
      </div>
    </div>
  );
}

function TaskItem({ type, text, time }: { type: 'eval' | 'lecture' | 'exam'; text: string; time: string }) {
  let badgeColor = "bg-purple-50 text-[#7C3AED] border-purple-100";
  let label = "Task";
  if (type === "eval") {
    badgeColor = "bg-orange-50 text-orange-600 border-orange-100";
    label = "Grading";
  } else if (type === "lecture") {
    badgeColor = "bg-blue-50 text-blue-650 border-blue-100";
    label = "Lecture";
  } else if (type === "exam") {
    badgeColor = "bg-red-50 text-red-650 border-red-100";
    label = "Exam";
  }

  return (
    <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col gap-1.5 text-xs font-sans">
      <div className="flex justify-between items-center">
        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${badgeColor}`}>
          {label}
        </span>
        <span className="text-[10px] text-slate-450 font-bold">{time}</span>
      </div>
      <p className="font-extrabold text-[#111827]">{text}</p>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: authData } = useQuery({
    queryKey: ["authMe"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) throw new Error("Unauthorized");
      return res.json();
    },
  });

  const { data: statsData, isLoading: isStatsLoading } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
    enabled: !!authData,
  });

  const { data: adminStatsData, isLoading: isAdminStatsLoading } = useQuery({
    queryKey: ["adminStatsOverview"],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error("Failed to fetch admin stats");
      return res.json();
    },
    enabled: !!authData && authData.data.user.role === "ADMIN",
  });

  const { data: continueData, isLoading: isContinueLoading } = useQuery({
    queryKey: ["continueCourse"],
    queryFn: async () => {
      const res = await fetch("/api/courses/continue");
      if (!res.ok) throw new Error("Failed to fetch continue course");
      return res.json();
    },
    enabled: !!authData && authData.data.user.role === "STUDENT",
  });

  const { data: activityData } = useQuery({
    queryKey: ["activityFeed"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/activity");
      if (!res.ok) throw new Error("Failed to fetch activity");
      return res.json();
    },
    enabled: !!authData && authData.data.user.role === "STUDENT",
  });

  const { data: schedulesData } = useQuery({
    queryKey: ["studentSchedules"],
    queryFn: async () => {
      const res = await fetch("/api/admin/schedules");
      if (!res.ok) throw new Error("Failed to fetch schedules");
      return res.json();
    },
    enabled: !!authData && authData.data.user.role === "STUDENT",
  });

  const { data: assignmentsData } = useQuery({
    queryKey: ["studentAssignments"],
    queryFn: async () => {
      const res = await fetch("/api/student/assignments");
      if (!res.ok) throw new Error("Failed to fetch assignments");
      return res.json();
    },
    enabled: !!authData && authData.data.user.role === "STUDENT",
  });

  const { data: studentResultsData } = useQuery({
    queryKey: ["studentResults"],
    queryFn: async () => {
      const res = await fetch("/api/student/results");
      if (!res.ok) throw new Error("Failed to fetch student results");
      return res.json();
    },
    enabled: !!authData && authData.data.user.role === "STUDENT",
  });

  const { data: studentPathsData } = useQuery({
    queryKey: ["studentLearningPaths"],
    queryFn: async () => {
      const res = await fetch("/api/student/learning-path");
      if (!res.ok) throw new Error("Failed to fetch learning paths");
      return res.json();
    },
    enabled: !!authData && authData.data.user.role === "STUDENT",
  });

  const { data: calendarEventsData } = useQuery({
    queryKey: ["academicCalendarEvents", authData?.data?.user?.semester],
    queryFn: async () => {
      const sem = authData?.data?.user?.semester;
      const res = await fetch(`/api/academic-calendar?category=EXAM${sem ? `&semester=${sem}` : ""}`);
      if (!res.ok) throw new Error("Failed to fetch calendar events");
      return res.json();
    },
    enabled: !!authData && authData.data.user.role === "STUDENT",
  });

  const isAdmin = authData?.data?.user?.role === "ADMIN";
  const statsLoading = isAdmin ? isAdminStatsLoading : isStatsLoading;

  if (!authData || statsLoading) {
    return (
      <div className="flex space-x-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="w-full h-32 rounded-2xl animate-pulse bg-slate-200" />
        ))}
      </div>
    );
  }

  const role = authData.data.user.role;
  const stats = statsData?.data.stats || {};
  const name = authData.data.user.name;

  // Dynamic datasets for Teacher Dashboard
  const hasRealAssignmentData = stats.assignmentCompletionData && stats.assignmentCompletionData.some((d: any) => d.value > 0);
  const displayAssignmentData = hasRealAssignmentData ? stats.assignmentCompletionData : assignmentCompletionData;
  const totalSubmissionsVal = displayAssignmentData.reduce((sum: number, d: any) => sum + d.value, 0);
  const gradedVal = displayAssignmentData.find((d: any) => d.name === "Graded")?.value || 0;
  const realCompletionRate = totalSubmissionsVal > 0 ? Math.round((gradedVal / totalSubmissionsVal) * 100) : 0;

  const displayQuizData = stats.quizPerformanceData?.length ? stats.quizPerformanceData : quizPerformanceData;
  const displayAttendanceData = stats.attendanceTrendsData?.length ? stats.attendanceTrendsData : attendanceTrendsData;

  // Fallback empty array if no data exists
  const emptyData = [{ name: "No Data", value: 0 }];

  // Find schedules for today or default to mock (moved to top-level for performance and compiler safety)
  const todayStr = new Date().toLocaleDateString();
  const todaySchedules = (schedulesData?.data?.schedules || []).filter((s: any) => {
    return new Date(s.date).toLocaleDateString() === todayStr;
  });

  const displaySchedules = todaySchedules.length > 0 
    ? todaySchedules.map((s: any) => ({
        time: s.time,
        subject: s.courseName,
        room: s.teacherName ? `Prof. ${s.teacherName}` : "Lecture Hall"
      }))
    : [
        { time: "09:00 AM - 10:30 AM", subject: "Cryptography & Security", room: "Lecture Hall 102" },
        { time: "11:30 AM - 01:00 PM", subject: "Blockchain & Applications", room: "Lab Room 3" },
        { time: "02:00 PM - 03:30 PM", subject: "Database Systems", room: "Lecture Hall 105" }
      ];

  const backlogResults = (studentResultsData?.data?.results || []).filter((r: any) => r.status === "FAIL");
  const backlogCount = backlogResults.length;

  const seeEvent = (calendarEventsData?.data?.events || []).find((e: any) =>
    e.title.toLowerCase().includes("theory") ||
    e.title.toLowerCase().includes("external") ||
    e.title.toLowerCase().includes("semester end")
  );

  let examStartDate = seeEvent ? new Date(seeEvent.startDate) : null;
  let examEndDate = seeEvent ? new Date(seeEvent.endDate) : null;

  const assignedExams = backlogResults.map((backlog: any, index: number) => {
    let examDate = "";
    if (examStartDate && examEndDate) {
      const date = new Date(examStartDate.getTime() + index * 2 * 24 * 60 * 60 * 1000);
      if (date > examEndDate) {
        examDate = examEndDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      } else {
        examDate = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      }
    } else {
      const date = new Date();
      date.setDate(date.getDate() + 15 + index * 3);
      examDate = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    }
    return {
      courseName: backlog.courseName,
      subjectCode: backlog.subjectCode,
      date: examDate,
    };
  });

  return (
    <div className="max-w-6xl mx-auto relative z-10">

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-4"
      >
        <h1 className="text-3xl font-bold text-primary">Welcome back, {name}!</h1>
        <p className="text-foreground/70">Here is what&apos;s happening with your account today.</p>
      </motion.div>

      {role === "ADMIN" && (
        <AdminDashboardView adminStats={adminStatsData?.data?.stats} />
      )}

      {role === "TEACHER" && (
        <>
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <AnalyticsCard 
              title="Courses Managed" 
              value={stats.coursesCreated || 0} 
              icon={<BookOpen size={20} className="text-[#7C3AED]" />} 
              delay={0.1} 
              className="cursor-pointer hover:border-primary transition-all duration-300"
              onClick={() => router.push("/dashboard/teacher/my-courses")} 
            />
            <AnalyticsCard 
              title="Enrolled Students" 
              value={stats.totalStudentsEnrolled || 0} 
              icon={<Users size={20} className="text-[#7C3AED]" />} 
              delay={0.15} 
              className="cursor-pointer hover:border-primary transition-all duration-300"
              onClick={() => router.push("/dashboard/teacher/students")} 
            />
            <AnalyticsCard 
              title="Assignments Created" 
              value={stats.totalAssignments || 0} 
              icon={<FileEdit size={20} className="text-[#7C3AED]" />} 
              delay={0.2} 
              className="cursor-pointer hover:border-primary transition-all duration-300"
              onClick={() => router.push("/dashboard/teacher/assignments")} 
            />
            <AnalyticsCard 
              title="Quizzes Created" 
              value={stats.totalQuizzes || 0} 
              icon={<GraduationCap size={20} className="text-[#7C3AED]" />} 
              delay={0.25} 
              className="cursor-pointer hover:border-primary transition-all duration-300"
              onClick={() => router.push("/dashboard/teacher/quizzes")} 
            />
            <AnalyticsCard 
              title="Pending Evaluations" 
              value={stats.pendingEvaluations || 0} 
              icon={<CheckSquare size={20} className={stats.pendingEvaluations > 0 ? "text-orange-505 animate-pulse" : "text-[#7C3AED]"} />} 
              delay={0.3} 
              className="cursor-pointer hover:border-primary transition-all duration-300 border-orange-100 hover:border-orange-500"
              onClick={() => router.push("/dashboard/teacher/evaluation")} 
            />
          </div>

          {/* Interactive Recharts Performance Charts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Chart 1: Assignment Completion */}
            <div className="bg-white p-5 rounded-3xl border border-[#E5E7EB] shadow-sm flex flex-col justify-between h-[360px]">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Assignment Completion</h3>
                <span className="text-[10px] bg-purple-50 text-[#7C3AED] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-purple-100">Grading</span>
              </div>
              <div className="h-[220px] flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={displayAssignmentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {displayAssignmentData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-[#111827]">{realCompletionRate}%</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Rate</span>
                </div>
              </div>
              <div className="flex justify-center gap-4 text-[10px] font-bold text-[#6B7280]">
                {displayAssignmentData.map((item: any, index: number) => (
                  <div key={index} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                    <span>{item.name} ({totalSubmissionsVal > 0 ? Math.round((item.value / totalSubmissionsVal) * 100) : 0}%)</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 2: Quiz Average Scores */}
            <div className="bg-white p-5 rounded-3xl border border-[#E5E7EB] shadow-sm flex flex-col justify-between h-[360px]">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Quiz Performance</h3>
                <span className="text-[10px] bg-purple-50 text-[#7C3AED] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-purple-100">Class Averages</span>
              </div>
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={displayQuizData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="purpleBarGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#7C3AED" />
                        <stop offset="100%" stopColor="#A855F7" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={9} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={9} tickLine={false} axisLine={false} unit="%" />
                    <Tooltip content={<ChartTooltip unit="%" />} />
                    <Bar dataKey="score" fill="url(#purpleBarGrad)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Student Attendance Trends */}
            <div className="bg-white p-5 rounded-3xl border border-[#E5E7EB] shadow-sm flex flex-col justify-between h-[360px]">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Attendance Overview</h3>
                <span className="text-[10px] bg-purple-50 text-[#7C3AED] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-purple-100">Weekly Avg</span>
              </div>
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={displayAttendanceData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="purpleAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="week" stroke="#94A3B8" fontSize={9} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={9} tickLine={false} axisLine={false} unit="%" />
                    <Tooltip content={<ChartTooltip unit="%" />} />
                    <Area type="monotone" dataKey="attendance" stroke="#7C3AED" strokeWidth={2.5} fill="url(#purpleAreaGrad)" dot={{ r: 3, fill: "#7C3AED", strokeWidth: 1.5, stroke: "#fff" }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>


        </>
      )}

      {role === "STUDENT" && (
        <>
          {/* Top Grid of 4 Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <AnalyticsCard 
              title="Overall Attendance" 
              value={`${stats.attendanceRate || 80}%`} 
              icon={<Calendar size={20} />} 
              delay={0.1} 
              className="cursor-pointer hover:border-primary transition-all duration-300"
              onClick={() => router.push("/dashboard/attendance")} 
            />
            <AnalyticsCard 
              title="Academic Performance" 
              value={`${stats.latestCgpa || "8.42"} CGPA`} 
              icon={<GraduationCap size={20} />} 
              delay={0.2} 
              className="cursor-pointer hover:border-primary transition-all duration-300"
              onClick={() => router.push("/dashboard/results")} 
            />
            <AnalyticsCard 
              title="Semester Dues" 
              value={stats.pendingFee ? `₹${stats.pendingFee.toLocaleString()}` : "₹0"} 
              icon={<CreditCard size={20} className={stats.pendingFee && stats.pendingFee > 0 ? "text-amber-500 animate-pulse" : ""} />} 
              delay={0.3} 
              className="cursor-pointer hover:border-primary transition-all duration-300"
              onClick={() => router.push("/dashboard/payments")} 
            />
            <AnalyticsCard 
              title="Active Enrolled Courses" 
              value={`${stats.totalCourses || 0} Courses`} 
              icon={<BookOpen size={20} />} 
              delay={0.4} 
              className="cursor-pointer hover:border-primary transition-all duration-300"
              onClick={() => router.push("/dashboard/courses")} 
            />
          </div>

          {/* Active Backlogs & Remedial Support Card */}
          {backlogCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="mb-8"
            >
              <div className="bg-gradient-to-br from-rose-50 to-orange-50 dark:from-slate-950 dark:to-orange-950/20 p-6 rounded-3xl border border-rose-200/60 dark:border-rose-900/30 shadow-md hover:shadow-lg transition-all">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-500 text-white animate-pulse">
                        Attention Required
                      </span>
                      <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                        {backlogCount} Active Backlog{backlogCount > 1 ? "s" : ""}
                      </span>
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-2">
                      Supplementary Exam & Remedial Support
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400/80 mt-1">
                      Complete your recovery checklists to boost your exam readiness score before the examinations.
                    </p>
                  </div>
                  <button
                    onClick={() => router.push("/dashboard/student/mentoring")}
                    className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-sm rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center gap-2 group shrink-0"
                  >
                    Open Recovery Plans
                    <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Backlog Subjects and Recovery Path Progress */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Assigned Recovery Paths
                    </h4>
                    <div className="space-y-3">
                      {backlogResults.map((backlog: any, i: number) => {
                        const path = (studentPathsData?.data?.learningPaths || []).find(
                          (p: any) => p.courseId === backlog.courseId
                        );
                        const readiness = path ? path.readinessScore : 0;

                        return (
                          <div
                            key={backlog.id || i}
                            className="bg-white dark:bg-slate-900/50 p-4 rounded-2xl border border-purple-200/80 dark:border-slate-800/85 flex flex-col justify-between gap-3 hover:border-purple-400 dark:hover:border-rose-950 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(124,58,237,0.06)] transition-all cursor-pointer"
                            onClick={() => router.push("/dashboard/student/mentoring")}
                          >
                            <div className="flex justify-between items-start">
                              <div className="min-w-0 pr-3">
                                <h5 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 truncate">
                                  {backlog.courseName}
                                </h5>
                                <p className="text-xs text-slate-400 font-bold mt-0.5">
                                  {backlog.subjectCode} • Semester {backlog.semester} Fail
                                </p>
                              </div>
                              {path ? (
                                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                  path.completionStatus === "COMPLETED"
                                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                    : "bg-amber-50 text-amber-600 border border-amber-200"
                                }`}>
                                  {path.completionStatus}
                                </span>
                              ) : (
                                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800">
                                  No Path Configured
                                </span>
                              )}
                            </div>

                            {path && (
                              <div className="space-y-1.5">
                                <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                                  <span>Readiness Score</span>
                                  <span className={readiness >= 75 ? "text-emerald-500" : "text-amber-500"}>
                                    {readiness}%
                                  </span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      readiness >= 75
                                        ? "bg-emerald-500"
                                        : readiness >= 40
                                        ? "bg-amber-500"
                                        : "bg-rose-500"
                                    }`}
                                    style={{ width: `${readiness}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Supplementary Exam Schedule */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Assigned Supplementary Exam Dates
                    </h4>
                    <div className="space-y-3">
                      {assignedExams.map((exam: any, i: number) => (
                        <div
                          key={i}
                          className="bg-white dark:bg-slate-900/50 p-4 rounded-2xl border border-purple-200/80 dark:border-slate-800/85 flex items-center justify-between hover:border-purple-400 dark:hover:border-rose-950 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(124,58,237,0.06)] transition-all"
                        >
                          <div className="min-w-0 pr-3">
                            <h5 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 truncate">
                              {exam.courseName}
                            </h5>
                            <p className="text-xs text-slate-400 font-bold mt-0.5">
                              {exam.subjectCode} • Supp. Exam
                            </p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              <span className="block text-xs font-black text-slate-800 dark:text-slate-200">
                                {exam.date}
                              </span>
                              <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                SEE Period
                              </span>
                            </div>
                            <div className="h-10 w-10 bg-rose-500/10 text-rose-500 rounded-xl flex items-center justify-center border border-rose-500/20">
                              <Calendar size={18} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Timetable & Deadlines Horizontal section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Daily Schedule Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/85 flex flex-col justify-between hover:shadow-[0_10px_30px_rgba(0,0,0,0.05)] transition-all">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                    <Calendar className="text-primary" size={20} />
                    Today's Lecture Schedule
                  </h3>
                  <span className="text-[10px] text-primary font-black uppercase tracking-wider bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full">
                    Timetable
                  </span>
                </div>
                
                <div className="space-y-3">
                  {displaySchedules.map((lecture: any, i: number) => (
                    <div key={i} className="flex gap-4 items-start p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-purple-200 hover:border-purple-400 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(124,58,237,0.06)] transition-all duration-250">
                      <div className="text-xs font-black text-primary shrink-0 bg-primary/10 px-2.5 py-1.5 rounded-lg border border-primary/20">
                        {lecture.time.split(" - ")[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-extrabold text-sm text-foreground truncate">{lecture.subject}</h4>
                        <p className="text-xs text-foreground/60 mt-0.5">{lecture.room}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Upcoming Deadlines Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/85 flex flex-col justify-between hover:shadow-[0_10px_30px_rgba(0,0,0,0.05)] transition-all">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                    <CheckSquare className="text-primary" size={20} />
                    Upcoming Assignment Deadlines
                  </h3>
                  <span className="text-[10px] text-primary font-black uppercase tracking-wider bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full">
                    Tasks
                  </span>
                </div>

                <div className="space-y-3">
                  {(assignmentsData?.data?.assignments?.length ? assignmentsData.data.assignments.slice(0, 3) : [
                    { title: "Smart Contract Vulnerability Assessment", courseName: "Blockchain Tech", daysLeft: 2 },
                    { title: "Symmetric Encryption Lab Report", courseName: "Cryptography", daysLeft: 4 },
                    { title: "DBMS SQL Joins & Schema Design", courseName: "Database Systems", daysLeft: 7 }
                  ]).map((task: any, i: number) => {
                    const daysLeft = task.daysLeft ?? Math.max(1, Math.ceil((new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
                    return (
                      <div 
                        key={i} 
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-purple-200 hover:border-purple-400 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(124,58,237,0.06)] transition-all duration-250 cursor-pointer" 
                        onClick={() => router.push("/dashboard/assignments")}
                      >
                        <div className="min-w-0 pr-4">
                          <h4 className="font-extrabold text-sm text-foreground truncate">{task.title}</h4>
                          <p className="text-xs text-foreground/60 mt-0.5">{task.courseName || "Assignments"}</p>
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-xl border shrink-0 ${
                          daysLeft <= 2 
                            ? "bg-red-500/10 text-red-500 border-red-500/20" 
                            : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        }`}>
                          {daysLeft} days left
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Charts & Activity Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <TrendingUp className="text-primary" size={24} />
                  Weekly Progress (mins)
                </h3>
                <AnimatedChart data={stats.activityHistory?.length ? stats.activityHistory : emptyData} dataKey="value" type="line" delay={0.5} unit=" mins" />
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <GraduationCap className="text-primary" size={24} />
                  Academic Performance (Grades)
                </h3>
                <AnimatedChart data={stats.subjectMarks?.length ? stats.subjectMarks : emptyData} dataKey="value" type="bar" delay={0.6} unit="/100" />
              </div>
            </div>

            <div className="lg:col-span-1">
              <ActivityFeed activities={activityData?.data?.activity || []} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
