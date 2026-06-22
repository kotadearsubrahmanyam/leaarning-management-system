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
          "flex h-11 w-full rounded-xl border border-purple-200 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-[0_4px_10px_rgba(124,58,237,0.04)] transition-all duration-250 placeholder:text-slate-400 focus-visible:outline-none focus-visible:border-purple-500 focus-visible:ring-4 focus-visible:ring-purple-500/20 focus-visible:-translate-y-0.5 focus-visible:shadow-[0_6px_16px_rgba(124,58,237,0.1)] disabled:cursor-not-allowed disabled:opacity-50 hover:border-purple-300 hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(124,58,237,0.1)]",
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
