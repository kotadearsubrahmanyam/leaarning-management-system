"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { 
  BookOpen, 
  LayoutDashboard, 
  Users, 
  Settings,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Compass,
  DownloadCloud,
  CreditCard,
  Calendar,
  Award,
  FileEdit,
  Shield,
  Layers,
  MessageSquare,
  Clock,
  ClipboardList,
  CheckSquare,
  BarChart,
  FileCheck,
  Library
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  role?: string;
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

export function Sidebar({ role, isCollapsed: propIsCollapsed, setIsCollapsed: propSetIsCollapsed }: SidebarProps) {
  const [localIsCollapsed, setLocalIsCollapsed] = useState(false);
  const isCollapsed = propIsCollapsed !== undefined ? propIsCollapsed : localIsCollapsed;
  const setIsCollapsed = propSetIsCollapsed !== undefined ? propSetIsCollapsed : setLocalIsCollapsed;
  
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      queryClient.clear();
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const getLinks = () => {
    const base = [
      { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/dashboard/ai", icon: Sparkles, label: "AI Chat" },
    ];
    
    if (role === "ADMIN") {
      return [
        { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
        { href: "/dashboard/admin", icon: Shield, label: "Admin Control" },
        { href: "/dashboard/admin/academic", icon: Library, label: "Academic Overview" },
        { href: "/dashboard/admin/users", icon: Users, label: "Users" },
        { href: "/dashboard/admin/courses", icon: BookOpen, label: "Courses" },
        { href: "/dashboard/admin/departments", icon: Layers, label: "Departments" },
        { href: "/dashboard/admin/schedules", icon: Clock, label: "Scheduling" },
        { href: "/dashboard/payments", icon: CreditCard, label: "Payments" },
        { href: "/dashboard/results", icon: Award, label: "Results" },
        { href: "/dashboard/community", icon: Users, label: "Community Hub" },
      ];
    } else if (role === "TEACHER") {
      return [
        ...base, 
        { href: "/dashboard/teacher/students", icon: Users, label: "Students Directory" },
        { href: "/dashboard/courses", icon: BookOpen, label: "My Courses" },
        { href: "/dashboard/teacher/syllabus", icon: ClipboardList, label: "Syllabus Builder" },
        { href: "/dashboard/teacher/assignments", icon: FileEdit, label: "Assignments" },
        { href: "/dashboard/teacher/progress", icon: BarChart, label: "Student Progress" },
        { href: "/dashboard/teacher/attendance", icon: Calendar, label: "Attendance" },
        { href: "/dashboard/teacher/evaluation", icon: CheckSquare, label: "Assignment Evaluation" },
        { href: "/dashboard/teacher/activities", icon: Award, label: "Activity Evaluation" },
        { href: "/dashboard/teacher/certificates", icon: FileCheck, label: "Certification" },
        { href: "/dashboard/community", icon: Users, label: "Community Hub" },
      ];
    } else {
      return [
        ...base, 
        { href: "/dashboard/my-courses", icon: BookOpen, label: "My Courses" },
        { href: "/dashboard/courses", icon: Compass, label: "Explore Courses" },
        { href: "/dashboard/assignments", icon: FileEdit, label: "Assignments" },
        { href: "/dashboard/activities", icon: Award, label: "Activities" },
        { href: "/dashboard/attendance", icon: Calendar, label: "Attendance" },
        { href: "/dashboard/results", icon: Award, label: "Results" },
        { href: "/dashboard/certificates", icon: FileCheck, label: "Certificates" },
        { href: "/dashboard/payments", icon: CreditCard, label: "Payments" },
        { href: "/dashboard/downloads", icon: DownloadCloud, label: "Downloads" },
        { href: "/dashboard/community", icon: Users, label: "Community Hub" }
      ];
    }
  };

  const links = getLinks();

  return (
    <motion.aside
      initial={{ width: 256 }}
      animate={{ width: isCollapsed ? 80 : 256 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="h-screen border-r border-slate-800/60 flex flex-col pt-6 pb-2 px-4 fixed left-0 top-0 z-40 bg-gradient-to-b from-[#0F172A] to-[#090d16] text-white"
    >
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-8 bg-primary text-white p-1 rounded-full shadow-lg hover:scale-110 transition-transform"
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      <div className="flex-1 space-y-0.5 mt-1.5">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link key={link.href} href={link.href}>
              <div
                className={cn(
                  "flex items-center space-x-3 p-2 px-3 rounded-xl transition-all mb-0.5 cursor-pointer border-l-4",
                  isActive 
                    ? "bg-gradient-to-r from-accent/20 to-accent/5 text-accent border-accent shadow-[0_0_20px_rgba(16,185,129,0.25)]" 
                    : "border-transparent text-slate-400 hover:text-slate-100 hover:bg-white/5"
                )}
              >
                <link.icon className={cn("w-5 h-5 flex-shrink-0 transition-all duration-300", isActive ? "text-accent drop-shadow-[0_0_6px_rgba(16,185,129,0.6)] scale-110" : "text-slate-400")} />
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="font-medium whitespace-nowrap"
                  >
                    {link.label}
                  </motion.span>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-auto border-t border-slate-800/60 pt-1.5 shrink-0 flex-shrink-0">
        <Link href="/dashboard/profile">
          <div className={cn(
            "flex items-center space-x-3 p-2 px-3 rounded-xl transition-all mb-0.5 cursor-pointer border-l-4",
            pathname === "/dashboard/profile"
              ? "bg-gradient-to-r from-accent/20 to-accent/5 text-accent border-accent shadow-[0_0_20px_rgba(16,185,129,0.25)]"
              : "border-transparent text-slate-400 hover:text-slate-100 hover:bg-white/5"
          )}>
            <Settings className={cn("w-5 h-5 flex-shrink-0 transition-all duration-300", pathname === "/dashboard/profile" ? "text-accent drop-shadow-[0_0_6px_rgba(16,185,129,0.6)] scale-110" : "text-slate-400")} />
            {!isCollapsed && <span className="font-medium">Profile</span>}
          </div>
        </Link>
        <div 
          onClick={handleLogout}
          className="flex items-center space-x-3 p-2 px-3 rounded-xl border-l-4 border-transparent text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all cursor-pointer mt-0"
        >
          <LogOut className="w-5 h-5 flex-shrink-0 text-red-400" />
          {!isCollapsed && <span className="font-medium">Logout</span>}
        </div>
      </div>
    </motion.aside>
  );
}
