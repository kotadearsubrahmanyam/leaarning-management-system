"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface AuthCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
}

export function AuthCard({ children, className, ...props }: AuthCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn(
        "glass w-full max-w-md p-8 rounded-2xl animate-float relative z-10",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
