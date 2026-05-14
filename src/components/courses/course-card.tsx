"use client";

import React from "react";
import { motion } from "framer-motion";
import { BookOpen, BarChart } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedButton } from "@/components/ui/animated-button";

export interface Course {
  id: string;
  title: string;
  description: string | null;
  level: string;
  imageUrl: string | null;
  teacherName: string;
  createdAt: string;
  isEnrolled?: boolean;
  progress?: number;
  status?: "ACTIVE" | "COMPLETED" | "DROPPED";
}

interface CourseCardProps {
  course: Course;
  onClick: (course: Course) => void;
  index: number;
}

export function CourseCard({ course, onClick, index }: CourseCardProps) {
  // Generate a random gradient if no image is provided
  const gradients = [
    "from-red-500/20 to-orange-500/20",
    "from-red-600/20 to-pink-500/20",
    "from-orange-500/20 to-amber-500/20",
  ];
  const defaultGradient = gradients[index % gradients.length];

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onClick(course)}
      className="glass w-full rounded-2xl overflow-hidden cursor-pointer group hover:shadow-[0_0_20px_rgba(153,27,27,0.3)] transition-all flex flex-col relative"
    >
      <div className={cn("h-40 w-full bg-gradient-to-br relative", defaultGradient)}>
        {course.imageUrl ? (
          <img src={course.imageUrl} alt={course.title} className="w-full h-full object-cover mix-blend-overlay opacity-80" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center opacity-30">
            <BookOpen size={48} className="text-primary" />
          </div>
        )}
        {course.isEnrolled && (
          <div className="absolute top-3 right-3 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
            Enrolled
          </div>
        )}
      </div>
      
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center space-x-2 text-xs font-medium text-primary mb-2">
          <BarChart size={14} />
          <span>{course.level}</span>
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2 line-clamp-1 group-hover:text-primary transition-colors">{course.title}</h3>
        <p className="text-sm text-foreground/70 line-clamp-2 mb-4 flex-1">
          {course.description || "No description provided."}
        </p>
        {course.progress !== undefined ? (
          <div className="mt-auto border-t border-white/10 pt-3">
            <div className="flex justify-between text-xs text-foreground/70 mb-1">
              <span>Progress</span>
              <span>{course.progress}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5 mb-3">
              <div className="bg-primary h-1.5 rounded-full" style={{ width: `${course.progress}%` }} />
            </div>
            <AnimatedButton onClick={(e) => { e.stopPropagation(); onClick(course); }} className="w-full text-xs py-1.5 h-auto">
              {course.progress === 100 ? "Review Course" : "Continue Learning"}
            </AnimatedButton>
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs text-foreground/50 border-t border-white/10 pt-3 mt-auto">
            <span>By {course.teacherName}</span>
          </div>
        )}
      </div>
      
      <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl pointer-events-none group-hover:bg-primary/20 transition-all" />
    </motion.div>
  );
}
