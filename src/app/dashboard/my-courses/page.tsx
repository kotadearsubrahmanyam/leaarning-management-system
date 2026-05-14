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

  const handleCourseClick = (course: Course) => {
    router.push(`/dashboard/courses/${course.id}`);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto pb-12">
        <div className="flex space-x-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass w-full h-64 rounded-2xl animate-pulse bg-white/20" />
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
        className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10"
      >
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground/50" size={18} />
          <input
            type="text"
            placeholder="Search my courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <div className="flex items-center text-sm text-foreground/70 mr-2">
            <Filter size={16} className="mr-2" />
            Filter:
          </div>
          {(["ALL", "ONGOING", "COMPLETED"] as FilterStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                filterStatus === status
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "bg-white/5 text-foreground/70 hover:bg-white/10 hover:text-foreground"
              }`}
            >
              {status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Courses Grid */}
      {filteredCourses.length > 0 ? (
        <CourseGrid courses={filteredCourses} onCourseClick={handleCourseClick} />
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center glass rounded-3xl border border-white/5">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
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
