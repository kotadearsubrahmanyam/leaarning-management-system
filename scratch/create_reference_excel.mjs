import XLSX from 'xlsx';

// 1. Create Student Reference Data
const studentHeaders = ["Name", "Department", "Semester"];
const studentData = [
  {
    "Name": "Aarav Sharma",
    "Department": "CSE",
    "Semester": 3
  },
  {
    "Name": "Diya Patel",
    "Department": "Computer Science and Engineering",
    "Semester": 3
  },
  {
    "Name": "Kabir Mehta",
    "Department": "ECE",
    "Semester": 3
  },
  {
    "Name": "Ananya Iyer",
    "Department": "BBA",
    "Semester": 3
  }
];

const studentSheet = XLSX.utils.json_to_sheet(studentData, { header: studentHeaders });
const studentWorkbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(studentWorkbook, studentSheet, "Students");
XLSX.writeFile(studentWorkbook, "student_import_template.xlsx");
console.log("Created student_import_template.xlsx successfully.");

// 2. Create Teacher Reference Data
const teacherHeaders = ["Name", "Faculty ID", "Email", "Department", "Subject"];
const teacherData = [
  {
    "Name": "Dr. Ramesh Babu",
    "Faculty ID": "T101",
    "Email": "ramesh.babu@university.in",
    "Department": "CSE",
    "Subject": "Database Management Systems"
  },
  {
    "Name": "Prof. Sneha Reddy",
    "Faculty ID": "T102",
    "Email": "sneha.reddy@university.in",
    "Department": "Computer Science and Engineering",
    "Subject": "Agile Software Engineering"
  },
  {
    "Name": "Dr. Amit Verma",
    "Faculty ID": "T103",
    "Email": "amit.verma@university.in",
    "Department": "ECE",
    "Subject": "Digital Electronics"
  },
  {
    "Name": "Dr. Geeta Nair",
    "Faculty ID": "T104",
    "Email": "geeta.nair@university.in",
    "Department": "BBA",
    "Subject": "Financial Management"
  }
];

const teacherSheet = XLSX.utils.json_to_sheet(teacherData, { header: teacherHeaders });
const teacherWorkbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(teacherWorkbook, teacherSheet, "Teachers");
XLSX.writeFile(teacherWorkbook, "teacher_import_template.xlsx");
console.log("Created teacher_import_template.xlsx successfully.");
