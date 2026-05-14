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
        className="glass w-full rounded-3xl overflow-hidden cursor-pointer group hover:shadow-[0_0_30px_rgba(153,27,27,0.4)] transition-all flex flex-col md:flex-row relative border border-white/10"
        onClick={() => router.push(`/dashboard/courses/${courseId}`)}
      >
        {/* Thumbnail / Gradient side */}
        <div className="md:w-1/3 h-48 md:h-auto relative bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={title} 
              className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-80"
            />
          ) : (
            <BookOpen size={64} className="text-primary opacity-50 relative z-10" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent md:bg-gradient-to-r" />
          
          <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2">
            <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
              Continue
            </span>
          </div>
        </div>

        {/* Content side */}
        <div className="flex-1 p-6 md:p-8 flex flex-col justify-center relative">
          <h2 className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">
            Pick up where you left off
          </h2>
          <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4 line-clamp-1 group-hover:text-primary transition-colors">
            {title}
          </h3>
          
          <div className="flex items-center gap-3 text-foreground/70 mb-6 bg-white/5 p-3 rounded-xl border border-white/5 w-fit">
            <PlayCircle className="text-orange-500" size={20} />
            <span className="text-sm font-medium">Up next: <span className="text-foreground">{lastLesson}</span></span>
          </div>

          <div className="mt-auto">
            <div className="flex justify-between text-sm font-semibold text-foreground/80 mb-2">
              <span>Overall Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2.5 mb-6 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                className="bg-gradient-to-r from-orange-500 to-red-600 h-full rounded-full relative"
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
                className="w-full md:w-auto px-8"
              >
                Resume Course
              </AnimatedButton>
            </div>
          </div>
          
          {/* Subtle background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
        </div>
      </motion.div>
    </div>
  );
}
