"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedButton } from "@/components/ui/animated-button";
import { AnimatedInput } from "@/components/ui/animated-input";
import ReactMarkdown from "react-markdown";
import { PromptInputBox } from "@/components/ui/ai-prompt-box";
import { Sparkles, Bot, User, GraduationCap, ShieldAlert } from "lucide-react";

interface ChatAssistantProps {
  userId: string;
  role: string;
}

interface ChatMessage {
  sender: "user" | "assistant";
  text: string;
}

const CONFIG = {
  STUDENT: {
    greeting: "Hey! Ask me anything about your learning goals, courses, or academic progress.",
    quickActions: [
      {
        label: "📋 Syllabus Overview",
        prompt: "Give me an overview of my current course syllabus and key topics.",
        desc: "Understand your learning pathway",
      },
      {
        label: "📅 Attendance Status",
        prompt: "Show me my attendance records and summary.",
        desc: "Check your presence percentage",
      },
      {
        label: "📝 Pending Assignments",
        prompt: "What are my upcoming and pending assignments?",
        desc: "Keep track of deadlines",
      },
      {
        label: "🤖 AI Interview Practice",
        prompt: "I want to start a practice mock interview session.",
        desc: "Prepare for placements",
      },
    ],
    additionalActions: [
      {
        label: "📚 Important Questions",
        prompt: "Can you provide a list of important questions for my subjects?",
        desc: "View exam critical topics",
      },
      {
        label: "📄 Previous Year Papers",
        prompt: "Where can I find previous year exam papers?",
        desc: "Practice with old question sets",
      },
      {
        label: "🎯 Backlog Recovery Plan",
        prompt: "Generate a backlog recovery and exam prep plan for me.",
        desc: "Create a custom study schedule",
      },
      {
        label: "📌 Exam Preparation Tips",
        prompt: "What are some effective tips for exam preparation?",
        desc: "Optimize your study strategy",
      },
    ]
  },
  TEACHER: {
    greeting: "Hello! I can help you manage courses, monitor students, and improve learning outcomes.",
    quickActions: [
      {
        label: "📊 Attendance Analytics",
        prompt: "Show me the attendance analytics for my classes.",
        desc: "Review overall course presence",
      },
      {
        label: "⚠️ At-Risk Students",
        prompt: "Identify students with low attendance or performance risk.",
        desc: "Find students requiring intervention",
      },
      {
        label: "🛣️ Learning Path Management",
        prompt: "How do I manage or design course learning paths?",
        desc: "Organize structured lesson units",
      },
      {
        label: "📝 Assignment Insights",
        prompt: "Show me insights and submission stats for recent assignments.",
        desc: "Track evaluations and submissions",
      },
    ],
    additionalActions: [
      {
        label: "📚 Upload Study Materials",
        prompt: "Guide me on uploading new study materials to my courses.",
        desc: "Add syllabus resources",
      },
      {
        label: "📅 Class Schedule",
        prompt: "Show my upcoming class schedules and timetable slots.",
        desc: "View today's timetable",
      },
      {
        label: "📈 Student Performance Trends",
        prompt: "What are the recent student performance trends in exams?",
        desc: "Analyze grades and averages",
      },
      {
        label: "🎯 Supplementary Exam Support",
        prompt: "How do I set up or manage supplementary exam support for backlogs?",
        desc: "Assist students with recovery",
      },
    ]
  }
};

export function ChatAssistant({ userId, role = "STUDENT" }: ChatAssistantProps) {
  const [message, setMessage] = useState("");
  
  const roleKey = role?.toUpperCase() === "TEACHER" ? "TEACHER" : "STUDENT";
  const config = CONFIG[roleKey];

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Set greeting message when role changes
  useEffect(() => {
    setMessages([
      {
        sender: "assistant",
        text: config.greeting,
      },
    ]);
  }, [role, config.greeting]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const sendMessage = async (overrideText?: string, files?: File[]) => {
    const textToSend = overrideText || message;
    const trimmed = textToSend.trim();
    if (!trimmed && !(files && files.length > 0)) return;

    // Display user text in chat
    const userMessage: ChatMessage = { sender: "user", text: trimmed || "[Image Attached]" };
    setMessages((prev) => [...prev, userMessage]);
    setMessage("");
    setIsLoading(true);

    try {
      const chatHistory = messages.map(m => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.text
      }));

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          message: trimmed,
          history: chatHistory,
          interests: [],
          completed_courses: [],
          preferred_levels: [],
          recent_activity: [],
          time_spent_minutes: 0,
          quiz_scores: [],
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to fetch chat response");
      }

      const data = await response.json();
      setMessages((prev) => [...prev, { sender: "assistant", text: data.reply }]);
    } catch (error) {
      // Fallback mockup response generator (Prototype Mode)
      let fallbackReply = `Hi! That's a great question. Since the backend AI service is currently offline, I am running in **Prototype Mode**. \n\nFeel free to try the interactive suggestions above to see how I render markdown, lists, and code blocks!`;
      
      const normalizedMsg = trimmed.toLowerCase();
      const isTeacher = roleKey === "TEACHER";

      if (isTeacher) {
        if (normalizedMsg.includes("attendance analytics") || normalizedMsg.includes("analytics")) {
          fallbackReply = `### 📊 Course Attendance Analytics\nHere is the latest semester attendance dashboard metrics across all subjects:\n\n* **Average Attendance Rate**: **79.4%**\n* **Good Standing (≥75%)**: 42 students\n* **Warning Range (65%-74%)**: 8 students\n* **Critical Range (<65%)**: 3 students (requires intervention)\n\n*Action suggested: Go to Course Attendance Analytics to review details.*`;
        } else if (normalizedMsg.includes("at-risk") || normalizedMsg.includes("risk")) {
          fallbackReply = `### ⚠️ At-Risk Students\nThese students are currently falling below the required attendance threshold and require intervention:\n\n1. **Student B** (Roll: CSE002) - **68%** Attendance (Warning Status)\n2. **Student D** (Roll: CSE004) - **58%** Attendance (Critical Status)\n3. **Student H** (Roll: CSE008) - **61%** Attendance (Critical Status)\n\n*You can send warning notifications directly from the Course Attendance Analytics dashboard.*`;
        } else if (normalizedMsg.includes("learning path") || normalizedMsg.includes("path")) {
          fallbackReply = `### 🛣️ Learning Path Management\nManage course resources and structure sequential milestones:\n\n1. **Unit 1: Introduction to Web Architectures** (Syllabus loaded)\n2. **Unit 2: Client vs Server Rendering** (Notes uploaded)\n3. **Unit 3: Relational Databases & Schema Design** (Lab worksheet missing)\n\n*Tip: Upload important questions for Unit 3 to boost student exam readiness.*`;
        } else if (normalizedMsg.includes("assignment insights") || normalizedMsg.includes("insights")) {
          fallbackReply = `### 📝 Assignment Insights & Performance\nOverview of latest student submissions:\n\n* **Assignment 1 (SQL Joins)**:\n  * Submission Rate: **94%** (47/50 students)\n  * Average Grade: **82.5%**\n  * Pending Evaluations: **0**\n* **Assignment 2 (React state)**:\n  * Submission Rate: **72%** (36/50 students)\n  * Pending Evaluations: **14** (Evaluation deadline in 3 days)`;
        } else if (normalizedMsg.includes("upload") || normalizedMsg.includes("materials")) {
          fallbackReply = `### 📚 Upload Study Materials Guide\nTo add study materials and resources for your students:\n\n1. Go to **My Courses** from the sidebar.\n2. Choose your course subject card.\n3. Scroll to the **Study Materials** section.\n4. Click **+ Add Material**, fill in the resource details (Notes, Paper, Question Bank), and upload the file.\n\n*Once uploaded, students will get a real-time notification.*`;
        } else if (normalizedMsg.includes("schedule") || normalizedMsg.includes("timetable")) {
          fallbackReply = `### 📅 Timetable Schedule\nHere are your scheduled lectures for today:\n\n* 🕒 **09:00 AM - 10:00 AM**: Operating Systems (CSE-A)\n* 🕒 **11:00 AM - 12:00 PM**: Operating Systems (CSE-B)\n* 🕒 **02:00 PM - 03:30 PM**: DBMS Laboratory (CSE-A)`;
        } else if (normalizedMsg.includes("performance") || normalizedMsg.includes("trends")) {
          fallbackReply = `### 📈 Student Performance Trends\nAnalysis of latest test grades and CGPA trends:\n\n* **Top Grade Earners (A+ or A)**: 15 Students (30%)\n* **Average Grade Range (B+ or B)**: 28 Students (56%)\n* **Needs Support (C or F)**: 7 Students (14%)\n\n*Trend: Grades have improved by 4.2% since the mid-semester evaluation.*`;
        } else if (normalizedMsg.includes("supplementary") || normalizedMsg.includes("support")) {
          fallbackReply = `### 🎯 Supplementary Exam Support\nRemedial planning for backlog students:\n\n* **Active Backlog Cases**: 4 students in database systems.\n* **Action Items**:\n  1. Review previous year question banks.\n  2. Assign targeted remedial assignments.\n  3. Conduct doubts-clearing sessions.\n\n*You can coordinate remedial materials via the Learning Path manager.*`;
        }
      } else {
        if (normalizedMsg.includes("syllabus") || normalizedMsg.includes("overview")) {
          fallbackReply = `### 📋 Course Syllabus Overview\nHere is your learning pathway breakdown:\n\n1. **Module 1**: Modern Web Technologies (Next.js, Tailwind, TypeScript)\n2. **Module 2**: Component Design System & Custom CSS Animations\n3. **Module 3**: Database Schemas & Drizzle ORM Integrations\n\n*All courses are currently on schedule.*`;
        } else if (normalizedMsg.includes("attendance")) {
          fallbackReply = `### 📅 Current Attendance Summary\n\n* **Present Days**: 23\n* **Absent Days**: 5\n* **Percentage**: **82.1%**\n* **Status**: ✅ Good standing! You are above the minimum requirement of 75%.\n\n*Keep attending classes to stay safe from detentions.*`;
        } else if (normalizedMsg.includes("assignment") || normalizedMsg.includes("pending")) {
          fallbackReply = `### 📝 Pending Assignments\nHere are your current active tasks:\n\n* 🟡 **UI/UX Interactions**: Due in 2 days (Status: In Progress)\n* 🔴 **Authentication Setup**: Due in 5 days (Status: Pending)\n* 🟢 **SQL Queries Lab**: Due in 1 week (Status: Pending)`;
        } else if (normalizedMsg.includes("interview") || normalizedMsg.includes("practice")) {
          fallbackReply = `### 🤖 AI Technical Interview Practice\nWelcome to your mock interview session! I will act as the interviewer.\n\n**Question 1**: Can you explain the difference between a Client Component and a Server Component in Next.js? \n\n*Type your answer below and I'll evaluate it!*`;
        } else if (normalizedMsg.includes("important") || normalizedMsg.includes("questions")) {
          fallbackReply = `### 📚 Important Exam Questions\nHere are the most frequently asked questions in university exams for your subjects:\n\n1. Explain the ACID properties in DBMS with real-world examples.\n2. Detail the page replacement algorithms (LRU, FIFO, Optimal) in OS.\n3. Compare Next.js Client Components and Server Components.\n\n*Ensure you practice writing detailed answers for these!*`;
        } else if (normalizedMsg.includes("papers") || normalizedMsg.includes("previous")) {
          fallbackReply = `### 📄 Previous Year Papers\nPrevious year papers have been compiled for your subjects:\n\n* 📥 **Operating Systems** (2025 Regular, 2024 Supply)\n* 📥 **DBMS** (2025 Regular, 2024 Regular)\n* 📥 **Web Development** (2025 Mid-sem, 2024 Regular)\n\n*Go to the Materials page to download the PDF papers directly.*`;
        } else if (normalizedMsg.includes("backlog") || normalizedMsg.includes("recovery")) {
          fallbackReply = `### 🎯 Backlog Recovery Plan\nIf you have any pending backlogs, follow this recovery roadmap:\n\n1. **Step 1**: Target supplementary exams (check dates on Academic Calendar).\n2. **Step 2**: Solve the 'Important Questions' list.\n3. **Step 3**: Attempt at least 3 previous year papers.\n4. **Step 4**: Attend doubt-clearing remedial sessions.\n\n*Your teacher can assign specific supplementary support materials if needed.*`;
        } else if (normalizedMsg.includes("tips") || normalizedMsg.includes("prep")) {
          fallbackReply = `### 📌 Exam Preparation Tips\nBoost your scores with these guidelines:\n\n1. **Study in blocks**: 45 minutes study, 10 minutes rest.\n2. **Practice with code/diagrams**: Don't just read notes; write down code blocks and draw ER/Schema diagrams.\n3. **Group study**: Explain topics to peer students (highest retention technique).\n4. **Self-test**: Take practice quizzes available on the quizzes dashboard tab.`;
        }
      }

      await new Promise(resolve => setTimeout(resolve, 800));
      setMessages((prev) => [...prev, { sender: "assistant", text: fallbackReply }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-transparent">
      {/* Header Container with premium styling */}
      <div className="flex items-center justify-between p-4 pl-24 shrink-0 border border-slate-200/50 rounded-2xl bg-white/70 backdrop-blur-md shadow-sm mb-4 mx-4 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 shadow-inner">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-slate-800 tracking-tight">AI Companion</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Online</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Always here to help you learn and succeed.</p>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto w-full custom-scrollbar" ref={scrollRef}>
        <div className="max-w-4xl mx-auto w-full space-y-6 py-6 px-4 pl-20 md:pl-4">
          <AnimatePresence initial={false}>
            {messages.map((item, index) => (
              <motion.div
                key={`${item.sender}-${index}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={`flex items-start gap-3.5 ${
                  item.sender === "user" ? "flex-row-reverse justify-start" : "justify-start"
                }`}
              >
                {/* Avatar */}
                {item.sender === "assistant" ? (
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-500/20 border border-violet-400/30">
                    <Bot className="w-5 h-5 text-white animate-pulse" />
                  </div>
                ) : (
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 border border-violet-200/50 flex items-center justify-center text-violet-700 font-semibold text-sm shadow-sm">
                    {roleKey === "STUDENT" ? (
                      <GraduationCap className="w-5 h-5 text-violet-600" />
                    ) : roleKey === "TEACHER" ? (
                      <User className="w-5 h-5 text-violet-600" />
                    ) : (
                      <ShieldAlert className="w-5 h-5 text-violet-600" />
                    )}
                  </div>
                )}

                {/* Message Bubble */}
                <div className="flex flex-col max-w-[80%]">
                  <div
                    className={`${
                      item.sender === "user"
                        ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-2xl rounded-tr-none px-5 py-3.5 shadow-md shadow-violet-500/10 border border-violet-500/20 text-[15px] leading-relaxed"
                        : "glass px-5 py-3.5 text-[15px] leading-relaxed shadow-sm rounded-tl-none bg-white"
                    }`}
                  >
                    {item.sender === "user" ? (
                      item.text
                    ) : (
                      <div className="prose prose-sm max-w-none text-foreground prose-slate prose-p:leading-relaxed prose-pre:bg-slate-55 prose-pre:border prose-pre:border-slate-100">
                        <ReactMarkdown>{item.text}</ReactMarkdown>
                      </div>
                    )}
                  </div>

                  {/* Render Quick Suggestion Cards on the initial welcome message */}
                  {index === 0 && messages.length === 1 && (
                    <div className="mt-6 space-y-6 max-w-2xl">
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 pl-1">
                          ⚡ Quick Actions
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {config.quickActions.map((sug, i) => (
                            <motion.button
                              key={i}
                              onClick={() => sendMessage(sug.prompt)}
                              whileHover={{ scale: 1.02, y: -2 }}
                              whileTap={{ scale: 0.98 }}
                              className="glass p-4 text-left cursor-pointer hover:border-violet-400 hover:shadow-violet-100/50 transition-all duration-200 flex flex-col gap-1 group bg-white rounded-2xl border border-slate-200"
                            >
                              <span className="font-semibold text-slate-800 text-[14px] group-hover:text-violet-700 transition-colors">
                                {sug.label}
                              </span>
                              <span className="text-xs text-slate-500 leading-normal">
                                {sug.desc}
                              </span>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 pl-1">
                          💡 Suggested Actions
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {config.additionalActions.map((sug, i) => (
                            <motion.button
                              key={i}
                              onClick={() => sendMessage(sug.prompt)}
                              whileHover={{ scale: 1.02, y: -2 }}
                              whileTap={{ scale: 0.98 }}
                              className="glass p-4 text-left cursor-pointer hover:border-violet-400 hover:shadow-violet-100/50 transition-all duration-200 flex flex-col gap-1 group bg-white rounded-2xl border border-slate-200"
                            >
                              <span className="font-semibold text-slate-800 text-[14px] group-hover:text-violet-700 transition-colors">
                                {sug.label}
                              </span>
                              <span className="text-xs text-slate-500 leading-normal">
                                {sug.desc}
                              </span>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            {/* Thinking Indicator */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex items-start gap-3.5 justify-start"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-500/20 border border-violet-400/30">
                  <Bot className="w-5 h-5 text-white animate-pulse" />
                </div>
                <div className="glass px-5 py-4 rounded-2xl rounded-tl-none bg-white flex items-center gap-1.5 min-h-[50px]">
                  <div className="w-2 h-2 bg-violet-600 rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
                  <div className="w-2 h-2 bg-violet-600 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
                  <div className="w-2 h-2 bg-violet-600 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Input bar */}
      <div className="shrink-0 w-full bg-gradient-to-t from-background via-background/80 to-transparent pt-4 pb-6 mt-auto">
        <div className="max-w-4xl mx-auto w-full px-4 pl-20 md:pl-4">
          <PromptInputBox
            value={message}
            onChange={setMessage}
            isLoading={isLoading}
            onSend={sendMessage}
            placeholder="Message AI Companion..."
          />
          <p className="text-center text-[11px] text-slate-500 mt-3 font-medium">
            AI Companion can make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </div>
  );
}
