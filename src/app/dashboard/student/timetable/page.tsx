"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock, RefreshCw, AlertCircle } from "lucide-react";

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
        <h1 className="text-2xl font-bold text-slate-900 mb-1">
          Weekly Timetable
        </h1>
        <p className="text-slate-600 text-sm">
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

      <div className="border border-slate-300 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="p-2 border-b border-r border-slate-300 bg-slate-100 text-slate-800 font-semibold text-[11px] text-center w-24">
                  Time / Day
                </th>
                {WEEK_DAYS.map(day => (
                  <th key={day} className="p-2 border-b border-r border-slate-300 bg-slate-100 text-slate-800 font-semibold text-[11px] text-center">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIME_SLOTS.map((slot) => (
                <tr key={slot.id}>
                  <td className="p-2 border-b border-r border-slate-300 text-center bg-slate-50 text-[10px] font-medium text-slate-700 whitespace-nowrap">
                    {slot.time}
                  </td>
                  {WEEK_DAYS.map(day => {
                    const classData = activeTimetable[day]?.[slot.id];
                    
                    if (slot.isBreak) {
                      return (
                        <td key={day} className="p-2 border-b border-r border-slate-300 text-center bg-slate-100/50">
                          <span className="text-[11px] font-medium text-slate-500 tracking-widest uppercase">Lunch</span>
                        </td>
                      );
                    }

                    return (
                      <td key={day} className="p-2 border-b border-r border-slate-300 text-center hover:bg-slate-50 transition-colors align-top">
                        <span className="text-[11px] text-slate-800 font-medium block leading-tight">{classData?.name || "Free Period"}</span>
                        {classData?.faculty && classData.faculty !== "-" && (
                          <span className="text-[9px] text-slate-500 mt-1 block">{classData.faculty}</span>
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

      {/* Faculty Details Table */}
      <div className="pt-4">
        <h2 className="text-xl font-bold text-slate-900 mb-4">
          Faculty Details
        </h2>
        <div className="border border-slate-300 bg-white overflow-hidden max-w-3xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="p-3 border-b border-r border-slate-300 bg-slate-100 text-slate-800 font-semibold text-sm w-16 text-center">S.No</th>
                <th className="p-3 border-b border-r border-slate-300 bg-slate-100 text-slate-800 font-semibold text-sm">Course Name</th>
                <th className="p-3 border-b border-slate-300 bg-slate-100 text-slate-800 font-semibold text-sm">Faculty Assigned</th>
              </tr>
            </thead>
            <tbody>
              {courses.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-3 text-center text-slate-500 text-sm">
                    No courses enrolled for this semester
                  </td>
                </tr>
              ) : (
                courses.map((course: any, index: number) => (
                  <tr key={course.name || index}>
                    <td className="p-3 border-b border-r border-slate-300 text-slate-700 text-sm text-center">{index + 1}</td>
                    <td className="p-3 border-b border-r border-slate-300 text-slate-800 text-sm">{course.name}</td>
                    <td className="p-3 border-b border-slate-300 text-slate-800 text-sm">{course.faculty || "Unassigned"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

