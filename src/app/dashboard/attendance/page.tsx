"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Calendar, Check, X, Clock } from "lucide-react";

export default function AttendancePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["attendance"],
    queryFn: async () => {
      const res = await fetch("/api/student/attendance");
      if (!res.ok) throw new Error("Failed to fetch attendance");
      return res.json();
    },
  });

  const attendance = data?.data?.attendance || [];
  const presentCount = attendance.filter((a: any) => a.status === "PRESENT").length;
  const percentage = attendance.length ? Math.round((presentCount / attendance.length) * 100) : 0;

  // Semester Progress Calculation
  const semesterStart = new Date("2026-05-14T00:00:00");
  const semesterEnd = new Date("2026-10-14T00:00:00");
  const today = new Date();
  
  const totalSemesterDays = Math.ceil((semesterEnd.getTime() - semesterStart.getTime()) / (1000 * 60 * 60 * 24));
  const elapsedDays = Math.max(0, Math.ceil((today.getTime() - semesterStart.getTime()) / (1000 * 60 * 60 * 24)));
  const semesterProgress = Math.min(100, Math.round((elapsedDays / totalSemesterDays) * 100));

  // Subject-wise Breakdown
  const courseStats = attendance.reduce((acc: any, curr: any) => {
    if (!acc[curr.courseName]) {
      acc[curr.courseName] = { present: 0, total: 0 };
    }
    acc[curr.courseName].total += 1;
    if (curr.status === "PRESENT") {
      acc[curr.courseName].present += 1;
    }
    return acc;
  }, {});

  return (
    <div className="max-w-4xl mx-auto pb-12 relative z-10">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-3">
          <Calendar size={32} /> Attendance
        </h1>
        <p className="text-foreground/70">Track your course attendance and overall presence.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="glass p-8 rounded-3xl border border-slate-300 flex flex-col items-center text-center justify-center">
          <h2 className="text-xl font-bold text-foreground mb-4">Semester Progress</h2>
          <div className="w-full bg-slate-100 rounded-full h-4 mb-2 overflow-hidden border border-slate-300">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${semesterProgress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="bg-primary h-full rounded-full"
            />
          </div>
          <div className="flex justify-between w-full text-xs text-foreground/50 font-semibold uppercase tracking-wider mt-2">
            <span>May 14</span>
            <span className="text-primary">{semesterProgress}% Elapsed</span>
            <span>Oct 14</span>
          </div>
          <p className="text-sm mt-4 text-foreground/70">
            Day {Math.min(elapsedDays, totalSemesterDays)} of {totalSemesterDays}
          </p>
        </div>

        <div className="glass p-8 rounded-3xl border border-slate-300 flex items-center gap-8 justify-center">
          <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" className="stroke-slate-200" strokeWidth="10" />
              <motion.circle
                initial={{ strokeDashoffset: 251 }}
                animate={{ strokeDashoffset: 251 - (251 * percentage) / 100 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                cx="50" cy="50" r="40" fill="none" className="stroke-primary" strokeWidth="10"
                strokeDasharray="251"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-primary">{percentage}%</span>
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Overall Attendance</h2>
            <p className="text-foreground/60 mt-2 text-sm leading-relaxed">
              You've been present for {presentCount} out of {attendance.length} recorded sessions across all subjects.
            </p>
          </div>
        </div>
      </div>

      <div className="glass p-6 rounded-3xl border border-slate-300 mb-8">
        <h2 className="text-xl font-bold text-foreground mb-6">Subject Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(courseStats).map(([course, stats]: [string, any], index) => {
            const coursePercent = Math.round((stats.present / stats.total) * 100) || 0;
            return (
              <motion.div 
                key={course}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-slate-100/40 backdrop-blur-sm p-4 rounded-2xl border border-slate-300"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-sm truncate pr-4">{course}</span>
                  <span className={`font-bold text-sm ${coursePercent >= 75 ? 'text-green-600' : 'text-orange-600'}`}>
                    {coursePercent}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${coursePercent}%` }}
                    transition={{ duration: 1 }}
                    className={`h-full rounded-full ${coursePercent >= 75 ? 'bg-green-500' : 'bg-orange-500'}`}
                  />
                </div>
                <p className="text-xs text-foreground/50 mt-2 text-right">
                  {stats.present} / {stats.total} sessions
                </p>
              </motion.div>
            );
          })}
          {Object.keys(courseStats).length === 0 && !isLoading && (
            <p className="text-sm text-foreground/50 col-span-2 text-center py-4">No subjects data available.</p>
          )}
        </div>
      </div>

      <h2 className="text-xl font-bold text-foreground mb-4 pl-2">Detailed Log</h2>

      <div className="glass rounded-3xl border border-slate-300 overflow-hidden">
        <div className="grid grid-cols-3 bg-slate-100/40 backdrop-blur-sm p-4 font-semibold text-foreground/80 border-b border-slate-300">
          <div>Course</div>
          <div>Date</div>
          <div>Status</div>
        </div>
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-8 bg-white/5 animate-pulse rounded" />)}
          </div>
        ) : attendance.length === 0 ? (
          <div className="p-8 text-center text-foreground/50">No attendance records found.</div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
            {attendance.map((record: any, i: number) => (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                key={record.id} className="grid grid-cols-3 p-4 items-center hover:bg-white/40 transition-colors"
              >
                <div className="font-medium">{record.courseName}</div>
                <div className="text-sm text-foreground/60">{new Date(record.date).toLocaleDateString()}</div>
                <div>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${
                    record.status === 'PRESENT' ? 'bg-green-500/20 text-green-500' :
                    record.status === 'ABSENT' ? 'bg-red-500/20 text-red-500' : 'bg-orange-500/20 text-orange-500'
                  }`}>
                    {record.status === 'PRESENT' && <Check size={12} />}
                    {record.status === 'ABSENT' && <X size={12} />}
                    {record.status === 'LATE' && <Clock size={12} />}
                    {record.status}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
