import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, courses, enrollments, materials, materialProgress, assignments, submissions, courseFaculty, quizzes, quizSubmissions, classSessions, attendance, results } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq, sql, inArray, and, isNull, desc } from "drizzle-orm";

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return errorResponse("Unauthorized", 401);
    }

    const payload = await verifyJwt(token);

    if (!payload) {
      return errorResponse("Invalid token", 401);
    }

    const { id, role } = payload;
    let stats: any = {};

    if (role === "ADMIN") {
      const [totalUsersRes] = await db.select({ count: sql<number>`count(*)::int` }).from(users);
      const [totalCoursesRes] = await db.select({ count: sql<number>`count(*)::int` }).from(courses);
      const [totalEnrollmentsRes] = await db.select({ count: sql<number>`count(*)::int` }).from(enrollments);
      
      const platformGrowth = await db
        .select({
          name: sql<string>`to_char(${users.createdAt}, 'Mon')`,
          value: sql<number>`count(*)::int`,
        })
        .from(users)
        .groupBy(sql`to_char(${users.createdAt}, 'Mon'), extract(month from ${users.createdAt})`)
        .orderBy(sql`extract(month from ${users.createdAt})`);

      const enrollmentTrends = await db
        .select({
          name: sql<string>`to_char(${enrollments.createdAt}, 'Mon')`,
          value: sql<number>`count(*)::int`,
        })
        .from(enrollments)
        .groupBy(sql`to_char(${enrollments.createdAt}, 'Mon'), extract(month from ${enrollments.createdAt})`)
        .orderBy(sql`extract(month from ${enrollments.createdAt})`);
      
      stats = {
        totalUsers: totalUsersRes?.count || 0,
        totalCourses: totalCoursesRes?.count || 0,
        totalEnrollments: totalEnrollmentsRes?.count || 0,
        platformGrowth,
        enrollmentTrends
      };
    } else if (role === "TEACHER") {
      // Find all courseFaculty IDs and course IDs for this teacher that have enrollments
      const teacherFaculties = await db
        .select({
          cfId: courseFaculty.id,
          courseId: courseFaculty.courseId
        })
        .from(courseFaculty)
        .innerJoin(enrollments, eq(enrollments.courseFacultyId, courseFaculty.id))
        .where(eq(courseFaculty.teacherId, id as string))
        .groupBy(courseFaculty.id, courseFaculty.courseId);

      const cfIds = teacherFaculties.map(f => f.cfId);
      const courseIds = Array.from(new Set(teacherFaculties.map(f => f.courseId)));

      if (cfIds.length === 0) {
        stats = {
          coursesCreated: 0,
          totalStudentsEnrolled: 0,
          studentEnrollmentHistory: [],
          coursePopularity: [],
          totalAssignments: 0,
          pendingEvaluations: 0,
          assignmentCompletionData: [],
          quizPerformanceData: [],
          attendanceTrendsData: [],
        };
      } else {
        stats.coursesCreated = courseIds.length;

        const [totalStudentsRes] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(enrollments)
          .where(inArray(enrollments.courseFacultyId, cfIds));
        stats.totalStudentsEnrolled = totalStudentsRes?.count || 0;

        const [totalAssignmentsRes] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(assignments)
          .where(inArray(assignments.courseId, courseIds));
        stats.totalAssignments = totalAssignmentsRes?.count || 0;

        const [totalQuizzesRes] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(quizzes)
          .where(and(eq(quizzes.teacherId, id as string), isNull(quizzes.studentId)));
        stats.totalQuizzes = totalQuizzesRes?.count || 0;

        // For pending evaluations, we just count submitted submissions for assignments in courseIds
        const pendingEvaluationsRes = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(submissions)
          .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
          .where(
            and(
              inArray(assignments.courseId, courseIds),
              eq(submissions.status, "SUBMITTED")
            )
          );
        stats.pendingEvaluations = pendingEvaluationsRes[0]?.count || 0;

        // Fetch course-by-course overview details (deduplicated by groupBy)
        const teacherCourses = await db
          .select({
            id: courses.id,
            title: courses.title,
            level: courses.level,
            semester: courses.semester,
          })
          .from(courses)
          .innerJoin(courseFaculty, eq(courseFaculty.courseId, courses.id))
          .innerJoin(enrollments, eq(enrollments.courseFacultyId, courseFaculty.id))
          .where(eq(courseFaculty.teacherId, id as string))
          .groupBy(courses.id, courses.title, courses.level, courses.semester);

        const coursesOverview = [];
        for (const c of teacherCourses) {
          const faculties = await db
            .select({ id: courseFaculty.id })
            .from(courseFaculty)
            .where(and(eq(courseFaculty.courseId, c.id), eq(courseFaculty.teacherId, id as string)));
          const facIds = faculties.map(f => f.id);
          
          let studentCount = 0;
          if (facIds.length > 0) {
            const [countRes] = await db
              .select({ count: sql<number>`count(*)::int` })
              .from(enrollments)
              .where(inArray(enrollments.courseFacultyId, facIds));
            studentCount = countRes?.count || 0;
          }
          coursesOverview.push({
            id: c.id,
            title: c.title,
            level: c.level,
            semester: c.semester,
            studentCount,
            completionRate: 85
          });
        }
        stats.coursesOverview = coursesOverview;

        stats.studentEnrollmentHistory = await db
          .select({
            name: sql<string>`to_char(${enrollments.createdAt}, 'Mon')`,
            value: sql<number>`count(*)::int`,
          })
          .from(enrollments)
          .where(inArray(enrollments.courseFacultyId, cfIds))
          .groupBy(sql`to_char(${enrollments.createdAt}, 'Mon'), extract(month from ${enrollments.createdAt})`)
          .orderBy(sql`extract(month from ${enrollments.createdAt})`);

        stats.coursePopularity = await db
          .select({
            name: courses.title,
            value: sql<number>`count(${enrollments.id})::int`,
          })
          .from(courses)
          .innerJoin(courseFaculty, eq(courseFaculty.courseId, courses.id))
          .leftJoin(enrollments, eq(enrollments.courseFacultyId, courseFaculty.id))
          .where(eq(courseFaculty.teacherId, id as string))
          .groupBy(courses.id, courses.title)
          .orderBy(sql`count(${enrollments.id}) DESC`)
          .limit(5);

        // --- NEW REAL DATA CALCULATIONS FOR GRAPHS ---

        // 1. Assignment Completion (Pie Chart)
        const teacherAssignments = await db
          .select({
            id: assignments.id,
            courseId: assignments.courseId
          })
          .from(assignments)
          .where(inArray(assignments.courseId, courseIds));

        const courseEnrollments = await db
          .select({
            courseId: courseFaculty.courseId,
            studentId: enrollments.studentId,
          })
          .from(enrollments)
          .innerJoin(courseFaculty, eq(enrollments.courseFacultyId, courseFaculty.id))
          .where(inArray(courseFaculty.id, cfIds));

        const courseStudentCounts: Record<string, number> = {};
        for (const row of courseEnrollments) {
          courseStudentCounts[row.courseId] = (courseStudentCounts[row.courseId] || 0) + 1;
        }

        let expectedSubmissions = 0;
        for (const assign of teacherAssignments) {
          expectedSubmissions += courseStudentCounts[assign.courseId] || 0;
        }

        const assignmentIds = teacherAssignments.map(a => a.id);
        let gradedCount = 0;
        let pendingCount = 0;

        if (assignmentIds.length > 0) {
          const subs = await db
            .select({
              marks: submissions.marks,
              status: submissions.status
            })
            .from(submissions)
            .where(inArray(submissions.assignmentId, assignmentIds));
            
          for (const sub of subs) {
            if (sub.marks !== null) {
              gradedCount++;
            } else {
              pendingCount++;
            }
          }
        }

        const submittedCount = gradedCount + pendingCount;
        const unsubmittedCount = Math.max(0, expectedSubmissions - submittedCount);

        stats.assignmentCompletionData = [
          { name: "Graded", value: gradedCount },
          { name: "Pending", value: pendingCount },
          { name: "Unsubmitted", value: unsubmittedCount },
        ];

        // 2. Quiz Performance (Bar Chart)
        const teacherQuizzes = await db
          .select({
            id: quizzes.id,
            title: quizzes.title
          })
          .from(quizzes)
          .where(and(eq(quizzes.teacherId, id as string), isNull(quizzes.studentId)));

        const quizIds = teacherQuizzes.map(q => q.id);
        const quizPerformanceData = [];

        if (quizIds.length > 0) {
          const subs = await db
            .select({
              quizId: quizSubmissions.quizId,
              score: quizSubmissions.score,
              totalPoints: quizSubmissions.totalPoints,
            })
            .from(quizSubmissions)
            .where(inArray(quizSubmissions.quizId, quizIds));

          const quizScores: Record<string, { sum: number; count: number }> = {};
          for (const sub of subs) {
            const pct = sub.totalPoints > 0 ? (sub.score / sub.totalPoints) * 100 : 0;
            if (!quizScores[sub.quizId]) {
              quizScores[sub.quizId] = { sum: 0, count: 0 };
            }
            quizScores[sub.quizId].sum += pct;
            quizScores[sub.quizId].count += 1;
          }

          for (const quiz of teacherQuizzes) {
            const statsEntry = quizScores[quiz.id];
            const avgScore = statsEntry ? Math.round(statsEntry.sum / statsEntry.count) : 0;
            quizPerformanceData.push({
              name: quiz.title,
              score: avgScore,
            });
          }
        }
        stats.quizPerformanceData = quizPerformanceData.slice(0, 5);

        // 3. Attendance Trends (Area Chart)
        const teacherSessions = await db
          .select({
            id: classSessions.id,
            date: classSessions.date
          })
          .from(classSessions)
          .where(eq(classSessions.facultyId, id as string))
          .orderBy(desc(classSessions.date))
          .limit(30);

        const sessionIds = teacherSessions.map(s => s.id);
        const attendanceTrendsData = [];

        if (sessionIds.length > 0) {
          const records = await db
            .select({
              sessionId: attendance.sessionId,
              status: attendance.status
            })
            .from(attendance)
            .where(inArray(attendance.sessionId, sessionIds));

          const sessionStats: Record<string, { present: number; total: number }> = {};
          for (const rec of records) {
            if (!sessionStats[rec.sessionId]) {
              sessionStats[rec.sessionId] = { present: 0, total: 0 };
            }
            sessionStats[rec.sessionId].total += 1;
            if (rec.status === "PRESENT" || rec.status === "LATE") {
              sessionStats[rec.sessionId].present += 1;
            }
          }

          const lastSessions = teacherSessions.slice(0, 6).reverse();
          for (let i = 0; i < lastSessions.length; i++) {
            const sess = lastSessions[i];
            const statsEntry = sessionStats[sess.id];
            const rate = statsEntry && statsEntry.total > 0 
              ? Math.round((statsEntry.present / statsEntry.total) * 100) 
              : 100;
            
            const dateLabel = new Date(sess.date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
            attendanceTrendsData.push({
              week: dateLabel,
              attendance: rate
            });
          }
        }
        stats.attendanceTrendsData = attendanceTrendsData;
      }
    } else {
      // STUDENT
      const [enrolledCoursesRes] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(enrollments)
        .where(eq(enrollments.studentId, id as string));

      const [completedCoursesRes] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(enrollments)
        .where(sql`${enrollments.studentId} = ${id as string} AND ${enrollments.status} = 'COMPLETED'`);

      const enrolledCoursesList = await db
        .select({ id: courses.id, title: courses.title })
        .from(enrollments)
        .innerJoin(courses, eq(enrollments.courseId, courses.id))
        .where(eq(enrollments.studentId, id as string))
        .limit(5);
        
      const courseProgress = [];
      for (const course of enrolledCoursesList) {
        const totalMats = await db.select({ id: materials.id }).from(materials).where(eq(materials.courseId, course.id));
        const completedMats = await db
          .select({ id: materialProgress.id })
          .from(materialProgress)
          .innerJoin(materials, eq(materialProgress.materialId, materials.id))
          .where(sql`${materialProgress.studentId} = ${id as string} AND ${materials.courseId} = ${course.id} AND ${materialProgress.isCompleted} = true`);
        
        const pct = totalMats.length > 0 ? Math.round((completedMats.length / totalMats.length) * 100) : 0;
        courseProgress.push({ name: course.title, value: pct });
      }

      const activityHistoryRaw = await db
        .select({
          name: sql<string>`to_char(${materialProgress.createdAt}, 'Dy')`,
          value: sql<number>`count(*)::int`,
          date: sql<Date>`date_trunc('day', ${materialProgress.createdAt})`
        })
        .from(materialProgress)
        .where(sql`${materialProgress.studentId} = ${id as string} AND ${materialProgress.createdAt} >= CURRENT_DATE - INTERVAL '6 days' AND ${materialProgress.isCompleted} = true`)
        .groupBy(sql`to_char(${materialProgress.createdAt}, 'Dy'), date_trunc('day', ${materialProgress.createdAt})`)
        .orderBy(sql`date_trunc('day', ${materialProgress.createdAt})`);

      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const today = new Date();
      const activityHistory = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dayName = days[d.getDay()];
        const found = activityHistoryRaw.find(a => a.name === dayName);
        activityHistory.push({ name: dayName, value: found ? found.value : 0 });
      }

      const totalCourses = enrolledCoursesRes?.count || 0;
      const completedCourses = completedCoursesRes?.count || 0;
      const ongoingCourses = totalCourses - completedCourses;
      const learningTime = completedCourses * 12 + ongoingCourses * 4;

      // Query the student's actual grades from the Result table
      const subjectMarks = await db
        .select({
          name: results.subjectCode,
          value: results.marks,
        })
        .from(results)
        .where(eq(results.userId, id as string))
        .orderBy(results.createdAt);

      stats = {
        totalCourses,
        completedCourses,
        ongoingCourses,
        learningTime,
        courseProgress,
        activityHistory,
        subjectMarks: subjectMarks.map(m => ({ name: m.name || "Course", value: m.value })),
      };
    }

    return successResponse({ stats }, "Stats fetched successfully", 200);
  } catch (error) {
    console.error("Stats error:", error);
    return errorResponse("Internal server error", 500);
  }
}
