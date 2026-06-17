"use client";

import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen } from "lucide-react";
import { CourseGrid } from "@/components/courses/course-grid";
import { Course } from "@/components/courses/course-card";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function TeacherMyCoursesPage() {
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: ["teacherCourses"],
    queryFn: async () => {
      const res = await fetch("/api/teacher/courses");
      if (!res.ok) throw new Error("Failed to fetch teacher courses");
      return res.json();
    },
  });

  const allCourses: (Course & { isAssigned?: boolean })[] = data?.data?.courses || [];
  
  // Only show courses actively managed by this teacher
  const managedCourses = useMemo(() => {
    return allCourses.filter((c) => c.isAssigned !== false);
  }, [allCourses]);

  const coursesBySemester = useMemo(() => {
    const grouped: Record<number, typeof managedCourses> = {};
    managedCourses.forEach((c) => {
      const sem = c.semester || 1;
      if (!grouped[sem]) {
        grouped[sem] = [];
      }
      grouped[sem].push(c);
    });
    return grouped;
  }, [managedCourses]);

  const sortedSemesters = useMemo(() => {
    return Object.keys(coursesBySemester).map(Number).sort((a, b) => b - a);
  }, [coursesBySemester]);

  const handleCourseClick = (course: Course) => {
    router.push(`/dashboard/courses/${course.id}`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-12">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between md:items-end gap-6 mb-8"
      >
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-3">
            My Managed Courses
          </h1>
          <p className="text-lg font-medium text-slate-500 max-w-2xl">
            View and manage the specific courses assigned to you for this academic year.
          </p>
        </div>
      </motion.div>

      {managedCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-3xl border border-slate-100 shadow-sm text-center">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
            <BookOpen className="text-slate-300" size={40} />
          </div>
          <h3 className="text-2xl font-black text-slate-800 mb-2">No Courses Assigned</h3>
          <p className="text-slate-500 font-medium max-w-md">
            You are not currently managing any courses for this academic year.
          </p>
        </div>
      ) : (
        <div className="space-y-16">
          {sortedSemesters.map((sem) => (
            <div key={sem} className="space-y-6">
              <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                  <span className="w-2 h-8 rounded-full bg-primary block"></span>
                  Semester {sem}
                </h2>
                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-sm font-bold">
                  {coursesBySemester[sem].length} {coursesBySemester[sem].length === 1 ? 'Course' : 'Courses'}
                </span>
              </div>
              <CourseGrid courses={coursesBySemester[sem]} onCourseClick={handleCourseClick} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
