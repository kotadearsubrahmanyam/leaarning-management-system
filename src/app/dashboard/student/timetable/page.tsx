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
                          {classData.faculty && classData.faculty !== "-" && (
                            <span className="text-[9px] text-slate-550 mt-1 block font-bold truncate">
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

