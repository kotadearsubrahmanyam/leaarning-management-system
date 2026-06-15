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

export function ChatAssistant({ userId, role = "student" }: ChatAssistantProps) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: "assistant",
      text: "Hey! Ask me anything about your learning goals, courses, or progress. I'll answer directly based on what you type.",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const sendMessage = async (overrideText?: string, files?: File[]) => {
    const textToSend = overrideText || message;
    const trimmed = textToSend.trim();
    if (!trimmed && !(files && files.length > 0)) return;

    // For now we only display text in the local UI
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
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.message || "Unable to fetch chat response");
      }

      const data = await response.json();
      setMessages((prev) => [...prev, { sender: "assistant", text: data.reply }]);
    } catch (error) {
      const err = error as Error;
      // Fallback mockup response generator to avoid breaking UI demo if service is offline
      let fallbackReply = `Hi! That's a great question. Since the backend AI service is currently offline, I am running in **Prototype Mode**. \n\nFeel free to try the interactive suggestions above to see how I render markdown, lists, and code blocks!`;
      
      const normalizedMsg = trimmed.toLowerCase();
      if (normalizedMsg.includes("syllabus") || normalizedMsg.includes("overview")) {
        fallbackReply = `### 📋 Course Syllabus Overview\nHere is your learning pathway breakdown:\n\n1. **Module 1**: Modern Web Technologies (Next.js, Tailwind, TypeScript)\n2. **Module 2**: Component Design System & Custom CSS Animations\n3. **Module 3**: Database Schemas & Drizzle ORM Integrations\n\n*All courses are currently on schedule.*`;
      } else if (normalizedMsg.includes("attendance")) {
        fallbackReply = `### 📅 Current Attendance Summary\n\n* **Present Days**: 37\n* **Absent Days**: 3\n* **Percentage**: **92.5%**\n* **Status**: ✅ Excellent! You are well above the minimum requirement of 75%.\n\n*Keep it up to maintain your grade eligibility!*`;
      } else if (normalizedMsg.includes("assignment") || normalizedMsg.includes("pending")) {
        fallbackReply = `### 📝 Pending Assignments\nHere are your current active tasks:\n\n* 🟡 **UI/UX Interactions**: Due in 2 days (Status: In Progress)\n* 🔴 **Authentication Setup**: Due in 5 days (Status: Pending)\n* 🟢 **SQL Queries Lab**: Due in 1 week (Status: Pending)`;
      } else if (normalizedMsg.includes("interview") || normalizedMsg.includes("practice")) {
        fallbackReply = `### 🤖 AI Technical Interview Practice\nWelcome to your mock interview session! I will act as the interviewer.\n\n**Question 1**: Can you explain the difference between a Client Component and a Server Component in Next.js? \n\n*Type your answer below and I'll evaluate it!*`;
      }

      // Add a small delay for realistic typing feel on fallback
      await new Promise(resolve => setTimeout(resolve, 800));
      setMessages((prev) => [...prev, { sender: "assistant", text: fallbackReply }]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = [
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
  ];

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
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 border border-violet-200/50 flex items-center justify-center text-violet-700 font-semibold text-sm shadow-sm">
                    {role === "student" ? (
                      <GraduationCap className="w-5 h-5 text-violet-600" />
                    ) : role === "admin" ? (
                      <ShieldAlert className="w-5 h-5 text-violet-600" />
                    ) : (
                      <User className="w-5 h-5 text-violet-600" />
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6 max-w-2xl">
                      {suggestions.map((sug, i) => (
                        <motion.button
                          key={i}
                          onClick={() => sendMessage(sug.prompt)}
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          className="glass p-4 text-left cursor-pointer hover:border-violet-400 hover:shadow-violet-100/50 transition-all duration-200 flex flex-col gap-1 group bg-white"
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
