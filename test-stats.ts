import "dotenv/config";
import { db } from "./src/db/index";
import { courses, materials } from "./src/db/schema";
import { loadEnvConfig } from "@next/env";

const projectDir = process.cwd();
loadEnvConfig(projectDir);

async function run() {
  try {
    const allCourses = await db.select().from(courses);
    const courseMap: Record<string, string> = {};
    allCourses.forEach(c => {
      courseMap[c.id] = c.title;
    });

    const allMaterials = await db.select().from(materials);
    console.log(`Found ${allMaterials.length} materials in database.`);
    
    // Group by courseId and category
    const grouped: Record<string, number> = {};
    allMaterials.forEach(m => {
      const courseName = courseMap[m.courseId] || m.courseId;
      const key = `Course: ${courseName} | Category: ${m.category}`;
      grouped[key] = (grouped[key] || 0) + 1;
    });
    console.log("Grouped Materials count:", JSON.stringify(grouped, null, 2));

    const systemMaterials = allMaterials.filter(m => m.uploadedBy === 'SYSTEM');
    console.log(`\nSystem materials count: ${systemMaterials.length}`);
    systemMaterials.forEach(m => {
      const courseName = courseMap[m.courseId] || m.courseId;
      console.log(`[SYSTEM] Course: ${courseName} | Title: "${m.title}" | Cat: ${m.category} | Subcat: ${m.subcategory}`);
    });
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

run();

