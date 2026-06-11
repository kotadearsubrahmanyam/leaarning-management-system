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
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-primary">AI Chat</h1>
        <p className="text-foreground/70">Talk with the AI as if it were a human tutor. Ask questions about your learning path and get contextual answers.</p>
      </motion.div>

      <ChatAssistant userId={id} role={role} />
    </div>
  );
}
