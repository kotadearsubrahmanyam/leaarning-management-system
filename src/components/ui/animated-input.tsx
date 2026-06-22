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
              "flex h-11 w-full rounded-xl border border-purple-200 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-[0_4px_10px_rgba(124,58,237,0.04)] transition-all duration-250 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50 hover:border-purple-300 hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(124,58,237,0.1)] focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 focus:-translate-y-0.5 focus:shadow-[0_6px_16px_rgba(124,58,237,0.1)]",
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
