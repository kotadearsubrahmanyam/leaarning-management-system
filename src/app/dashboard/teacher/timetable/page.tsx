"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock, RefreshCw, Calendar as CalendarIcon } from "lucide-react";

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
        <RefreshCw className="animate-spin text-emerald-500" size={32} />
        <p className="text-slate-500 font-medium">Loading your personalized schedule...</p>
      </div>
    );
  }
  
  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex items-center gap-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
          <CalendarIcon className="text-emerald-600" size={24} />
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

      <div className="border border-slate-300 bg-white rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="p-4 border-b border-r border-slate-200 bg-slate-50 text-slate-600 font-bold text-xs text-center w-32 uppercase tracking-wider">
                  Time / Day
                </th>
                {WEEK_DAYS.map(day => (
                  <th key={day} className="p-4 border-b border-r border-slate-200 bg-slate-50 text-slate-600 font-bold text-xs text-center uppercase tracking-wider">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIME_SLOTS.map((slot, index) => (
                <tr key={slot.id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                  <td className="p-3 border-b border-r border-slate-200 text-center bg-slate-50/80 text-xs font-semibold text-slate-700 whitespace-nowrap">
                    {slot.time}
                  </td>
                  {WEEK_DAYS.map(day => {
                    const classData = activeTimetable[day]?.[slot.id];
                    const isLunch = slot.isBreak;
                    const isClass = classData && classData.name !== "Free Period" && !isLunch;
                    
                    if (isLunch) {
                      return (
                        <td key={day} className="p-3 border-b border-r border-slate-200 text-center bg-slate-100">
                          <span className="text-xs font-bold text-slate-400 tracking-widest uppercase">Lunch Break</span>
                        </td>
                      );
                    }

                    return (
                      <td 
                        key={day} 
                        className={`p-3 border-b border-r border-slate-200 text-center align-middle transition-colors ${
                          isClass ? 'bg-emerald-50/50 hover:bg-emerald-50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <span className={`text-xs block leading-snug ${
                          isClass ? 'text-emerald-800 font-bold' : 'text-slate-400 font-medium'
                        }`}>
                          {classData?.name || "Free Period"}
                        </span>
                        {isClass && (
                          <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-md text-[10px] font-bold uppercase tracking-wider">
                            Scheduled Class
                          </span>
                        )}
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
