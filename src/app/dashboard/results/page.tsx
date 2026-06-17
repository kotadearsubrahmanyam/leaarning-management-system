"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award,
  BookOpen,
  CheckCircle,
  XCircle,
  TrendingUp,
  GraduationCap,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Search,
  Book,
  User,
  Sliders,
  Check,
  X,
  RefreshCw,
  ChevronRight,
  Globe
} from "lucide-react";

interface SubjectResult {
  id?: string;
  userId?: string;
  studentName?: string;
  studentRollNumber?: string;
  semester: number;
  subjectCode: string;
  subjectName: string;
  internalMarks: number;
  externalMarks: number;
  totalMarks?: number;
  marks?: number;
  credits: number;
  grade: string;
  status: "PASS" | "FAIL";
  published?: boolean;
}

const getGradePoints = (grade: string): number => {
  const g = grade.toUpperCase().trim();
  if (["A+", "O"].includes(g)) return 10;
  if (g === "A") return 9;
  if (g === "B+") return 8;
  if (g === "B") return 7;
  if (g === "C") return 6;
  if (g === "D") return 5;
  return 0; // F, S, etc.
};

const getAutoGrade = (total: number): string => {
  if (total >= 90) return "A+";
  if (total >= 80) return "A";
  if (total >= 70) return "B+";
  if (total >= 60) return "B";
  if (total >= 50) return "C";
  if (total >= 40) return "D";
  return "F";
};

const getExamMonthYear = (sem: number, rollNumber?: string, currentSem?: number) => {
  let joiningYear = 2024;
  if (rollNumber && /^\d{2}/.test(rollNumber)) {
    joiningYear = 2000 + parseInt(rollNumber.substring(0, 2), 10);
  }
  
  const currentSemester = currentSem || 1;
  const currentRealYear = new Date().getFullYear(); // 2026

  let year = joiningYear + Math.floor(sem / 2);
  if (sem >= currentSemester) {
    year = currentRealYear + Math.floor(sem / 2) - Math.floor(currentSemester / 2);
  }

  const yearShort = String(year).substring(2);
  const isOdd = sem % 2 !== 0;
  if (isOdd) {
    const month = sem === 1 ? "Dec" : "Nov";
    return `${month}-${yearShort}`;
  } else {
    const month = sem === 2 ? "Jun" : "Apr";
    return `${month}-${yearShort}`;
  }
};

const getExamDate = (sem: number, courseIndex: number, rollNumber?: string, currentSem?: number) => {
  let joiningYear = 2024;
  if (rollNumber && /^\d{2}/.test(rollNumber)) {
    joiningYear = 2000 + parseInt(rollNumber.substring(0, 2), 10);
  }
  
  const currentSemester = currentSem || 1;
  const currentRealYear = new Date().getFullYear(); // 2026

  let year = joiningYear + Math.floor(sem / 2);
  if (sem >= currentSemester) {
    year = currentRealYear + Math.floor(sem / 2) - Math.floor(currentSemester / 2);
  }

  let startMonth = 12;
  let startDay = 2;

  if (sem === 1) { startMonth = 12; startDay = 2; }
  else if (sem === 2) { startMonth = 6; startDay = 2; }
  else if (sem === 3) { startMonth = 11; startDay = 23; }
  else if (sem === 4) { startMonth = 4; startDay = 26; }
  else if (sem === 5) { startMonth = 11; startDay = 22; }
  else if (sem === 6) { startMonth = 4; startDay = 24; }
  else if (sem === 7) { startMonth = 11; startDay = 20; }
  else if (sem === 8) { startMonth = 4; startDay = 23; }

  const startDate = new Date(year, startMonth - 1, startDay);
  let examDate = new Date(startDate);
  let daysAdded = 0;
  let targetDays = courseIndex * 2; // space exams every 2 days
  
  while (daysAdded < targetDays) {
    examDate.setDate(examDate.getDate() + 1);
    if (examDate.getDay() !== 0) { // skip Sunday
      daysAdded++;
    }
  }

  const day = String(examDate.getDate()).padStart(2, "0");
  const months = ["Dec", "Jun", "Nov", "Apr", "Nov", "Apr", "Nov", "Apr"]; // lookup based on sem startMonth
  const monthName = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][examDate.getMonth()];
  const yearStr = examDate.getFullYear();
  return `${day}-${monthName}-${yearStr}`;
};

export default function ResultsPage() {
  const queryClient = useQueryClient();
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);

  // Calculator States
  const [plannerGrades, setPlannerGrades] = useState<Record<string, string>>({});
  const [hasUserModified, setHasUserModified] = useState(false);

  // Policy Settings States
  const [backlogPolicy, setBacklogPolicy] = useState("A");
  const [isSavingPolicy, setIsSavingPolicy] = useState(false);

  // Search & Filters for Admin
  const [adminTab, setAdminTab] = useState<"subjects" | "publish" | "policy">("subjects");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSemester, setFilterSemester] = useState<string>("ALL");
  const [isPublishingAll, setIsPublishingAll] = useState(false);

  // Add/Edit Subject Modal
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any | null>(null);
  const [subjectFormData, setSubjectFormData] = useState({
    userId: "",
    semester: 1,
    subjectCode: "",
    subjectName: "",
    internalMarks: "",
    externalMarks: "",
    credits: 3,
    grade: "",
    status: "",
  });

  // Override Modal
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [overrideFormData, setOverrideFormData] = useState({
    userId: "",
    studentName: "",
    semester: 1,
    sgpa: "",
    cgpa: "",
  });

  // Form Auto Calculations Preview
  const [formTotalMarks, setFormTotalMarks] = useState(0);
  const [formGrade, setFormGrade] = useState("F");
  const [formStatus, setFormStatus] = useState("FAIL");

  // Fetch logged in user details
  const { data: authData } = useQuery({
    queryKey: ["authMe"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) throw new Error("Unauthorized");
      return res.json();
    },
  });
  const role = authData?.data?.user?.role;
  const currentStudentId = authData?.data?.user?.id;

  // Fetch results based on role
  const { data, isLoading } = useQuery({
    queryKey: ["results", role],
    queryFn: async () => {
      const endpoint = role === "ADMIN" ? "/api/admin/results" : "/api/student/results";
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error("Failed to fetch results");
      return res.json();
    },
    enabled: !!role,
  });

  // Fetch users for admin autocomplete/dropdown
  const { data: usersData } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
    enabled: role === "ADMIN",
  });

  // Fetch semester summaries for admin
  const { data: summariesData } = useQuery({
    queryKey: ["adminSummaries"],
    queryFn: async () => {
      const res = await fetch("/api/admin/results/summary");
      if (!res.ok) throw new Error("Failed to fetch summaries");
      return res.json();
    },
    enabled: role === "ADMIN",
  });

  // Fetch enrolled courses for student calculator
  const { data: enrolledCoursesRes } = useQuery({
    queryKey: ["enrolledCourses"],
    queryFn: async () => {
      const res = await fetch("/api/courses/enrolled");
      if (!res.ok) throw new Error("Failed to fetch enrolled courses");
      return res.json();
    },
    enabled: role === "STUDENT",
  });

  const students = (usersData?.data?.users || []).filter((u: any) => u.role === "STUDENT");
  const adminResults = data?.data?.results || [];
  const dbSummaries = summariesData?.data?.summaries || [];

  // Student Results details
  const studentResults = data?.data?.results || [];
  const studentSummaries = data?.data?.summaries || {};
  const publishedSemesters: number[] = data?.data?.publishedSemesters || [];

  // Determine current semester and planning target semester
  const currentStudentSemester = authData?.data?.user?.semester;
  const planningSem = (currentStudentSemester && publishedSemesters.includes(currentStudentSemester))
    ? currentStudentSemester + 1
    : (currentStudentSemester || 1);

  const tabsList = [...publishedSemesters];
  if (planningSem && !tabsList.includes(planningSem)) {
    tabsList.push(planningSem);
  }

  // Fetch department/curriculum courses for planning semester
  const { data: departmentCoursesRes } = useQuery({
    queryKey: ["departmentCourses", planningSem],
    queryFn: async () => {
      const res = await fetch(`/api/courses?semester=${planningSem}`);
      if (!res.ok) throw new Error("Failed to fetch department courses");
      return res.json();
    },
    enabled: role === "STUDENT" && !!planningSem,
  });

  const activeCourses = React.useMemo(() => {
    const enrolledCourses = enrolledCoursesRes?.data?.courses || [];
    const currentEnrolledActive = enrolledCourses.filter((c: any) => c.status === "ACTIVE");
    const deptCurriculumCourses = departmentCoursesRes?.data?.courses || [];

    return (planningSem === currentStudentSemester && currentEnrolledActive.length > 0)
      ? currentEnrolledActive
      : deptCurriculumCourses;
  }, [planningSem, currentStudentSemester, enrolledCoursesRes, departmentCoursesRes]);

  const officialCgpa = React.useMemo(() => {
    if (publishedSemesters.length === 0) return 0;
    const latestSem = publishedSemesters[publishedSemesters.length - 1];
    const latestSummary = studentSummaries[latestSem];
    return latestSummary ? parseFloat(latestSummary.cgpa || "0") : 0;
  }, [publishedSemesters, studentSummaries]);

  const publishedCredits = React.useMemo(() => {
    return Object.entries(studentSummaries)
      .reduce((sum, [_, val]: [string, any]) => sum + (val.totalCredits || 0), 0);
  }, [studentSummaries]);

  // Set default selected semester for student to the latest tab
  useEffect(() => {
    if (tabsList.length > 0 && selectedSemester === null) {
      setSelectedSemester(tabsList[tabsList.length - 1]);
    }
  }, [tabsList, selectedSemester]);

  // Handle Form Live Previews
  useEffect(() => {
    const internal = parseInt(subjectFormData.internalMarks) || 0;
    const external = parseInt(subjectFormData.externalMarks) || 0;
    const total = internal + external;
    setFormTotalMarks(total);

    const calculatedGrade = subjectFormData.grade || getAutoGrade(total);
    setFormGrade(calculatedGrade);

    const calculatedStatus = subjectFormData.status || (total >= 40 && calculatedGrade !== "F" ? "PASS" : "FAIL");
    setFormStatus(calculatedStatus);
  }, [subjectFormData.internalMarks, subjectFormData.externalMarks, subjectFormData.grade, subjectFormData.status]);

  // Synchronize initial planner grades
  useEffect(() => {
    if (activeCourses.length > 0) {
      const initialGrades: Record<string, string> = {};
      activeCourses.forEach((c: any) => {
        // Default to their official grade if already published, otherwise "A"
        const official = studentResults.find((r: any) => r.courseId === c.id);
        initialGrades[c.id] = official?.grade || "A";
      });
      setPlannerGrades(initialGrades);
    }
  }, [activeCourses, data]);

  // Load backlog policy setting for administrators
  useEffect(() => {
    if (role === "ADMIN") {
      fetch("/api/admin/settings")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data?.policy) {
            setBacklogPolicy(data.data.policy);
          }
        })
        .catch((err) => console.error("Error fetching backlog policy:", err));
    }
  }, [role]);

  const handleSavePolicy = async (policy: string) => {
    setIsSavingPolicy(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policy }),
      });
      if (!res.ok) throw new Error("Failed to save backlog policy");
      const resData = await res.json();
      if (resData.success) {
        setBacklogPolicy(policy);
        alert("GPA Recalculation Policy updated successfully!");
      }
    } catch (err) {
      console.error("Save backlog policy error:", err);
      alert("Failed to update GPA recalculation policy.");
    } finally {
      setIsSavingPolicy(false);
    }
  };

  // Reset form data
  const resetForm = () => {
    setSubjectFormData({
      userId: "",
      semester: 1,
      subjectCode: "",
      subjectName: "",
      internalMarks: "",
      externalMarks: "",
      credits: 3,
      grade: "",
      status: "",
    });
    setEditingSubject(null);
  };

  // Open Subject Modal (Add)
  const openAddModal = () => {
    resetForm();
    setIsSubjectModalOpen(true);
  };

  // Open Subject Modal (Edit)
  const openEditModal = (sub: any) => {
    setEditingSubject(sub);
    setSubjectFormData({
      userId: sub.userId,
      semester: sub.semester,
      subjectCode: sub.subjectCode || "",
      subjectName: sub.subjectName || "",
      internalMarks: String(sub.internalMarks || 0),
      externalMarks: String(sub.externalMarks || 0),
      credits: sub.credits || 3,
      grade: sub.grade || "",
      status: sub.status || "",
    });
    setIsSubjectModalOpen(true);
  };

  // Save Subject Result
  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = "/api/admin/results";
      const method = editingSubject ? "PUT" : "POST";
      const payload = editingSubject
        ? { id: editingSubject.id, ...subjectFormData }
        : subjectFormData;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.message || "Failed to save result");
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["results"] });
      queryClient.invalidateQueries({ queryKey: ["adminSummaries"] });
      setIsSubjectModalOpen(false);
      resetForm();
    } catch (error) {
      console.error("Save subject error:", error);
      alert("An error occurred while saving.");
    }
  };

  // Delete Subject Result
  const handleDeleteSubject = async (id: string) => {
    if (!confirm("Are you sure you want to delete this result?")) return;
    try {
      const res = await fetch(`/api/admin/results?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        alert("Failed to delete result");
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["results"] });
      queryClient.invalidateQueries({ queryKey: ["adminSummaries"] });
    } catch (error) {
      console.error("Delete subject error:", error);
    }
  };

  // Toggle Publish Status
  const handleTogglePublish = async (userId: string, semester: number, currentPublish: boolean) => {
    try {
      const res = await fetch("/api/admin/results/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, semester, publish: !currentPublish }),
      });

      if (!res.ok) {
        alert("Failed to update publish status");
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["results"] });
      queryClient.invalidateQueries({ queryKey: ["adminSummaries"] });
    } catch (error) {
      console.error("Toggle publish error:", error);
    }
  };

  // Publish All Drafts
  const handlePublishAll = async () => {
    const drafts = filteredGroupedSemesters.filter((g: any) => !g.isPublished);
    if (drafts.length === 0) {
      alert("There are no draft results to publish.");
      return;
    }
    if (!confirm(`Are you sure you want to publish all ${drafts.length} draft results at once?`)) return;
    
    setIsPublishingAll(true);
    try {
      await Promise.all(drafts.map((g: any) => 
        fetch("/api/admin/results/publish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: g.userId, semester: g.semester, publish: true }),
        })
      ));
      
      queryClient.invalidateQueries({ queryKey: ["results"] });
      queryClient.invalidateQueries({ queryKey: ["adminSummaries"] });
    } catch (error) {
      console.error("Publish all error:", error);
      alert("Failed to publish all results.");
    } finally {
      setIsPublishingAll(false);
    }
  };

  // Open Override Modal
  const openOverrideModal = (userId: string, studentName: string, semester: number) => {
    const summary = dbSummaries.find((s: any) => s.userId === userId && s.semester === semester);
    setOverrideFormData({
      userId,
      studentName,
      semester,
      sgpa: summary?.sgpa || "",
      cgpa: summary?.cgpa || "",
    });
    setIsOverrideModalOpen(true);
  };

  // Save SGPA/CGPA Overrides
  const handleSaveOverrides = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/results/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: overrideFormData.userId,
          semester: overrideFormData.semester,
          sgpa: overrideFormData.sgpa || null,
          cgpa: overrideFormData.cgpa || null,
        }),
      });

      if (!res.ok) {
        alert("Failed to save overrides");
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["adminSummaries"] });
      queryClient.invalidateQueries({ queryKey: ["results"] });
      setIsOverrideModalOpen(false);
    } catch (error) {
      console.error("Save overrides error:", error);
    }
  };

  // Group Admin Results for Publish Status Panel
  const getGroupedStudentSemesters = () => {
    const groups: Record<string, {
      userId: string;
      studentName: string;
      studentRollNumber: string;
      semester: number;
      subjectCount: number;
      isPublished: boolean;
      calculatedSgpa: string;
    }> = {};

    adminResults.forEach((r: any) => {
      const key = `${r.userId}-${r.semester}`;
      if (!groups[key]) {
        // Find existing summary status
        const summary = dbSummaries.find((s: any) => s.userId === r.userId && s.semester === r.semester);
        
        groups[key] = {
          userId: r.userId,
          studentName: r.studentName,
          studentRollNumber: r.studentRollNumber,
          semester: r.semester,
          subjectCount: 0,
          isPublished: summary ? summary.published : r.published,
          calculatedSgpa: "0.00",
        };
      }
      groups[key].subjectCount += 1;
    });

    // Calculate dynamic SGPA for group preview
    Object.keys(groups).forEach(key => {
      const [userId, semesterStr] = key.split("-");
      const semester = parseInt(semesterStr);
      const semResults = adminResults.filter((r: any) => r.userId === userId && r.semester === semester);
      const totalCredits = semResults.reduce((sum: number, r: any) => sum + (r.credits || 0), 0);
      if (totalCredits > 0) {
        const totalPoints = semResults.reduce((sum: number, r: any) => sum + (getGradePoints(r.grade) * (r.credits || 0)), 0);
        groups[key].calculatedSgpa = (totalPoints / totalCredits).toFixed(2);
      }
    });

    return Object.values(groups);
  };

  const groupedStudentSemesters = getGroupedStudentSemesters();

  // Filters results for Admin Subject Marks tab
  const filteredAdminResults = adminResults.filter((r: any) => {
    const matchesSearch =
      (r.studentName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.studentRollNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.subjectCode || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.subjectName || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSemester =
      filterSemester === "ALL" || String(r.semester) === filterSemester;

    return matchesSearch && matchesSemester;
  });

  // Filter Grouped Semesters for Publish Tab
  const filteredGroupedSemesters = groupedStudentSemesters.filter((g: any) => {
    const matchesSearch =
      (g.studentName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (g.studentRollNumber || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSemester =
      filterSemester === "ALL" || String(g.semester) === filterSemester;

    return matchesSearch && matchesSemester;
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-10 w-10 text-[#10B981] animate-spin" />
          <p className="text-foreground/60 text-sm">Loading results data...</p>
        </div>
      </div>
    );
  }

  // --- ADMIN RENDER ---
  if (role === "ADMIN") {
    return (
      <div className="max-w-6xl mx-auto pb-12 relative z-10">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2 flex items-center gap-3">
              <Award className="text-[#10B981]" size={32} /> Results Administration
            </h1>
            <p className="text-slate-500">
              Manage student marks, assign grades, publish/unpublish semesters, and override GPA calculations.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#10B981] to-[#059669] text-white font-bold rounded-xl shadow-[0_4px_12px_rgba(16,185,129,0.25)] hover:scale-[1.02] active:scale-[0.98] transition-all text-sm self-start md:self-auto"
          >
            <Plus size={18} /> Add Subject Result
          </button>
        </motion.div>

        {/* Tab Controls */}
        <div className="flex justify-between items-center border-b border-slate-300 mb-6">
          <div className="flex gap-6">
            <button
              onClick={() => setAdminTab("subjects")}
              className={`pb-3 font-bold text-sm transition-all border-b-2 flex items-center gap-2 ${
                adminTab === "subjects"
                  ? "border-[#10B981] text-[#10B981]"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              <Book size={18} /> Subject Marks Entry
            </button>
            <button
              onClick={() => setAdminTab("publish")}
              className={`pb-3 font-bold text-sm transition-all border-b-2 flex items-center gap-2 ${
                adminTab === "publish"
                  ? "border-[#10B981] text-[#10B981]"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              <Sliders size={18} /> Publishing & GPA Overrides
            </button>
            <button
              onClick={() => setAdminTab("policy")}
              className={`pb-3 font-bold text-sm transition-all border-b-2 flex items-center gap-2 ${
                adminTab === "policy"
                  ? "border-[#10B981] text-[#10B981]"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              <Sliders size={18} /> GPA Policies
            </button>
          </div>
          {adminTab === "publish" && (
            <button
              onClick={handlePublishAll}
              disabled={isPublishingAll}
              className="mb-2 flex items-center gap-2 px-4 py-2 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-colors text-sm disabled:opacity-50"
            >
              {isPublishingAll ? <RefreshCw className="animate-spin" size={16} /> : <Globe size={16} />}
              {isPublishingAll ? "Publishing..." : "Publish All Drafts"}
            </button>
          )}
        </div>

        {/* Search & Filter Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="relative col-span-2">
            <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              placeholder={
                adminTab === "subjects"
                  ? "Search by student name, roll number, subject code..."
                  : "Search by student name or roll number..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-700 focus:outline-none focus:border-[#10B981] transition-colors text-sm"
            />
          </div>
          <div>
            <select
              value={filterSemester}
              onChange={(e) => setFilterSemester(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-700 focus:outline-none focus:border-[#10B981] transition-colors text-sm"
            >
              <option value="ALL">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={String(s)}>Semester {s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* TAB CONTENT: Subject Marks */}
        {adminTab === "subjects" && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-wider border-b border-slate-300">
                    <th className="p-4 pl-6">Roll Number</th>
                    <th className="p-4">Student</th>
                    <th className="p-4 text-center">Semester</th>
                    <th className="p-4">Subject</th>
                    <th className="p-4 text-center">Internal</th>
                    <th className="p-4 text-center">External</th>
                    <th className="p-4 text-center">Total</th>
                    <th className="p-4 text-center">Credits</th>
                    <th className="p-4 text-center">Grade</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center">Publish</th>
                    <th className="p-4 pr-6 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                  {filteredAdminResults.map((r: any) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 pl-6 font-mono text-xs font-semibold text-slate-500">{r.studentRollNumber}</td>
                      <td className="p-4 font-bold text-slate-800">{r.studentName}</td>
                      <td className="p-4 text-center font-medium">Sem {r.semester}</td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-700">{r.subjectName}</div>
                        <div className="text-xs text-slate-400 font-mono">{r.subjectCode}</div>
                      </td>
                      <td className="p-4 text-center text-slate-500">{r.internalMarks}</td>
                      <td className="p-4 text-center text-slate-500">{r.externalMarks}</td>
                      <td className="p-4 text-center font-bold text-slate-800">{r.marks}/100</td>
                      <td className="p-4 text-center">{r.credits}</td>
                      <td className="p-4 text-center">
                        <span className={`font-black ${["A+", "A", "B+", "B"].includes(r.grade) ? "text-[#10B981]" : r.grade === "F" ? "text-red-500" : "text-slate-700"}`}>
                          {r.grade}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${r.status === "PASS" ? "bg-green-50 text-green-600 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleTogglePublish(r.userId, r.semester, r.published)}
                          title={r.published ? "Click to Unpublish" : "Click to Publish"}
                          className={`p-1.5 rounded-full border transition-all ${
                            r.published
                              ? "bg-green-50 text-green-600 border-green-200 hover:bg-green-100"
                              : "bg-slate-50 text-slate-400 border-slate-300 hover:bg-slate-100"
                          }`}
                        >
                          {r.published ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>
                      </td>
                      <td className="p-4 pr-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(r)}
                            className="p-1 text-slate-400 hover:text-[#10B981] transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteSubject(r.id)}
                            className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredAdminResults.length === 0 && (
                    <tr>
                      <td colSpan={12} className="p-8 text-center text-slate-400">
                        No results found. Click "Add Subject Result" to add marks.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB CONTENT: Publishing & GPA Overrides */}
        {adminTab === "publish" && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-wider border-b border-slate-300">
                    <th className="p-4 pl-6">Roll Number</th>
                    <th className="p-4">Student Name</th>
                    <th className="p-4 text-center">Semester</th>
                    <th className="p-4 text-center">Subject Count</th>
                    <th className="p-4 text-center">Calculated SGPA</th>
                    <th className="p-4 text-center">SGPA Override</th>
                    <th className="p-4 text-center">CGPA Override</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 pr-6 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                  {filteredGroupedSemesters.map((g: any, i: number) => {
                    const summary = dbSummaries.find((s: any) => s.userId === g.userId && s.semester === g.semester);
                    return (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 pl-6 font-mono text-xs font-semibold text-slate-500">{g.studentRollNumber}</td>
                        <td className="p-4 font-bold text-slate-800">{g.studentName}</td>
                        <td className="p-4 text-center font-bold">Semester {g.semester}</td>
                        <td className="p-4 text-center font-medium">{g.subjectCount} subjects</td>
                        <td className="p-4 text-center text-slate-500 font-bold">{g.calculatedSgpa}</td>
                        <td className="p-4 text-center font-bold text-slate-800">
                          {summary?.sgpa ? (
                            <span className="text-[#10B981] flex items-center justify-center gap-1">
                              {summary.sgpa} <Check size={12} />
                            </span>
                          ) : (
                            <span className="text-slate-300 font-normal">No override</span>
                          )}
                        </td>
                        <td className="p-4 text-center font-bold text-slate-800">
                          {summary?.cgpa ? (
                            <span className="text-[#10B981] flex items-center justify-center gap-1">
                              {summary.cgpa} <Check size={12} />
                            </span>
                          ) : (
                            <span className="text-slate-300 font-normal">No override</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                            g.isPublished
                              ? "bg-green-50 text-green-600 border-green-200"
                              : "bg-amber-50 text-amber-600 border-amber-200"
                          }`}>
                            {g.isPublished ? "PUBLISHED" : "DRAFT"}
                          </span>
                        </td>
                        <td className="p-4 pr-6 text-center">
                          <div className="flex items-center justify-center gap-3">
                            <button
                              onClick={() => handleTogglePublish(g.userId, g.semester, g.isPublished)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold text-xs transition-colors ${
                                g.isPublished
                                  ? "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
                                  : "bg-[#10B981] text-white border-transparent hover:bg-[#059669]"
                              }`}
                            >
                              {g.isPublished ? (
                                <>
                                  <EyeOff size={14} /> Unpublish
                                </>
                              ) : (
                                <>
                                  <Eye size={14} /> Publish Results
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => openOverrideModal(g.userId, g.studentName, g.semester)}
                              className="px-3 py-1.5 border border-slate-300 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                            >
                              <Sliders size={14} /> Set GPAs
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredGroupedSemesters.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400">
                        No semesters entered yet. Go to "Subject Marks Entry" to add marks.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB CONTENT: GPA Policies */}
        {adminTab === "policy" && (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm max-w-2xl mx-auto space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Backlog GPA Recalculation Policy</h2>
              <p className="text-slate-500 text-sm">
                Select the institutional policy used to recalculate student SGPA and CGPA values once a backlog subject is cleared via supplementary exams.
              </p>
            </div>

            <div className="space-y-4">
              <label className="flex items-start gap-4 p-4 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="gpaPolicy"
                  value="A"
                  checked={backlogPolicy === "A"}
                  onChange={() => handleSavePolicy("A")}
                  disabled={isSavingPolicy}
                  className="mt-1.5 h-4 w-4 text-[#10B981] focus:ring-[#10B981] border-slate-300"
                />
                <div>
                  <span className="block font-bold text-slate-800">Policy A: Latest Grade Replacement</span>
                  <span className="block text-xs text-slate-500 mt-1">
                    Replace the failed grade with the actual grade achieved in the supplementary exam (e.g. F becomes B). Recalculate SGPA for the original semester and CGPA for all subsequent semesters.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-4 p-4 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="gpaPolicy"
                  value="B"
                  checked={backlogPolicy === "B"}
                  onChange={() => handleSavePolicy("B")}
                  disabled={isSavingPolicy}
                  className="mt-1.5 h-4 w-4 text-[#10B981] focus:ring-[#10B981] border-slate-300"
                />
                <div>
                  <span className="block font-bold text-slate-800">Policy B: Pass Grade Replacement</span>
                  <span className="block text-xs text-slate-500 mt-1">
                    Replace the failed grade with a fixed minimum passing grade (D, 5 points) defined by the institution, regardless of the actual grade scored in the supplementary exam.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-4 p-4 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="gpaPolicy"
                  value="C"
                  checked={backlogPolicy === "C"}
                  onChange={() => handleSavePolicy("C")}
                  disabled={isSavingPolicy}
                  className="mt-1.5 h-4 w-4 text-[#10B981] focus:ring-[#10B981] border-slate-300"
                />
                <div>
                  <span className="block font-bold text-slate-800">Policy C: Original Grade Retention</span>
                  <span className="block text-xs text-slate-500 mt-1">
                    Retain the original failed grade (F, 0 points) in GPA calculations and only update the subject's status to passed. Backlog count is updated, but SGPA and CGPA remain unchanged.
                  </span>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* MODAL: Add/Edit Subject Marks */}
        <AnimatePresence>
          {isSubjectModalOpen && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl border border-slate-300 w-full max-w-lg overflow-hidden shadow-2xl"
              >
                <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-bold text-lg text-slate-800">
                    {editingSubject ? "Edit Subject Result" : "Add Subject Result"}
                  </h3>
                  <button onClick={() => setIsSubjectModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleSaveSubject} className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Student
                    </label>
                    {editingSubject ? (
                      <div className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-700 font-medium">
                        {editingSubject.studentName} ({editingSubject.studentRollNumber})
                      </div>
                    ) : (
                      <select
                        required
                        value={subjectFormData.userId}
                        onChange={(e) => setSubjectFormData({ ...subjectFormData, userId: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-700 focus:outline-none focus:border-[#10B981] transition-colors text-sm"
                      >
                        <option value="">Select Student...</option>
                        {students.map((s: any) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.rollNumber || "No Roll Number"})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Semester
                      </label>
                      <select
                        value={subjectFormData.semester}
                        onChange={(e) => setSubjectFormData({ ...subjectFormData, semester: parseInt(e.target.value) })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-700 focus:outline-none focus:border-[#10B981] transition-colors text-sm"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                          <option key={s} value={s}>Semester {s}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Credits
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="12"
                        required
                        value={subjectFormData.credits}
                        onChange={(e) => setSubjectFormData({ ...subjectFormData, credits: parseInt(e.target.value) || 0 })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-700 focus:outline-none focus:border-[#10B981] transition-colors text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Subject Code
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. CS201"
                        value={subjectFormData.subjectCode}
                        onChange={(e) => setSubjectFormData({ ...subjectFormData, subjectCode: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-700 focus:outline-none focus:border-[#10B981] transition-colors text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Subject Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Data Structures"
                        value={subjectFormData.subjectName}
                        onChange={(e) => setSubjectFormData({ ...subjectFormData, subjectName: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-700 focus:outline-none focus:border-[#10B981] transition-colors text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Internal Marks
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        required
                        placeholder="Max 30 usually"
                        value={subjectFormData.internalMarks}
                        onChange={(e) => setSubjectFormData({ ...subjectFormData, internalMarks: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-700 focus:outline-none focus:border-[#10B981] transition-colors text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        External Marks
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        required
                        placeholder="Max 70 usually"
                        value={subjectFormData.externalMarks}
                        onChange={(e) => setSubjectFormData({ ...subjectFormData, externalMarks: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-700 focus:outline-none focus:border-[#10B981] transition-colors text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Grade Override (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder={`Auto: ${formGrade}`}
                        value={subjectFormData.grade}
                        onChange={(e) => setSubjectFormData({ ...subjectFormData, grade: e.target.value.toUpperCase() })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-700 focus:outline-none focus:border-[#10B981] transition-colors text-sm font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Status Override (Optional)
                      </label>
                      <select
                        value={subjectFormData.status}
                        onChange={(e) => setSubjectFormData({ ...subjectFormData, status: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-700 focus:outline-none focus:border-[#10B981] transition-colors text-sm font-semibold"
                      >
                        <option value="">Auto: {formStatus}</option>
                        <option value="PASS">PASS</option>
                        <option value="FAIL">FAIL</option>
                      </select>
                    </div>
                  </div>

                  {/* Calculations Preview Alert */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between text-sm">
                    <div>
                      <span className="text-slate-500 font-medium">Auto Calculations: </span>
                      <span className="text-slate-800 font-bold">{formTotalMarks}/100 total</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="bg-[#10B981]/15 text-[#10B981] px-2.5 py-0.5 rounded-full font-bold text-xs">
                        Grade: {formGrade}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${
                        formStatus === "PASS" ? "bg-green-500/15 text-green-600" : "bg-red-500/15 text-red-600"
                      }`}>
                        {formStatus}
                      </span>
                    </div>
                  </div>

                  {/* Submit buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsSubjectModalOpen(false)}
                      className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-[#10B981] to-[#059669] text-white font-bold rounded-xl text-sm shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all"
                    >
                      Save Result
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL: SGPA/CGPA Overrides */}
        <AnimatePresence>
          {isOverrideModalOpen && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl border border-slate-300 w-full max-w-sm overflow-hidden shadow-2xl"
              >
                <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-bold text-lg text-slate-800">
                    Set SGPA/CGPA Overrides
                  </h3>
                  <button onClick={() => setIsOverrideModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleSaveOverrides} className="p-6 space-y-4">
                  <div className="text-sm space-y-1">
                    <div className="text-slate-400">Student:</div>
                    <div className="font-bold text-slate-800">{overrideFormData.studentName}</div>
                    <div className="text-slate-500 font-medium">Semester {overrideFormData.semester}</div>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        SGPA Override
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 9.15 (Leave blank to use auto)"
                        value={overrideFormData.sgpa}
                        onChange={(e) => setOverrideFormData({ ...overrideFormData, sgpa: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-700 focus:outline-none focus:border-[#10B981] transition-colors text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        CGPA Override
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 9.08 (Leave blank to use auto)"
                        value={overrideFormData.cgpa}
                        onChange={(e) => setOverrideFormData({ ...overrideFormData, cgpa: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-700 focus:outline-none focus:border-[#10B981] transition-colors text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsOverrideModalOpen(false)}
                      className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-[#10B981] to-[#059669] text-white font-bold rounded-xl text-sm shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all"
                    >
                      Save GPAs
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

  // --- STUDENT RENDER ---
  // Let's compute projected SGPA and CGPA for the active courses calculator
  const currentCredits = activeCourses.reduce((sum: number, c: any) => sum + (c.credits || 3), 0);
  

  const projectedSgpa = (() => {
    if (currentCredits === 0) return "0.00";
    const totalPoints = activeCourses.reduce((sum: number, c: any) => {
      const grade = plannerGrades[c.id] || "A";
      return sum + getGradePoints(grade) * (c.credits || 3);
    }, 0);
    return (totalPoints / currentCredits).toFixed(2);
  })();

  const projectedCgpa = (() => {
    if (!hasUserModified) {
      return officialCgpa.toFixed(2);
    }
    const totalCreditsCombined = publishedCredits + currentCredits;
    if (totalCreditsCombined === 0) return "0.00";
    const projectedSgpaNum = parseFloat(projectedSgpa);
    const totalPointsCombined = (officialCgpa * publishedCredits) + (projectedSgpaNum * currentCredits);
    return (totalPointsCombined / totalCreditsCombined).toFixed(2);
  })();

  const isPlanningSelected = selectedSemester === planningSem;

  const selectedSemesterResults = isPlanningSelected
    ? activeCourses.map((c: any) => ({
        id: c.id,
        subjectCode: c.subjectCode || "N/A",
        courseName: c.title,
        internalMarks: "-",
        externalMarks: "-",
        marks: 0,
        credits: c.credits || 3,
        grade: plannerGrades[c.id] || "A",
        status: (plannerGrades[c.id] || "A") !== "F" ? "PASS" : "FAIL",
      }))
    : studentResults.filter((r: any) => r.semester === selectedSemester);

  const selectedSummary = isPlanningSelected
    ? {
        sgpa: projectedSgpa,
        cgpa: projectedCgpa,
        totalCredits: currentCredits,
        passedCount: activeCourses.filter((c: any) => (plannerGrades[c.id] || "A") !== "F").length,
        status: "ESTIMATED",
      }
    : (selectedSemester ? studentSummaries[selectedSemester] : null);

  return (
    <div className="max-w-5xl mx-auto pb-12 relative z-10">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2 flex items-center gap-3">
          <Award className="text-[#10B981]" size={32} /> Exam Results
        </h1>
        <p className="text-slate-500">
          View your academic performance and gradesheet.
        </p>
      </motion.div>

      <div className="space-y-6">
        {publishedSemesters.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-8 rounded-3xl border border-slate-200 text-center max-w-2xl mx-auto shadow-sm flex flex-col items-center"
          >
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-4 shadow-inner">
              <Award size={24} className="text-slate-300" />
            </div>
            <h2 className="text-xl font-black text-slate-800 mb-1">Results Not Published Yet</h2>
            <p className="text-slate-500 text-sm leading-relaxed max-w-md">
              No results have been declared for your semesters yet. Once the administration publishes your marks, they will appear here. You can still plan your academic goals for the current semester using the calculator widget below.
            </p>
          </motion.div>
        ) : (
          <>
            <div className="flex gap-2.5 overflow-x-auto pb-3 scrollbar-thin select-none">
              {tabsList.map((sem) => (
                <button
                  key={sem}
                  onClick={() => setSelectedSemester(sem)}
                  className={`relative px-6 py-3 rounded-full font-extrabold transition-all whitespace-nowrap text-sm ${
                    selectedSemester === sem
                      ? "bg-[#10B981] text-white shadow-[0_4px_15px_rgba(16,185,129,0.35)] scale-[1.03]"
                      : "bg-white text-slate-600 border border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  Semester {sem}
                </button>
              ))}
            </div>

            {selectedSemester && selectedSummary && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedSemester}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  {isPlanningSelected ? (
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center max-w-2xl mx-auto shadow-sm flex flex-col items-center">
                      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-4 shadow-inner">
                        <Award size={24} className="text-slate-400" />
                      </div>
                      <h2 className="text-xl font-black text-slate-800 mb-1">Results Not Published Yet</h2>
                      <p className="text-slate-500 text-sm leading-relaxed max-w-md">
                        Grades for Semester {selectedSemester} have not been officially published. You can use the Goal Planner widget below to estimate your performance and project your GPA.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Semester Summary Cards */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                          <span className="text-xs text-slate-500 font-extrabold uppercase tracking-wider">SGPA</span>
                          <span className="text-3xl font-black text-slate-900 mt-2">{selectedSummary.sgpa}</span>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                          <span className="text-xs text-slate-500 font-extrabold uppercase tracking-wider">CGPA</span>
                          <span className="text-3xl font-black text-slate-900 mt-2">{selectedSummary.cgpa}</span>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                          <span className="text-xs text-slate-500 font-extrabold uppercase tracking-wider">Total Credits</span>
                          <span className="text-3xl font-black text-slate-900 mt-2">{selectedSummary.totalCredits}</span>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                          <span className="text-xs text-slate-500 font-extrabold uppercase tracking-wider">Passed</span>
                          <span className="text-3xl font-black text-green-600 mt-2">{selectedSummary.passedCount}</span>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow col-span-2 md:col-span-1">
                          <span className="text-xs text-slate-500 font-extrabold uppercase tracking-wider">Status</span>
                          <span className={`text-sm font-bold mt-2.5 px-3 py-1 rounded-full text-center border ${
                            selectedSummary.status === "PASS"
                              ? "bg-green-50 text-green-600 border-green-200"
                              : selectedSummary.status === "ESTIMATED"
                              ? "bg-blue-50 text-blue-600 border-blue-200"
                              : "bg-red-50 text-red-600 border-red-200"
                          }`}>
                            {selectedSummary.status}
                          </span>
                        </div>
                      </div>

                      {/* Subject Details Table */}
                      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center gap-2.5">
                          <GraduationCap className="text-[#10B981]" size={22} />
                          <h3 className="font-bold text-slate-800">Semester {selectedSemester} - Grade Sheet</h3>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse min-w-[700px]">
                            <thead>
                              <tr className="bg-slate-50 text-slate-800 font-extrabold text-xs uppercase tracking-wider border-b border-slate-300">
                                <th className="p-4 pl-6 text-center w-16">S.No</th>
                                <th className="p-4">Course Code</th>
                                <th className="p-4">Course Name</th>
                                <th className="p-4 text-center font-bold">Grade</th>
                                <th className="p-4 text-center">Grade Points</th>
                                <th className="p-4 text-center">Credits</th>
                                <th className="p-4 pr-6 text-center">Result</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                              {selectedSemesterResults.map((sub: any, index: number) => (
                                <tr key={sub.id || index} className="hover:bg-slate-50 transition-colors">
                                  <td className="p-4 pl-6 text-center font-bold text-slate-400">{index + 1}</td>
                                  <td className="p-4 font-mono text-xs font-bold text-[#10B981]">{sub.subjectCode}</td>
                                  <td className="p-4 font-bold text-slate-800">
                                    <div>{sub.courseName}</div>
                                    {sub.passType === "SUPPLEMENTARY" && (
                                      <div className="text-[11px] text-amber-600 font-extrabold mt-1 flex items-center gap-1 bg-amber-50 border border-amber-200/55 rounded-full px-2 py-0.5 w-max">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block animate-pulse"></span>
                                        Cleared via Supplementary in Sem {sub.clearedSemester} (Attempt {sub.attemptNumber})
                                      </div>
                                    )}
                                  </td>
                                  <td className="p-4 text-center">
                                    <span className={`font-black ${["A+", "A", "B+", "B", "O"].includes(sub.grade) ? "text-[#10B981]" : sub.grade === "F" ? "text-red-500" : "text-slate-700"}`}>
                                      {sub.grade}
                                    </span>
                                  </td>
                                  <td className="p-4 text-center font-bold text-slate-800">{getGradePoints(sub.grade)}</td>
                                  <td className="p-4 text-center font-semibold">{sub.credits ? parseFloat(sub.credits).toFixed(1) : "3.0"}</td>
                                  <td className="p-4 pr-6 text-center">
                                    <span className={`font-bold ${
                                      sub.status === "PASS"
                                        ? "text-[#10B981]"
                                        : sub.status === "-"
                                        ? "text-slate-400"
                                        : "text-red-500"
                                    }`}>
                                      {sub.status === "PASS" ? "P" : sub.status === "FAIL" ? "F" : "-"}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </>
        )}

        {/* GPA Goal Planner Widget */}
        {isPlanningSelected && (
          <div className="bg-white rounded-3xl border border-slate-300 p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <Sliders className="text-[#10B981]" size={22} />
            <div>
              <h3 className="font-bold text-slate-800">CGPA & SGPA Goal Planner (Semester {planningSem})</h3>
              <p className="text-xs text-slate-400">Estimate grades for Semester {planningSem} courses to project your SGPA and overall CGPA.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Active Courses Selector */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-700">Select Target Grades:</h4>
              {activeCourses.length === 0 ? (
                <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center">
                  <p className="text-sm text-slate-500 font-bold">No courses found for Semester {planningSem}.</p>
                  <p className="text-xs text-slate-400 mt-1">Enroll in courses or contact administration to populate courses for Semester {planningSem}.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeCourses.map((c: any) => (
                    <div key={c.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                      <div>
                        <div className="font-bold text-sm text-slate-700">{c.title}</div>
                        <div className="text-xs text-slate-400 font-medium">{c.credits} Credits</div>
                      </div>
                      <select
                        value={plannerGrades[c.id] || "A"}
                        onChange={(e) => {
                          setPlannerGrades({ ...plannerGrades, [c.id]: e.target.value });
                          setHasUserModified(true);
                        }}
                        className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-sm font-bold text-slate-700 focus:outline-none focus:border-[#10B981]"
                      >
                        <option value="A+">A+ (10)</option>
                        <option value="A">A (9)</option>
                        <option value="B+">B+ (8)</option>
                        <option value="B">B (7)</option>
                        <option value="C">C (6)</option>
                        <option value="D">D (5)</option>
                        <option value="F">F (0)</option>
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Estimated Outputs */}
            <div className="space-y-6 lg:mt-9">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                  <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Official CGPA</span>
                  <span className="text-3xl font-black text-slate-900 mt-2">{officialCgpa.toFixed(2)}</span>
                </div>
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                  <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Estimated SGPA</span>
                  <span className="text-3xl font-black text-slate-900 mt-2">{projectedSgpa}</span>
                </div>
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                  <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Estimated CGPA</span>
                  <span className="text-3xl font-black text-slate-900 mt-2">{projectedCgpa}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
