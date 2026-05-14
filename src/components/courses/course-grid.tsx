"use client";

import React from "react";
import { motion } from "framer-motion";
import { CourseCard, Course } from "./course-card";

interface CourseGridProps {
  courses: Course[];
  onCourseClick: (course: Course) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export function CourseGrid({ courses, onCourseClick }: CourseGridProps) {
  if (courses.length === 0) {
    return (
      <div className="w-full py-20 text-center text-foreground/60 glass rounded-2xl">
        <p className="text-lg">No courses found.</p>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
    >
      {courses.map((course, index) => (
        <CourseCard 
          key={course.id} 
          course={course} 
          index={index} 
          onClick={onCourseClick} 
        />
      ))}
    </motion.div>
  );
}
