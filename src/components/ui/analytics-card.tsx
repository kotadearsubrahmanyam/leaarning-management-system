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
          "glass w-full p-6 rounded-2xl relative overflow-hidden transition-all hover:shadow-[0_0_20px_rgba(153,27,27,0.3)]",
          className
        )}
        {...props}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-foreground/70">{title}</h3>
          {icon && <div className="text-primary p-2 bg-primary/10 rounded-lg">{icon}</div>}
        </div>
        <div className="text-3xl font-bold text-foreground">{value}</div>
        <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
      </motion.div>
    </div>
  );
}
