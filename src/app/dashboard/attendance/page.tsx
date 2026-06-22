"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Check, X, Clock, ChevronLeft, ChevronRight, Sparkles, CalendarDays } from "lucide-react";

const getActiveMonthsForSemester = (sem: number, joiningYear: number): { month: number; year: number }[] => {
  if (sem === 1) {
    return [
      { month: 6, year: joiningYear },
      { month: 7, year: joiningYear },
      { month: 8, year: joiningYear },
      { month: 9, year: joiningYear },
      { month: 10, year: joiningYear },
      { month: 11, year: joiningYear },
    ];
  } else if (sem === 2) {
    return [
      { month: 0, year: joiningYear + 1 },
      { month: 1, year: joiningYear + 1 },
      { month: 2, year: joiningYear + 1 },
      { month: 3, year: joiningYear + 1 },
      { month: 4, year: joiningYear + 1 },
      { month: 5, year: joiningYear + 1 },
    ];
  } else if (sem % 2 !== 0) { // 3, 5, 7
    const yearOffset = Math.floor(sem / 2);
    return [
      { month: 6, year: joiningYear + yearOffset },
      { month: 7, year: joiningYear + yearOffset },
      { month: 8, year: joiningYear + yearOffset },
      { month: 9, year: joiningYear + yearOffset },
      { month: 10, year: joiningYear + yearOffset },
    ];
  } else { // 4, 6, 8
    const prevYearOffset = Math.floor((sem - 1) / 2);
    const currYearOffset = Math.floor(sem / 2);
    return [
      { month: 11, year: joiningYear + prevYearOffset },
      { month: 0, year: joiningYear + currYearOffset },
      { month: 1, year: joiningYear + currYearOffset },
      { month: 2, year: joiningYear + currYearOffset },
      { month: 3, year: joiningYear + currYearOffset },
    ];
  }
};

export default function AttendancePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["attendance"],
    queryFn: async () => {
      const res = await fetch("/api/student/attendance");
      if (!res.ok) throw new Error("Failed to fetch attendance");
      return res.json();
    },
  });

  const { data: authData, isLoading: isAuthLoading } = useQuery({
    queryKey: ["authMe"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) throw new Error("Unauthorized");
      return res.json();
    },
  });

  const { data: enrolledData, isLoading: isEnrolledLoading } = useQuery({
    queryKey: ["enrolledCourses"],
    queryFn: async () => {
      const res = await fetch("/api/courses/enrolled");
      if (!res.ok) throw new Error("Failed to fetch enrolled courses");
      return res.json();
    },
  });

  const user = authData?.data?.user;
  const semester = user?.semester || 1;

  const enrolledCourses = React.useMemo(() => {
    const courses = enrolledData?.data?.courses || [];
    return courses.filter((c: any) => c.semester === semester);
  }, [enrolledData, semester]);
  const isOddSemester = semester % 2 !== 0;

  const joiningYear = React.useMemo(() => {
    const currentRealYear = new Date().getFullYear(); // 2026
    return currentRealYear - Math.floor(semester / 2);
  }, [semester]);

  const semYear = React.useMemo(() => {
    return joiningYear + Math.floor(semester / 2);
  }, [joiningYear, semester]);

  const activeMonths = React.useMemo(() => {
    return getActiveMonthsForSemester(semester, joiningYear);
  }, [semester, joiningYear]);

  const attendance = data?.data?.attendance || [];
  const presentCount = attendance.filter((a: any) => a.status === "PRESENT").length;
  const percentage = attendance.length ? Math.round((presentCount / attendance.length) * 100) : 0;

  // Calendar State
  const [activeMonthIndex, setActiveMonthIndex] = React.useState(0);
  const [selectedDate, setSelectedDate] = React.useState<Date>(() => new Date());

  const currentMonth = React.useMemo(() => {
    return activeMonths[activeMonthIndex]?.month ?? new Date().getMonth();
  }, [activeMonths, activeMonthIndex]);

  const currentYear = React.useMemo(() => {
    return activeMonths[activeMonthIndex]?.year ?? new Date().getFullYear();
  }, [activeMonths, activeMonthIndex]);

  // Align calendar with active semester months and correct year
  React.useEffect(() => {
    if (user && activeMonths.length > 0) {
      const today = new Date();
      const todayMonth = today.getMonth();
      const todayYear = today.getFullYear();
      
      const todayIndex = activeMonths.findIndex(
        m => m.month === todayMonth && m.year === todayYear
      );

      if (todayIndex !== -1) {
        setActiveMonthIndex(todayIndex);
        setSelectedDate(today);
      } else {
        setActiveMonthIndex(0);
        setSelectedDate(new Date(activeMonths[0].year, activeMonths[0].month, 1));
      }
    }
  }, [user, activeMonths]);

  // Comprehensive Government & Public Holidays list in year-neutral MM-DD format
  const PUBLIC_HOLIDAYS = React.useMemo<Record<string, string>>(() => ({
    "01-01": "New Year's Day",
    "01-26": "Republic Day",
    "02-15": "Maha Shivratri",
    "03-04": "Holi",
    "03-20": "Eid al-Fitr",
    "04-03": "Good Friday",
    "04-14": "Dr. Ambedkar Jayanti",
    "04-25": "Ram Navami",
    "05-01": "May Day / Labor Day",
    "05-25": "Memorial Day",
    "05-27": "Eid al-Adha",
    "06-26": "Muharram",
    "07-04": "Independence Day",
    "08-15": "Independence Day (National Holiday)",
    "08-28": "Raksha Bandhan",
    "09-04": "Janmashtami",
    "09-07": "Labor Day",
    "09-15": "Eid-e-Milad",
    "10-02": "Gandhi Jayanti",
    "10-20": "Dussehra",
    "11-08": "Diwali",
    "11-24": "Guru Nanak Jayanti",
    "12-25": "Christmas Day"
  }), []);

  // Timezone-safe formatting to YYYY-MM-DD
  const formatDateKey = React.useCallback((date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const isHoliday = React.useCallback((date: Date) => {
    const day = date.getDay();
    if (day === 0 || day === 6) return true; // Weekend
    const monthDay = `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return monthDay in PUBLIC_HOLIDAYS;
  }, [PUBLIC_HOLIDAYS]);

  const getHolidayName = React.useCallback((date: Date) => {
    const day = date.getDay();
    const monthDay = `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    if (monthDay in PUBLIC_HOLIDAYS) return PUBLIC_HOLIDAYS[monthDay];
    if (day === 0) return "Sunday (Weekend)";
    if (day === 6) return "Saturday (Weekend)";
    return "Academic Holiday";
  }, [PUBLIC_HOLIDAYS]);

  // Group attendance by date key
  const attendanceMap = React.useMemo(() => {
    const map: Record<string, any[]> = {};
    attendance.forEach((record: any) => {
      if (!record.date) return;
      const key = formatDateKey(new Date(record.date));
      if (!map[key]) {
        map[key] = [];
      }
      map[key].push(record);
    });
    return map;
  }, [attendance, formatDateKey]);

  const getDayStatus = React.useCallback((date: Date) => {
    const key = formatDateKey(date);
    const records = attendanceMap[key];

    if (records && records.length > 0) {
      const hasAbsent = records.some((r) => r.status === "ABSENT");
      return hasAbsent ? "ABSENT" : "PRESENT";
    }

    if (isHoliday(date)) {
      return "HOLIDAY";
    }

    return "NONE";
  }, [attendanceMap, isHoliday, formatDateKey]);

  const monthNames = React.useMemo(() => [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ], []);

  // Number of days in currentMonth of currentYear
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  // First day of the month (0 = Sunday, 1 = Monday, etc.)
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  // Generate all dates to display in the grid
  const calendarDays = React.useMemo(() => {
    const dates: (Date | null)[] = [];
    // Fill leading empty cells
    for (let i = 0; i < firstDayIndex; i++) {
      dates.push(null);
    }
    // Fill days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      dates.push(new Date(currentYear, currentMonth, i));
    }
    return dates;
  }, [currentYear, currentMonth, firstDayIndex, daysInMonth]);

  // Monthly stats calculation
  const monthlyStats = React.useMemo(() => {
    let present = 0;
    let absent = 0;
    let holidays = 0;
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const status = getDayStatus(date);
      if (status === "PRESENT") present++;
      else if (status === "ABSENT") absent++;
      else if (status === "HOLIDAY") holidays++;
    }
    
    const totalAcademicDays = present + absent;
    const rate = totalAcademicDays > 0 ? Math.round((present / totalAcademicDays) * 100) : 100;
    
    return { present, absent, holidays, rate };
  }, [currentYear, currentMonth, daysInMonth, getDayStatus]);

  const prevMonth = () => {
    if (activeMonthIndex > 0) {
      setActiveMonthIndex(prev => prev - 1);
    }
  };

  const nextMonth = () => {
    if (activeMonthIndex < activeMonths.length - 1) {
      setActiveMonthIndex(prev => prev + 1);
    }
  };

  const jumpToToday = () => {
    const today = new Date();
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();

    const todayIndex = activeMonths.findIndex(
      m => m.month === todayMonth && m.year === todayYear
    );

    if (todayIndex !== -1) {
      setActiveMonthIndex(todayIndex);
      setSelectedDate(today);
    } else if (activeMonths.length > 0) {
      setActiveMonthIndex(0);
      setSelectedDate(new Date(activeMonths[0].year, activeMonths[0].month, 1));
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  // Semester Progress Calculation
  const semesterStart = React.useMemo(() => {
    if (activeMonths.length === 0) return new Date();
    const first = activeMonths[0];
    return new Date(first.year, first.month, 1, 0, 0, 0);
  }, [activeMonths]);

  const semesterEnd = React.useMemo(() => {
    if (activeMonths.length === 0) return new Date();
    const last = activeMonths[activeMonths.length - 1];
    return new Date(last.year, last.month + 1, 0, 23, 59, 59);
  }, [activeMonths]);

  const today = new Date();
  
  const totalSemesterDays = Math.ceil((semesterEnd.getTime() - semesterStart.getTime()) / (1000 * 60 * 60 * 24));
  const elapsedDays = Math.max(0, Math.ceil((today.getTime() - semesterStart.getTime()) / (1000 * 60 * 60 * 24)));
  const semesterProgress = Math.min(100, Math.round((elapsedDays / totalSemesterDays) * 100));

  // Subject-wise Breakdown
  const courseStats = React.useMemo(() => {
    const stats: Record<string, { present: number; total: number }> = {};
    
    // Initialize with only current semester enrolled courses
    enrolledCourses.forEach((course: any) => {
      if (course.title) {
        stats[course.title] = { present: 0, total: 0 };
      }
    });

    // Populate with actual attendance records only if they belong to current semester courses
    attendance.forEach((curr: any) => {
      if (curr.courseName && stats[curr.courseName] !== undefined) {
        stats[curr.courseName].total += 1;
        if (curr.status === "PRESENT") {
          stats[curr.courseName].present += 1;
        }
      }
    });

    return stats;
  }, [enrolledCourses, attendance]);

  return (
    <div className="max-w-4xl mx-auto pb-12 relative z-10">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-3">
          <Calendar size={32} /> Attendance Tracker
        </h1>
        <p className="text-foreground/70">Track your course attendance and overall presence.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 flex flex-col items-center text-center justify-center">
          <h2 className="text-xl font-bold text-foreground mb-4">Semester Progress</h2>
          <div className="w-full bg-slate-100 rounded-full h-4 mb-2 overflow-hidden border border-slate-300">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${semesterProgress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="bg-primary h-full rounded-full"
            />
          </div>
          <div className="flex justify-between w-full text-xs text-foreground/50 font-semibold uppercase tracking-wider mt-2">
            <span>{semesterStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
            <span className="text-primary">{semesterProgress}% Elapsed</span>
            <span>{semesterEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
          </div>
          <p className="text-sm mt-4 text-foreground/70">
            Day {Math.min(elapsedDays, totalSemesterDays)} of {totalSemesterDays}
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 flex items-center gap-8 justify-center">
          <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" className="stroke-slate-200" strokeWidth="10" />
              <motion.circle
                initial={{ strokeDashoffset: 251 }}
                animate={{ strokeDashoffset: 251 - (251 * percentage) / 100 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                cx="50" cy="50" r="40" fill="none" className="stroke-primary" strokeWidth="10"
                strokeDasharray="251"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-primary">{percentage}%</span>
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Overall Attendance</h2>
            <p className="text-foreground/60 mt-2 text-sm leading-relaxed">
              You've been present for {presentCount} out of {attendance.length} recorded sessions across all subjects.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200 mb-8">
        <h2 className="text-xl font-bold text-foreground mb-6">Subject Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(courseStats).map(([course, stats]: [string, any], index) => {
            const coursePercent = Math.round((stats.present / stats.total) * 100) || 0;
            return (
              <motion.div 
                key={course}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-slate-100 p-4 rounded-2xl border border-slate-200"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-sm truncate pr-4">{course}</span>
                  <span className={`font-bold text-sm ${coursePercent >= 75 ? 'text-green-600' : 'text-orange-600'}`}>
                    {coursePercent}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${coursePercent}%` }}
                    transition={{ duration: 1 }}
                    className={`h-full rounded-full ${coursePercent >= 75 ? 'bg-green-500' : 'bg-orange-500'}`}
                  />
                </div>
                <p className="text-xs text-foreground/50 mt-2 text-right">
                  {stats.present} / {stats.total} sessions
                </p>
              </motion.div>
            );
          })}
          {Object.keys(courseStats).length === 0 && !isLoading && !isEnrolledLoading && (
            <p className="text-sm text-foreground/50 col-span-2 text-center py-4">No subjects data available.</p>
          )}
        </div>
      </div>

      <h2 className="text-xl font-bold text-foreground mb-4 pl-2 flex items-center gap-2">
        <CalendarDays className="text-primary" size={24} /> Attendance Calendar
      </h2>

      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200">
        {isLoading || isAuthLoading || isEnrolledLoading || !user ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-foreground/60 animate-pulse font-medium">Loading attendance data...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Side: Calendar Grid */}
            <div className="lg:col-span-7 flex flex-col">
              {/* Header Navigation */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-foreground capitalize">
                    {monthNames[currentMonth]} {currentYear}
                  </h3>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={prevMonth}
                    disabled={activeMonthIndex === 0}
                    className={`p-2 rounded-xl border border-slate-200 transition-colors text-foreground ${
                      activeMonthIndex === 0
                        ? "opacity-40 cursor-not-allowed bg-slate-50"
                        : "hover:bg-slate-100"
                    }`}
                    title="Previous Month"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={jumpToToday}
                    className="px-3 py-1 text-xs font-bold rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors text-foreground"
                  >
                    Today
                  </button>
                  <button
                    onClick={nextMonth}
                    disabled={activeMonthIndex === activeMonths.length - 1}
                    className={`p-2 rounded-xl border border-slate-200 transition-colors text-foreground ${
                      activeMonthIndex === activeMonths.length - 1
                        ? "opacity-40 cursor-not-allowed bg-slate-50"
                        : "hover:bg-slate-100"
                    }`}
                    title="Next Month"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Weekday Labels */}
              <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-foreground/40 uppercase tracking-wider">
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((dayDate, index) => {
                  if (!dayDate) {
                    return <div key={`empty-${index}`} className="aspect-square" />;
                  }

                  const status = getDayStatus(dayDate);
                  const isTodayCell = isToday(dayDate);
                  const isSelected = selectedDate && formatDateKey(selectedDate) === formatDateKey(dayDate);
                  const dayNum = dayDate.getDate();

                  // Dynamic styles based on status - medium-light color schemes
                  let statusClasses = "bg-slate-100 hover:bg-slate-200 border border-slate-200/80 text-slate-700";

                  if (status === "PRESENT") {
                    statusClasses = "bg-green-200 hover:bg-green-300 border border-green-400 text-green-900 font-semibold";
                  } else if (status === "ABSENT") {
                    statusClasses = "bg-red-200 hover:bg-red-300 border border-red-400 text-red-900 font-semibold";
                  } else if (status === "HOLIDAY") {
                    statusClasses = "bg-orange-100 hover:bg-orange-200 border border-orange-300 text-orange-800 font-semibold";
                  }

                  return (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      key={`day-${formatDateKey(dayDate)}`}
                      onClick={() => setSelectedDate(dayDate)}
                      className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center transition-all ${statusClasses} ${
                        isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
                      } ${isTodayCell ? "border-2 border-primary" : ""}`}
                    >
                      <span className="text-sm">{dayNum}</span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Color Legend */}
              <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t border-slate-200 text-xs text-foreground/70 justify-center lg:justify-start">
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-md bg-green-200 border border-green-400" />
                  <span>Present</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-md bg-red-200 border border-red-400" />
                  <span>Absent</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-md bg-orange-100 border border-orange-300" />
                  <span>Holiday</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-md bg-slate-100 border border-slate-200" />
                  <span>No Record</span>
                </div>
              </div>
            </div>

            {/* Right Side: Day Details & Month Summary */}
            <div className="lg:col-span-5 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-slate-200 lg:pl-8 pt-6 lg:pt-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedDate ? formatDateKey(selectedDate) : "empty"}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div>
                    <h3 className="text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1">
                      Day Details
                    </h3>
                    <h4 className="text-base font-bold text-foreground">
                      {selectedDate.toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </h4>
                  </div>

                  <div className="space-y-3 min-h-[160px]">
                    {(() => {
                      const key = formatDateKey(selectedDate);
                      const records = attendanceMap[key] || [];
                      const dayStatus = getDayStatus(selectedDate);

                      if (records.length > 0) {
                        return records.map((record: any) => (
                          <div
                            key={record.id}
                            className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/50 transition-colors"
                          >
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-sm text-foreground/80 truncate max-w-[200px]">
                                {record.courseName}
                              </span>
                              {record.startTime && record.endTime && (
                                <span className="text-[10px] text-slate-400 font-semibold mt-0.5 flex items-center gap-1">
                                  <Clock size={10} className="text-slate-400" />
                                  {record.startTime} - {record.endTime} • {record.sessionType}
                                </span>
                              )}
                            </div>
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold shrink-0 ${
                                record.status === "PRESENT"
                                  ? "bg-green-200 text-green-800 border border-green-300"
                                  : record.status === "ABSENT"
                                  ? "bg-red-200 text-red-800 border border-red-300"
                                  : "bg-orange-100 text-orange-700 border border-orange-200"
                              }`}
                            >
                              {record.status === "PRESENT" && <Check size={12} />}
                              {record.status === "ABSENT" && <X size={12} />}
                              {record.status === "LATE" && <Clock size={12} />}
                              {record.status}
                            </span>
                          </div>
                        ));
                      }

                      if (dayStatus === "HOLIDAY") {
                        const hName = getHolidayName(selectedDate);
                        return (
                          <div className="flex flex-col items-center justify-center py-8 text-center bg-orange-500/5 border border-orange-500/10 rounded-2xl p-4">
                            <span className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-600 mb-2">
                              <Sparkles size={20} />
                            </span>
                            <span className="font-bold text-sm text-orange-700">{hName}</span>
                            <span className="text-xs text-orange-600/70 mt-1">
                              No academic classes scheduled.
                            </span>
                          </div>
                        );
                      }

                      // Check future/past status
                      const todayZero = new Date();
                      todayZero.setHours(0, 0, 0, 0);
                      const selectedZero = new Date(selectedDate);
                      selectedZero.setHours(0, 0, 0, 0);

                      if (selectedZero > todayZero) {
                        return (
                          <div className="flex flex-col items-center justify-center py-8 text-center text-foreground/40 border border-dashed border-slate-200 rounded-2xl p-4">
                            <span className="text-xs">Future Date</span>
                            <span className="text-xs mt-1">
                              No attendance recorded yet.
                            </span>
                          </div>
                        );
                      }

                      return (
                        <div className="flex flex-col items-center justify-center py-8 text-center text-foreground/40 border border-dashed border-slate-200 rounded-2xl p-4">
                          <span className="text-xs">No Scheduled Classes</span>
                          <span className="text-xs mt-1">
                            No attendance records for this weekday.
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Monthly Summary mini-widget */}
              <div className="mt-6 pt-6 border-t border-slate-200">
                <h4 className="text-xs font-bold text-foreground/40 uppercase tracking-wider mb-3">
                  Monthly Summary
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-green-50 border border-green-200 rounded-2xl p-3 text-center">
                    <span className="block text-2xl font-bold text-green-700">
                      {monthlyStats.present}
                    </span>
                    <span className="text-[10px] font-semibold text-foreground/50 uppercase tracking-wider">
                      Present
                    </span>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-center">
                    <span className="block text-2xl font-bold text-red-700">
                      {monthlyStats.absent}
                    </span>
                    <span className="text-[10px] font-semibold text-foreground/50 uppercase tracking-wider">
                      Absent
                    </span>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-2xl p-3 text-center">
                    <span className="block text-2xl font-bold text-orange-700">
                      {monthlyStats.holidays}
                    </span>
                    <span className="text-[10px] font-semibold text-foreground/50 uppercase tracking-wider">
                      Holidays
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between bg-slate-50 border border-slate-100 rounded-2xl p-3 text-xs font-semibold text-foreground/60">
                  <span>Month Attendance Rate:</span>
                  <span className="text-primary font-bold text-sm">
                    {monthlyStats.rate}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
