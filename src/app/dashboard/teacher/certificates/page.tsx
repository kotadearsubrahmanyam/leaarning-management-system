"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { FileCheck, Plus, X, Download } from "lucide-react";
import { AnimatedButton } from "@/components/ui/animated-button";
import { CourseSelect } from "@/components/ui/course-select";

export default function TeacherCertificatesPage() {
  const queryClient = useQueryClient();
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState("");

  const { data: coursesData } = useQuery({
    queryKey: ["teacherCourses"],
    queryFn: async () => {
      const res = await fetch("/api/courses?teacherOnly=true");
      if (!res.ok) throw new Error("Failed to fetch courses");
      return res.json();
    },
  });

  const { data: certsData, isLoading: certsLoading } = useQuery({
    queryKey: ["teacherCerts", selectedCourse],
    queryFn: async () => {
      const url = selectedCourse ? `/api/teacher/certificates?courseId=${selectedCourse}` : "/api/teacher/certificates";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch certificates");
      return res.json();
    },
  });

  const { data: progressData } = useQuery({
    queryKey: ["teacherProgress", selectedCourse],
    queryFn: async () => {
      if (!selectedCourse) return null;
      const res = await fetch(`/api/teacher/progress?courseId=${selectedCourse}`);
      if (!res.ok) throw new Error("Failed to fetch progress");
      return res.json();
    },
    enabled: isModalOpen && !!selectedCourse,
  });

  const courses = coursesData?.data?.courses || [];
  const certificates = certsData?.data?.certificates || [];
  const students = progressData?.data?.progress || [];

  useEffect(() => {
    if (courses.length === 1 && !selectedCourse) {
      setSelectedCourse(courses[0].id);
    }
  }, [courses, selectedCourse]);

  const issueMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/teacher/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: selectedCourse, studentId: selectedStudent }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to issue certificate");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacherCerts", selectedCourse] });
      setIsModalOpen(false);
      setSelectedStudent("");
    },
    onError: (err: any) => {
      alert(err.message);
    }
  });

  const handleIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !selectedStudent) return;
    issueMutation.mutate();
  };

  return (
    <div className="max-w-6xl mx-auto pb-12 relative z-10">
      <div className="flex justify-between items-end mb-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-3">
            <FileCheck size={32} /> Certification
          </h1>
          <p className="text-foreground/70">Issue course completion certificates to students.</p>
        </motion.div>
        <AnimatedButton onClick={() => setIsModalOpen(true)}>
          <Plus size={18} className="mr-2 inline" /> Issue Certificate
        </AnimatedButton>
      </div>

      <div className="mb-8 max-w-2xl">
        <CourseSelect
          courses={courses}
          selectedCourse={selectedCourse}
          setSelectedCourse={setSelectedCourse}
          label="Filter Issued by Course"
          placeholder="Choose a course to filter certificates..."
          showClear={true}
          compact={true}
        />
      </div>

      <div className="glass rounded-3xl border border-white/10 overflow-hidden">
        <div className="grid grid-cols-4 bg-white/5 p-4 font-semibold text-foreground/80 border-b border-white/10 text-sm">
          <div className="col-span-2">Student</div>
          <div>Course</div>
          <div className="text-right">Issued Date</div>
        </div>
        
        {certsLoading ? (
          <div className="p-4 space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-16 bg-white/5 animate-pulse rounded-xl" />)}
          </div>
        ) : certificates.length === 0 ? (
          <div className="p-12 text-center text-foreground/50">
            No certificates issued yet.
          </div>
        ) : (
          <div className="divide-y divide-white/5 max-h-[60vh] overflow-y-auto">
            {certificates.map((cert: any, i: number) => (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                key={cert.id} 
                className="grid grid-cols-4 p-4 items-center hover:bg-white/5 transition-colors text-sm"
              >
                <div className="col-span-2 flex flex-col">
                  <span className="font-bold text-foreground">{cert.studentName}</span>
                  <span className="text-foreground/50 text-xs">{cert.studentEmail}</span>
                </div>
                <div className="text-primary font-semibold">
                  {cert.courseName}
                </div>
                <div className="text-right flex justify-end items-center gap-4 text-foreground/70">
                  {new Date(cert.issuedDate).toLocaleDateString()}
                  {cert.certificateUrl && (
                    <a href={cert.certificateUrl} target="_blank" rel="noreferrer" className="p-2 bg-white/5 hover:bg-primary/20 text-primary rounded-lg transition-colors" title="View PDF">
                      <Download size={16} />
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Issuance Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: "10%" }} animate={{ opacity: 1, scale: 1, y: "-50%" }} exit={{ opacity: 0, scale: 0.95, y: "10%" }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 z-50 w-full max-w-md"
            >
              <div className="glass p-8 rounded-3xl border border-white/20 shadow-2xl relative">
                <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                  <X size={20} />
                </button>
                <h2 className="text-2xl font-bold mb-6 text-primary">Issue New Certificate</h2>
                
                <form onSubmit={handleIssue} className="space-y-4">
                  <div className="relative z-50">
                    <CourseSelect
                      courses={courses}
                      selectedCourse={selectedCourse}
                      setSelectedCourse={setSelectedCourse}
                      label="Select Course *"
                      placeholder="Choose a course to issue..."
                      showClear={false}
                    />
                  </div>

                  {selectedCourse && (
                    <div>
                      <label className="block text-sm font-medium text-foreground/70 mb-1 ml-1">Select Student *</label>
                      <select 
                        value={selectedStudent}
                        onChange={(e) => setSelectedStudent(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors appearance-none"
                        required
                      >
                        <option value="" disabled>Select Student</option>
                        {students.map((s: any) => (
                          <option key={s.id} value={s.id}>
                            {s.name} (Progress: {s.progressPct}%)
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-foreground/50 mt-2 ml-1">Only students enrolled in this course will appear.</p>
                    </div>
                  )}

                  <div className="pt-4 flex justify-end">
                    <AnimatedButton type="submit" isLoading={issueMutation.isPending} className="w-full" disabled={!selectedCourse || !selectedStudent}>
                      Generate Certificate
                    </AnimatedButton>
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
