"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Calendar, User as UserIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function StudentMentoringPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/student/mentoring")
      .then(res => res.json())
      .then(data => {
        if (data.success) setPlans(data.data.plans);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6 pb-24">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 rounded-2xl shadow-lg text-white">
        <h1 className="text-3xl font-bold mb-2">My Learning Paths</h1>
        <p className="text-indigo-100 text-lg">Personalized study paths created by your teachers to help you succeed.</p>
      </div>

      <div className="space-y-8">
        {plans.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-300">
            <h3 className="text-lg font-medium text-slate-900">No Learning Paths</h3>
            <p className="text-slate-500 mt-1">You currently have no active learning paths.</p>
          </div>
        ) : plans.map((plan: any) => (
          <Card key={plan.id} className="border-slate-200 shadow-md overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between py-4">
              <CardTitle className="text-lg font-semibold text-slate-800 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-indigo-600" />
                4-Week Recovery Plan
              </CardTitle>
              <div className="text-sm text-slate-500 flex items-center">
                <UserIcon className="w-4 h-4 mr-1" />
                Assigned by: {plan.teacherName || "Teacher"}
                <span className="mx-2">•</span>
                {new Date(plan.createdAt).toLocaleDateString()}
              </div>
            </CardHeader>
            <CardContent className="p-8 bg-white prose prose-indigo max-w-none">
              <ReactMarkdown>{plan.planContent}</ReactMarkdown>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
