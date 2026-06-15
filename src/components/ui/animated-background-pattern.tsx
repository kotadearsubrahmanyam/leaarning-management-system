"use client";

import React from "react";

const PARTICLES = [
  { left: "10%", top: "15%", size: "3px", color: "#8B5CF6", duration: "16s", delay: "2s" },
  { left: "25%", top: "45%", size: "4px", color: "#3B82F6", duration: "22s", delay: "0s" },
  { left: "40%", top: "85%", size: "2px", color: "#8B5CF6", duration: "18s", delay: "4s" },
  { left: "55%", top: "25%", size: "5px", color: "#3B82F6", duration: "25s", delay: "1s" },
  { left: "70%", top: "65%", size: "3px", color: "#A855F7", duration: "20s", delay: "3s" },
  { left: "85%", top: "10%", size: "4px", color: "#3B82F6", duration: "15s", delay: "5s" },
  { left: "90%", top: "50%", size: "3px", color: "#8B5CF6", duration: "24s", delay: "2s" },
  { left: "15%", top: "75%", size: "2px", color: "#3B82F6", duration: "19s", delay: "6s" },
  { left: "30%", top: "20%", size: "5px", color: "#A855F7", duration: "21s", delay: "1s" },
  { left: "50%", top: "60%", size: "3px", color: "#8B5CF6", duration: "23s", delay: "0s" },
  { left: "65%", top: "90%", size: "4px", color: "#3B82F6", duration: "17s", delay: "3s" },
  { left: "80%", top: "35%", size: "2px", color: "#8B5CF6", duration: "26s", delay: "2s" },
  { left: "95%", top: "80%", size: "5px", color: "#3B82F6", duration: "20s", delay: "5s" },
  { left: "5%", top: "40%", size: "3px", color: "#A855F7", duration: "18s", delay: "4s" },
  { left: "35%", top: "70%", size: "4px", color: "#8B5CF6", duration: "22s", delay: "1s" },
  { left: "60%", top: "15%", size: "3px", color: "#3B82F6", duration: "25s", delay: "3s" },
  { left: "75%", top: "55%", size: "2px", color: "#8B5CF6", duration: "16s", delay: "0s" },
  { left: "45%", top: "30%", size: "4px", color: "#A855F7", duration: "24s", delay: "2s" },
  { left: "20%", top: "95%", size: "3px", color: "#3B82F6", duration: "20s", delay: "5s" },
  { left: "88%", top: "95%", size: "3px", color: "#8B5CF6", duration: "19s", delay: "1s" },
];

export function AnimatedBackgroundPattern() {
  return (
    <div 
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none"
      style={{
        background: "linear-gradient(135deg, #DBEAFE 0%, #EDE9FE 50%, #F8FAFC 100%)"
      }}
    >
      {/* 1. Top Left Glow (#8B5CF6, Opacity 10%, Blur 120px) */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#8B5CF6]/10 blur-[120px] animate-float-blob-1 pointer-events-none" />
      
      {/* 2. Center Glow (#3B82F6, Opacity 8%, Blur 150px) */}
      <div className="absolute top-[25%] left-[25%] md:left-[30%] w-[50vw] h-[50vw] rounded-full bg-[#3B82F6]/0.08 blur-[150px] animate-float-blob-2 pointer-events-none" />
      
      {/* 3. Bottom Right Glow (#A855F7, Opacity 10%, Blur 130px) */}
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#A855F7]/10 blur-[130px] animate-float-blob-3 pointer-events-none" />

      {/* 4. Shining Particle Effect (Magical Glass UI) */}
      {PARTICLES.map((p, idx) => (
        <div
          key={idx}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            opacity: 0.12,
            animation: `float-particle ${p.duration} infinite linear`,
            animationDelay: p.delay,
          }}
        />
      ))}
    </div>
  );
}
