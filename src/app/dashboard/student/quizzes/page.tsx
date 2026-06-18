"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Loader2, 
  PlayCircle, 
  CheckCircle, 
  X, 
  Check, 
  AlertTriangle, 
  RefreshCw, 
  Calendar, 
  Clock, 
  Award, 
  Star, 
  BookOpen, 
  AlertCircle,
  HelpCircle,
  TrendingUp,
  BrainCircuit,
  GraduationCap
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

const getQuestionTopic = (questionText: string, courseName: string): string => {
  const text = questionText.toLowerCase();
  if (text.includes("sql") || text.includes("select") || text.includes("insert") || text.includes("update") || text.includes("query") || text.includes("queries")) return "SQL Queries";
  if (text.includes("join") || text.includes("inner") || text.includes("outer") || text.includes("joins")) return "Joins";
  if (text.includes("normal") || text.includes("nf") || text.includes("normalization") || text.includes("dependency")) return "Database Normalization";
  if (text.includes("er ") || text.includes("entity") || text.includes("relationship") || text.includes("diagram")) return "ER Models";
  if (text.includes("index") || text.includes("b-tree") || text.includes("hash") || text.includes("indexing")) return "Indexing & Hashing";
  if (text.includes("transaction") || text.includes("acid") || text.includes("concurrency") || text.includes("lock")) return "Transactions & Concurrency";
  if (text.includes("nosql") || text.includes("mongodb") || text.includes("document")) return "NoSQL Databases";
  if (text.includes("class") || text.includes("object") || text.includes("inherit") || text.includes("polymorph")) return "OOP Concepts";
  if (text.includes("process") || text.includes("thread") || text.includes("memory") || text.includes("cpu")) return "OS Basics";
  if (text.includes("network") || text.includes("protocol") || text.includes("ip") || text.includes("tcp")) return "Networking";
  if (text.includes("algorithm") || text.includes("sorting") || text.includes("complexity") || text.includes("o(")) return "Algorithms";
  if (text.includes("array") || text.includes("list") || text.includes("tree") || text.includes("graph")) return "Data Structures";
  return `${courseName} Basics`;
};

export default function StudentQuizzesPage() {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Results Review Modal states
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [results, setResults] = useState<any | null>(null);
  const [loadingResults, setLoadingResults] = useState(false);
  const [generatingRetake, setGeneratingRetake] = useState(false);
  
  const router = useRouter();
  const { toast } = useToast();

  const fetchQuizzes = () => {
    setLoading(true);
    fetch("/api/student/quizzes")
      .then(res => res.json())
      .then(data => {
        if (data.success) setQuizzes(data.data.quizzes);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handleViewResults = async (quizId: string) => {
    setSelectedQuizId(quizId);
    setLoadingResults(true);
    setResults(null);
    try {
      const res = await fetch(`/api/student/quizzes/${quizId}/results`);
      const data = await res.json();
      if (data.success) {
        setResults(data.data);
      } else {
        toast({ title: "Error", description: data.message || "Failed to fetch results", variant: "destructive" });
        setSelectedQuizId(null);
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to fetch results", variant: "destructive" });
      setSelectedQuizId(null);
    } finally {
      setLoadingResults(false);
    }
  };

  const handleRetakeQuiz = async (quizId: string) => {
    setGeneratingRetake(true);
    try {
      const res = await fetch(`/api/student/quizzes/${quizId}/retake`, {
        method: "POST"
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Practice Mode Active", description: "Brand new questions generated successfully!", variant: "default" });
        // Close modal and redirect
        setSelectedQuizId(null);
        setResults(null);
        router.push(`/dashboard/student/quizzes/${data.data.quizId}/take`);
      } else {
        toast({ title: "Failed to Retake", description: data.message || "Could not generate practice questions.", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to start practice retake.", variant: "destructive" });
    } finally {
      setGeneratingRetake(false);
    }
  };

  const formatTimeTaken = (seconds: number | null) => {
    if (seconds === null || seconds === undefined) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs} secs`;
    return `${mins} min${mins > 1 ? 's' : ''} ${secs > 0 ? `${secs} sec${secs > 1 ? 's' : ''}` : ''}`;
  };

  // Extract Summary Statistics & Strengths/Weaknesses
  let correctCount = 0;
  let incorrectCount = 0;
  let percentage = 0;
  let strengths: string[] = [];
  let areasToImprove: string[] = [];

  if (results) {
    percentage = results.totalPoints > 0 ? Math.round((results.score / results.totalPoints) * 100) : 0;
    
    const correctQuestions: any[] = [];
    const incorrectQuestions: any[] = [];
    
    results.questions.forEach((q: any) => {
      const isCorrect = results.answers[q.id] === q.correctAnswer;
      if (isCorrect) {
        correctQuestions.push(q);
        correctCount++;
      } else {
        incorrectQuestions.push(q);
        incorrectCount++;
      }
    });

    const incorrectTopics = new Set(incorrectQuestions.map(q => getQuestionTopic(q.question, results.courseName)));
    const correctTopics = new Set(correctQuestions.map(q => getQuestionTopic(q.question, results.courseName)));

    areasToImprove = Array.from(incorrectTopics);
    strengths = Array.from(correctTopics).filter(topic => !incorrectTopics.has(topic));

    if (strengths.length === 0 && correctQuestions.length > 0) {
      strengths.push("Core Concepts");
    }
    if (areasToImprove.length === 0 && incorrectQuestions.length > 0) {
      areasToImprove.push("Core Concepts");
    }
  }

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-[#7C3AED]" /></div>;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-[#7C3AED] to-[#A855F7] p-6 rounded-xl shadow-md text-white">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <GraduationCap className="h-7 w-7" />
          My Quizzes
        </h1>
        <p className="text-purple-100 mt-1">Review your completed submissions, check detailed explanations, and retake for infinite practice!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white rounded-xl border border-dashed border-[#E5E7EB]">
            <h3 className="text-lg font-medium text-[#111827]">No quizzes available</h3>
            <p className="text-[#6B7280] mt-1">Your teachers haven't generated any quizzes yet.</p>
          </div>
        ) : quizzes.map(quiz => {
          const isPractice = quiz.title.includes("(Practice Retake)");
          return (
            <Card key={quiz.id} className={`border-[#E5E7EB] bg-white shadow-sm relative overflow-hidden flex flex-col justify-between ${quiz.isCompleted ? 'bg-slate-50/50 border-slate-200' : 'hover:shadow-md transition-shadow'}`}>
              {isPractice && (
                <div className="absolute top-0 right-0 bg-[#A855F7] text-white text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-bl-lg">
                  Practice Mode
                </div>
              )}
              <div>
                <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/30">
                  <CardTitle className="text-lg font-semibold text-[#111827] pr-12 truncate">{quiz.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B7280]">Time Limit:</span>
                    <span className="font-medium text-[#111827]">{quiz.timeLimit} mins</span>
                  </div>
                  
                  {quiz.isCompleted && (
                    <div className="flex justify-between text-sm pb-1">
                      <span className="text-[#6B7280]">Your Score:</span>
                      <span className={`font-bold ${quiz.isMalpractice ? 'text-[#EF4444]' : 'text-[#10B981]'}`}>
                        {quiz.isMalpractice ? '0 (Malpractice)' : `${quiz.score} / ${quiz.totalPoints}`}
                      </span>
                    </div>
                  )}
                </CardContent>
              </div>

              <div className="p-4 pt-0">
                {quiz.isCompleted ? (
                  <Button 
                    onClick={() => handleViewResults(quiz.id)} 
                    variant="outline" 
                    className="w-full text-[#7C3AED] border-[#7C3AED]/20 bg-purple-50/40 hover:bg-[#7C3AED]/5 hover:text-[#7C3AED] transition-all font-semibold flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4 text-[#10B981]" />
                    View Results
                  </Button>
                ) : (
                  <Button 
                    onClick={() => router.push(`/dashboard/student/quizzes/${quiz.id}/take`)} 
                    className="w-full bg-[#7C3AED] hover:bg-[#7C3AED]/90 text-white font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <PlayCircle className="h-4 w-4" />
                    Take Quiz
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* QUIZ RESULTS REVIEW MODAL (CENTERED & COLOR SYSTEM ALIGNED) */}
      {selectedQuizId && (
        <div className="fixed inset-0 bg-[#111827]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#F8FAFC] w-full md:w-[78vw] max-w-5xl h-[88vh] rounded-2xl shadow-2xl border border-[#E5E7EB] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            {loadingResults ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-4 bg-white">
                <Loader2 className="animate-spin h-10 w-10 text-[#7C3AED]" />
                <p className="text-[#6B7280] font-medium animate-pulse">Analyzing results & generating explanations...</p>
              </div>
            ) : results ? (
              <>
                {/* Sticky Header */}
                <div className="bg-white border-b border-[#E5E7EB] p-4 px-6 flex justify-between items-center shrink-0">
                  <h3 className="font-bold text-[#111827] text-lg flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-[#7C3AED]" />
                    Quiz Results Review
                  </h3>
                  <button 
                    onClick={() => { setSelectedQuizId(null); setResults(null); }}
                    className="text-[#6B7280] hover:text-[#111827] bg-[#F8FAFC] hover:bg-slate-100 p-2 rounded-full transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
                  
                  {/* Academic Malpractice Warning */}
                  {results.isMalpractice && (
                    <div className="bg-[#FEF2F2] border border-[#EF4444]/30 rounded-xl p-4 flex items-start gap-3 text-[#EF4444] shadow-sm animate-pulse">
                      <AlertCircle className="w-5 h-5 shrink-0 text-[#EF4444] mt-0.5" />
                      <div>
                        <p className="font-bold text-sm">Academic Malpractice Detected</p>
                        <p className="text-xs text-[#EF4444]/90 mt-0.5">
                          This quiz attempt was automatically flagged and terminated due to rules violation (e.g. switching tabs, exiting fullscreen, or copying text). A score of 0 has been recorded.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Clean Summary Card (Google Forms / Coursera Style) */}
                  <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#A855F7]">{results.courseName}</span>
                      <h2 className="text-2xl font-bold text-[#111827]">{results.quizTitle}</h2>
                      <p className="text-xs text-[#6B7280]">
                        Submitted on {new Date(results.submissionDate).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 md:gap-8 border-t md:border-t-0 pt-4 md:pt-0">
                      <div className="text-left">
                        <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Score</p>
                        <p className="text-xl font-extrabold text-[#7C3AED]">
                          {results.isMalpractice ? "0" : `${results.score} / ${results.totalQuestions}`}
                        </p>
                      </div>
                      
                      <div className="text-left border-l border-[#E5E7EB] pl-4 md:pl-8">
                        <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Percentage</p>
                        <p className="text-xl font-extrabold text-[#7C3AED]">
                          {results.isMalpractice ? "0%" : `${percentage}%`}
                        </p>
                      </div>

                      <div className="text-left border-l border-[#E5E7EB] pl-4 md:pl-8">
                        <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Time Taken</p>
                        <p className="text-xl font-extrabold text-[#7C3AED]">{formatTimeTaken(results.timeTaken)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Redesigned Minimal Question Cards */}
                  <div className="space-y-6">
                    {results.questions.map((q: any, index: number) => {
                      const studentAnswer = results.answers[q.id];
                      const isCorrect = studentAnswer === q.correctAnswer;
                      
                      return (
                        <div 
                          key={q.id} 
                          className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm space-y-5 transition-all hover:shadow-md"
                        >
                          {/* Question Index & Right/Wrong Status */}
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Question {index + 1}</span>
                            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                              isCorrect 
                                ? "bg-[#ECFDF5] text-[#10B981] border border-[#10B981]/15" 
                                : "bg-[#FEF2F2] text-[#EF4444] border border-[#EF4444]/15"
                            }`}>
                              {isCorrect ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-[#10B981]" />
                                  Correct
                                </>
                              ) : (
                                <>
                                  <X className="w-3.5 h-3.5 text-[#EF4444]" />
                                  Incorrect
                                </>
                              )}
                            </span>
                          </div>

                          {/* Question Text */}
                          <h3 className="text-base font-bold text-[#111827] leading-relaxed">{q.question}</h3>

                          {/* Simplified Selected & Correct Option Cards */}
                          <div className="space-y-3">
                            {/* Your Answer */}
                            <div className={`p-4 rounded-xl border text-sm flex items-center justify-between ${
                              isCorrect 
                                ? "bg-[#ECFDF5]/30 border-[#10B981]/25 text-[#111827]" 
                                : "bg-[#FEF2F2]/30 border-[#EF4444]/25 text-[#111827]"
                            }`}>
                              <div>
                                <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block mb-0.5">Your Answer</span>
                                <span className="font-semibold text-slate-800">{studentAnswer || "(No Answer Selected)"}</span>
                              </div>
                              {isCorrect ? (
                                <Check className="w-4 h-4 text-[#10B981] shrink-0" />
                              ) : (
                                <X className="w-4 h-4 text-[#EF4444] shrink-0" />
                              )}
                            </div>

                            {/* Correct Answer (shows if student got it wrong) */}
                            {!isCorrect && (
                              <div className="p-4 rounded-xl border border-[#10B981]/25 bg-[#ECFDF5]/30 text-[#111827] text-sm flex items-center justify-between">
                                <div>
                                  <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block mb-0.5">Correct Answer</span>
                                  <span className="font-semibold text-slate-800">{q.correctAnswer}</span>
                                </div>
                                <Check className="w-4 h-4 text-[#10B981] shrink-0" />
                              </div>
                            )}
                          </div>

                          {/* High-Quality Explanation Block */}
                          <div className="bg-[#F8FAFC] border-l-4 border-[#7C3AED] p-4 rounded-r-xl space-y-1">
                            <span className="text-[10px] font-bold text-[#7C3AED] uppercase tracking-wider flex items-center gap-1.5 mb-1">
                              <BrainCircuit className="w-3.5 h-3.5" />
                              Explanation
                            </span>
                            <p className="text-xs md:text-sm text-[#6B7280] leading-relaxed font-medium">{q.explanation}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Redesigned Performance Summary Card */}
                  <Card className="border-[#E5E7EB] bg-white shadow-sm overflow-hidden rounded-2xl">
                    <div className="p-4 bg-slate-50 border-b font-bold text-slate-700 text-sm flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-[#7C3AED]" />
                      Performance Analysis Summary
                    </div>
                    <CardContent className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Left: Score Details */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-bold text-[#6B7280] flex items-center gap-1.5">
                          <TrendingUp className="w-4 h-4 text-slate-500" />
                          Scores & Metrics
                        </h4>
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm font-semibold text-[#111827]">
                            <span className="text-[#6B7280]">Correct Answers</span>
                            <span className="text-[#10B981]">{correctCount}</span>
                          </div>
                          <div className="flex justify-between text-sm font-semibold text-[#111827]">
                            <span className="text-[#6B7280]">Incorrect Answers</span>
                            <span className="text-[#EF4444]">{incorrectCount}</span>
                          </div>
                          <div className="flex justify-between text-sm font-bold text-[#111827] border-t border-[#E5E7EB] pt-2.5">
                            <span className="text-[#111827]">Final Score</span>
                            <span className="text-[#7C3AED]">{results.isMalpractice ? "0" : results.score} / {results.totalQuestions}</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-[#E5E7EB] rounded-full h-2.5 overflow-hidden">
                          <div 
                            className="bg-[#7C3AED] h-2.5 rounded-full transition-all duration-500" 
                            style={{ width: `${results.isMalpractice ? 0 : percentage}%` }}
                          />
                        </div>
                      </div>

                      {/* Right: Strengths & Weaknesses */}
                      <div className="space-y-5">
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-[#10B981] uppercase tracking-wider">Strengths</p>
                          <div className="flex flex-wrap gap-2">
                            {strengths.length > 0 ? strengths.map((topic, i) => (
                              <span key={i} className="bg-[#ECFDF5] text-[#10B981] border border-[#10B981]/20 text-[11px] px-3 py-1.5 rounded-full font-semibold shadow-sm flex items-center gap-1">
                                <Check className="w-3.5 h-3.5 text-[#10B981]" />
                                {topic}
                              </span>
                            )) : (
                              <span className="text-xs text-[#6B7280] italic">No strengths identified.</span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-xs font-bold text-[#EF4444] uppercase tracking-wider">Areas to Improve</p>
                          <div className="flex flex-wrap gap-2">
                            {areasToImprove.length > 0 ? areasToImprove.map((topic, i) => (
                              <span key={i} className="bg-[#FEF2F2] text-[#EF4444] border border-[#EF4444]/20 text-[11px] px-3 py-1.5 rounded-full font-semibold shadow-sm flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5 text-[#EF4444]" />
                                {topic}
                              </span>
                            )) : (
                              <span className="text-xs text-[#10B981] font-semibold flex items-center gap-1">
                                <Check className="w-4 h-4 text-[#10B981]" /> Perfect attempt! No weaknesses.
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Sticky Action Footer */}
                <div className="sticky bottom-0 bg-white border-t border-[#E5E7EB] p-4 px-6 flex justify-between items-center shrink-0 z-10">
                  <Button 
                    onClick={() => { setSelectedQuizId(null); setResults(null); }}
                    variant="outline"
                    className="border-[#E5E7EB] text-[#6B7280] hover:bg-[#F8FAFC] font-semibold hover:text-[#111827] transition-colors"
                  >
                    Close Review
                  </Button>

                  <Button 
                    onClick={() => handleRetakeQuiz(selectedQuizId)} 
                    disabled={generatingRetake}
                    className="bg-[#7C3AED] hover:bg-[#7C3AED]/90 text-white font-semibold flex items-center gap-2 shadow-sm transition-all"
                  >
                    {generatingRetake ? (
                      <>
                        <Loader2 className="animate-spin w-4 h-4" />
                        Generating Practice Quiz...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        Retake Quiz
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center space-y-4 bg-white">
                <AlertTriangle className="w-12 h-12 text-[#EF4444]" />
                <p className="text-[#111827] font-semibold">Failed to load result details.</p>
                <Button onClick={() => handleViewResults(selectedQuizId)}>Retry</Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
