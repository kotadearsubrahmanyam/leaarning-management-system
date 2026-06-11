"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Award, CheckCircle, Clock, ExternalLink, Search } from "lucide-react";
import { AnimatedButton } from "@/components/ui/animated-button";

export default function TeacherActivityEvaluationPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [evaluatingId, setEvaluatingId] = useState<string | null>(null);
  const [marks, setMarks] = useState<number | "">("");

  // Fetch activities
  const { data: activitiesData, isLoading } = useQuery({
    queryKey: ["teacherActivities"],
    queryFn: async () => {
      const res = await fetch("/api/teacher/activities");
      if (!res.ok) throw new Error("Failed to fetch activities");
      return res.json();
    }
  });

  // Evaluate mutation
  const evaluateMutation = useMutation({
    mutationFn: async ({ id, score }: { id: string, score: number }) => {
      const res = await fetch(`/api/teacher/activities/${id}/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marks: score }),
      });
      if (!res.ok) throw new Error("Failed to evaluate activity");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacherActivities"] });
      setEvaluatingId(null);
      setMarks("");
    },
    onError: (err: any) => {
      alert(err.message);
    }
  });

  const activities = activitiesData?.data?.activities || [];
  
  const filteredActivities = activities.filter((a: any) => 
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.studentRoll.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingActivities = filteredActivities.filter((a: any) => a.marks === null);
  const evaluatedActivities = filteredActivities.filter((a: any) => a.marks !== null);

  if (isLoading) {
    return (
      <div className="flex space-x-6 pb-12">
        <div className="glass w-full h-[600px] rounded-2xl animate-pulse bg-white/20" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-3">
          <Award className="w-8 h-8" />
          Day-to-Day Activity Evaluation (Debug: {activitiesData ? "DataLoaded" : "NoData"}, {activities.length} acts)
        </h1>
        <p className="text-foreground/70">
          Review and grade extracurricular activities submitted by students in your courses.
        </p>
      </motion.div>

      <div className="glass p-6 rounded-2xl mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/50" />
          <input
            type="text"
            placeholder="Search by student name, roll number, or activity title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-800"
          />
        </div>
      </div>

      <div className="space-y-8">
        {/* PENDING EVALUATION */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-500" />
            Pending Evaluation ({pendingActivities.length})
          </h2>
          {pendingActivities.length === 0 ? (
            <div className="glass p-8 rounded-2xl text-center text-foreground/50">
              No pending activities to evaluate.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {pendingActivities.map((activity: any) => (
                <motion.div 
                  key={activity.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass p-6 rounded-2xl border border-yellow-500/20 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500" />
                  
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-primary">{activity.title}</h3>
                      <span className="inline-block px-2 py-1 bg-white/10 rounded-md text-xs font-medium mt-2">
                        {activity.type.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="text-xs text-foreground/50">{new Date(activity.date).toLocaleDateString()}</span>
                  </div>

                  <div className="space-y-2 mb-6 text-sm">
                    <p><span className="text-foreground/50">Student:</span> <span className="font-medium">{activity.studentName}</span></p>
                    <p><span className="text-foreground/50">Roll No:</span> {activity.studentRoll}</p>
                    {activity.description && (
                      <p className="mt-2 text-foreground/70 line-clamp-2">{activity.description}</p>
                    )}
                    {activity.proofUrl && (
                      <a 
                        href={activity.proofUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline mt-2"
                      >
                        <ExternalLink className="w-4 h-4" /> View Proof Document
                      </a>
                    )}
                  </div>

                  <div className="pt-4 border-t border-white/10 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <label className="block text-xs text-foreground/50 mb-1">Marks (out of 10)</label>
                      <input 
                        type="number" 
                        min="0" 
                        max="10" 
                        value={evaluatingId === activity.id ? marks : ""}
                        onChange={(e) => {
                          setEvaluatingId(activity.id);
                          setMarks(parseInt(e.target.value) || "");
                        }}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-slate-800"
                        placeholder="0-10"
                      />
                    </div>
                    <AnimatedButton 
                      className="mt-5 w-auto shrink-0 px-8"
                      disabled={evaluatingId !== activity.id || marks === "" || marks < 0 || marks > 10 || evaluateMutation.isPending}
                      onClick={() => evaluateMutation.mutate({ id: activity.id, score: marks as number })}
                    >
                      {evaluateMutation.isPending && evaluatingId === activity.id ? "Saving..." : "Submit Marks"}
                    </AnimatedButton>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* EVALUATED */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 mt-12">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            Evaluated Activities ({evaluatedActivities.length})
          </h2>
          {evaluatedActivities.length === 0 ? (
            <div className="glass p-8 rounded-2xl text-center text-foreground/50">
              No evaluated activities yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {evaluatedActivities.map((activity: any) => (
                <motion.div 
                  key={activity.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass p-6 rounded-2xl border border-emerald-500/20 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                  
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-primary">{activity.title}</h3>
                      <p className="text-sm font-medium mt-1">
                        Student: {activity.studentName} <span className="text-foreground/50 text-xs">({activity.studentRoll})</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-emerald-400">{activity.marks}<span className="text-sm text-foreground/50">/10</span></div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-white/10 flex justify-between items-center text-xs text-foreground/50">
                    <p>Evaluated by: <span className="font-medium text-foreground">{activity.evaluatorName}</span></p>
                    <p>{new Date(activity.evaluatedAt).toLocaleDateString()}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
