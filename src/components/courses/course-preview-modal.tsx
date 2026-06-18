"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, BookOpen, User, Calendar, BarChart } from "lucide-react";
import { Course } from "./course-card";
import { AnimatedButton } from "@/components/ui/animated-button";

import { useQuery } from "@tanstack/react-query";

interface CoursePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course | null;
  onEnroll: (courseId: string, facultyId: string) => void;
  isEnrolling: boolean;
  userRole?: string;
}

export function CoursePreviewModal({
  isOpen,
  onClose,
  course,
  onEnroll,
  isEnrolling,
  userRole,
}: CoursePreviewModalProps) {
  const [selectedFacultyId, setSelectedFacultyId] = React.useState<string | null>(null);

  // Fetch available faculties for this course
  const { data: facultyData, isLoading: isLoadingFaculties } = useQuery({
    queryKey: ["courseFaculties", course?.id],
    queryFn: async () => {
      const res = await fetch(`/api/courses/${course?.id}/faculties`);
      if (!res.ok) throw new Error("Failed to fetch faculties");
      return res.json();
    },
    enabled: isOpen && !!course?.id,
  });

  if (!course) return null;
  
  const faculties = facultyData?.faculties || [];
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: "-50%", y: "-40%" }}
            animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
            exit={{ opacity: 0, scale: 0.9, x: "-50%", y: "-40%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg"
          >
            <div className="glass rounded-3xl overflow-hidden shadow-2xl border border-white/20 relative max-h-[90vh] flex flex-col">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors"
              >
                <X size={20} />
              </button>

              <div className="h-48 w-full shrink-0 bg-gradient-to-br from-primary/30 to-secondary/30 relative">
                {course.imageUrl ? (
                  <img src={course.imageUrl} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center opacity-30">
                    <BookOpen size={64} className="text-primary" />
                  </div>
                )}
              </div>

              <div className="p-8 overflow-y-auto">
                <div className="flex items-center space-x-2 text-sm font-semibold text-primary mb-3">
                  <BarChart size={16} />
                  <span className="uppercase tracking-wider">{course.level}</span>
                </div>
                
                <h2 className="text-2xl font-bold text-foreground mb-4">{course.title}</h2>
                
                <p className="text-foreground/70 mb-6 leading-relaxed">
                  {course.description || "No detailed description provided for this course. Enroll to find out more!"}
                </p>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="flex items-center space-x-3 text-foreground/80 bg-white/5 p-3 rounded-xl border border-white/10">
                    <User className="text-primary" size={20} />
                    <div className="flex flex-col">
                      <span className="text-xs text-foreground/50">Instructor Options</span>
                      <span className="font-medium text-sm line-clamp-1">Multiple Faculties</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 text-foreground/80 bg-white/5 p-3 rounded-xl border border-white/10">
                    <Calendar className="text-primary" size={20} />
                    <div className="flex flex-col">
                      <span className="text-xs text-foreground/50">Created</span>
                      <span className="font-medium text-sm">
                        {new Date(course.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {userRole === "STUDENT" && (
                  course.isEnrolled ? (
                    <AnimatedButton className="w-full" disabled>
                      Already Enrolled
                    </AnimatedButton>
                  ) : (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-primary">Select Faculty Section</h3>
                      {isLoadingFaculties ? (
                        <div className="h-20 w-full animate-pulse bg-white/10 rounded-xl"></div>
                      ) : (
                        <div className="grid gap-3 max-h-48 overflow-y-auto pr-2">
                          {faculties.map((f: any) => (
                            <button
                              key={f.id}
                              onClick={() => setSelectedFacultyId(f.id)}
                              className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
                                selectedFacultyId === f.id 
                                  ? "border-primary bg-primary/20 ring-1 ring-primary" 
                                  : "border-white/10 bg-white/5 hover:bg-white/10"
                              }`}
                            >
                              <div>
                                <p className="font-semibold">{f.teacherName}</p>
                                <p className="text-xs text-foreground/50">{f.teacherEmail}</p>
                              </div>
                              <div className="text-right">
                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${f.enrolledCount >= f.capacity ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                  {f.enrolledCount >= f.capacity ? "WAITLIST ONLY" : `${f.enrolledCount} / ${f.capacity} Enrolled`}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      
                      <AnimatedButton 
                        onClick={() => selectedFacultyId && onEnroll(course.id, selectedFacultyId)} 
                        className="w-full mt-4" 
                        disabled={isEnrolling || !selectedFacultyId}
                      >
                        {isEnrolling ? "Processing..." : (
                          faculties.find((f: any) => f.id === selectedFacultyId)?.enrolledCount >= faculties.find((f: any) => f.id === selectedFacultyId)?.capacity 
                            ? "Join Waitlist" 
                            : "Enroll Now"
                        )}
                      </AnimatedButton>
                    </div>
                  )
                )}
                {userRole === "TEACHER" && (
                  <AnimatedButton className="w-full" disabled>
                    You are the Instructor
                  </AnimatedButton>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
