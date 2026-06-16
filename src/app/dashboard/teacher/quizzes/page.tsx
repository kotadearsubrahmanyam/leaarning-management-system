"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function TeacherQuizzesPage() {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [qRes, cRes] = await Promise.all([
        fetch("/api/teacher/quizzes"),
        fetch("/api/teacher/courses")
      ]);
      const qData = await qRes.json();
      const cData = await cRes.json();
      if (qData.success) setQuizzes(qData.data.quizzes);
      if (cData.success) {
        setCourses(cData.data.courses);
        if (cData.data.courses.length > 0) {
          setSelectedCourseId(cData.data.courses[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedCourseId) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/teacher/quizzes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: selectedCourseId, count: 10, timeLimit: 15 })
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Success", description: "AI Quiz generated successfully!" });
        fetchData();
      } else {
        toast({ title: "Error", description: data.message, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to generate quiz", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Automated AI Quizzes</h1>
          <p className="text-slate-500">Generate multiple-choice quizzes using AI</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full md:w-auto">
          <select 
            className="border border-slate-200 p-2.5 rounded-lg bg-slate-50 text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 min-w-[240px] cursor-pointer font-medium shadow-sm transition-all hover:border-slate-300"
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
          >
            {courses.length === 0 ? (
              <option value="" disabled>No courses assigned</option>
            ) : (
              courses.map(c => {
                const isAssigned = c.isAssigned !== false;
                return (
                  <option key={c.id} value={c.id} disabled={!isAssigned}>
                    {c.title} {!isAssigned ? "(N/A)" : ""}
                  </option>
                );
              })
            )}
          </select>
          <Button onClick={handleGenerate} disabled={generating || courses.length === 0} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md whitespace-nowrap px-6 py-5">
            {generating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <PlusCircle className="mr-2 h-5 w-5" />}
            Generate AI Quiz
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white rounded-xl border border-dashed border-slate-300">
            <h3 className="text-lg font-medium text-slate-900">No quizzes generated yet</h3>
            <p className="text-slate-500 mt-1">Select a course and click generate to create your first AI quiz.</p>
          </div>
        ) : quizzes.map(quiz => (
          <Card key={quiz.id} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-lg font-semibold text-indigo-900">{quiz.title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Time Limit:</span>
                <span className="font-medium text-slate-700">{quiz.timeLimit} mins</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Created:</span>
                <span className="font-medium text-slate-700">{new Date(quiz.createdAt).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
