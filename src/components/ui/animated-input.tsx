"use client";

import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface AnimatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const AnimatedInput = forwardRef<HTMLInputElement, AnimatedInputProps>(
  ({ className, type, label, error, icon, ...props }, ref) => {
    return (
      <div className="flex flex-col space-y-1.5 w-full">
        {label && (
          <label className="text-sm font-medium text-foreground/80 ml-1">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              {icon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              "flex h-12 w-full rounded-2xl border border-slate-200 bg-white px-[18px] py-[12px] text-sm text-slate-800 shadow-[0_4px_15px_rgba(124,58,237,0.08)] transition-all duration-300 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50 hover:border-purple-400 hover:-translate-y-[1px] hover:shadow-[0_6px_20px_rgba(124,58,237,0.12)] focus:border-purple-600 focus:ring-4 focus:ring-purple-600/15 focus:-translate-y-[1px]",
              icon && "pl-11",
              error && "border-destructive focus:border-destructive shadow-[0_0_10px_rgba(239,68,68,0.3)]",
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && (
          <span className="text-xs text-destructive ml-1 animate-in fade-in slide-in-from-top-1">
            {error}
          </span>
        )}
      </div>
    );
  }
);
AnimatedInput.displayName = "AnimatedInput";
