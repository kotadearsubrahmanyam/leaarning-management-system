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
}

export function Sidebar({ role }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
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
        { href: "/dashboard/messages", icon: MessageSquare, label: "Communication" },
      ];
    } else if (role === "TEACHER") {
      return [
        ...base, 
        { href: "/dashboard/courses", icon: BookOpen, label: "My Courses" },
        { href: "/dashboard/teacher/syllabus", icon: ClipboardList, label: "Syllabus Builder" },
        { href: "/dashboard/teacher/assignments", icon: FileEdit, label: "Assignments" },
        { href: "/dashboard/teacher/progress", icon: BarChart, label: "Student Progress" },
        { href: "/dashboard/teacher/attendance", icon: Calendar, label: "Attendance" },
        { href: "/dashboard/teacher/evaluation", icon: CheckSquare, label: "Evaluation" },
        { href: "/dashboard/teacher/certificates", icon: FileCheck, label: "Certification" },
        { href: "/dashboard/messages", icon: MessageSquare, label: "Communication" },
      ];
    } else {
      return [
        ...base, 
        { href: "/dashboard/my-courses", icon: BookOpen, label: "My Courses" },
        { href: "/dashboard/courses", icon: Compass, label: "Explore Courses" },
        { href: "/dashboard/assignments", icon: FileEdit, label: "Assignments" },
        { href: "/dashboard/attendance", icon: Calendar, label: "Attendance" },
        { href: "/dashboard/results", icon: Award, label: "Results" },
        { href: "/dashboard/certificates", icon: FileCheck, label: "Certificates" },
        { href: "/dashboard/payments", icon: CreditCard, label: "Payments" },
        { href: "/dashboard/downloads", icon: DownloadCloud, label: "Downloads" },
        { href: "/dashboard/messages", icon: MessageSquare, label: "Messages" }
      ];
    }
  };

  const links = getLinks();

  return (
    <motion.aside
      initial={{ width: 256 }}
      animate={{ width: isCollapsed ? 80 : 256 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="h-screen glass-dark border-r border-white/10 flex flex-col pt-24 pb-6 px-4 fixed left-0 top-0 z-40 bg-black/40 text-white"
    >
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-28 bg-primary text-white p-1 rounded-full shadow-lg hover:scale-110 transition-transform"
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      <div className="flex-1 space-y-2 mt-4">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link key={link.href} href={link.href}>
              <div
                className={cn(
                  "flex items-center space-x-3 p-3 rounded-xl transition-all mb-2 cursor-pointer",
                  isActive 
                    ? "bg-primary text-white shadow-[0_0_10px_rgba(153,27,27,0.5)]" 
                    : "hover:bg-white/10 text-white/70 hover:text-white"
                )}
              >
                <link.icon className="w-5 h-5 flex-shrink-0" />
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

      <div className="mt-auto border-t border-white/10 pt-4">
        <Link href="/dashboard/profile">
          <div className="flex items-center space-x-3 p-3 rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-all cursor-pointer">
            <Settings className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="font-medium">Profile</span>}
          </div>
        </Link>
        <div 
          onClick={handleLogout}
          className="flex items-center space-x-3 p-3 rounded-xl text-destructive hover:bg-destructive/10 transition-all cursor-pointer mt-1"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="font-medium">Logout</span>}
        </div>
      </div>
    </motion.aside>
  );
}
