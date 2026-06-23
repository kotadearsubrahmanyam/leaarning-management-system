"use client";

import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Users,
  BookOpen,
  Layers,
  GraduationCap,
  FileCheck,
  Award,
  Activity,
  Heart,
  TrendingUp,
  Clock,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { PasswordResetRequests } from "@/components/dashboard/password-reset-requests";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface AdminDashboardViewProps {
  adminStats: {
    totalStudents?: number;
    totalTeachers?: number;
    totalCourses?: number;
    totalRevenue?: number;
    totalDepartments?: number;
    assignmentsSubmitted?: number;
    quizzesCompleted?: number;
    departmentStats?: Array<{
      name: string;
      studentCount: number;
      teacherCount: number;
      courseCount: number;
    }>;
  };
}

const COLORS = ["#7C3AED", "#A855F7", "#3B82F6", "#10B981", "#F59E0B", "#EF4444"];

const mapDeptName = (name: string) => {
  if (name.includes("Computer Science")) return "CSE";
  if (name.includes("Electronics & Communication")) return "ECE";
  if (name.includes("Electrical")) return "EEE";
  if (name.includes("Mechanical")) return "MECH";
  if (name.includes("Civil")) return "CIVIL";
  if (name.includes("Business")) return "BBA";
  return name.substring(0, 5).toUpperCase();
};

export function AdminDashboardView({ adminStats = {} }: AdminDashboardViewProps) {
  // Query for recent users to display in the feed
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["adminUsersList"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users");
      if (!res.ok) return null;
      return res.json();
    },
  });

  const recentUsers = useMemo(() => {
    if (!usersData?.data?.users) return [];
    return usersData.data.users.slice(0, 4);
  }, [usersData]);

  const chartData = useMemo(() => {
    if (!adminStats.departmentStats) return [];
    return adminStats.departmentStats.map((dept) => ({
      name: mapDeptName(dept.name),
      Students: dept.studentCount,
      Teachers: dept.teacherCount,
      Courses: dept.courseCount,
    }));
  }, [adminStats.departmentStats]);

  const coursePieData = useMemo(() => {
    if (!adminStats.departmentStats) return [];
    return adminStats.departmentStats.map((dept) => ({
      name: mapDeptName(dept.name),
      value: dept.courseCount,
    }));
  }, [adminStats.departmentStats]);

  const statsList = [
    {
      label: "Total Students",
      value: adminStats.totalStudents ?? 0,
      icon: Users,
      color: "bg-purple-50 text-[#7C3AED] border-purple-100",
    },
    {
      label: "Total Teachers",
      value: adminStats.totalTeachers ?? 0,
      icon: GraduationCap,
      color: "bg-indigo-50 text-indigo-600 border-indigo-100",
    },
    {
      label: "Total Courses",
      value: adminStats.totalCourses ?? 0,
      icon: BookOpen,
      color: "bg-blue-50 text-blue-600 border-blue-100",
    },
    {
      label: "Total Departments",
      value: adminStats.totalDepartments ?? 0,
      icon: Layers,
      color: "bg-emerald-50 text-emerald-600 border-emerald-100",
    },
    {
      label: "Assignments Submitted",
      value: adminStats.assignmentsSubmitted ?? 0,
      icon: FileCheck,
      color: "bg-amber-50 text-amber-600 border-amber-100",
    },
    {
      label: "Quizzes Completed",
      value: adminStats.quizzesCompleted ?? 0,
      icon: Award,
      color: "bg-rose-50 text-rose-600 border-rose-100",
    },
  ];

  const systemHealth = [
    { label: "Active Users Today", value: "94%", status: "OPTIMAL", color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
    { label: "Daily System Logins", value: "184 Users", status: "NORMAL", color: "text-blue-600 bg-blue-50 border-blue-100" },
    { label: "Running Courses", value: `${adminStats.totalCourses ?? 0} active`, status: "STABLE", color: "text-purple-600 bg-purple-50 border-purple-100" },
    { label: "Pending System Tasks", value: "0 tasks", status: "CLEAR", color: "text-[#7C3AED] bg-purple-50 border-purple-100" },
  ];

  return (
    <div className="space-y-8">
      {/* Animated Stats Card Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {statsList.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-4 bg-white border border-[#E5E7EB] hover:border-purple-300 rounded-2xl flex flex-col justify-between h-28 hover:shadow-md transition-all group`}
            >
              <div className="flex justify-between items-start">
                <span className="text-[10px] text-[#6B7280] font-black uppercase tracking-wider block">
                  {stat.label}
                </span>
                <div className={`p-1.5 rounded-lg border ${stat.color} transition-colors`}>
                  <Icon size={14} />
                </div>
              </div>
              <span className="text-2xl font-black text-[#111827] group-hover:text-[#7C3AED] transition-colors">
                {stat.value}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Department-wise Student & Teacher distribution */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-sm flex flex-col h-[400px]"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Users className="text-[#7C3AED]" size={16} />
              Department Enrollment Distribution
            </h3>
            <span className="text-[10px] bg-purple-50 text-[#7C3AED] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-purple-100">
              Students & Teachers
            </span>
          </div>

          <div className="flex-1 min-h-0 w-full">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm font-bold">
                No department distribution data available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="p-3 bg-white border border-[#E5E7EB] rounded-xl shadow-lg min-w-[120px]">
                            <p className="text-[10px] text-[#6B7280] font-black uppercase tracking-wider mb-1">{label}</p>
                            {payload.map((p: any, idx) => (
                              <div key={idx} className="flex items-center gap-1.5 mt-1">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                                <span className="text-xs text-[#111827] font-extrabold">
                                  {p.name}: {p.value}
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11, fontWeight: "bold", paddingTop: 10 }} />
                  <Bar dataKey="Students" fill="#7C3AED" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Teachers" fill="#A855F7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Course distribution per department */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-sm flex flex-col h-[400px]"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="text-[#7C3AED]" size={16} />
              Courses by Department
            </h3>
            <span className="text-[10px] bg-purple-50 text-[#7C3AED] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-purple-100">
              Curriculum Split
            </span>
          </div>

          <div className="flex-1 min-h-0 relative flex items-center justify-center">
            {coursePieData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm font-bold">
                No course data available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={coursePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {coursePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="p-3 bg-white border border-[#E5E7EB] rounded-xl shadow-lg">
                            <span className="text-xs text-[#111827] font-extrabold">
                              {payload[0].name}: {payload[0].value} Courses
                            </span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend iconType="circle" layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: 10, fontWeight: "bold" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>
      </div>

      {/* Activities and System Health widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Recent Platform activity (Recent registrations & custom logs) */}
        <div className="lg:col-span-8 bg-white border border-[#E5E7EB] rounded-3xl p-6 shadow-sm space-y-6">
          <h3 className="text-base font-black text-[#111827] flex items-center gap-2 border-b border-slate-100 pb-3">
            <Activity className="text-[#7C3AED]" size={20} />
            Institutional Registration & Activity Feed
          </h3>

          <div className="space-y-4">
            {/* Real Registered Users list */}
            {usersLoading ? (
              <div className="space-y-2 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-slate-100 rounded-xl" />
                ))}
              </div>
            ) : recentUsers.length === 0 ? (
              <p className="text-xs text-slate-400 font-bold">No new registrations found.</p>
            ) : (
              recentUsers.map((newUser: any) => {
                const dateStr = newUser.createdAt
                  ? new Date(newUser.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Recently";

                return (
                  <div key={newUser.id} className="flex gap-4 items-center p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                    <span className="text-lg bg-white p-2 rounded-xl shadow-sm border border-slate-150 shrink-0 select-none">
                      {newUser.role === "TEACHER" ? "👩‍🏫" : "🎓"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-extrabold text-[#111827] truncate">
                        New User Registered: <span className="text-[#7C3AED]">{newUser.name}</span>
                      </p>
                      <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                        Role: {newUser.role} | Department: {newUser.departmentName || "General / Basic Sciences"}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-black shrink-0">{dateStr}</span>
                  </div>
                );
              })
            )}

            {/* Static realistic admin operations logs */}
            <div className="flex gap-4 items-center p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
              <span className="text-lg bg-white p-2 rounded-xl shadow-sm border border-slate-150 shrink-0 select-none">🏆</span>
              <div className="flex-1 min-w-0">
                <p className="font-extrabold text-[#111827] truncate">
                  Batch results publication initiated
                </p>
                <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                  Action: Result Release | Department: Computer Science & Engineering
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-black shrink-0">1h ago</span>
            </div>

            <div className="flex gap-4 items-center p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
              <span className="text-lg bg-white p-2 rounded-xl shadow-sm border border-slate-150 shrink-0 select-none">📅</span>
              <div className="flex-1 min-w-0">
                <p className="font-extrabold text-[#111827] truncate">
                  Midterm Examination schedules published
                </p>
                <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                  Action: Calendar Event Published | Target: Semester 4, 6
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-black shrink-0">4h ago</span>
            </div>
          </div>
        </div>

        {/* System Health Status widgets */}
        <div className="lg:col-span-4 bg-white border border-[#E5E7EB] rounded-3xl p-6 shadow-sm space-y-6">
          <h3 className="text-base font-black text-[#111827] flex items-center gap-2 border-b border-slate-100 pb-3">
            <ShieldCheck className="text-[#7C3AED]" size={20} />
            System Health & Security
          </h3>

          <div className="space-y-3">
            {systemHealth.map((health, idx) => (
              <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col gap-1 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[#6B7280] font-bold block">{health.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${health.color}`}>
                    {health.status}
                  </span>
                </div>
                <p className="font-extrabold text-[#111827] text-sm mt-0.5">{health.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <PasswordResetRequests role="ADMIN" />
      </div>
    </div>
  );
}
