"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { 
  BookOpen, LayoutDashboard, Users, Settings, Sparkles, LogOut, Compass, 
  DownloadCloud, CreditCard, Calendar, Award, FileEdit, Shield, Layers, 
  MessageSquare, Clock, ClipboardList, CheckSquare, BarChart, FileCheck, 
  Library, Menu, X, User, FileText, UserCircle, Mic
} from "lucide-react";

interface SidebarProps {
  role?: string;
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

export function Sidebar({ role, isCollapsed, setIsCollapsed }: SidebarProps) {
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
      { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
      { href: "/dashboard/academic-calendar", icon: Calendar, label: "Academic Calendar" },
      { href: "/dashboard/ai", icon: Sparkles, label: "AI Chat" },
      { href: "/dashboard/interview", icon: MessageSquare, label: "AI Interview" },
      { href: "/dashboard/resume-builder", icon: FileText, label: "Resume Builder" },
    ];
    
    if (role === "ADMIN") {
      return [
        { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
        { href: "/dashboard/academic-calendar", icon: Calendar, label: "Academic Calendar" },
        { href: "/dashboard/admin", icon: Shield, label: "Admin Control" },
        { href: "/dashboard/admin/academic", icon: Library, label: "Academic" },
        { href: "/dashboard/admin/users", icon: Users, label: "Users" },
        { href: "/dashboard/admin/courses", icon: BookOpen, label: "Courses" },
        { href: "/dashboard/admin/departments", icon: Layers, label: "Departments" },
        { href: "/dashboard/admin/schedules", icon: Clock, label: "Scheduling" },
        { href: "/dashboard/payments", icon: CreditCard, label: "Payments" },
        { href: "/dashboard/results", icon: Award, label: "Results" },
        { href: "/dashboard/community", icon: Users, label: "Community" },
      ];
    } else if (role === "TEACHER") {
      return [
        ...base, 
        { href: "/dashboard/teacher/students", icon: Users, label: "Students" },
        { href: "/dashboard/teacher/my-courses", icon: BookOpen, label: "My Courses" },
        { href: "/dashboard/teacher/quizzes", icon: Sparkles, label: "AI Quizzes" },
        { href: "/dashboard/teacher/assignments", icon: FileEdit, label: "Assignments" },
        { href: "/dashboard/teacher/progress", icon: BarChart, label: "Progress" },
        { href: "/dashboard/teacher/attendance", icon: Calendar, label: "Attendance" },
        { href: "/dashboard/teacher/evaluation", icon: CheckSquare, label: "Evaluation" },
        { href: "/dashboard/community", icon: Users, label: "Community" },
      ];
    } else {
      return [
        ...base, 
        { href: "/dashboard/student/quizzes", icon: Sparkles, label: "Practice Quizzes" },
        { href: "/dashboard/student/mentoring", icon: Sparkles, label: "Learning Paths" },
        { href: "/dashboard/my-courses", icon: BookOpen, label: "My Courses" },
        { href: "/dashboard/courses", icon: Compass, label: "Explore" },
        { href: "/dashboard/assignments", icon: FileEdit, label: "Assignments" },
        { href: "/dashboard/activities", icon: Award, label: "Activities" },
        { href: "/dashboard/attendance", icon: Calendar, label: "Attendance" },
        { href: "/dashboard/results", icon: Award, label: "Results" },
        { href: "/dashboard/payments", icon: CreditCard, label: "Payments" },
        { href: "/dashboard/downloads", icon: DownloadCloud, label: "Downloads" },
        { href: "/dashboard/community", icon: Users, label: "Community" }
      ];
    }
  };

  const links = getLinks();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-300",
        isCollapsed ? "w-20" : "w-64"
      )}
      style={{
        background: "linear-gradient(180deg, #6D28D9, #7C3AED)",
        borderRight: "1px solid rgba(255, 255, 255, 0.15)"
      }}
    >
      {/* Header */}
      <div className={cn("flex flex-col border-b border-purple-600/50 py-4 shrink-0 px-4")}>
        {/* Fixed Menu Button at Topmost Left */}
        <div className={cn("flex items-center justify-start", !isCollapsed && "mb-4")}>
          <button
            onClick={() => setIsCollapsed?.(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-white/[0.12] text-purple-200 hover:text-white transition-colors shrink-0"
            title="Toggle Sidebar"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Profile Section */}
        {!isCollapsed && (
          <Link href="/dashboard/profile" className="flex items-center gap-3 group overflow-hidden">
            <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white font-bold border border-white/20 group-hover:bg-white/[0.12] transition-colors shrink-0">
              <User className="h-5 w-5" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold text-white leading-tight truncate">My Profile</span>
              <span className="text-xs text-purple-200 leading-tight truncate capitalize">{role ? role.toLowerCase() : "User"}</span>
            </div>
          </Link>
        )}
        {isCollapsed && (
          <Link href="/dashboard/profile" title="Profile" className="mx-auto mt-2">
            <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white font-bold border border-white/20 hover:bg-white/[0.12] transition-colors shrink-0">
              <User className="h-5 w-5" />
            </div>
          </Link>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-6 flex flex-col gap-1 px-4">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-300 group",
                isActive
                  ? "font-bold shadow-lg"
                  : "text-purple-100/80 hover:bg-white/[0.12] hover:text-white hover:-translate-y-[2px] hover:shadow-[0_4px_15px_rgba(139,92,246,0.25)]"
              )}
              style={
                isActive
                  ? {
                      background: "#ffffff",
                      color: "#6D28D9",
                      boxShadow: "0 4px 12px rgba(109, 40, 217, 0.15)",
                      border: "1px solid rgba(139, 92, 246, 0.2)",
                    }
                  : undefined
              }
              title={isCollapsed ? link.label : undefined}
            >
              <link.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-[#6D28D9]" : "text-purple-200 group-hover:text-white")} />
              {!isCollapsed && <span>{link.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer Logout */}
      <div className="p-4 border-t border-purple-600/50 flex flex-col gap-1 shrink-0">
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-300 group text-rose-200 hover:bg-rose-500/20 hover:text-rose-100 hover:translate-x-1 w-full text-left"
          )}
          title={isCollapsed ? "Logout" : undefined}
        >
          <LogOut className="h-5 w-5 shrink-0 text-rose-300 group-hover:text-rose-100" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
