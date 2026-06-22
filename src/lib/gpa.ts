import { db } from "@/db";
import { results, studentSemesterSummary, users, systemSettings, learningPaths, studentLearningPaths, notifications } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export const getGradePoints = (grade: string): number => {
  const g = grade.toUpperCase().trim();
  if (["A+", "O"].includes(g)) return 10;
  if (g === "A") return 9;
  if (g === "B+") return 8;
  if (g === "B") return 7;
  if (g === "C") return 6;
  if (g === "D") return 5;
  return 0; // F
};

export async function getBacklogPolicy(): Promise<string> {
  try {
    const setting = await db.query.systemSettings.findFirst({
      where: eq(systemSettings.key, "BACKLOG_POLICY"),
    });
    return setting?.value || "A"; // default to Policy A
  } catch (err) {
    console.error("Failed to fetch backlog policy settings, defaulting to A", err);
    return "A";
  }
}

export async function recalculateStudentGpas(studentId: string) {
  try {
    // 1. Get student info
    const student = await db.query.users.findFirst({
      where: eq(users.id, studentId),
    });
    if (!student) return;

    const currentSemester = student.semester || 1;
    const policy = await getBacklogPolicy();

    // 2. Fetch all published results for this student
    const allResults = await db.select({
      id: results.id,
      semester: results.semester,
      grade: results.grade,
      credits: results.credits,
      status: results.status,
      passType: results.passType,
      originalGrade: results.originalGrade,
    })
    .from(results)
    .where(and(eq(results.userId, studentId), eq(results.published, true)));

    // Helper to get grade points under the active policy rules
    const getPoints = (res: any): number => {
      if (res.status === "FAIL") return 0;
      
      if (res.passType === "SUPPLEMENTARY") {
        if (policy === "A") {
          return getGradePoints(res.grade);
        } else if (policy === "B") {
          return getGradePoints("D"); // Pass Grade Replacement (fixed D grade = 5 points)
        } else if (policy === "C") {
          return getGradePoints(res.originalGrade || "F"); // Original Grade Retention (typically F = 0 points)
        }
      }
      
      return getGradePoints(res.grade);
    };

    // Recalculate summaries for all semesters from 1 up to currentSemester
    for (let sem = 1; sem <= currentSemester; sem++) {
      const semResults = allResults.filter(r => r.semester === sem);

      // Check if all results for this student in this semester are published
      const studentResultsForSem = await db.select({ published: results.published })
        .from(results)
        .where(and(eq(results.userId, studentId), eq(results.semester, sem)));

      const isSemPublished = studentResultsForSem.length > 0 && studentResultsForSem.every(r => r.published);

      if (semResults.length === 0) {
        // If no published results, but summary exists, update it to unpublished
        const existing = await db.query.studentSemesterSummary.findFirst({
          where: and(
            eq(studentSemesterSummary.userId, studentId),
            eq(studentSemesterSummary.semester, sem)
          )
        });
        if (existing) {
          await db.update(studentSemesterSummary).set({
            published: false,
            sgpa: "0.00",
            status: "FAIL",
            backlogCount: 0,
          }).where(eq(studentSemesterSummary.id, existing.id));
        }
        continue; // Skip if no results recorded for this semester yet
      }

      const semCredits = semResults.reduce((sum, r) => sum + (r.credits || 3), 0);
      const semPoints = semResults.reduce((sum, r) => sum + (getPoints(r) * (r.credits || 3)), 0);
      const sgpa = semCredits > 0 ? (semPoints / semCredits).toFixed(2) : "0.00";

      // Calculate CGPA cumulatively (all results for semesters <= sem)
      const cumulativeResults = allResults.filter(r => r.semester <= sem);
      const totalCredits = cumulativeResults.reduce((sum, r) => sum + (r.credits || 3), 0);
      const totalPoints = cumulativeResults.reduce((sum, r) => sum + (getPoints(r) * (r.credits || 3)), 0);
      const cgpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : "0.00";

      // Backlog count is the count of currently failing subjects in this semester
      const backlogCount = semResults.filter(r => r.status === "FAIL").length;
      const status = backlogCount <= 2 ? "PASS" : "FAIL";

      // Check if summary already exists
      const existing = await db.query.studentSemesterSummary.findFirst({
        where: and(
          eq(studentSemesterSummary.userId, studentId),
          eq(studentSemesterSummary.semester, sem)
        )
      });

      if (existing) {
        await db.update(studentSemesterSummary).set({
          sgpa,
          cgpa,
          status,
          backlogCount,
          published: isSemPublished,
        }).where(eq(studentSemesterSummary.id, existing.id));
      } else {
        await db.insert(studentSemesterSummary).values({
          userId: studentId,
          semester: sem,
          sgpa,
          cgpa,
          status,
          backlogCount,
          published: isSemPublished,
        });
      }
    }
  } catch (error) {
    console.error(`Error recalculating GPAs for student ${studentId}:`, error);
  }
}

export async function assignLearningPathOnFail(studentId: string, courseId: string) {
  try {
    const path = await db.query.learningPaths.findFirst({
      where: eq(learningPaths.courseId, courseId),
    });
    if (!path) {
      console.log(`No recovery learning path configured for course ${courseId}`);
      return;
    }

    const existing = await db.query.studentLearningPaths.findFirst({
      where: and(
        eq(studentLearningPaths.studentId, studentId),
        eq(studentLearningPaths.learningPathId, path.id)
      ),
    });

    if (existing) {
      console.log(`Student ${studentId} already has learning path ${path.id} assigned`);
      return;
    }

    const initialProgress = {
      completedUnits: [],
      completedAssignments: [],
      completedMockTests: [],
      completedChecklist: [],
      readinessScore: 0
    };

    await db.insert(studentLearningPaths).values({
      studentId,
      learningPathId: path.id,
      progress: JSON.stringify(initialProgress),
      completionStatus: "IN_PROGRESS",
    });

    await db.insert(notifications).values({
      userId: studentId,
      title: "Recovery Learning Path Assigned",
      message: `A backlog recovery plan has been assigned to help you prepare for the supplementary exam in ${path.title || 'the failed course'}.`,
      isRead: false,
    });

    console.log(`Assigned learning path ${path.id} to student ${studentId}`);
  } catch (error) {
    console.error("Error in assignLearningPathOnFail:", error);
  }
}
