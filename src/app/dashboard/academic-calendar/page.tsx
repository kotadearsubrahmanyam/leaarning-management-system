"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar as CalendarIcon,
  Plus,
  Edit2,
  Trash2,
  X,
  CalendarDays
} from "lucide-react";

interface AcademicEvent {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  category: "MILESTONE" | "EXAM" | "HOLIDAY" | "CO_CURRICULAR";
  semester: number | null;
  createdBy: string | null;
  createdAt: string;
}

// Dynamic standard schedule generator based on academic calendar cycles
// Dynamic standard schedule generator based on academic calendar cycles
const generateAcademicSchedule = (semStr: string, joiningYear: number): AcademicEvent[] => {
  const sem = parseInt(semStr);
  if (isNaN(sem)) return [];

  const events: Array<Omit<AcademicEvent, "id" | "createdBy" | "createdAt">> = [];

  // Determine active year and months based on semesters
  // Sem 1: July - Dec of joiningYear
  // Sem 2: Jan - Jun of joiningYear + 1
  // Sem 3: July - Nov of joiningYear + 1
  // Sem 4: Dec of joiningYear + 1 to Apr of joiningYear + 2
  // Sem 5: July - Nov of joiningYear + 2
  // Sem 6: Dec of joiningYear + 2 to Apr of joiningYear + 3
  // Sem 7: July - Nov of joiningYear + 3
  // Sem 8: Dec of joiningYear + 3 to Apr of joiningYear + 4

  if (sem === 1) {
    const yr = joiningYear;
    events.push(
      { title: "Commencement of Semester 1 Class Work", description: "Classes begin for Semester 1 students", startDate: `${yr}-07-01T09:00:00.000Z`, endDate: `${yr}-07-01T17:00:00.000Z`, category: "MILESTONE", semester: 1 },
      { title: "Course Registration & Enrollment", description: "Online registration for subjects", startDate: `${yr}-07-02T09:00:00.000Z`, endDate: `${yr}-07-05T17:00:00.000Z`, category: "MILESTONE", semester: 1 },
      { title: "Mid-Term Examination Series I", description: "First internal assessments cycle", startDate: `${yr}-09-09T09:00:00.000Z`, endDate: `${yr}-09-14T17:00:00.000Z`, category: "EXAM", semester: 1 },
      { title: "Mid-Term Examination Series II", description: "Second internal assessments cycle", startDate: `${yr}-11-11T09:00:00.000Z`, endDate: `${yr}-11-16T17:00:00.000Z`, category: "EXAM", semester: 1 },
      { title: "Semester End Examinations - Practicals (SEE Lab)", description: "Practical laboratory exams", startDate: `${yr}-11-25T09:00:00.000Z`, endDate: `${yr}-11-30T17:00:00.000Z`, category: "EXAM", semester: 1 },
      { title: "Semester End Examinations - Theory (SEE External)", description: "External theory examinations", startDate: `${yr}-12-02T09:00:00.000Z`, endDate: `${yr}-12-14T17:00:00.000Z`, category: "EXAM", semester: 1 },
      { title: "Declaration of Semester 1 Results", description: "Online publishing of results & GPA cards", startDate: `${yr}-12-30T09:00:00.000Z`, endDate: `${yr}-12-30T17:00:00.000Z`, category: "MILESTONE", semester: 1 }
    );
  } else if (sem === 2) {
    const yr = joiningYear + 1;
    events.push(
      { title: "Commencement of Semester 2 Class Work", description: "Classes begin for Semester 2 students", startDate: `${yr}-01-02T09:00:00.000Z`, endDate: `${yr}-01-02T17:00:00.000Z`, category: "MILESTONE", semester: 2 },
      { title: "Course Registration & Enrollment", description: "Online registration for subjects", startDate: `${yr}-01-03T09:00:00.000Z`, endDate: `${yr}-01-06T17:00:00.000Z`, category: "MILESTONE", semester: 2 },
      { title: "Mid-Term Examination Series I", description: "First internal assessments cycle", startDate: `${yr}-03-10T09:00:00.000Z`, endDate: `${yr}-03-15T17:00:00.000Z`, category: "EXAM", semester: 2 },
      { title: "Mid-Term Examination Series II", description: "Second internal assessments cycle", startDate: `${yr}-05-12T09:00:00.000Z`, endDate: `${yr}-05-17T17:00:00.000Z`, category: "EXAM", semester: 2 },
      { title: "Semester End Examinations - Practicals (SEE Lab)", description: "Practical laboratory exams", startDate: `${yr}-05-26T09:00:00.000Z`, endDate: `${yr}-05-31T17:00:00.000Z`, category: "EXAM", semester: 2 },
      { title: "Semester End Examinations - Theory (SEE External)", description: "External theory examinations", startDate: `${yr}-06-02T09:00:00.000Z`, endDate: `${yr}-06-14T17:00:00.000Z`, category: "EXAM", semester: 2 },
      { title: "Declaration of Semester 2 Results", description: "Online publishing of results & GPA cards", startDate: `${yr}-06-28T09:00:00.000Z`, endDate: `${yr}-06-28T17:00:00.000Z`, category: "MILESTONE", semester: 2 }
    );
  } else if (sem === 3) {
    const yr = joiningYear + 1;
    events.push(
      { title: "Commencement of Semester 3 Class Work", description: "Classes begin for Semester 3 students", startDate: `${yr}-07-01T09:00:00.000Z`, endDate: `${yr}-07-01T17:00:00.000Z`, category: "MILESTONE", semester: 3 },
      { title: "Course Registration & Enrollment", description: "Online registration for subjects", startDate: `${yr}-07-02T09:00:00.000Z`, endDate: `${yr}-07-05T17:00:00.000Z`, category: "MILESTONE", semester: 3 },
      { title: "Mid-Term Examination Series I", description: "First internal assessments cycle", startDate: `${yr}-09-14T09:00:00.000Z`, endDate: `${yr}-09-19T17:00:00.000Z`, category: "EXAM", semester: 3 },
      { title: "Mid-Term Examination Series II", description: "Second internal assessments cycle", startDate: `${yr}-11-09T09:00:00.000Z`, endDate: `${yr}-11-14T17:00:00.000Z`, category: "EXAM", semester: 3 },
      { title: "Semester End Examinations - Practicals (SEE Lab)", description: "Practical laboratory exams", startDate: `${yr}-11-16T09:00:00.000Z`, endDate: `${yr}-11-21T17:00:00.000Z`, category: "EXAM", semester: 3 },
      { title: "Semester End Examinations - Theory (SEE External)", description: "External theory examinations", startDate: `${yr}-11-23T09:00:00.000Z`, endDate: `${yr}-12-05T17:00:00.000Z`, category: "EXAM", semester: 3 },
      { title: "Declaration of Semester 3 Results", description: "Online publishing of results & GPA cards", startDate: `${yr}-12-24T09:00:00.000Z`, endDate: `${yr}-12-24T17:00:00.000Z`, category: "MILESTONE", semester: 3 }
    );
  } else if (sem === 4) {
    const yrStart = joiningYear + 1;
    const yrEnd = joiningYear + 2;
    events.push(
      { title: "Commencement of Semester 4 Class Work", description: "Classes begin for Semester 4 students", startDate: `${yrStart}-12-07T09:00:00.000Z`, endDate: `${yrStart}-12-07T17:00:00.000Z`, category: "MILESTONE", semester: 4 },
      { title: "Course Registration & Enrollment", description: "Online registration for subjects", startDate: `${yrStart}-12-08T09:00:00.000Z`, endDate: `${yrStart}-12-11T17:00:00.000Z`, category: "MILESTONE", semester: 4 },
      { title: "Mid-Term Examination Series I", description: "First internal assessments cycle", startDate: `${yrEnd}-02-08T09:00:00.000Z`, endDate: `${yrEnd}-02-13T17:00:00.000Z`, category: "EXAM", semester: 4 },
      { title: "Mid-Term Examination Series II", description: "Second internal assessments cycle", startDate: `${yrEnd}-04-12T09:00:00.000Z`, endDate: `${yrEnd}-04-17T17:00:00.000Z`, category: "EXAM", semester: 4 },
      { title: "Semester End Examinations - Practicals (SEE Lab)", description: "Practical laboratory exams", startDate: `${yrEnd}-04-19T09:00:00.000Z`, endDate: `${yrEnd}-04-24T17:00:00.000Z`, category: "EXAM", semester: 4 },
      { title: "Semester End Examinations - Theory (SEE External)", description: "External theory examinations", startDate: `${yrEnd}-04-26T09:00:00.000Z`, endDate: `${yrEnd}-05-08T17:00:00.000Z`, category: "EXAM", semester: 4 },
      { title: "Declaration of Semester 4 Results", description: "Online publishing of results & GPA cards", startDate: `${yrEnd}-05-25T09:00:00.000Z`, endDate: `${yrEnd}-05-25T17:00:00.000Z`, category: "MILESTONE", semester: 4 }
    );
  } else if (sem === 5) {
    const yr = joiningYear + 2;
    events.push(
      { title: "Commencement of Semester 5 Class Work", description: "Classes begin for Semester 5 students", startDate: `${yr}-07-01T09:00:00.000Z`, endDate: `${yr}-07-01T17:00:00.000Z`, category: "MILESTONE", semester: 5 },
      { title: "Course Registration & Enrollment", description: "Online registration for subjects", startDate: `${yr}-07-02T09:00:00.000Z`, endDate: `${yr}-07-05T17:00:00.000Z`, category: "MILESTONE", semester: 5 },
      { title: "Mid-Term Examination Series I", description: "First internal assessments cycle", startDate: `${yr}-09-13T09:00:00.000Z`, endDate: `${yr}-09-18T17:00:00.000Z`, category: "EXAM", semester: 5 },
      { title: "Mid-Term Examination Series II", description: "Second internal assessments cycle", startDate: `${yr}-11-08T09:00:00.000Z`, endDate: `${yr}-11-13T17:00:00.000Z`, category: "EXAM", semester: 5 },
      { title: "Semester End Examinations - Practicals (SEE Lab)", description: "Practical laboratory exams", startDate: `${yr}-11-15T09:00:00.000Z`, endDate: `${yr}-11-20T17:00:00.000Z`, category: "EXAM", semester: 5 },
      { title: "Semester End Examinations - Theory (SEE External)", description: "External theory examinations", startDate: `${yr}-11-22T09:00:00.000Z`, endDate: `${yr}-12-04T17:00:00.000Z`, category: "EXAM", semester: 5 },
      { title: "Declaration of Semester 5 Results", description: "Online publishing of results & GPA cards", startDate: `${yr}-12-24T09:00:00.000Z`, endDate: `${yr}-12-24T17:00:00.000Z`, category: "MILESTONE", semester: 5 }
    );
  } else if (sem === 6) {
    const yrStart = joiningYear + 2;
    const yrEnd = joiningYear + 3;
    events.push(
      { title: "Commencement of Semester 6 Class Work", description: "Classes begin for Semester 6 students", startDate: `${yrStart}-12-06T09:00:00.000Z`, endDate: `${yrStart}-12-06T17:00:00.000Z`, category: "MILESTONE", semester: 6 },
      { title: "Course Registration & Enrollment", description: "Online registration for subjects", startDate: `${yrStart}-12-07T09:00:00.000Z`, endDate: `${yrStart}-12-10T17:00:00.000Z`, category: "MILESTONE", semester: 6 },
      { title: "Mid-Term Examination Series I", description: "First internal assessments cycle", startDate: `${yrEnd}-02-07T09:00:00.000Z`, endDate: `${yrEnd}-02-12T17:00:00.000Z`, category: "EXAM", semester: 6 },
      { title: "Mid-Term Examination Series II", description: "Second internal assessments cycle", startDate: `${yrEnd}-04-10T09:00:00.000Z`, endDate: `${yrEnd}-04-15T17:00:00.000Z`, category: "EXAM", semester: 6 },
      { title: "Semester End Examinations - Practicals (SEE Lab)", description: "Practical laboratory exams", startDate: `${yrEnd}-04-17T09:00:00.000Z`, endDate: `${yrEnd}-04-22T17:00:00.000Z`, category: "EXAM", semester: 6 },
      { title: "Semester End Examinations - Theory (SEE External)", description: "External theory examinations", startDate: `${yrEnd}-04-24T09:00:00.000Z`, endDate: `${yrEnd}-05-06T17:00:00.000Z`, category: "EXAM", semester: 6 },
      { title: "Declaration of Semester 6 Results", description: "Online publishing of results & GPA cards", startDate: `${yrEnd}-05-24T09:00:00.000Z`, endDate: `${yrEnd}-05-24T17:00:00.000Z`, category: "MILESTONE", semester: 6 }
    );
  } else if (sem === 7) {
    const yr = joiningYear + 3;
    events.push(
      { title: "Commencement of Semester 7 Class Work", description: "Classes begin for Semester 7 students", startDate: `${yr}-07-03T09:00:00.000Z`, endDate: `${yr}-07-03T17:00:00.000Z`, category: "MILESTONE", semester: 7 },
      { title: "Course Registration & Enrollment", description: "Online registration for subjects", startDate: `${yr}-07-04T09:00:00.000Z`, endDate: `${yr}-07-07T17:00:00.000Z`, category: "MILESTONE", semester: 7 },
      { title: "Mid-Term Examination Series I", description: "First internal assessments cycle", startDate: `${yr}-09-11T09:00:00.000Z`, endDate: `${yr}-09-16T17:00:00.000Z`, category: "EXAM", semester: 7 },
      { title: "Mid-Term Examination Series II", description: "Second internal assessments cycle", startDate: `${yr}-11-06T09:00:00.000Z`, endDate: `${yr}-11-11T17:00:00.000Z`, category: "EXAM", semester: 7 },
      { title: "Semester End Examinations - Practicals (SEE Lab)", description: "Practical laboratory exams", startDate: `${yr}-11-13T09:00:00.000Z`, endDate: `${yr}-11-18T17:00:00.000Z`, category: "EXAM", semester: 7 },
      { title: "Semester End Examinations - Theory (SEE External)", description: "External theory examinations", startDate: `${yr}-11-20T09:00:00.000Z`, endDate: `${yr}-12-02T17:00:00.000Z`, category: "EXAM", semester: 7 },
      { title: "Declaration of Semester 7 Results", description: "Online publishing of results & GPA cards", startDate: `${yr}-12-22T09:00:00.000Z`, endDate: `${yr}-12-22T17:00:00.000Z`, category: "MILESTONE", semester: 7 }
    );
  } else if (sem === 8) {
    const yrStart = joiningYear + 3;
    const yrEnd = joiningYear + 4;
    events.push(
      { title: "Commencement of Semester 8 Class Work", description: "Classes begin for Semester 8 students", startDate: `${yrStart}-12-04T09:00:00.000Z`, endDate: `${yrStart}-12-04T17:00:00.000Z`, category: "MILESTONE", semester: 8 },
      { title: "Course Registration & Enrollment", description: "Online registration for subjects", startDate: `${yrStart}-12-05T09:00:00.000Z`, endDate: `${yrStart}-12-08T17:00:00.000Z`, category: "MILESTONE", semester: 8 },
      { title: "Mid-Term Examination Series I", description: "First internal assessments cycle", startDate: `${yrEnd}-02-05T09:00:00.000Z`, endDate: `${yrEnd}-02-10T17:00:00.000Z`, category: "EXAM", semester: 8 },
      { title: "Mid-Term Examination Series II", description: "Second internal assessments cycle", startDate: `${yrEnd}-04-09T09:00:00.000Z`, endDate: `${yrEnd}-04-14T17:00:00.000Z`, category: "EXAM", semester: 8 },
      { title: "Semester End Examinations - Practicals (SEE Lab)", description: "Practical laboratory exams", startDate: `${yrEnd}-04-16T09:00:00.000Z`, endDate: `${yrEnd}-04-21T17:00:00.000Z`, category: "EXAM", semester: 8 },
      { title: "Semester End Examinations - Theory (SEE External)", description: "External theory examinations", startDate: `${yrEnd}-04-23T09:00:00.000Z`, endDate: `${yrEnd}-05-05T17:00:00.000Z`, category: "EXAM", semester: 8 },
      { title: "Declaration of Semester 8 Results", description: "Online publishing of results & GPA cards", startDate: `${yrEnd}-05-22T09:00:00.000Z`, endDate: `${yrEnd}-05-22T17:00:00.000Z`, category: "MILESTONE", semester: 8 }
    );
  }

  // Determine active year for general holidays to align with that semester's year
  let activeYear = joiningYear;
  if (sem === 1) activeYear = joiningYear;
  else if (sem === 2 || sem === 3) activeYear = joiningYear + 1;
  else if (sem === 4 || sem === 5) activeYear = joiningYear + 2;
  else if (sem === 6 || sem === 7) activeYear = joiningYear + 3;
  else if (sem === 8) activeYear = joiningYear + 4;

  events.push(
    { title: "Independence Day Holiday", description: "National celebration of Independence", startDate: `${activeYear}-08-15T09:00:00.000Z`, endDate: `${activeYear}-08-15T17:00:00.000Z`, category: "HOLIDAY", semester: null },
    { title: "Ganesh Chaturthi Festival Holiday", description: "Festive celebration holiday", startDate: `${activeYear}-09-15T09:00:00.000Z`, endDate: `${activeYear}-09-15T17:00:00.000Z`, category: "HOLIDAY", semester: null },
    { title: "Gandhi Jayanti Holiday", description: "National holiday commemorating Gandhi Jayanti", startDate: `${activeYear}-10-02T09:00:00.000Z`, endDate: `${activeYear}-10-02T17:00:00.000Z`, category: "HOLIDAY", semester: null },
    { title: "Dasara Holidays Block", description: "Dasara Pooja vacation cycle", startDate: `${activeYear}-10-06T09:00:00.000Z`, endDate: `${activeYear}-10-13T17:00:00.000Z`, category: "HOLIDAY", semester: null },
    { title: "Deepavali Festival Holiday", description: "Festival of lights vacation day", startDate: `${activeYear}-10-31T09:00:00.000Z`, endDate: `${activeYear}-10-31T17:00:00.000Z`, category: "HOLIDAY", semester: null },
    { title: "Christmas Vacation Holiday", description: "Christmas festival celebration", startDate: `${activeYear}-12-25T09:00:00.000Z`, endDate: `${activeYear}-12-25T17:00:00.000Z`, category: "HOLIDAY", semester: null }
  );

  return events.map((e, index) => ({
    id: `dynamic-${semStr}-${index}`,
    title: e.title,
    description: e.description,
    startDate: e.startDate,
    endDate: e.endDate,
    category: e.category,
    semester: e.semester,
    createdBy: "SYSTEM",
    createdAt: new Date().toISOString()
  }));
};

export default function AcademicCalendarPage() {
  const queryClient = useQueryClient();
  const [selectedSemester, setSelectedSemester] = useState<string>("1");
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AcademicEvent | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    semester: "" as string,
  });

  // Fetch Auth details
  const { data: authData } = useQuery({
    queryKey: ["authMe"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) throw new Error("Unauthorized");
      return res.json();
    },
  });
  const role = authData?.data?.user?.role;
  const isAdmin = role === "ADMIN";

  // Auto-align filter to student's current active semester on load
  useEffect(() => {
    const studentSem = authData?.data?.user?.semester;
    if (studentSem) {
      setSelectedSemester(String(studentSem));
    }
  }, [authData]);

  // Fetch Events
  const { data: eventsRes, isLoading } = useQuery({
    queryKey: ["academicEvents"],
    queryFn: async () => {
      const res = await fetch("/api/academic-calendar");
      if (!res.ok) throw new Error("Failed to fetch calendar events");
      return res.json();
    },
  });

  const rawEvents: AcademicEvent[] = eventsRes?.data?.events || [];

  // Filtered Events (merging dynamic templates with user database additions)
  const filteredEvents = useMemo(() => {
    const isStudent = role === "STUDENT";
    const studentSem = authData?.data?.user?.semester;
    const currentYear = new Date().getFullYear();

    // Determine student cohort joining year
    const studentJoiningYear = isStudent && studentSem
      ? currentYear - Math.floor(studentSem / 2)
      : 2024; // Base cohort default if user has no student sem (e.g. admin)

    const s = parseInt(selectedSemester);
    const jYear = isStudent && studentSem
      ? studentJoiningYear
      : currentYear - Math.floor(s / 2);
    const list = generateAcademicSchedule(selectedSemester, jYear);

    // Merge with any custom events from the database that match the filters
    const dbEventsFiltered = rawEvents.filter(evt => {
      const matchesSemester =
        evt.semester === null ||
        String(evt.semester) === selectedSemester;
      return matchesSemester;
    });

    // Merge lists (avoid duplicating standard events if they are also in the DB)
    const combined = [...list];
    dbEventsFiltered.forEach(dbEvt => {
      const isDuplicate = combined.some(
        c => c.title === dbEvt.title && 
             new Date(c.startDate).toDateString() === new Date(dbEvt.startDate).toDateString()
      );
      if (!isDuplicate) {
        combined.push(dbEvt);
      }
    });

    // Sort chronologically by startDate
    return combined.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [rawEvents, selectedSemester, role, authData]);

  // Modal actions
  const openAddModal = () => {
    setEditingEvent(null);
    setFormData({
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      semester: selectedSemester,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (evt: AcademicEvent) => {
    setEditingEvent(evt);
    setFormData({
      title: evt.title,
      description: evt.description || "",
      startDate: new Date(evt.startDate).toISOString().slice(0, 16),
      endDate: new Date(evt.endDate).toISOString().slice(0, 16),
      semester: evt.semester ? String(evt.semester) : "",
    });
    setIsModalOpen(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = "/api/academic-calendar";
      const method = editingEvent ? "PUT" : "POST";
      const payload = {
        title: formData.title,
        description: formData.description || null,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        category: formData.title.toLowerCase().includes("holiday") ? "HOLIDAY" : "MILESTONE",
        semester: formData.semester ? parseInt(formData.semester) : null,
        ...(editingEvent && { id: editingEvent.id }),
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.message || "Failed to save academic event");
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["academicEvents"] });
      setIsModalOpen(false);
    } catch (error) {
      console.error("Save event error:", error);
      alert("An error occurred while saving the event.");
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    try {
      const res = await fetch(`/api/academic-calendar?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        alert("Failed to delete event");
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["academicEvents"] });
      setIsModalOpen(false);
    } catch (error) {
      console.error("Delete event error:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <CalendarIcon className="h-10 w-10 text-[#10B981] animate-pulse" />
          <p className="text-slate-900 text-sm font-black">Loading Academic Planner...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-12 relative z-10 px-4">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-1 flex items-center gap-3">
            <CalendarIcon className="text-[#10B981]" size={32} /> Academic Planner & Schedule
          </h1>
          <p className="text-slate-800 font-extrabold text-sm">
            Access curriculum, exam cycles, detentions, fests, and holiday schedules.
          </p>
        </div>
        {isAdmin && (
          <button
            id="add-event-btn"
            onClick={openAddModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#10B981] to-[#059669] text-white font-extrabold rounded-xl shadow-[0_4px_12px_rgba(16,185,129,0.25)] hover:scale-[1.02] active:scale-[0.98] transition-all text-sm self-start md:self-auto"
          >
            <Plus size={18} /> Add Event
          </button>
        )}
      </motion.div>

      {/* Filter Row */}
      <div className="bg-white border border-slate-300 rounded-2xl p-4 mb-6 shadow-sm flex items-center justify-between">
        <div className="flex gap-3 items-center">
          <span className="text-xs font-black text-slate-900 uppercase tracking-wider">Semester:</span>
          <select
            id="filter-semester-select"
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="bg-slate-50 border border-slate-350 rounded-xl px-3 py-1.5 text-xs font-black text-slate-900 focus:outline-none focus:border-[#10B981] transition-colors"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <option key={s} value={String(s)}>Semester {s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabular Schedule List */}
      <div className="bg-white border border-slate-300 rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="font-black text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-3">
          <CalendarDays className="text-[#10B981]" size={18} /> 
          {`Semester ${selectedSemester} Academic Planner Schedules, Exams & Holidays`}
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-300 text-xs font-black text-slate-900 uppercase tracking-wider bg-slate-50">
                <th className="py-2.5 px-4">S.No.</th>
                <th className="py-2.5 px-4">Event Description</th>
                <th className="py-2.5 px-4">Schedule / Date Range</th>
                {isAdmin && <th className="py-2.5 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredEvents.map((evt, idx) => {
                return (
                  <tr 
                    key={evt.id}
                    onClick={() => isAdmin && openEditModal(evt)}
                    className={`hover:bg-slate-55 transition-colors text-sm text-slate-900 font-extrabold ${isAdmin ? "cursor-pointer" : ""}`}
                  >
                    <td className="py-2.5 px-4 text-xs font-black text-slate-900">{idx + 1}</td>
                    <td className="py-2.5 px-4 max-w-xs md:max-w-md">
                      <div className="font-black text-slate-900 text-sm leading-snug">{evt.title}</div>
                      {evt.description && <div className="text-xs text-slate-800 mt-1 font-bold leading-normal">{evt.description}</div>}
                    </td>
                    <td className="py-2.5 px-4 text-xs font-black text-slate-900 whitespace-nowrap">
                      {(() => {
                        const startStr = new Date(evt.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                        const endStr = new Date(evt.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                        return startStr === endStr ? startStr : `${startStr} - ${endStr}`;
                      })()}
                    </td>
                    {isAdmin && (
                      <td className="py-2.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          id={`edit-event-btn-${evt.id}`}
                          onClick={() => openEditModal(evt)}
                          className="p-1.5 text-slate-700 hover:text-slate-950 hover:bg-slate-200 rounded-lg transition-colors inline-block"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          id={`delete-event-btn-${evt.id}`}
                          onClick={() => handleDeleteEvent(evt.id)}
                          className="p-1.5 text-slate-700 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors inline-block ml-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
              {filteredEvents.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 4 : 3} className="py-12 text-center text-slate-900 font-black text-sm">
                    No academic events, exams or holidays scheduled.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Add/Edit Event (Admin Only) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-300 w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-5 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                  <CalendarIcon size={20} className="text-[#10B981]" />
                  {editingEvent ? "Edit Calendar Event" : "Create Calendar Event"}
                </h3>
                <button 
                  id="event-close-modal-btn"
                  type="button"
                  onClick={() => setIsModalOpen(false)} 
                  className="text-slate-700 hover:text-slate-900"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveEvent} className="p-6 space-y-4">
                <div>
                  <label htmlFor="event-title-input" className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-1.5">
                    Event Title
                  </label>
                  <input
                    id="event-title-input"
                    type="text"
                    required
                    placeholder="e.g. Mid-Term Examination I"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 font-extrabold focus:outline-none focus:border-[#10B981] transition-colors text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="event-semester-select" className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-1.5">
                    Semester (Optional)
                  </label>
                  <select
                    id="event-semester-select"
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-extrabold focus:outline-none focus:border-[#10B981] transition-colors text-sm"
                  >
                    <option value="">All Semesters</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                      <option key={s} value={String(s)}>Semester {s}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="event-start-date-input" className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-1.5">
                      Start Date & Time
                    </label>
                    <input
                      id="event-start-date-input"
                      type="datetime-local"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-extrabold focus:outline-none focus:border-[#10B981] transition-colors text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="event-end-date-input" className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-1.5">
                      End Date & Time
                    </label>
                    <input
                      id="event-end-date-input"
                      type="datetime-local"
                      required
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-extrabold focus:outline-none focus:border-[#10B981] transition-colors text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="event-description-input" className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-1.5">
                    Description
                  </label>
                  <textarea
                    id="event-description-input"
                    placeholder="Provide details about the calendar event..."
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 font-extrabold focus:outline-none focus:border-[#10B981] transition-colors text-sm resize-none"
                  />
                </div>

                {/* Buttons row */}
                <div className="flex gap-3 pt-2">
                  {editingEvent && (
                    <button
                      id="event-delete-btn"
                      type="button"
                      onClick={() => handleDeleteEvent(editingEvent.id)}
                      className="px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 font-black rounded-xl text-sm transition-colors flex items-center gap-1.5"
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  )}
                  <button
                    id="event-cancel-btn"
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-xl text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    id="event-save-btn"
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-[#10B981] to-[#059669] text-white font-black rounded-xl text-sm shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all"
                  >
                    Save Event
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
