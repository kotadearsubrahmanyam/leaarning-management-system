"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Award, BookOpen, CheckCircle, XCircle } from "lucide-react";

export default function ResultsPage() {
  const { data: authData } = useQuery({
    queryKey: ["authMe"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) throw new Error("Unauthorized");
      return res.json();
    },
  });
  const role = authData?.data?.user?.role;

  const { data, isLoading } = useQuery({
    queryKey: ["results", role],
    queryFn: async () => {
      const endpoint = role === "ADMIN" ? "/api/admin/results" : "/api/student/results";
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error("Failed to fetch results");
      return res.json();
    },
    enabled: !!role,
  });

  const results = data?.data?.results || [];

  return (
    <div className="max-w-5xl mx-auto pb-12 relative z-10">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-3">
          <Award size={32} /> {role === "ADMIN" ? "Institutional Results" : "Exam Results"}
        </h1>
        <p className="text-foreground/70">
          {role === "ADMIN" ? "Review and validate student academic performance." : "View your marks and final grades for your courses."}
        </p>
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-40 glass rounded-3xl animate-pulse" />)}
        </div>
      ) : results.length === 0 ? (
        <div className="glass p-12 rounded-3xl border border-white/10 text-center">
          <Award size={48} className="mx-auto text-foreground/20 mb-4" />
          <p className="text-foreground/50">No results published yet.</p>
        </div>
      ) : role === "ADMIN" ? (
        <div className="glass rounded-3xl border border-white/10 overflow-hidden">
          <div className="grid grid-cols-5 bg-white/5 p-4 font-semibold text-foreground/80 border-b border-white/10 text-sm">
            <div>Date</div>
            <div className="col-span-2">Course Name</div>
            <div>Student Name</div>
            <div>Grade / Marks</div>
          </div>
          <div className="divide-y divide-white/5">
            {results.map((r: any, i: number) => (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                key={r.id} className="grid grid-cols-5 p-4 items-center hover:bg-white/5 transition-colors text-sm"
              >
                <div className="text-foreground/50">{new Date(r.date).toLocaleDateString()}</div>
                <div className="col-span-2 font-bold text-foreground/90">{r.courseName}</div>
                <div className="text-primary font-medium">{r.studentName}</div>
                <div>
                  <span className={`font-bold mr-2 ${['A', 'A+'].includes(r.grade) ? 'text-green-500' : ['B', 'B+'].includes(r.grade) ? 'text-blue-500' : r.grade === 'F' ? 'text-red-500' : 'text-primary'}`}>
                    {r.grade}
                  </span>
                  <span className="text-foreground/50 text-xs">({r.marks}/100)</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-12">
          {Object.entries(
            results.reduce((acc: any, r: any) => {
              const sem = r.semester || 1;
              if (!acc[sem]) acc[sem] = [];
              acc[sem].push(r);
              return acc;
            }, {})
          ).map(([semester, semsResults]: [string, any]) => {
            const totalMarks = semsResults.reduce((sum: number, r: any) => sum + r.marks, 0);
            const isSemesterPass = semsResults.every((r: any) => r.isPass);
            const gpa = ((totalMarks / (semsResults.length * 100)) * 10).toFixed(2); // Simple 10-point scale

            return (
              <div key={semester} className="glass p-8 rounded-3xl border border-white/10">
                <div className="flex justify-between items-end border-b border-white/10 pb-4 mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-primary">Semester {semester}</h2>
                    <p className="text-foreground/70 text-sm mt-1">
                      Status: {isSemesterPass ? (
                        <span className="text-green-500 font-bold ml-1">PASS</span>
                      ) : (
                        <span className="text-red-500 font-bold ml-1">FAIL</span>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-foreground/50 mb-1">Semester GPA</p>
                    <p className="text-3xl font-black text-primary">{gpa}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {semsResults.map((r: any, i: number) => (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
                      className={`glass p-6 rounded-3xl border flex flex-col justify-between hover:shadow-lg transition-all ${
                        r.isPass ? "border-green-500/20" : "border-red-500/20"
                      }`}
                    >
                      <div className="flex items-start gap-3 mb-6">
                        <div className={`p-2 rounded-xl shrink-0 ${r.isPass ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                          {r.isPass ? <CheckCircle size={20} /> : <XCircle size={20} />}
                        </div>
                        <h3 className="font-bold text-foreground leading-tight line-clamp-2">{r.courseName}</h3>
                      </div>
                      <div className="flex items-end justify-between border-t border-white/10 pt-4">
                        <div>
                          <p className="text-xs text-foreground/50 mb-1">Marks</p>
                          <p className={`text-2xl font-bold ${r.isPass ? "text-green-500" : "text-red-500"}`}>
                            {r.marks}<span className="text-sm font-normal">/100</span>
                          </p>
                        </div>
                        <div className="flex flex-col items-end">
                          <p className="text-xs text-foreground/50 mb-1">Grade</p>
                          <div className={`text-2xl font-black ${['A', 'A+'].includes(r.grade) ? 'text-green-500' : ['B', 'B+'].includes(r.grade) ? 'text-blue-500' : r.grade === 'F' ? 'text-red-500' : 'text-primary'}`}>
                            {r.grade}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
