"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";

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
import { CourseGrid } from "@/components/courses/course-grid";
import { Course } from "@/components/courses/course-card";
import { CoursePreviewModal } from "@/components/courses/course-preview-modal";
import { CreateCourseModal } from "@/components/courses/create-course-modal";
import { AnimatedButton } from "@/components/ui/animated-button";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function CoursesPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch current user role
  const { data: authData } = useQuery({
    queryKey: ["authMe"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) throw new Error("Unauthorized");
      return res.json();
    },
  });

  const role = authData?.data?.user?.role;

  // Fetch courses
  const { data: coursesData, isLoading } = useQuery({
    queryKey: ["courses", role],
    queryFn: async () => {
      // If teacher, fetch only their courses (optional: could add a toggle, but for now fetch all teacher's courses if teacher)
      const url = role === "TEACHER" ? "/api/courses?teacherOnly=true" : "/api/courses";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch courses");
      return res.json();
    },
    enabled: !!role,
  });

  const courses: Course[] = coursesData?.data?.courses || [];

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const q = searchQuery.toLowerCase();
      const code = course.subjectCode || getCleanCourseCode(course);
      return (
        course.title.toLowerCase().includes(q) ||
        code.toLowerCase().includes(q) ||
        (course.teacherName || "").toLowerCase().includes(q)
      );
    });
  }, [courses, searchQuery]);

  // Enroll Mutation
  const enrollMutation = useMutation({
    mutationFn: async ({ courseId, courseFacultyId }: { courseId: string; courseFacultyId: string }) => {
      const res = await fetch(`/api/courses/${courseId}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseFacultyId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to enroll");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      setIsPreviewOpen(false);
      alert("Successfully enrolled!");
    },
    onError: (error: any) => {
      alert(error.message);
    }
  });

  // Create Course Mutation
  const createMutation = useMutation({
    mutationFn: async (newCourse: any) => {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCourse),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create course");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      setIsCreateOpen(false);
    },
  });

  const handleCourseClick = (course: Course) => {
    if (course.isEnrolled || role === "TEACHER" || role === "ADMIN") {
      router.push(`/dashboard/courses/${course.id}`);
    } else {
      setSelectedCourse(course);
      setIsPreviewOpen(true);
    }
  };

  if (isLoading || !role) {
    return (
      <div className="flex space-x-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="w-full h-64 rounded-2xl animate-pulse bg-slate-200" />
        ))}
      </div>
    );
  }

  const enrolledCount = courses.filter(c => c.isEnrolled).length;

  return (
    <div className="max-w-7xl mx-auto pb-12">
      {role === "STUDENT" && enrolledCount < 4 && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl mb-8 flex items-center shadow-sm">
          <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p className="font-medium">
            Attention: You are currently enrolled in {enrolledCount} course(s). University policy requires a minimum of 4 courses per semester. Please enroll in {4 - enrolledCount} more course(s) to meet the requirement.
          </p>
        </div>
      )}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-primary mb-2">
            {role === "TEACHER" ? "My Courses" : "Explore Courses"}
          </h1>
          <p className="text-foreground/70 text-sm">
            {role === "TEACHER" 
              ? "Manage and create your educational content." 
              : "Discover new skills and expand your knowledge."}
          </p>
        </motion.div>
 
        {role === "TEACHER" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <AnimatedButton onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2">
              <Plus size={18} />
              Create Course
            </AnimatedButton>
          </motion.div>
        )}
      </div>
 
      {/* Search Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex flex-col md:flex-row gap-4 mb-8 items-center bg-white/95 backdrop-blur-md p-4 rounded-3xl border border-slate-200/85"
      >
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by course name, code, or faculty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-11 pr-4 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 font-semibold transition-all shadow-sm"
          />
        </div>
      </motion.div>
 
      <CourseGrid courses={filteredCourses} onCourseClick={handleCourseClick} />

      <CoursePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        course={selectedCourse}
        onEnroll={(id, facultyId) => enrollMutation.mutate({ courseId: id, courseFacultyId: facultyId })}
        isEnrolling={enrollMutation.isPending}
        userRole={role}
      />

      <CreateCourseModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={(data) => createMutation.mutate(data)}
        isCreating={createMutation.isPending}
        error={createMutation.error ? (createMutation.error as Error).message : null}
      />
    </div>
  );
}
