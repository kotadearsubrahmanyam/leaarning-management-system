"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { AnimatedButton } from "@/components/ui/animated-button";
import { AnimatedInput } from "@/components/ui/animated-input";
import ReactMarkdown from "react-markdown";
import { PromptInputBox } from "@/components/ui/ai-prompt-box";

interface ChatAssistantProps {
  userId: string;
  role: string;
}

interface ChatMessage {
  sender: "user" | "assistant";
  text: string;
}

export function ChatAssistant({ userId }: ChatAssistantProps) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: "assistant",
      text: "Hey! Ask me anything about your learning goals, courses, or progress. I’ll answer directly based on what you type.",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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
      setMessages((prev) => [
        ...prev,
        {
          sender: "assistant",
          text: `Sorry, I couldn't answer that. ${err.message || "Try again soon."}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-transparent">
      <div className="flex items-center justify-between p-4 pl-24 shrink-0 border-b border-border sticky top-0 z-10 bg-background/80 backdrop-blur-md">
        <div>
          <div className="text-xl font-bold text-foreground tracking-tight">AI Companion</div>
          <p className="text-sm text-muted-foreground mt-0.5">Always here to help you learn.</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto w-full custom-scrollbar" ref={scrollRef}>
        <div className="max-w-4xl mx-auto w-full space-y-8 py-8 px-4 pl-20 md:pl-4">
            {messages.map((item, index) => (
              <div
                key={`${item.sender}-${index}`}
                className={`flex ${item.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[95%] w-fit rounded-2xl px-6 py-4 text-[15px] leading-relaxed shadow-sm ${
                    item.sender === "user"
                      ? "bg-primary text-primary-foreground shadow-primary/20"
                      : "bg-card text-card-foreground border border-border shadow-sm"
                  }`}
                >
                  {item.sender === "user" ? (
                    item.text
                  ) : (
                    <div className="prose prose-sm max-w-none text-foreground">
                      <ReactMarkdown>
                        {item.text}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
      </div>

      <div className="shrink-0 w-full bg-gradient-to-t from-background via-background/80 to-transparent pt-6 pb-6 mt-auto">
        <div className="max-w-4xl mx-auto w-full px-4 pl-20 md:pl-4">
          <PromptInputBox 
            value={message}
            onChange={setMessage}
            isLoading={isLoading}
            onSend={sendMessage}
            placeholder="Message AI Companion..."
          />
          <p className="text-center text-xs text-muted-foreground mt-3 font-medium">
            AI Companion can make mistakes. Check important info.
          </p>
        </div>
      </div>
    </div>
  );
}
