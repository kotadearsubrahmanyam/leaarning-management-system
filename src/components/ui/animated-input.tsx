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
              "flex h-12 w-full rounded-xl border border-input bg-white/50 px-3 py-2 text-sm text-foreground shadow-sm transition-all outline-none focus-within:ring-0 placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 glow-focus",
              icon && "pl-10",
              error && "border-destructive focus-within:border-destructive shadow-[0_0_10px_rgba(239,68,68,0.3)]",
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
