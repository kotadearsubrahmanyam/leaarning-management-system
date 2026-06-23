export function marksToGrade(marks: number): string {
  if (marks >= 90) return "O";
  if (marks >= 80) return "A+";
  if (marks >= 70) return "A";
  if (marks >= 60) return "B+";
  if (marks >= 50) return "B";
  if (marks >= 45) return "C";
  if (marks >= 40) return "D";
  return "F";
}

export function gradeToPoints(grade: string): number {
  switch (grade.toUpperCase()) {
    case "O":
    case "A+": return 10;
    case "A": return 9;
    case "B+": return 8;
    case "B": return 7;
    case "C": return 6;
    case "D": return 5;
    case "F": return 0;
    default: return 0;
  }
}

export interface ResultRecord {
  credits: number;
  grade: string;
  marks: number;
  status: string; // "PASS" | "FAIL"
}

export function calculateSGPA(results: ResultRecord[]) {
  let totalCredits = 0;
  let earnedPoints = 0;
  let passedCount = 0;
  let failedCount = 0;

  for (const r of results) {
    const creditsVal = typeof r.credits === 'number' ? r.credits : parseFloat(r.credits as any) || 0;
    totalCredits += creditsVal;
    const points = gradeToPoints(r.grade);
    earnedPoints += (creditsVal * points);

    if (r.status === "PASS" || points > 0) {
      passedCount++;
    } else {
      failedCount++;
    }
  }

  const sgpa = totalCredits > 0 ? (earnedPoints / totalCredits).toFixed(2) : "0.00";
  
  return {
    sgpa,
    totalCredits,
    passedCount,
    failedCount,
    status: failedCount > 0 ? "FAILED" : "PROMOTED",
    backlogCount: failedCount
  };
}

export function calculateCGPA(sgpaRecords: { sgpa: string, totalCredits: number }[]) {
  let totalSum = 0;
  let totalCredits = 0;

  for (const record of sgpaRecords) {
    const creditsVal = typeof record.totalCredits === 'number' ? record.totalCredits : parseFloat(record.totalCredits as any) || 0;
    if (creditsVal > 0) {
      totalSum += parseFloat(record.sgpa) * creditsVal;
      totalCredits += creditsVal;
    }
  }

  return totalCredits > 0 ? (totalSum / totalCredits).toFixed(2) : "0.00";
}
