"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { useQuery } from "@tanstack/react-query";
import { AnimatedBackground } from "@/components/ui/animated-background";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { useRouter } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  
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
      <div className="min-h-screen flex items-center justify-center bg-[#fff7ed]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff7ed] relative overflow-hidden">
      <AnimatedBackground />
      <Sidebar role={authData.data.user.role} />
      <DashboardHeader />
      <main className="pl-[256px] pt-24 p-8 transition-all duration-300 relative z-10 min-h-screen">
        {children}
      </main>
    </div>
  );
}
