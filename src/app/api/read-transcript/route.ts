import { NextResponse } from "next/server";
import fs from "fs";

export async function GET() {
  try {
    const transcriptPath = "C:\\Users\\susanna\\.gemini\\antigravity\\brain\\cd9aa22f-2140-4b73-87d4-3ed17b2601bc\\.system_generated\\logs\\transcript.jsonl";
    if (!fs.existsSync(transcriptPath)) {
      return NextResponse.json({ success: false, error: "Transcript file not found" });
    }
    const content = fs.readFileSync(transcriptPath, "utf-8");
    const lines = content.split("\n");
    const matches: string[] = [];
    lines.forEach((line) => {
      if (line.toLowerCase().includes("bba")) {
        matches.push(line);
      }
    });
    return NextResponse.json({ success: true, count: matches.length, matches });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
