"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
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

  // Enroll Mutation
  const enrollMutation = useMutation({
    mutationFn: async (courseId: string) => {
      const res = await fetch(`/api/courses/${courseId}/enroll`, {
        method: "POST",
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
          <div key={i} className="glass w-full h-64 rounded-2xl animate-pulse bg-white/20" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-primary mb-2">
            {role === "TEACHER" ? "My Courses" : "Explore Courses"}
          </h1>
          <p className="text-foreground/70">
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

      <CourseGrid courses={courses} onCourseClick={handleCourseClick} />

      <CoursePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        course={selectedCourse}
        onEnroll={(id) => enrollMutation.mutate(id)}
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
