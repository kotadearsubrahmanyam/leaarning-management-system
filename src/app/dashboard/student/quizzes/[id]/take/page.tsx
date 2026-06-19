"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, AlertTriangle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function TakeQuizPage({ params }: { params: { id: string } }) {
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [warnings, setWarnings] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    fetch(`/api/student/quizzes/${params.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setQuiz(data.data.quiz);
          setTimeLeft(data.data.quiz.timeLimit * 60);
        } else {
          toast({ title: "Error", description: data.message, variant: "destructive" });
          router.push("/dashboard/student/quizzes");
        }
        setLoading(false);
      });
      
    // Prevent leaving the page easily
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (started && !submitting) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [params.id, started, submitting]);

  // Anti-Cheat: Fullscreen monitoring
  useEffect(() => {
    if (!started) return;

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        handleWarning("You exited full screen mode!");
      }
    };
    
    // Anti-Cheat: Visibility Change (Tab Switching)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleWarning("You switched tabs or minimized the browser!");
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [started, warnings]);

  // Timer
  useEffect(() => {
    if (started && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (started && timeLeft <= 0) {
      handleSubmit(false); // Auto submit when time is up
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [started, timeLeft]);

  const handleWarning = (reason: string) => {
    const newWarnings = warnings + 1;
    setWarnings(newWarnings);
    
    if (newWarnings >= 3) {
      toast({ 
        title: "Quiz Terminated", 
        description: "Quiz ended abnormally due to repeated malpractice.", 
        variant: "destructive",
        duration: 5000
      });
      handleSubmit(true); // Malpractice submit
    } else {
      toast({ 
        title: `Warning ${newWarnings}/3`, 
        description: `${reason} Please return to the quiz immediately or it will be terminated.`, 
        variant: "destructive",
        duration: 5000
      });
    }
  };

  const startQuiz = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setStarted(true);
    } catch (err) {
      toast({ title: "Error", description: "You must allow full screen to take this quiz.", variant: "destructive" });
    }
  };

  const handleSubmit = async (isMalpractice = false) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen().catch(e => console.error(e));
      }

      const timeLimitSeconds = quiz.timeLimit * 60;
      const timeTaken = Math.max(0, timeLimitSeconds - timeLeft);

      const res = await fetch("/api/student/quizzes/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: quiz.id,
          answers,
          isMalpractice,
          timeTaken
        })
      });
      const data = await res.json();
      if (data.success) {
        toast({ 
          title: isMalpractice ? "Quiz Failed" : "Quiz Submitted", 
          description: isMalpractice ? "0 points awarded due to malpractice." : `You scored ${data.data.score}/${data.data.totalPoints}`,
          variant: isMalpractice ? "destructive" : "default"
        });
        router.push("/dashboard/student/quizzes");
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to submit quiz", variant: "destructive" });
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  if (!quiz) return null;

  if (!started) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-lg border-slate-200">
          <CardContent className="p-8 space-y-6 text-center">
            <h1 className="text-2xl font-bold text-slate-800">{quiz.title}</h1>
            <div className="bg-amber-50 text-amber-800 p-4 rounded-md text-sm text-left space-y-2 border border-amber-200">
              <p className="font-semibold flex items-center"><AlertTriangle className="w-4 h-4 mr-2" /> Anti-Cheat Rules:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Quiz must be taken in Full Screen.</li>
                <li>Do not switch tabs or minimize the browser.</li>
                <li>Copying and Right-clicking are disabled.</li>
                <li><strong>3 Warnings = Automatic Failure (0 points).</strong></li>
              </ul>
            </div>
            <div className="flex justify-between text-slate-600 font-medium pb-4 border-b">
              <span>Questions: {quiz.questions.length}</span>
              <span>Time Limit: {quiz.timeLimit} mins</span>
            </div>
            <Button onClick={startQuiz} className="w-full bg-indigo-600 hover:bg-indigo-700 text-lg py-6">
              I Understand, Start Quiz
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div 
      className="min-h-screen bg-slate-50 p-4 md:p-8 select-none"
      onCopy={(e) => { e.preventDefault(); handleWarning("Copying text is prohibited."); }}
      onCut={(e) => { e.preventDefault(); handleWarning("Cutting text is prohibited."); }}
      onPaste={(e) => { e.preventDefault(); handleWarning("Pasting text is prohibited."); }}
      onContextMenu={(e) => { e.preventDefault(); handleWarning("Right-clicking is prohibited."); }}
    >
      <div className="max-w-4xl mx-auto space-y-6 pb-24">
        {/* Header Bar */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 p-4 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800 truncate">{quiz.title}</h2>
          <div className="flex items-center gap-6">
            <div className={`font-bold flex items-center ${warnings > 0 ? 'text-red-500' : 'text-slate-500'}`}>
              <AlertTriangle className="w-4 h-4 mr-1" />
              Warnings: {warnings}/3
            </div>
            <div className={`font-mono text-xl font-bold flex items-center ${timeLeft < 60 ? 'text-red-600 animate-pulse' : 'text-slate-700'}`}>
              <Clock className="w-5 h-5 mr-2" />
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {quiz.questions.map((q: any, i: number) => (
            <Card key={q.id} className="border-slate-200 shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-medium text-slate-800 mb-4">
                  <span className="text-indigo-600 font-bold mr-2">{i + 1}.</span>
                  {q.question}
                </h3>
                <div className="space-y-3">
                  {q.options.map((opt: string, optIdx: number) => (
                    <label 
                      key={optIdx} 
                      className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                        answers[q.id] === opt 
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-900' 
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name={`question-${q.id}`} 
                        value={opt}
                        checked={answers[q.id] === opt}
                        onChange={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                        className="mr-3 h-4 w-4 text-indigo-600 focus:ring-indigo-600"
                      />
                      <span className="leading-relaxed">{opt}</span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Submit Bar */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] flex justify-center z-20">
          <Button 
            onClick={() => handleSubmit(false)} 
            disabled={submitting}
            className="w-full max-w-md bg-emerald-600 hover:bg-emerald-700 text-white text-lg py-6"
          >
            {submitting ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : null}
            Submit Quiz
          </Button>
        </div>
      </div>
    </div>
  );
}
