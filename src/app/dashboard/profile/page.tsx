"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { User, BookOpen, Trophy, Award, CalendarCheck, ShieldCheck, Activity } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const TABS = ["Overview", "Courses", "Activities", "Results", "Attendance"];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("Overview");

  const { data: authData, isLoading: authLoading } = useQuery({
    queryKey: ["authMe"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) throw new Error("Unauthorized");
      return res.json();
    },
  });

  const { data: activitiesData } = useQuery({
    queryKey: ["studentActivities"],
    queryFn: async () => {
      const res = await fetch("/api/student/activities");
      if (!res.ok) return null;
      return res.json();
    },
  });

  const { data: resultsData } = useQuery({
    queryKey: ["studentResults"],
    queryFn: async () => {
      const res = await fetch("/api/student/results");
      if (!res.ok) return null;
      return res.json();
    },
  });

  const { data: attendanceData } = useQuery({
    queryKey: ["studentAttendance"],
    queryFn: async () => {
      const res = await fetch("/api/student/attendance");
      if (!res.ok) return null;
      return res.json();
    },
  });

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  const user = authData?.data?.user;
  const activities = activitiesData?.data?.activities || [];
  const results = resultsData?.data?.results || [];
  const attendance = attendanceData?.data?.attendance || [];

  return (
    <div className="max-w-6xl mx-auto pb-12 relative z-10">
      {/* Profile Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="glass p-8 rounded-3xl border border-white/10 mb-8 flex items-center gap-8 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-primary to-accent p-1 shadow-[0_15px_30px_rgba(16,185,129,0.15)] relative z-10">
          <div className="w-full h-full bg-background rounded-full flex items-center justify-center">
            <User size={48} className="text-accent/60" />
          </div>
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-foreground mb-2">{user?.name}</h1>
          <div className="flex items-center gap-4 text-foreground/60">
            <span>{user?.rollNumber || "ID Pending"}</span>
            <span className="w-1 h-1 bg-white/20 rounded-full" />
            <span>{user?.departmentId || "Dept Unassigned"}</span>
            <span className="w-1 h-1 bg-white/20 rounded-full" />
            <span>Semester {user?.semester || 1}</span>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 mt-4 rounded-full bg-accent/10 text-accent border border-accent/20 text-sm font-semibold">
            <ShieldCheck size={16} /> Student
          </div>
        </div>
      </motion.div>

      {/* Custom Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 rounded-2xl font-bold transition-all whitespace-nowrap ${
              activeTab === tab ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(16,185,129,0.25)]" : "bg-white/5 text-foreground/60 hover:bg-white/10"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "Overview" && <OverviewTab activities={activities} results={results} attendance={attendance} />}
          {activeTab === "Courses" && <CoursesTab user={user} />}
          {activeTab === "Activities" && <ActivitiesTab activities={activities} />}
          {activeTab === "Results" && <ResultsTab results={results} />}
          {activeTab === "Attendance" && <AttendanceTab attendance={attendance} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function OverviewTab({ activities, results, attendance }: any) {
  // Chart Data Preparation
  const chartData = results.slice(0, 5).map((r: any) => ({ name: r.courseName.substring(0, 10) + '...', marks: r.marks }));
  const presentCount = attendance.filter((a: any) => a.status === 'PRESENT').length;
  const totalAtt = attendance.length;
  const attPercent = totalAtt === 0 ? 0 : Math.round((presentCount / totalAtt) * 100);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="glass p-6 rounded-3xl border border-white/10 lg:col-span-2">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Activity className="text-accent" /> Performance Overview</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} />
              <YAxis stroke="#94A3B8" fontSize={12} />
              <Tooltip cursor={{fill: 'rgba(16,185,129,0.08)'}} contentStyle={{ backgroundColor: '#0F172A', border: '1px solid rgba(226,232,240,0.1)', borderRadius: '12px', color: '#fff' }} />
              <Bar dataKey="marks" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-6">
        <div className="glass p-6 rounded-3xl border border-white/10 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 text-white/5 group-hover:text-primary/10 transition-colors">
            <Trophy size={100} />
          </div>
          <h4 className="text-sm text-foreground/50 mb-1">Total Activities</h4>
          <p className="text-4xl font-black text-foreground">{activities.length}</p>
        </div>

        <div className="glass p-6 rounded-3xl border border-white/10 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 text-white/5 group-hover:text-primary/10 transition-colors">
            <CalendarCheck size={100} />
          </div>
          <h4 className="text-sm text-foreground/50 mb-1">Overall Attendance</h4>
          <p className="text-4xl font-black text-foreground">{attPercent}%</p>
        </div>
      </div>
    </div>
  );
}

function CoursesTab({ user }: any) {
  return (
    <div className="glass p-12 rounded-3xl border border-white/10 text-center">
      <BookOpen size={48} className="mx-auto text-foreground/20 mb-4" />
      <h3 className="text-xl font-bold text-foreground mb-2">My Courses</h3>
      <p className="text-foreground/50">Visit the "My Courses" page to view detailed syllabus and materials.</p>
    </div>
  );
}

function ActivitiesTab({ activities }: any) {
  if (activities.length === 0) return <div className="glass p-8 rounded-3xl text-center text-foreground/50">No activities logged yet.</div>;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {activities.map((act: any) => (
        <div key={act.id} className="glass p-5 rounded-2xl border border-white/10 hover:border-accent/50 transition-colors">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-bold">{act.title}</h4>
            <span className="text-xs bg-white/10 px-2 py-1 rounded-full">{act.type}</span>
          </div>
          <p className="text-sm text-foreground/60 line-clamp-2">{act.description}</p>
          <p className="text-xs text-foreground/40 mt-3">{new Date(act.date).toLocaleDateString()}</p>
        </div>
      ))}
    </div>
  );
}

function ResultsTab({ results }: any) {
  if (results.length === 0) return <div className="glass p-8 rounded-3xl text-center text-foreground/50">No exam results published yet.</div>;
  return (
    <div className="glass rounded-3xl border border-white/10 overflow-hidden">
      <div className="grid grid-cols-4 bg-white/5 p-4 font-bold text-sm">
        <div className="col-span-2">Course</div>
        <div>Marks</div>
        <div>Grade</div>
      </div>
      <div className="divide-y divide-white/5">
        {results.map((r: any) => (
          <div key={r.id} className="grid grid-cols-4 p-4 text-sm hover:bg-white/5 transition-colors">
            <div className="col-span-2">{r.courseName || 'Course'}</div>
            <div className="font-medium text-accent font-bold">{r.marks}/100</div>
            <div className="font-bold">{r.grade}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AttendanceTab({ attendance }: any) {
  if (attendance.length === 0) return <div className="glass p-8 rounded-3xl text-center text-foreground/50">No attendance records found.</div>;
  return (
    <div className="glass rounded-3xl border border-white/10 overflow-hidden max-h-[500px] overflow-y-auto">
      <div className="grid grid-cols-3 bg-white/5 p-4 font-bold text-sm sticky top-0 backdrop-blur-md">
        <div>Date</div>
        <div>Course</div>
        <div>Status</div>
      </div>
      <div className="divide-y divide-white/5">
        {attendance.map((a: any) => (
          <div key={a.id} className="grid grid-cols-3 p-4 text-sm hover:bg-white/5 transition-colors">
            <div>{new Date(a.date).toLocaleDateString()}</div>
            <div>{a.courseName || 'Class'}</div>
            <div className={a.status === 'PRESENT' ? 'text-green-500 font-bold' : 'text-red-500 font-bold'}>
              {a.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
