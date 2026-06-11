"use client";

import React from "react";

export function AnimatedBackground({ isDark = false }: { isDark?: boolean }) {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-[#F8FAFC]">
      <div className={`absolute top-[-20%] left-[-10%] w-[50rem] h-[50rem] rounded-full filter blur-[100px] opacity-95 animate-blob mix-blend-multiply ${
        isDark ? 'bg-emerald-500/30' : 'bg-[#10B981]/10'
      }`} />
      <div className={`absolute bottom-[-20%] right-[-10%] w-[50rem] h-[50rem] rounded-full filter blur-[100px] opacity-95 animate-blob animation-delay-2000 mix-blend-multiply ${
        isDark ? 'bg-teal-500/30' : 'bg-teal-500/10'
      }`} />
      <div className={`absolute top-[20%] left-[30%] w-[40rem] h-[40rem] rounded-full filter blur-[120px] opacity-85 animate-blob animation-delay-4000 mix-blend-multiply ${
        isDark ? 'bg-emerald-400/25' : 'bg-slate-500/5'
      }`} />
    </div>
  );
}
