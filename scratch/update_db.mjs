import { db } from "../src/db/index.ts";
import { materials } from "../src/db/schema.ts";
import { eq, and } from "drizzle-orm";
import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "public/uploads/sql-basics.md");
const stats = fs.statSync(filePath);
const fileSizeInBytes = stats.size;
const fileSizeStr = `${(fileSizeInBytes / 1024).toFixed(1)} KB`;

async function main() {
    console.log("Updating database record...");
    
    // Update the materials table
    const result = await db.update(materials)
      .set({
        title: "SQL Basics.md",
        fileUrl: "/uploads/sql-basics.md",
        fileType: "text/markdown",
        size: fileSizeStr
      })
      .where(
        and(
          eq(materials.courseId, "eb8032e7-bb12-48fc-ab3c-9d7404bb5ef9"),
          eq(materials.title, "SQL Basics.pdf")
        )
      ).returning();

    if (result.length > 0) {
        console.log("Successfully updated database records!");
        console.log(result);
    } else {
        console.log("No matching database records found to update. Checking if it already exists...");
        const existing = await db.select().from(materials).where(
          and(
            eq(materials.courseId, "eb8032e7-bb12-48fc-ab3c-9d7404bb5ef9"),
            eq(materials.title, "SQL Basics.md")
          )
        );
        if (existing.length === 0) {
            console.log("Not found, inserting new record...");
            const insertRes = await db.insert(materials).values({
                courseId: "eb8032e7-bb12-48fc-ab3c-9d7404bb5ef9",
                title: "SQL Basics.md",
                fileUrl: "/uploads/sql-basics.md",
                fileType: "text/markdown",
                size: fileSizeStr,
                category: "UNIT_NOTES"
            }).returning();
            console.log("Inserted new record:", insertRes);
        } else {
            console.log("Already exists, no action needed.");
        }
    }
}

main().catch(console.error);
