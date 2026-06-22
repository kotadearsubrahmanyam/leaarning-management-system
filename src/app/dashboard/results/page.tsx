"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Globe,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Users,
  Percent,
  Activity,
  Layers,
  BarChart3
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";

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

const mapDeptName = (name: string) => {
  if (name.includes("Computer Science")) return "CSE";
  if (name.includes("Electronics & Communication")) return "ECE";
  if (name.includes("Electrical")) return "EEE";
  if (name.includes("Mechanical")) return "MECH";
  if (name.includes("Civil")) return "CIVIL";
  if (name.includes("Business")) return "BBA";
  return name.substring(0, 5).toUpperCase();
};

const isRecentlyUpdated = (dateString: string | Date | null): boolean => {
  if (!dateString) return false;
  const diffMs = new Date().getTime() - new Date(dateString).getTime();
  return diffMs > 0 && diffMs < 24 * 60 * 60 * 1000; // 24 hours
};

const getTimeAgo = (dateString: string | Date | null): string => {
  if (!dateString) return "N/A";
  const seconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const avatarColorClass = (type: string): string => {
  switch (type) {
    case "eval":
      return "bg-purple-50 text-purple-600 border-purple-200";
    case "result":
      return "bg-blue-50 text-blue-600 border-blue-200";
    case "count":
      return "bg-amber-50 text-amber-655 border-amber-200";
    case "publish":
      return "bg-emerald-50 text-emerald-600 border-emerald-200";
    default:
      return "bg-slate-50 text-slate-600 border-slate-200";
  }
};

const getInitials = (name: string): string => {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].substring(0, 2).toUpperCase();
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
  const [adminTab, setAdminTab] = useState<"subjects" | "policy" | "evaluations" | "faculty">("subjects");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSemester, setFilterSemester] = useState<string>("ALL");
  const [filterFaculty, setFilterFaculty] = useState<string>("ALL");
  const [filterDept, setFilterDept] = useState<string>("ALL");
  const [showAllSemesters, setShowAllSemesters] = useState(false);
  const [isPublishingAll, setIsPublishingAll] = useState(false);

  // New Department & Semester selectors for Publishing
  const [selectedPublishDeptId, setSelectedPublishDeptId] = useState<string>("");
  const [selectedPublishSemester, setSelectedPublishSemester] = useState<number>(1);
  const [isPublishingBatch, setIsPublishingBatch] = useState(false);

  // Redesigned Hierarchy View States
   const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [expandedSemester, setExpandedSemester] = useState<number | null>(null);
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterPublish, setFilterPublish] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isBulkPublishModalOpen, setIsBulkPublishModalOpen] = useState(false);
  const [bulkPublishOption, setBulkPublishOption] = useState<"semester" | "department" | "selected" | "verified">("semester");

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

  // Fetch evaluations for admin stats
  const { data: evaluationsRes } = useQuery({
    queryKey: ["adminEvaluations"],
    queryFn: async () => {
      const res = await fetch("/api/admin/evaluations");
      if (!res.ok) throw new Error("Failed to fetch evaluations");
      return res.json();
    },
    enabled: role === "ADMIN",
  });
  const allEvaluations = evaluationsRes?.data || [];

  // Fetch departments for admin batch selector
  const { data: deptsData } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await fetch("/api/departments");
      if (!res.ok) throw new Error("Failed to fetch departments");
      return res.json();
    },
    enabled: role === "ADMIN",
  });
  const departments = deptsData?.data?.departments || [];

  // Initialize selectedPublishDeptId once departments are loaded
  useEffect(() => {
    if (departments.length > 0 && !selectedPublishDeptId) {
      setSelectedPublishDeptId(departments[0].id);
    }
  }, [departments, selectedPublishDeptId]);

  // Reset semester filter if showAllSemesters is toggled off and active semester is out of range
  useEffect(() => {
    if (!showAllSemesters && !["ALL", "3", "4", "5"].includes(filterSemester)) {
      setFilterSemester("ALL");
    }
  }, [showAllSemesters, filterSemester]);

  // Batch selections & calculations
  const batchStudents = useMemo(() => {
    return students.filter((s: any) => s.departmentId === selectedPublishDeptId && s.semester === selectedPublishSemester);
  }, [students, selectedPublishDeptId, selectedPublishSemester]);

  const batchStats = useMemo(() => {
    let total = batchStudents.length;
    let withMarks = 0;
    let passed = 0;
    let failed = 0;

    batchStudents.forEach((student: any) => {
      const studentResults = adminResults.filter(
        (r: any) => r.userId === student.id && r.semester === selectedPublishSemester
      );
      if (studentResults.length > 0) {
        withMarks++;
        const hasFail = studentResults.some((r: any) => r.status === "FAIL");
        if (hasFail) {
          failed++;
        } else {
          passed++;
        }
      }
    });

    const passRate = withMarks > 0 ? Math.round((passed / withMarks) * 100) : 0;

    return { total, withMarks, passed, failed, passRate };
  }, [batchStudents, adminResults, selectedPublishSemester]);

  const filteredBatchStudents = useMemo(() => {
    return batchStudents.filter((student: any) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.rollNumber || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [batchStudents, searchTerm]);

  const studentBatchDetails = useMemo(() => {
    return filteredBatchStudents.map((student: any) => {
      const studentResults = adminResults.filter(
        (r: any) => r.userId === student.id && r.semester === selectedPublishSemester
      );
      const subjectCount = studentResults.length;
      
      let calculatedSgpa = "0.00";
      const totalCredits = studentResults.reduce((sum: number, r: any) => sum + (r.credits || 0), 0);
      if (totalCredits > 0) {
        const totalPoints = studentResults.reduce((sum: number, r: any) => sum + (getGradePoints(r.grade) * (r.credits || 0)), 0);
        calculatedSgpa = (totalPoints / totalCredits).toFixed(2);
      }

      const summary = dbSummaries.find((s: any) => s.userId === student.id && s.semester === selectedPublishSemester);
      const isPublished = summary ? summary.published : false;

      const hasFail = studentResults.some((r: any) => r.status === "FAIL");
      const status = subjectCount === 0 ? "NO MARKS" : hasFail ? "FAIL" : "PASS";

      return {
        ...student,
        subjectCount,
        calculatedSgpa,
        isPublished,
        status,
        summary
      };
    });
  }, [filteredBatchStudents, adminResults, selectedPublishSemester, dbSummaries]);

  const handlePublishBatch = async () => {
    const drafts = batchStudents.filter((student: any) => {
      const summary = dbSummaries.find((s: any) => s.userId === student.id && s.semester === selectedPublishSemester);
      return !summary || !summary.published;
    });

    if (drafts.length === 0) {
      alert("All student results in this batch are already published.");
      return;
    }

    const deptName = departments.find((d: any) => d.id === selectedPublishDeptId)?.name || "Department";
    if (!confirm(`Are you sure you want to publish results for all ${drafts.length} draft student records in ${deptName} Semester ${selectedPublishSemester}?`)) return;

    setIsPublishingBatch(true);
    try {
      await Promise.all(
        drafts.map((student: any) =>
          fetch("/api/admin/results/publish", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: student.id, semester: selectedPublishSemester, publish: true }),
          })
        )
      );
      queryClient.invalidateQueries({ queryKey: ["results"] });
      queryClient.invalidateQueries({ queryKey: ["adminSummaries"] });
      alert(`Successfully published batch results for ${drafts.length} students!`);
    } catch (error) {
      console.error("Batch publish error:", error);
      alert("Failed to publish batch results.");
    } finally {
      setIsPublishingBatch(false);
    }
  };

  // Student Results details
  const studentResults = data?.data?.results || [];
  const studentSummaries = data?.data?.summaries || {};
  const publishedSemesters: number[] = data?.data?.publishedSemesters || [];

  // Determine current semester and planning target semester
  const currentStudentSemester = authData?.data?.user?.semester;
  const planningSem = (currentStudentSemester && publishedSemesters.includes(currentStudentSemester))
    ? currentStudentSemester + 1
    : (currentStudentSemester || 1);

  const maxSem = Math.max(planningSem || 1, currentStudentSemester || 1, ...(publishedSemesters || []));
  const tabsList = Array.from({ length: maxSem }, (_, i) => i + 1);

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
    // KPI Summaries
    const totalEvaluatedScripts = allEvaluations.filter((e: any) => e.status === "EVALUATED").length;
    const pendingEvaluations = allEvaluations.filter((e: any) => e.status === "PENDING").length;
    const totalPublished = adminResults.filter((r: any) => r.published).length;
    const recentlyUpdatedResults = adminResults.filter((r: any) => isRecentlyUpdated(r.createdAt)).length;
    const avgDeptPerformance = adminResults.length > 0
      ? (adminResults.reduce((sum: number, r: any) => sum + r.marks, 0) / adminResults.length).toFixed(1)
      : "0";

    const activeEvaluatorsCount = new Set(allEvaluations.map((ev: any) => ev.faculty?.name).filter(Boolean)).size;
    const scriptsEvaluatedToday = allEvaluations.filter((ev: any) => ev.status === "EVALUATED" && new Date(ev.updatedAt || ev.createdAt).toDateString() === new Date().toDateString()).length;
    const totalResultsGenerated = adminResults.length;

    const activeSemestersList = showAllSemesters ? [1, 2, 3, 4, 5, 6, 7, 8] : [3, 4, 5];

    const recentEvaluations = allEvaluations
      .filter((e: any) => e.status === "EVALUATED")
      .sort((a: any, b: any) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
      .slice(0, 6);

    // Dynamic Recent Evaluation Activities
    const recentActivities = (() => {
      const activities: { 
        id: string; 
        text: string; 
        time: Date; 
        type: string; 
        faculty?: string; 
        subjectName?: string; 
        department?: string; 
        semester?: number;
      }[] = [];
      
      // Evaluated scripts
      allEvaluations
        .filter((e: any) => e.status === "EVALUATED")
        .forEach((e: any) => {
          const deptName = departments.find((d: any) => d.id === e.course?.categoryId)?.name || "CSE";
          activities.push({
            id: `eval-${e.id}`,
            text: `${e.faculty?.name || "Faculty"} completed ${e.course?.title || "evaluation"}`,
            time: new Date(e.updatedAt || e.createdAt),
            type: "eval",
            faculty: e.faculty?.name || "Faculty",
            subjectName: e.course?.title || "Subject",
            department: mapDeptName(deptName),
            semester: e.course?.semester || 3,
          });
        });

      // Automatically generated results
      allEvaluations
        .filter((e: any) => e.status === "EVALUATED")
        .forEach((e: any) => {
          const deptName = departments.find((d: any) => d.id === e.course?.categoryId)?.name || "CSE";
          activities.push({
            id: `res-gen-${e.id}`,
            text: `${e.course?.title || "Subject"} results generated automatically`,
            time: new Date(e.updatedAt || e.createdAt),
            type: "result",
            faculty: "System Engine",
            subjectName: e.course?.title || "Subject",
            department: mapDeptName(deptName),
            semester: e.course?.semester || 3,
          });
        });

      // Evaluated script counts per semester
      const semCounts: Record<number, number> = {};
      allEvaluations.filter((e: any) => e.status === "EVALUATED").forEach((e: any) => {
        const sem = e.course?.semester;
        if (sem) semCounts[sem] = (semCounts[sem] || 0) + 1;
      });
      Object.entries(semCounts).forEach(([sem, count]) => {
        activities.push({
          id: `sem-count-${sem}`,
          text: `${count} scripts evaluated in Semester ${sem}`,
          time: new Date(Date.now() - 10 * 60 * 1050),
          type: "count",
          faculty: "Controller of Exams",
          subjectName: `Semester ${sem} Exams`,
          department: "Central Office",
          semester: parseInt(sem),
        });
      });

      // Published results
      dbSummaries
        .filter((s: any) => s.published)
        .forEach((s: any) => {
          activities.push({
            id: `pub-${s.id}`,
            text: `Admin verified and published Semester ${s.semester} results`,
            time: new Date(s.updatedAt || s.createdAt),
            type: "publish",
            faculty: "Super Admin",
            subjectName: `Semester ${s.semester} Results`,
            department: "Central Office",
            semester: s.semester,
          });
        });

      return activities
        .sort((a, b) => b.time.getTime() - a.time.getTime())
        .slice(0, 8);
    })();
    // Faculty Tracker Data Aggregation
    const facultyTrackerData = (() => {
      const groups: Record<string, {
        facultyName: string;
        subject: string;
        department: string;
        semester: number;
        assigned: number;
        evaluated: number;
        pending: number;
      }> = {};

      allEvaluations.forEach((ev: any) => {
        const key = `${ev.facultyId}-${ev.courseId}`;
        if (!groups[key]) {
          const deptName = departments.find((d: any) => d.id === ev.course?.categoryId)?.name || "N/A";
          groups[key] = {
            facultyName: ev.faculty?.name || "N/A",
            subject: ev.course?.title || "N/A",
            department: mapDeptName(deptName),
            semester: ev.course?.semester || 0,
            assigned: 0,
            evaluated: 0,
            pending: 0,
          };
        }
        groups[key].assigned++;
        if (ev.status === "EVALUATED") {
          groups[key].evaluated++;
        } else {
          groups[key].pending++;
        }
      });

      return Object.values(groups).map(g => {
        const completionRate = g.assigned > 0 ? Math.round((g.evaluated / g.assigned) * 100) : 0;
        return {
          ...g,
          completionRate,
        };
      });
    })();

    // Compute Recharts Chart Data
    // A. Department-wise Pass Percentage
    const deptPassData = departments.map((dept: any) => {
      const deptStudents = students.filter((s: any) => s.departmentId === dept.id);
      const deptResults = adminResults.filter((r: any) => deptStudents.some((s: any) => s.id === r.userId));
      const totalRes = deptResults.length;
      const passRes = deptResults.filter((r: any) => r.status === "PASS").length;
      const passRate = totalRes > 0 ? Math.round((passRes / totalRes) * 100) : 0;
      return {
        name: mapDeptName(dept.name),
        "Pass Rate": passRate,
      };
    });

    // B. Semester-wise Performance (Average Marks)
    const semPerfData = activeSemestersList.map((sem: number) => {
      const semResults = adminResults.filter((r: any) => r.semester === sem);
      const avgMarks = semResults.length > 0
        ? parseFloat((semResults.reduce((sum: number, r: any) => sum + r.marks, 0) / semResults.length).toFixed(1))
        : 0;
      return {
        name: `Sem ${sem}`,
        "Average Marks": avgMarks,
      };
    });

    // C. Student Success Rate (Pass/Fail)
    const passCount = adminResults.filter((r: any) => r.status === "PASS").length;
    const failCount = adminResults.filter((r: any) => r.status === "FAIL").length;
    const successData = [
      { name: "Pass Grades", value: passCount || 1 },
      { name: "Fail Grades", value: failCount },
    ];
    const COLORS = ["#10B981", "#EF4444"];

    // Compute Department Grid Statistics
    const departmentStats = departments.map((dept: any) => {
      const deptStudents = students.filter((s: any) => s.departmentId === dept.id);
      const deptStudentIds = deptStudents.map((s: any) => s.id);
      const deptResults = adminResults.filter((r: any) => deptStudents.some((s: any) => s.id === r.userId));
      const totalRes = deptResults.length;
      const passRes = deptResults.filter((r: any) => r.status === "PASS").length;
      const passRate = totalRes > 0 ? Math.round((passRes / totalRes) * 100) : 0;
      const failRate = 100 - passRate;

      const activeSemResults = deptResults.filter((r: any) => activeSemestersList.includes(r.semester)).length;
      const deptFailCount = deptResults.filter((r: any) => r.status === "FAIL").length;
      const publishedCount = deptResults.filter((r: any) => r.published).length;
      const publishedStudentsCount = new Set(dbSummaries.filter((s: any) => deptStudentIds.includes(s.userId) && s.published).map((s: any) => s.userId)).size;
      const pendingEvaluations = allEvaluations.filter((e: any) => e.status === "PENDING" && e.course?.categoryId === dept.id).length;

      const deptSummaries = dbSummaries.filter((s: any) => deptStudentIds.includes(s.userId));
      const deptSgpas = deptSummaries.map((s: any) => parseFloat(s.sgpa || "0")).filter((g: number) => g > 0);
      const avgSgpa = deptSgpas.length > 0 ? (deptSgpas.reduce((sum: number, g: number) => sum + g, 0) / deptSgpas.length).toFixed(1) : "0.0";

      const marksList = deptResults.map((r: any) => r.marks || 0);
      const avgMarks = marksList.length > 0 ? Math.round(marksList.reduce((sum: number, m: number) => sum + m, 0) / marksList.length) : 0;

      const hasAnyPublished = publishedStudentsCount > 0 ? "Yes" : "No";

      // Calculate latest published date
      const publishedSummaries = deptSummaries.filter((s: any) => s.published);
      const publishedDates = publishedSummaries
        .map((s: any) => new Date(s.updatedAt || s.createdAt))
        .filter((d: Date) => !isNaN(d.getTime()));
      const latestPublishedDate = publishedDates.length > 0
        ? new Date(Math.max(...publishedDates.map((d: Date) => d.getTime()))).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
        : "N/A";

      let emoji = "🎓";
      const nameUpper = dept.name.toUpperCase();
      if (nameUpper.includes("COMPUTER")) emoji = "📘";
      else if (nameUpper.includes("ELECTRONICS")) emoji = "📗";
      else if (nameUpper.includes("ELECTRICAL")) emoji = "📙";
      else if (nameUpper.includes("MECHANICAL")) emoji = "📕";
      else if (nameUpper.includes("CIVIL")) emoji = "📔";

      return {
        ...dept,
        totalStudents: deptStudents.length,
        activeSemResults,
        passCount: passRes,
        failCount: deptFailCount,
        passRate,
        failRate,
        avgSgpa,
        avgMarks,
        hasAnyPublished,
        publishedCount,
        publishedStudentsCount,
        pendingEvaluations,
        emoji,
        latestPublishedDate,
      };
    });

    const selectedDept = departments.find((d: any) => d.id === selectedDeptId);

    // Compute Semester Stats for selected department
    const semesterStats = selectedDeptId
      ? activeSemestersList.map((sem: number) => {
          const semStudents = students.filter((s: any) => s.departmentId === selectedDeptId && s.semester === sem);
          const semStudentIds = semStudents.map((s: any) => s.id);
          const semResults = adminResults.filter((r: any) => semStudentIds.includes(r.userId) && r.semester === sem);

          let passedStudentsCount = 0;
          let failedStudentsCount = 0;

          semStudents.forEach((student: any) => {
            const studentResults = semResults.filter((r: any) => r.userId === student.id);
            if (studentResults.length > 0) {
              const hasFail = studentResults.some((r: any) => r.status === "FAIL");
              if (hasFail) failedStudentsCount++;
              else passedStudentsCount++;
            }
          });

          const marksList = semResults.map((r: any) => r.marks || 0);
          const avgMarks = marksList.length > 0
            ? Math.round(marksList.reduce((sum: number, m: number) => sum + m, 0) / marksList.length)
            : 0;
          const highestMarks = marksList.length > 0 ? Math.max(...marksList) : 0;
          const lowestMarks = marksList.length > 0 ? Math.min(...marksList) : 0;

          const semSummaries = dbSummaries.filter((s: any) => semStudentIds.includes(s.userId) && s.semester === sem);
          const semSgpas = semSummaries.map((s: any) => parseFloat(s.sgpa || "0")).filter((g: number) => g > 0);
          const avgSgpa = semSgpas.length > 0 ? (semSgpas.reduce((sum: number, g: number) => sum + g, 0) / semSgpas.length).toFixed(1) : "0.0";

          let topPerformerName = "N/A";
          let topGpa = 0;

          semSummaries.forEach((sum: any) => {
            const sgpaNum = parseFloat(sum.sgpa || "0");
            if (sgpaNum > topGpa) {
              topGpa = sgpaNum;
              const stu = semStudents.find((s: any) => s.id === sum.userId);
              if (stu) topPerformerName = stu.name;
            }
          });

          const publishedCount = semSummaries.filter((s: any) => s.published).length;

          return {
            semester: sem,
            totalStudents: semStudents.length,
            passed: passedStudentsCount,
            failed: failedStudentsCount,
            avgMarks,
            avgSgpa,
            highestMarks,
            lowestMarks,
            topPerformer: topPerformerName,
            topGpa: topGpa > 0 ? topGpa.toFixed(2) : "N/A",
            publishedCount,
          };
        })
      : [];

    const displayedDepartments = filterDept === "ALL" 
      ? departmentStats 
      : departmentStats.filter((d: any) => d.id === filterDept);

    const displayedSemesters = filterSemester === "ALL"
      ? semesterStats
      : semesterStats.filter((s: any) => String(s.semester) === filterSemester);

    const hasActiveSearchOrFilter =
      searchTerm.trim() !== "" ||
      filterSemester !== "ALL" ||
      filterStatus !== "ALL" ||
      filterPublish !== "ALL";

    // Matching results list for search results view
    const filteredSearchResults = adminResults.filter((r: any) => {
      const student = students.find((s: any) => s.id === r.userId);
      if (!student) return false;

      const matchesText =
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.rollNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.subjectCode || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.subjectName || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSemester = filterSemester === "ALL" || String(r.semester) === filterSemester;
      const matchesStatus = filterStatus === "ALL" || r.status === filterStatus;
      const matchesDept = filterDept === "ALL" || student.departmentId === filterDept;

      const matchingEval = allEvaluations.find((e: any) => e.studentId === r.userId && e.courseId === r.courseId);
      const matchesFaculty = filterFaculty === "ALL" || (matchingEval?.faculty?.name === filterFaculty);

      const matchesPublish = filterPublish === "ALL" ||
        (filterPublish === "PUBLISHED" ? r.published : !r.published);

      return matchesText && matchesSemester && matchesStatus && matchesDept && matchesFaculty && matchesPublish;
    });

    const filteredSearchGrouped = (() => {
      const groups: Record<string, {
        student: any;
        semester: number;
        results: any[];
        calculatedSgpa: string;
        isPublished: boolean;
        status: string;
      }> = {};

      filteredSearchResults.forEach((r: any) => {
        const student = students.find((s: any) => s.id === r.userId);
        if (!student) return;

        const key = `${r.userId}-${r.semester}`;
        if (!groups[key]) {
          const summary = dbSummaries.find((s: any) => s.userId === r.userId && s.semester === r.semester);
          groups[key] = {
            student,
            semester: r.semester,
            results: [],
            calculatedSgpa: "0.00",
            isPublished: summary ? summary.published : r.published,
            status: "PASS",
          };
        }
        groups[key].results.push(r);
      });

      Object.keys(groups).forEach(key => {
        const group = groups[key];
        const totalCredits = group.results.reduce((sum, r) => sum + (r.credits || 0), 0);
        if (totalCredits > 0) {
          const totalPoints = group.results.reduce((sum, r) => sum + (getGradePoints(r.grade) * (r.credits || 0)), 0);
          group.calculatedSgpa = (totalPoints / totalCredits).toFixed(2);
        }
        const hasFail = group.results.some(r => r.status === "FAIL");
        group.status = hasFail ? "FAIL" : "PASS";
      });

      return Object.values(groups);
    })();

    const draftCount = filteredSearchGrouped.filter((g: any) => !g.isPublished).length;

    const handlePublishAllFilteredDrafts = async () => {
      const drafts = filteredSearchGrouped.filter((g: any) => !g.isPublished);
      if (drafts.length === 0) {
        alert("No draft results found matching current filters.");
        return;
      }
      if (!confirm(`Are you sure you want to publish results for all ${drafts.length} draft records matching your search/filters?`)) return;

      setIsPublishingAll(true);
      try {
        await Promise.all(
          drafts.map((g: any) =>
            fetch("/api/admin/results/publish", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: g.student.id, semester: g.semester, publish: true }),
            })
          )
        );
        queryClient.invalidateQueries({ queryKey: ["results"] });
        queryClient.invalidateQueries({ queryKey: ["adminSummaries"] });
        alert(`Successfully published ${drafts.length} results!`);
      } catch (error) {
        console.error("Bulk publish drafts error:", error);
        alert("Failed to publish draft results.");
      } finally {
        setIsPublishingAll(false);
      }
    };

    const handleDeclareResults = async (deptId: string, semesterNum: number) => {
      const dept = departments.find((d: any) => d.id === deptId);
      const deptName = dept?.name || "Department";

      if (!confirm(`Are you sure you want to declare and publish results for all students in ${deptName} Semester ${semesterNum}? This will calculate final GPAs, apply grace marks if applicable, and make grades visible to students.`)) {
        return;
      }

      setIsPublishingBatch(true);
      try {
        const res = await fetch("/api/admin/declare-results", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ departmentId: deptId, semester: semesterNum }),
        });

        const resData = await res.json();
        if (!res.ok) {
          throw new Error(resData.message || "Failed to declare results");
        }

        queryClient.invalidateQueries({ queryKey: ["results"] });
        queryClient.invalidateQueries({ queryKey: ["adminSummaries"] });
        alert(`Successfully declared and published results for ${deptName} Semester ${semesterNum}!`);
      } catch (error: any) {
        console.error("Declare results error:", error);
        alert(error.message || "Failed to declare results.");
      } finally {
        setIsPublishingBatch(false);
      }
    };

    const handleBulkPublish = async () => {
      const dept = departments.find((d: any) => d.id === selectedDeptId);
      const deptName = dept?.name || "Department";

      if (!expandedSemester && bulkPublishOption !== "department") {
        alert("Please select a semester first.");
        return;
      }

      let confirmMsg = "";
      if (bulkPublishOption === "semester") {
        confirmMsg = `Publish results for Semester ${expandedSemester} - ${deptName}?`;
      } else if (bulkPublishOption === "department") {
        confirmMsg = `Publish all results across all semesters for ${deptName}?`;
      } else if (bulkPublishOption === "selected") {
        if (selectedStudentIds.length === 0) {
          alert("No students selected. Please check students in the list first.");
          return;
        }
        confirmMsg = `Publish results for the ${selectedStudentIds.length} selected students in Semester ${expandedSemester} - ${deptName}?`;
      } else if (bulkPublishOption === "verified") {
        confirmMsg = `Publish all verified (evaluated but draft) results in Semester ${expandedSemester} - ${deptName}?`;
      }

      if (!confirm(confirmMsg)) return;

      setIsPublishingBatch(true);
      try {
        if (bulkPublishOption === "semester") {
          const res = await fetch("/api/admin/declare-results", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ departmentId: selectedDeptId, semester: expandedSemester }),
          });
          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.message || "Failed to declare semester results");
          }
        } else if (bulkPublishOption === "department") {
          const activeSemesters = showAllSemesters ? [1, 2, 3, 4, 5, 6, 7, 8] : [3, 4, 5];
          await Promise.all(
            activeSemesters.map(async (sem) => {
              const res = await fetch("/api/admin/declare-results", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ departmentId: selectedDeptId, semester: sem }),
              });
              if (!res.ok) console.error(`Failed to declare results for sem ${sem}`);
            })
          );
        } else if (bulkPublishOption === "selected") {
          await Promise.all(
            selectedStudentIds.map(async (userId) => {
              await fetch("/api/admin/results/publish", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, semester: expandedSemester, publish: true }),
              });
            })
          );
          setSelectedStudentIds([]);
        } else if (bulkPublishOption === "verified") {
          const semStudents = students.filter((s: any) => s.departmentId === selectedDeptId && s.semester === expandedSemester);
          const drafts = semStudents.filter((student: any) => {
            const studentResults = adminResults.filter((r: any) => r.userId === student.id && r.semester === expandedSemester);
            if (studentResults.length === 0) return false;
            const summary = dbSummaries.find((sum: any) => sum.userId === student.id && sum.semester === expandedSemester);
            return !summary || !summary.published;
          });

          if (drafts.length === 0) {
            alert("No verified draft results found to publish.");
            setIsPublishingBatch(false);
            return;
          }

          await Promise.all(
            drafts.map(async (student: any) => {
              await fetch("/api/admin/results/publish", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: student.id, semester: expandedSemester, publish: true }),
              });
            })
          );
        }

        queryClient.invalidateQueries({ queryKey: ["results"] });
        queryClient.invalidateQueries({ queryKey: ["adminSummaries"] });
        alert("Bulk publishing completed successfully!");
        setIsBulkPublishModalOpen(false);
      } catch (error: any) {
        console.error("Bulk publish error:", error);
        alert(error.message || "Failed to complete bulk publishing.");
      } finally {
        setIsPublishingBatch(false);
      }
    };

    return (
      <div className="max-w-6xl mx-auto pb-12 relative z-10 text-slate-805">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2 flex items-center gap-3">
              <Award className="text-[#7C3AED]" size={32} /> Results & GPA Administration
            </h1>
            <p className="text-slate-500 font-medium">Configure course grades, audit semester GPAs, and manage institutional declaration policies.</p>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold rounded-xl shadow-md transition-all text-sm self-start md:self-auto hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus size={18} /> Add Subject Result
          </button>
        </motion.div>

        {/* Compact Summary Row showing modern statistic cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {/* Card 1: Active Evaluators */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex items-center justify-between hover:-translate-y-1 hover:shadow-md transition-all duration-300">
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Active Evaluators</span>
              <span className="text-2xl font-black text-slate-800 mt-1 block">{activeEvaluatorsCount}</span>
            </div>
            <div className="p-3 bg-violet-50 text-[#7C3AED] rounded-xl border border-purple-100">
              <Users size={22} />
            </div>
          </div>

          {/* Card 2: Scripts Evaluated Today */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex items-center justify-between hover:-translate-y-1 hover:shadow-md transition-all duration-300">
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Evaluated Today</span>
              <span className="text-2xl font-black text-emerald-600 mt-1 block">{scriptsEvaluatedToday}</span>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <CheckCircle size={22} />
            </div>
          </div>

          {/* Card 3: Pending Evaluations */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex items-center justify-between hover:-translate-y-1 hover:shadow-md transition-all duration-300">
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Pending Evaluations</span>
              <span className="text-2xl font-black text-amber-600 mt-1 block">{pendingEvaluations}</span>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
              <Activity size={22} />
            </div>
          </div>

          {/* Card 4: Results Generated */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex items-center justify-between hover:-translate-y-1 hover:shadow-md transition-all duration-300">
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Results Generated</span>
              <span className="text-2xl font-black text-blue-600 mt-1 block">{totalResultsGenerated}</span>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <Book size={22} />
            </div>
          </div>

          {/* Card 5: Results Published */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex items-center justify-between hover:-translate-y-1 hover:shadow-md transition-all duration-300">
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Results Published</span>
              <span className="text-2xl font-black text-indigo-600 mt-1 block">{totalPublished}</span>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <Award size={22} />
            </div>
          </div>
        </div>

        <div className="space-y-8 mt-8">
          {/* Main Content Column */}
          <div className="w-full space-y-8">
            {/* Charts & Analytics Drawer */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-[#E2E8F0] rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-0.5 lg:col-span-2 transition-all duration-300">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <BarChart3 size={18} className="text-[#7C3AED]" /> Department-wise Pass Percentage & Semester Averages
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-64">
                <p className="text-xs font-bold text-slate-400 text-center mb-2">Department Pass Rates (%)</p>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deptPassData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: "bold" }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="Pass Rate" fill="#7C3AED" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="h-64">
                <p className="text-xs font-bold text-slate-400 text-center mb-2">Semester Averages (Out of 100)</p>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={semPerfData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: "bold" }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="Average Marks" stroke="#3B82F6" strokeWidth={3} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-0.5 flex flex-col transition-all duration-300">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Activity size={18} className="text-[#7C3AED]" /> Academic Success Distribution
            </h3>
            <div className="h-48 flex-1 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={successData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {successData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-slate-800">
                  {passCount + failCount > 0 ? Math.round((passCount / (passCount + failCount)) * 100) : 0}%
                </span>
                <span className="text-[10px] text-slate-400 font-extrabold uppercase">Pass Rate</span>
              </div>
            </div>
            <div className="flex justify-center gap-6 text-xs font-bold pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#10B981] inline-block"></span>
                <span>Pass ({passCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#EF4444] inline-block"></span>
                <span>Fail ({failCount})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Selection Row for Administration Modes */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex bg-[#F1F5F9] p-1.5 rounded-2xl gap-2 overflow-x-auto w-full md:w-max border border-[#E2E8F0]">
            <button
              onClick={() => setAdminTab("subjects")}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 whitespace-nowrap ${
                adminTab === "subjects" ? "bg-white text-[#7C3AED] shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
              }`}
            >
              <Book size={18} /> Structured Results Hierarchy
            </button>
            <button
              onClick={() => setAdminTab("evaluations")}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 whitespace-nowrap ${
                adminTab === "evaluations" ? "bg-white text-[#7C3AED] shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
              }`}
            >
              <Activity size={18} /> Evaluation Monitoring
            </button>
            <button
              onClick={() => setAdminTab("faculty")}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 whitespace-nowrap ${
                adminTab === "faculty" ? "bg-white text-[#7C3AED] shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
              }`}
            >
              <Users size={18} /> Faculty Tracker
            </button>
            <button
              onClick={() => setAdminTab("policy")}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 whitespace-nowrap ${
                adminTab === "policy" ? "bg-white text-[#7C3AED] shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
              }`}
            >
              <Sliders size={18} /> Recalculation Policies
            </button>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer bg-white px-4 py-2 border border-[#E2E8F0] rounded-xl shadow-xs self-start md:self-auto select-none">
            <input
              type="checkbox"
              checked={showAllSemesters}
              onChange={(e) => setShowAllSemesters(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-[#7C3AED] focus:ring-[#7C3AED]"
            />
            <span className="text-xs font-bold text-slate-700">Include Inactive Semesters (1-8)</span>
          </label>
        </div>

        {/* Search & Filter Header Control */}
        <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-sm mb-6 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by student name, roll number, or subjects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent text-sm transition-all bg-slate-50/50"
              />
            </div>
            <div>
              <select
                value={filterSemester}
                onChange={(e) => setFilterSemester(e.target.value)}
                className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] text-sm h-[46px] transition-all"
              >
                <option value="ALL">All Semesters</option>
                {activeSemestersList.map(s => (
                  <option key={s} value={String(s)}>Semester {s}</option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] text-sm h-[46px] transition-all"
              >
                <option value="ALL">All Departments</option>
                {departments.map((d: any) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] text-sm h-[46px] transition-all"
              >
                <option value="ALL">All Statuses</option>
                <option value="PASS">PASS ONLY</option>
                <option value="FAIL">FAIL ONLY</option>
              </select>
            </div>
            <div>
              <select
                value={filterFaculty}
                onChange={(e) => setFilterFaculty(e.target.value)}
                className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] text-sm h-[46px] transition-all"
              >
                <option value="ALL">All Faculty</option>
                {Array.from(new Set(allEvaluations.map((ev: any) => ev.faculty?.name).filter(Boolean))).map((name: any) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap text-xs font-bold text-slate-500 border-t border-slate-100 pt-4">
            <span>Publish Status Filter:</span>
            <div className="flex gap-2.5">
              {["ALL", "PUBLISHED", "DRAFT"].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setFilterPublish(mode)}
                  className={`px-3 py-1.5 rounded-lg border transition-all ${
                    filterPublish === mode
                      ? "bg-[#7C3AED] text-white border-transparent shadow-sm"
                      : "bg-white border-[#E2E8F0] text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* MODE A: Structured Results Hierarchy */}
        {adminTab === "subjects" && (
          <div>
            {!selectedDeptId ? (
              // Step 1: Department Cards Grid
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-1">Select Department to Configure Results</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayedDepartments.map((dept: any) => (
                    <motion.div
                      key={dept.id}
                      whileHover={{ scale: 1.02, y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedDeptId(dept.id)}
                      className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm cursor-pointer hover:shadow-md transition-shadow relative overflow-hidden group flex flex-col justify-between min-h-[300px]"
                    >
                      <div className="absolute top-0 left-0 w-2 h-full bg-[#7C3AED]"></div>
                      
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <span className="text-3xl">{dept.emoji}</span>
                          <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${
                            dept.publishedStudentsCount > 0 ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100"
                          }`}>
                            Published: {dept.hasAnyPublished}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-slate-800 text-lg mb-4 group-hover:text-[#7C3AED] transition-colors">{dept.name}</h4>
                        
                        <div className="space-y-2 text-xs font-semibold text-slate-650">
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-bold">Total Students:</span>
                            <span className="text-slate-800 font-extrabold">{dept.totalStudents}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-bold">Total Published Results:</span>
                            <span className="text-slate-800 font-extrabold">{dept.publishedCount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-bold">Pass Percentage:</span>
                            <span className="text-emerald-600 font-extrabold">{dept.passRate}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-bold">Fail Percentage:</span>
                            <span className="text-rose-600 font-extrabold">{dept.failRate}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-bold">Average SGPA:</span>
                            <span className="text-slate-800 font-extrabold">{dept.avgSgpa}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-bold">Average Marks:</span>
                            <span className="text-slate-805 font-extrabold">{dept.avgMarks}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-bold">Published:</span>
                            <span className={`font-extrabold ${dept.hasAnyPublished === "Yes" ? "text-emerald-600" : "text-amber-600"}`}>{dept.hasAnyPublished}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-bold">Published Date:</span>
                            <span className="text-slate-800 font-extrabold">{dept.latestPublishedDate}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-slate-100 mt-6">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDeptId(dept.id);
                          }}
                          className="w-full py-2.5 bg-purple-50 text-[#7C3AED] hover:bg-purple-100 rounded-xl text-xs font-bold text-center border border-purple-150 transition-colors"
                        >
                          View Department
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : (
              // Step 2: Semesters Grid inside Selected Department
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setSelectedDeptId("");
                      setExpandedSemester(null);
                      setExpandedStudentId(null);
                    }}
                    className="p-2 border border-[#E2E8F0] hover:bg-slate-50 text-slate-500 rounded-xl transition-all"
                    title="Back to Departments"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div>
                    <span className="text-xs font-black text-[#7C3AED] uppercase tracking-wider block">Academic Department</span>
                    <h2 className="text-xl font-black text-slate-800">{selectedDept?.name}</h2>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayedSemesters.map((semStat: any) => {
                    const isSemExpanded = expandedSemester === semStat.semester;
                    const passRate = semStat.totalStudents > 0 ? Math.round((semStat.passed / semStat.totalStudents) * 100) : 0;
                    
                    // Published Status badge details
                    let publishLabel = "Draft";
                    let publishClass = "bg-amber-50 text-amber-700 border-amber-200";
                    if (semStat.totalStudents === 0) {
                      publishLabel = "No Enrolled";
                      publishClass = "bg-slate-50 text-slate-400 border-slate-200";
                    } else if (semStat.publishedCount === semStat.totalStudents) {
                      publishLabel = "Published";
                      publishClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
                    } else if (semStat.publishedCount > 0) {
                      publishLabel = `Partial (${semStat.publishedCount}/${semStat.totalStudents})`;
                      publishClass = "bg-indigo-50 text-indigo-700 border-indigo-200";
                    }

                    return (
                      <div
                        key={semStat.semester}
                        className={`bg-white border rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_15px_35px_rgba(124,58,237,0.08)] hover:-translate-y-1.5 transition-all duration-300 relative overflow-hidden flex flex-col justify-between min-h-[300px] ${
                          isSemExpanded ? "border-[#7C3AED] ring-4 ring-[#7C3AED]/10" : "border-[#E2E8F0]"
                        }`}
                      >
                        {/* Decorative Background Blur */}
                        <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#7C3AED]/5 rounded-full blur-xl pointer-events-none"></div>

                        <div className="space-y-4">
                          {/* Header */}
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-[#7C3AED] border border-purple-100 font-black text-sm">
                                S{semStat.semester}
                              </div>
                              <div>
                                <h4 className="font-extrabold text-slate-800 text-sm">Semester {semStat.semester}</h4>
                              </div>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-black border uppercase tracking-wider ${publishClass}`}>
                              {publishLabel}
                            </span>
                          </div>

                          {/* Detailed list metrics */}
                          <div className="space-y-2 text-xs font-semibold text-slate-650 pt-2 border-t border-slate-100">
                            <div className="flex justify-between">
                              <span className="text-slate-400 font-bold">Total Students:</span>
                              <span className="text-slate-800 font-extrabold">{semStat.totalStudents} Students</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400 font-bold">Passed Students:</span>
                              <span className="text-emerald-600 font-extrabold">{semStat.passed} Passed</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400 font-bold">Failed Students:</span>
                              <span className="text-rose-600 font-extrabold">{semStat.failed} Failed</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400 font-bold">Pass Percentage:</span>
                              <span className="text-emerald-600 font-extrabold">{passRate}% Pass Rate</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400 font-bold">Average SGPA:</span>
                              <span className="text-slate-800 font-extrabold">{semStat.avgSgpa}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400 font-bold">Average Marks:</span>
                              <span className="text-slate-800 font-extrabold">{semStat.avgMarks}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400 font-bold">Result Status:</span>
                              <span className="text-slate-800 font-extrabold">{publishLabel}</span>
                            </div>
                          </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3 pt-4 border-t border-slate-100 mt-4">
                          <button
                            onClick={() => {
                              setExpandedSemester(isSemExpanded ? null : semStat.semester);
                              setExpandedStudentId(null);
                              setCurrentPage(1);
                              setSelectedStudentIds([]);
                            }}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-bold text-center border transition-all hover:scale-[1.02] active:scale-[0.98] ${
                              isSemExpanded
                                ? "bg-purple-50 border-purple-200 text-[#7C3AED]"
                                : "bg-white border-[#E2E8F0] text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            View Results
                          </button>
                          <button
                            onClick={() => handleDeclareResults(selectedDeptId, semStat.semester)}
                            disabled={semStat.totalStudents === 0 || isPublishingBatch}
                            className="flex-1 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl text-xs font-bold text-center transition-colors disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
                          >
                            {isPublishingBatch ? "..." : "Declare All"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Recent Evaluation & Publishing Activity Timeline */}
                  <div className="col-span-full bg-white border border-[#E2E8F0] rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <Activity size={20} className="text-[#7C3AED]" />
                        <div>
                          <h3 className="font-extrabold text-slate-800 text-base">Recent Evaluation & Publishing Activity</h3>
                          <p className="text-xs text-slate-400 font-medium">Real-time audit log of examiner activity and result declaration events.</p>
                        </div>
                      </div>
                    </div>

                    <div className="relative border-l border-slate-100 ml-4 pl-8 space-y-6">
                      {recentActivities.map((act) => {
                        const initials = getInitials(act.faculty || "System");
                        const colorClass = avatarColorClass(act.type);
                        return (
                          <div key={act.id} className="relative group">
                            {/* Timeline Dot/Avatar */}
                            <div className={`absolute -left-[49px] top-0.5 w-9 h-9 rounded-xl border flex items-center justify-center text-xs font-bold shadow-sm transition-all duration-300 group-hover:scale-110 ${colorClass}`}>
                              {initials}
                            </div>
                            
                            {/* Activity Content Card */}
                            <div className="bg-slate-50/50 hover:bg-slate-50 border border-slate-100 hover:border-slate-200/80 rounded-2xl p-4 transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="space-y-1">
                                <p className="text-sm font-bold text-slate-800 leading-snug">{act.text}</p>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 font-semibold">
                                  {act.faculty && (
                                    <span className="flex items-center gap-1">
                                      <span className="text-slate-350">Faculty:</span>
                                      <span className="text-slate-600">{act.faculty}</span>
                                    </span>
                                  )}
                                  {act.subjectName && (
                                    <span className="flex items-center gap-1">
                                      <span className="text-slate-350">Subject:</span>
                                      <span className="text-slate-600">{act.subjectName}</span>
                                    </span>
                                  )}
                                  {act.department && (
                                    <span className="flex items-center gap-1">
                                      <span className="text-slate-350">Dept:</span>
                                      <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-bold">{act.department}</span>
                                    </span>
                                  )}
                                  {act.semester && (
                                    <span className="flex items-center gap-1">
                                      <span className="text-slate-350">Sem:</span>
                                      <span className="bg-purple-50 text-[#7C3AED] px-1.5 py-0.5 rounded text-[10px] font-bold">Semester {act.semester}</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-xs text-slate-400 font-extrabold whitespace-nowrap self-end sm:self-center">
                                ⏱️ {getTimeAgo(act.time)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {recentActivities.length === 0 && (
                        <div className="text-center py-6 text-slate-400 text-sm font-medium">
                          No recent activities recorded.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Step 3: Collapsible Student Results details for expanded semester */}
                  {expandedSemester !== null && (() => {
                    const semStudents = students.filter((s: any) => s.departmentId === selectedDeptId && s.semester === expandedSemester);
                    const filteredSemStudents = semStudents.filter((student: any) => {
                      const studentResults = adminResults.filter((r: any) => r.userId === student.id && r.semester === expandedSemester);
                      const hasFail = studentResults.some((r: any) => r.status === "FAIL");
                      const status = studentResults.length === 0 ? "NO MARKS" : hasFail ? "FAIL" : "PASS";
                      
                      const summary = dbSummaries.find((s: any) => s.userId === student.id && s.semester === expandedSemester);
                      const isPublished = summary ? summary.published : false;

                      const matchesStatus = filterStatus === "ALL" || status === filterStatus;
                      const matchesPublish = filterPublish === "ALL" || 
                        (filterPublish === "PUBLISHED" ? isPublished : !isPublished);

                      const matchingEval = allEvaluations.find((e: any) => e.studentId === student.id && e.course?.semester === expandedSemester && e.faculty?.name === filterFaculty);
                      const matchesFaculty = filterFaculty === "ALL" || !!matchingEval;

                      const matchesSearch = 
                        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (student.rollNumber || "").toLowerCase().includes(searchTerm.toLowerCase());

                      return matchesStatus && matchesPublish && matchesFaculty && matchesSearch;
                    });

                    const ITEMS_PER_PAGE = 20;
                    const totalStudentsCount = filteredSemStudents.length;
                    const totalPages = Math.ceil(totalStudentsCount / ITEMS_PER_PAGE) || 1;
                    const safeCurrentPage = Math.min(currentPage, totalPages);
                    const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
                    const endIndex = startIndex + ITEMS_PER_PAGE;
                    const paginatedStudents = filteredSemStudents.slice(startIndex, endIndex);

                    const isPageAllSelected = paginatedStudents.length > 0 && paginatedStudents.every((s: any) => selectedStudentIds.includes(s.id));
                    const handleSelectPageAll = () => {
                      if (isPageAllSelected) {
                        setSelectedStudentIds(prev => prev.filter((id: string) => !paginatedStudents.some((ps: any) => ps.id === id)));
                      } else {
                        const newIds = paginatedStudents.map((s: any) => s.id).filter((id: string) => !selectedStudentIds.includes(id));
                        setSelectedStudentIds(prev => [...prev, ...newIds]);
                      }
                    };

                    return (
                      <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white border border-[#E2E8F0] rounded-[24px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.02)] mt-6 transition-all col-span-full"
                      >
                        {/* Accordion style header */}
                        <div 
                          onClick={() => {
                            setExpandedSemester(null);
                            setExpandedStudentId(null);
                          }}
                          className="p-5 border-b border-[#E2E8F0] bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors select-none"
                        >
                          <div>
                            <h3 className="font-extrabold text-slate-855 text-base flex items-center gap-2">
                              🎓 Semester {expandedSemester} Student Results Ledger <span className="text-xs font-normal text-slate-400">(Click to Collapse)</span>
                            </h3>
                            <p className="text-xs text-slate-400 font-medium">Viewing student grade performance for {selectedDept?.name}.</p>
                          </div>
                          <span className="text-slate-400 text-xs font-black">▼ Collapsible</span>
                        </div>

                        {/* Smart Result Summary */}
                        {(() => {
                          const semStudentIds = semStudents.map((s: any) => s.id);
                          const semSummaries = dbSummaries.filter((s: any) => semStudentIds.includes(s.userId) && s.semester === expandedSemester);
                          const sgpaList = semSummaries.map((s: any) => parseFloat(s.sgpa || "0")).filter((g: number) => g > 0);
                          const avgSgpa = sgpaList.length > 0 ? (sgpaList.reduce((sum: number, g: number) => sum + g, 0) / sgpaList.length).toFixed(2) : "0.00";
                          const highestSgpa = sgpaList.length > 0 ? Math.max(...sgpaList).toFixed(2) : "0.00";
                          const lowestSgpa = sgpaList.length > 0 ? Math.min(...sgpaList).toFixed(2) : "0.00";

                          const activeSemStat = semesterStats.find(s => s.semester === expandedSemester);
                          const passedCount = activeSemStat?.passed || 0;
                          const failedCount = activeSemStat?.failed || 0;
                          const passRate = totalStudentsCount > 0 ? Math.round((passedCount / totalStudentsCount) * 100) : 0;
                          const failRate = totalStudentsCount > 0 ? Math.round((failedCount / totalStudentsCount) * 100) : 0;
                          const publishedCount = activeSemStat?.publishedCount || 0;

                          return (
                            <div className="grid grid-cols-2 md:grid-cols-7 gap-4 p-5 bg-[#F8FAFC] border-b border-[#E2E8F0] text-xs font-bold">
                              <div className="bg-white p-3 rounded-xl border border-slate-100 flex flex-col justify-center shadow-xs">
                                <span className="text-slate-400 text-[9px] uppercase tracking-wider block">Total Students</span>
                                <span className="text-sm font-black text-slate-800 mt-0.5">{totalStudentsCount} Enrolled</span>
                              </div>
                              <div className="bg-white p-3 rounded-xl border border-slate-100 flex flex-col justify-center shadow-xs">
                                <span className="text-slate-400 text-[9px] uppercase tracking-wider block">Pass Rate (%)</span>
                                <span className="text-sm font-black text-emerald-600 mt-0.5">{passRate}% ({passedCount})</span>
                              </div>
                              <div className="bg-white p-3 rounded-xl border border-slate-100 flex flex-col justify-center shadow-xs">
                                <span className="text-slate-400 text-[9px] uppercase tracking-wider block">Fail Rate (%)</span>
                                <span className="text-sm font-black text-rose-600 mt-0.5">{failRate}% ({failedCount})</span>
                              </div>
                              <div className="bg-white p-3 rounded-xl border border-slate-100 flex flex-col justify-center shadow-xs">
                                <span className="text-slate-400 text-[9px] uppercase tracking-wider block">Average SGPA</span>
                                <span className="text-sm font-black text-slate-700 mt-0.5">{avgSgpa}</span>
                              </div>
                              <div className="bg-white p-3 rounded-xl border border-slate-100 flex flex-col justify-center shadow-xs">
                                <span className="text-slate-400 text-[9px] uppercase tracking-wider block">Highest SGPA</span>
                                <span className="text-sm font-black text-[#7C3AED] mt-0.5">{highestSgpa}</span>
                              </div>
                              <div className="bg-white p-3 rounded-xl border border-slate-100 flex flex-col justify-center shadow-xs">
                                <span className="text-slate-400 text-[9px] uppercase tracking-wider block">Lowest SGPA</span>
                                <span className="text-sm font-black text-slate-500 mt-0.5">{lowestSgpa}</span>
                              </div>
                              <div className="bg-white p-3 rounded-xl border border-slate-100 flex flex-col justify-center shadow-xs col-span-2 md:col-span-1">
                                <span className="text-slate-400 text-[9px] uppercase tracking-wider block">Published Status</span>
                                <span className="text-sm font-black text-blue-600 mt-0.5">{publishedCount} / {totalStudentsCount}</span>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Bulk action buttons header */}
                        <div className="flex items-center justify-between p-4 border-b border-[#E2E8F0] bg-slate-50/30 gap-4 flex-wrap">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-xs font-black text-slate-455 uppercase tracking-wider mr-1">Bulk Actions:</span>
                            <button
                              type="button"
                              onClick={() => {
                                setBulkPublishOption("semester");
                                setIsBulkPublishModalOpen(true);
                              }}
                              className="px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl text-xs font-bold transition-all shadow-xs hover:scale-[1.02] active:scale-[0.98]"
                            >
                              Publish Entire Semester
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setBulkPublishOption("department");
                                setIsBulkPublishModalOpen(true);
                              }}
                              className="px-4 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl text-xs font-bold transition-all shadow-xs hover:scale-[1.02] active:scale-[0.98]"
                            >
                              Publish Entire Department
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setBulkPublishOption("verified");
                                setIsBulkPublishModalOpen(true);
                              }}
                              className="px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-white rounded-xl text-xs font-bold transition-all shadow-xs hover:scale-[1.02] active:scale-[0.98]"
                            >
                              Publish All Verified Results
                            </button>
                            {selectedStudentIds.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setBulkPublishOption("selected");
                                  setIsBulkPublishModalOpen(true);
                                }}
                                className="px-4 py-2 border border-purple-250 text-[#7C3AED] bg-purple-50 hover:bg-purple-100 rounded-xl text-xs font-bold transition-all shadow-xs hover:scale-[1.02] active:scale-[0.98]"
                              >
                                Publish Selected ({selectedStudentIds.length})
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                              <tr className="bg-[#5B21B6] text-white font-bold text-xs uppercase tracking-wider border-b border-[#E2E8F0]">
                                <th className="p-4 pl-6 text-center w-12">
                                  <input
                                    type="checkbox"
                                    checked={isPageAllSelected}
                                    onChange={handleSelectPageAll}
                                    className="h-4 w-4 rounded border-slate-300 text-[#7C3AED] focus:ring-[#7C3AED]"
                                  />
                                </th>
                                <th className="p-4 pl-6">Roll Number</th>
                                <th className="p-4">Student</th>
                                <th className="p-4 text-center">Subject Details</th>
                                <th className="p-4 text-center">SGPA</th>
                                <th className="p-4 text-center">Pass Status</th>
                                <th className="p-4 text-center">Publish Status</th>
                                <th className="p-4 pr-6 text-center">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E2E8F0] text-sm text-slate-700">
                              {paginatedStudents.map((student: any) => {
                                const studentResults = adminResults.filter(
                                  (r: any) => r.userId === student.id && r.semester === expandedSemester
                                );
                                const subjectCount = studentResults.length;
                                
                                let calculatedSgpa = "0.00";
                                const totalCredits = studentResults.reduce((sum: number, r: any) => sum + (r.credits || 0), 0);
                                if (totalCredits > 0) {
                                  const totalPoints = studentResults.reduce((sum: number, r: any) => sum + (getGradePoints(r.grade) * (r.credits || 0)), 0);
                                  calculatedSgpa = (totalPoints / totalCredits).toFixed(2);
                                }

                                const summary = dbSummaries.find((s: any) => s.userId === student.id && s.semester === expandedSemester);
                                const isPublished = summary ? summary.published : false;

                                const hasFail = studentResults.some((r: any) => r.status === "FAIL");
                                const passStatus = subjectCount === 0 ? "NO MARKS" : hasFail ? "FAIL" : "PASS";

                                const isRecent = studentResults.some((r: any) => isRecentlyUpdated(r.createdAt));
                                const rowBg = isRecent 
                                  ? "bg-emerald-50/60 border-l-4 border-l-emerald-500" 
                                  : "bg-white";
                                const isStudentExpanded = expandedStudentId === student.id;

                                const isSelected = selectedStudentIds.includes(student.id);

                                return (
                                  <React.Fragment key={student.id}>
                                    <tr className={`${rowBg} hover:bg-[#F3E8FF] transition-all border-b border-[#E2E8F0]`}>
                                      <td className="p-4 pl-6 text-center select-none">
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={() => {
                                            setSelectedStudentIds(prev =>
                                              prev.includes(student.id)
                                                ? prev.filter(id => id !== student.id)
                                                : [...prev, student.id]
                                            );
                                          }}
                                          className="h-4 w-4 rounded border-slate-300 text-[#7C3AED] focus:ring-[#7C3AED]"
                                        />
                                      </td>
                                      <td className="p-4 font-mono text-xs font-semibold text-slate-500">{student.rollNumber || "N/A"}</td>
                                      <td className="p-4 font-bold text-slate-850">
                                        <div className="flex items-center gap-2">
                                          <span>{student.name}</span>
                                          {isRecent && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-250 animate-pulse">
                                              Recently Updated
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="p-4 text-center">
                                        <button
                                          type="button"
                                          onClick={() => setExpandedStudentId(isStudentExpanded ? null : student.id)}
                                          className="px-3 py-1 bg-purple-50 text-[#7C3AED] rounded-lg border border-purple-100 text-xs font-bold hover:bg-purple-100 transition-colors flex items-center gap-1 mx-auto"
                                        >
                                          {subjectCount} Subjects {isStudentExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                        </button>
                                      </td>
                                      <td className="p-4 text-center font-bold text-slate-800">{calculatedSgpa}</td>
                                      <td className="p-4 text-center">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                          passStatus === "PASS"
                                            ? "bg-green-50 text-green-600 border-green-200"
                                            : passStatus === "FAIL"
                                            ? "bg-red-50 text-red-600 border-red-200"
                                            : "bg-slate-50 text-slate-400 border border-slate-200"
                                        }`}>
                                          {passStatus}
                                        </span>
                                      </td>
                                      <td className="p-4 text-center">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                          isPublished
                                            ? "bg-green-50 text-green-600 border-green-200"
                                            : "bg-amber-50 text-amber-600 border-amber-205"
                                        }`}>
                                          {isPublished ? "PUBLISHED" : "DRAFT"}
                                        </span>
                                      </td>
                                      <td className="p-4 pr-6 text-center">
                                        <div className="flex items-center justify-center gap-2.5">
                                          <button
                                            type="button"
                                            onClick={() => handleTogglePublish(student.id, expandedSemester, isPublished)}
                                            className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                                              isPublished
                                                ? "bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200"
                                                : "bg-[#7C3AED] border-transparent text-white hover:bg-[#6D28D9]"
                                            }`}
                                          >
                                            {isPublished ? "Unpublish" : "Publish"}
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => openOverrideModal(student.id, student.name, expandedSemester)}
                                            className="p-1.5 border border-[#E2E8F0] hover:bg-slate-50 rounded-lg text-slate-500"
                                            title="Set GPAs Override"
                                          >
                                            <Sliders size={14} />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>

                                    {/* Student grades expanded sheet sub-table */}
                                    {isStudentExpanded && (
                                      <tr>
                                        <td colSpan={8} className="p-4 bg-slate-50/50">
                                          <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-inner max-w-4xl mx-auto">
                                            <div className="flex justify-between items-center mb-3">
                                              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Detailed Report Card</span>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  resetForm();
                                                  setSubjectFormData({
                                                    ...subjectFormData,
                                                    userId: student.id,
                                                    semester: expandedSemester,
                                                  });
                                                  setIsSubjectModalOpen(true);
                                                }}
                                                className="text-xs text-[#7C3AED] font-bold flex items-center gap-1 hover:underline"
                                              >
                                                <Plus size={12} /> Add Marks
                                              </button>
                                            </div>
                                            <table className="w-full text-left text-xs border-collapse">
                                              <thead>
                                                <tr className="bg-slate-50 text-slate-400 font-extrabold uppercase border-b border-[#E2E8F0]">
                                                  <th className="p-3">Course Code</th>
                                                  <th className="p-3">Course Name</th>
                                                  <th className="p-3 text-center">Internal</th>
                                                  <th className="p-3 text-center">External</th>
                                                  <th className="p-3 text-center">Total</th>
                                                  <th className="p-3 text-center">Credits</th>
                                                  <th className="p-3 text-center">Grade</th>
                                                  <th className="p-3 text-center">Status</th>
                                                  <th className="p-3 text-center">Actions</th>
                                                </tr>
                                              </thead>
                                              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                                                {studentResults.map((res: any) => {
                                                  const isSubjectRecent = isRecentlyUpdated(res.createdAt);
                                                  return (
                                                    <tr key={res.id} className="hover:bg-slate-50/50">
                                                      <td className="p-3 font-mono font-bold text-purple-600">{res.subjectCode}</td>
                                                      <td className="p-3 font-bold text-slate-800">
                                                        <div className="flex items-center gap-2">
                                                          <span>{res.subjectName}</span>
                                                          {isSubjectRecent && (
                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                              New Marks
                                                            </span>
                                                          )}
                                                        </div>
                                                      </td>
                                                      <td className="p-3 text-center text-slate-500">{res.internalMarks}</td>
                                                      <td className="p-3 text-center text-slate-500">{res.externalMarks}</td>
                                                      <td className="p-3 text-center font-bold text-slate-800">{res.marks}/100</td>
                                                      <td className="p-3 text-center">{res.credits}</td>
                                                      <td className="p-3 text-center font-black text-[#7C3AED]">{res.grade}</td>
                                                      <td className="p-3 text-center">
                                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                                          res.status === "PASS" ? "bg-green-50 text-green-600 border-green-200" : "bg-red-50 text-red-600 border-red-200"
                                                        }`}>
                                                          {res.status}
                                                        </span>
                                                      </td>
                                                      <td className="p-3 text-center">
                                                        <div className="flex items-center justify-center gap-2.5">
                                                          <button type="button" onClick={() => openEditModal(res)} className="text-[#7C3AED] hover:underline font-bold">Edit</button>
                                                          <button type="button" onClick={() => handleDeleteSubject(res.id)} className="text-red-500 hover:underline font-bold">Delete</button>
                                                        </div>
                                                      </td>
                                                    </tr>
                                                  );
                                                })}
                                                {studentResults.length === 0 && (
                                                  <tr>
                                                    <td colSpan={9} className="p-4 text-center text-slate-400">No subject marks registered.</td>
                                                  </tr>
                                                )}
                                              </tbody>
                                            </table>
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                );
                              })}
                              {paginatedStudents.length === 0 && (
                                <tr>
                                  <td colSpan={8} className="p-8 text-center text-slate-400 font-medium">
                                    No student records match chosen status filters for Semester {expandedSemester}.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>

                        {/* Pagination controls */}
                        {totalPages > 1 && (
                          <div className="flex items-center justify-between p-5 bg-slate-50 border-t border-[#E2E8F0] text-xs font-bold text-slate-500 flex-wrap gap-4">
                            <span>
                              Showing {startIndex + 1}–{Math.min(endIndex, totalStudentsCount)} of {totalStudentsCount} Students
                            </span>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={safeCurrentPage === 1}
                                className="px-4 py-2 border border-[#E2E8F0] bg-white text-slate-655 hover:bg-slate-50 rounded-xl transition-all disabled:opacity-50 font-bold"
                              >
                                Previous
                              </button>
                              <button
                                type="button"
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={safeCurrentPage === totalPages}
                                className="px-4 py-2 border border-[#E2E8F0] bg-white text-slate-655 hover:bg-slate-50 rounded-xl transition-all disabled:opacity-50 font-bold"
                              >
                                Next
                              </button>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })()}
              </div>
            </div>
            )}
          </div>
        )}

          {/* MODE B: GPA Recalculation Policies */}
        {adminTab === "policy" && (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 shadow-sm max-w-2xl mx-auto space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Backlog GPA Recalculation Policy</h2>
              <p className="text-slate-500 text-sm">
                Select the institutional policy used to recalculate student SGPA and CGPA values once a backlog subject is cleared via supplementary exams.
              </p>
            </div>

            <div className="space-y-4">
              <label className="flex items-start gap-4 p-4 rounded-2xl border border-[#E2E8F0] hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="gpaPolicy"
                  value="A"
                  checked={backlogPolicy === "A"}
                  onChange={() => handleSavePolicy("A")}
                  disabled={isSavingPolicy}
                  className="mt-1.5 h-4 w-4 text-[#7C3AED] focus:ring-[#7C3AED] border-slate-350"
                />
                <div>
                  <span className="block font-bold text-slate-855">Policy A: Latest Grade Replacement</span>
                  <span className="block text-xs text-slate-500 mt-1">
                    Replace the failed grade with the actual grade achieved in the supplementary exam (e.g. F becomes B). Recalculate SGPA for the original semester and CGPA for all subsequent semesters.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-4 p-4 rounded-2xl border border-[#E2E8F0] hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="gpaPolicy"
                  value="B"
                  checked={backlogPolicy === "B"}
                  onChange={() => handleSavePolicy("B")}
                  disabled={isSavingPolicy}
                  className="mt-1.5 h-4 w-4 text-[#7C3AED] focus:ring-[#7C3AED] border-slate-350"
                />
                <div>
                  <span className="block font-bold text-slate-855">Policy B: Pass Grade Replacement</span>
                  <span className="block text-xs text-slate-500 mt-1">
                    Replace the failed grade with a fixed minimum passing grade (D, 5 points) defined by the institution, regardless of the actual grade scored in the supplementary exam.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-4 p-4 rounded-2xl border border-[#E2E8F0] hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="gpaPolicy"
                  value="C"
                  checked={backlogPolicy === "C"}
                  onChange={() => handleSavePolicy("C")}
                  disabled={isSavingPolicy}
                  className="mt-1.5 h-4 w-4 text-[#7C3AED] focus:ring-[#7C3AED] border-slate-350"
                />
                <div>
                  <span className="block font-bold text-slate-855">Policy C: Original Grade Retention</span>
                  <span className="block text-xs text-slate-500 mt-1">
                    Retain the original failed grade (F, 0 points) in GPA calculations and only update the subject's status to passed. Backlog count is updated, but SGPA and CGPA remain unchanged.
                  </span>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* MODE C: Admin Evaluation Monitoring */}
        {adminTab === "evaluations" && (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-[#E2E8F0] bg-slate-50/50">
              <h3 className="font-extrabold text-slate-805 text-base flex items-center gap-2">
                <Activity size={20} className="text-[#7C3AED]" /> Blind Evaluation Monitoring
              </h3>
              <p className="text-xs text-slate-400 font-medium">Track end-semester answer sheet grading progress and evaluator assignments.</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-[#5B21B6] text-white font-bold text-xs uppercase tracking-wider border-b border-[#E2E8F0]">
                    <th className="p-4 pl-6">Faculty Name</th>
                    <th className="p-4">Subject</th>
                    <th className="p-4">Department</th>
                    <th className="p-4 text-center">Semester</th>
                    <th className="p-4 text-center">Student Marks</th>
                    <th className="p-4 text-center">Evaluation Date/Time</th>
                    <th className="p-4 pr-6 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] text-sm text-slate-700">
                  {allEvaluations.map((ev: any) => {
                    const deptName = departments.find((d: any) => d.id === ev.course?.categoryId)?.name || "N/A";
                    const isEvalRecent = isRecentlyUpdated(ev.updatedAt);
                    const rowBg = isEvalRecent ? "bg-emerald-50/60" : "bg-white";
                    
                    return (
                      <tr key={ev.id} className={`${rowBg} hover:bg-[#F3E8FF] transition-all border-b border-[#E2E8F0]`}>
                        <td className="p-4 pl-6 font-bold text-slate-800">{ev.faculty?.name || "N/A"}</td>
                        <td className="p-4 font-semibold text-slate-700">{ev.course?.title || "N/A"}</td>
                        <td className="p-4 font-mono text-xs">{mapDeptName(deptName)}</td>
                        <td className="p-4 text-center font-extrabold text-slate-500">Semester {ev.course?.semester || "N/A"}</td>
                        <td className="p-4 text-center font-bold text-slate-800">
                          {ev.status === "EVALUATED" ? `${ev.marks} / 100` : "-"}
                        </td>
                        <td className="p-4 text-center text-xs text-slate-400">
                          {ev.status === "EVALUATED" ? new Date(ev.updatedAt || ev.createdAt).toLocaleString() : "-"}
                        </td>
                        <td className="p-4 pr-6 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                            ev.status === "EVALUATED"
                              ? "bg-green-50 text-green-600 border-green-200"
                              : "bg-amber-50 text-amber-600 border-amber-205"
                          }`}>
                            {ev.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {allEvaluations.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">No blind evaluations records found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODE D: Faculty Evaluation Tracker */}
        {adminTab === "faculty" && (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-[#E2E8F0] bg-slate-50/50">
              <h3 className="font-extrabold text-slate-805 text-base flex items-center gap-2">
                <Users size={20} className="text-[#7C3AED]" /> Faculty Evaluation Tracker
              </h3>
              <p className="text-xs text-slate-400 font-medium">Monitor individual faculty grading performance, load, and completion rates.</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-[#5B21B6] text-white font-bold text-xs uppercase tracking-wider border-b border-[#E2E8F0]">
                    <th className="p-4 pl-6">Faculty Name</th>
                    <th className="p-4">Subject</th>
                    <th className="p-4">Department</th>
                    <th className="p-4 text-center">Semester</th>
                    <th className="p-4 text-center">Assigned Scripts</th>
                    <th className="p-4 text-center">Evaluated Scripts</th>
                    <th className="p-4 text-center">Pending Scripts</th>
                    <th className="p-4 pr-6 text-center">Completion Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] text-sm text-slate-700">
                  {facultyTrackerData.map((tracker: any, idx: number) => {
                    const barColor = tracker.completionRate === 100 
                      ? "bg-emerald-500" 
                      : tracker.completionRate > 50 
                      ? "bg-purple-500" 
                      : "bg-amber-500";
                      
                    return (
                      <tr key={idx} className="hover:bg-[#F3E8FF] transition-all border-b border-[#E2E8F0]">
                        <td className="p-4 pl-6 font-bold text-slate-800">{tracker.facultyName}</td>
                        <td className="p-4 font-semibold text-slate-700">{tracker.subject}</td>
                        <td className="p-4 font-mono text-xs">{tracker.department}</td>
                        <td className="p-4 text-center font-extrabold text-slate-500">Semester {tracker.semester}</td>
                        <td className="p-4 text-center font-bold text-slate-650">{tracker.assigned}</td>
                        <td className="p-4 text-center font-extrabold text-emerald-600">{tracker.evaluated}</td>
                        <td className="p-4 text-center font-extrabold text-rose-600">{tracker.pending}</td>
                        <td className="p-4 pr-6 text-center">
                          <div className="flex items-center gap-3 justify-center">
                            <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                              <div className={`h-full ${barColor}`} style={{ width: `${tracker.completionRate}%` }}></div>
                            </div>
                            <span className="font-black text-xs min-w-[35px] text-right">{tracker.completionRate}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {facultyTrackerData.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 font-medium">No faculty evaluations tracking records found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
          </div>
        </div>

        {/* MODAL: Add/Edit Subject Marks */}
        <AnimatePresence>
          {isSubjectModalOpen && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                className="bg-white rounded-2xl border border-[#E2E8F0] w-full max-w-lg overflow-hidden shadow-2xl relative"
              >
                <div className="p-6 border-b border-[#E2E8F0] flex justify-between items-center bg-slate-50/50">
                  <h3 className="font-extrabold text-lg text-slate-800">
                    {editingSubject ? "Edit Subject Result" : "Add Subject Result"}
                  </h3>
                  <button onClick={() => setIsSubjectModalOpen(false)} className="text-slate-450 hover:text-slate-655 hover:bg-slate-100 p-1.5 rounded-full transition-colors">
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleSaveSubject} className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                      Student
                    </label>
                    {editingSubject ? (
                      <div className="w-full bg-slate-50 border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-slate-700 font-medium">
                        {editingSubject.studentName} ({editingSubject.studentRollNumber})
                      </div>
                    ) : (
                      <select
                        required
                        value={subjectFormData.userId}
                        onChange={(e) => setSubjectFormData({ ...subjectFormData, userId: e.target.value })}
                        className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent text-sm transition-all"
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
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                        Semester
                      </label>
                      <select
                        value={subjectFormData.semester}
                        onChange={(e) => setSubjectFormData({ ...subjectFormData, semester: parseInt(e.target.value) })}
                        className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent text-sm transition-all"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                          <option key={s} value={s}>Semester {s}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                        Credits
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="12"
                        required
                        value={subjectFormData.credits}
                        onChange={(e) => setSubjectFormData({ ...subjectFormData, credits: parseInt(e.target.value) || 0 })}
                        className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent text-sm transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                        Subject Code
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. CS201"
                        value={subjectFormData.subjectCode}
                        onChange={(e) => setSubjectFormData({ ...subjectFormData, subjectCode: e.target.value })}
                        className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent text-sm transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                        Subject Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Data Structures"
                        value={subjectFormData.subjectName}
                        onChange={(e) => setSubjectFormData({ ...subjectFormData, subjectName: e.target.value })}
                        className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent text-sm transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
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
                        className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent text-sm transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
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
                        className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent text-sm transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                        Grade Override (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder={`Auto: ${formGrade}`}
                        value={subjectFormData.grade}
                        onChange={(e) => setSubjectFormData({ ...subjectFormData, grade: e.target.value.toUpperCase() })}
                        className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-slate-805 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent text-sm transition-all font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                        Status Override (Optional)
                      </label>
                      <select
                        value={subjectFormData.status}
                        onChange={(e) => setSubjectFormData({ ...subjectFormData, status: e.target.value })}
                        className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-slate-805 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent text-sm transition-all font-semibold"
                      >
                        <option value="">Auto: {formStatus}</option>
                        <option value="PASS">PASS</option>
                        <option value="FAIL">FAIL</option>
                      </select>
                    </div>
                  </div>

                  {/* Calculations Preview Alert */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400 font-extrabold uppercase block tracking-wider mb-0.5">Calculations Preview</span>
                      <span className="text-slate-800 font-bold">{formTotalMarks}/100 marks total</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="bg-[#7C3AED]/10 text-[#7C3AED] px-2.5 py-1 rounded-lg font-black text-xs">
                        Grade: {formGrade}
                      </span>
                      <span className={`px-2.5 py-1 rounded-lg font-black text-xs border ${
                        formStatus === "PASS" ? "bg-green-50 text-green-600 border-green-200" : "bg-red-50 text-red-600 border-red-200"
                      }`}>
                        {formStatus}
                      </span>
                    </div>
                  </div>

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
                      className="flex-1 px-4 py-3 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold rounded-xl text-sm shadow-md transition-all"
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
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                className="bg-white rounded-2xl border border-[#E2E8F0] w-full max-w-sm overflow-hidden shadow-2xl relative"
              >
                <div className="p-6 border-b border-[#E2E8F0] flex justify-between items-center bg-slate-50/50">
                  <h3 className="font-extrabold text-lg text-slate-805">
                    Set SGPA/CGPA Overrides
                  </h3>
                  <button onClick={() => setIsOverrideModalOpen(false)} className="text-slate-450 hover:text-slate-655 hover:bg-slate-100 p-1.5 rounded-full transition-colors">
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleSaveOverrides} className="p-6 space-y-4">
                  <div className="text-sm space-y-1">
                    <div className="text-slate-400 font-bold text-xs uppercase tracking-wider">Student:</div>
                    <div className="font-bold text-slate-800">{overrideFormData.studentName}</div>
                    <div className="text-slate-500 font-semibold text-xs">Semester {overrideFormData.semester}</div>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                        SGPA Override
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 9.15 (Leave blank to use auto)"
                        value={overrideFormData.sgpa}
                        onChange={(e) => setOverrideFormData({ ...overrideFormData, sgpa: e.target.value })}
                        className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent text-sm transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                        CGPA Override
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 9.08 (Leave blank to use auto)"
                        value={overrideFormData.cgpa}
                        onChange={(e) => setOverrideFormData({ ...overrideFormData, cgpa: e.target.value })}
                        className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent text-sm transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsOverrideModalOpen(false)}
                      className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-707 font-bold rounded-xl text-sm transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-3 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold rounded-xl text-sm shadow-md transition-all"
                    >
                      Save GPAs
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL: Bulk Results Publishing */}
        <AnimatePresence>
          {isBulkPublishModalOpen && (() => {
            const dept = departments.find((d: any) => d.id === selectedDeptId);
            const deptName = dept?.name || "Department";

            return (
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -20 }}
                  className="bg-white rounded-[24px] border border-[#E2E8F0] w-full max-w-md overflow-hidden shadow-2xl relative animate-none"
                >
                  <div className="p-6 border-b border-[#E2E8F0] flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-extrabold text-lg text-slate-805">
                      Publish Results - {deptName}
                    </h3>
                    <button onClick={() => setIsBulkPublishModalOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-full transition-colors">
                      <X size={20} />
                    </button>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="bg-[#7C3AED]/5 border border-[#7C3AED]/10 p-4 rounded-2xl">
                      <span className="block text-[10px] font-black text-purple-600 uppercase tracking-wider mb-1">Confirmation Prompt</span>
                      <h4 className="font-extrabold text-slate-805 text-sm">
                        {bulkPublishOption === "semester" && `Publish results for Semester ${expandedSemester} - ${deptName}?`}
                        {bulkPublishOption === "department" && `Publish all results across all semesters for ${deptName}?`}
                        {bulkPublishOption === "selected" && `Publish results for ${selectedStudentIds.length} selected students in Semester ${expandedSemester} - ${deptName}?`}
                        {bulkPublishOption === "verified" && `Publish all verified (evaluated draft) results in Semester ${expandedSemester} - ${deptName}?`}
                      </h4>
                    </div>

                    <div className="space-y-3">
                      <span className="block text-[10px] font-black text-slate-450 uppercase tracking-wider mb-1 ml-1">Choose Publishing Range</span>
                      
                      {/* Option 1: Entire Semester */}
                      <label className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-colors ${
                        bulkPublishOption === "semester" ? "border-[#7C3AED] bg-purple-50/30" : "border-[#E2E8F0] hover:bg-slate-50"
                      }`}>
                        <input
                          type="radio"
                          name="bulkPublishOption"
                          value="semester"
                          checked={bulkPublishOption === "semester"}
                          onChange={() => setBulkPublishOption("semester")}
                          className="mt-1 h-4 w-4 text-[#7C3AED] focus:ring-[#7C3AED]"
                        />
                        <div>
                          <span className="block text-xs font-bold text-slate-800">Publish Entire Semester</span>
                          <span className="block text-[10px] text-slate-450 mt-0.5">Declare and publish results for all students in Semester {expandedSemester} - {deptName}.</span>
                        </div>
                      </label>

                      {/* Option 2: Entire Department */}
                      <label className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-colors ${
                        bulkPublishOption === "department" ? "border-[#7C3AED] bg-purple-50/30" : "border-[#E2E8F0] hover:bg-slate-50"
                      }`}>
                        <input
                          type="radio"
                          name="bulkPublishOption"
                          value="department"
                          checked={bulkPublishOption === "department"}
                          onChange={() => setBulkPublishOption("department")}
                          className="mt-1 h-4 w-4 text-[#7C3AED] focus:ring-[#7C3AED]"
                        />
                        <div>
                          <span className="block text-xs font-bold text-slate-800">Publish Entire Department</span>
                          <span className="block text-[10px] text-slate-450 mt-0.5">Declare results for all active semesters inside the {deptName} department.</span>
                        </div>
                      </label>

                      {/* Option 3: Selected Students */}
                      <label className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-colors ${
                        selectedStudentIds.length === 0 ? "opacity-50 cursor-not-allowed bg-slate-50/50" : "cursor-pointer hover:bg-slate-50"
                      } ${bulkPublishOption === "selected" && selectedStudentIds.length > 0 ? "border-[#7C3AED] bg-purple-50/30" : "border-[#E2E8F0]"}`}>
                        <input
                          type="radio"
                          name="bulkPublishOption"
                          value="selected"
                          disabled={selectedStudentIds.length === 0}
                          checked={bulkPublishOption === "selected"}
                          onChange={() => setBulkPublishOption("selected")}
                          className="mt-1 h-4 w-4 text-[#7C3AED] focus:ring-[#7C3AED] disabled:opacity-50"
                        />
                        <div>
                          <span className="block text-xs font-bold text-slate-805">Publish Selected Students ({selectedStudentIds.length} checked)</span>
                          <span className="block text-[10px] text-slate-450 mt-0.5">Publish grades only for the individual student checkboxes selected in the ledger.</span>
                        </div>
                      </label>

                      {/* Option 4: Verified Drafts Only */}
                      <label className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-colors ${
                        bulkPublishOption === "verified" ? "border-[#7C3AED] bg-purple-50/30" : "border-[#E2E8F0] hover:bg-slate-50"
                      }`}>
                        <input
                          type="radio"
                          name="bulkPublishOption"
                          value="verified"
                          checked={bulkPublishOption === "verified"}
                          onChange={() => setBulkPublishOption("verified")}
                          className="mt-1 h-4 w-4 text-[#7C3AED] focus:ring-[#7C3AED]"
                        />
                        <div>
                          <span className="block text-xs font-bold text-slate-800">Publish All Verified Drafts</span>
                          <span className="block text-[10px] text-slate-450 mt-0.5">Only publish results that are already evaluated but remain in draft status.</span>
                        </div>
                      </label>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsBulkPublishModalOpen(false)}
                        className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-705 font-bold rounded-xl text-sm transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleBulkPublish}
                        disabled={isPublishingBatch}
                        className="flex-1 px-4 py-3 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        {isPublishingBatch ? "Publishing..." : "Confirm Publish"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            );
          })()}
        </AnimatePresence>
      </div>
    );
  }
  // --- STUDENT RENDER ---


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
        status: "PROJECTED",
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

        {selectedSemester && (
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedSemester}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {!publishedSemesters.includes(selectedSemester) ? (
                <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center max-w-2xl mx-auto shadow-sm flex flex-col items-center">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-4 shadow-inner">
                    <Award size={24} className="text-slate-400" />
                  </div>
                  <h2 className="text-xl font-black text-slate-800 mb-1">Results Not Published Yet</h2>
                  <p className="text-slate-500 text-sm leading-relaxed max-w-md">
                    Grades for Semester {selectedSemester} have not been officially published. {selectedSemester === planningSem && "You can use the Goal Planner widget below to estimate your performance and project your GPA."}
                  </p>
                </div>
              ) : (
                selectedSummary && (
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
                            : selectedSummary.status === "PROJECTED"
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
                              <th className="p-4 text-center">{selectedSemester ? getExamMonthYear(selectedSemester, authData?.data?.user?.rollNumber, authData?.data?.user?.semester) : "Exam"}</th>
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
                                <td className="p-4 text-center font-bold text-slate-600">{sub.grade}</td>
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
                )
              )}
            </motion.div>
          </AnimatePresence>
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

              {/* Projected Outputs */}
              <div className="space-y-6 lg:mt-9">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                    <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Projected SGPA</span>
                    <span className="text-3xl font-black text-slate-900 mt-2">{projectedSgpa}</span>
                  </div>
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                    <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Projected CGPA</span>
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
