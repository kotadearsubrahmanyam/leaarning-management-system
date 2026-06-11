"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface AuthCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
}

export function AuthCard({ children, className, ...props }: AuthCardProps) {
  return (
    <div
      className={cn(
        "glass w-full max-w-md p-8 rounded-2xl relative z-10 shadow-[0_20px_50px_rgba(15,23,42,0.1),0_0_30px_rgba(16,185,129,0.06)] border border-[#E2E8F0]",
        className
      )}
      {...(props as any)}
    >
      {children}
    </div>
  );
}
