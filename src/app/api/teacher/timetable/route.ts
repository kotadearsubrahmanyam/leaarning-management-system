export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/db";
import { systemSettings, users, courses, courseFaculty } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq, like } from "drizzle-orm";

const DEFAULT_TIMETABLE = {
  Monday: {
    slot1: { name: "Free Period", faculty: "-" },
    slot2: { name: "Free Period", faculty: "-" },
    slot3: { name: "Free Period", faculty: "-" },
    lunch: { name: "Lunch Break", faculty: "-" },
    slot4: { name: "Free Period", faculty: "-" },
    slot5: { name: "Free Period", faculty: "-" },
  },
  Tuesday: {
    slot1: { name: "Free Period", faculty: "-" },
    slot2: { name: "Free Period", faculty: "-" },
    slot3: { name: "Free Period", faculty: "-" },
    lunch: { name: "Lunch Break", faculty: "-" },
    slot4: { name: "Free Period", faculty: "-" },
    slot5: { name: "Free Period", faculty: "-" },
  },
  Wednesday: {
    slot1: { name: "Free Period", faculty: "-" },
    slot2: { name: "Free Period", faculty: "-" },
    slot3: { name: "Free Period", faculty: "-" },
    lunch: { name: "Lunch Break", faculty: "-" },
    slot4: { name: "Free Period", faculty: "-" },
    slot5: { name: "Free Period", faculty: "-" },
  },
  Thursday: {
    slot1: { name: "Free Period", faculty: "-" },
    slot2: { name: "Free Period", faculty: "-" },
    slot3: { name: "Free Period", faculty: "-" },
    lunch: { name: "Lunch Break", faculty: "-" },
    slot4: { name: "Free Period", faculty: "-" },
    slot5: { name: "Free Period", faculty: "-" },
  },
  Friday: {
    slot1: { name: "Free Period", faculty: "-" },
    slot2: { name: "Free Period", faculty: "-" },
    slot3: { name: "Free Period", faculty: "-" },
    lunch: { name: "Lunch Break", faculty: "-" },
    slot4: { name: "Free Period", faculty: "-" },
    slot5: { name: "Free Period", faculty: "-" },
  },
};

export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "TEACHER") return errorResponse("Forbidden", 403);

    const user = await db.query.users.findFirst({ where: eq(users.id, payload.id as string) });
    if (!user) return errorResponse("User not found", 404);

    const teacherName = user.name;
    const teacherDeptId = user.departmentId;

    // Fetch all course IDs taught by the logged-in teacher (either as primary or co-faculty)
    const primaryCourses = await db
      .select({ id: courses.id })
      .from(courses)
      .where(eq(courses.teacherId, payload.id as string));

    const coCourses = await db
      .select({ id: courseFaculty.courseId })
      .from(courseFaculty)
      .where(eq(courseFaculty.teacherId, payload.id as string));

    const taughtCourseIds = new Set([
      ...primaryCourses.map(c => c.id),
      ...coCourses.map(c => c.id)
    ]);

    // Fetch all courses in this teacher's department
    let teacherCourses: any[] = [];
    if (teacherDeptId) {
      teacherCourses = await db
        .select({
          id: courses.id,
          name: courses.title,
          semester: courses.semester,
          faculty: users.name,
        })
        .from(courses)
        .leftJoin(users, eq(courses.teacherId, users.id))
        .where(eq(courses.categoryId, teacherDeptId));
    }

    // Fetch all student semesters to dynamically determine if the current term is Odd or Even
    const activeStudents = await db
      .select({ semester: users.semester })
      .from(users)
      .where(eq(users.role, "STUDENT"));
    
    const oddCount = activeStudents.filter(s => s.semester && s.semester % 2 !== 0).length;
    const evenCount = activeStudents.filter(s => s.semester && s.semester % 2 === 0).length;
    const isOddTerm = oddCount >= evenCount;

    // Fetch all timetables
    const allSettings = await db.select().from(systemSettings).where(like(systemSettings.key, "WEEKLY_TIMETABLE_%"));

    // Filter settings by odd/even semester based on the current active term
    const filteredSettings = allSettings.filter(setting => {
      const semesterMatch = setting.key.match(/\d+/);
      if (!semesterMatch) return false;
      const sem = parseInt(semesterMatch[0]);
      return isOddTerm ? sem % 2 !== 0 : sem % 2 === 0;
    });

    // Deep clone the default timetable
    const teacherTimetable: any = JSON.parse(JSON.stringify(DEFAULT_TIMETABLE));

    for (const setting of filteredSettings) {
      let data;
      try {
        data = JSON.parse(setting.value || "{}");
      } catch (e) {
        continue;
      }
      
      const grid = data.timetable || data;
      const semesterMatch = setting.key.match(/\d+/);
      const semesterVal = semesterMatch ? parseInt(semesterMatch[0]) : null;
      if (semesterVal === null) continue;

      const deptCourses = teacherCourses.filter(c => c.semester === semesterVal);

      // Fetch all courses in this semester across all departments for mapping pool
      const allSemesterCourses = await db
        .select({
          title: courses.title,
        })
        .from(courses)
        .where(eq(courses.semester, semesterVal));

      const courseTitles = Array.from(new Set(allSemesterCourses.map(c => c.title))).sort();

      for (const day of Object.keys(grid)) {
        if (!teacherTimetable[day]) continue;
        
        for (const slotId of Object.keys(grid[day])) {
          if (slotId === "lunch") continue;

          const cell = grid[day][slotId];
          if (!cell || cell.name === "Lunch Break" || cell.name === "Free Period" || cell.isCustom || cell.faculty === "Custom") {
            continue;
          }

          let cellName = cell.name;
          let cellFaculty = cell.faculty;
          let matchedCourseId: string | null = null;

          if (deptCourses.length > 0) {
            const matchedDeptCourse = deptCourses.find(dc => dc.name.toLowerCase() === cellName.toLowerCase());
            if (matchedDeptCourse) {
              cellName = matchedDeptCourse.name;
              cellFaculty = matchedDeptCourse.faculty || "Unassigned";
              matchedCourseId = matchedDeptCourse.id;
            } else {
              let courseIndex = courseTitles.findIndex(t => t.toLowerCase() === cellName.toLowerCase());
              if (courseIndex === -1) {
                let hash = 0;
                for (let i = 0; i < cellName.length; i++) {
                  hash = cellName.charCodeAt(i) + ((hash << 5) - hash);
                }
                courseIndex = Math.abs(hash);
              }

              const mapped = deptCourses[courseIndex % deptCourses.length];
              cellName = mapped.name;
              cellFaculty = mapped.faculty || "Unassigned";
              matchedCourseId = mapped.id;
            }
          }

          if ((matchedCourseId && taughtCourseIds.has(matchedCourseId)) || cellFaculty === teacherName) {
            // Overwrite the slot in the teacher's timetable
            // If there's a conflict, it will just overwrite with the last found one.
            teacherTimetable[day][slotId] = {
              name: `${cellName} (Sem ${semesterVal})`,
              faculty: teacherName,
              isCustom: false
            };
          }
        }
      }
    }

    return successResponse({ timetable: teacherTimetable, teacherName }, "Fetched teacher timetable successfully");
  } catch (error) {
    console.error("Teacher Timetable GET Error:", error);
    return errorResponse("Internal error", 500);
  }
}

