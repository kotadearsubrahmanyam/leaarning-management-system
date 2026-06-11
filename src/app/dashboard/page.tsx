"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { AnalyticsCard } from "@/components/ui/analytics-card";
import { ContinueLearningCard } from "@/components/dashboard/continue-learning-card";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { ChatAssistant } from "@/components/ui/ai-assistant";
import { AnimatedChart } from "@/components/dashboard/animated-chart";
import { Users, BookOpen, GraduationCap, TrendingUp, Clock, FileEdit, CheckSquare, Calendar, CreditCard } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

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

  if (!authData || isStatsLoading) {
    return (
      <div className="flex space-x-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass w-full h-32 rounded-2xl animate-pulse bg-white/20" />
        ))}
      </div>
    );
  }

  const role = authData.data.user.role;
  const stats = statsData?.data.stats || {};
  const name = authData.data.user.name;

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

  return (
    <div className="max-w-6xl mx-auto relative z-10">
      {/* Animated Soft Gradient Background */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-background/50">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-teal-500/5 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob" style={{ animationDelay: "2s" }} />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-slate-400/5 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob" style={{ animationDelay: "4s" }} />
      </div>
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
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-5">
            <AnalyticsCard title="Total Users" value={stats.totalUsers || 0} icon={<Users size={20} />} delay={0.1} />
            <AnalyticsCard title="Total Courses" value={stats.totalCourses || 0} icon={<BookOpen size={20} />} delay={0.2} />
            <AnalyticsCard title="Total Enrollments" value={stats.totalEnrollments || 0} icon={<TrendingUp size={20} />} delay={0.3} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground/80">Platform Growth</h2>
              <AnimatedChart data={stats.platformGrowth?.length ? stats.platformGrowth : emptyData} dataKey="value" type="line" delay={0.4} />
            </div>
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground/80">Enrollment Trends</h2>
              <AnimatedChart data={stats.enrollmentTrends?.length ? stats.enrollmentTrends : emptyData} dataKey="value" type="bar" delay={0.5} />
            </div>
          </div>
        </>
      )}

      {role === "TEACHER" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-5">
            <AnalyticsCard title="Courses Managed" value={stats.coursesCreated || 0} icon={<BookOpen size={20} />} delay={0.1} />
            <AnalyticsCard title="Total Students" value={stats.totalStudentsEnrolled || 0} icon={<Users size={20} />} delay={0.2} />
            <AnalyticsCard title="Total Assignments" value={stats.totalAssignments || 0} icon={<FileEdit size={20} />} delay={0.3} />
            <AnalyticsCard title="Pending Evaluations" value={stats.pendingEvaluations || 0} icon={<CheckSquare size={20} className="text-orange-500" />} delay={0.4} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground/80">Student Enrollment History</h2>
              <AnimatedChart data={stats.studentEnrollmentHistory?.length ? stats.studentEnrollmentHistory : emptyData} dataKey="value" type="line" delay={0.3} />
            </div>
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground/80">Course Popularity</h2>
              <AnimatedChart data={stats.coursePopularity?.length ? stats.coursePopularity : emptyData} dataKey="value" type="bar" delay={0.4} />
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

          {/* Timetable & Deadlines Horizontal section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Daily Schedule Card */}
            <div className="glass p-6 rounded-3xl border border-slate-300 flex flex-col justify-between hover:shadow-[0_10px_30px_rgba(0,0,0,0.05)] transition-all">
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
                  {displaySchedules.map((lecture, i) => (
                    <div key={i} className="flex gap-4 items-start p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 hover:border-slate-300 transition-colors">
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
            <div className="glass p-6 rounded-3xl border border-slate-300 flex flex-col justify-between hover:shadow-[0_10px_30px_rgba(0,0,0,0.05)] transition-all">
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
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 hover:border-primary/30 hover:border-solid hover:shadow-sm transition-all cursor-pointer" 
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

      <div className="mt-10">
        <ChatAssistant userId={authData.data.user.id} role={role} />
      </div>
    </div>
  );
}
