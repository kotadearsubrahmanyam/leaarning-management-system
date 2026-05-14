"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Send, User as UserIcon, MessageSquare, Globe } from "lucide-react";
import { AnimatedButton } from "@/components/ui/animated-button";

export default function MessagesPage() {
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch current user (to know our own ID)
  const { data: authData } = useQuery({
    queryKey: ["authMe"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) throw new Error("Failed to fetch auth");
      return res.json();
    },
  });
  const currentUserId = authData?.data?.user?.id;

  // Fetch global messages
  const { data: conversationData, isLoading: isLoadingChat } = useQuery({
    queryKey: ["globalMessages"],
    queryFn: async () => {
      const res = await fetch(`/api/messages`);
      if (!res.ok) throw new Error("Failed to fetch global messages");
      return res.json();
    },
    refetchInterval: 3000, // Poll every 3s
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Failed to send message");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["globalMessages"] });
      setContent("");
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    sendMutation.mutate();
  };

  const messages = conversationData?.data?.messages || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Function to render text with @mentions highlighted
  const renderContentWithMentions = (text: string) => {
    const mentionRegex = /(@\w+)/g;
    const parts = text.split(mentionRegex);
    return parts.map((part, index) => {
      if (part.match(mentionRegex)) {
        return <span key={index} className="text-blue-400 font-bold hover:underline cursor-pointer">{part}</span>;
      }
      return part;
    });
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-120px)] flex flex-col relative z-10 pb-4">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
        <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
          <Globe size={32} /> Global Campus Hub
        </h1>
        <p className="text-foreground/70">A community timeline for everyone (Students, Faculty, and Admins). Tag anyone using @username.</p>
      </motion.div>

      <div className="flex-1 glass rounded-3xl border border-white/10 overflow-hidden flex flex-col shadow-2xl">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoadingChat ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-full text-foreground/50 text-sm">
              <MessageSquare size={48} className="mb-4 opacity-50" />
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg: any) => {
              const isMe = msg.senderId === currentUserId;
              return (
                <div key={msg.id} className={`flex gap-4 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <UserIcon size={20} className={isMe ? "text-primary" : "text-foreground/50"} />
                  </div>
                  <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[75%]`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm">{isMe ? "You" : msg.senderName}</span>
                      {!isMe && msg.senderRole && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          msg.senderRole === "ADMIN" ? "bg-red-500/20 text-red-500" :
                          msg.senderRole === "TEACHER" ? "bg-blue-500/20 text-blue-500" :
                          "bg-green-500/20 text-green-500"
                        }`}>
                          {msg.senderRole}
                        </span>
                      )}
                    </div>
                    <div 
                      className={`px-5 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        isMe 
                          ? "bg-primary text-primary-foreground rounded-tr-none" 
                          : "bg-white/10 text-foreground rounded-tl-none border border-white/5"
                      }`}
                    >
                      {renderContentWithMentions(msg.content)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t border-white/10 bg-black/20">
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's happening? (Use @username to tag someone)"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors placeholder:text-foreground/30"
              maxLength={500}
            />
            <AnimatedButton type="submit" isLoading={sendMutation.isPending} className="px-6">
              <Send size={18} className="mr-2" /> Post
            </AnimatedButton>
          </form>
        </div>
      </div>
    </div>
  );
}
