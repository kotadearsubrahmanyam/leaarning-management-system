import { NextResponse } from "next/server";
import { db } from "@/db";
import { systemSettings, courses, users } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq, and } from "drizzle-orm";


export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload) return errorResponse("Unauthorized", 401);

    const { searchParams } = new URL(req.url);
    let semester = searchParams.get("semester");
    const role = payload.role as string;
    const isStudent = role === "STUDENT";

    let studentDepartmentId: string | null = null;
    let studentSemester = 1;

    // Fetch user details if they are a student
    if (isStudent) {
      const user = await db.query.users.findFirst({
        where: eq(users.id, payload.id as string),
        columns: { semester: true, departmentId: true }
      });
      if (user) {
        studentSemester = user.semester || 1;
        studentDepartmentId = user.departmentId;
      }
      semester = studentSemester.toString();
    } else if (!semester) {
      // Fallback for non-students
      semester = "1";
    }

    const targetSemester = parseInt(semester);
    const settingKey = `WEEKLY_TIMETABLE_${targetSemester}`;

    const setting = await db.query.systemSettings.findFirst({
      where: eq(systemSettings.key, settingKey),
    });

    if (!setting) {
      return successResponse({ timetable: null, courses: [] }, "No timetable found");
    }

    let timetableData = JSON.parse(setting.value);

    // Normalize old format vs new format
    if (!timetableData.timetable) {
      // It's the old flat format
      timetableData = { timetable: timetableData };
    }

    // Lazy Reversion Logic
    if (timetableData.isTemporary && timetableData.expiresAt) {
      if (new Date() > new Date(timetableData.expiresAt)) {
        // Expired! Revert to original
        timetableData = {
          timetable: timetableData.originalTimetable || timetableData.timetable
        };
        
        // Update DB silently
        await db.update(systemSettings)
          .set({ value: JSON.stringify(timetableData), updatedAt: new Date() })
          .where(eq(systemSettings.id, setting.id));
      }
    }

    // Fetch student's department courses if they are a student
    let deptCourses: any[] = [];
    if (isStudent && studentDepartmentId) {
      deptCourses = await db
        .select({
          id: courses.id,
          name: courses.title,
          credits: courses.credits,
          faculty: users.name,
        })
        .from(courses)
        .leftJoin(users, eq(courses.teacherId, users.id))
        .where(
          and(
            eq(courses.semester, targetSemester),
            eq(courses.categoryId, studentDepartmentId)
          )
        );

      if (deptCourses.length > 0) {
        // Fetch all courses in this semester across all departments for deterministic mapping
        const allSemesterCourses = await db
          .select({
            title: courses.title,
          })
          .from(courses)
          .where(eq(courses.semester, targetSemester));

        const courseTitles = Array.from(new Set(allSemesterCourses.map(c => c.title))).sort();

        // Perform mapping on the timetable object
        const timetable = timetableData.timetable;
        if (timetable) {
          for (const day of Object.keys(timetable)) {
            if (!timetable[day]) continue;
            for (const slotId of Object.keys(timetable[day])) {
              const slot = timetable[day][slotId];
              if (!slot || slot.name === "Lunch Break" || slot.name === "Free Period" || slot.isCustom || slot.faculty === "Custom") {
                continue;
              }

              // Check if it already belongs to the student's department courses
              const matchedDeptCourse = deptCourses.find(dc => dc.name.toLowerCase() === slot.name.toLowerCase());
              if (matchedDeptCourse) {
                slot.faculty = matchedDeptCourse.faculty || "Unassigned";
              } else {
                // Find index of slot.name in courseTitles
                let courseIndex = courseTitles.findIndex(t => t.toLowerCase() === slot.name.toLowerCase());
                if (courseIndex === -1) {
                  let hash = 0;
                  for (let i = 0; i < slot.name.length; i++) {
                    hash = slot.name.charCodeAt(i) + ((hash << 5) - hash);
                  }
                  courseIndex = Math.abs(hash);
                }

                const mapped = deptCourses[courseIndex % deptCourses.length];
                slot.name = mapped.name;
                slot.faculty = mapped.faculty || "Unassigned";
              }
            }
          }
        }
      }
    }

    return successResponse({
      ...timetableData,
      semester: targetSemester,
      courses: deptCourses
    }, "Fetched weekly timetable");
  } catch (error) {
    console.error("GET Timetable Error:", error);
    return errorResponse("Internal server error", 500);
  }
}

