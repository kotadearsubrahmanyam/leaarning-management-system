"use client";

import React, { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  BookOpen, 
  Clock, 
  Calendar, 
  Trash2, 
  Plus, 
  CheckCircle, 
  X, 
  Sliders, 
  RefreshCw, 
  Edit3, 
  Send, 
  FolderPlus, 
  SlidersHorizontal,
  ChevronDown,
  HelpCircle,
  Award
} from "lucide-react";
import { CourseSelect } from "@/components/ui/course-select";

interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
  points: number;
}

export default function TeacherQuizzesPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"LIST" | "CREATE">("LIST");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [prompt, setPrompt] = useState("");
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium");
  const [questionType, setQuestionType] = useState<"MCQ" | "True/False" | "Mixed">("MCQ");
  const [timeLimit, setTimeLimit] = useState(15);
  
  // Generation and Preview state
  const [generating, setGenerating] = useState(false);
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
  const [quizTitle, setQuizTitle] = useState("");
  const [quizTimeLimit, setQuizTimeLimit] = useState(15);
  const [previewQuestions, setPreviewQuestions] = useState<Question[]>([]);
  const [showSettings, setShowSettings] = useState(false);

  // Fetch courses and quizzes
  const { data: coursesData } = useQuery({
    queryKey: ["teacherCourses"],
    queryFn: async () => {
      const res = await fetch("/api/courses?teacherOnly=true");
      if (!res.ok) throw new Error("Failed to fetch courses");
      return res.json();
    },
  });

  const { data: quizzesData, isLoading: quizzesLoading } = useQuery({
    queryKey: ["teacherQuizzes"],
    queryFn: async () => {
      const res = await fetch("/api/teacher/quizzes");
      if (!res.ok) throw new Error("Failed to fetch quizzes");
      return res.json();
    },
  });

  const courses = coursesData?.data?.courses || [];
  const quizzes = quizzesData?.data?.quizzes || [];

  useEffect(() => {
    if (courses.length > 0 && !selectedCourseId) {
      setSelectedCourseId(courses[0].id);
    }
  }, [courses, selectedCourseId]);

  // Generate Questions Mutation
  const handleGenerate = async () => {
    if (!selectedCourseId) {
      alert("Please select a course subject first.");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/teacher/quizzes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: selectedCourseId,
          prompt,
          count,
          difficulty,
          questionType
        })
      });
      const data = await res.json();
      if (data.success) {
        const selectedCourse = courses.find((c: any) => c.id === selectedCourseId);
        setPreviewQuestions(data.data.questions.map((q: any) => ({ ...q, points: 1 })));
        setQuizTitle(`${selectedCourse ? selectedCourse.title : "Course"} - AI Generated Quiz`);
        setQuizTimeLimit(timeLimit);
      } else {
        alert(data.message || "Failed to generate questions.");
      }
    } catch (err) {
      console.error(err);
      alert("Error occurred during quiz generation.");
    } finally {
      setGenerating(false);
    }
  };

  // Regenerate Single Question Mutation
  const handleRegenerateQuestion = async (index: number) => {
    setRegeneratingIndex(index);
    try {
      const existingTexts = previewQuestions.map((q) => q.question);
      const res = await fetch("/api/teacher/quizzes/generate-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: selectedCourseId,
          prompt,
          difficulty,
          questionType,
          existingQuestions: existingTexts
        })
      });
      const data = await res.json();
      if (data.success) {
        const newQuestion = { ...data.data.question, points: 1 };
        setPreviewQuestions((prev) => {
          const updated = [...prev];
          updated[index] = newQuestion;
          return updated;
        });
      } else {
        alert(data.message || "Failed to regenerate this question.");
      }
    } catch (err) {
      console.error(err);
      alert("Error occurred during question regeneration.");
    } finally {
      setRegeneratingIndex(null);
    }
  };

  // Edit / Delete actions in preview
  const handleUpdateQuestionText = (index: number, val: string) => {
    setPreviewQuestions((prev) => {
      const updated = [...prev];
      updated[index].question = val;
      return updated;
    });
  };

  const handleUpdateOptionText = (index: number, optionIndex: number, val: string) => {
    setPreviewQuestions((prev) => {
      const updated = [...prev];
      const oldOptionVal = updated[index].options[optionIndex];
      updated[index].options[optionIndex] = val;
      // If the option was the correct answer, update it to match new text
      if (updated[index].correctAnswer === oldOptionVal) {
        updated[index].correctAnswer = val;
      }
      return updated;
    });
  };

  const handleUpdateCorrectAnswer = (index: number, val: string) => {
    setPreviewQuestions((prev) => {
      const updated = [...prev];
      updated[index].correctAnswer = val;
      return updated;
    });
  };

  const handleUpdatePoints = (index: number, val: number) => {
    setPreviewQuestions((prev) => {
      const updated = [...prev];
      updated[index].points = val;
      return updated;
    });
  };

  const handleDeleteQuestion = (index: number) => {
    setPreviewQuestions((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleAddManualQuestion = () => {
    const defaultOptions = questionType === "True/False" ? ["True", "False"] : ["Option A", "Option B", "Option C", "Option D"];
    const newQ: Question = {
      question: "Type your manual question here...",
      options: defaultOptions,
      correctAnswer: defaultOptions[0],
      points: 1
    };
    setPreviewQuestions((prev) => [...prev, newQ]);
  };

  // Save Quiz to Database (Draft or Published)
  const handleSaveQuiz = async (status: "DRAFT" | "PUBLISHED") => {
    if (!quizTitle.trim()) {
      alert("Please enter a title for the quiz.");
      return;
    }
    if (previewQuestions.length === 0) {
      alert("Your quiz must contain at least 1 question.");
      return;
    }
    try {
      const res = await fetch("/api/teacher/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: selectedCourseId,
          title: quizTitle,
          timeLimit: quizTimeLimit,
          status,
          questions: previewQuestions
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(status === "PUBLISHED" ? "Quiz assigned to course successfully!" : "Quiz saved as draft.");
        queryClient.invalidateQueries({ queryKey: ["teacherQuizzes"] });
        cancelPreview();
        setActiveTab("LIST");
      } else {
        alert(data.message || "Failed to save quiz.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving quiz.");
    }
  };

  // Delete quiz card
  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm("Are you sure you want to delete this quiz? Students will lose access.")) return;
    try {
      const res = await fetch(`/api/teacher/quizzes/${quizId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        alert("Quiz deleted.");
        queryClient.invalidateQueries({ queryKey: ["teacherQuizzes"] });
      } else {
        alert(data.message || "Failed to delete quiz.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Assign draft quiz card
  const handleAssignDraftQuiz = async (quizId: string) => {
    try {
      const res = await fetch(`/api/teacher/quizzes/${quizId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PUBLISHED" })
      });
      const data = await res.json();
      if (data.success) {
        alert("Quiz published and assigned to students!");
        queryClient.invalidateQueries({ queryKey: ["teacherQuizzes"] });
      } else {
        alert(data.message || "Failed to assign quiz.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const cancelPreview = () => {
    setPreviewQuestions([]);
    setPrompt("");
    setQuizTitle("");
  };

  return (
    <div className="max-w-6xl mx-auto pb-12 relative z-10 px-4 md:px-0">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-3">
            <Sparkles size={32} className="text-indigo-500 animate-pulse" /> AI Quiz Workspace
          </h1>
          <p className="text-foreground/70 text-sm">
            Generate and customize interactive student quizzes using natural language prompts.
          </p>
        </motion.div>
        
        <div className="flex bg-white/70 border border-slate-200 p-1.5 rounded-2xl shadow-sm self-start">
          <button 
            onClick={() => { cancelPreview(); setActiveTab("LIST"); }}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${activeTab === "LIST" ? "bg-indigo-600 text-white shadow-md" : "text-slate-600 hover:bg-slate-100"}`}
          >
            Quiz Registry
          </button>
          <button 
            onClick={() => setActiveTab("CREATE")}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${activeTab === "CREATE" ? "bg-indigo-600 text-white shadow-md" : "text-slate-600 hover:bg-slate-100"}`}
          >
            Create with AI
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        
        {/* LIST TAB */}
        {activeTab === "LIST" && (
          <motion.div 
            key="list"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {quizzesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-44 bg-slate-100 animate-pulse rounded-3xl border border-slate-200" />
                ))}
              </div>
            ) : quizzes.length === 0 ? (
              <div className="bg-white/80 border border-slate-200 p-16 rounded-3xl shadow-sm text-center">
                <HelpCircle size={48} className="mx-auto text-slate-300 mb-4" />
                <h3 className="font-extrabold text-slate-800 text-lg">No Quizzes Created Yet</h3>
                <p className="text-sm text-slate-500 mt-1 mb-6">Create highly tailored quizzes using prompt instructions.</p>
                <button 
                  onClick={() => setActiveTab("CREATE")}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-all shadow-md active:scale-95"
                >
                  Create First Quiz
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quizzes.map((q: any) => {
                  const isDraft = q.status === "DRAFT";
                  const course = courses.find((c: any) => c.id === q.courseId);
                  
                  return (
                    <motion.div
                      key={q.id}
                      className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[190px]"
                      whileHover={{ y: -3 }}
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-3">
                          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 border border-indigo-150 rounded uppercase tracking-wide truncate max-w-[150px]">
                            {course ? course.title : "Subject"}
                          </span>
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${isDraft ? "bg-amber-50 border border-amber-200 text-amber-600" : "bg-emerald-50 border border-emerald-250 text-emerald-600"}`}>
                            {isDraft ? "Draft" : "Published"}
                          </span>
                        </div>
                        
                        <h3 className="font-extrabold text-slate-800 text-base line-clamp-2 leading-snug mb-3">
                          {q.title}
                        </h3>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-xs text-slate-400 font-semibold border-t border-slate-100 pt-3 mb-4">
                          <span className="flex items-center gap-1">
                            <Clock size={12} /> {q.timeLimit} Mins
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar size={12} /> {new Date(q.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex justify-end gap-2">
                          {isDraft && (
                            <button
                              onClick={() => handleAssignDraftQuiz(q.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                            >
                              Assign Quiz
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteQuiz(q.id)}
                            className="p-2 bg-rose-50 border border-rose-100 text-rose-500 hover:text-rose-700 rounded-xl transition-all"
                            title="Delete Quiz"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* CREATE TAB */}
        {activeTab === "CREATE" && (
          <motion.div 
            key="create"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
          >
            {previewQuestions.length === 0 ? (
              
              /* AI INPUT BUILDER */
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                
                {/* Parameters panel */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                      <Sparkles size={18} className="text-indigo-500" /> AI Prompter
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Describe what concepts, topics, or configurations your quiz needs.</p>
                  </div>

                  <div className="relative z-50">
                    <CourseSelect
                      courses={courses}
                      selectedCourse={selectedCourseId}
                      setSelectedCourse={setSelectedCourseId}
                      label="Select Course Subject *"
                      placeholder="Choose a subject..."
                      showClear={false}
                      compact={true}
                    />
                  </div>

                  {/* Text Prompt */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                      Quiz Prompt / Instructions *
                    </label>
                    <textarea
                      rows={5}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Example:&#10;Generate 15 MCQs from Linked Lists.&#10;Difficulty: Medium.&#10;Focus on insertion, deletion, and traversal.&#10;Avoid repeated questions."
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 transition-colors leading-relaxed placeholder-slate-400"
                    />
                  </div>

                  {/* Sliders Accordion Toggle */}
                  <div className="pt-2">
                    <button 
                      type="button" 
                      onClick={() => setShowSettings(!showSettings)}
                      className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                    >
                      <SlidersHorizontal size={14} /> 
                      {showSettings ? "Hide Advanced Settings" : "Configure Settings (Difficulty, Question Type, etc.)"}
                    </button>

                    <AnimatePresence>
                      {showSettings && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden space-y-5 pt-4 mt-2 border-t border-slate-100"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            {/* Count slider */}
                            <div className="space-y-1.5">
                              <label className="flex justify-between text-xs font-bold text-slate-500 uppercase">
                                <span>Number of Questions</span>
                                <span className="text-indigo-600">{count} Questions</span>
                              </label>
                              <input 
                                type="range" 
                                min="5" 
                                max="25" 
                                step="5"
                                value={count} 
                                onChange={(e) => setCount(parseInt(e.target.value))}
                                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                              />
                            </div>

                            {/* Time limit */}
                            <div className="space-y-1.5">
                              <label className="flex justify-between text-xs font-bold text-slate-500 uppercase">
                                <span>Time Limit</span>
                                <span className="text-indigo-600">{timeLimit} minutes</span>
                              </label>
                              <input 
                                type="range" 
                                min="5" 
                                max="60" 
                                step="5"
                                value={timeLimit} 
                                onChange={(e) => setTimeLimit(parseInt(e.target.value))}
                                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            {/* Difficulty */}
                            <div className="space-y-2">
                              <label className="block text-xs font-bold text-slate-500 uppercase">Difficulty Level</label>
                              <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-max">
                                {["Easy", "Medium", "Hard"].map((d) => (
                                  <button
                                    key={d}
                                    type="button"
                                    onClick={() => setDifficulty(d as any)}
                                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${difficulty === d ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                                  >
                                    {d}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Question Type */}
                            <div className="space-y-2">
                              <label className="block text-xs font-bold text-slate-500 uppercase">Question Format</label>
                              <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-max">
                                {["MCQ", "True/False", "Mixed"].map((t) => (
                                  <button
                                    key={t}
                                    type="button"
                                    onClick={() => setQuestionType(t as any)}
                                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${questionType === t ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                                  >
                                    {t}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <button
                    onClick={handleGenerate}
                    disabled={generating || !prompt.trim()}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-extrabold rounded-2xl shadow-lg shadow-indigo-600/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    {generating ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        AI is crafting your questions...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Generate AI Quiz Questions
                      </>
                    )}
                  </button>
                </div>

                {/* Example prompts card info */}
                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Example Prompts</h4>
                  <div className="space-y-3">
                    {[
                      { title: "Unit 3 MCQs", desc: "Generate 20 MCQs from Unit 3 Linked Lists with medium difficulty." },
                      { title: "Binary Trees Applications", desc: "Create a quiz on Binary Trees focusing on traversal algorithms and applications." },
                      { title: "No Theory Calculus", desc: "Generate 10 application-based questions from Calculus. Avoid theory questions." },
                      { title: "Hard Revision Quiz", desc: "Create an exam revision quiz covering differentiation and integration. Difficulty should be hard." }
                    ].map((item, idx) => (
                      <div 
                        key={idx}
                        onClick={() => setPrompt(item.desc)}
                        className="p-3 bg-white border border-slate-150 hover:border-indigo-400 hover:shadow-sm cursor-pointer rounded-2xl transition-all text-xs"
                      >
                        <strong className="block text-slate-700 font-bold mb-1">{item.title}</strong>
                        <span className="text-slate-500 font-medium leading-relaxed">{item.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ) : (
              
              /* INTERACTIVE QUIZ WORKSPACE PREVIEW */
              <div className="space-y-6">
                
                {/* Meta Inputs row */}
                <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wide mb-1">Quiz Title</label>
                    <input 
                      type="text" 
                      value={quizTitle}
                      onChange={(e) => setQuizTitle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wide mb-1">Time Limit (Mins)</label>
                    <input 
                      type="number" 
                      value={quizTimeLimit}
                      onChange={(e) => setQuizTimeLimit(parseInt(e.target.value) || 15)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Questions Preview List */}
                <div className="space-y-6">
                  {previewQuestions.map((q, qIndex) => (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={qIndex}
                      className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:border-slate-300 transition-colors relative"
                    >
                      {/* Floating actions */}
                      <div className="absolute right-6 top-6 flex items-center gap-2">
                        <button
                          onClick={() => handleRegenerateQuestion(qIndex)}
                          disabled={regeneratingIndex === qIndex}
                          className="p-2 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-600 rounded-xl transition-all"
                          title="Regenerate Question with AI"
                        >
                          <RefreshCw size={13} className={regeneratingIndex === qIndex ? "animate-spin" : ""} />
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(qIndex)}
                          className="p-2 bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-500 rounded-xl transition-all"
                          title="Delete Question"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {/* Header Index */}
                      <div className="flex items-center gap-3 mb-4">
                        <span className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-150 text-indigo-600 font-extrabold flex items-center justify-center text-sm shadow-inner shrink-0">
                          {qIndex + 1}
                        </span>
                        <div className="w-24">
                          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Points</label>
                          <input 
                            type="number" 
                            min="1"
                            value={q.points}
                            onChange={(e) => handleUpdatePoints(qIndex, parseInt(e.target.value) || 1)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      {/* Editable Question string */}
                      <div className="space-y-1.5 mb-4">
                        <label className="block text-xs font-bold text-slate-400 uppercase">Question Description</label>
                        <input
                          type="text"
                          value={q.question}
                          onChange={(e) => handleUpdateQuestionText(qIndex, e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                      </div>

                      {/* Options Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {q.options.map((opt, oIndex) => (
                          <div key={oIndex} className="space-y-1">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase">Option {String.fromCharCode(65 + oIndex)}</label>
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => handleUpdateOptionText(qIndex, oIndex, e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        ))}
                      </div>

                      {/* Correct Answer Selection */}
                      <div className="max-w-xs space-y-1.5">
                        <label className="block text-xs font-bold text-slate-400 uppercase flex items-center gap-1">
                          <CheckCircle size={14} className="text-emerald-500" /> Correct Answer Selection
                        </label>
                        <div className="relative">
                          <select
                            value={q.correctAnswer}
                            onChange={(e) => handleUpdateCorrectAnswer(qIndex, e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer"
                          >
                            {q.options.map((opt, oIndex) => (
                              <option key={oIndex} value={opt}>
                                Option {String.fromCharCode(65 + oIndex)}: {opt}
                              </option>
                            ))}
                          </select>
                          <ChevronDown size={14} className="text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>

                    </motion.div>
                  ))}
                </div>

                {/* Workspace footer actions */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50 border border-slate-200 p-4 rounded-3xl shadow-sm">
                  <button
                    onClick={handleAddManualQuestion}
                    className="flex items-center justify-center gap-1.5 px-5 py-3 border border-dashed border-indigo-300 hover:border-indigo-500 bg-white text-indigo-600 font-bold text-xs rounded-xl shadow-sm transition-all active:scale-[0.98]"
                  >
                    <Plus size={14} /> Add Manual Question
                  </button>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      onClick={cancelPreview}
                      className="flex-1 sm:flex-none px-6 py-3 border border-slate-200 hover:bg-slate-100 text-slate-500 font-bold text-xs rounded-xl shadow-inner-sm transition-all"
                    >
                      Discard Draft
                    </button>
                    <button
                      onClick={() => handleSaveQuiz("DRAFT")}
                      className="flex-1 sm:flex-none px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-sm transition-all active:scale-[0.98]"
                    >
                      Save Draft
                    </button>
                    <button
                      onClick={() => handleSaveQuiz("PUBLISHED")}
                      className="flex-1 sm:flex-none px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
                    >
                      <Send size={12} /> Assign to Students
                    </button>
                  </div>
                </div>

              </div>
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
