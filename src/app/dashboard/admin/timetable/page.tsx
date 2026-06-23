"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Save, RefreshCw, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const TIME_SLOTS = [
  { id: "slot1", time: "09:30 AM - 10:30 AM" },
  { id: "slot2", time: "10:30 AM - 11:30 AM" },
  { id: "slot3", time: "11:30 AM - 12:30 PM" },
  { id: "lunch", time: "12:30 PM - 01:30 PM", isBreak: true },
  { id: "slot4", time: "01:30 PM - 02:30 PM" },
  { id: "slot5", time: "02:30 PM - 03:30 PM" },
];

const WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

// Default Template if DB is empty
const DEFAULT_TIMETABLE = WEEK_DAYS.reduce((acc, day) => {
  acc[day] = {};
  TIME_SLOTS.forEach(slot => {
    acc[day][slot.id] = slot.isBreak ? { name: "Lunch Break", faculty: "-" } : null;
  });
  return acc;
}, {} as Record<string, any>);

export default function AdminTimetablePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSemester, setSelectedSemester] = useState<number>(1);
  const [editedTimetable, setEditedTimetable] = useState<any>(null);

  // Fetch all courses for dropdowns
  const { data: coursesData } = useQuery({
    queryKey: ["adminCourses"],
    queryFn: async () => {
      const res = await fetch("/api/admin/courses");
      if (!res.ok) throw new Error("Failed to fetch courses");
      return res.json();
    }
  });

  // Fetch current timetable for selected semester
  const { data: timetableData, isLoading } = useQuery({
    queryKey: ["timetable", selectedSemester],
    queryFn: async () => {
      const res = await fetch(`/api/timetable?semester=${selectedSemester}`);
      if (!res.ok) throw new Error("Failed to fetch timetable");
      return res.json();
    }
  });

  const allCourses = coursesData?.data?.courses || [];
  const courses = allCourses.filter((c: any) => c.semester === selectedSemester);
  
  // Initialize editor state when data arrives
  useEffect(() => {
    if (timetableData?.data?.timetable) {
      setEditedTimetable(timetableData.data.timetable);
    } else {
      setEditedTimetable(DEFAULT_TIMETABLE);
    }
  }, [timetableData]);

  const saveMutation = useMutation({
    mutationFn: async ({ newTimetable, isTemp }: { newTimetable: any, isTemp: boolean }) => {
      const res = await fetch("/api/admin/timetable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timetable: newTimetable, isTemporary: isTemp, semester: selectedSemester }),
      });
      if (!res.ok) throw new Error("Failed to save timetable");
      return res.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Success",
        description: variables.isTemp 
          ? `Temporary 12-hour timetable applied for Semester ${selectedSemester}!` 
          : `Timetable for Semester ${selectedSemester} updated globally!`,
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["timetable", selectedSemester] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save timetable. Please try again.",
        variant: "destructive",
      });
    }
  });

  if (isLoading || !editedTimetable) {
    return <div className="p-8 flex justify-center"><RefreshCw className="animate-spin text-slate-400" /></div>;
  }

  const handleCellChange = (day: string, slotId: string, courseId: string) => {
    if (!courseId || courseId === "FREE") {
      setEditedTimetable((prev: any) => ({
        ...prev,
        [day]: { ...prev[day], [slotId]: { name: "Free Period", faculty: "-" } }
      }));
      return;
    }

    if (courseId === "CUSTOM") {
      setEditedTimetable((prev: any) => ({
        ...prev,
        [day]: { ...prev[day], [slotId]: { name: "Custom Event", faculty: "Custom", isCustom: true } }
      }));
      return;
    }

    const selectedCourse = courses.find((c: any) => c.id === courseId);
    if (selectedCourse) {
      setEditedTimetable((prev: any) => ({
        ...prev,
        [day]: { 
          ...prev[day], 
          [slotId]: { 
            name: selectedCourse.title, 
            faculty: selectedCourse.teacherName || "Unassigned" 
          } 
        }
      }));
    }
  };

  const handleCustomTextChange = (day: string, slotId: string, value: string) => {
    setEditedTimetable((prev: any) => ({
      ...prev,
      [day]: { ...prev[day], [slotId]: { ...prev[day][slotId], name: value } }
    }));
  };

  const isTempActive = timetableData?.data?.isTemporary;

  return (
    <div className="max-w-[96%] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Timetable Editor</h1>
          <p className="text-slate-500 mt-1">Manage the weekly global schedule across all semesters</p>
        </div>
        
        <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm flex">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
            <button
              key={sem}
              onClick={() => setSelectedSemester(sem)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300",
                selectedSemester === sem
                  ? "bg-slate-900 text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              Sem {sem}
            </button>
          ))}
        </div>
      </div>

      {isTempActive && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl flex items-center gap-3">
          <AlertCircle size={20} className="text-amber-500" />
          <div>
            <p className="font-bold">Temporary Schedule Active</p>
            <p className="text-sm opacity-90">A temporary 12-hour override is currently active. Saving a permanent timetable will overwrite it.</p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm gap-4">
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <AlertCircle size={18} className="text-amber-500 shrink-0" />
          Saving changes will automatically broadcast a notification to all enrolled students.
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => saveMutation.mutate({ newTimetable: editedTimetable, isTemp: true })}
            disabled={saveMutation.isPending}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 text-sm whitespace-nowrap"
          >
            {saveMutation.isPending ? <RefreshCw size={18} className="animate-spin" /> : <Clock size={18} />}
            Temporary (12h)
          </button>
          <button
            onClick={() => saveMutation.mutate({ newTimetable: editedTimetable, isTemp: false })}
            disabled={saveMutation.isPending}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 text-sm whitespace-nowrap"
          >
            {saveMutation.isPending ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
            Save Permanent
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px] table-fixed">
            <thead>
              <tr>
                <th className="p-2.5 border-b border-r border-slate-200 bg-slate-50 text-slate-700 font-bold text-xs text-center w-28">
                  Day / Time
                </th>
                {TIME_SLOTS.map(slot => (
                  <th key={slot.id} className="p-2.5 border-b border-r border-slate-200 bg-slate-50 text-slate-700 font-bold text-xs text-center">
                    <div className="flex flex-col items-center">
                      <span className="font-extrabold text-[10px]">{slot.isBreak ? "LUNCH" : `PERIOD ${slot.id.replace("slot", "")}`}</span>
                      <span className="text-[9px] font-bold opacity-80 mt-0.5">{slot.time}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {WEEK_DAYS.map(day => (
                <tr key={day}>
                  <td className="p-2.5 border-b border-r border-slate-200 text-center bg-slate-50 text-xs font-bold text-slate-650 uppercase">
                    {day}
                  </td>
                  {TIME_SLOTS.map(slot => {
                    if (slot.isBreak) {
                      return (
                        <td key={slot.id} className="p-2 border-b border-r border-slate-200 text-center bg-slate-100/50">
                          <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">Lunch Break</span>
                        </td>
                      );
                    }

                    const currentCell = editedTimetable[day]?.[slot.id];
                    const isCustom = currentCell?.isCustom || (currentCell?.faculty === "Custom");
                    const currentValue = currentCell?.name === "Free Period" || !currentCell?.name ? "FREE" 
                                       : isCustom ? "CUSTOM"
                                       : courses.find((c: any) => c.title === currentCell?.name)?.id || "FREE";

                    return (
                      <td key={slot.id} className="p-1 border-b border-r border-slate-200 align-top hover:bg-slate-50 transition-colors">
                        <select 
                          className={cn(
                            "w-full p-1 rounded-md border text-[11px] font-medium transition-colors focus:ring-1 focus:ring-slate-900 focus:outline-none",
                            currentValue === "FREE" ? "bg-slate-50 text-slate-450 border-dashed border-slate-200" : 
                            currentValue === "CUSTOM" ? "bg-purple-50 text-purple-700 border-purple-200" :
                            "bg-white text-slate-800 border-slate-200"
                          )}
                          value={currentValue}
                          onChange={(e) => handleCellChange(day, slot.id, e.target.value)}
                        >
                          <option value="FREE">-- Free Period --</option>
                          {courses.map((course: any) => (
                            <option key={course.id} value={course.id}>
                              {course.title}
                            </option>
                          ))}
                          <option value="CUSTOM">Custom Event...</option>
                        </select>
                        
                        {currentValue === "CUSTOM" && (
                          <input
                            type="text"
                            placeholder="e.g. Interaction Session"
                            className="w-full mt-1 p-1 border border-purple-200 rounded-sm text-[10px] focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
                            value={currentCell?.name !== "Custom Event" ? currentCell?.name : ""}
                            onChange={(e) => handleCustomTextChange(day, slot.id, e.target.value)}
                          />
                        )}

                        {currentValue !== "FREE" && currentValue !== "CUSTOM" && currentCell?.faculty && (
                          <div className="mt-1 text-[9px] font-semibold text-slate-500 text-center bg-slate-100 py-0.5 rounded-sm overflow-hidden text-ellipsis whitespace-nowrap px-1">
                            {currentCell.faculty}
                          </div>
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
