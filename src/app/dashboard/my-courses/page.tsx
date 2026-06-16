"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter } from "lucide-react";
import { CourseGrid } from "@/components/courses/course-grid";
import { Course } from "@/components/courses/course-card";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

type FilterStatus = "ALL" | "ONGOING" | "COMPLETED";

export default function MyCoursesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL");

  const { data, isLoading } = useQuery({
    queryKey: ["enrolledCourses"],
    queryFn: async () => {
      const res = await fetch("/api/courses/enrolled");
      if (!res.ok) throw new Error("Failed to fetch enrolled courses");
      return res.json();
    },
  });

  const courses: Course[] = data?.data?.courses || [];

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      // Search Match
      const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Status Match
      let matchesStatus = true;
      if (filterStatus === "ONGOING") {
        matchesStatus = course.status !== "COMPLETED";
      } else if (filterStatus === "COMPLETED") {
        matchesStatus = course.status === "COMPLETED";
      }

      return matchesSearch && matchesStatus;
    });
  }, [courses, searchQuery, filterStatus]);

  const coursesBySemester = useMemo(() => {
    const grouped: Record<number, Course[]> = {};
    filteredCourses.forEach((c) => {
      const sem = c.semester || 1;
      if (!grouped[sem]) {
        grouped[sem] = [];
      }
      grouped[sem].push(c);
    });
    return grouped;
  }, [filteredCourses]);

  const sortedSemesters = useMemo(() => {
    // Sort descending so latest semester appears first (e.g. 3, 2, 1)
    return Object.keys(coursesBySemester).map(Number).sort((a, b) => b - a);
  }, [coursesBySemester]);

  const handleCourseClick = (course: Course) => {
    router.push(`/dashboard/courses/${course.id}`);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto pb-12">
        <div className="flex space-x-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white/95 backdrop-blur-md w-full h-64 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-primary mb-2">My Courses</h1>
          <p className="text-foreground/70">
            Pick up where you left off and track your learning progress.
          </p>
        </motion.div>
      </div>

      {/* Search and Filters */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200/85"
      >
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search my courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <div className="flex items-center text-sm text-slate-600 mr-2 font-bold">
            <Filter size={16} className="mr-2" />
            Filter:
          </div>
          {(["ALL", "ONGOING", "COMPLETED"] as FilterStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap border ${
                filterStatus === status
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 border-transparent"
                  : "bg-slate-50 text-slate-600 border-slate-300 hover:bg-slate-100"
              }`}
            >
              {status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Courses Rendering (Always grouped by semester in descending order) */}
      {sortedSemesters.length > 0 ? (
        <div className="space-y-10">
          {sortedSemesters.map((sem) => {
            const semCourses = coursesBySemester[sem];
            return (
              <div key={sem} className="bg-white/95 backdrop-blur-md p-6 rounded-3xl border border-slate-200/85">
                <h3 className="text-xl font-extrabold text-slate-800 mb-6 pb-2 border-b border-slate-100 flex items-center gap-2">
                  <span className="inline-block w-2.5 h-6 bg-primary rounded-full" />
                  Semester {sem} Courses
                </h3>
                <CourseGrid courses={semCourses} onCourseClick={handleCourseClick} />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200/85">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4 border border-primary/20">
            <Search className="text-primary" size={32} />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">No courses found</h3>
          <p className="text-foreground/70 max-w-md">
            {searchQuery 
              ? `We couldn't find any courses matching "${searchQuery}".` 
              : "You haven't enrolled in any courses with this status yet."}
          </p>
        </div>
      )}
    </div>
  );
}
