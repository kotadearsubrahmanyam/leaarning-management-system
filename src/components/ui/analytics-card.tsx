"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnalyticsCardProps extends HTMLMotionProps<"div"> {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  delay?: number;
}

export function AnalyticsCard({ title, value, icon, delay = 0, className, ...props }: AnalyticsCardProps) {
  return (
    <div className="animate-float" style={{ animationDelay: `${delay}s` }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay, ease: "easeOut" }}
        whileHover={{ scale: 1.03 }}
        className={cn(
          "bg-white w-full p-6 rounded-2xl relative overflow-hidden border border-purple-200/80 transition-all hover:shadow-[0_15px_30px_rgba(124,58,237,0.12)] hover:-translate-y-1",
          className
        )}
        {...props}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-foreground/70">{title}</h3>
          {icon && <div className="text-white p-2 bg-gradient-to-tr from-primary to-accent rounded-xl shadow-sm">{icon}</div>}
        </div>
        <div className="text-3xl font-bold text-foreground">{value}</div>
      </motion.div>
    </div>
  );
}
