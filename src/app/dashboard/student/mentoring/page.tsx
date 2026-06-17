"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Calendar, User as UserIcon, BookOpen, CheckSquare, Award, Clock, Sliders, CheckCircle2, Video, FileText, Paperclip, Edit3, HelpCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function StudentMentoringPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [learningPaths, setLearningPaths] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"paths" | "mentoring">("paths");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchPathsAndPlans = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/student/mentoring").then(res => res.json()),
      fetch("/api/student/learning-path").then(res => res.json())
    ])
      .then(([plansData, pathsData]) => {
        if (plansData.success) setPlans(plansData.data.plans);
        if (pathsData.success) setLearningPaths(pathsData.data.learningPaths || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading data:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPathsAndPlans();
  }, []);

  const handleToggleCheckbox = async (pathId: string, category: string, itemValue: string, isChecked: boolean) => {
    setUpdating(pathId);
    try {
      const path = learningPaths.find(p => p.id === pathId);
      if (!path) return;

      const progress = typeof path.progress === "string" ? JSON.parse(path.progress) : (path.progress || {});
      const list = progress[category] || [];
      
      let updatedList = [];
      if (isChecked) {
        updatedList = [...list, itemValue];
      } else {
        updatedList = list.filter((item: string) => item !== itemValue);
      }

      const updatedProgress = {
        ...progress,
        [category]: updatedList
      };

      const res = await fetch("/api/student/learning-path/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentLearningPathId: pathId,
          progress: updatedProgress
        })
      });

      if (res.ok) {
        // Refresh local data
        const data = await res.json();
        if (data.success) {
          setLearningPaths(learningPaths.map(p => {
            if (p.id === pathId) {
              return {
                ...p,
                progress: data.data.studentLearningPath.progress,
                completionStatus: data.data.studentLearningPath.completionStatus
              };
            }
            return p;
          }));
        }
      }
    } catch (error) {
      console.error("Error updating progress:", error);
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin h-10 w-10 text-emerald-600" />
          <p className="text-slate-500 text-sm">Loading recovery plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 pb-24 relative z-10">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-8 rounded-3xl shadow-lg text-white">
        <h1 className="text-3xl font-black mb-2">Academic Support & Mentoring</h1>
        <p className="text-emerald-500/10 text-white font-medium text-lg">
          Track recovery plans, interactive learning paths, and recommendations from your mentors.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("paths")}
          className={`pb-3 font-bold text-sm transition-all border-b-2 flex items-center gap-2 ${
            activeTab === "paths"
              ? "border-emerald-600 text-emerald-600 font-extrabold"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <Award size={18} /> Recovery Learning Paths ({learningPaths.length})
        </button>
        <button
          onClick={() => setActiveTab("mentoring")}
          className={`pb-3 font-bold text-sm transition-all border-b-2 flex items-center gap-2 ${
            activeTab === "mentoring"
              ? "border-emerald-600 text-emerald-600 font-extrabold"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <UserIcon size={18} /> Mentoring Log ({plans.length})
        </button>
      </div>

      {activeTab === "paths" && (
        <div className="space-y-8">
          {learningPaths.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300">
              <h3 className="text-lg font-bold text-slate-900">No Active Recovery Paths</h3>
              <p className="text-slate-500 mt-1 text-sm">You currently have no backlog recovery plans assigned. Great job keeping up with your coursework!</p>
            </div>
          ) : (
            learningPaths.map((path) => {
              const progress = typeof path.progress === "string" ? JSON.parse(path.progress) : (path.progress || {});
              const completedUnits = progress.completedUnits || [];
              const completedAssignments = progress.completedAssignments || [];
              const completedMockTests = progress.completedMockTests || [];
              const completedChecklist = progress.completedChecklist || [];
              const readinessScore = progress.readinessScore || 0;

              let studySequence: any[] = [];
              try {
                if (path.studySequence) studySequence = JSON.parse(path.studySequence);
              } catch(e) {}

              return (
                <Card key={path.id} className="border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                  <CardHeader className="bg-slate-50 border-b border-slate-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-50 text-red-600 border border-red-200 inline-block mb-2">
                        Backlog Recovery Plan
                      </span>
                      <CardTitle className="text-xl font-bold text-slate-800">{path.courseTitle} - Recovery Path</CardTitle>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        <Calendar size={14} /> Assigned on {new Date(path.assignedDate).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Readiness Score Dial */}
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-black uppercase text-slate-400 mb-1">Readiness</span>
                        <div className="relative flex items-center justify-center w-14 h-14 rounded-full border-4 border-slate-100 bg-white shadow-inner">
                          <span className="text-xs font-black text-slate-800">{readinessScore}%</span>
                          {/* Colored circular boundary representation */}
                          <div 
                            className="absolute inset-0 rounded-full border-4 border-transparent pointer-events-none"
                            style={{
                              borderTopColor: readinessScore > 30 ? "#10B981" : "#EF4444",
                              borderRightColor: readinessScore > 60 ? "#10B981" : "transparent",
                              borderBottomColor: readinessScore > 80 ? "#10B981" : "transparent",
                              transform: "rotate(-45deg)"
                            }}
                          />
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                          path.completionStatus === "COMPLETED"
                            ? "bg-green-50 text-green-600 border-green-200"
                            : "bg-amber-50 text-amber-600 border-amber-200"
                        }`}>
                          {path.completionStatus}
                        </span>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6 space-y-6">
                    {path.prerequisites && (
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Prerequisites</h4>
                        <p className="text-sm font-semibold text-slate-700">{path.prerequisites}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Unit study sequence checklist */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <BookOpen size={16} className="text-emerald-600" />
                          1. Study Sequence (Phases)
                        </h4>
                        <div className="space-y-2">
                          {studySequence.map((phase, idx) => {
                            const isChecked = completedUnits.includes(phase.title);
                            return (
                              <label key={idx} className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  disabled={updating === path.id}
                                  onChange={(e) => handleToggleCheckbox(path.id, "completedUnits", phase.title, e.target.checked)}
                                  className="mt-1 h-4 w-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500"
                                />
                                <div>
                                  <span className={`block text-xs font-bold ${isChecked ? "text-slate-400 line-through" : "text-slate-800"}`}>
                                    {phase.title}
                                  </span>
                                  {phase.topics && (
                                    <span className="block text-[10px] text-slate-400 font-medium mt-0.5">
                                      Topics: {phase.topics}
                                    </span>
                                  )}
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {/* Right column: Assignments, Tests, and Resources */}
                      <div className="space-y-6">
                        {/* Practice Assignments Checkboxes */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <CheckSquare size={16} className="text-emerald-600" />
                            2. Practice Assignments
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {[1, 2, 3, 4, 5].map((num) => {
                              const itemVal = `Assignment ${num}`;
                              const isChecked = completedAssignments.includes(itemVal);
                              return (
                                <label key={num} className="flex items-center gap-2.5 p-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs font-bold text-slate-700 transition-colors">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    disabled={updating === path.id}
                                    onChange={(e) => handleToggleCheckbox(path.id, "completedAssignments", itemVal, e.target.checked)}
                                    className="h-3.5 w-3.5 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500"
                                  />
                                  <span className={isChecked ? "text-slate-400 line-through" : ""}>Assignment {num}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>

                        {/* Mock Tests Checkboxes */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Sliders size={16} className="text-emerald-600" />
                            3. Mock Tests
                          </h4>
                          <div className="flex gap-4">
                            {[1, 2].map((num) => {
                              const itemVal = `Mock Test ${num}`;
                              const isChecked = completedMockTests.includes(itemVal);
                              return (
                                <label key={num} className="flex-1 flex items-center gap-2.5 p-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs font-bold text-slate-700 transition-colors">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    disabled={updating === path.id}
                                    onChange={(e) => handleToggleCheckbox(path.id, "completedMockTests", itemVal, e.target.checked)}
                                    className="h-3.5 w-3.5 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500"
                                  />
                                  <span className={isChecked ? "text-slate-400 line-through" : ""}>Mock Test {num}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>

                        {/* Revision Checklist */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Clock size={16} className="text-emerald-600" />
                            4. Revision Checklist
                          </h4>
                          <div className="space-y-2">
                            {["Review formulas", "Attempt PYQs", "Re-read notes", "Complete mock test", "Clear doubts with mentor"].map((item, idx) => {
                              const isChecked = completedChecklist.includes(item);
                              return (
                                <label key={idx} className="flex items-center gap-2.5 p-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs font-bold text-slate-700 transition-colors">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    disabled={updating === path.id}
                                    onChange={(e) => handleToggleCheckbox(path.id, "completedChecklist", item, e.target.checked)}
                                    className="h-3.5 w-3.5 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500"
                                  />
                                  <span className={isChecked ? "text-slate-400 line-through" : ""}>{item}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Resources (Notes, PYQs, Videos, Questions, Assignments) */}
                    {((path.resourcesList && path.resourcesList.length > 0) || path.mockTests) && (
                      <div className="pt-6 border-t border-slate-100 space-y-4">
                        <h5 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                          Study Resources & Guides
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Left Column: Notes & Videos */}
                          <div className="space-y-3">
                            {path.resourcesList && path.resourcesList.filter((r: any) => ["NOTES", "VIDEO"].includes(r.resourceType)).length > 0 ? (
                              <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl space-y-2.5">
                                <h6 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                  Notes & Video Materials
                                </h6>
                                <div className="space-y-2">
                                  {path.resourcesList
                                    .filter((r: any) => ["NOTES", "VIDEO"].includes(r.resourceType))
                                    .map((r: any, idx: number) => (
                                      <a
                                        key={r.id || idx}
                                        href={r.resourceUrl.startsWith("http") ? r.resourceUrl : "#"}
                                        target={r.resourceUrl.startsWith("http") ? "_blank" : undefined}
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2.5 p-2 px-3 bg-white border border-slate-200 hover:border-emerald-500 rounded-xl text-xs font-semibold text-slate-750 hover:text-emerald-600 transition-all cursor-pointer truncate"
                                      >
                                        <span className="shrink-0 p-1 bg-emerald-50 text-emerald-600 rounded-lg">
                                          {r.resourceType === "VIDEO" ? <Video size={14} /> : <FileText size={14} />}
                                        </span>
                                        <span className="truncate">{r.resourceUrl}</span>
                                      </a>
                                    ))}
                                </div>
                              </div>
                            ) : path.resources ? (
                              <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl space-y-2.5">
                                <h6 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                  Study Notes
                                </h6>
                                <pre className="text-xs text-slate-600 font-sans whitespace-pre-line leading-relaxed">
                                  {path.resources}
                                </pre>
                              </div>
                            ) : null}
                          </div>

                          {/* Right Column: PYQs, Important Questions, Practice Assignments, Mock Tests */}
                          <div className="space-y-3">
                            {path.resourcesList && path.resourcesList.filter((r: any) => ["PYQ", "QUESTIONS", "ASSIGNMENT"].includes(r.resourceType)).length > 0 ? (
                              <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl space-y-2.5">
                                <h6 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                  Question Papers & Practice Files
                                </h6>
                                <div className="space-y-2">
                                  {path.resourcesList
                                    .filter((r: any) => ["PYQ", "QUESTIONS", "ASSIGNMENT"].includes(r.resourceType))
                                    .map((r: any, idx: number) => (
                                      <a
                                        key={r.id || idx}
                                        href={r.resourceUrl.startsWith("http") ? r.resourceUrl : "#"}
                                        target={r.resourceUrl.startsWith("http") ? "_blank" : undefined}
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2.5 p-2 px-3 bg-white border border-slate-200 hover:border-emerald-500 rounded-xl text-xs font-semibold text-slate-750 hover:text-emerald-600 transition-all cursor-pointer truncate"
                                      >
                                        <span className="shrink-0 p-1 bg-emerald-50 text-emerald-600 rounded-lg">
                                          {r.resourceType === "PYQ" ? (
                                            <Paperclip size={14} />
                                          ) : r.resourceType === "ASSIGNMENT" ? (
                                            <Edit3 size={14} />
                                          ) : (
                                            <HelpCircle size={14} />
                                          )}
                                        </span>
                                        <span className="truncate">{r.resourceUrl}</span>
                                      </a>
                                    ))}
                                </div>
                              </div>
                            ) : null}

                            {path.mockTests && (
                              <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl space-y-2">
                                <h6 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                  Mock Exam Configuration
                                </h6>
                                <pre className="text-xs text-slate-600 font-sans whitespace-pre-line leading-relaxed">
                                  {path.mockTests}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {activeTab === "mentoring" && (
        <div className="space-y-8">
          {plans.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300">
              <h3 className="text-lg font-bold text-slate-900">No Advisor Logs</h3>
              <p className="text-slate-500 mt-1 text-sm">You currently have no documented mentoring logs or advisor session plans.</p>
            </div>
          ) : (
            plans.map((plan: any) => (
              <Card key={plan.id} className="border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between py-4 p-6">
                  <CardTitle className="text-lg font-bold text-slate-800 flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-emerald-600" />
                    Advising & Mentoring Record
                  </CardTitle>
                  <div className="text-xs text-slate-500 flex items-center font-bold">
                    <UserIcon className="w-4 h-4 mr-1 text-slate-400" />
                    Advisor: {plan.teacherName || "Teacher"}
                    <span className="mx-2 text-slate-300">•</span>
                    {new Date(plan.createdAt).toLocaleDateString()}
                  </div>
                </CardHeader>
                <CardContent className="p-6 bg-white prose prose-indigo max-w-none text-slate-600 text-sm leading-relaxed">
                  <ReactMarkdown>{plan.planContent}</ReactMarkdown>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
