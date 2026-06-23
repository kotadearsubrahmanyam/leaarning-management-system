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
    <div className="max-w-[96%] mx-auto space-y-8">
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
                          {classData.faculty && classData.faculty !== "-" && (
                            <span className="text-[9px] text-slate-500 mt-1 block font-bold truncate">
                              {classData.faculty}
                            </span>
                          )}
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

      {/* Tabular Faculty Details */}
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
          <div className="border border-slate-250 bg-white rounded-2xl overflow-hidden shadow-sm max-w-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-3 pl-5 text-xs font-black text-slate-500 uppercase tracking-wider">Course Name</th>
                  <th className="p-3 text-xs font-black text-slate-500 uppercase tracking-wider">Assigned Faculty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-semibold">
                {courses.map((course: any, index: number) => (
                  <tr key={course.name || index} className="hover:bg-slate-50/40 transition-colors">
                    <td className="p-3.5 pl-5 font-bold text-slate-800">{course.name}</td>
                    <td className="p-3.5 flex items-center gap-2 text-slate-650">
                      <User size={13} className="text-[#7C3AED]" />
                      <span>{course.faculty || "Unassigned"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

