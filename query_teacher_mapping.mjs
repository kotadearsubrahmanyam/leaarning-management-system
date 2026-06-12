import { db } from "./src/db/index.js";
import { courseFaculty, courses } from "./src/db/schema.js";
import { eq } from "drizzle-orm";

async function test() {
  const tf = await db.select().from(courseFaculty).where(eq(courseFaculty.teacherId, '2d60bc17-abe2-4bbb-b3c9-0febf79f50d5'));
  console.log('Sections:', tf.length);
  console.log('Course IDs from Sections:', tf.map(t => t.courseId));
  
  const tc = await db.select().from(courses).where(eq(courses.teacherId, '2d60bc17-abe2-4bbb-b3c9-0febf79f50d5'));
  console.log('Courses where teacherId is set:', tc.length);
  console.log('Course IDs directly mapped:', tc.map(t => t.id));
  
  process.exit(0);
}
test();
