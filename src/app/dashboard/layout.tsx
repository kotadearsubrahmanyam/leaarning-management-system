"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { useQuery } from "@tanstack/react-query";
import { AnimatedBackground } from "@/components/ui/animated-background";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const { data: authData, isLoading } = useQuery({
    queryKey: ["authMe"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) throw new Error("Unauthorized");
      return res.json();
    },
    retry: false,
  });

  useEffect(() => {
    if (!isLoading && !authData) {
      router.push("/login");
    }
  }, [authData, isLoading, router]);

  if (isLoading || !authData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] relative overflow-hidden">
      <AnimatedBackground />
      <Sidebar 
        role={authData.data.user.role} 
        isCollapsed={isSidebarCollapsed} 
        setIsCollapsed={setIsSidebarCollapsed} 
      />
      <DashboardHeader isSidebarCollapsed={isSidebarCollapsed} />
      <main className={cn(
        "pt-8 pb-6 pr-6 md:pr-8 transition-all duration-300 relative z-10 min-h-screen",
        isSidebarCollapsed ? "pl-[104px] md:pl-[112px]" : "pl-[280px] md:pl-[288px]"
      )}>
        {children}
      </main>
    </div>
  );
}
