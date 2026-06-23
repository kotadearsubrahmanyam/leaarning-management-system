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

      {/* Modern Refined Timetable Table */}
      <div className="border border-slate-200 bg-slate-50/50 p-2 rounded-2xl shadow-lg shadow-slate-200/20">
        <div className="overflow-x-auto rounded-xl">
          <table className="w-full text-left border-separate border-spacing-1.5 table-fixed min-w-[900px]">
            <thead>
              <tr>
                <th className="p-2.5 bg-slate-200 !text-slate-900 font-bold text-xs text-center rounded-xl shadow-sm tracking-wider uppercase w-32 border border-slate-300">
                  Day / Time
                </th>
                {TIME_SLOTS.map(slot => (
                  <th 
                    key={slot.id} 
                    className={`p-2.5 font-bold text-xs text-center rounded-xl shadow-sm tracking-wider uppercase border ${
                      slot.isBreak 
                        ? "bg-amber-50 border-amber-200 !text-amber-800" 
                        : "bg-[#7C3AED] border-purple-700 !text-white"
                    }`}
                    style={{ color: slot.isBreak ? "#92400E" : "white" }}
                  >
                    <div className="flex flex-col items-center justify-center">
                      <span className="font-black text-[10px]">{slot.isBreak ? "LUNCH BREAK" : `PERIOD ${slot.id.replace("slot", "")}`}</span>
                      <span className="text-[9px] font-bold opacity-90 mt-0.5">{slot.time}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {WEEK_DAYS.map(day => (
                <tr key={day}>
                  <td className="p-2.5 border border-slate-300/80 bg-[#7C3AED] !text-white font-bold text-sm text-center rounded-xl shadow-sm tracking-wider uppercase" style={{ color: "white" }}>
                    {day}
                  </td>
                  {TIME_SLOTS.map(slot => {
                    if (slot.isBreak) {
                      return (
                        <td key={slot.id} className="p-2 border border-dashed border-slate-300 bg-slate-50 text-center align-middle hover:bg-slate-100/50 transition-colors rounded-xl">
                          <div className="flex items-center justify-center gap-1.5">
                            <Utensils size={12} className="text-slate-400" />
                            <span className="text-[10px] font-bold text-slate-450 tracking-wider uppercase">
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
                        <td key={slot.id} className="p-1.5 border border-dashed border-slate-300/80 rounded-xl align-middle bg-slate-100/30 text-center transition-all hover:bg-slate-100/50">
                          <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">Free</span>
                        </td>
                      );
                    }

                    return (
                      <td 
                        key={slot.id} 
                        className="p-0 border border-slate-300/80 rounded-xl align-top bg-white transition-all duration-200 hover:shadow-md hover:bg-purple-50/20 border-l-4 border-l-[#7C3AED]"
                      >
                        <div className="p-2 text-left h-full flex flex-col justify-between min-h-[64px]">
                          <span className="text-xs text-slate-900 font-black leading-tight tracking-tight line-clamp-2">
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
