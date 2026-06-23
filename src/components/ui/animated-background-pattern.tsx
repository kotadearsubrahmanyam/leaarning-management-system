"use client";

import React from "react";
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";

export function AnimatedBackgroundPattern() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <BackgroundGradientAnimation 
        interactive={false} 
        containerClassName="h-full w-full"
      />
    </div>
  );
}
