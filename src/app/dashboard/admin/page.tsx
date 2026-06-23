"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  DollarSign, 
  Building, 
  FileCheck, 
  Clock, 
  Layers, 
  Calendar, 
  Award, 
  ShieldAlert,
  Percent,
  CheckCircle,
  FileSpreadsheet
} from "lucide-react";

function GlassMetricCard({ 
  title, 
  value, 
  icon: Icon, 
  delay = 0, 
  gradient 
}: { 
  title: string; 
  value: string | number; 
  icon: any; 
  delay?: number; 
  gradient: string 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      whileHover={{ scale: 1.03, y: -2 }}
      className="relative overflow-hidden bg-white/70 dark:bg-slate-900/40 backdrop-blur-md border border-white/40 dark:border-slate-800/40 shadow-lg rounded-3xl p-5 flex flex-col justify-between h-32 transition-all hover:shadow-[0_15px_30px_rgba(124,58,237,0.1)] group"
    >
      {/* Background glow path */}
      <div className={`absolute -right-4 -bottom-4 w-20 h-20 rounded-full blur-2xl opacity-20 bg-gradient-to-tr ${gradient}`} />
      
      <div className="flex items-center justify-between relative z-10">
        <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">
          {title}
        </span>
        <div className={`p-2 rounded-xl bg-gradient-to-tr ${gradient} text-white shadow-sm shrink-0`}>
          <Icon size={18} />
        </div>
      </div>
      
      <div className="text-3xl font-black text-slate-800 group-hover:text-primary transition-colors relative z-10">
        {value}
      </div>
    </motion.div>
  );
}

export default function AdminDashboardPage() {
  const { data: statsRes, isLoading: isStatsLoading } = useQuery({
    queryKey: ["adminStats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error("Failed to fetch admin stats");
      return res.json();
    },
  });

  const { data: evalsRes, isLoading: isEvalsLoading } = useQuery({
    queryKey: ["adminEvaluations"],
    queryFn: async () => {
      const res = await fetch("/api/admin/evaluations");
      if (!res.ok) throw new Error("Failed to fetch evaluations");
      return res.json();
    },
  });

  const isLoading = isStatsLoading || isEvalsLoading;

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto relative z-10 p-4 space-y-8">
        <div className="h-16 w-64 bg-white/20 animate-pulse rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass w-full h-32 rounded-3xl animate-pulse bg-white/20" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-96">
          <div className="glass w-full h-full rounded-3xl animate-pulse bg-white/20" />
          <div className="glass w-full h-full rounded-3xl animate-pulse bg-white/20" />
        </div>
      </div>
    );
  }

  const stats = statsRes?.data?.stats || {
    totalStudents: 0,
    totalTeachers: 0,
    totalCourses: 0,
    totalRevenue: 0,
    totalDepartments: 0,
    assignmentsSubmitted: 0,
    quizzesCompleted: 0,
    departmentStats: [],
  };

  const evaluations = evalsRes?.data || [];
  const totalEvals = evaluations.length;
  const evaluatedEvals = evaluations.filter((e: any) => e.status === "EVALUATED").length;
  const pendingEvals = totalEvals - evaluatedEvals;
  
  const evalCompletionRate = totalEvals > 0 ? Math.round((evaluatedEvals / totalEvals) * 100) : 0;
  
  const evaluatedWithMarks = evaluations.filter((e: any) => e.status === "EVALUATED" && e.marks !== null);
  const avgMarks = evaluatedWithMarks.reduce((acc: number, curr: any) => acc + curr.marks, 0) / (evaluatedWithMarks.length || 1);
  const avgMarksFormatted = evaluatedWithMarks.length > 0 ? Math.round(avgMarks) : 0;

  const quickActions = [
    {
      title: "Create Course",
      desc: "Add curriculum details",
      href: "/dashboard/admin/courses",
      icon: BookOpen,
      gradient: "from-blue-500 to-indigo-500"
    },
    {
      title: "Manage Users",
      desc: "Update roster & roles",
      href: "/dashboard/admin/users",
      icon: Users,
      gradient: "from-purple-500 to-pink-500"
    },
    {
      title: "END SEM EVALUATION",
      desc: "Assign sem end papers",
      href: "/dashboard/admin/evaluations",
      icon: FileCheck,
      gradient: "from-emerald-500 to-teal-500"
    },
    {
      title: "Timetable Editor",
      desc: "Modify daily schedules",
      href: "/dashboard/admin/timetable",
      icon: Clock,
      gradient: "from-amber-500 to-orange-500"
    },
    {
      title: "Departments",
      desc: "Configure structures",
      href: "/dashboard/admin/departments",
      icon: Layers,
      gradient: "from-indigo-500 to-violet-500"
    },
    {
      title: "Academic Calendar",
      desc: "Schedule term events",
      href: "/dashboard/academic-calendar",
      icon: Calendar,
      gradient: "from-rose-500 to-red-500"
    }
  ];

  return (
    <div className="max-w-6xl mx-auto relative z-10 space-y-10">
      
      {/* Header section with glass gradient feel */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-purple-200/50"
      >
        <div>
          <h1 className="text-4xl font-black text-primary mb-2 flex items-center gap-3">
            Admin Control Panel
          </h1>
          <p className="text-foreground/70 text-base">System Administration and Institutional Monitoring Controls</p>
        </div>
        
        <span className="mt-4 md:mt-0 text-xs bg-primary/10 text-primary font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full border border-primary/20 flex items-center gap-2 max-w-fit shadow-sm">
          <Building size={14} /> Control Hub
        </span>
      </motion.div>

      {/* Glassmorphic Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <GlassMetricCard 
          title="Departments" 
          value={stats.totalDepartments} 
          icon={Building} 
          gradient="from-purple-500 to-indigo-500"
          delay={0.05} 
        />
        <GlassMetricCard 
          title="Total Students" 
          value={stats.totalStudents} 
          icon={GraduationCap} 
          gradient="from-indigo-500 to-blue-500"
          delay={0.1} 
        />
        <GlassMetricCard 
          title="Faculty Members" 
          value={stats.totalTeachers} 
          icon={Users} 
          gradient="from-blue-500 to-sky-500"
          delay={0.15} 
        />
        <GlassMetricCard 
          title="Active Courses" 
          value={stats.totalCourses} 
          icon={BookOpen} 
          gradient="from-sky-500 to-emerald-500"
          delay={0.2} 
        />
        <GlassMetricCard 
          title="SEE Evaluations" 
          value={`${evaluatedEvals} / ${totalEvals}`} 
          icon={FileCheck} 
          gradient="from-emerald-500 to-amber-500"
          delay={0.25} 
        />
        <GlassMetricCard 
          title="Total Revenue" 
          value={`$${stats.totalRevenue.toLocaleString()}`} 
          icon={DollarSign} 
          gradient="from-amber-500 to-orange-500"
          delay={0.3} 
        />
      </div>

      {/* Restructured Quick Actions (2x3 grid of glassmorphic interactive cards) */}
      <div className="space-y-4">
        <h3 className="text-lg font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
          Quick Management Engines
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 + 0.3 }}
                whileHover={{ scale: 1.02 }}
                className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-md border border-white/40 dark:border-slate-800/40 p-5 rounded-3xl shadow-md transition-all hover:shadow-lg flex items-center gap-4 group"
              >
                <div className={`p-3 rounded-2xl bg-gradient-to-tr ${action.gradient} text-white shadow-md group-hover:scale-110 transition-transform`}>
                  <Icon size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-extrabold text-slate-800 group-hover:text-primary transition-colors truncate">
                    {action.title}
                  </h4>
                  <p className="text-xs text-slate-400 font-bold mt-0.5">{action.desc}</p>
                </div>
                <Link 
                  href={action.href}
                  className="px-3.5 py-1.5 bg-slate-50 hover:bg-primary hover:text-white border border-slate-200 hover:border-primary text-slate-600 rounded-xl text-xs font-black transition-all"
                >
                  Manage
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Main Analysis Section (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Department Roster Breakdowns */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-7 bg-white/70 dark:bg-slate-900/40 backdrop-blur-md p-6 rounded-3xl border border-white/40 dark:border-slate-800/40 shadow-xl space-y-6"
        >
          <div className="flex justify-between items-center border-b border-slate-200/50 pb-4">
            <h3 className="text-base font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Layers className="text-primary" size={20} /> Department Resource Splitting
            </h3>
            <span className="text-[10px] bg-sky-50 text-sky-600 border border-sky-100 font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
              Detailed Breakdown
            </span>
          </div>

          <div className="space-y-6">
            {stats.departmentStats?.map((dept: any, i: number) => (
              <div key={i} className="p-4 bg-white/50 border border-white/30 rounded-2xl flex flex-col gap-4">
                
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-slate-800 text-sm">{dept.name}</span>
                  <span className="text-[9px] bg-indigo-50 text-indigo-600 border border-indigo-100 font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                    {dept.courseCount} Courses active
                  </span>
                </div>

                {/* Micro Progress Bars representing ratio */}
                <div className="space-y-2">
                  {/* Students bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                      <span>Students enrolled</span>
                      <span className="font-black text-slate-700">{dept.studentCount}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-sky-500 rounded-full transition-all" 
                        style={{ width: `${Math.min(100, (dept.studentCount / (stats.totalStudents || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Teachers bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                      <span>Faculty members</span>
                      <span className="font-black text-slate-700">{dept.teacherCount}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-500 rounded-full transition-all" 
                        style={{ width: `${Math.min(100, (dept.teacherCount / (stats.totalTeachers || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Stats quick overview */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center text-xs">
                  <div>
                    <span className="text-slate-400 font-bold block uppercase text-[9px] tracking-wider">Students</span>
                    <span className="text-sm font-black text-slate-800">{dept.studentCount}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block uppercase text-[9px] tracking-wider">Faculty</span>
                    <span className="text-sm font-black text-slate-800">{dept.teacherCount}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block uppercase text-[9px] tracking-wider">Courses</span>
                    <span className="text-sm font-black text-slate-800">{dept.courseCount}</span>
                  </div>
                </div>

              </div>
            ))}
            
            {(!stats.departmentStats || stats.departmentStats.length === 0) && (
              <div className="text-slate-400 text-xs font-bold text-center py-6">
                No department distribution data available.
              </div>
            )}
          </div>
        </motion.div>
        
        {/* End-Sem Grading & System Overview */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* End-Sem Grading Overview Card */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.45 }}
            className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-md p-6 rounded-3xl border border-white/40 dark:border-slate-800/40 shadow-xl space-y-6"
          >
            <div className="flex justify-between items-center border-b border-slate-200/50 pb-4">
              <h3 className="text-base font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <FileCheck className="text-emerald-500" size={20} /> End-Sem Grading Metrics
              </h3>
              <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-100 font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
                SEE Active
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center border border-emerald-400/20 shadow-md">
                    <Percent size={18} />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-sm text-slate-800">Grading Completion</h5>
                    <p className="text-xs text-slate-400 font-bold mt-0.5">Ratio of papers evaluated</p>
                  </div>
                </div>
                <span className="text-2xl font-black text-emerald-600">{evalCompletionRate}%</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col gap-1">
                  <span className="text-slate-450 font-bold block text-[10px] uppercase tracking-wider">Evaluated Papers</span>
                  <span className="text-xl font-black text-slate-800 flex items-center gap-1.5">
                    <CheckCircle size={16} className="text-emerald-500" /> {evaluatedEvals}
                  </span>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col gap-1">
                  <span className="text-slate-450 font-bold block text-[10px] uppercase tracking-wider">Pending Papers</span>
                  <span className="text-xl font-black text-slate-800 flex items-center gap-1.5">
                    <ShieldAlert size={16} className="text-amber-500" /> {pendingEvals}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs">
                <div className="flex items-center gap-2">
                  <Award size={18} className="text-indigo-500" />
                  <span className="text-slate-550 font-bold">Average Evaluator Score</span>
                </div>
                <span className="text-sm font-black text-indigo-600">{avgMarksFormatted} / 100</span>
              </div>
            </div>
          </motion.div>
          
          {/* Institutional Activity Load Stats */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-md p-6 rounded-3xl border border-white/40 dark:border-slate-800/40 shadow-xl space-y-4"
          >
            <h3 className="text-base font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <FileSpreadsheet className="text-primary" size={20} /> Academic Load metrics
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-500 font-bold">Assignments Published</span>
                <span className="font-extrabold text-slate-800">{stats.assignmentsSubmitted} Submissions</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-500 font-bold">Total Quizzes Executed</span>
                <span className="font-extrabold text-slate-800">{stats.quizzesCompleted} Submissions</span>
              </div>
            </div>
          </motion.div>

        </div>

      </div>

    </div>
  );
}
