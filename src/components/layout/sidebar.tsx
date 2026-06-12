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
  Library, Menu, X, User
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
      { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/dashboard/ai", icon: Sparkles, label: "AI Chat" },
      { href: "/dashboard/interview", icon: MessageSquare, label: "AI Interview" },
    ];
    
    if (role === "ADMIN") {
      return [
        { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
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
        { href: "/dashboard/courses", icon: BookOpen, label: "My Courses" },
        { href: "/dashboard/teacher/syllabus", icon: ClipboardList, label: "Syllabus" },
        { href: "/dashboard/teacher/assignments", icon: FileEdit, label: "Assignments" },
        { href: "/dashboard/teacher/progress", icon: BarChart, label: "Progress" },
        { href: "/dashboard/teacher/attendance", icon: Calendar, label: "Attendance" },
        { href: "/dashboard/teacher/evaluation", icon: CheckSquare, label: "Evaluation" },
        { href: "/dashboard/teacher/certificates", icon: FileCheck, label: "Certification" },
        { href: "/dashboard/community", icon: Users, label: "Community" },
      ];
    } else {
      return [
        ...base, 
        { href: "/dashboard/my-courses", icon: BookOpen, label: "My Courses" },
        { href: "/dashboard/courses", icon: Compass, label: "Explore" },
        { href: "/dashboard/assignments", icon: FileEdit, label: "Assignments" },
        { href: "/dashboard/activities", icon: Award, label: "Activities" },
        { href: "/dashboard/attendance", icon: Calendar, label: "Attendance" },
        { href: "/dashboard/results", icon: Award, label: "Results" },
        { href: "/dashboard/certificates", icon: FileCheck, label: "Certificates" },
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
        "fixed inset-y-0 left-0 z-50 flex flex-col bg-card border-r border-border transition-all duration-300",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Header */}
      <div className={cn("flex items-center border-b border-border py-4 shrink-0", isCollapsed ? "flex-col gap-4" : "justify-between px-4 h-20")}>
        {!isCollapsed && (
          <Link href="/dashboard/profile" className="flex items-center gap-3 group overflow-hidden">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20 group-hover:bg-primary/20 transition-colors shrink-0">
              <User className="h-5 w-5" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold text-foreground leading-tight truncate">My Profile</span>
              <span className="text-xs text-muted-foreground leading-tight truncate capitalize">{role ? role.toLowerCase() : "User"}</span>
            </div>
          </Link>
        )}
        {isCollapsed && (
          <Link href="/dashboard/profile" title="Profile">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20 hover:bg-primary/20 transition-colors shrink-0">
              <User className="h-5 w-5" />
            </div>
          </Link>
        )}
        <button
          onClick={() => setIsCollapsed?.(!isCollapsed)}
          className={cn(
            "p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          )}
        >
          {isCollapsed ? <Menu className="h-5 w-5 text-muted-foreground" /> : <X className="h-5 w-5 text-muted-foreground" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar py-6 flex flex-col gap-1 px-4">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-300 group",
                isActive
                  ? "bg-gradient-to-r from-primary/20 via-primary/5 to-transparent text-primary font-medium border-l-4 border-l-primary shadow-sm shadow-primary/5"
                  : "text-muted-foreground hover:bg-slate-100 hover:text-foreground dark:hover:bg-slate-800 dark:hover:text-foreground hover:translate-x-1"
              )}
              title={isCollapsed ? link.label : undefined}
            >
              <link.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
              {!isCollapsed && <span>{link.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer Logout */}
      <div className="p-4 border-t border-border flex flex-col gap-1 shrink-0">
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-300 group text-destructive hover:bg-destructive/10 hover:text-destructive hover:translate-x-1 w-full text-left"
          )}
          title={isCollapsed ? "Logout" : undefined}
        >
          <LogOut className="h-5 w-5 shrink-0 text-destructive" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
