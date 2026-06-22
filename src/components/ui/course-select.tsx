"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, 
  ChevronDown, 
  Search, 
  Users, 
  Check, 
  RotateCcw, 
  RefreshCw, 
  X, 
  GraduationCap, 
  Code, 
  Database, 
  Cpu 
} from "lucide-react";

const COURSE_ICONS = [BookOpen, Code, Database, Cpu, GraduationCap];

const getCourseCode = (course: any) => {
  if (!course?.title) return "CRS-101";
  const acronym = course.title
    .split(" ")
    .filter((w: string) => w.length > 1 && !["and", "for", "the", "using", "of", "&"].includes(w.toLowerCase()))
    .map((w: string) => w[0])
    .join("")
    .toUpperCase();
  const sem = course.semester || 1;
  return `${acronym}-${sem}01`;
};

const getCourseAesthetics = (course: any) => {
  if (!course?.title) return { gradient: "from-emerald-500 to-teal-600", IconComponent: BookOpen };
  const hash = course.title.split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
  const gradients = [
    "from-emerald-500 to-teal-600",
    "from-blue-500 to-indigo-600",
    "from-purple-500 to-violet-600",
    "from-cyan-500 to-blue-600",
    "from-orange-500 to-amber-600",
  ];
  const gradient = gradients[hash % gradients.length];
  const IconComponent = COURSE_ICONS[hash % COURSE_ICONS.length];
  return { gradient, IconComponent };
};

interface CourseSelectProps {
  courses: any[];
  selectedCourse: string;
  setSelectedCourse: (courseId: string) => void;
  label?: string;
  placeholder?: string;
  onRefresh?: () => void;
  showClear?: boolean;
  compact?: boolean;
}

export function CourseSelect({
  courses,
  selectedCourse,
  setSelectedCourse,
  label = "Select Course",
  placeholder = "Choose a course...",
  onRefresh,
  showClear = true,
  compact = false
}: CourseSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const currentCourseDetails = useMemo(() => {
    return courses.find((c: any) => c.id === selectedCourse);
  }, [courses, selectedCourse]);

  const filteredCourses = useMemo(() => {
    if (!searchQuery) return courses;
    const q = searchQuery.toLowerCase();
    return courses.filter((c: any) => 
      c.title.toLowerCase().includes(q) || 
      getCourseCode(c).toLowerCase().includes(q)
    );
  }, [courses, searchQuery]);

  return (
    <div className="w-full space-y-2">
      {label && (
        <label className="block text-sm font-semibold text-slate-700 ml-1">
          {label}
        </label>
      )}
      <div className="relative">
        {!currentCourseDetails ? (
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full bg-white border border-purple-200 rounded-xl p-4 flex items-center justify-between text-left shadow-sm hover:shadow-md hover:border-purple-400 hover:-translate-y-0.5 focus:outline-none transition-all duration-250 group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-xl text-slate-400 group-hover:bg-purple-50 group-hover:text-purple-500 transition-colors">
                <BookOpen size={20} />
              </div>
              <div>
                <span className="font-semibold text-slate-800">{placeholder}</span>
                <p className="text-xs text-slate-400">Search and select a course</p>
              </div>
            </div>
            <ChevronDown size={20} className={`text-slate-400 transition-transform duration-250 ${isOpen ? "rotate-180 text-purple-500" : ""}`} />
          </button>
        ) : (
          (() => {
            const aesthetics = getCourseAesthetics(currentCourseDetails);
            const Icon = aesthetics.IconComponent;
            if (compact) {
              return (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full bg-white border border-purple-200 rounded-xl p-4 flex items-center justify-between text-left shadow-sm hover:shadow-md hover:border-purple-400 hover:-translate-y-0.5 transition-all duration-250 relative group"
                >
                  <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex-1 flex items-center gap-3 text-left focus:outline-none min-w-0"
                  >
                    <div className={`p-2 bg-gradient-to-tr ${aesthetics.gradient} text-white rounded-xl shadow-sm shrink-0`}>
                      <Icon size={20} className="stroke-[2]" />
                    </div>
                    <div className="min-w-0 pr-6">
                      <span className="font-bold text-slate-800 truncate block text-sm">
                        {currentCourseDetails.title}
                      </span>
                      <p className="text-[10px] text-slate-400 font-semibold truncate mt-0.5">
                        {getCourseCode(currentCourseDetails)} • Sem {currentCourseDetails.semester}
                      </p>
                    </div>
                  </button>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 shrink-0 bg-white pl-2">
                    {showClear && (
                      <button
                        type="button"
                        onClick={() => setSelectedCourse("")}
                        title="Deselect"
                        className="p-1.5 text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-100"
                      >
                        <X size={14} />
                      </button>
                    )}
                    <ChevronDown size={18} className="text-slate-400 group-hover:text-purple-500 transition-colors" />
                  </div>
                </motion.div>
              );
            }
            return (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full bg-white border-l-4 border-l-purple-500 border border-purple-200 rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-250"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3.5 bg-gradient-to-tr ${aesthetics.gradient} text-white rounded-2xl shadow-md`}>
                    <Icon size={24} className="stroke-[2]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                        {getCourseCode(currentCourseDetails)}
                      </span>
                      <span className="text-xs font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md">
                        Semester {currentCourseDetails.semester}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-800 mt-1 leading-snug">
                      {currentCourseDetails.title}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                      <Users size={12} /> {currentCourseDetails.studentCount || 0} enrolled students
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap md:flex-nowrap border-t border-slate-100 pt-4 md:pt-0 md:border-0">
                  <button
                    type="button"
                    onClick={() => setIsOpen(true)}
                    className="px-3.5 py-2 text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 border border-purple-200 hover:border-purple-300 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <RotateCcw size={13} /> Change Course
                  </button>
                  {onRefresh && (
                    <button
                      type="button"
                      onClick={onRefresh}
                      title="Reload"
                      className="p-2 text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors shadow-sm"
                    >
                      <RefreshCw size={14} />
                    </button>
                  )}
                  {showClear && (
                    <button
                      type="button"
                      onClick={() => setSelectedCourse("")}
                      title="Deselect"
                      className="p-2 text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors shadow-sm"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })()
        )}

        <AnimatePresence>
          {isOpen && (
            <>
              <div className="fixed inset-0 z-40 cursor-default" onClick={() => setIsOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="absolute left-0 right-0 mt-2 bg-white border border-purple-200 rounded-xl shadow-xl z-50 overflow-hidden"
              >
                <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                  <Search size={18} className="text-slate-400 ml-1.5" />
                  <input
                    type="text"
                    placeholder="Search by course name or course code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent border-0 py-1.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0"
                    autoFocus
                  />
                  {searchQuery && (
                    <button type="button" onClick={() => setSearchQuery("")} className="p-1 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                      <X size={14} />
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto scrollbar-thin p-2 space-y-1">
                  {filteredCourses.length === 0 ? (
                    <div className="p-8 text-center text-sm text-slate-400 flex flex-col items-center justify-center gap-2">
                      <BookOpen size={24} className="stroke-[1.5] text-slate-300" />
                      <span>No courses match your query.</span>
                    </div>
                  ) : (
                    filteredCourses.map((c: any) => {
                      const isSelected = selectedCourse === c.id;
                      const aesthetics = getCourseAesthetics(c);
                      const Icon = aesthetics.IconComponent;
                      const isAssigned = c.isAssigned !== false;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          disabled={!isAssigned}
                          onClick={() => {
                            if (isAssigned) {
                              setSelectedCourse(c.id);
                              setIsOpen(false);
                              setSearchQuery("");
                            }
                          }}
                          className={`w-full p-3 flex items-center justify-between rounded-xl text-left transition-all duration-200 border ${
                            isSelected 
                              ? "bg-purple-50/70 border-purple-300 text-purple-800 shadow-sm" 
                              : "bg-white border-transparent hover:bg-purple-50/30 hover:border-purple-200 text-slate-700"
                          } ${!isAssigned ? "opacity-50 cursor-not-allowed bg-slate-50/50" : ""}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 bg-gradient-to-tr ${aesthetics.gradient} text-white rounded-lg shadow-sm flex-shrink-0`}>
                              <Icon size={16} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-slate-500">
                                  {getCourseCode(c)}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">
                                  • Sem {c.semester}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-sm truncate max-w-[250px] md:max-w-[400px]">
                                  {c.title}
                                </p>
                                {!isAssigned && (
                                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-200 text-slate-500">
                                    N/A
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full flex-shrink-0">
                              {c.studentCount || 0} Enrolled
                            </span>
                            {isSelected && <Check size={16} className="text-purple-500 stroke-[2.5]" />}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
