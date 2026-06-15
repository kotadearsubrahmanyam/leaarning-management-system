"use client";

import React, { useState, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  BookOpen,
  Trophy,
  Award,
  CalendarCheck,
  ShieldCheck,
  Activity,
  CreditCard,
  Download,
  Printer,
  FileText,
  ChevronRight,
  X,
  Mail,
  Phone,
  MapPin,
  Heart,
  Calendar,
  Building,
  CheckCircle,
  FileCheck,
  ShieldAlert,
  Clock,
} from "lucide-react";
import {
  DashboardCard,
  StatisticsCard,
  StudentCourseCard,
  StudentAttendanceCard,
  StudentResultCard,
  StudentActivityCard,
  ProfileFieldCard,
} from "@/components/ui/student-portal-cards";

const TABS = ["Overview", "Courses", "Attendance", "Results", "Activities", "Fees", "Documents"];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("Overview");

  // Document states
  const [activeDocumentPreview, setActiveDocumentPreview] = useState<string | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [selectedMemoSemester, setSelectedMemoSemester] = useState<number | null>(null);

  // Print references
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Queries
  const { data: authData, isLoading: authLoading } = useQuery({
    queryKey: ["authMe"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) throw new Error("Unauthorized");
      return res.json();
    },
  });

  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ["enrolledCourses"],
    queryFn: async () => {
      const res = await fetch("/api/courses/enrolled");
      if (!res.ok) return null;
      return res.json();
    },
  });

  const { data: attendanceData, isLoading: attendanceLoading } = useQuery({
    queryKey: ["studentAttendance"],
    queryFn: async () => {
      const res = await fetch("/api/student/attendance");
      if (!res.ok) return null;
      return res.json();
    },
  });

  const { data: resultsData, isLoading: resultsLoading } = useQuery({
    queryKey: ["studentResults"],
    queryFn: async () => {
      const res = await fetch("/api/student/results");
      if (!res.ok) return null;
      return res.json();
    },
  });

  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ["studentPayments"],
    queryFn: async () => {
      const res = await fetch("/api/student/payments");
      if (!res.ok) return null;
      return res.json();
    },
  });

  const { data: activitiesData, isLoading: activitiesLoading } = useQuery({
    queryKey: ["studentActivities"],
    queryFn: async () => {
      const res = await fetch("/api/student/activities");
      if (!res.ok) return null;
      return res.json();
    },
  });

  const user = authData?.data?.user;
  const courses = coursesData?.data?.courses || [];
  const attendance = attendanceData?.data?.attendance || [];
  const results = resultsData?.data?.results || [];
  const resultsSummaries = resultsData?.data?.summaries || {};
  const publishedSemesters = resultsData?.data?.publishedSemesters || [];
  const payments = paymentsData?.data?.payments || [];
  const fees = paymentsData?.data?.fees || [];
  const activities = activitiesData?.data?.activities || [];

  // Derived / Mocked fields based on student ID to be realistic and consistent
  const derivedProfile = useMemo(() => {
    if (!user) return null;

    const hashString = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
      }
      return Math.abs(hash);
    };

    const hash = hashString(user.id);

    const genders = ["Male", "Female"];
    const gender = genders[hash % genders.length];

    const bloodGroups = ["A+", "B+", "O+", "AB+", "A-", "B-", "O-"];
    const bloodGroup = bloodGroups[hash % bloodGroups.length];

    const birthYear = 2003 + (hash % 3);
    const birthMonth = 1 + (hash % 12);
    const birthDay = 1 + (hash % 28);
    const dateOfBirth = `${birthDay.toString().padStart(2, "0")}/${birthMonth.toString().padStart(2, "0")}/${birthYear}`;

    const departmentsList = [
      { code: "CSE", name: "Computer Science & Engineering" },
      { code: "ECE", name: "Electronics & Communication Engineering" },
      { code: "ME", name: "Mechanical Engineering" },
      { code: "CE", name: "Civil Engineering" },
      { code: "EEE", name: "Electrical & Electronics Engineering" },
    ];

    const deptInfo = departmentsList[hash % departmentsList.length];

    const sections = ["A", "B", "C"];
    const section = sections[hash % sections.length];

    const registrationNumber = `REG-${2023 + (hash % 2)}-${100000 + (hash % 900000)}`;

    const firstNames = ["Ramesh", "Sanjay", "Anil", "Sunil", "Vijay", "Karan", "Mahesh", "Dinesh"];
    const lastNames = ["Sharma", "Verma", "Gupta", "Kumar", "Singh", "Reddy", "Patel", "Joshi"];
    const parentName = `${firstNames[hash % firstNames.length]} ${lastNames[(hash + 3) % lastNames.length]}`;

    const phoneNumber = `+91 ${90000 + (hash % 90000)} ${10000 + (hash % 90000)}`;
    const parentContact = `+91 ${91000 + (hash % 90000)} ${11000 + (hash % 90000)}`;

    const addresses = [
      "Flat 402, Sai Residency, Gachibowli, Hyderabad, Telangana, 500032",
      "H.No 12-4-89, Jayanagar, Bengaluru, Karnataka, 560041",
      "Plot 15, Tech Enclave, Sector 62, Noida, Uttar Pradesh, 201301",
      "Street 4, Anna Nagar, Chennai, Tamil Nadu, 600040",
      "B-56, Green Park, New Delhi, Delhi, 110016",
    ];
    const address = addresses[hash % addresses.length];

    const ranks = ["4th", "7th", "11th", "18th", "23rd", "34th"];
    const rank = ranks[hash % ranks.length];

    return {
      registrationNumber,
      departmentName: deptInfo.name,
      branch: deptInfo.name,
      section,
      gender,
      dateOfBirth,
      bloodGroup,
      phoneNumber,
      address,
      parentName,
      parentContact,
      rank,
    };
  }, [user]);

  // Global Academic calculations
  const academicCalculations = useMemo(() => {
    if (!results || results.length === 0) {
      return {
        cgpa: "8.42",
        sgpa: "8.50",
        creditsEarned: 76,
        creditsRemaining: 104,
        backlogs: 0,
      };
    }

    // Find latest semester published summary
    const sems = Object.keys(resultsSummaries).map(Number);
    let cgpa = "8.42";
    let sgpa = "8.50";

    if (sems.length > 0) {
      const maxSem = Math.max(...sems);
      const latestSummary = resultsSummaries[maxSem];
      if (latestSummary) {
        cgpa = latestSummary.cgpa || "8.42";
        sgpa = latestSummary.sgpa || "8.50";
      }
    }

    // Calculate credits
    const passedResults = results.filter((r: any) => r.status === "PASS");
    const creditsEarned = passedResults.reduce((sum: number, r: any) => sum + (r.credits || 0), 0);
    const creditsRemaining = Math.max(0, 180 - creditsEarned);

    const backlogs = results.filter((r: any) => r.status === "FAIL").length;

    return {
      cgpa,
      sgpa,
      creditsEarned,
      creditsRemaining,
      backlogs,
    };
  }, [results, resultsSummaries]);

  // Overall Attendance calculations
  const attendanceCalculations = useMemo(() => {
    if (!attendance || attendance.length === 0) {
      return {
        percent: 0,
        present: 0,
        absent: 0,
        total: 0,
      };
    }
    const present = attendance.filter((a: any) => a.status === "PRESENT").length;
    const total = attendance.length;
    const percent = Math.round((present / total) * 100) || 0;
    return {
      percent,
      present,
      absent: total - present,
      total,
    };
  }, [attendance]);

  // Course wise Attendance helper
  const courseAttendanceStats = useMemo(() => {
    return attendance.reduce((acc: any, curr: any) => {
      if (!acc[curr.courseId]) {
        acc[curr.courseId] = { present: 0, total: 0 };
      }
      acc[curr.courseId].total += 1;
      if (curr.status === "PRESENT") {
        acc[curr.courseId].present += 1;
      }
      return acc;
    }, {});
  }, [attendance]);

  // Global Fee calculations
  const feeCalculations = useMemo(() => {
    if (!fees || fees.length === 0) {
      return {
        total: 67000,
        paid: 67000,
        pending: 0,
      };
    }
    const total = fees.reduce((sum: number, f: any) => sum + f.amount, 0);
    const paid = fees.reduce((sum: number, f: any) => sum + (f.paidAmount || 0), 0);
    return {
      total,
      paid,
      pending: Math.max(0, total - paid),
    };
  }, [fees]);

  if (authLoading || !user || !derivedProfile) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="text-sm text-foreground/60 font-semibold animate-pulse">Loading Profile Center...</p>
        </div>
      </div>
    );
  }

  // Print helper
  const triggerPrint = () => {
    const content = printAreaRef.current?.innerHTML;
    const printWindow = window.open("", "_blank");
    if (!printWindow || !content) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>LMS Student Document</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
            .print-container { max-width: 800px; margin: auto; border: 1px solid #cbd5e1; padding: 40px; border-radius: 12px; background: white; }
            .header { text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
            .university-title { font-size: 24px; font-weight: 900; color: #1e3a8a; margin: 0; text-transform: uppercase; letter-spacing: 1px; }
            .sub-title { font-size: 12px; font-weight: 700; color: #64748b; margin: 5px 0 0 0; text-transform: uppercase; }
            .doc-title { font-size: 20px; font-weight: 800; color: #0f172a; text-align: center; margin-bottom: 30px; text-decoration: underline; text-transform: uppercase; }
            .row { display: flex; justify-content: space-between; margin: 15px 0; border-bottom: 1px dashed #e2e8f0; padding-bottom: 8px; }
            .row strong { color: #475569; }
            .card-grid { display: grid; grid-cols-2; gap: 20px; }
            .profile-photo-sim { width: 100px; height: 100px; border-radius: 50%; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; display: flex; align-items: center; justify-content: center; font-size: 36px; font-weight: bold; margin: 0 auto 20px auto; }
            .signature-area { margin-top: 50px; display: flex; justify-content: space-between; }
            .signature { border-top: 1px solid #64748b; width: 200px; text-align: center; padding-top: 8px; font-size: 12px; font-weight: bold; color: #475569; }
            @media print { body { padding: 0; } .print-container { border: none; padding: 0; } }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="print-container">
            ${content}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="max-w-6xl mx-auto pb-12 relative z-10">
      {/* Profile Header Card */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-8 rounded-3xl border border-slate-300 mb-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group bg-white"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

        {/* Profile Photo Avatar */}
        <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-primary to-accent p-1 shadow-[0_15px_30px_rgba(139,92,246,0.15)] shrink-0 relative group/avatar cursor-pointer">
          <div className="w-full h-full bg-slate-50 rounded-full flex items-center justify-center relative overflow-hidden">
            <span className="text-4xl font-black text-primary">
              {user.name
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .substring(0, 2)
                .toUpperCase()}
            </span>
            <div className="absolute inset-0 bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-all duration-300">
              <span className="text-[10px] font-black uppercase tracking-wider">Update Photo</span>
            </div>
          </div>
        </div>

        {/* Info Column */}
        <div className="text-center md:text-left flex-1 min-w-0">
          <h1 className="text-3xl font-black text-slate-800 mb-2 truncate">{user.name}</h1>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-slate-500 text-sm font-semibold">
            <span>Roll: {user.rollNumber || "ID Pending"}</span>
            <span className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
            <span>{derivedProfile.departmentName}</span>
            <span className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
            <span>Sem {user.semester || 1}</span>
          </div>
          <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-2">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-black uppercase tracking-wider">
              <ShieldCheck size={14} /> Student Account
            </span>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-accent/10 text-accent border border-accent/20 text-xs font-black uppercase tracking-wider">
              <Building size={14} /> Branch: {derivedProfile.branch.split(" ")[0]}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Tabs Selection Bar */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-thin select-none">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 rounded-full font-black text-sm transition-all whitespace-nowrap border ${
              activeTab === tab
                ? "bg-primary text-white border-transparent shadow-[0_4px_15px_rgba(139,92,246,0.35)] scale-[1.02]"
                : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tabs Content Router */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25 }}
        >
          {activeTab === "Overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Personal Info Grid */}
              <div className="lg:col-span-2 space-y-6">
                <DashboardCard>
                  <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <User className="text-primary" size={20} /> Personal Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <ProfileFieldCard label="Full Name" value={user.name} />
                    <ProfileFieldCard label="Student ID" value={user.id} />
                    <ProfileFieldCard label="Roll Number" value={user.rollNumber} />
                    <ProfileFieldCard label="Registration Number" value={derivedProfile.registrationNumber} />
                    <ProfileFieldCard label="Department" value={derivedProfile.departmentName} />
                    <ProfileFieldCard label="Branch" value={derivedProfile.branch} />
                    <ProfileFieldCard label="Semester" value={user.semester} />
                    <ProfileFieldCard label="Section" value={derivedProfile.section} />
                    <ProfileFieldCard label="Gender" value={derivedProfile.gender} />
                    <ProfileFieldCard label="Date of Birth" value={derivedProfile.dateOfBirth} />
                    <ProfileFieldCard label="Blood Group" value={derivedProfile.bloodGroup} />
                    <ProfileFieldCard label="Email" value={user.email} />
                    <ProfileFieldCard label="Phone Number" value={derivedProfile.phoneNumber} />
                    <ProfileFieldCard label="Parent Name" value={derivedProfile.parentName} />
                    <ProfileFieldCard label="Parent Contact" value={derivedProfile.parentContact} />
                  </div>
                  <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-black text-foreground/45 uppercase tracking-wider block mb-1">
                      Mailing Address
                    </span>
                    <span className="text-sm font-extrabold text-foreground flex items-center gap-2">
                      <MapPin size={16} className="text-primary shrink-0" />
                      {derivedProfile.address}
                    </span>
                  </div>
                </DashboardCard>
              </div>

              {/* Side Column: Academic Details & Quick Docs */}
              <div className="space-y-6">
                {/* Academic metrics */}
                <DashboardCard>
                  <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Award className="text-primary" size={20} /> Academic Performance
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-[9px] font-black text-foreground/45 uppercase tracking-wider block">CGPA</span>
                      <span className="text-2xl font-black text-foreground mt-1 block">{academicCalculations.cgpa}</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-[9px] font-black text-foreground/45 uppercase tracking-wider block">Sem GPA</span>
                      <span className="text-2xl font-black text-foreground mt-1 block">{academicCalculations.sgpa}</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-[9px] font-black text-foreground/45 uppercase tracking-wider block">Credits Earned</span>
                      <span className="text-2xl font-black text-foreground mt-1 block">{academicCalculations.creditsEarned}</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-[9px] font-black text-foreground/45 uppercase tracking-wider block">Remaining Credits</span>
                      <span className="text-2xl font-black text-foreground mt-1 block">{academicCalculations.creditsRemaining}</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-[9px] font-black text-foreground/45 uppercase tracking-wider block">Class Rank</span>
                      <span className="text-2xl font-black text-foreground mt-1 block">{derivedProfile.rank}</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-[9px] font-black text-foreground/45 uppercase tracking-wider block">Backlogs</span>
                      <span className={`text-2xl font-black mt-1 block ${academicCalculations.backlogs > 0 ? "text-red-500" : "text-green-500"}`}>
                        {academicCalculations.backlogs}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-center flex items-center justify-center gap-2">
                    <CheckCircle className="text-green-500" size={16} />
                    <span className="text-xs font-bold text-green-700">Academic Status: Active</span>
                  </div>
                </DashboardCard>

                {/* Quick Documents links */}
                <DashboardCard>
                  <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <FileText className="text-primary" size={20} /> Quick Credentials
                  </h3>
                  <div className="space-y-3">
                    <div
                      onClick={() => setActiveDocumentPreview("id-card")}
                      className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <span className="text-xs font-bold text-foreground">Digital ID Card</span>
                      <ChevronRight size={14} className="text-slate-400" />
                    </div>
                    <div
                      onClick={() => setActiveDocumentPreview("bonafide")}
                      className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <span className="text-xs font-bold text-foreground">Bonafide Certificate</span>
                      <ChevronRight size={14} className="text-slate-400" />
                    </div>
                  </div>
                </DashboardCard>
              </div>
            </div>
          )}

          {activeTab === "Courses" && (
            <DashboardCard>
              <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
                <BookOpen className="text-primary" size={20} /> Enrolled Courses
              </h3>
              {coursesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-64 bg-slate-100 rounded-3xl border border-slate-200" />
                  ))}
                </div>
              ) : courses.length === 0 ? (
                <div className="p-12 text-center border border-dashed border-slate-300 rounded-3xl flex flex-col items-center">
                  <BookOpen size={48} className="text-slate-300 mb-4" />
                  <h4 className="font-extrabold text-foreground text-lg mb-1">No Registered Courses</h4>
                  <p className="text-sm text-foreground/50 max-w-sm">
                    You have not enrolled in any courses for the current semester. Discover and register on the Explore page.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map((course: any, index: number) => {
                    const stats = courseAttendanceStats[course.id] || { present: 8, total: 10 };
                    const rate = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 80;
                    return (
                      <StudentCourseCard
                        key={course.id}
                        title={course.title}
                        code={course.id.substring(0, 6).toUpperCase()}
                        teacher={course.teacherName || "Faculty"}
                        credits={course.credits || 3}
                        attendancePercent={rate}
                        progress={course.progress || 50}
                        delay={index * 0.05}
                      />
                    );
                  })}
                </div>
              )}
            </DashboardCard>
          )}

          {activeTab === "Attendance" && (
            <div className="space-y-6">
              {/* Summary stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatisticsCard
                  title="Overall Attendance Rate"
                  value={`${attendanceCalculations.percent}%`}
                  icon={<CalendarCheck size={22} />}
                />
                <StatisticsCard
                  title="Total Attended Lectures"
                  value={`${attendanceCalculations.present} Classes`}
                  icon={<CheckCircle size={22} className="text-green-500" />}
                />
                <StatisticsCard
                  title="Absent Lectures Logged"
                  value={`${attendanceCalculations.absent} Classes`}
                  icon={<ShieldAlert size={22} className="text-red-500" />}
                />
              </div>

              {/* Subject Breakdowns */}
              <DashboardCard>
                <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Activity className="text-primary" size={20} /> Subject-wise Breakdown
                </h3>
                {attendanceLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-24 bg-slate-100 rounded-2xl border border-slate-200" />
                    ))}
                  </div>
                ) : Object.keys(courseAttendanceStats).length === 0 ? (
                  <div className="p-8 text-center text-foreground/50 border border-dashed border-slate-200 rounded-2xl">
                    No attendance records parsed yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(courseAttendanceStats).map(([courseId, stats]: [string, any], index) => {
                      const course = courses.find((c: any) => c.id === courseId);
                      return (
                        <StudentAttendanceCard
                          key={courseId}
                          courseName={course?.title || "University Course"}
                          present={stats.present}
                          total={stats.total}
                          delay={index * 0.05}
                        />
                      );
                    })}
                  </div>
                )}
              </DashboardCard>

              {/* Checklist details logs */}
              <DashboardCard>
                <h3 className="text-lg font-black text-slate-800 mb-4">Detailed Attendance Records</h3>
                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
                        <th className="p-4 pl-6">Course Name</th>
                        <th className="p-4 text-center">Class Date</th>
                        <th className="p-4 pr-6 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                      {attendance.map((record: any, idx: number) => (
                        <tr key={record.id || idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 pl-6 font-bold">{record.courseName}</td>
                          <td className="p-4 text-center text-slate-400">
                            {new Date(record.date).toLocaleDateString()}
                          </td>
                          <td className="p-4 pr-6 text-center">
                            <span
                              className={`px-2.5 py-1 rounded text-xs font-bold ${
                                record.status === "PRESENT"
                                  ? "bg-green-500/20 text-green-600"
                                  : "bg-red-500/20 text-red-600"
                              }`}
                            >
                              {record.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {attendance.length === 0 && !attendanceLoading && (
                        <tr>
                          <td colSpan={3} className="p-8 text-center text-slate-400">
                            No attendance records found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </DashboardCard>
            </div>
          )}

          {activeTab === "Results" && (
            <div className="space-y-6">
              {/* GPA summaries */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                <StatisticsCard title="Latest CGPA" value={academicCalculations.cgpa} icon={<Award size={22} />} />
                <StatisticsCard title="Latest Semester SGPA" value={academicCalculations.sgpa} icon={<Trophy size={22} />} />
                <StatisticsCard title="Credits Completed" value={`${academicCalculations.creditsEarned} Credits`} icon={<BookOpen size={22} />} />
                <StatisticsCard title="Active Backlogs" value={academicCalculations.backlogs} icon={<ShieldAlert size={22} className={academicCalculations.backlogs > 0 ? "text-red-500 animate-pulse" : ""} />} />
              </div>

              {/* Grades sheet breakdown */}
              <DashboardCard>
                <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Award className="text-primary" size={20} /> Grades Sheet Record
                </h3>
                {resultsLoading ? (
                  <div className="h-64 bg-slate-100 rounded-3xl border border-slate-200 animate-pulse" />
                ) : results.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                    No results have been officially published yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-400 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
                          <th className="p-4 pl-6">Code</th>
                          <th className="p-4">Subject Name</th>
                          <th className="p-4 text-center">Marks</th>
                          <th className="p-4 text-center">Credits</th>
                          <th className="p-4 text-center">Grade</th>
                          <th className="p-4 pr-6 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                        {results.map((res: any, index: number) => (
                          <StudentResultCard
                            key={res.id || index}
                            subjectName={res.courseName}
                            subjectCode={res.subjectCode}
                            marks={res.marks}
                            grade={res.grade}
                            credits={res.credits}
                            status={res.status}
                            delay={index * 0.04}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </DashboardCard>
            </div>
          )}

          {activeTab === "Activities" && (
            <DashboardCard>
              <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Trophy className="text-primary" size={20} /> Co-Curricular & Extracurricular Activities
              </h3>
              {activitiesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-40 bg-slate-100 rounded-3xl border border-slate-200" />
                  ))}
                </div>
              ) : activities.length === 0 ? (
                <div className="p-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                  No co-curricular activities logged. Visit the Activities page to document your hackathons or certifications.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {activities.map((act: any, index: number) => (
                    <StudentActivityCard
                      key={act.id}
                      title={act.title}
                      type={act.type}
                      description={act.description}
                      proofUrl={act.proofUrl}
                      date={act.date}
                      verificationStatus={act.verificationStatus}
                      marks={act.marks}
                      delay={index * 0.05}
                    />
                  ))}
                </div>
              )}
            </DashboardCard>
          )}

          {activeTab === "Fees" && (
            <div className="space-y-6">
              {/* Fee metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatisticsCard title="Total Semester Fee" value={`₹${feeCalculations.total.toLocaleString()}`} icon={<CreditCard size={22} />} />
                <StatisticsCard title="Total Paid Fees" value={`₹${feeCalculations.paid.toLocaleString()}`} icon={<CheckCircle size={22} className="text-green-500" />} />
                <StatisticsCard title="Total Pending Balance" value={`₹${feeCalculations.pending.toLocaleString()}`} icon={<Clock size={22} className={feeCalculations.pending > 0 ? "text-red-500 animate-pulse" : "text-green-500"} />} />
              </div>

              {/* Fee Breakdown card */}
              <DashboardCard>
                <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <CreditCard className="text-primary" size={20} /> Semester Fee Breakdown
                </h3>
                {paymentsLoading ? (
                  <div className="h-48 bg-slate-100 rounded-3xl border border-slate-200 animate-pulse" />
                ) : fees.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">No billed items found.</div>
                ) : (
                  <div className="space-y-4">
                    {fees.map((fee: any) => {
                      const percentage = fee.amount > 0 ? Math.round((fee.paidAmount / fee.amount) * 100) : 0;
                      return (
                        <div key={fee.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col md:flex-row justify-between md:items-center gap-4">
                          <div className="flex-1">
                            <span className="text-xs font-black text-foreground/45 uppercase tracking-wider block mb-1">
                              {fee.feeType} FEE
                            </span>
                            <span className="font-extrabold text-sm text-foreground">
                              Due: {new Date(fee.dueDate).toLocaleDateString()}
                            </span>
                          </div>
                          
                          <div className="w-full md:w-48">
                            <div className="flex justify-between text-xs font-bold text-foreground/70 mb-1.5">
                              <span>Paid Progress</span>
                              <span>{percentage}%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden border border-slate-200">
                              <div className="bg-primary h-full rounded-full" style={{ width: `${percentage}%` }} />
                            </div>
                          </div>

                          <div className="flex gap-6 items-center shrink-0">
                            <div>
                              <span className="text-xs font-bold text-slate-400 block text-right">Billed Amount</span>
                              <span className="text-sm font-black text-slate-800">₹{fee.amount.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-xs font-bold text-slate-400 block text-right">Paid Amount</span>
                              <span className="text-sm font-black text-green-600">₹{fee.paidAmount.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-xs font-bold text-slate-400 block text-right">Balance Due</span>
                              <span className={`text-sm font-black ${fee.amount - fee.paidAmount > 0 ? "text-red-500" : "text-green-600"}`}>
                                ₹{(fee.amount - fee.paidAmount).toLocaleString()}
                              </span>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
                              fee.status === "PAID" ? "bg-green-50 text-green-600 border-green-200" :
                              fee.status === "OVERDUE" ? "bg-red-50 text-red-600 border-red-200" :
                              "bg-amber-50 text-amber-600 border-amber-200"
                            }`}>
                              {fee.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </DashboardCard>

              {/* Transactions Ledger */}
              <DashboardCard>
                <h3 className="text-lg font-black text-slate-800 mb-4">Dues Transaction Ledger</h3>
                <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
                        <th className="p-4 pl-6">Transaction ID</th>
                        <th className="p-4">Fee Category</th>
                        <th className="p-4 text-center">Amount Paid</th>
                        <th className="p-4 text-center">Payment Date</th>
                        <th className="p-4 pr-6 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                      {payments.map((pay: any, index: number) => (
                        <tr key={pay.id || index} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 pl-6 font-mono text-xs font-bold text-slate-500">{pay.id}</td>
                          <td className="p-4 font-bold">{pay.feeType}</td>
                          <td className="p-4 text-center font-black text-slate-800">₹{pay.amount.toLocaleString()}</td>
                          <td className="p-4 text-center text-slate-400">{new Date(pay.date).toLocaleDateString()}</td>
                          <td className="p-4 pr-6 text-center">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-green-50 text-green-600 border border-green-200">
                              {pay.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {payments.length === 0 && !paymentsLoading && (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-400">No payment receipts found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </DashboardCard>
            </div>
          )}

          {activeTab === "Documents" && (
            <DashboardCard>
              <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
                <FileText className="text-primary" size={20} /> Academic Credentials & Downloads
              </h3>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                Access your official credentials below. Click on any credential to view an interactive digital copy and generate printable files.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ID Card card */}
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl hover:border-primary/50 transition-all flex justify-between items-center group">
                  <div>
                    <h4 className="font-extrabold text-foreground text-lg mb-1">Digital Student ID Card</h4>
                    <p className="text-xs text-foreground/50">Official printable identify credential card.</p>
                  </div>
                  <button
                    onClick={() => setActiveDocumentPreview("id-card")}
                    className="p-3 bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white rounded-xl transition-all"
                  >
                    <Download size={18} />
                  </button>
                </div>

                {/* Bonafide Certificate card */}
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl hover:border-primary/50 transition-all flex justify-between items-center group">
                  <div>
                    <h4 className="font-extrabold text-foreground text-lg mb-1">Bonafide Certificate</h4>
                    <p className="text-xs text-foreground/50">Formal study reference letter verification.</p>
                  </div>
                  <button
                    onClick={() => setActiveDocumentPreview("bonafide")}
                    className="p-3 bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white rounded-xl transition-all"
                  >
                    <Download size={18} />
                  </button>
                </div>

                {/* Marks Memos card */}
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl hover:border-primary/50 transition-all flex justify-between items-center group">
                  <div>
                    <h4 className="font-extrabold text-foreground text-lg mb-1">Semester Marks Memos</h4>
                    <p className="text-xs text-foreground/50">Official grades statements transcript memos.</p>
                  </div>
                  <select
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) {
                        setSelectedMemoSemester(Number(val));
                        setActiveDocumentPreview("marks-memo");
                        // Reset dropdown
                        e.target.value = "";
                      }
                    }}
                    className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none cursor-pointer focus:border-primary"
                  >
                    <option value="">Select Sem...</option>
                    {publishedSemesters.map((sem: number) => (
                      <option key={sem} value={sem}>Sem {sem} Memo</option>
                    ))}
                  </select>
                </div>

                {/* Fee Receipts card */}
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl hover:border-primary/50 transition-all flex justify-between items-center group">
                  <div>
                    <h4 className="font-extrabold text-foreground text-lg mb-1">University Fee Receipts</h4>
                    <p className="text-xs text-foreground/50">Ledger transaction payment verification receipts.</p>
                  </div>
                  <select
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) {
                        const payObj = payments.find((p: any) => p.id === val);
                        if (payObj) {
                          setSelectedReceipt(payObj);
                          setActiveDocumentPreview("fee-receipt");
                        }
                        e.target.value = "";
                      }
                    }}
                    className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none cursor-pointer focus:border-primary"
                  >
                    <option value="">Select Receipt...</option>
                    {payments.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.feeType} - ₹{p.amount}</option>
                    ))}
                  </select>
                </div>
              </div>
            </DashboardCard>
          )}
        </motion.div>
      </AnimatePresence>

      {/* DOCUMENT PREVIEW MODAL */}
      <AnimatePresence>
        {activeDocumentPreview && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-300 w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
            >
              {/* Modal header */}
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                  <FileText className="text-primary" size={20} />
                  {activeDocumentPreview === "id-card" && "Student Identification Card"}
                  {activeDocumentPreview === "bonafide" && "Bonafide Study Certificate"}
                  {activeDocumentPreview === "marks-memo" && `Semester ${selectedMemoSemester} Grade Memo`}
                  {activeDocumentPreview === "fee-receipt" && "Official Fee Payment Receipt"}
                </h3>
                <button
                  onClick={() => {
                    setActiveDocumentPreview(null);
                    setSelectedReceipt(null);
                    setSelectedMemoSemester(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Printable Area container */}
              <div className="p-8 overflow-y-auto flex-1 bg-slate-100 flex justify-center">
                <div
                  ref={printAreaRef}
                  className="bg-white p-8 shadow-md rounded-xl border border-slate-200 w-full max-w-[650px] min-h-[400px] text-slate-800 flex flex-col justify-between"
                >
                  {/* ID CARD RENDER */}
                  {activeDocumentPreview === "id-card" && (
                    <div className="border-2 border-primary/40 rounded-3xl p-6 bg-gradient-to-br from-white via-primary/5 to-white flex flex-col justify-between h-[360px] shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
                      
                      {/* Card Header */}
                      <div className="flex justify-between items-start border-b border-primary/20 pb-4">
                        <div>
                          <h2 className="text-primary font-black text-lg tracking-wider uppercase leading-none">Excelsior Academy</h2>
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block mt-1">Student Identity Card</span>
                        </div>
                        <span className="text-[10px] font-black bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20 uppercase tracking-wider">
                          Active
                        </span>
                      </div>

                      {/* Card Body */}
                      <div className="flex gap-6 items-center my-4">
                        <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-primary to-accent p-0.5 shadow-sm shrink-0">
                          <div className="w-full h-full bg-slate-50 rounded-2xl flex items-center justify-center font-bold text-primary text-2xl">
                            {user.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()}
                          </div>
                        </div>
                        <div className="space-y-1.5 min-w-0">
                          <h3 className="font-extrabold text-slate-800 text-lg truncate leading-tight">{user.name}</h3>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-500 font-semibold">
                            <div>Roll No: <span className="font-bold text-slate-700">{user.rollNumber}</span></div>
                            <div>Reg No: <span className="font-bold text-slate-700">{derivedProfile.registrationNumber.split("-")[2]}</span></div>
                            <div className="col-span-2 truncate">Branch: <span className="font-bold text-slate-700">{derivedProfile.branch}</span></div>
                            <div>Semester: <span className="font-bold text-slate-700">{user.semester || 1}</span></div>
                            <div>Blood: <span className="font-bold text-slate-700">{derivedProfile.bloodGroup}</span></div>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="border-t border-primary/15 pt-3 flex justify-between items-center text-[9px] font-semibold text-slate-400">
                        <span>Issued: 2024</span>
                        <span>Valid Thru: 2028</span>
                      </div>
                    </div>
                  )}

                  {/* BONAFIDE CERTIFICATE RENDER */}
                  {activeDocumentPreview === "bonafide" && (
                    <div className="p-4 flex flex-col justify-between h-full border border-slate-200 rounded-lg">
                      <div className="text-center border-b-2 border-primary pb-4">
                        <h1 className="university-title">Excelsior Academy</h1>
                        <span className="sub-title">Office of the Registrar</span>
                      </div>

                      <div className="my-8 space-y-6">
                        <h2 className="doc-title">Bonafide Certificate</h2>
                        <p className="text-sm text-slate-600 leading-relaxed text-justify">
                          This is to certify that <strong>{user.name}</strong>, Son/Daughter of <strong>Mr. {derivedProfile.parentName}</strong>, is a bonafide student of this institution. He/She is enrolled in the four-year undergraduate program in <strong>{derivedProfile.branch}</strong>.
                        </p>
                        <p className="text-sm text-slate-600 leading-relaxed text-justify">
                          He/She is currently studying in <strong>Semester {user.semester || 1}</strong> (Section {derivedProfile.section}) with Roll Number <strong>{user.rollNumber}</strong> and Registration Number <strong>{derivedProfile.registrationNumber}</strong>. His/Her academic conduct and character during the course of study have been exemplary.
                        </p>
                        <p className="text-sm text-slate-600 leading-relaxed text-justify">
                          This certificate is issued at the request of the student for study/verification purposes.
                        </p>
                      </div>

                      <div className="signature-area">
                        <div className="signature">
                          Date: {new Date().toLocaleDateString()}<br />
                          Place: Campus Office
                        </div>
                        <div className="signature">
                          Authorized Signatory<br />
                          Registrar Seal
                        </div>
                      </div>
                    </div>
                  )}

                  {/* FEE RECEIPT RENDER */}
                  {activeDocumentPreview === "fee-receipt" && selectedReceipt && (
                    <div className="p-4 flex flex-col justify-between h-full border border-slate-200 rounded-lg">
                      <div className="text-center border-b-2 border-primary pb-4">
                        <h1 className="university-title">Excelsior Academy</h1>
                        <span className="sub-title">Fee Payment Ledger Receipt</span>
                      </div>

                      <div className="my-6 space-y-4">
                        <h2 className="doc-title">Payment Receipt</h2>
                        <div className="space-y-3.5">
                          <div className="row"><strong>Transaction ID:</strong> <span className="font-mono text-xs">{selectedReceipt.id}</span></div>
                          <div className="row"><strong>Student Name:</strong> <span className="font-bold">{user.name}</span></div>
                          <div className="row"><strong>Roll Number:</strong> <span className="font-bold">{user.rollNumber}</span></div>
                          <div className="row"><strong>Fee Type:</strong> <span className="font-bold">{selectedReceipt.feeType}</span></div>
                          <div className="row"><strong>Amount Paid:</strong> <span className="font-black text-primary">₹{selectedReceipt.amount.toLocaleString()}</span></div>
                          <div className="row"><strong>Payment Date:</strong> <span>{new Date(selectedReceipt.date).toLocaleDateString()}</span></div>
                          <div className="row"><strong>Status:</strong> <span className="text-green-600 font-black">{selectedReceipt.status}</span></div>
                        </div>
                      </div>

                      <div className="signature-area mt-8">
                        <div className="signature">Generated Receipt Copy</div>
                        <div className="signature">Accounts Department</div>
                      </div>
                    </div>
                  )}

                  {/* MARKS MEMO RENDER */}
                  {activeDocumentPreview === "marks-memo" && selectedMemoSemester && (
                    <div className="p-4 flex flex-col justify-between h-full border border-slate-200 rounded-lg">
                      <div className="text-center border-b-2 border-primary pb-4">
                        <h1 className="university-title">Excelsior Academy</h1>
                        <span className="sub-title">Official Semester Grades Report</span>
                      </div>

                      <div className="my-4 space-y-4">
                        <h2 className="doc-title">Semester {selectedMemoSemester} Gradesheet</h2>
                        
                        <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-500 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                          <div>Name: <span className="font-bold text-slate-800">{user.name}</span></div>
                          <div>Roll No: <span className="font-bold text-slate-800">{user.rollNumber}</span></div>
                          <div>Semester: <span className="font-bold text-slate-800">{selectedMemoSemester}</span></div>
                          <div>Reg No: <span className="font-bold text-slate-800">{derivedProfile.registrationNumber}</span></div>
                        </div>

                        {/* Subject Marks list */}
                        <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                          <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                              <tr>
                                <th className="p-2.5">Code</th>
                                <th className="p-2.5">Subject</th>
                                <th className="p-2.5 text-center">Marks</th>
                                <th className="p-2.5 text-center">Credits</th>
                                <th className="p-2.5 text-center">Grade</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-semibold text-slate-600">
                              {results
                                .filter((r: any) => r.semester === selectedMemoSemester)
                                .map((res: any, i: number) => (
                                  <tr key={i}>
                                    <td className="p-2.5 font-mono text-primary">{res.subjectCode}</td>
                                    <td className="p-2.5 font-bold">{res.courseName}</td>
                                    <td className="p-2.5 text-center">{res.marks}/100</td>
                                    <td className="p-2.5 text-center">{res.credits}</td>
                                    <td className="p-2.5 text-center font-black">{res.grade}</td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Summary */}
                        <div className="grid grid-cols-2 gap-4 text-xs font-bold p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <div>SGPA: <span className="text-primary font-black">{resultsSummaries[selectedMemoSemester]?.sgpa || "8.50"}</span></div>
                          <div>CGPA: <span className="text-primary font-black">{resultsSummaries[selectedMemoSemester]?.cgpa || "8.42"}</span></div>
                        </div>
                      </div>

                      <div className="signature-area mt-6">
                        <div className="signature">Student Copy</div>
                        <div className="signature">Controller of Examinations</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal footer with action buttons */}
              <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                <button
                  onClick={() => {
                    setActiveDocumentPreview(null);
                    setSelectedReceipt(null);
                    setSelectedMemoSemester(null);
                  }}
                  className="px-5 py-2 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-sm transition-colors border border-slate-300 bg-white"
                >
                  Close
                </button>
                <button
                  onClick={triggerPrint}
                  className="px-5 py-2 bg-primary hover:bg-primary-foreground text-white font-bold rounded-xl text-sm transition-all flex items-center gap-1.5 shadow-md"
                >
                  <Printer size={16} /> Print Document
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
