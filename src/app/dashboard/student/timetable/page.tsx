"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock, RefreshCw, AlertCircle, Utensils, User } from "lucide-react";

const TIME_SLOTS = [
  { id: "slot1", time: "09:30 AM - 10:30 AM" },
  { id: "slot2", time: "10:30 AM - 11:30 AM" },
  { id: "slot3", time: "11:30 AM - 12:30 PM" },
  { id: "lunch", time: "12:30 PM - 01:30 PM", isBreak: true },
  { id: "slot4", time: "01:30 PM - 02:30 PM" },
  { id: "slot5", time: "02:30 PM - 03:30 PM" },
];

const WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const DEFAULT_TIMETABLE = WEEK_DAYS.reduce((acc, day) => {
  acc[day] = {};
  TIME_SLOTS.forEach(slot => {
    acc[day][slot.id] = slot.isBreak ? { name: "Lunch Break", faculty: "-" } : { name: "Free Period", faculty: "-" };
  });
  return acc;
}, {} as Record<string, any>);

export default function TimetablePage() {
  const { data: timetableData, isLoading } = useQuery({
    queryKey: ["timetable"],
    queryFn: async () => {
      const res = await fetch("/api/timetable");
      if (!res.ok) throw new Error("Failed to fetch timetable");
      return res.json();
    }
  });

  const activeTimetable = timetableData?.data?.timetable || DEFAULT_TIMETABLE;
  const isTemporary = timetableData?.data?.isTemporary;
  const courses = timetableData?.data?.courses || [];

  if (isLoading) {
    return <div className="p-12 flex justify-center"><RefreshCw className="animate-spin text-slate-400" /></div>;
  }
  
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 mb-1 tracking-tight">
          Weekly Timetable
        </h1>
        <p className="text-slate-500 text-sm font-medium">
          Semester {timetableData?.data?.semester || 1} - Computer Science and Engineering
        </p>
      </div>

      {isTemporary && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-center gap-3 shadow-sm">
          <AlertCircle size={20} className="text-amber-500" />
          <div>
            <p className="font-bold text-sm">Temporary Schedule Active</p>
            <p className="text-xs opacity-90 mt-0.5">The administration has set a temporary 12-hour schedule. It will automatically revert to the normal schedule once it expires.</p>
          </div>
        </div>
      )}

      {/* Modern Refined Timetable Table */}
      <div className="border-2 border-slate-200 bg-slate-50/50 p-3 rounded-2xl shadow-xl shadow-slate-200/40">
        <div className="overflow-x-auto rounded-xl">
          <table className="w-full text-left border-separate border-spacing-2">
            <thead>
              <tr>
                <th className="p-3 bg-slate-200 !text-slate-900 font-bold text-xs text-center rounded-xl shadow-sm tracking-wider uppercase w-32 border border-slate-300">
                  Time / Day
                </th>
                {WEEK_DAYS.map(day => (
                  <th key={day} className="p-3 bg-[#7C3AED] !text-white font-bold text-xs text-center rounded-xl shadow-sm tracking-wider uppercase border border-purple-700" style={{ color: "white" }}>
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIME_SLOTS.map((slot) => {
                if (slot.isBreak) {
                  return (
                    <tr key={slot.id}>
                      <td className="p-2 border border-slate-300/80 bg-slate-100 rounded-xl text-center align-middle">
                        <div className="flex flex-col items-center justify-center gap-1.5 py-1">
                          <Clock size={15} className="text-[#7C3AED]" />
                          <span className="text-[10px] font-bold text-slate-700 whitespace-nowrap leading-tight">
                            {slot.time}
                          </span>
                        </div>
                      </td>
                      <td colSpan={5} className="p-2 border border-dashed border-slate-300 bg-slate-50 text-center align-middle hover:bg-slate-100/50 transition-colors rounded-xl">
                        <div className="flex items-center justify-center gap-2 py-3">
                          <Utensils size={14} className="text-slate-500" />
                          <span className="text-xs font-bold text-slate-500 tracking-widest uppercase">
                            Lunch Break
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={slot.id}>
                    <td className="p-2 border border-slate-300/80 bg-slate-100 rounded-xl text-center align-middle">
                      <div className="flex flex-col items-center justify-center gap-1.5 py-2">
                        <Clock size={15} className="text-[#7C3AED]" />
                        <span className="text-[10px] font-bold text-slate-700 whitespace-nowrap leading-tight">
                          {slot.time}
                        </span>
                      </div>
                    </td>
                    {WEEK_DAYS.map(day => {
                      const classData = activeTimetable[day]?.[slot.id];
                      const isFree = !classData || classData.name === "Free Period" || classData.name === "-";

                      if (isFree) {
                        return (
                          <td key={day} className="p-2 border border-dashed border-slate-300/80 rounded-xl align-middle bg-slate-100/30 text-center transition-all hover:bg-slate-100/50">
                            <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">Free Period</span>
                          </td>
                        );
                      }

                      return (
                        <td 
                          key={day} 
                          className="p-0 border border-slate-300/80 rounded-xl align-top bg-white transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:bg-purple-50/30 border-l-4 border-l-[#7C3AED]"
                        >
                          <div className="p-3 text-left h-full flex flex-col justify-between min-h-[68px]">
                            <span className="text-[11px] text-slate-800 font-bold block leading-tight tracking-tight">
                              {classData.name}
                            </span>
                            {classData.faculty && classData.faculty !== "-" && (
                              <span className="text-[9px] text-slate-500 mt-2 block font-semibold">
                                {classData.faculty}
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modernized Faculty Details cards */}
      <div className="pt-4">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-1.5 h-6 bg-[#7C3AED] rounded-full"></div>
          <h2 className="text-xl font-bold text-slate-900">
            Faculty Details
          </h2>
        </div>
        
        {courses.length === 0 ? (
          <div className="p-6 text-center text-slate-500 bg-white border-2 border-slate-200 rounded-2xl shadow-sm">
            No courses enrolled for this semester
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {courses.map((course: any, index: number) => (
              <div 
                key={course.name || index} 
                className="bg-white border-2 border-slate-200 hover:border-purple-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 border-l-4 border-l-[#7C3AED]"
              >
                <div className="flex justify-between items-start mb-2.5">
                  <span className="text-[9px] font-bold text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                    Course {index + 1}
                  </span>
                </div>
                <h3 className="text-xs font-bold text-slate-800 mb-4 leading-tight min-h-[32px] line-clamp-2">
                  {course.name}
                </h3>
                <div className="flex items-center gap-2 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <User size={13} className="text-[#7C3AED] shrink-0" />
                  <span className="font-semibold truncate">{course.faculty || "Unassigned"}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

