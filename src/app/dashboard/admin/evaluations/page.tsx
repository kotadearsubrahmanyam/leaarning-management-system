"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Upload,
  UserCheck,
  EyeOff,
  CheckCircle2,
  Clock,
  X,
  Users,
  Settings,
  FolderOpen
} from "lucide-react";

export default function AdminEvaluationsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Bulk Selection States
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedSemester, setSelectedSemester] = useState<number | "">("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [courseFacultyMap, setCourseFacultyMap] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<File[]>([]);
  const [studentTab, setStudentTab] = useState<"unassigned" | "assigned">("unassigned");

  // File parsing states
  const [detectedStudents, setDetectedStudents] = useState<any[]>([]);
  const [detectedCourses, setDetectedCourses] = useState<any[]>([]);
  const [unmatchedFiles, setUnmatchedFiles] = useState<string[]>([]);

  // Fetch Data
  const { data: evalsData, isLoading } = useQuery({
    queryKey: ["adminEvaluations"],
    queryFn: async () => (await fetch("/api/admin/evaluations")).json(),
  });

  const { data: usersData } = useQuery({
    queryKey: ["allUsers"],
    queryFn: async () => (await fetch("/api/admin/users")).json(),
  });

  const { data: coursesData } = useQuery({
    queryKey: ["allCourses"],
    queryFn: async () => (await fetch("/api/admin/courses")).json(),
  });

  const { data: deptsData } = useQuery({
    queryKey: ["allDepartments"],
    queryFn: async () => (await fetch("/api/departments")).json(),
  });

  const evaluations = evalsData?.data || [];
  const allUsers = usersData?.data?.users || [];
  const allCourses = coursesData?.data?.courses || [];
  const departments = deptsData?.data?.departments || [];

  const students = allUsers.filter((u: any) => u.role === "STUDENT");
  const faculties = allUsers.filter((u: any) => u.role === "TEACHER");

  // Filter students driven strictly by uploaded files
  const filteredStudents = useMemo(() => {
    if (files.length > 0) {
      return detectedStudents;
    }
    return [];
  }, [files, detectedStudents]);

  // Filter courses driven strictly by uploaded files
  const filteredCourses = useMemo(() => {
    if (files.length > 0) {
      return detectedCourses;
    }
    return [];
  }, [files, detectedCourses]);

  // Categorize students into Unassigned Queue and Assigned Archive
  const { unassignedStudents, assignedStudents } = useMemo(() => {
    const unassigned: any[] = [];
    const assigned: any[] = [];

    filteredStudents.forEach((student: any) => {
      // Check if this student already has blind evaluations generated for ANY of the filtered courses
      const hasEvaluation = evaluations.some((ev: any) => 
        ev.studentId === student.id && 
        filteredCourses.some((c: any) => c.id === ev.courseId)
      );

      if (hasEvaluation) {
        assigned.push(student);
      } else {
        unassigned.push(student);
      }
    });

    return { unassignedStudents: unassigned, assignedStudents: assigned };
  }, [filteredStudents, evaluations, filteredCourses]);

  // Helper to filter faculties teaching a specific course
  const courseFaculties = useMemo(() => {
    return (course: any) => {
      if (course.faculties && course.faculties.length > 0) {
        return course.faculties;
      }
      const teaching = faculties.filter((f: any) => f.id === course.teacherId);
      if (teaching.length > 0) return teaching;
      // Fallback to department teachers
      return faculties.filter((f: any) => !selectedDept || f.departmentId === selectedDept);
    };
  }, [faculties, selectedDept]);

  // Calculate pending evaluation counts for each faculty member
  const facultyPendingCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    evaluations.forEach((ev: any) => {
      if (ev.status === "PENDING") {
        counts[ev.facultyId] = (counts[ev.facultyId] || 0) + 1;
      }
    });
    return counts;
  }, [evaluations]);

  // Auto-populate course-faculty mapping
  React.useEffect(() => {
    if (filteredCourses.length > 0) {
      setCourseFacultyMap(prev => {
        const next = { ...prev };
        let updated = false;
        filteredCourses.forEach((c: any) => {
          if (!next[c.id] && c.teacherId) {
            next[c.id] = c.teacherId;
            updated = true;
          }
        });
        return updated ? next : prev;
      });
    }
  }, [filteredCourses]);

  const handleFileChange = (uploadedFiles: File[]) => {
    setFiles(uploadedFiles);
    
    if (uploadedFiles.length === 0) {
      setDetectedStudents([]);
      setDetectedCourses([]);
      setUnmatchedFiles([]);
      return;
    }

    const matchedStudentsMap = new Map<string, any>();
    const matchedCoursesMap = new Map<string, any>();
    const unmatched: string[] = [];

    uploadedFiles.forEach(file => {
      const fileNameLower = file.name.toLowerCase();
      
      // 1. Find matching student by roll number
      const matchedStudent = students.find((s: any) => {
        if (!s.rollNumber) return false;
        const rollLower = s.rollNumber.toLowerCase();
        return fileNameLower.startsWith(rollLower) || fileNameLower.includes(rollLower);
      });

      // 2. Find matching course using word-scoring to prevent false positives
      let matchedCourse: any = null;
      let highestScore = 0;

      allCourses.forEach((c: any) => {
        if (!c.title) return;
        
        const cleanedTitle = c.title.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
        const cleanedFileName = file.name.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
        
        // Exact cleaned title match has highest priority
        if (cleanedFileName.includes(cleanedTitle)) {
          const score = cleanedTitle.length * 10;
          if (score > highestScore) {
            highestScore = score;
            matchedCourse = c;
          }
          return;
        }

        // Token word match
        const words = c.title.toLowerCase().split(/\s+/).filter((w: string) => w.length > 2 && w !== "and" && w !== "for" && w !== "the");
        let matchedWordsCount = 0;
        words.forEach((word: string) => {
          if (cleanedFileName.includes(word)) {
            matchedWordsCount++;
          }
        });

        if (words.length > 0) {
          const score = (matchedWordsCount / words.length) * 100;
          if (score >= 50 && score > highestScore) {
            highestScore = score;
            matchedCourse = c;
          }
        }
      });

      if (matchedStudent) {
        matchedStudentsMap.set(matchedStudent.id, matchedStudent);
      }
      if (matchedCourse) {
        matchedCoursesMap.set(matchedCourse.id, matchedCourse);
      }

      if (!matchedStudent || !matchedCourse) {
        unmatched.push(file.name);
      }
    });

    const parsedStudents = Array.from(matchedStudentsMap.values());
    const parsedCourses = Array.from(matchedCoursesMap.values());

    setDetectedStudents(parsedStudents);
    setDetectedCourses(parsedCourses);
    setUnmatchedFiles(unmatched);

    // Auto-select department and semester based on the majority of detected students
    if (parsedStudents.length > 0) {
      const deptCounts: Record<string, number> = {};
      const semCounts: Record<number, number> = {};
      parsedStudents.forEach(s => {
        if (s.departmentId) deptCounts[s.departmentId] = (deptCounts[s.departmentId] || 0) + 1;
        if (s.semester) semCounts[s.semester] = (semCounts[s.semester] || 0) + 1;
      });

      // Find highest count department
      let bestDept = "";
      let maxDeptCount = 0;
      Object.entries(deptCounts).forEach(([deptId, count]) => {
        if (count > maxDeptCount) {
          bestDept = deptId;
          maxDeptCount = count;
        }
      });

      // Find highest count semester
      let bestSem: number | "" = "";
      let maxSemCount = 0;
      Object.entries(semCounts).forEach(([sem, count]) => {
        if (count > maxSemCount) {
          bestSem = Number(sem);
          maxSemCount = count;
        }
      });

      if (bestDept) setSelectedDept(bestDept);
      if (bestSem) setSelectedSemester(bestSem);
      
      // Auto-select all detected students
      setSelectedStudentIds(parsedStudents.map(s => s.id));
    }
  };

  const handleResetFiles = () => {
    setFiles([]);
    setDetectedStudents([]);
    setDetectedCourses([]);
    setUnmatchedFiles([]);
    setSelectedStudentIds([]);
    setSelectedDept("");
    setSelectedSemester("");
  };

  // Auto-reset uploader once all students in the uploaded batch have been successfully assigned
  React.useEffect(() => {
    if (files.length > 0 && unassignedStudents.length === 0 && assignedStudents.length > 0) {
      handleResetFiles();
    }
  }, [unassignedStudents, assignedStudents, files]);

  const handleSelectAllStudents = () => {
    const currentList = studentTab === "unassigned" ? unassignedStudents : assignedStudents;
    if (selectedStudentIds.length === currentList.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(currentList.map((s: any) => s.id));
    }
  };

  const handleSelectTop20 = () => {
    const top20Ids = unassignedStudents.slice(0, 20).map((s: any) => s.id);
    setSelectedStudentIds(top20Ids);
  };

  const handleToggleStudent = (id: string) => {
    setSelectedStudentIds(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/admin/evaluations/bulk", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["adminEvaluations"] });
      alert(data.message || "Bulk distribution deployed successfully!");
      // Keep the modal open and files loaded for seamless batching, just clear the student selections
      setSelectedStudentIds([]);
    },
    onError: (error: any) => {
      console.error("Bulk distribution deployment failed:", error);
      alert(`Failed to deploy bulk distribution: ${error.message}`);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStudentIds.length === 0) {
      return alert("Please select at least one student.");
    }
    
    // Strict validation: Ensure a non-empty faculty ID is assigned for every course
    const unassignedCourses = filteredCourses.filter(course => !courseFacultyMap[course.id]);
    if (unassignedCourses.length > 0) {
      const titles = unassignedCourses.map(c => `"${c.title}"`).join(", ");
      return alert(`Please assign a faculty to every course. Unassigned course(s): ${titles}`);
    }

    const assignments: any[] = [];
    
    // For each selected student, assign all courses to their mapped faculties
    selectedStudentIds.forEach(studentId => {
      const student = students.find((s: any) => s.id === studentId);
      filteredCourses.forEach((course: any) => {
        const facultyId = courseFacultyMap[course.id];
        
        // Smart filename mapping (e.g. "RollNumber_CourseTitle.pdf" or simply checking if filename includes both)
        let mappedFileName = undefined;
        if (student && files.length > 0) {
          const matchingFile = files.find(f => {
            const fileNameLower = f.name.toLowerCase();
            const rollLower = (student.rollNumber || "").toLowerCase();
            const isStudentMatch = fileNameLower.startsWith(rollLower) || fileNameLower.includes(rollLower);
            if (!isStudentMatch) return false;

            const cleanedTitle = course.title.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
            const cleanedFileName = f.name.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
            
            if (cleanedFileName.includes(cleanedTitle)) return true;

            const words = course.title.toLowerCase().split(/\s+/).filter((w: string) => w.length > 2 && w !== "and" && w !== "for" && w !== "the");
            let matchedWordsCount = 0;
            words.forEach((word: string) => {
              if (cleanedFileName.includes(word)) {
                matchedWordsCount++;
              }
            });

            return words.length > 0 && (matchedWordsCount / words.length) >= 0.5;
          });
          if (matchingFile) mappedFileName = matchingFile.name;
        }

        assignments.push({
          studentId,
          courseId: course.id,
          facultyId,
          fileName: mappedFileName
        });
      });
    });

    const formData = new FormData();
    formData.append("assignments", JSON.stringify(assignments));
    files.forEach(file => formData.append("files", file));
    
    uploadMutation.mutate(formData);
  };

  return (
    <div className="max-w-7xl mx-auto pb-12 relative z-10">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-3">
            <EyeOff size={32} /> END SEM EVALUATION
          </h1>
          <p className="text-foreground/70 text-sm">assign sem end papers to faculty</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:scale-105"
        >
          <Upload size={20} /> Bulk Distribution Engine
        </button>
      </motion.div>

      {/* Evaluations Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-40 glass rounded-3xl animate-pulse" />)}
        </div>
      ) : evaluations.length === 0 ? (
        <div className="p-12 text-center text-foreground/50 glass rounded-3xl border border-white/10">
          <FileText size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-xl font-semibold">No Evaluation Tasks Created</p>
          <p className="text-sm mt-2">Open the Distribution Engine to assign papers.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {evaluations.map((ev: any, i: number) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              key={ev.id}
              className="glass p-6 rounded-3xl border border-white/10 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="px-3 py-1 bg-black/40 border border-white/10 rounded-lg text-xs font-mono text-foreground/70 flex items-center gap-2">
                    <FileText size={14} /> ID: {ev.id.substring(0,8)}...
                  </span>
                  {ev.status === "EVALUATED" ? (
                    <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full text-xs font-bold border border-emerald-400/20">
                      <CheckCircle2 size={14} /> EVALUATED
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full text-xs font-bold border border-amber-400/20">
                      <Clock size={14} /> PENDING
                    </span>
                  )}
                </div>
                
                <h3 className="font-bold text-lg text-foreground mb-1">{ev.course?.title}</h3>
                <div className="space-y-2 mt-4">
                  <p className="text-sm flex items-center gap-2 text-foreground/70">
                    <UserCheck size={16} className="text-primary" /> 
                    Assigned to: <span className="font-bold text-foreground">{ev.faculty?.name}</span>
                  </p>
                  <p className="text-sm flex items-center gap-2 text-foreground/70">
                    <EyeOff size={16} className="text-purple-400" /> 
                    Hidden Student ID: <span className="font-mono text-xs">{ev.studentId.substring(0,12)}</span>
                  </p>
                </div>
              </div>
              
              {ev.status === "EVALUATED" && (
                <div className="mt-6 pt-4 border-t border-white/10 flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-foreground/50">Marks Awarded</span>
                    <span className="text-2xl font-black text-emerald-400">{ev.marks}</span>
                  </div>
                  {ev.comments && (
                    <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 text-xs leading-relaxed text-slate-600 mt-1">
                      <span className="font-bold text-[#7C3AED] block mb-1">Evaluator Notes:</span>
                      {ev.comments}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Bulk Distribution Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsModalOpen(false);
            }}
            className="fixed inset-0 bg-[#2E1065]/20 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-6 transition-all duration-300 modal-backdrop-layout"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.45, bounce: 0.15 }}
              className="bg-white/95 backdrop-blur-md border border-purple-200/80 rounded-[24px] w-full max-w-5xl max-h-[90vh] shadow-[0_25px_60px_-15px_rgba(124,58,237,0.22)] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with Purple Gradient */}
              <div className="p-6 bg-gradient-to-r from-[#5B21B6] via-[#7C3AED] to-[#9333EA] text-white flex justify-between items-center shrink-0 border-b border-purple-500/30 shadow-md">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Settings className="text-purple-200" size={24} /> Bulk Distribution Engine
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="text-white/80 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-xl border border-white/10 animate-hover"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-gradient-to-b from-[#FAF5FF]/50 to-white">
                {/* Step 1: Upload Scanned Exam Papers */}
                <div className="bg-purple-50/40 p-6 rounded-2xl border border-purple-100/80 space-y-4 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-bold text-purple-950 flex items-center gap-2">
                        <Upload size={20} className="text-[#7C3AED]" /> Step 1: Upload Scanned Exam Papers
                      </h3>
                      <p className="text-xs text-purple-800/70 mt-1">
                        Select multiple PDF files at once. The system will auto-detect the students and subjects based on filenames.
                      </p>
                    </div>
                    {files.length > 0 && (
                      <button
                        type="button"
                        onClick={handleResetFiles}
                        className="text-xs font-bold bg-rose-50 text-rose-600 px-3 py-1.5 rounded-lg hover:bg-rose-100 transition-colors border border-rose-200"
                      >
                        Reset Uploaded Files
                      </button>
                    )}
                  </div>
                  
                  <div className="flex gap-4 items-center">
                    <input
                      type="file"
                      multiple
                      accept="application/pdf"
                      onChange={(e) => handleFileChange(Array.from(e.target.files || []))}
                      className="flex-1 text-sm text-purple-800/60 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border file:border-purple-200 file:text-sm file:font-bold file:bg-white file:text-[#7C3AED] hover:file:bg-purple-50 transition-colors cursor-pointer"
                    />
                  </div>

                  {files.length > 0 && (
                    <div className="bg-white/90 border border-purple-100/60 rounded-xl p-4 space-y-3 shadow-xs">
                      <div className="flex flex-wrap gap-4 text-xs font-bold">
                        <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60 shadow-xs">
                          ✓ {files.length} Total PDF Files Uploaded
                        </span>
                        <span className="text-[#7C3AED] bg-[#7C3AED]/5 px-2.5 py-1 rounded-full border border-[#7C3AED]/15 shadow-xs">
                          ✓ {detectedStudents.length} Students Detected
                        </span>
                        <span className="text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200/60 shadow-xs">
                          ✓ {detectedCourses.length} Courses Detected
                        </span>
                      </div>

                      {unmatchedFiles.length > 0 && (
                        <div className="pt-2 border-t border-purple-100/60 text-xs">
                          <p className="text-amber-700 font-bold mb-1">
                            ⚠ {unmatchedFiles.length} files could not be mapped to any student or course (verify filenames):
                          </p>
                          <div className="max-h-24 overflow-y-auto text-purple-900/60 font-mono space-y-0.5 scrollbar-thin">
                            {unmatchedFiles.map((name, idx) => (
                              <div key={idx}>{name}</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Auto-Detected Cohort Details (only shown when files are uploaded) */}
                {files.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-purple-50/40 p-6 rounded-2xl border border-purple-100/80 shadow-sm">
                    <div>
                      <label className="block text-sm font-bold text-purple-900/60 mb-1">Detected Department</label>
                      <div className="bg-white/90 border border-purple-100/60 rounded-xl px-4 py-3 text-purple-950 font-bold shadow-xs">
                        {departments.find((d: any) => d.id === selectedDept)?.name || "Unknown Department"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-purple-900/60 mb-1">Detected Semester</label>
                      <div className="bg-white/90 border border-purple-100/60 rounded-xl px-4 py-3 text-purple-950 font-bold shadow-xs">
                        Semester {selectedSemester || "N/A"}
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Student Batch Selection */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-bold text-purple-950 flex items-center gap-2">
                        <Users size={20} className="text-[#7C3AED]" /> Target Students
                      </h3>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex gap-2 p-1 bg-purple-100/50 border border-purple-200/40 rounded-xl mb-3">
                      <button
                        type="button"
                        onClick={() => {
                          setStudentTab("unassigned");
                          setSelectedStudentIds([]);
                        }}
                        className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all duration-200 ${
                          studentTab === "unassigned"
                            ? "bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white shadow-md shadow-purple-500/10"
                            : "text-purple-700/80 hover:text-purple-950 hover:bg-purple-100/30"
                        }`}
                      >
                        Unassigned Queue ({unassignedStudents.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setStudentTab("assigned");
                          setSelectedStudentIds([]);
                        }}
                        className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all duration-200 ${
                          studentTab === "assigned"
                            ? "bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] text-white shadow-md shadow-purple-500/10"
                            : "text-purple-700/80 hover:text-purple-950 hover:bg-purple-100/30"
                        }`}
                      >
                        Assigned Archive ({assignedStudents.length})
                      </button>
                    </div>

                    {/* Controls Bar */}
                    <div className="flex justify-between items-center mb-3 h-8">
                      <span className="text-xs text-purple-800/60 font-semibold">
                        {studentTab === "unassigned" 
                          ? `${selectedStudentIds.length} of ${unassignedStudents.length} selected`
                          : `${assignedStudents.length} students assigned`
                        }
                      </span>
                      {studentTab === "unassigned" && unassignedStudents.length > 0 && (
                        <div className="flex gap-2">
                          <button 
                            type="button" 
                            onClick={handleSelectTop20}
                            className="text-xs font-bold bg-purple-50 text-[#7C3AED] px-3 py-1.5 rounded-lg hover:bg-purple-100/60 transition-colors border border-purple-200/50"
                          >
                            Select Top 20
                          </button>
                          <button 
                            type="button" 
                            onClick={handleSelectAllStudents}
                            className="text-xs font-bold bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white px-3 py-1.5 rounded-lg hover:from-[#6D28D9] hover:to-[#805AD5] transition-colors shadow-xs shadow-purple-500/10"
                          >
                            {selectedStudentIds.length === unassignedStudents.length ? "Deselect All" : "Select All"}
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="bg-purple-50/20 border border-purple-100 rounded-2xl overflow-hidden h-72 overflow-y-auto shadow-inner">
                      {files.length === 0 ? (
                        <div className="p-8 text-center text-purple-400/80 flex flex-col justify-center items-center h-full bg-white/70">
                          <Users size={36} className="mb-2 text-purple-300" />
                          <p className="text-sm font-bold text-purple-700/70">Not uploaded anything yet</p>
                          <p className="text-xs mt-1 text-purple-600/50">Please upload scanned exam papers in Step 1.</p>
                        </div>
                      ) : studentTab === "unassigned" ? (
                        unassignedStudents.length === 0 ? (
                          <div className="p-8 text-center text-purple-400 flex flex-col justify-center items-center h-full bg-white/70">
                            <CheckCircle2 size={36} className="mb-2 text-emerald-500 opacity-80 animate-bounce" />
                            <p className="text-sm font-bold text-emerald-700">All Students Assigned!</p>
                            <p className="text-xs mt-1 text-purple-600/60">No pending students in this department/semester.</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-purple-100 bg-white">
                            {unassignedStudents.map((s: any) => (
                              <label key={s.id} className="flex items-center gap-3 p-3.5 hover:bg-purple-50/50 cursor-pointer transition-colors bg-white">
                                <input 
                                  type="checkbox" 
                                  checked={selectedStudentIds.includes(s.id)}
                                  onChange={() => handleToggleStudent(s.id)}
                                  className="w-4 h-4 rounded border-purple-200 text-[#7C3AED] bg-white focus:ring-[#7C3AED] focus:ring-offset-0"
                                />
                                <div>
                                  <p className="text-sm font-bold text-purple-950">{s.name}</p>
                                  <p className="text-xs font-mono text-purple-600/60 mt-0.5">{s.rollNumber}</p>
                                </div>
                              </label>
                            ))}
                          </div>
                        )
                      ) : (
                        assignedStudents.length === 0 ? (
                          <div className="p-8 text-center text-sm text-purple-600/60 flex flex-col justify-center items-center h-full bg-white/70">
                            <p className="font-semibold">No assigned students found for these filters.</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-purple-100 bg-white">
                            {assignedStudents.map((s: any) => (
                              <div key={s.id} className="flex items-center justify-between p-3.5 hover:bg-purple-50/30 transition-colors bg-white">
                                <div>
                                  <p className="text-sm font-bold text-purple-950">{s.name}</p>
                                  <p className="text-xs font-mono text-purple-600/60 mt-0.5">{s.rollNumber}</p>
                                </div>
                                <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full text-xs font-bold border border-emerald-200 shadow-xs">
                                  <CheckCircle2 size={12} /> Assigned
                                </span>
                              </div>
                            ))}
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* Course-Faculty Matrix */}
                  <div>
                    <h3 className="text-lg font-bold text-purple-950 flex items-center gap-2 mb-4">
                      <FolderOpen size={20} className="text-[#10B981]" /> Course-Faculty Matrix
                    </h3>
                    <div className="bg-purple-50/20 border border-purple-100 rounded-2xl p-4 h-72 overflow-y-auto space-y-4 shadow-inner">
                      {files.length === 0 ? (
                        <div className="p-8 text-center text-purple-400/80 flex flex-col justify-center items-center h-full bg-white/70">
                          <FolderOpen size={36} className="mb-2 text-purple-300" />
                          <p className="text-sm font-bold text-purple-700/70">Not uploaded anything yet</p>
                          <p className="text-xs mt-1 text-purple-600/50">Please upload scanned exam papers in Step 1.</p>
                        </div>
                      ) : filteredCourses.length === 0 ? (
                        <p className="text-sm text-purple-600/60 font-semibold">No courses detected in uploaded files.</p>
                      ) : (
                        filteredCourses.map((course: any) => (
                          <div key={course.id} className="p-3.5 bg-white border border-purple-100/60 rounded-xl shadow-xs hover:border-purple-200 transition-all duration-200">
                            <p className="text-sm font-bold text-purple-950 mb-2">{course.title}</p>
                            <select
                              value={courseFacultyMap[course.id] || ""}
                              onChange={(e) => setCourseFacultyMap(prev => ({...prev, [course.id]: e.target.value}))}
                              className="w-full bg-white border border-purple-200 rounded-lg px-3 py-2 text-sm text-purple-950 focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/10 transition-all cursor-pointer"
                            >
                              <option value="">-- Assign Faculty for this Subject --</option>
                              {courseFaculties(course).map((f: any) => {
                                const pendingCount = facultyPendingCounts[f.id] || 0;
                                return (
                                  <option key={f.id} value={f.id}>
                                    {f.name} ({pendingCount} pending papers)
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-purple-100 bg-[#FAF5FF]/70 shrink-0 flex justify-between items-center shadow-inner">
                <p className="text-sm text-purple-800 font-bold">
                  Total Pending Slots: <span className="text-[#7C3AED] text-lg font-black ml-1">{selectedStudentIds.length * filteredCourses.length}</span>
                </p>
                <div className="flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)} 
                    className="px-6 py-2.5 rounded-xl font-bold text-purple-700 hover:bg-purple-50 border border-purple-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSubmit}
                    disabled={uploadMutation.isPending || selectedStudentIds.length === 0 || Object.keys(courseFacultyMap).length !== filteredCourses.length} 
                    className="px-6 py-2.5 rounded-xl font-bold bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white hover:from-[#6D28D9] hover:to-[#805AD5] transition-all duration-200 disabled:opacity-50 flex items-center gap-2 shadow-md shadow-purple-500/20 hover:scale-102 cursor-pointer disabled:pointer-events-none"
                  >
                    {uploadMutation.isPending ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Deploy Bulk Distribution"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
