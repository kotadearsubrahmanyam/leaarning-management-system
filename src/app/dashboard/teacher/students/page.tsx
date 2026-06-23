"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Search, ChevronRight, User, Award, BookOpen } from "lucide-react";
import { AnimatedInput } from "@/components/ui/animated-input";
import { Button } from "@/components/ui/button";

export default function TeacherStudentsPage() {
  const [search, setSearch] = useState("");
  const [filterFailedOnly, setFilterFailedOnly] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const { data: studentsData, isLoading } = useQuery({
    queryKey: ["teacherStudents"],
    queryFn: async () => {
      const res = await fetch("/api/teacher/students");
      if (!res.ok) throw new Error("Failed to fetch students");
      return res.json();
    },
  });

  const students = studentsData?.data?.students || [];
  const filteredStudents = students.filter((s: any) => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
      (s.rollNumber || "").toLowerCase().includes(search.toLowerCase());
    const matchesFailed = !filterFailedOnly || s.hasFailedSubject;
    return matchesSearch && matchesFailed;
  });

  return (
    <div className="max-w-7xl mx-auto pb-12 relative z-10 flex flex-col h-[85vh]">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex-shrink-0">
        <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-3">
          <Users size={32} /> Student Directory & Monitoring
        </h1>
        <p className="text-foreground/70">
          Monitor your students' academic progress, attendance, and extracurricular activities.
        </p>
      </motion.div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Left Panel: Student List */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="w-1/3 flex flex-col min-h-0 glass rounded-3xl border border-white/10 overflow-hidden">
          <div className="p-6 border-b border-white/10 shrink-0 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white border border-purple-200 text-slate-400 shadow-[0_4px_10px_rgba(124,58,237,0.04)]">
                <Search size={18} />
              </div>
              <AnimatedInput
                placeholder="Search by name or roll number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 px-1">
              <input
                type="checkbox"
                id="failedFilter"
                checked={filterFailedOnly}
                onChange={(e) => setFilterFailedOnly(e.target.checked)}
                className="rounded border-white/20 bg-white/5 text-primary focus:ring-primary/30 h-4 w-4 accent-purple-600 cursor-pointer"
              />
              <label htmlFor="failedFilter" className="text-xs font-semibold text-foreground/80 cursor-pointer select-none">
                Show failed students for my subjects only
              </label>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {isLoading ? (
              [1,2,3,4].map(i => <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />)
            ) : filteredStudents.length === 0 ? (
              <div className="text-center p-8 text-foreground/50">No students found.</div>
            ) : (
              filteredStudents.map((student: any) => (
                <button
                  key={student.id}
                  onClick={() => setSelectedStudentId(student.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between group ${
                    selectedStudentId === student.id 
                      ? "bg-primary/10 border-primary/30" 
                      : "bg-white/5 border-transparent hover:bg-white/10"
                  }`}
                >
                  <div className="min-w-0 flex-1 mr-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-foreground truncate">{student.name}</h3>
                      {student.hasFailedSubject && (
                        <span className="h-2 w-2 rounded-full bg-red-500 shrink-0 animate-pulse" title="Has failed subject(s)" />
                      )}
                    </div>
                    <p className="text-xs text-foreground/60">{student.rollNumber || "N/A"}</p>
                  </div>
                  <ChevronRight size={18} className={`transition-transform shrink-0 ${selectedStudentId === student.id ? "text-primary translate-x-1" : "text-foreground/30 group-hover:text-foreground/60"}`} />
                </button>
              ))
            )}
          </div>
        </motion.div>

        {/* Right Panel: Detailed Profile */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-2/3 min-h-0 glass rounded-3xl border border-white/10 overflow-hidden flex flex-col">
          <AnimatePresence mode="wait">
            {!selectedStudentId ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center p-12 text-center text-foreground/50">
                <User size={64} className="mb-4 text-foreground/20" />
                <h3 className="text-xl font-bold text-foreground mb-2">Select a Student</h3>
                <p>Choose a student from the directory to view their complete academic and activity profile.</p>
              </motion.div>
            ) : (
              <StudentDetailView key={selectedStudentId} studentId={selectedStudentId} />
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

function StudentDetailView({ studentId }: { studentId: string }) {
  const [generatingPlanId, setGeneratingPlanId] = useState<string | null>(null);
  
  const { data, isLoading } = useQuery({
    queryKey: ["teacherStudentDetail", studentId],
    queryFn: async () => {
      const res = await fetch(`/api/teacher/students/${studentId}`);
      if (!res.ok) throw new Error("Failed to fetch student details");
      return res.json();
    },
  });

  if (isLoading) {
    return <div className="flex-1 flex justify-center items-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div></div>;
  }

  const student = data?.data?.student;
  if (!student) return <div className="p-8 text-center text-destructive">Student not found.</div>;

  const totalAtt = student.attendance?.length || 0;
  const presentCount = student.attendance?.filter((a: any) => a.status === 'PRESENT').length || 0;
  const attPercent = totalAtt === 0 ? 0 : Math.round((presentCount / totalAtt) * 100);

  const generateMentoringPlan = async (courseId: string) => {
    setGeneratingPlanId(courseId);
    try {
      const res = await fetch("/api/teacher/mentoring/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, courseId })
      });
      const resData = await res.json();
      if (resData.success) {
        alert("Recovery Learning Pathway generated successfully! The student can now view it in their dashboard.");
      } else {
        alert("Error: " + resData.message);
      }
    } catch (err) {
      alert("Failed to generate plan.");
    } finally {
      setGeneratingPlanId(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header Info */}
      <div className="p-8 border-b border-white/10 shrink-0 bg-white/5 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mt-20 -mr-20 pointer-events-none" />
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary to-accent p-1">
            <div className="w-full h-full bg-background rounded-full flex items-center justify-center">
              <User size={32} className="text-primary" />
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-1">{student.name}</h2>
            <div className="flex flex-wrap items-center gap-3 text-sm text-foreground/70">
              <span className="font-mono">{student.rollNumber || "No Roll #"}</span>
              <span className="w-1 h-1 bg-white/30 rounded-full" />
              <span>{student.email}</span>
              <span className="w-1 h-1 bg-white/30 rounded-full" />
              <span className="px-2 py-0.5 rounded-full bg-white/10">Sem {student.semester || 1}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Details */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
        
        {/* KPI Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="glass p-5 rounded-2xl border border-white/10">
            <div className="text-foreground/50 text-sm mb-1">Attendance</div>
            <div className={`text-3xl font-black ${attPercent < 75 ? 'text-red-500' : 'text-green-500'}`}>{attPercent}%</div>
          </div>
          <div className="glass p-5 rounded-2xl border border-white/10">
            <div className="text-foreground/50 text-sm mb-1">Enrolled Courses</div>
            <div className="text-3xl font-black text-foreground">{student.enrollments?.length || 0}</div>
          </div>
          <div className="glass p-5 rounded-2xl border border-white/10">
            <div className="text-foreground/50 text-sm mb-1">Activities Logged</div>
            <div className="text-3xl font-black text-primary">{student.activities?.length || 0}</div>
          </div>
        </div>

        {/* Results & Backlogs Section */}
        <div>
          <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Award size={20} className="text-primary" /> Academic Results & Backlogs
          </h3>
          {!student.results || student.results.length === 0 ? (
            <div className="p-6 bg-white/5 rounded-2xl text-center text-foreground/50 text-sm border border-white/5">
              No academic results recorded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {student.results.map((res: any) => (
                <div key={res.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 gap-3 hover:bg-white/10 transition-colors">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{res.course?.title || res.subjectName || "Unknown Course"}</span>
                      {res.status === 'FAIL' && (
                        <span className="px-2 py-0.5 text-[9px] font-bold bg-red-500/20 text-red-500 rounded-full border border-red-500/30 uppercase tracking-wider">
                          Failed
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-foreground/60 mt-1.5">
                      Grade: <span className="font-bold text-foreground/80">{res.grade}</span> | Marks: {res.marks} | Semester {res.semester}
                    </p>
                  </div>
                  {res.canGeneratePathway && (
                    <Button
                      onClick={() => generateMentoringPlan(res.courseId)}
                      disabled={generatingPlanId !== null}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md text-xs py-1.5 px-3 h-auto shrink-0 transition-all font-bold"
                    >
                      {generatingPlanId === res.courseId ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-white mr-1.5"></div>
                      ) : (
                        <span className="mr-1.5">✨</span>
                      )}
                      Generate Pathway
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activities Section */}
        <div>
          <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2"><Award size={20} className="text-primary" /> Student Activities</h3>
          {student.activities?.length === 0 ? (
            <div className="p-6 bg-white/5 rounded-2xl text-center text-foreground/50 text-sm border border-white/5">No activities logged yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {student.activities?.map((act: any) => (
                <div key={act.id} className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-sm text-foreground">{act.title}</h4>
                    <span className="text-[10px] uppercase tracking-wider font-bold bg-primary/20 text-primary px-2 py-1 rounded-full">{act.type}</span>
                  </div>
                  <p className="text-xs text-foreground/60 mb-3 line-clamp-2">{act.description}</p>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-foreground/40">{new Date(act.date).toLocaleDateString()}</span>
                    {act.proofUrl && <a href={act.proofUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">View Proof</a>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Courses Section */}
        <div>
          <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2"><BookOpen size={20} className="text-primary" /> Enrolled Courses</h3>
          <div className="space-y-3">
            {student.enrollments?.map((enr: any) => (
              <div key={enr.id} className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/10">
                <span className="font-semibold text-sm">{enr.course?.title}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${enr.status === 'ACTIVE' ? 'bg-green-500/20 text-green-500' : 'bg-white/10 text-foreground/60'}`}>{enr.status}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </motion.div>
  );
}
