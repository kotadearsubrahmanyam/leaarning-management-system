"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, ChevronLeft, Video, FileText, Sliders, Plus, X } from "lucide-react";
import { AnimatedButton } from "@/components/ui/animated-button";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { MaterialCard, Material } from "@/components/materials/material-card";
import { UploadModal } from "@/components/materials/upload-modal";

export default function CourseDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const courseId = params.id;
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Learning Path Editor States
  const [isPathEditorOpen, setIsPathEditorOpen] = useState(false);
  const [pathTitle, setPathTitle] = useState("");
  const [pathDescription, setPathDescription] = useState("");
  const [prerequisites, setPrerequisites] = useState("");
  const [phases, setPhases] = useState<any[]>([
    { title: "Phase 1: Computer System Fundamentals", topics: "Process Management, Fundamentals" },
    { title: "Phase 2: CPU Scheduling", topics: "Scheduling algorithms, Synchronization" },
    { title: "Phase 3: Memory Management", topics: "Deadlocks, Paging, Virtual Memory" },
    { title: "Phase 4: Storage & Files", topics: "File systems, Disk scheduling" },
    { title: "Phase 5: Evaluation & Revision", topics: "Previous Year Papers, Mock tests, Checklist" }
  ]);
  const [notes, setNotes] = useState("");
  const [mockTests, setMockTests] = useState("");
  const [resourcesList, setResourcesList] = useState<any[]>([]);

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

  // Fetch materials
  const { data: materialsData, isLoading } = useQuery({
    queryKey: ["materials", courseId],
    queryFn: async () => {
      const res = await fetch(`/api/courses/${courseId}/materials`);
      if (!res.ok) {
        if (res.status === 403) {
          router.push("/dashboard/courses");
          throw new Error("Forbidden");
        }
        throw new Error("Failed to fetch materials");
      }
      return res.json();
    },
    enabled: !!role,
  });

  const materials: Material[] = materialsData?.data?.materials || [];

  // Fetch learning path for this course
  const { data: pathData } = useQuery({
    queryKey: ["courseLearningPath", courseId],
    queryFn: async () => {
      const res = await fetch(`/api/teacher/learning-path?courseId=${courseId}`);
      if (!res.ok) throw new Error("Failed to fetch recovery path");
      return res.json();
    },
    enabled: !!role,
  });

  // Populate form states when path is loaded
  useEffect(() => {
    if (pathData?.data?.learningPath) {
      const lp = pathData.data.learningPath;
      setPathTitle(lp.title || "");
      setPathDescription(lp.description || "");
      setPrerequisites(lp.prerequisites || "");
      try {
        if (lp.studySequence) setPhases(JSON.parse(lp.studySequence));
      } catch (e) {
        console.error("Error parsing study sequence", e);
      }
      try {
        if (lp.mockTests) {
          const mockObj = JSON.parse(lp.mockTests);
          setMockTests(typeof mockObj === "string" ? mockObj : JSON.stringify(mockObj, null, 2));
        }
      } catch (e) {
        setMockTests(lp.mockTests || "");
      }
      if (lp.resourcesList) {
        setResourcesList(lp.resourcesList);
      } else {
        try {
          if (lp.resources) {
            const resObj = JSON.parse(lp.resources);
            if (Array.isArray(resObj)) {
              setResourcesList(resObj);
            } else {
              setResourcesList([{ resourceType: "NOTES", resourceUrl: lp.resources }]);
            }
          } else {
            setResourcesList([]);
          }
        } catch (e) {
          setResourcesList([{ resourceType: "NOTES", resourceUrl: lp.resources || "" }]);
        }
      }
    }
  }, [pathData]);

  const handleSavePath = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/teacher/learning-path", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          title: pathTitle || "Backlog Recovery Path",
          description: pathDescription,
          prerequisites,
          studySequence: phases,
          resources: resourcesList,
          mockTests,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.message || "Failed to save recovery path");
        return;
      }

      alert("Recovery learning path saved successfully!");
      setIsPathEditorOpen(false);
      queryClient.invalidateQueries({ queryKey: ["courseLearningPath", courseId] });
    } catch (error) {
      console.error("Save path error:", error);
      alert("An error occurred while saving the recovery path.");
    }
  };

  const completeMutation = useMutation({
    mutationFn: async (materialId: string) => {
      const res = await fetch(`/api/materials/${materialId}/complete`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to toggle complete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials", courseId] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      queryClient.invalidateQueries({ queryKey: ["enrolledCourses"] });
    }
  });

  if (isLoading || !role) {
    return (
      <div className="flex flex-col space-y-4">
        <div className="glass w-48 h-10 rounded-xl animate-pulse bg-white/20 mb-8" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass w-full h-24 rounded-2xl animate-pulse bg-white/20" />
        ))}
      </div>
    );
  }

  const videos = materials.filter(m => m.fileType.includes("video"));
  const pdfs = materials.filter(m => m.fileType.includes("pdf"));

  const completedCount = materials.filter(m => m.isCompleted).length;
  const progressPercentage = materials.length > 0 ? Math.round((completedCount / materials.length) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <button 
        onClick={() => router.push("/dashboard/courses")}
        className="flex items-center text-sm font-medium text-foreground/70 hover:text-primary mb-6 transition-colors"
      >
        <ChevronLeft size={16} className="mr-1" />
        Back to Courses
      </button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-primary mb-2">Course Materials</h1>
          <p className="text-foreground/70">
            Access all videos and documents for this course.
          </p>
        </motion.div>

        {(role === "TEACHER" || role === "ADMIN") && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <AnimatedButton onClick={() => setIsPathEditorOpen(true)} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700">
              <Sliders size={18} />
              Configure Recovery Path
            </AnimatedButton>
            <AnimatedButton onClick={() => setIsUploadOpen(true)} className="flex items-center gap-2">
              <Upload size={18} />
              Upload Material
            </AnimatedButton>
          </motion.div>
        )}
      </div>

      {materials.length === 0 ? (
        <div className="w-full py-20 text-center text-foreground/60 glass rounded-2xl border border-white/10">
          <p className="text-lg mb-2">No materials available yet.</p>
          <p className="text-sm">Check back later for updates from the instructor.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Progress Bar for Students */}
          {role === "STUDENT" && materials.length > 0 && (
            <div className="glass p-6 rounded-2xl border border-white/10">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-foreground">Course Progress</h3>
                <span className="text-sm text-primary font-bold">{completedCount} of {materials.length} completed ({progressPercentage}%)</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="bg-primary h-full rounded-full relative"
                >
                  <div className="absolute inset-0 bg-white/20 w-full h-full animate-pulse" />
                </motion.div>
              </div>
            </div>
          )}

          {videos.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-xl font-bold text-foreground/80 mb-4">
                <Video className="text-orange-500" />
                <h2>Video Lectures</h2>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {videos.map((mat, i) => (
                  <MaterialCard 
                    key={mat.id} 
                    material={mat} 
                    index={i} 
                    onToggleComplete={role === "STUDENT" ? (id) => completeMutation.mutate(id) : undefined}
                  />
                ))}
              </div>
            </div>
          )}

          {pdfs.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-xl font-bold text-foreground/80 mb-4">
                <FileText className="text-red-500" />
                <h2>Documents & PDFs</h2>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {pdfs.map((mat, i) => (
                  <MaterialCard 
                    key={mat.id} 
                    material={mat} 
                    index={i} 
                    onToggleComplete={role === "STUDENT" ? (id) => completeMutation.mutate(id) : undefined}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        courseId={courseId}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["materials", courseId] });
        }}
      />

      {/* MODAL: Configure Recovery Path */}
      <AnimatePresence>
        {isPathEditorOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-300 w-full max-w-2xl my-8 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">
                    Configure Recovery Learning Path
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Define study sequence and resources for failed students.</p>
                </div>
                <button onClick={() => setIsPathEditorOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSavePath} className="p-6 space-y-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Recovery Plan Title
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Operating Systems Recovery Path"
                      value={pathTitle}
                      onChange={(e) => setPathTitle(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-700 focus:outline-none focus:border-[#10B981] transition-colors text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Prerequisite Concepts
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Computer Architecture, C Programming"
                      value={prerequisites}
                      onChange={(e) => setPrerequisites(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-700 focus:outline-none focus:border-[#10B981] transition-colors text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Plan Description
                  </label>
                  <textarea
                    placeholder="Provide a brief explanation of how this path helps recover from backlogs..."
                    value={pathDescription}
                    onChange={(e) => setPathDescription(e.target.value)}
                    rows={2}
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-700 focus:outline-none focus:border-[#10B981] transition-colors text-sm"
                  />
                </div>

                {/* Phase-wise study sequence editor */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Unit-wise / Phase-wise Study Sequence
                    </label>
                    <button
                      type="button"
                      onClick={() => setPhases([...phases, { title: `Phase ${phases.length + 1}: Title`, topics: "" }])}
                      className="text-[#10B981] text-xs font-bold hover:underline flex items-center gap-1"
                    >
                      <Plus size={14} /> Add Phase
                    </button>
                  </div>

                  <div className="space-y-3">
                    {phases.map((phase, idx) => (
                      <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 relative group space-y-3">
                        <button
                          type="button"
                          onClick={() => setPhases(phases.filter((_, i) => i !== idx))}
                          className="absolute right-3 top-3 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={16} />
                        </button>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="md:col-span-1">
                            <input
                              type="text"
                              required
                              placeholder="Phase Title"
                              value={phase.title}
                              onChange={(e) => {
                                const newPhases = [...phases];
                                newPhases[idx].title = e.target.value;
                                setPhases(newPhases);
                              }}
                              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none focus:border-[#10B981] transition-colors text-xs font-bold"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <input
                              type="text"
                              required
                              placeholder="Topics (comma separated)"
                              value={phase.topics}
                              onChange={(e) => {
                                const newPhases = [...phases];
                                newPhases[idx].topics = e.target.value;
                                setPhases(newPhases);
                              }}
                              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none focus:border-[#10B981] transition-colors text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Mock Tests Configuration (Optional Checklist)
                  </label>
                  <textarea
                    placeholder="e.g. Mock Test 1, Mock Test 2..."
                    value={mockTests}
                    onChange={(e) => setMockTests(e.target.value)}
                    rows={2}
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-700 focus:outline-none focus:border-[#10B981] transition-colors text-sm"
                  />
                </div>

                {/* Resources List Builder */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Study Resources & Practice Materials (Notes, PYQs, Questions, Assignments, Videos)
                    </label>
                    <button
                      type="button"
                      onClick={() => setResourcesList([...resourcesList, { resourceType: "NOTES", resourceUrl: "" }])}
                      className="text-[#10B981] text-xs font-bold hover:underline flex items-center gap-1"
                    >
                      <Plus size={14} /> Add Resource
                    </button>
                  </div>

                  <div className="space-y-2">
                    {resourcesList.map((res, idx) => (
                      <div key={idx} className="flex gap-3 items-center">
                        <select
                          value={res.resourceType}
                          onChange={(e) => {
                            const newList = [...resourcesList];
                            newList[idx].resourceType = e.target.value;
                            setResourcesList(newList);
                          }}
                          className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none focus:border-[#10B981] transition-colors text-xs font-bold shrink-0"
                        >
                          <option value="NOTES">Notes & Materials</option>
                          <option value="PYQ">Previous Year Paper</option>
                          <option value="QUESTIONS">Important Questions</option>
                          <option value="ASSIGNMENT">Practice Assignment</option>
                          <option value="VIDEO">Video Resource</option>
                        </select>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Unit 1 slides URL, PYQ 2025 link, Important Formulas doc..."
                          value={res.resourceUrl}
                          onChange={(e) => {
                            const newList = [...resourcesList];
                            newList[idx].resourceUrl = e.target.value;
                            setResourcesList(newList);
                          }}
                          className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none focus:border-[#10B981] transition-colors text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setResourcesList(resourcesList.filter((_, i) => i !== idx))}
                          className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                    {resourcesList.length === 0 && (
                      <p className="text-xs text-slate-400 italic">No resources added. Click "Add Resource" to guide students with notes, papers, or study links.</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 shrink-0 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsPathEditorOpen(false)}
                    className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-[#10B981] to-[#059669] text-white font-bold rounded-xl text-sm shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all"
                  >
                    Save Recovery Path
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
