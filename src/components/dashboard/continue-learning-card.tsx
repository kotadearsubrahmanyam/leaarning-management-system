"use client";

import React from "react";
import { motion } from "framer-motion";
import { PlayCircle, BookOpen } from "lucide-react";
import { AnimatedButton } from "@/components/ui/animated-button";
import { useRouter } from "next/navigation";

interface ContinueLearningCardProps {
  courseId: string;
  title: string;
  imageUrl: string | null;
  lastLesson: string;
  progress: number;
}

export function ContinueLearningCard({
  courseId,
  title,
  imageUrl,
  lastLesson,
  progress,
}: ContinueLearningCardProps) {
  const router = useRouter();

  return (
    <div className="animate-float">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        whileHover={{ scale: 1.02 }}
        className="w-full bg-gradient-to-br from-[#059669] via-[#059669] to-[#047857] text-white rounded-3xl overflow-hidden cursor-pointer group hover:shadow-[0_20px_45px_rgba(5,150,105,0.25)] transition-all flex flex-col md:flex-row relative border border-emerald-500/20"
        onClick={() => router.push(`/dashboard/courses/${courseId}`)}
      >
        {/* Thumbnail / Gradient side */}
        <div className="md:w-1/3 h-48 md:h-auto relative bg-black/10 flex items-center justify-center">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={title} 
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <BookOpen size={64} className="text-white opacity-40 relative z-10" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent md:bg-gradient-to-r" />
          
          <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2">
            <span className="bg-white/20 text-white border border-white/30 text-xs font-bold px-3 py-1 rounded-full shadow-lg">
              Continue
            </span>
          </div>
        </div>

        {/* Content side */}
        <div className="flex-1 p-6 md:p-8 flex flex-col justify-center relative">
          <h2 className="text-sm font-semibold text-emerald-200 uppercase tracking-wider mb-2">
            Pick up where you left off
          </h2>
          <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-4 line-clamp-1 group-hover:text-emerald-100 transition-colors">
            {title}
          </h3>
          
          <div className="flex items-center gap-3 text-white/90 mb-6 bg-white/10 p-3 rounded-xl border border-white/10 w-fit">
            <PlayCircle className="text-white" size={20} />
            <span className="text-sm font-medium">Up next: <span className="text-white font-bold">{lastLesson}</span></span>
          </div>

          <div className="mt-auto">
            <div className="flex justify-between text-sm font-semibold text-white/95 mb-2">
              <span>Overall Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2.5 mb-6 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                className="bg-white h-full rounded-full relative"
              >
                <div className="absolute inset-0 bg-white/20 w-full h-full animate-pulse" />
              </motion.div>
            </div>
            
            <div className="flex justify-end">
              <AnimatedButton 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  router.push(`/dashboard/courses/${courseId}`); 
                }} 
                className="w-full md:w-auto px-8 bg-white text-emerald-800 hover:bg-emerald-50 hover:text-emerald-950 font-bold hover:shadow-[0_0_20px_rgba(255,255,255,0.4)]"
              >
                Resume Course
              </AnimatedButton>
            </div>
          </div>
          
          {/* Subtle background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-[80px] pointer-events-none" />
        </div>
      </motion.div>
    </div>
  );
}
