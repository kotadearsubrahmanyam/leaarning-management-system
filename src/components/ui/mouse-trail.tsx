"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export function MouseTrail() {
  const [isVisible, setIsVisible] = useState(false);
  
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  
  const springConfig = { damping: 25, stiffness: 120, mass: 0.5 };
  const smoothX = useSpring(cursorX, springConfig);
  const smoothY = useSpring(cursorY, springConfig);

  const trailConfig = { damping: 40, stiffness: 100, mass: 1.5 };
  const trailX = useSpring(cursorX, trailConfig);
  const trailY = useSpring(cursorY, trailConfig);

  const auraConfig = { damping: 50, stiffness: 80, mass: 2.5 };
  const auraX = useSpring(cursorX, auraConfig);
  const auraY = useSpring(cursorY, auraConfig);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX - 16);
      cursorY.set(e.clientY - 16);
      if (!isVisible) setIsVisible(true);
    };

    window.addEventListener("mousemove", moveCursor);
    return () => window.removeEventListener("mousemove", moveCursor);
  }, [cursorX, cursorY, isVisible]);

  if (!isVisible) return null;

  return (
    <>
      {/* Fast glowing core */}
      <motion.div
        className="fixed top-0 left-0 w-8 h-8 rounded-full bg-primary/40 blur-md pointer-events-none z-[100]"
        style={{
          x: smoothX,
          y: smoothY,
        }}
      />
      {/* Slower trailing aura */}
      <motion.div
        className="fixed top-0 left-0 w-16 h-16 rounded-full bg-secondary/20 blur-xl pointer-events-none z-[99]"
        style={{
          x: trailX,
          y: trailY,
        }}
      />
      <motion.div
        className="fixed top-0 left-0 w-32 h-32 rounded-full bg-primary/10 blur-2xl pointer-events-none z-[98]"
        style={{
          x: auraX,
          y: auraY,
        }}
      />
    </>
  );
}
