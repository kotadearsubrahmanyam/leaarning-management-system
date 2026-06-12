"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ChatAssistant } from "@/components/ui/ai-assistant";

export default function DashboardAiPage() {
  const { data: authData, isLoading } = useQuery({
    queryKey: ["authMe"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) throw new Error("Unauthorized");
      return res.json();
    },
    retry: false,
  });

  if (isLoading || !authData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  const { id, role } = authData.data.user;

  return (
    <div className="-mt-8 -mb-6 -mx-6 md:-mx-8 h-screen flex flex-col bg-background text-foreground pt-8">
      <div className="flex-1 min-h-0 w-full max-w-4xl mx-auto flex flex-col relative">
        <ChatAssistant userId={id} role={role} />
      </div>
    </div>
  );
}
