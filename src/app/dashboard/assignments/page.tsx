"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { FileEdit, CheckCircle, Clock } from "lucide-react";
import { AnimatedButton } from "@/components/ui/animated-button";
import Link from "next/link";

export default function AssignmentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["assignments"],
    queryFn: async () => {
      const res = await fetch("/api/student/assignments");
      if (!res.ok) throw new Error("Failed to fetch assignments");
      return res.json();
    },
  });

  const assignments = data?.data?.assignments || [];

  return (
    <div className="max-w-5xl mx-auto pb-12 relative z-10">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-3">
          <FileEdit size={32} /> Assignments
        </h1>
        <p className="text-foreground/70">View and submit your course assignments.</p>
      </motion.div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 glass border border-slate-300 rounded-3xl animate-pulse bg-white/50" />
          ))}
        </div>
      ) : assignments.length === 0 ? (
        <div className="glass p-12 rounded-3xl border border-slate-300 text-center">
          <FileEdit size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-foreground/50">No assignments posted for your courses.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((a: any, i: number) => {
            const isSubmitted = a.submissionStatus !== null;
            const isGraded = a.submissionStatus === "GRADED";

            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass p-5 rounded-3xl border border-slate-300 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 transition-all duration-300"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {/* Subject Name */}
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {a.courseName}
                    </span>
                    {/* Due Date */}
                    <span className="text-xs text-slate-500 flex items-center gap-1 bg-slate-100/60 px-2.5 py-1 rounded-full border border-slate-200/50">
                      <Clock size={12} className="text-slate-400" /> Due {new Date(a.dueDate).toLocaleDateString()}
                    </span>
                    {/* Status Badge */}
                    {isGraded ? (
                      <span className="inline-flex items-center gap-1.5 bg-green-500/10 text-green-600 border border-green-500/20 px-2.5 py-1 rounded-full font-bold text-xs">
                        Graded
                      </span>
                    ) : isSubmitted ? (
                      <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2.5 py-1 rounded-full font-bold text-xs">
                        <CheckCircle size={12} /> Submitted
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2.5 py-1 rounded-full font-bold text-xs">
                        Pending
                      </span>
                    )}
                  </div>
                  {/* Assignment Title */}
                  <h3 className="text-lg font-bold text-slate-800">{a.title}</h3>
                </div>

                {/* Actions */}
                <div className="shrink-0 flex flex-wrap items-center gap-3">
                  <Link href={`/dashboard/assignments/${a.id}`}>
                    <button className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-800 rounded-xl font-bold text-sm transition-all duration-200">
                      View Assignment
                    </button>
                  </Link>

                  {!isSubmitted && !isGraded && (
                    <Link href={`/dashboard/assignments/${a.id}`}>
                      <AnimatedButton>
                        Submit Work
                      </AnimatedButton>
                    </Link>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
