import fs from "fs";
import path from "path";

const apiDir = path.join(process.cwd(), "src/app/api");

function getRouteFiles(dir, filesList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getRouteFiles(filePath, filesList);
    } else if (file === "route.ts") {
      filesList.push(filePath);
    }
  }
  return filesList;
}

function main() {
  const files = getRouteFiles(apiDir);
  console.log(`Found ${files.length} route files.`);

  let modifiedCount = 0;

  for (const file of files) {
    let content = fs.readFileSync(file, "utf8");
    
    // Check if dynamic is already configured
    if (content.includes("dynamic =") || content.includes("dynamic=")) {
      console.log(`Skipping (already configured): ${path.relative(apiDir, file)}`);
      continue;
    }

    // Prepend force-dynamic export
    const newContent = `export const dynamic = "force-dynamic";\n\n${content}`;
    fs.writeFileSync(file, newContent, "utf8");
    console.log(`Added force-dynamic to: ${path.relative(apiDir, file)}`);
    modifiedCount++;
  }

  console.log(`Successfully added dynamic export to ${modifiedCount} route files.`);
}

main();
