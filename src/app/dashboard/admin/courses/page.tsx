"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Plus, X, Loader2, ChevronDown, ChevronUp, Sparkles, GraduationCap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { AnimatedButton } from "@/components/ui/animated-button";
import { AnimatedInput } from "@/components/ui/animated-input";
import { cn } from "@/lib/utils";

const mapDeptName = (name: string) => {
  if (name.includes("Computer Science")) return "CSE";
  if (name.includes("Electronics & Communication")) return "ECE";
  if (name.includes("Electrical")) return "EEE";
  if (name.includes("Mechanical")) return "MECH";
  if (name.includes("Civil")) return "CIVIL";
  if (name.includes("Business")) return "BBA";
  return name.substring(0, 5).toUpperCase();
};

const getDeptStyle = (deptName: string) => {
  const cleanName = mapDeptName(deptName);
  switch (cleanName) {
    case "CSE":
      return {
        color: "#2563EB",
        gradient: "from-[#2563EB] to-[#60A5FA]",
        iconBg: "bg-blue-50",
        iconColor: "text-[#2563EB]",
        badgeBg: "bg-blue-50 text-[#2563EB] border-blue-200",
        badgeBorder: "border-blue-200",
        borderAccent: "border-l-4 border-l-[#2563EB]",
      };
    case "ECE":
      return {
        color: "#8B5CF6",
        gradient: "from-[#8B5CF6] to-[#C084FC]",
        iconBg: "bg-purple-50",
        iconColor: "text-[#8B5CF6]",
        badgeBg: "bg-purple-50 text-[#8B5CF6] border-purple-200",
        badgeBorder: "border-purple-200",
        borderAccent: "border-l-4 border-l-[#8B5CF6]",
      };
    case "EEE":
      return {
        color: "#F59E0B",
        gradient: "from-[#F59E0B] to-[#FBBF24]",
        iconBg: "bg-amber-50",
        iconColor: "text-[#F59E0B]",
        badgeBg: "bg-amber-50 text-[#F59E0B] border-amber-200",
        badgeBorder: "border-amber-200",
        borderAccent: "border-l-4 border-l-[#F59E0B]",
      };
    case "MECH":
      return {
        color: "#EF4444",
        gradient: "from-[#EF4444] to-[#F87171]",
        iconBg: "bg-red-50",
        iconColor: "text-[#EF4444]",
        badgeBg: "bg-red-50 text-[#EF4444] border-red-200",
        badgeBorder: "border-red-200",
        borderAccent: "border-l-4 border-l-[#EF4444]",
      };
    case "CIVIL":
      return {
        color: "#10B981",
        gradient: "from-[#10B981] to-[#34D399]",
        iconBg: "bg-emerald-50",
        iconColor: "text-[#10B981]",
        badgeBg: "bg-emerald-50 text-[#10B981] border-emerald-200",
        badgeBorder: "border-emerald-200",
        borderAccent: "border-l-4 border-l-[#10B981]",
      };
    default:
      return {
        color: "#7C3AED",
        gradient: "from-[#7C3AED] to-[#A855F7]",
        iconBg: "bg-purple-50",
        iconColor: "text-[#7C3AED]",
        badgeBg: "bg-purple-50 text-[#7C3AED] border-purple-200",
        badgeBorder: "border-purple-200",
        borderAccent: "border-l-4 border-l-[#7C3AED]",
      };
  }
};

export default function AdminCoursesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    level: "Beginner",
    teacherId: "",
    categoryId: "",
    semester: 1,
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editCourse, setEditCourse] = useState<any>(null);
  const [editTeacherId, setEditTeacherId] = useState("");
  
  // Track collapse/expand states for each department (default expanded)
  const [collapsedDepts, setCollapsedDepts] = useState<Record<string, boolean>>({});
  
  // Track selected semester tab for each department
  const [selectedSemesters, setSelectedSemesters] = useState<Record<string, number>>({});

  const toggleCollapse = (deptId: string) => {
    setCollapsedDepts((prev) => ({
      ...prev,
      [deptId]: !prev[deptId],
    }));
  };

  const { data: coursesData, isLoading } = useQuery({
    queryKey: ["adminCourses"],
    queryFn: async () => {
      const res = await fetch("/api/admin/courses");
      if (!res.ok) throw new Error("Failed to fetch courses");
      return res.json();
    },
  });

  const { data: teachersData } = useQuery({
    queryKey: ["teachers"],
    queryFn: async () => {
      const res = await fetch("/api/admin/teachers");
      if (!res.ok) throw new Error("Failed to fetch teachers");
      return res.json();
    },
  });

  const { data: departmentsData } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await fetch("/api/admin/departments");
      if (!res.ok) throw new Error("Failed to fetch departments");
      return res.json();
    },
  });

  // Fetch admin stats to display teacher and student counts per department
  const { data: statsData } = useQuery({
    queryKey: ["adminStatsOverview"],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error("Failed to fetch admin stats");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create course");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCourses"] });
      setIsModalOpen(false);
      setFormData({ title: "", description: "", level: "Beginner", teacherId: "", categoryId: "", semester: 1 });
      toast({ title: "Success", description: "Course created successfully!" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create course", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/courses/${editCourse.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId: editTeacherId }),
      });
      if (!res.ok) throw new Error("Failed to reassign teacher");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCourses"] });
      setIsEditModalOpen(false);
      toast({ title: "Success", description: "Teacher reassigned successfully!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to reassign teacher", variant: "destructive" });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.teacherId) return;
    createMutation.mutate();
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTeacherId) return;
    updateMutation.mutate();
  };

  const courses = coursesData?.data?.courses || [];
  const teachers = teachersData?.data?.teachers || [];
  const departments = departmentsData?.data?.departments || [];
  const deptStats = statsData?.data?.stats?.departmentStats || [];

  // Group courses department-wise
  const coursesByDept = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    departments.forEach((d: any) => {
      grouped[d.name] = [];
    });
    grouped["Unassigned"] = [];

    courses.forEach((c: any) => {
      const dept = c.departmentName || "Unassigned";
      if (!grouped[dept]) {
        grouped[dept] = [];
      }
      grouped[dept].push(c);
    });

    return grouped;
  }, [courses, departments]);

  // Handle defaults for active semesters once courses load
  useEffect(() => {
    departments.forEach((dept: any) => {
      const deptCourses = coursesByDept[dept.name] || [];
      if (deptCourses.length > 0 && !selectedSemesters[dept.id]) {
        const sems = Array.from(new Set(deptCourses.map((c: any) => c.semester || 1))).sort((a: any, b: any) => a - b) as number[];
        if (sems.length > 0) {
          setSelectedSemesters((prev) => ({ ...prev, [dept.id]: sems[0] }));
        }
      }
    });

    const unassignedCourses = coursesByDept["Unassigned"] || [];
    if (unassignedCourses.length > 0 && !selectedSemesters["unassigned"]) {
      const sems = Array.from(new Set(unassignedCourses.map((c: any) => c.semester || 1))).sort((a: any, b: any) => a - b) as number[];
      if (sems.length > 0) {
        setSelectedSemesters((prev) => ({ ...prev, unassigned: sems[0] }));
      }
    }
  }, [courses, departments]);

  return (
    <div className="max-w-6xl mx-auto pb-12 relative z-10">
      <div className="flex justify-between items-end mb-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2 flex items-center gap-3">
            <BookOpen size={32} className="text-[#7C3AED]" /> Course Management
          </h1>
          <p className="text-slate-500 font-medium">Oversee all courses and assign faculty members.</p>
        </motion.div>
        <AnimatedButton onClick={() => setIsModalOpen(true)}>
          <Plus size={18} className="mr-2 inline" /> Create Course
        </AnimatedButton>
      </div>

      {isLoading ? (
        <div className="p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-white border border-[#E2E8F0] shadow-sm animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : departments.length === 0 ? (
        <div className="p-8 text-center text-slate-500 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm">
          No departments configured.
        </div>
      ) : (
        <div className="space-y-4">
          {departments.map((dept: any) => {
            const deptCourses = coursesByDept[dept.name] || [];
            const isCollapsed = collapsedDepts[dept.id] ?? false;
            const statsForDept = deptStats.find((s: any) => s.name === dept.name) || {
              studentCount: 0,
              teacherCount: 0,
              courseCount: 0,
            };

            // Available semesters - Admin wants to see all 8 semesters
            const availableSemesters = [1, 2, 3, 4, 5, 6, 7, 8];
            const activeSem = selectedSemesters[dept.id] || 1;
            
            // Filtered courses for this department based on selected semester
            const filteredDeptCourses = deptCourses.filter((c: any) => (c.semester || 1) === activeSem);
            const deptStyle = getDeptStyle(dept.name);

            return (
              <div
                key={dept.id}
                className={cn(
                  "bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-sm hover:shadow-md transition-shadow relative",
                  deptStyle.borderAccent
                )}
              >
                {/* Gradient Strip at Top */}
                <div className={cn("h-1.5 w-full bg-gradient-to-r", deptStyle.gradient)} />

                {/* Accordion Header */}
                <div
                  onClick={() => toggleCollapse(dept.id)}
                  className="flex flex-col md:flex-row justify-between md:items-center p-5 cursor-pointer hover:bg-slate-50 transition-colors border-b border-[#E2E8F0] gap-4 select-none"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm border", deptStyle.iconBg, deptStyle.badgeBorder, deptStyle.iconColor)}>
                      <BookOpen size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-800 leading-tight tracking-tight flex items-center gap-2">
                        {dept.name}
                        <span className={cn("text-xs px-2.5 py-0.5 border rounded-full font-bold uppercase tracking-wider scale-95 shrink-0 shadow-sm", deptStyle.badgeBg)}>
                          {mapDeptName(dept.name)}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 font-medium">{dept.description || "No description configured."}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-wrap">
                    {/* Mini Statistics Cards */}
                    <div className="flex gap-2.5 text-xs font-bold select-none">
                      <span className="px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center gap-1.5 shadow-sm">
                        📚 {deptCourses.length} Courses
                      </span>
                      <span className="px-3.5 py-2 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center gap-1.5 shadow-sm">
                        👨‍🏫 {statsForDept.teacherCount} Teachers
                      </span>
                      <span className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-1.5 shadow-sm">
                        👨‍🎓 {statsForDept.studentCount} Students
                      </span>
                    </div>
                    {isCollapsed ? <ChevronDown size={18} className="text-slate-455" /> : <ChevronUp size={18} className="text-slate-455" />}
                  </div>
                </div>

                {/* Accordion Content */}
                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      className="overflow-hidden bg-slate-50/50"
                    >
                      {deptCourses.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-xs italic">
                          No courses currently configured for this department.
                        </div>
                      ) : (
                        <div className="p-5 space-y-4">
                          {/* Semester selector tab bar */}
                          <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-[#E2E8F0]">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 mr-2 flex items-center gap-1.5">
                              <Sparkles size={12} className="text-[#7C3AED]" /> Filter by Semester:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {availableSemesters.map((sem) => (
                                <motion.button
                                  key={sem}
                                  whileHover={{ scale: 1.05, translateY: -1 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => setSelectedSemesters((prev) => ({ ...prev, [dept.id]: sem }))}
                                  className={`px-3 py-1.5 rounded-full text-xs font-black transition-all ${
                                    activeSem === sem
                                      ? "bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white shadow-md"
                                      : "bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0] hover:text-slate-800"
                                  }`}
                                >
                                  Semester {sem}
                                </motion.button>
                              ))}
                            </div>
                          </div>

                          {/* Filtered Courses List */}
                          {filteredDeptCourses.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-xs italic">
                              No courses found in Semester {activeSem} for this department.
                            </div>
                          ) : (
                            <div className="rounded-xl border border-[#E2E8F0] overflow-hidden shadow-sm bg-white">
                              <div className="grid grid-cols-5 p-4 bg-[#5B21B6] text-white text-xs font-bold uppercase tracking-wider">
                                <div className="col-span-2">Course Name</div>
                                <div>Level</div>
                                <div>Assigned Teacher</div>
                                <div className="text-right">Actions</div>
                              </div>
                              {filteredDeptCourses.map((course: any, idx: number) => {
                                const rowBg = idx % 2 === 0 ? "bg-white" : "bg-[#F8FAFC]";
                                let levelBadgeColor = "bg-purple-50 border-purple-200 text-[#7C3AED]";
                                if (course.level === "Beginner") {
                                  levelBadgeColor = "bg-emerald-50 border-emerald-200 text-emerald-700";
                                } else if (course.level === "Intermediate") {
                                  levelBadgeColor = "bg-blue-50 border-blue-200 text-blue-700";
                                } else if (course.level === "Advanced") {
                                  levelBadgeColor = "bg-purple-50 border-purple-200 text-purple-700";
                                }

                                return (
                                  <div
                                    key={course.id}
                                    className={cn(
                                      "grid grid-cols-5 p-4 items-center border-b border-[#E2E8F0] last:border-b-0 text-[#1E293B] text-sm transition-colors",
                                      rowBg,
                                      "hover:bg-[#F3E8FF] transition-all"
                                    )}
                                  >
                                    <div className="col-span-2 font-semibold text-slate-800 flex items-center gap-2">
                                      <span className="text-[#7C3AED] shrink-0 select-none">📖</span>
                                      <span className="truncate">{course.title}</span>
                                    </div>
                                    <div>
                                      <span className={`px-2.5 py-0.5 border rounded-full text-[10px] font-black uppercase tracking-wider ${levelBadgeColor}`}>
                                        {course.level}
                                      </span>
                                    </div>
                                    <div className="text-slate-700 font-semibold flex items-center gap-1.5">
                                      <span className="text-xs shrink-0 select-none">👨‍🏫</span>
                                      <span className="truncate">{course.teacherName || "Unassigned"}</span>
                                    </div>
                                    <div className="text-right">
                                      <button
                                        onClick={() => {
                                          setEditCourse(course);
                                          setEditTeacherId(course.teacherId);
                                          setIsEditModalOpen(true);
                                        }}
                                        className="text-[#7C3AED] hover:text-[#5B21B6] text-xs px-3 py-1.5 bg-[#F3E8FF] rounded-lg border border-[#E9D5FF] hover:bg-[#E9D5FF]/80 transition-all font-bold"
                                      >
                                        Reassign
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          {/* Unassigned Department Courses Accordion */}
          {coursesByDept["Unassigned"] && coursesByDept["Unassigned"].length > 0 && (
            <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-sm hover:shadow-md transition-shadow relative border-l-4 border-l-slate-500">
              {/* Gradient Strip for Unassigned */}
              <div className="h-1.5 w-full bg-gradient-to-r from-slate-500 to-slate-400" />
              
              <div
                onClick={() => toggleCollapse("unassigned")}
                className="flex flex-col md:flex-row justify-between md:items-center p-5 cursor-pointer hover:bg-slate-50 transition-colors border-b border-[#E2E8F0] gap-4 select-none"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0 shadow-sm">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-800 leading-tight tracking-tight">Unassigned Department Courses</h3>
                    <p className="text-xs text-slate-500 mt-1 font-medium">Courses not mapped to any specific department category.</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex gap-2 text-xs font-bold select-none">
                    <span className="px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center gap-1.5 shadow-sm">
                      📚 {coursesByDept["Unassigned"].length} Courses
                    </span>
                  </div>
                  {collapsedDepts["unassigned"] ? <ChevronDown size={18} className="text-slate-455" /> : <ChevronUp size={18} className="text-slate-455" />}
                </div>
              </div>

              {/* Accordion Content for Unassigned */}
              <AnimatePresence initial={false}>
                {!collapsedDepts["unassigned"] && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden bg-slate-50/50"
                  >
                    <div className="p-5 space-y-4">
                      {/* Semester tabs selector for unassigned */}
                      {(() => {
                        const unassignedCourses = coursesByDept["Unassigned"] || [];
                        const unassignedAvailableSemesters = [1, 2, 3, 4, 5, 6, 7, 8];
                        const activeUnassignedSem = selectedSemesters["unassigned"] || 1;
                        const filteredUnassignedCourses = unassignedCourses.filter((c: any) => (c.semester || 1) === activeUnassignedSem);

                        return (
                          <>
                            <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-[#E2E8F0]">
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 mr-2 flex items-center gap-1.5">
                                <Sparkles size={12} className="text-[#7C3AED]" /> Filter by Semester:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {unassignedAvailableSemesters.map((sem) => (
                                  <motion.button
                                    key={sem}
                                    whileHover={{ scale: 1.05, translateY: -1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setSelectedSemesters((prev) => ({ ...prev, unassigned: sem }))}
                                    className={`px-3 py-1.5 rounded-full text-xs font-black transition-all ${
                                      activeUnassignedSem === sem
                                        ? "bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white shadow-md"
                                        : "bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0] hover:text-slate-800"
                                    }`}
                                  >
                                    Semester {sem}
                                  </motion.button>
                                ))}
                              </div>
                            </div>

                            {filteredUnassignedCourses.length === 0 ? (
                              <div className="p-8 text-center text-slate-400 text-xs italic">
                                No unassigned courses found in Semester {activeUnassignedSem}.
                              </div>
                            ) : (
                              <div className="rounded-xl border border-[#E2E8F0] overflow-hidden shadow-sm bg-white">
                                <div className="grid grid-cols-5 p-4 bg-[#5B21B6] text-white text-xs font-bold uppercase tracking-wider">
                                  <div className="col-span-2">Course Name</div>
                                  <div>Level</div>
                                  <div>Assigned Teacher</div>
                                  <div className="text-right">Actions</div>
                                </div>
                                {filteredUnassignedCourses.map((course: any, idx: number) => {
                                  const rowBg = idx % 2 === 0 ? "bg-white" : "bg-[#F8FAFC]";
                                  let levelBadgeColor = "bg-purple-50 border-purple-200 text-[#7C3AED]";
                                  if (course.level === "Beginner") {
                                    levelBadgeColor = "bg-emerald-50 border-emerald-200 text-emerald-700";
                                  } else if (course.level === "Intermediate") {
                                    levelBadgeColor = "bg-blue-50 border-blue-200 text-blue-700";
                                  } else if (course.level === "Advanced") {
                                    levelBadgeColor = "bg-purple-50 border-purple-200 text-purple-700";
                                  }

                                  return (
                                    <div
                                      key={course.id}
                                      className={cn(
                                        "grid grid-cols-5 p-4 items-center border-b border-[#E2E8F0] last:border-b-0 text-[#1E293B] text-sm transition-colors",
                                        rowBg,
                                        "hover:bg-[#F3E8FF] transition-all"
                                      )}
                                    >
                                      <div className="col-span-2 font-semibold text-slate-800 flex items-center gap-2">
                                        <span className="text-[#7C3AED] shrink-0 select-none">📖</span>
                                        <span className="truncate">{course.title}</span>
                                      </div>
                                      <div>
                                        <span className={`px-2.5 py-0.5 border rounded-full text-[10px] font-black uppercase tracking-wider ${levelBadgeColor}`}>
                                          {course.level}
                                        </span>
                                      </div>
                                      <div className="text-slate-700 font-semibold flex items-center gap-1.5">
                                        <span className="text-xs shrink-0 select-none">👨‍🏫</span>
                                        <span className="truncate">{course.teacherName || "Unassigned"}</span>
                                      </div>
                                      <div className="text-right">
                                        <button
                                          onClick={() => {
                                            setEditCourse(course);
                                            setEditTeacherId(course.teacherId);
                                            setIsEditModalOpen(true);
                                          }}
                                          className="text-[#7C3AED] hover:text-[#5B21B6] text-xs px-3 py-1.5 bg-[#F3E8FF] rounded-lg border border-[#E9D5FF] hover:bg-[#E9D5FF]/80 transition-all font-bold"
                                        >
                                          Reassign
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* Creation Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: "-40%" }} animate={{ opacity: 1, scale: 1, y: "-50%" }} exit={{ opacity: 0, scale: 0.95, y: "-40%" }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 z-50 w-full max-w-xl"
            >
              <div className="bg-white p-8 rounded-2xl border border-[#E2E8F0] shadow-2xl relative">
                <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
                <h2 className="text-2xl font-bold mb-6 text-slate-800">Create New Course</h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <AnimatedInput
                    label="Course Title"
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                  />
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1 ml-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent transition-all resize-none animate-none"
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-500 mb-1 ml-1">Level</label>
                      <select 
                        value={formData.level}
                        onChange={(e) => setFormData({...formData, level: e.target.value})}
                        className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent transition-all"
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-500 mb-1 ml-1">Semester</label>
                      <select 
                        value={formData.semester}
                        onChange={(e) => setFormData({...formData, semester: parseInt(e.target.value) || 1})}
                        className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent transition-all"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                          <option key={sem} value={sem}>Semester {sem}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-500 mb-1 ml-1">Department</label>
                      <select 
                        value={formData.categoryId}
                        onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                        className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent transition-all"
                      >
                        <option value="">Select Department</option>
                        {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1 ml-1">Assign Teacher</label>
                    <select 
                      value={formData.teacherId}
                      onChange={(e) => setFormData({...formData, teacherId: e.target.value})}
                      required
                      className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent transition-all"
                    >
                      <option value="">Select a Teacher</option>
                      {teachers.map((t: any) => <option key={t.id} value={t.id}>{t.name} ({t.email})</option>)}
                    </select>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <AnimatedButton type="submit" isLoading={createMutation.isPending}>
                      Create Course
                    </AnimatedButton>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditModalOpen && editCourse && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsEditModalOpen(false)}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: "-40%" }} animate={{ opacity: 1, scale: 1, y: "-50%" }} exit={{ opacity: 0, scale: 0.95, y: "-40%" }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 z-50 w-full max-w-xl"
            >
              <div className="bg-white p-8 rounded-2xl border border-[#E2E8F0] shadow-2xl relative">
                <button onClick={() => setIsEditModalOpen(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
                <h2 className="text-2xl font-bold mb-6 text-slate-800">Reassign Teacher</h2>
                <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-[#E2E8F0]">
                  <p className="text-sm text-slate-500 mb-1">Course</p>
                  <p className="font-semibold text-lg text-slate-800">{editCourse.title}</p>
                </div>
                
                <form onSubmit={handleUpdate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1 ml-1">Assign New Teacher</label>
                    <select 
                      value={editTeacherId}
                      onChange={(e) => setEditTeacherId(e.target.value)}
                      className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent transition-all"
                      required
                    >
                      <option value="">Select a Teacher</option>
                      {teachers.map((t: any) => <option key={t.id} value={t.id}>{t.name} ({t.email})</option>)}
                    </select>
                  </div>
                  <div className="pt-4 flex justify-end gap-3">
                    <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)} className="text-slate-650 hover:bg-slate-50">Cancel</Button>
                    <Button type="submit" disabled={updateMutation.isPending} className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white min-w-[120px] rounded-xl font-bold transition-all shadow-sm">
                      {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
