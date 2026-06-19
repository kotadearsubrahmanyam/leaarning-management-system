import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-2xl border border-slate-200 bg-white px-[18px] py-[12px] text-sm text-slate-800 shadow-[0_4px_15px_rgba(124,58,237,0.08)] transition-all duration-300 placeholder:text-slate-400 focus-visible:outline-none focus-visible:border-purple-600 focus-visible:ring-4 focus-visible:ring-purple-600/15 disabled:cursor-not-allowed disabled:opacity-50 hover:border-purple-400 hover:-translate-y-[1px] hover:shadow-[0_6px_20px_rgba(124,58,237,0.12)]",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
