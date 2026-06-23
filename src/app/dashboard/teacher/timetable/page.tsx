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
    <div className="max-w-[96%] mx-auto space-y-8 pb-12">
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

      {/* Tabular Timetable Grid */}
      <div className="border border-slate-200 bg-white rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-3.5 border-r border-slate-200 text-slate-700 font-bold text-xs text-center w-32">
                  Day / Time
                </th>
                {TIME_SLOTS.map(slot => (
                  <th 
                    key={slot.id} 
                    className={`p-3.5 border-r border-slate-200 text-slate-700 font-bold text-xs text-center last:border-r-0 ${
                      slot.isBreak ? "bg-amber-50/50" : ""
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center">
                      <span className="font-extrabold text-[10px] text-slate-800">{slot.isBreak ? "LUNCH BREAK" : `PERIOD ${slot.id.replace("slot", "")}`}</span>
                      <span className="text-[9px] text-slate-500 font-semibold mt-0.5">{slot.time}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {WEEK_DAYS.map(day => (
                <tr key={day} className="hover:bg-slate-50/20 transition-colors">
                  <td className="p-3.5 border-r border-slate-200 bg-slate-50 text-slate-700 font-bold text-xs text-center uppercase tracking-wider">
                    {day}
                  </td>
                  {TIME_SLOTS.map(slot => {
                    if (slot.isBreak) {
                      return (
                        <td key={slot.id} className="p-3 border-r border-slate-200 bg-amber-50/35 text-center align-middle last:border-r-0">
                          <div className="flex items-center justify-center gap-1.5">
                            <Utensils size={12} className="text-amber-600/70" />
                            <span className="text-[10px] font-bold text-amber-800/80 tracking-wider uppercase">
                              Lunch
                            </span>
                          </div>
                        </td>
                      );
                    }

                    const classData = activeTimetable[day]?.[slot.id];
                    const isFree = !classData || classData.name === "Free Period" || classData.name === "-";

                    if (isFree) {
                      return (
                        <td key={slot.id} className="p-3 border-r border-slate-200 bg-slate-50/30 text-center align-middle last:border-r-0">
                          <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">Free</span>
                        </td>
                      );
                    }

                    return (
                      <td 
                        key={slot.id} 
                        className="p-3 border-r border-slate-200 align-top bg-white last:border-r-0"
                      >
                        <div className="text-left flex flex-col justify-between min-h-[52px]">
                          <span className="text-xs text-slate-900 font-bold leading-tight tracking-tight line-clamp-2">
                            {classData.name}
                          </span>
                          <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-100 rounded-md text-[9px] font-bold uppercase tracking-wider w-fit">
                            Scheduled
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
