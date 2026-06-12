"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Link from "next/link";
import { Users, GraduationCap, BookOpen, DollarSign, Building } from "lucide-react";
import { AnalyticsCard } from "@/components/ui/analytics-card";

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["adminStats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error("Failed to fetch admin stats");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass w-full h-32 rounded-3xl animate-pulse bg-white/20" />
        ))}
      </div>
    );
  }

  const stats = data?.data?.stats || {
    totalStudents: 0,
    totalTeachers: 0,
    totalCourses: 0,
    totalRevenue: 0,
    totalDepartments: 0,
    departmentStats: [],
  };

  return (
    <div className="max-w-6xl mx-auto relative z-10">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10"
      >
        <h1 className="text-4xl font-black text-primary mb-2">Admin Control Panel</h1>
        <p className="text-foreground/70 text-lg">System Overview and Key Metrics</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-12">
        <AnalyticsCard 
          title="Total Departments" 
          value={stats.totalDepartments} 
          icon={<Building size={24} className="text-purple-500" />} 
          delay={0.05} 
        />
        <AnalyticsCard 
          title="Total Students" 
          value={stats.totalStudents} 
          icon={<GraduationCap size={24} className="text-primary" />} 
          delay={0.1} 
        />
        <AnalyticsCard 
          title="Faculty Members" 
          value={stats.totalTeachers} 
          icon={<Users size={24} className="text-blue-500" />} 
          delay={0.2} 
        />
        <AnalyticsCard 
          title="Active Courses" 
          value={stats.totalCourses} 
          icon={<BookOpen size={24} className="text-green-500" />} 
          delay={0.3} 
        />
        <AnalyticsCard 
          title="Total Revenue" 
          value={`$${stats.totalRevenue.toLocaleString()}`} 
          icon={<DollarSign size={24} className="text-orange-500" />} 
          delay={0.4} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Placeholder for Quick Actions or charts */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="glass p-8 rounded-3xl border border-white/10 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10" />
          <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/dashboard/admin/courses" className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5 text-left group">
              <BookOpen className="text-primary mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold">Create Course</h3>
            </Link>
            <Link href="/dashboard/admin/users" className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5 text-left group">
              <Users className="text-primary mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold">Manage Users</h3>
            </Link>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="glass p-8 rounded-3xl border border-white/10 relative overflow-hidden"
        >
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -z-10" />
          
          <h3 className="text-lg font-bold mt-8 mb-4">Department Overview</h3>
          <div className="space-y-4">
            {stats.departmentStats?.map((dept: any, i: number) => (
              <div key={i} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex flex-col gap-3">
                <div className="font-bold text-foreground/90 border-b border-white/5 pb-2">{dept.name}</div>
                <div className="flex justify-between items-center text-sm">
                  <div className="flex flex-col items-center p-2 bg-white/5 rounded-lg flex-1 mr-2">
                    <span className="text-primary font-bold text-lg">{dept.studentCount}</span>
                    <span className="text-foreground/60 text-xs uppercase tracking-wider">Students</span>
                  </div>
                  <div className="flex flex-col items-center p-2 bg-white/5 rounded-lg flex-1 mx-1">
                    <span className="text-blue-400 font-bold text-lg">{dept.teacherCount}</span>
                    <span className="text-foreground/60 text-xs uppercase tracking-wider">Faculty</span>
                  </div>
                  <div className="flex flex-col items-center p-2 bg-white/5 rounded-lg flex-1 ml-2">
                    <span className="text-green-400 font-bold text-lg">{dept.courseCount}</span>
                    <span className="text-foreground/60 text-xs uppercase tracking-wider">Courses</span>
                  </div>
                </div>
              </div>
            ))}
            {(!stats.departmentStats || stats.departmentStats.length === 0) && (
              <div className="text-foreground/50 text-sm">No department data available.</div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
