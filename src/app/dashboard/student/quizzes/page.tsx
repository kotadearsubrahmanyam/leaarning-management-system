"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, PlayCircle, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function StudentQuizzesPage() {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/student/quizzes")
      .then(res => res.json())
      .then(data => {
        if (data.success) setQuizzes(data.data.quizzes);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h1 className="text-2xl font-bold text-slate-800">My Quizzes</h1>
        <p className="text-slate-500">Take practice quizzes for your enrolled courses</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white rounded-xl border border-dashed border-slate-300">
            <h3 className="text-lg font-medium text-slate-900">No quizzes available</h3>
            <p className="text-slate-500 mt-1">Your teachers haven't generated any quizzes yet.</p>
          </div>
        ) : quizzes.map(quiz => (
          <Card key={quiz.id} className={`border-slate-200 shadow-sm ${quiz.isCompleted ? 'bg-slate-50 opacity-80' : 'hover:shadow-md transition-shadow'}`}>
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-lg font-semibold text-indigo-900">{quiz.title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Time Limit:</span>
                <span className="font-medium text-slate-700">{quiz.timeLimit} mins</span>
              </div>
              
              {quiz.isCompleted ? (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Your Score:</span>
                    <span className={`font-bold ${quiz.isMalpractice ? 'text-red-600' : 'text-emerald-600'}`}>
                      {quiz.isMalpractice ? '0 (Malpractice)' : `${quiz.score} / ${quiz.totalPoints}`}
                    </span>
                  </div>
                  <Button disabled variant="outline" className="w-full text-emerald-700 border-emerald-200 bg-emerald-50">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Completed
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={() => router.push(`/dashboard/student/quizzes/${quiz.id}/take`)} 
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Take Quiz
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
