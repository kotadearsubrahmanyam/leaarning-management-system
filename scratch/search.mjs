import fs from "fs";

const content = fs.readFileSync("src/app/dashboard/payments/page.tsx", "utf-8");
const lines = content.split("\n");

lines.forEach((line, index) => {
  if (line.toLowerCase().includes("verify") || line.toLowerCase().includes("status") || line.includes("pending") || line.includes("/api/admin/payments") || line.includes("/api/payments")) {
    console.log(`Line ${index + 1}: ${line.trim()}`);
  }
});
