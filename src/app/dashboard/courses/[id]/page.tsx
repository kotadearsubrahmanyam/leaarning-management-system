"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ChevronLeft, FileText, Sliders, Plus, X, Search, BookOpen, 
  Download, ExternalLink, Eye, Folder, FolderOpen, ArrowRight, BookMarked,
  HelpCircle, Award
} from "lucide-react";
import { AnimatedButton } from "@/components/ui/animated-button";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { UploadModal } from "@/components/materials/upload-modal";
import { cn } from "@/lib/utils";

interface Material {
  id: string;
  courseId: string;
  title: string;
  fileUrl: string;
  fileType: string;
  size: string;
  category: string;
  createdAt: string;
}

interface MockResource {
  title: string;
  fileUrl: string;
  size: string;
  isLink?: boolean;
  categoryKey: string;
  subfolderName?: string;
}

const getCleanCourseCode = (title: string, sem: number) => {
  const t = title?.toLowerCase() || "";
  if (t.includes("database management")) return "CS301";
  if (t.includes("theory of computation")) return "CS302";
  if (t.includes("agile software")) return "CS303";
  if (t.includes("operating system")) return "CS304";
  
  const acronym = t
    .split(" ")
    .filter((w: string) => w.length > 1 && !["and", "for", "the", "using", "of", "&"].includes(w))
    .map((w: string) => w[0])
    .join("")
    .toUpperCase();
  return `${acronym || "SUBJ"}-${sem}01`;
};

// Full dynamic Mock Repository Seeds for all 4 core subjects
const MOCK_REPOSITORIES: Record<string, {
  syllabus: Omit<MockResource, "categoryKey">[];
  unitNotes: Record<string, Omit<MockResource, "categoryKey">[]>;
  importantQuestions: Record<string, Omit<MockResource, "categoryKey">[]>;
  questionPapers: Omit<MockResource, "categoryKey">[];
  referenceMaterials: Record<string, Omit<MockResource, "categoryKey">[]>;
  additionalResources: Omit<MockResource, "categoryKey">[];
}> = {
  dbms: {
    syllabus: [
      { title: "Complete Syllabus (CS301).pdf", fileUrl: "#", size: "1.2 MB" },
      { title: "Unit-wise Syllabus Breakdown.pdf", fileUrl: "#", size: "450 KB" }
    ],
    unitNotes: {
      "Unit 1 - Introduction to Databases": [
        { title: "Introduction to DBMS.pdf", fileUrl: "#", size: "2.4 MB" },
        { title: "Database Architecture Overview.pdf", fileUrl: "#", size: "1.5 MB" }
      ],
      "Unit 2 - ER Model": [
        { title: "ER Diagram Notation Guide.pdf", fileUrl: "#", size: "1.8 MB" },
        { title: "Relational Model Concepts.pdf", fileUrl: "#", size: "1.2 MB" }
      ],
      "Unit 3 - SQL Queries": [
        { title: "SQL Basics.pdf", fileUrl: "#", size: "3.1 MB" },
        { title: "Joins.pdf", fileUrl: "#", size: "1.4 MB" },
        { title: "Nested Queries.pdf", fileUrl: "#", size: "1.6 MB" },
        { title: "Stored Procedures.pdf", fileUrl: "#", size: "2.0 MB" }
      ],
      "Unit 4 - Normalization": [
        { title: "Normalization Guidelines (1NF to BCNF).pdf", fileUrl: "#", size: "1.5 MB" },
        { title: "Functional Dependencies.pdf", fileUrl: "#", size: "1.1 MB" }
      ],
      "Unit 5 - Transactions": [
        { title: "ACID Properties Cheat Sheet.pdf", fileUrl: "#", size: "2.2 MB" },
        { title: "Concurrency Control Basics.pdf", fileUrl: "#", size: "1.6 MB" }
      ]
    },
    importantQuestions: {
      "5 Marks Questions": [
        { title: "DBMS 5 Marks Question Bank.pdf", fileUrl: "#", size: "850 KB" }
      ],
      "10 Marks Questions": [
        { title: "DBMS 10 Marks Question Bank.pdf", fileUrl: "#", size: "950 KB" }
      ],
      "Viva Questions": [
        { title: "DBMS Lab Viva Questions.pdf", fileUrl: "#", size: "620 KB" }
      ]
    },
    questionPapers: [
      { title: "Semester End Exam Paper - Dec 2025.pdf", fileUrl: "#", size: "1.1 MB", subfolderName: "Semester Previous Papers" },
      { title: "DBMS Model Question Paper.pdf", fileUrl: "#", size: "880 KB", subfolderName: "Model Papers" }
    ],
    referenceMaterials: {
      "Text Books": [
        { title: "Database System Concepts - Silberschatz, Korth.pdf", fileUrl: "#", size: "18.5 MB" }
      ],
      "Reference Books": [
        { title: "Fundamentals of Database Systems - Elmasri, Navathe.pdf", fileUrl: "#", size: "22.1 MB" }
      ],
      "Lab Manuals": [
        { title: "DBMS Laboratory Instruction Lab Manual.pdf", fileUrl: "#", size: "1.4 MB" }
      ],
      "Additional Reading Material": [
        { title: "Unit Weightage & Blueprint.pdf", fileUrl: "#", size: "320 KB" },
        { title: "Important Topics Checklist.pdf", fileUrl: "#", size: "480 KB" }
      ]
    },
    additionalResources: [
      { title: "NPTEL Online Course - Database Management Systems", fileUrl: "https://nptel.ac.in/courses/106105175", size: "External Link", isLink: true },
      { title: "GateSmasher YouTube Playlist - DBMS Lectures", fileUrl: "https://www.youtube.com/playlist?list=PLxCzCOWd7aiFAN6I81C9gL9fnly65g5Rn", size: "YouTube Playlist", isLink: true }
    ]
  },
  toc: {
    syllabus: [
      { title: "Complete Syllabus (CS302).pdf", fileUrl: "#", size: "1.1 MB" },
      { title: "Unit-wise Syllabus Breakdown.pdf", fileUrl: "#", size: "420 KB" }
    ],
    unitNotes: {
      "Unit 1 - Finite Automata": [
        { title: "DFA and NFA Diagrams.pdf", fileUrl: "#", size: "2.1 MB" },
        { title: "Epsilon Transitions.pdf", fileUrl: "#", size: "1.6 MB" }
      ],
      "Unit 2 - Regular Languages": [
        { title: "Regular Expressions Guide.pdf", fileUrl: "#", size: "1.6 MB" },
        { title: "Pumping Lemma for Regular Languages.pdf", fileUrl: "#", size: "1.2 MB" }
      ],
      "Unit 3 - Context-Free Grammars": [
        { title: "Context-Free Grammars.pdf", fileUrl: "#", size: "2.5 MB" },
        { title: "Chomsky Normal Form.pdf", fileUrl: "#", size: "1.4 MB" }
      ],
      "Unit 4 - Pushdown Automata": [
        { title: "PDA Constructions.pdf", fileUrl: "#", size: "1.4 MB" },
        { title: "Equivalence of PDA and CFG.pdf", fileUrl: "#", size: "1.2 MB" }
      ],
      "Unit 5 - Turing Machines": [
        { title: "Turing Machine Design.pdf", fileUrl: "#", size: "2.0 MB" },
        { title: "Halting Problem & Decidability.pdf", fileUrl: "#", size: "1.5 MB" }
      ]
    },
    importantQuestions: {
      "5 Marks Questions": [
        { title: "TOC 5 Marks Question Bank.pdf", fileUrl: "#", size: "780 KB" }
      ],
      "10 Marks Questions": [
        { title: "TOC 10 Marks Question Bank.pdf", fileUrl: "#", size: "880 KB" }
      ],
      "Viva Questions": [
        { title: "TOC Theoretical Viva Cheat Sheet.pdf", fileUrl: "#", size: "520 KB" }
      ]
    },
    questionPapers: [
      { title: "Semester End Exam Paper - Dec 2025.pdf", fileUrl: "#", size: "1.0 MB", subfolderName: "Semester Previous Papers" },
      { title: "TOC Model Question Paper.pdf", fileUrl: "#", size: "820 KB", subfolderName: "Model Papers" }
    ],
    referenceMaterials: {
      "Text Books": [
        { title: "Introduction to Automata Theory, Languages, and Computation - Hopcroft.pdf", fileUrl: "#", size: "14.2 MB" }
      ],
      "Reference Books": [
        { title: "An Introduction to Formal Languages and Automata - Peter Linz.pdf", fileUrl: "#", size: "11.8 MB" }
      ],
      "Lab Manuals": [
        { title: "TOC Practice Sheets and Guides.pdf", fileUrl: "#", size: "850 KB" }
      ],
      "Additional Reading Material": [
        { title: "Sipser Decidability & Complexity Chapter Summary.pdf", fileUrl: "#", size: "2.1 MB" }
      ]
    },
    additionalResources: [
      { title: "NPTEL Online Course - Theory of Computation", fileUrl: "https://nptel.ac.in/courses/106104148", size: "External Link", isLink: true },
      { title: "GateSmasher YouTube Playlist - TOC Lectures", fileUrl: "https://www.youtube.com/playlist?list=PLxCzCOWd7aiFM9Lj5G9G_MQsZyA1Fsa5T", size: "YouTube Playlist", isLink: true }
    ]
  },
  ase: {
    syllabus: [
      { title: "Complete Syllabus (CS303).pdf", fileUrl: "#", size: "1.0 MB" },
      { title: "Unit-wise Syllabus Breakdown.pdf", fileUrl: "#", size: "380 KB" }
    ],
    unitNotes: {
      "Unit 1 - Introduction to Agile": [
        { title: "Agile Manifesto Principles.pdf", fileUrl: "#", size: "1.9 MB" },
        { title: "Waterfall vs Agile Comparison.pdf", fileUrl: "#", size: "1.2 MB" }
      ],
      "Unit 2 - Scrum Framework": [
        { title: "Scrum Guide Summary.pdf", fileUrl: "#", size: "2.3 MB" },
        { title: "Sprint Planning & Backlog Grooming.pdf", fileUrl: "#", size: "1.5 MB" }
      ],
      "Unit 3 - Agile Requirements": [
        { title: "User Stories & Acceptance Criteria.pdf", fileUrl: "#", size: "1.5 MB" },
        { title: "Story Point Estimation Techniques.pdf", fileUrl: "#", size: "1.1 MB" }
      ],
      "Unit 4 - Extreme Programming": [
        { title: "TDD & Refactoring Best Practices.pdf", fileUrl: "#", size: "1.8 MB" },
        { title: "Pair Programming Guidelines.pdf", fileUrl: "#", size: "1.3 MB" }
      ],
      "Unit 5 - Transactions": [ // Map "Agile Metrics" to Unit 5 Transactions to maintain mapping schema
        { title: "Agile Metrics & KPIs.pdf", fileUrl: "#", size: "2.1 MB" },
        { title: "CI-CD Pipelines Overview.pdf", fileUrl: "#", size: "1.6 MB" }
      ]
    },
    importantQuestions: {
      "5 Marks Questions": [
        { title: "ASE 5 Marks Question Bank.pdf", fileUrl: "#", size: "650 KB" }
      ],
      "10 Marks Questions": [
        { title: "ASE 10 Marks Question Bank.pdf", fileUrl: "#", size: "780 KB" }
      ],
      "Viva Questions": [
        { title: "Agile Project Coordinator Viva Prep.pdf", fileUrl: "#", size: "480 KB" }
      ]
    },
    questionPapers: [
      { title: "Semester End Exam Paper - Dec 2025.pdf", fileUrl: "#", size: "900 KB", subfolderName: "Semester Previous Papers" },
      { title: "ASE Model Question Paper.pdf", fileUrl: "#", size: "750 KB", subfolderName: "Model Papers" }
    ],
    referenceMaterials: {
      "Text Books": [
        { title: "Software Engineering: A Practitioner's Approach - Roger Pressman.pdf", fileUrl: "#", size: "28.4 MB" }
      ],
      "Reference Books": [
        { title: "Agile Software Development with Scrum - Ken Schwaber.pdf", fileUrl: "#", size: "8.5 MB" }
      ],
      "Lab Manuals": [
        { title: "Agile Lab Manual (Jira & Trello Guide).pdf", fileUrl: "#", size: "1.8 MB" }
      ],
      "Additional Reading Material": [
        { title: "Scrum Events & Roles Reference Card.pdf", fileUrl: "#", size: "520 KB" }
      ]
    },
    additionalResources: [
      { title: "Official Scrum Guide PDF (Scrum.org)", fileUrl: "https://scrumguides.org/scrum-guide.html", size: "External Link", isLink: true },
      { title: "NPTEL Online Course - Software Engineering", fileUrl: "https://nptel.ac.in/courses/106105182", size: "External Link", isLink: true }
    ]
  },
  os: {
    syllabus: [
      { title: "Complete Syllabus (CS304).pdf", fileUrl: "#", size: "1.2 MB" },
      { title: "Unit-wise Syllabus Breakdown.pdf", fileUrl: "#", size: "480 KB" }
    ],
    unitNotes: {
      "Unit 1 - Introduction & Processes": [
        { title: "Process States & Transition.pdf", fileUrl: "#", size: "2.5 MB" },
        { title: "System Calls Overview.pdf", fileUrl: "#", size: "1.4 MB" }
      ],
      "Unit 2 - CPU Scheduling": [
        { title: "Scheduling Algorithms (FCFS, SJF, RR).pdf", fileUrl: "#", size: "2.1 MB" },
        { title: "Classic Synchronization Problems.pdf", fileUrl: "#", size: "1.6 MB" }
      ],
      "Unit 3 - Deadlocks": [
        { title: "Deadlock Characterization.pdf", fileUrl: "#", size: "1.7 MB" },
        { title: "Bankers Algorithm Example.pdf", fileUrl: "#", size: "1.2 MB" }
      ],
      "Unit 4 - Memory Management": [
        { title: "Paging & Segmentation.pdf", fileUrl: "#", size: "2.6 MB" },
        { title: "Page Replacement Algorithms.pdf", fileUrl: "#", size: "1.5 MB" }
      ],
      "Unit 5 - Storage & File Systems": [
        { title: "File Allocation Methods.pdf", fileUrl: "#", size: "2.0 MB" },
        { title: "Disk Scheduling Algorithms.pdf", fileUrl: "#", size: "1.3 MB" }
      ]
    },
    importantQuestions: {
      "5 Marks Questions": [
        { title: "OS 5 Marks Question Bank.pdf", fileUrl: "#", size: "820 KB" }
      ],
      "10 Marks Questions": [
        { title: "OS 10 Marks Question Bank.pdf", fileUrl: "#", size: "920 KB" }
      ],
      "Viva Questions": [
        { title: "OS Lab Viva Prep Cheat Sheet.pdf", fileUrl: "#", size: "580 KB" }
      ]
    },
    questionPapers: [
      { title: "Semester End Exam Paper - Dec 2025.pdf", fileUrl: "#", size: "1.1 MB", subfolderName: "Semester Previous Papers" },
      { title: "OS Model Question Paper.pdf", fileUrl: "#", size: "860 KB", subfolderName: "Model Papers" }
    ],
    referenceMaterials: {
      "Text Books": [
        { title: "Operating System Concepts - Silberschatz, Galvin.pdf", fileUrl: "#", size: "21.6 MB" }
      ],
      "Reference Books": [
        { title: "Modern Operating Systems - Andrew Tanenbaum.pdf", fileUrl: "#", size: "19.8 MB" }
      ],
      "Lab Manuals": [
        { title: "Operating Systems Laboratory Manual.pdf", fileUrl: "#", size: "1.2 MB" }
      ],
      "Additional Reading Material": [
        { title: "Classic Synchronization Problems Guide.pdf", fileUrl: "#", size: "540 KB" }
      ]
    },
    additionalResources: [
      { title: "NPTEL Online Course - Operating Systems (IIT Madras)", fileUrl: "https://nptel.ac.in/courses/106106144", size: "External Link", isLink: true },
      { title: "GateSmasher YouTube Playlist - OS Lectures", fileUrl: "https://www.youtube.com/playlist?list=PLxCzCOWd7aiGz9donHRrE9I3Mwn6XdP8p", size: "YouTube Playlist", isLink: true }
    ]
  },
  default: {
    syllabus: [
      { title: "Syllabus Overview.pdf", fileUrl: "#", size: "1.0 MB" }
    ],
    unitNotes: {
      "Unit 1 - Introduction": [
        { title: "Unit 1 Lecture Slides.pdf", fileUrl: "#", size: "2.0 MB" }
      ],
      "Unit 2 - Core Concepts": [
        { title: "Unit 2 Detailed Notes.pdf", fileUrl: "#", size: "1.8 MB" }
      ],
      "Unit 3 - Advanced Topics": [
        { title: "Unit 3 Revision Materials.pdf", fileUrl: "#", size: "2.2 MB" }
      ],
      "Unit 4 - Specialized Modules": [
        { title: "Unit 4 Case Studies.pdf", fileUrl: "#", size: "1.5 MB" }
      ],
      "Unit 5 - Applications": [
        { title: "Unit 5 Term Project Guidelines.pdf", fileUrl: "#", size: "1.7 MB" }
      ]
    },
    importantQuestions: {
      "5 Marks Questions": [
        { title: "5 Marks Short Answer Bank.pdf", fileUrl: "#", size: "600 KB" }
      ],
      "10 Marks Questions": [
        { title: "10 Marks Essay Topics.pdf", fileUrl: "#", size: "800 KB" }
      ],
      "Viva Questions": [
        { title: "Subject Viva Practice Questions.pdf", fileUrl: "#", size: "400 KB" }
      ]
    },
    questionPapers: [
      { title: "Previous Year Exam Paper.pdf", fileUrl: "#", size: "900 KB", subfolderName: "Semester Previous Papers" },
      { title: "Subject Model Question Paper.pdf", fileUrl: "#", size: "700 KB", subfolderName: "Model Papers" }
    ],
    referenceMaterials: {
      "Text Books": [
        { title: "Standard Course Textbook.pdf", fileUrl: "#", size: "12.0 MB" }
      ],
      "Reference Books": [
        { title: "Recommended Reference Book.pdf", fileUrl: "#", size: "15.0 MB" }
      ],
      "Lab Manuals": [
        { title: "Subject Laboratory Manual.pdf", fileUrl: "#", size: "1.0 MB" }
      ],
      "Additional Reading Material": [
        { title: "Suggested Supplementary Reading.pdf", fileUrl: "#", size: "1.2 MB" }
      ]
    },
    additionalResources: []
  }
};

const getCourseMockKey = (title: string) => {
  const t = title?.toLowerCase() || "";
  if (t.includes("database management")) return "dbms";
  if (t.includes("theory of computation")) return "toc";
  if (t.includes("agile software")) return "ase";
  if (t.includes("operating system")) return "os";
  return "default";
};

// Check if a DB file matches the target folder/subfolder categories
const matchDbFileToSubfolder = (title: string, category: string, subfolder: string): boolean => {
  const t = title.toLowerCase();
  
  if (category === "UNIT_NOTES") {
    if (subfolder.includes("Unit 1")) return /(unit\s*1|u\s*1)/i.test(t);
    if (subfolder.includes("Unit 2")) return /(unit\s*2|u\s*2)/i.test(t);
    if (subfolder.includes("Unit 3")) return /(unit\s*3|u\s*3)/i.test(t);
    if (subfolder.includes("Unit 4")) return /(unit\s*4|u\s*4)/i.test(t);
    if (subfolder.includes("Unit 5")) return /(unit\s*5|u\s*5)/i.test(t);
    if (subfolder === "General Notes & Guides") {
      return !/(unit\s*[1-5]|u\s*[1-5])/i.test(t);
    }
  }
  
  if (category === "IMPORTANT_QUESTIONS") {
    if (subfolder === "5 Marks Questions") return /5\s*(marks?|m)/i.test(t);
    if (subfolder === "10 Marks Questions") return /10\s*(marks?|m)/i.test(t);
    if (subfolder === "Viva Questions") return /(viva|lab)/i.test(t);
    if (subfolder === "General Question Banks") {
      return !(/5\s*(marks?|m)/i.test(t) || /10\s*(marks?|m)/i.test(t) || /(viva|lab)/i.test(t));
    }
  }
  
  if (category === "QUESTION_PAPERS") {
    if (/(mid\s*[1-2]|internal)/i.test(t)) return false; // Filter out internal papers completely
    if (subfolder === "Model Papers") return /model/i.test(t);
    if (subfolder === "Semester Previous Papers") return !/model/i.test(t);
  }
  
  if (category === "REFERENCE_MATERIALS") {
    if (subfolder === "Text Books") {
      return /(text\s*book|textbook|silberschatz|linz|pressman)/i.test(t);
    }
    if (subfolder === "Reference Books") return /reference/i.test(t);
    if (subfolder === "Lab Manuals") return /(lab|manual|instruction)/i.test(t);
    if (subfolder === "Additional Reading Material") {
      return !(
        /(text\s*book|textbook|silberschatz|linz|pressman)/i.test(t) || 
        /reference/i.test(t) || 
        /(lab|manual|instruction)/i.test(t)
      );
    }
  }

  return false;
};

const cleanTitle = (t: string): string => {
  return t.toLowerCase()
    .replace(/^(dbms|ase|toc|os)\s*[-_]?\s*/i, "")
    .replace(/^(unit\s*\d+\s*-\s*)/i, "")
    .replace(/\.pdf$/i, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
};

export default function CourseDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const courseId = params.id;
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [pdfViewerUrl, setPdfViewerUrl] = useState<string | null>(null);
  const [pdfViewerTitle, setPdfViewerTitle] = useState("");
  
  // Navigation states
  const [navPath, setNavPath] = useState<{ category: string | null; subfolder: string | null }>({
    category: null,
    subfolder: null
  });
  
  // Backlog learning path modal details
  const [isPathViewerOpen, setIsPathViewerOpen] = useState(false);
  const [isPathEditorOpen, setIsPathEditorOpen] = useState(false);
  const [pathTitle, setPathTitle] = useState("");
  const [pathDescription, setPathDescription] = useState("");
  const [prerequisites, setPrerequisites] = useState("");
  const [phases, setPhases] = useState<any[]>([
    { title: "Phase 1: Fundamentals", topics: "" },
    { title: "Phase 2: Core Concepts", topics: "" },
    { title: "Phase 3: Advanced Topics", topics: "" },
  ]);
  const [mockTests, setMockTests] = useState("");
  const [resourcesList, setResourcesList] = useState<any[]>([]);

  // Fetch current user details
  const { data: authData } = useQuery({
    queryKey: ["authMe"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) throw new Error("Unauthorized");
      return res.json();
    },
  });
  const role = authData?.data?.user?.role;

  // Fetch course metadata
  const { data: coursesData } = useQuery({
    queryKey: ["courses", role],
    queryFn: async () => {
      const url = role === "TEACHER" 
        ? "/api/courses?teacherOnly=true" 
        : role === "STUDENT"
        ? "/api/courses/enrolled"
        : "/api/courses";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch courses");
      return res.json();
    },
    enabled: !!role,
  });

  const courseDetails = useMemo(() => {
    const list = coursesData?.data?.courses || [];
    return list.find((c: any) => c.id === courseId);
  }, [coursesData, courseId]);

  // Fetch course uploaded materials
  const { data: materialsData, isLoading } = useQuery({
    queryKey: ["materials", courseId],
    queryFn: async () => {
      const res = await fetch(`/api/courses/${courseId}/materials`);
      if (!res.ok) {
        if (res.status === 403) {
          router.push("/dashboard/courses");
          throw new Error("Forbidden");
        }
        throw new Error("Failed to fetch materials");
      }
      return res.json();
    },
    enabled: !!role,
  });
  const dbMaterials: Material[] = materialsData?.data?.materials || [];

  // Fetch backlog recovery path details
  const { data: pathData } = useQuery({
    queryKey: ["courseLearningPath", courseId],
    queryFn: async () => {
      const res = await fetch(`/api/teacher/learning-path?courseId=${courseId}`);
      if (!res.ok) throw new Error("Failed to fetch learning path");
      return res.json();
    },
    enabled: !!role,
  });

  useEffect(() => {
    if (pathData?.data?.learningPath) {
      const lp = pathData.data.learningPath;
      setPathTitle(lp.title || "");
      setPathDescription(lp.description || "");
      setPrerequisites(lp.prerequisites || "");
      try {
        if (lp.studySequence) setPhases(JSON.parse(lp.studySequence));
      } catch (e) {
        console.error(e);
      }
      try {
        if (lp.mockTests) {
          const mockObj = JSON.parse(lp.mockTests);
          setMockTests(typeof mockObj === "string" ? mockObj : JSON.stringify(mockObj, null, 2));
        }
      } catch (e) {
        setMockTests(lp.mockTests || "");
      }
      if (lp.resourcesList) {
        setResourcesList(lp.resourcesList);
      }
    }
  }, [pathData]);

  const handleSavePath = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/teacher/learning-path", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          title: pathTitle || "Backlog Recovery Plan",
          description: pathDescription,
          prerequisites,
          studySequence: phases,
          resources: resourcesList,
          mockTests,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.message || "Failed to save learning plan");
        return;
      }
      alert("Learning plan configured successfully!");
      setIsPathEditorOpen(false);
      queryClient.invalidateQueries({ queryKey: ["courseLearningPath", courseId] });
    } catch (error) {
      console.error(error);
      alert("An error occurred while saving the learning plan.");
    }
  };

  const mockKey = useMemo(() => getCourseMockKey(courseDetails?.title || ""), [courseDetails]);
  const mockRepo = MOCK_REPOSITORIES[mockKey];

  const getSubfolderFileCount = (category: string, subfolder: string) => {
    let count = 0;
    
    if (category === "UNIT_NOTES") {
      count += mockRepo.unitNotes[subfolder]?.length || 0;
    } else if (category === "IMPORTANT_QUESTIONS") {
      count += mockRepo.importantQuestions[subfolder]?.length || 0;
    } else if (category === "QUESTION_PAPERS") {
      count += mockRepo.questionPapers.filter(f => f.subfolderName === subfolder).length;
    } else if (category === "REFERENCE_MATERIALS") {
      count += mockRepo.referenceMaterials[subfolder]?.length || 0;
    }

    dbMaterials.forEach(m => {
      if (category === "QUESTION_PAPERS" && /(mid\s*[1-2]|internal)/i.test(m.title)) {
        return;
      }
      
      let isCategoryMatch = m.category === category;
      if (m.category === "EXAM_PREP_KIT" && category === "REFERENCE_MATERIALS") {
        isCategoryMatch = true;
      }

      if (isCategoryMatch) {
        if (matchDbFileToSubfolder(m.title, category, subfolder)) {
          count++;
        }
      }
    });

    return count;
  };

  const renderFileRowButtons = (file: MockResource) => {
    return (
      <div className="flex gap-2 shrink-0 items-center">
        {file.isLink ? (
          <a 
            href={file.fileUrl} 
            target="_blank" 
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 border border-secondary/20 hover:bg-secondary/5 hover:border-secondary/40 text-secondary text-[10px] font-extrabold rounded-xl shadow-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <ExternalLink size={12} />
            Link
          </a>
        ) : (
          <>
            <button 
              onClick={() => { setPdfViewerTitle(file.title); setPdfViewerUrl(file.fileUrl); }}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-primary/20 hover:bg-primary/5 hover:border-primary/40 text-primary text-[10px] font-extrabold rounded-xl shadow-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Eye size={12} />
              View
            </button>
            <a 
              href={file.fileUrl} 
              download
              target="_blank"
              rel="noreferrer"
              className="w-7 h-7 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:text-slate-700 rounded-full text-slate-400 transition-all duration-200 flex items-center justify-center shrink-0 shadow-sm hover:scale-105"
            >
              <Download size={13} />
            </a>
          </>
        )}
      </div>
    );
  };

  // Resolve subfolders list for current category
  const activeSubfolders = useMemo(() => {
    if (!navPath.category) return [];
    if (navPath.category === "SYLLABUS") return [];
    
    let subfolders: string[] = [];
    if (navPath.category === "UNIT_NOTES") {
      subfolders = Object.keys(mockRepo.unitNotes);
      // Check if there are DB files of UNIT_NOTES that don't match any unit title
      const hasUnmatched = dbMaterials.some(m => 
        m.category === "UNIT_NOTES" && 
        !/(unit\s*[1-5]|u\s*[1-5])/i.test(m.title)
      );
      if (hasUnmatched) subfolders.push("General Notes & Guides");
    } else if (navPath.category === "IMPORTANT_QUESTIONS") {
      subfolders = ["5 Marks Questions", "10 Marks Questions", "Viva Questions"];
      const hasUnmatched = dbMaterials.some(m => 
        (m.category === "IMPORTANT_QUESTIONS" || m.category === "EXAM_PREP_KIT") && 
        !(/5\s*(marks?|m)/i.test(m.title) || /10\s*(marks?|m)/i.test(m.title) || /(viva|lab)/i.test(m.title))
      );
      if (hasUnmatched) subfolders.push("General Question Banks");
    } else if (navPath.category === "QUESTION_PAPERS") {
      subfolders = ["Semester Previous Papers", "Model Papers"];
    } else if (navPath.category === "REFERENCE_MATERIALS") {
      subfolders = ["Text Books", "Reference Books", "Lab Manuals", "Additional Reading Material"];
    }
    return subfolders;
  }, [navPath.category, mockRepo, dbMaterials]);

  // Retrieve files inside the currently navigated folder path
  const folderFiles = useMemo(() => {
    const { category, subfolder } = navPath;
    if (!category) return [];
    
    let rawSeeds: Omit<MockResource, "categoryKey">[] = [];

    // 1. Load mock seed files
    if (category === "SYLLABUS") {
      rawSeeds = mockRepo.syllabus;
    } else if (category === "UNIT_NOTES" && subfolder) {
      rawSeeds = mockRepo.unitNotes[subfolder] || [];
    } else if (category === "IMPORTANT_QUESTIONS" && subfolder) {
      rawSeeds = mockRepo.importantQuestions[subfolder] || [];
    } else if (category === "QUESTION_PAPERS" && subfolder) {
      rawSeeds = mockRepo.questionPapers.filter(f => f.subfolderName === subfolder);
    } else if (category === "REFERENCE_MATERIALS" && subfolder) {
      rawSeeds = mockRepo.referenceMaterials[subfolder] || [];
    }

    // 2. Load and filter DB uploaded materials
    const matchedDbMaterials = dbMaterials.filter(m => {
      // Ignore mid-term exam papers
      if (category === "QUESTION_PAPERS" && /(mid\s*[1-2]|internal)/i.test(m.title)) {
        return false;
      }

      // Check category match
      let isCategoryMatch = m.category === category;
      // Merge teacher's EXAM_PREP_KIT files into REFERENCE_MATERIALS or IMPORTANT_QUESTIONS
      if (m.category === "EXAM_PREP_KIT") {
        if (category === "REFERENCE_MATERIALS") isCategoryMatch = true;
      }

      if (isCategoryMatch) {
        // Check subfolder match if subfolders exist
        if (subfolder) {
          return matchDbFileToSubfolder(m.title, category, subfolder);
        } else if (category === "SYLLABUS") {
          return true;
        }
      }
      return false;
    });

    const usedDbIds = new Set<string>();

    // 3. Merge: Map mock placeholders to DB matches if they exist
    const files = rawSeeds.map(seed => {
      const seedClean = cleanTitle(seed.title);
      const match = matchedDbMaterials.find(m => !usedDbIds.has(m.id) && cleanTitle(m.title) === seedClean);
      if (match) {
        usedDbIds.add(match.id);
        return {
          title: match.title,
          fileUrl: match.fileUrl,
          size: match.size || "Unknown Size",
          isLink: !match.fileUrl.endsWith(".pdf") && !match.fileType?.includes("pdf"),
          categoryKey: category,
          subfolderName: subfolder || undefined
        };
      }
      return {
        ...seed,
        categoryKey: category,
        subfolderName: subfolder || undefined
      };
    });

    // 4. Append remaining DB materials that were not matched to a placeholder
    matchedDbMaterials.forEach(m => {
      if (!usedDbIds.has(m.id)) {
        files.push({
          title: m.title,
          fileUrl: m.fileUrl,
          size: m.size || "Unknown Size",
          isLink: !m.fileUrl.endsWith(".pdf") && !m.fileType?.includes("pdf"),
          categoryKey: category,
          subfolderName: subfolder || undefined
        });
      }
    });

    const hasDbMaterialsInThisFolder = matchedDbMaterials.length > 0;
    if (hasDbMaterialsInThisFolder) {
      return files.filter(f => f.fileUrl !== "#");
    }
    return files;
  }, [navPath, mockRepo, dbMaterials]);

  // Global search matching files
  const searchQueryResult = useMemo(() => {
    if (!searchQuery) return [];
    const q = searchQuery.toLowerCase();
    
    // 1. Gather all mock seeds
    const mockSeeds: MockResource[] = [];
    mockRepo.syllabus.forEach(f => mockSeeds.push({ ...f, categoryKey: "SYLLABUS" }));
    Object.keys(mockRepo.unitNotes).forEach(sub => {
      mockRepo.unitNotes[sub].forEach(f => mockSeeds.push({ ...f, categoryKey: "UNIT_NOTES", subfolderName: sub }));
    });
    Object.keys(mockRepo.importantQuestions).forEach(sub => {
      mockRepo.importantQuestions[sub].forEach(f => mockSeeds.push({ ...f, categoryKey: "IMPORTANT_QUESTIONS", subfolderName: sub }));
    });
    mockRepo.questionPapers.forEach(f => mockSeeds.push({ ...f, categoryKey: "QUESTION_PAPERS" }));
    Object.keys(mockRepo.referenceMaterials).forEach(sub => {
      mockRepo.referenceMaterials[sub].forEach(f => mockSeeds.push({ ...f, categoryKey: "REFERENCE_MATERIALS", subfolderName: sub }));
    });

    // 2. Gather all DB files (filtering out mids)
    const validDbMaterials = dbMaterials.filter(m => !/(mid\s*[1-2]|internal)/i.test(m.title));

    const usedDbIds = new Set<string>();

    // 3. Merge: Override mock seeds if matching DB materials exist
    const mergedFiles = mockSeeds.map(seed => {
      const seedClean = cleanTitle(seed.title);
      const match = validDbMaterials.find(m => {
        if (usedDbIds.has(m.id)) return false;
        
        let isCatMatch = m.category === seed.categoryKey;
        if (m.category === "EXAM_PREP_KIT" && seed.categoryKey === "REFERENCE_MATERIALS") {
          isCatMatch = true;
        }
        if (!isCatMatch) return false;

        return cleanTitle(m.title) === seedClean;
      });

      if (match) {
        usedDbIds.add(match.id);
        return {
          title: match.title,
          fileUrl: match.fileUrl,
          size: match.size || "Unknown Size",
          isLink: !match.fileUrl.endsWith(".pdf") && !match.fileType?.includes("pdf"),
          categoryKey: seed.categoryKey,
          subfolderName: seed.subfolderName
        };
      }
      return seed;
    });

    // 4. Append remaining unmatched DB materials
    validDbMaterials.forEach(m => {
      if (!usedDbIds.has(m.id)) {
        const cat = m.category === "EXAM_PREP_KIT" ? "REFERENCE_MATERIALS" : m.category;
        
        // Determine subfolder dynamically
        let matchedSubfolder = "";
        if (cat === "UNIT_NOTES") {
          if (/(unit\s*1|u\s*1)/i.test(m.title)) matchedSubfolder = "Unit 1 - Introduction to Databases";
          else if (/(unit\s*2|u\s*2)/i.test(m.title)) matchedSubfolder = "Unit 2 - ER & Relational Model";
          else if (/(unit\s*3|u\s*3)/i.test(m.title)) matchedSubfolder = "Unit 3 - SQL Queries";
          else if (/(unit\s*4|u\s*4)/i.test(m.title)) matchedSubfolder = "Unit 4 - Normalization";
          else if (/(unit\s*5|u\s*5)/i.test(m.title)) matchedSubfolder = "Unit 5 - Transactions";
          else matchedSubfolder = "General Notes & Guides";
        } else if (cat === "IMPORTANT_QUESTIONS") {
          if (/5\s*(marks?|m)/i.test(m.title)) matchedSubfolder = "5 Marks Questions";
          else if (/10\s*(marks?|m)/i.test(m.title)) matchedSubfolder = "10 Marks Questions";
          else if (/(viva|lab)/i.test(m.title)) matchedSubfolder = "Viva Questions";
          else matchedSubfolder = "General Question Banks";
        } else if (cat === "QUESTION_PAPERS") {
          if (/model/i.test(m.title)) matchedSubfolder = "Model Papers";
          else matchedSubfolder = "Semester Previous Papers";
        } else if (cat === "REFERENCE_MATERIALS") {
          if (/(text\s*book|textbook|silberschatz|linz|pressman)/i.test(m.title)) matchedSubfolder = "Text Books";
          else if (/reference/i.test(m.title)) matchedSubfolder = "Reference Books";
          else if (/(lab|manual|instruction)/i.test(m.title)) matchedSubfolder = "Lab Manuals";
          else matchedSubfolder = "Additional Reading Material";
        }

        mergedFiles.push({
          title: m.title,
          fileUrl: m.fileUrl,
          size: m.size || "Unknown Size",
          isLink: !m.fileUrl.endsWith(".pdf") && !m.fileType?.includes("pdf"),
          categoryKey: cat,
          subfolderName: matchedSubfolder || undefined
        });
      }
    });

    const hasDbMatch = mergedFiles.some(f => f.fileUrl !== "#" && f.title.toLowerCase().includes(q));
    if (hasDbMatch) {
      return mergedFiles.filter(f => f.fileUrl !== "#").filter(f => f.title.toLowerCase().includes(q));
    }
    return mergedFiles.filter(f => f.title.toLowerCase().includes(q));
  }, [searchQuery, mockRepo, dbMaterials]);

  const displayCode = useMemo(() => {
    if (courseDetails?.subjectCode && courseDetails.subjectCode !== "N/A") {
      return courseDetails.subjectCode;
    }
    return getCleanCourseCode(courseDetails?.title || "", courseDetails?.semester || 3);
  }, [courseDetails]);

  if (isLoading || !role || !courseDetails) {
    return (
      <div className="flex flex-col space-y-4 max-w-4xl mx-auto pb-12 pt-8">
        <div className="w-48 h-6 bg-slate-200 animate-pulse rounded" />
        <div className="w-full h-32 bg-slate-100 animate-pulse rounded-2xl" />
        <div className="space-y-3 mt-8">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-full h-14 bg-slate-50 animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // Display label helpers
  const getCategoryLabel = (key: string) => {
    if (key === "SYLLABUS") return "Syllabus";
    if (key === "UNIT_NOTES") return "Unit Wise Notes";
    if (key === "IMPORTANT_QUESTIONS") return "Important Questions";
    if (key === "QUESTION_PAPERS") return "Question Papers";
    if (key === "REFERENCE_MATERIALS") return "Reference Materials";
    return key;
  };

  const getCategoryIcon = (key: string) => {
    if (key === "SYLLABUS") return "📖";
    if (key === "UNIT_NOTES") return "📝";
    if (key === "IMPORTANT_QUESTIONS") return "❓";
    if (key === "QUESTION_PAPERS") return "📄";
    if (key === "REFERENCE_MATERIALS") return "📚";
    return "📁";
  };

  const getCategoryLucideIcon = (key: string) => {
    if (key === "SYLLABUS") return <BookOpen size={20} />;
    if (key === "UNIT_NOTES") return <FileText size={20} />;
    if (key === "IMPORTANT_QUESTIONS") return <HelpCircle size={20} />;
    if (key === "QUESTION_PAPERS") return <Award size={20} />;
    if (key === "REFERENCE_MATERIALS") return <BookMarked size={20} />;
    return <Folder size={20} />;
  };

  const getCategorySubtext = (key: string, repo: any, dbFiles: Material[]) => {
    let count = 0;
    if (key === "SYLLABUS") {
      count = (repo?.syllabus?.length || 0) + dbFiles.filter(f => f.category === "SYLLABUS").length;
      return `${count} syllabus file${count !== 1 ? 's' : ''}`;
    }
    if (key === "UNIT_NOTES") {
      return "5 core units available";
    }
    if (key === "IMPORTANT_QUESTIONS") {
      return "5M, 10M, & Viva question banks";
    }
    if (key === "QUESTION_PAPERS") {
      return "Semester previous & model papers";
    }
    if (key === "REFERENCE_MATERIALS") {
      return "Textbooks, reference manuals & guides";
    }
    return "Academic resource materials";
  };

  const getCategoryCardDetails = (key: string, repo: any, dbFiles: Material[]) => {
    let title = "";
    let value = "";
    let gradient = "";
    
    if (key === "SYLLABUS") {
      const count = (repo?.syllabus?.length || 0) + dbFiles.filter(f => f.category === "SYLLABUS").length;
      title = "Syllabus Core";
      value = `${count} File${count !== 1 ? 's' : ''}`;
      gradient = "from-orange-500 to-amber-400";
    } else if (key === "UNIT_NOTES") {
      title = "Academic Notes";
      value = "5 Units Available";
      gradient = "from-purple-600 to-indigo-400";
    } else if (key === "IMPORTANT_QUESTIONS") {
      title = "Important Questions";
      value = "Q&A Banks";
      gradient = "from-rose-500 to-pink-400";
    } else if (key === "QUESTION_PAPERS") {
      title = "Question Papers";
      value = "Previous Exams";
      gradient = "from-teal-500 to-cyan-400";
    } else if (key === "REFERENCE_MATERIALS") {
      title = "Reference Materials";
      value = "Textbooks & Labs";
      gradient = "from-blue-600 to-sky-400";
    }
    
    return { title, value, gradient };
  };

  return (
    <div className="max-w-4xl mx-auto pb-16 px-4 md:px-0 pt-6">
      
      {/* Back button */}
      <button 
        onClick={() => {
          if (navPath.subfolder) {
            setNavPath({ ...navPath, subfolder: null });
          } else if (navPath.category) {
            setNavPath({ category: null, subfolder: null });
          } else {
            router.push("/dashboard/my-courses");
          }
        }}
        className="flex items-center text-xs font-bold text-slate-500 hover:text-primary mb-5 transition-colors group"
      >
        <ChevronLeft size={14} className="mr-1 group-hover:-translate-x-0.5 transition-transform" />
        {navPath.subfolder ? "Back to Categories" : navPath.category ? "Back to Course Root" : "Back to Subjects"}
      </button>

      {/* Academic Header */}
      <div className="border-b border-slate-200 pb-5 mb-6 flex flex-col md:flex-row justify-between items-start gap-4 w-full">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">{courseDetails.title}</h1>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 shrink-0 md:self-start">
          {pathData?.data?.learningPath && (
            <button 
              onClick={() => setIsPathViewerOpen(true)} 
              className="flex items-center gap-1 px-3 py-2 border border-primary/20 rounded-xl hover:bg-primary/5 text-[11px] font-bold text-primary shadow-sm transition-all"
            >
              <BookMarked size={13} /> View Study Plan
            </button>
          )}
          {(role === "TEACHER" || role === "ADMIN") && (
            <>
              <button 
                onClick={() => setIsPathEditorOpen(true)} 
                className="flex items-center gap-1 px-3 py-2 border border-slate-200 rounded-xl hover:bg-slate-55 text-[11px] font-bold text-slate-700 shadow-sm transition-all"
              >
                <Sliders size={13} /> Configure Plan
              </button>
              <button 
                onClick={() => setIsUploadOpen(true)} 
                className="flex items-center gap-1 px-3 py-2 bg-primary text-white hover:bg-primary/95 rounded-xl text-[11px] font-bold shadow-sm transition-all"
              >
                <Plus size={13} /> Upload Material
              </button>
            </>
          )}
        </div>
      </div>

      {/* breadcrumbs path bar */}
      {navPath.category && (
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mb-5 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
          <button 
            onClick={() => setNavPath({ category: null, subfolder: null })}
            className="hover:text-primary transition-colors text-slate-500"
          >
            📁 {displayCode}
          </button>
          {navPath.category && (
            <>
              <span>/</span>
              <button 
                onClick={() => setNavPath({ category: navPath.category, subfolder: null })}
                className={cn("hover:text-primary transition-colors", !navPath.subfolder && "text-slate-800 font-extrabold")}
              >
                {getCategoryLabel(navPath.category)}
              </button>
            </>
          )}
          {navPath.subfolder && (
            <>
              <span>/</span>
              <span className="text-slate-800 font-extrabold">{navPath.subfolder}</span>
            </>
          )}
        </div>
      )}

      {/* Global In-Course Search */}
      <div className="flex items-center gap-3 max-w-sm mb-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 shadow-sm">
          <Search className="h-5 w-5" />
        </div>
        <div className="relative flex-1 shadow-sm rounded-xl">
          <input
            type="text"
            placeholder="Search files in this course..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/15 transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* NAVIGATION TREE / FILE LIST VIEW */}
      {searchQuery || (navPath.category && (navPath.subfolder || activeSubfolders.length === 0)) ? (
        // Render files inside an overflow-hidden card list panel
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm divide-y divide-slate-100">
          {searchQuery ? (
            /* Search Results Display */
            <>
              <div className="p-3 bg-slate-50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Search Results ({searchQueryResult.length})
              </div>
              {searchQueryResult.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs italic">
                  No matching files found.
                </div>
              ) : (
                searchQueryResult.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 hover:bg-slate-55 transition-colors">
                    <div className="flex items-center gap-3 min-w-0 pr-4">
                      <FileText size={18} className="text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-700 truncate" title={file.title}>
                          {file.title}
                        </p>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                          {getCategoryLabel(file.categoryKey)} {file.subfolderName ? `> ${file.subfolderName}` : ""} • {file.size}
                        </p>
                      </div>
                    </div>
                    {renderFileRowButtons(file)}
                  </div>
                ))
              )}
            </>
          ) : (
            /* FILE DIRECTORY VIEW (Inside a subfolder, or category with no subfolders like Syllabus) */
            folderFiles.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs italic">
                No files inside this folder yet.
              </div>
            ) : (
              folderFiles.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0 pr-4">
                    <FileText size={18} className="text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-700 truncate" title={file.title}>
                        {file.title}
                      </p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                        {file.size}
                      </p>
                    </div>
                  </div>
                  {renderFileRowButtons(file)}
                </div>
              ))
            )
          )}
        </div>
      ) : (
        // Render folders and subfolders as a grid of beautiful cards!
        <div>
          {/* ROOT DIRECTORY VIEW */}
          {navPath.category === null && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {["SYLLABUS", "UNIT_NOTES", "IMPORTANT_QUESTIONS", "QUESTION_PAPERS", "REFERENCE_MATERIALS"].map((key) => {
                const { title, value, gradient } = getCategoryCardDetails(key, mockRepo, dbMaterials);
                
                return (
                  <button
                    key={key}
                    onClick={() => setNavPath({ category: key, subfolder: null })}
                    className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col justify-between items-start text-left w-full group cursor-pointer shadow-sm hover:shadow-[0_15px_30px_rgba(0,0,0,0.04)] hover:border-slate-350 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden min-h-[150px]"
                  >
                    {/* Symbol on the Top Right */}
                    <div className="absolute top-6 right-6">
                      <div className={cn("w-10 h-10 rounded-full bg-gradient-to-tr flex items-center justify-center text-white shadow-sm transition-transform duration-300 group-hover:scale-110", gradient)}>
                        {getCategoryLucideIcon(key)}
                      </div>
                    </div>

                    <div className="pr-12 w-full">
                      {/* Title on Top */}
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        {title}
                      </span>
                      
                      {/* Bold Value below it */}
                      <h3 className="text-xl font-black text-slate-800 group-hover:text-primary transition-colors line-clamp-1">
                        {getCategoryLabel(key)}
                      </h3>
                      
                      <p className="text-[11px] font-semibold text-slate-500 mt-1">
                        {value}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 text-[10px] font-extrabold text-slate-400 group-hover:text-primary transition-colors mt-auto pt-4 w-full justify-between">
                      <span>Explore files</span>
                      <ArrowRight size={12} className="text-slate-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* CATEGORY DIRECTORY VIEW (Lists subfolders) */}
          {navPath.category && !navPath.subfolder && activeSubfolders.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {activeSubfolders.map((sub, idx) => {
                const fileCount = getSubfolderFileCount(navPath.category!, sub);
                const gradients = [
                  "from-purple-600 to-indigo-400",
                  "from-teal-500 to-cyan-400",
                  "from-blue-600 to-sky-400",
                  "from-orange-500 to-amber-400",
                  "from-rose-500 to-pink-400"
                ];
                const gradient = gradients[idx % gradients.length];
                
                return (
                  <button
                    key={sub}
                    onClick={() => setNavPath({ category: navPath.category, subfolder: sub })}
                    className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col justify-between items-start text-left w-full group cursor-pointer shadow-sm hover:shadow-[0_15px_30px_rgba(0,0,0,0.04)] hover:border-slate-350 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden min-h-[150px]"
                  >
                    {/* Symbol on the Top Right */}
                    <div className="absolute top-6 right-6">
                      <div className={cn("w-10 h-10 rounded-full bg-gradient-to-tr flex items-center justify-center text-white shadow-sm transition-transform duration-300 group-hover:scale-110", gradient)}>
                        <Folder className="group-hover:hidden text-white" size={18} />
                        <FolderOpen className="hidden group-hover:block text-white" size={18} />
                      </div>
                    </div>

                    <div className="pr-12 w-full">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Directory Folder
                      </span>
                      
                      <h3 className="text-sm font-extrabold text-slate-800 group-hover:text-primary transition-colors line-clamp-2 mb-1 min-h-[2.5rem]">
                        {sub}
                      </h3>
                      
                      <p className="text-[11px] font-semibold text-slate-500 mt-1">
                        {fileCount} file{fileCount !== 1 ? 's' : ''} available
                      </p>
                    </div>

                    <div className="flex items-center gap-1 text-[10px] font-extrabold text-slate-400 group-hover:text-primary transition-colors mt-auto pt-4 w-full justify-between">
                      <span>Open folder</span>
                      <ArrowRight size={12} className="text-slate-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ADDITIONAL RESOURCES SECTION AT BOTTOM */}
      {navPath.category === null && !searchQuery && mockRepo.additionalResources && mockRepo.additionalResources.length > 0 && (
        <div className="mt-8 bg-slate-50 border border-slate-200 rounded-2xl p-5">
          <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-4 flex items-center gap-1.5">
            <span>🔗</span> Additional Resources
          </h3>
          <div className="divide-y divide-slate-200/60 bg-white border border-slate-200/60 rounded-xl overflow-hidden shadow-inner-sm">
            {mockRepo.additionalResources.map((res, idx) => (
              <a
                key={idx}
                href={res.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3.5 hover:bg-slate-55 transition-colors text-slate-600 hover:text-slate-900 group"
              >
                <div className="min-w-0 pr-4">
                  <p className="text-xs font-bold truncate">{res.title}</p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{res.size}</p>
                </div>
                <ExternalLink size={13} className="text-slate-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: Real PDF Viewer Modal */}
      <AnimatePresence>
        {pdfViewerUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, y: 15, opacity: 0 }} 
              animate={{ scale: 1, y: 0, opacity: 1 }} 
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-white border border-slate-200 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[85vh]"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="min-w-0 pr-4">
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded uppercase tracking-wide">
                    {displayCode} • Document
                  </span>
                  <h3 className="text-base font-bold text-slate-800 truncate mt-1">{pdfViewerTitle}</h3>
                </div>
                <div className="flex items-center gap-3">
                  {pdfViewerUrl !== "#" && (
                    <a 
                      href={pdfViewerUrl} 
                      download 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/95 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                    >
                      <Download size={13} />
                      Download
                    </a>
                  )}
                  <button 
                    onClick={() => { setPdfViewerUrl(null); setPdfViewerTitle(""); }}
                    className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-100 text-slate-500 transition-colors text-sm font-bold"
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              <div className="flex-1 bg-slate-100 p-4 relative flex items-center justify-center">
                {pdfViewerUrl === "#" ? (
                  <div className="text-center p-8 bg-white border border-slate-200 rounded-2xl max-w-md shadow-md">
                    <FileText size={48} className="text-slate-300 mx-auto mb-4" />
                    <h4 className="text-sm font-bold text-slate-700 mb-1">Mock Syllabus / Notes PDF Document</h4>
                    <p className="text-xs text-slate-400 mb-4">This curriculum resource is a pre-loaded placeholder for demonstration. In a production environment, the actual syllabus or unit notes file is compiled and rendered here.</p>
                    <button 
                      onClick={() => { setPdfViewerUrl(null); setPdfViewerTitle(""); }} 
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all"
                    >
                      Return to Workspace
                    </button>
                  </div>
                ) : (
                  <iframe 
                    src={`${pdfViewerUrl}#toolbar=1`} 
                    className="w-full h-full rounded-xl border border-slate-200 bg-white" 
                    title="PDF Document Viewer"
                  />
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: View Recommended Study Plan (Backlog Recovery Details) */}
      <AnimatePresence>
        {isPathViewerOpen && pathData?.data?.learningPath && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-200 w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
            >
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/60 shrink-0">
                <div>
                  <h3 className="font-bold text-base text-slate-800">
                    Recommended Study Plan
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Recommended learning sequence and chapter weightage.</p>
                </div>
                <button onClick={() => setIsPathViewerOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-5 flex-1">
                {prerequisites && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <p className="text-[10px] font-extrabold uppercase text-slate-400">Prerequisites Required</p>
                    <p className="text-xs font-bold text-slate-700 mt-1">{prerequisites}</p>
                  </div>
                )}
                
                <div className="space-y-3">
                  <p className="text-[10px] font-extrabold uppercase text-slate-400">Study Sequence Chapters</p>
                  {phases.map((phase, idx) => (
                    <div key={idx} className="flex gap-3 bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm items-start">
                      <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-extrabold shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">{phase.title}</p>
                        <p className="text-xs text-slate-500 font-semibold mt-1 leading-relaxed">{phase.topics}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Upload Material (Teachers/Admins Only) */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        courseId={courseId}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["materials", courseId] });
        }}
      />

      {/* MODAL: Configure Recovery Path (Teachers/Admins Only) */}
      <AnimatePresence>
        {isPathEditorOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-300 w-full max-w-2xl my-8 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">
                    Configure Course Learning Plan
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Define study sequence and resource lists for backlogs.</p>
                </div>
                <button onClick={() => setIsPathEditorOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSavePath} className="p-6 space-y-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Plan Title
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Operating Systems Recovery Plan"
                      value={pathTitle}
                      onChange={(e) => setPathTitle(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-750 focus:outline-none focus:border-primary transition-colors text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Prerequisites
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. C Programming, Computer Architecture"
                      value={prerequisites}
                      onChange={(e) => setPrerequisites(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-750 focus:outline-none focus:border-primary transition-colors text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Plan Description
                  </label>
                  <textarea
                    placeholder="Briefly state how this plan helps students organize backlog revisions..."
                    value={pathDescription}
                    onChange={(e) => setPathDescription(e.target.value)}
                    rows={2}
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-755 focus:outline-none focus:border-primary transition-colors text-sm"
                  />
                </div>

                {/* Phase Editor */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Study Sequence Chapters/Phases
                    </label>
                    <button
                      type="button"
                      onClick={() => setPhases([...phases, { title: `Phase ${phases.length + 1}`, topics: "" }])}
                      className="text-primary text-xs font-bold hover:underline flex items-center gap-1"
                    >
                      <Plus size={14} /> Add Phase
                    </button>
                  </div>

                  <div className="space-y-3">
                    {phases.map((phase, idx) => (
                      <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 relative group space-y-3">
                        <button
                          type="button"
                          onClick={() => setPhases(phases.filter((_, i) => i !== idx))}
                          className="absolute right-3 top-3 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={16} />
                        </button>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="md:col-span-1">
                            <input
                              type="text"
                              required
                              placeholder="Phase Title"
                              value={phase.title}
                              onChange={(e) => {
                                const newPhases = [...phases];
                                newPhases[idx].title = e.target.value;
                                setPhases(newPhases);
                              }}
                              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-755 focus:outline-none focus:border-primary transition-colors text-xs font-bold"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <input
                              type="text"
                              required
                              placeholder="Topics / Guidelines"
                              value={phase.topics}
                              onChange={(e) => {
                                const newPhases = [...phases];
                                newPhases[idx].topics = e.target.value;
                                setPhases(newPhases);
                              }}
                              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-755 focus:outline-none focus:border-primary transition-colors text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsPathEditorOpen(false)}
                    className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-primary text-white font-bold rounded-xl text-sm shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all"
                  >
                    Save Plan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
