"use client";
 
import React from "react";
import { motion } from "framer-motion";
import { BookOpen, Calendar, Award, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedButton } from "@/components/ui/animated-button";
 
export interface Course {
  id: string;
  title: string;
  description: string | null;
  level: string;
  semester?: number;
  credits?: number;
  subjectCode?: string;
  imageUrl: string | null;
  teacherName: string;
  createdAt: string;
  isEnrolled?: boolean;
  status?: "ACTIVE" | "COMPLETED" | "DROPPED";
}

const getCleanCourseCode = (course: any) => {
  const t = course.title?.toLowerCase() || "";
  if (t.includes("database management")) return "CS301";
  if (t.includes("theory of computation")) return "CS302";
  if (t.includes("agile software")) return "CS303";
  if (t.includes("operating system")) return "CS304";
  
  if (!course.title) return "CRS-101";
  const acronym = course.title
    .split(" ")
    .filter((w: string) => w.length > 1 && !["and", "for", "the", "using", "of", "&"].includes(w.toLowerCase()))
    .map((w: string) => w[0])
    .join("")
    .toUpperCase();
  const sem = course.semester || 1;
  return `${acronym}-${sem}01`;
};
 
interface CourseCardProps {
  course: Course;
  onClick: (course: Course) => void;
  index: number;
}

export function CourseCard({ course, onClick, index }: CourseCardProps) {
  // Generate a random gradient if no image is provided
  const gradients = [
    "from-primary/20 to-secondary/20",
    "from-secondary/20 to-highlight/20",
    "from-primary/25 to-highlight/15",
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
      className="glass w-full rounded-2xl overflow-hidden cursor-pointer group hover:shadow-[0_20px_40px_rgba(139,92,246,0.12)] transition-all flex flex-col relative"
    >
      <div className={cn("h-40 w-full bg-gradient-to-br relative", defaultGradient)}>
        {course.imageUrl ? (
          <img src={course.imageUrl} alt={course.title} className="w-full h-full object-cover" />
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
      
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md uppercase tracking-wider">
              {course.subjectCode || getCleanCourseCode(course)}
            </span>
            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              Semester {course.semester || 1}
            </span>
          </div>
          
          <h3 className="text-lg font-bold text-slate-800 mb-1.5 line-clamp-1 group-hover:text-primary transition-colors">
            {course.title}
          </h3>
          
          <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
            {course.description || "No description provided."}
          </p>
 
          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 font-semibold mb-4 pt-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <User size={13} className="text-slate-400 shrink-0" />
              <span className="truncate">{course.teacherName}</span>
            </div>
            <div className="flex items-center gap-1.5 justify-end">
              <Award size={13} className="text-slate-400 shrink-0" />
              <span>{course.credits || 4} Credits</span>
            </div>
          </div>
        </div>
 
        <AnimatedButton 
          onClick={(e) => { e.stopPropagation(); onClick(course); }} 
          className="w-full text-xs py-2.5 h-auto mt-auto font-bold bg-primary hover:bg-primary/95 shadow-sm text-white"
        >
          Open Course
        </AnimatedButton>
      </div>
      
      <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none group-hover:bg-primary/15 transition-all" />
    </motion.div>
  );
}
