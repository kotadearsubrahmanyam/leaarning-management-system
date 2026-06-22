"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { BookOpen, Calendar, Check, X, Clock, Award, Trophy, Code, MonitorPlay, Star, FileText } from "lucide-react";

// DashboardCard component
interface DashboardCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  delay?: number;
}

export function DashboardCard({ children, className, delay = 0, ...props }: DashboardCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={cn(
        "bg-white p-6 rounded-3xl border border-purple-200/80 shadow-[0_8px_32px_rgba(139,92,246,0.04)] transition-all hover:shadow-[0_12px_40px_rgba(139,92,246,0.08)] hover:border-purple-300 hover:-translate-y-1",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// StatisticsCard component
interface StatisticsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  delay?: number;
  className?: string;
  onClick?: () => void;
}

export function StatisticsCard({ title, value, icon, delay = 0, className, onClick }: StatisticsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ scale: 1.02, y: -2 }}
      onClick={onClick}
      className={cn(
        "bg-white p-5 rounded-2xl border border-purple-200/80 flex items-center justify-between shadow-[0_4px_20px_rgba(139,92,246,0.02)] cursor-pointer hover:shadow-md hover:border-primary/35 hover:-translate-y-1 transition-all",
        className
      )}
    >
      <div className="min-w-0 flex-1 pr-4">
        <span className="text-xs font-extrabold text-slate-600 uppercase tracking-wider block mb-1">
          {title}
        </span>
        <span className="text-3xl font-black text-foreground block truncate">
          {value}
        </span>
      </div>
      <div className="p-3 bg-primary/10 text-primary rounded-xl border border-primary/20 shrink-0 flex items-center justify-center">
        {icon}
      </div>
    </motion.div>
  );
}

// StudentCourseCard component
interface StudentCourseCardProps {
  title: string;
  code: string;
  teacher: string;
  credits: number;
  attendancePercent: number;
  progress: number;
  onViewDetails?: () => void;
  delay?: number;
}

export function StudentCourseCard({
  title,
  code,
  teacher,
  credits,
  attendancePercent,
  progress,
  onViewDetails,
  delay = 0,
}: StudentCourseCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-3xl border border-purple-200/80 overflow-hidden flex flex-col justify-between hover:shadow-[0_15px_30px_rgba(124,58,237,0.08)] hover:border-purple-300 hover:-translate-y-1 transition-all cursor-pointer"
      onClick={onViewDetails}
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <span className="text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full">
            {code}
          </span>
          <span className="text-xs font-semibold text-foreground/60 flex items-center gap-1">
            <BookOpen size={13} /> {credits} Credits
          </span>
        </div>
        <h3 className="font-extrabold text-lg text-foreground mb-1 leading-snug truncate">
          {title}
        </h3>
        <p className="text-xs text-foreground/50 mb-6">
          Instructor: Prof. {teacher}
        </p>

        {/* Progress and Attendance Info */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs font-semibold text-foreground/75 mb-1.5">
              <span>Syllabus Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-slate-100 border border-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-foreground/75 mb-1.5">
              <span>Attendance Rate</span>
              <span className={attendancePercent >= 75 ? "text-green-600 font-bold" : "text-orange-500 font-bold"}>
                {attendancePercent}%
              </span>
            </div>
            <div className="w-full bg-slate-100 border border-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  attendancePercent >= 75 ? "bg-green-500" : "bg-orange-500"
                )}
                style={{ width: `${attendancePercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs font-bold text-primary group hover:bg-slate-100/50 transition-colors">
        <span>Course Materials & Syllabus</span>
        <Clock size={14} className="opacity-60" />
      </div>
    </motion.div>
  );
}

// StudentAttendanceCard component
interface StudentAttendanceCardProps {
  courseName: string;
  present: number;
  total: number;
  delay?: number;
}

export function StudentAttendanceCard({ courseName, present, total, delay = 0 }: StudentAttendanceCardProps) {
  const percent = total > 0 ? Math.round((present / total) * 100) : 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="bg-white p-5 rounded-2xl border border-purple-200/80 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all"
    >
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-extrabold text-sm text-foreground truncate pr-4">{courseName}</h4>
        <span className={cn("text-sm font-black", percent >= 75 ? "text-green-600" : "text-orange-600")}>
          {percent}%
        </span>
      </div>
      <div className="w-full bg-slate-100 border border-slate-200/50 rounded-full h-2.5 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", percent >= 75 ? "bg-green-500" : "bg-orange-500")}
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="flex justify-between items-center text-[10px] text-foreground/50 font-bold uppercase tracking-wider mt-2.5">
        <span>Minimum: 75%</span>
        <span>{present} / {total} Lectures</span>
      </div>
    </motion.div>
  );
}

// StudentResultCard component
interface StudentResultCardProps {
  subjectName: string;
  subjectCode: string;
  marks: number;
  grade: string;
  credits: number;
  status: string;
  delay?: number;
}

export function StudentResultCard({
  subjectName,
  subjectCode,
  marks,
  grade,
  credits,
  status,
  delay = 0,
}: StudentResultCardProps) {
  const isPass = status === "PASS";
  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay }}
      className="hover:bg-slate-50/50 transition-colors border-b border-slate-100"
    >
      <td className="p-4 pl-6 font-mono text-xs font-bold text-primary">{subjectCode}</td>
      <td className="p-4 font-bold text-foreground">{subjectName}</td>
      <td className="p-4 text-center text-foreground/70">{marks}/100</td>
      <td className="p-4 text-center font-black text-foreground">{credits}</td>
      <td className="p-4 text-center">
        <span
          className={cn(
            "font-black text-sm",
            ["O", "A+", "A", "B+", "B"].includes(grade)
              ? "text-primary"
              : grade === "F"
              ? "text-red-500"
              : "text-foreground"
          )}
        >
          {grade}
        </span>
      </td>
      <td className="p-4 pr-6 text-center">
        <span
          className={cn(
            "px-2.5 py-1 rounded-full text-xs font-black border",
            isPass ? "bg-green-50 text-green-600 border-green-200" : "bg-red-50 text-red-600 border-red-200"
          )}
        >
          {status}
        </span>
      </td>
    </motion.tr>
  );
}

// StudentActivityCard component
interface StudentActivityCardProps {
  title: string;
  type: string;
  description: string | null;
  proofUrl: string | null;
  date: string | Date;
  verificationStatus: string;
  marks?: number | null;
  delay?: number;
}

const ACTIVITY_TYPES = [
  { value: "CERTIFICATION", label: "Certification", icon: Award, color: "text-blue-600", bg: "bg-blue-500/10 border-blue-200" },
  { value: "HACKATHON", label: "Hackathon", icon: Code, color: "text-purple-600", bg: "bg-purple-500/10 border-purple-200" },
  { value: "CONTEST", label: "Contest", icon: Trophy, color: "text-amber-600", bg: "bg-amber-500/10 border-amber-200" },
  { value: "WORKSHOP", label: "Workshop", icon: MonitorPlay, color: "text-green-600", bg: "bg-green-500/10 border-green-200" },
  { value: "OTHER", label: "Other", icon: Star, color: "text-foreground", bg: "bg-slate-100 border-slate-200" },
];

export function StudentActivityCard({
  title,
  type,
  description,
  proofUrl,
  date,
  verificationStatus,
  marks,
  delay = 0,
}: StudentActivityCardProps) {
  const typeConfig = ACTIVITY_TYPES.find((t) => t.value === type) || ACTIVITY_TYPES[4];
  const Icon = typeConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ scale: 1.01, y: -2 }}
      className="bg-white p-6 rounded-3xl border border-purple-200/80 relative overflow-hidden group hover:shadow-[0_15px_30px_rgba(124,58,237,0.08)] hover:border-purple-300 hover:-translate-y-1 transition-all"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("p-3 rounded-2xl border", typeConfig.bg, typeConfig.color)}>
            <Icon size={22} />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-foreground truncate max-w-[200px] sm:max-w-xs">{title}</h3>
            <p className="text-[10px] text-foreground/50 font-semibold uppercase tracking-wider mt-0.5">
              {new Date(date).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border", typeConfig.bg, typeConfig.color)}>
            {typeConfig.label}
          </span>
          <span
            className={cn(
              "px-2 py-0.5 rounded-full text-[9px] font-bold border",
              verificationStatus === "APPROVED"
                ? "bg-green-50 text-green-600 border-green-200"
                : verificationStatus === "REJECTED"
                ? "bg-red-50 text-red-600 border-red-200"
                : "bg-amber-50 text-amber-600 border-amber-200"
            )}
          >
            {verificationStatus}
          </span>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-foreground/70 text-xs leading-relaxed line-clamp-3">
          {description || "No details log provided."}
        </p>
      </div>

      {marks && (
        <div className="mt-3 text-xs font-bold text-primary">
          Evaluated Score: {marks} Points
        </div>
      )}

      {proofUrl && (
        <div className="mt-4 pt-3 border-t border-slate-100">
          <a
            href={proofUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
          >
            <FileText size={14} /> View Certificate proof
          </a>
        </div>
      )}
    </motion.div>
  );
}

// ProfileFieldCard component
interface ProfileFieldCardProps {
  label: string;
  value: string | number | null | undefined;
}

export function ProfileFieldCard({ label, value }: ProfileFieldCardProps) {
  return (
    <div className="p-4 rounded-2xl bg-white border border-purple-200/80 hover:border-purple-300 hover:-translate-y-0.5 transition-all">
      <span className="text-[10px] font-black text-foreground/45 uppercase tracking-wider block mb-1">
        {label}
      </span>
      <span className="text-sm font-extrabold text-slate-800 block truncate">
        {value || "Not Available"}
      </span>
    </div>
  );
}
