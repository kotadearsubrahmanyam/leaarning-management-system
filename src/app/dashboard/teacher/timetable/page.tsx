"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock, RefreshCw, Calendar as CalendarIcon, Utensils } from "lucide-react";

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

export default function TeacherTimetablePage() {
  const { data: timetableData, isLoading } = useQuery({
    queryKey: ["teacherTimetable"],
    queryFn: async () => {
      const res = await fetch("/api/teacher/timetable");
      if (!res.ok) throw new Error("Failed to fetch teacher timetable");
      return res.json();
    }
  });

  const activeTimetable = timetableData?.data?.timetable || DEFAULT_TIMETABLE;
  const teacherName = timetableData?.data?.teacherName || "Faculty";

  if (isLoading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="animate-spin text-[#7C3AED]" size={32} />
        <p className="text-slate-500 font-medium">Loading your personalized schedule...</p>
      </div>
    );
  }
  
  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex items-center gap-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
          <CalendarIcon className="text-[#7C3AED]" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            My Timetable
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Personalized schedule for {teacherName}
          </p>
        </div>
      </div>

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
                            <span className="inline-flex items-center gap-1 mt-2.5 px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-100 rounded-md text-[9px] font-bold uppercase tracking-wider w-fit">
                              Scheduled Class
                            </span>
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
    </div>
  );
}
