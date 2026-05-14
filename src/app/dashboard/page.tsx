"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { AnalyticsCard } from "@/components/ui/analytics-card";
import { ContinueLearningCard } from "@/components/dashboard/continue-learning-card";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { ChatAssistant } from "@/components/ui/ai-assistant";
import { AnimatedChart } from "@/components/dashboard/animated-chart";
import { Users, BookOpen, GraduationCap, TrendingUp, Clock, FileEdit, CheckSquare } from "lucide-react";
import { motion } from "framer-motion";

export default function DashboardPage() {
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

  return (
    <div className="max-w-6xl mx-auto relative z-10">
      {/* Animated Soft Gradient Background */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-background/50">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-500/10 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob" style={{ animationDelay: "2s" }} />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-red-400/10 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob" style={{ animationDelay: "4s" }} />
      </div>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-primary">Welcome back, {name}!</h1>
        <p className="text-foreground/70">Here is what&apos;s happening with your account today.</p>
      </motion.div>

      {role === "ADMIN" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
          {continueData?.data?.continueCourse && (
            <div className="mb-10">
              <ContinueLearningCard {...continueData.data.continueCourse} />
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <AnalyticsCard title="Total Courses" value={stats.totalCourses || 0} icon={<BookOpen size={20} />} delay={0.1} />
            <AnalyticsCard title="Completed Courses" value={stats.completedCourses || 0} icon={<GraduationCap size={20} />} delay={0.2} />
            <AnalyticsCard title="Ongoing Courses" value={stats.ongoingCourses || 0} icon={<TrendingUp size={20} />} delay={0.3} />
            <AnalyticsCard title="Learning Time" value={`${stats.learningTime || 0} hrs`} icon={<Clock size={20} />} delay={0.4} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <TrendingUp className="text-primary" size={24} />
                  Weekly Progress
                </h3>
                <AnimatedChart data={stats.activityHistory?.length ? stats.activityHistory : emptyData} dataKey="value" type="line" delay={0.5} />
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <GraduationCap className="text-primary" size={24} />
                  Course Completion (%)
                </h3>
                <AnimatedChart data={stats.courseProgress?.length ? stats.courseProgress : emptyData} dataKey="value" type="bar" delay={0.6} />
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
