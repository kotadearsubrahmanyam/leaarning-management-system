"use client";

import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  User,
  Users,
  BookOpen,
  Layers,
  ShieldCheck,
  PlusCircle,
  GraduationCap,
  Award,
  FileCheck,
  Building,
  Clock,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";
import { ChangePassword } from "@/components/profile/change-password";

interface AdminProfileProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt?: string;
  };
}

export function AdminProfileView({ user }: AdminProfileProps) {
  const router = useRouter();

  // Fetch admin stats (students, teachers, courses, departments)
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["adminStats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error("Failed to fetch admin stats");
      return res.json();
    },
  });

  // Fetch payments to calculate pending approvals count
  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ["adminPayments"],
    queryFn: async () => {
      const res = await fetch("/api/admin/payments");
      if (!res.ok) return null;
      return res.json();
    },
  });

  const stats = statsData?.data?.stats || {};
  const pendingApprovalsCount = useMemo(() => {
    if (!paymentsData?.data?.payments) return 3; // Fallback demo count if not loaded
    return paymentsData.data.payments.filter((p: any) => p.status === "PENDING").length;
  }, [paymentsData]);

  // Executive details
  const derivedProfile = useMemo(() => {
    return {
      institutionName: "Excelsior Institute of Technology",
      departmentAccess: "All Departments (Super Admin)",
      lastLogin: "Today, 10:45 AM",
      accountStatus: "ACTIVE",
      joinDate: user.createdAt
        ? new Date(user.createdAt).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })
        : "January 12, 2023",
    };
  }, [user]);

  const quickActions = [
    {
      label: "Add Teacher",
      description: "Register new faculty members",
      icon: PlusCircle,
      color: "text-purple-600 bg-purple-50 hover:bg-purple-100/70 border-purple-100",
      onClick: () => router.push("/dashboard/admin/users"),
    },
    {
      label: "Add Student",
      description: "Enroll new academic students",
      icon: GraduationCap,
      color: "text-indigo-600 bg-indigo-50 hover:bg-indigo-100/70 border-indigo-100",
      onClick: () => router.push("/dashboard/admin/users"),
    },
    {
      label: "Create Department",
      description: "Configure new branches",
      icon: Layers,
      color: "text-blue-600 bg-blue-50 hover:bg-blue-100/70 border-blue-100",
      onClick: () => router.push("/dashboard/admin/departments"),
    },
    {
      label: "Publish Results",
      description: "Release semester report cards",
      icon: Award,
      color: "text-rose-600 bg-rose-50 hover:bg-rose-100/70 border-rose-100",
      onClick: () => router.push("/dashboard/results"),
    },
    {
      label: "Generate Reports",
      description: "Audit institutional performance",
      icon: FileCheck,
      color: "text-emerald-600 bg-emerald-50 hover:bg-emerald-100/70 border-emerald-100",
      onClick: () => router.push("/dashboard/admin"),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto pb-12 relative z-10">
      {/* Executive Animated Header Card */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl overflow-hidden mb-10 shadow-lg shadow-purple-500/10"
      >
        {/* Full Card Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#7C3AED] via-[#A855F7] to-indigo-600 z-0"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay z-0"></div>

        {/* Animated Glowing Orbs */}
        <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
          <motion.div
            animate={{ x: [0, 80, 0], y: [0, -30, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="absolute -top-24 -left-24 w-[400px] h-[400px] bg-purple-400 rounded-full mix-blend-screen filter blur-[100px] opacity-30"
          ></motion.div>
          <motion.div
            animate={{ x: [0, -80, 0], y: [0, 30, 0], scale: [1, 1.3, 1] }}
            transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
            className="absolute top-12 -right-24 w-[400px] h-[400px] bg-indigo-400 rounded-full mix-blend-screen filter blur-[100px] opacity-30"
          ></motion.div>
        </div>

        <div className="px-6 sm:px-12 py-10 sm:py-12 relative z-10">
          <div className="flex flex-col sm:flex-row items-center gap-8">
            {/* Avatar Container with glowing rings */}
            <div className="relative group shrink-0">
              <div className="absolute -inset-1.5 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
              <div className="relative w-32 h-32 rounded-full border-4 border-white bg-white/10 backdrop-blur-md flex items-center justify-center overflow-hidden shadow-2xl transition-transform duration-300 hover:scale-105">
                <span className="text-4xl font-black text-white drop-shadow-md">
                  {user.name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .substring(0, 2)
                    .toUpperCase()}
                </span>
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2 drop-shadow-md">
                {user.name}
              </h1>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30 text-xs font-black uppercase tracking-wider shadow-md">
                  <ShieldCheck size={14} /> System Administrator
                </span>
                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-white/95 border border-white/20 text-xs font-black uppercase tracking-wider shadow-md">
                  <Building size={14} /> {derivedProfile.institutionName}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Admin details & Quick Actions */}
        <div className="lg:col-span-1 space-y-6">
          {/* Institutional Info Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl p-6 border border-[#E5E7EB] shadow-sm space-y-6"
          >
            <h3 className="text-lg font-black text-[#111827] flex items-center gap-2 border-b border-slate-100 pb-3">
              <Building className="text-[#7C3AED]" size={20} /> Administrator Info
            </h3>

            <div className="space-y-4">
              <AdminDetail icon={User} label="Admin Username / Email" value={user.email} />
              <AdminDetail icon={Layers} label="Department Access" value={derivedProfile.departmentAccess} />
              <AdminDetail icon={Clock} label="Last Session Login" value={derivedProfile.lastLogin} />
              <AdminDetail icon={Clock} label="Account Registered On" value={derivedProfile.joinDate} />
              <div className="group p-3 rounded-2xl border border-transparent hover:border-slate-100 hover:bg-slate-50 transition-all duration-300 flex items-start gap-4">
                <div className="mt-0.5 p-2 rounded-xl bg-emerald-50 text-emerald-600 transition-colors duration-300">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Account Status</div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-extrabold text-emerald-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    {derivedProfile.accountStatus}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Active Stats Grid & Quick Actions */}
        <div className="lg:col-span-2 space-y-8">
          {/* Admin Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-3xl p-6 border border-[#E5E7EB] shadow-sm space-y-6"
          >
            <h3 className="text-lg font-black text-[#111827] flex items-center gap-2 border-b border-slate-100 pb-3">
              <TrendingUp className="text-[#7C3AED]" size={20} /> Institutional Metrics
            </h3>

            {statsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-pulse">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-24 bg-slate-100 rounded-2xl border border-slate-200" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatMetricCard label="Total Students" value={stats.totalStudents || 0} icon={Users} />
                <StatMetricCard label="Total Teachers" value={stats.totalTeachers || 0} icon={GraduationCap} />
                <StatMetricCard label="Total Courses" value={stats.totalCourses || 0} icon={BookOpen} />
                <StatMetricCard label="Active Departments" value={stats.totalDepartments || 0} icon={Layers} />
                <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] hover:border-[#7C3AED]/30 transition-all flex flex-col justify-between h-28 relative overflow-hidden group">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Pending Approvals</span>
                    <span className="text-2xl font-black text-[#111827] mt-1 block group-hover:text-[#7C3AED] transition-colors">
                      {pendingApprovalsCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] bg-rose-50 text-rose-600 font-extrabold px-2 py-0.5 rounded-full border border-rose-100">Needs Review</span>
                    <div className="p-1.5 rounded-lg bg-slate-50 text-slate-400 group-hover:bg-[#7C3AED]/10 group-hover:text-[#7C3AED] transition-colors">
                      <FileCheck size={16} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Quick Actions Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl p-6 border border-[#E5E7EB] shadow-sm space-y-6"
          >
            <h3 className="text-lg font-black text-[#111827] flex items-center gap-2 border-b border-slate-100 pb-3">
              <PlusCircle className="text-[#7C3AED]" size={20} /> Administrative Control Actions
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quickActions.map((action, idx) => {
                const Icon = action.icon;
                return (
                  <button
                    key={idx}
                    onClick={action.onClick}
                    className="p-4 rounded-2xl border border-[#E5E7EB] hover:border-purple-300 hover:shadow-md transition-all duration-300 flex items-start gap-4 text-left w-full group relative overflow-hidden bg-white"
                  >
                    <div className={`p-3 rounded-xl transition-colors duration-300 shrink-0 ${action.color}`}>
                      <Icon size={20} />
                    </div>
                    <div className="flex-1 min-w-0 pr-6">
                      <span className="text-sm font-black text-[#111827] block group-hover:text-[#7C3AED] transition-colors">
                        {action.label}
                      </span>
                      <span className="text-xs text-[#6B7280] font-medium mt-0.5 block truncate">
                        {action.description}
                      </span>
                    </div>
                    <ArrowUpRight
                      size={16}
                      className="absolute right-4 top-4 text-slate-300 group-hover:text-[#7C3AED] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
                    />
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="mt-8">
        <ChangePassword />
      </div>
    </div>
  );
}

function AdminDetail({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="group p-3 rounded-2xl border border-transparent hover:border-slate-100 hover:bg-slate-50 transition-all duration-300 flex items-start gap-4">
      <div className="mt-0.5 p-2 rounded-xl bg-slate-100 text-slate-500 group-hover:bg-purple-100 group-hover:text-[#7C3AED] transition-colors duration-300">
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">{label}</div>
        <div className="text-[#111827] font-extrabold text-[14px] truncate">{value}</div>
      </div>
    </div>
  );
}

function StatMetricCard({ label, value, icon: Icon }: { label: string; value: number | string; icon: any }) {
  return (
    <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] hover:border-[#7C3AED]/30 transition-all flex flex-col justify-between h-28 relative overflow-hidden group">
      <div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">{label}</span>
        <span className="text-2xl font-black text-[#111827] mt-1 block group-hover:text-[#7C3AED] transition-colors">
          {value}
        </span>
      </div>
      <div className="flex justify-end mt-2">
        <div className="p-1.5 rounded-lg bg-slate-50 text-slate-400 group-hover:bg-[#7C3AED]/10 group-hover:text-[#7C3AED] transition-colors">
          <Icon size={16} />
        </div>
      </div>
    </div>
  );
}
