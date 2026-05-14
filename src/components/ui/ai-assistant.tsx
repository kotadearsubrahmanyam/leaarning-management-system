"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { AnimatedButton } from "@/components/ui/animated-button";
import { AnimatedInput } from "@/components/ui/animated-input";
import ReactMarkdown from "react-markdown";

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

  const sendMessage = async () => {
    const trimmed = message.trim();
    if (!trimmed) return;

    const userMessage: ChatMessage = { sender: "user", text: trimmed };
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
    <div className="glass p-6 rounded-3xl space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary">AI Chat</h2>
          <p className="text-foreground/70 max-w-2xl">
            Ask questions about your learning path and get answers in a chat-style interface.
          </p>
        </div>
      </div>



      <div className="glass p-5 rounded-3xl h-[520px] overflow-hidden">
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Chat</h3>
              <p className="text-sm text-foreground/70">Ask anything and get a human-style reply.</p>
            </div>
            <span className="text-xs uppercase tracking-[0.2em] text-primary">AI Chat</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2" ref={scrollRef}>
            {messages.map((item, index) => (
              <div
                key={`${item.sender}-${index}`}
                className={`flex ${item.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-3xl p-4 text-sm leading-6 ${
                    item.sender === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-white/10 text-foreground"
                  }`}
                >
                  {item.sender === "user" ? (
                    item.text
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>
                        {item.text}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              rows={3}
              placeholder="Type your question here..."
              className="w-full rounded-3xl border border-input bg-white/70 px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <div className="mt-4 flex items-center justify-between gap-4">
              <p className="text-xs text-foreground/60">Tip: ask about course choices, study plans, or which topic is best next.</p>
              <AnimatedButton type="button" onClick={sendMessage} isLoading={isLoading}>
                Send Message
              </AnimatedButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
