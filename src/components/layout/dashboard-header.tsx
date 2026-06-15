"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, Clock } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface DashboardHeaderProps {
  isSidebarCollapsed?: boolean;
}

export function DashboardHeader({ isSidebarCollapsed }: DashboardHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications");
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json();
    },
    // Polling every 30s to simulate realtime before adding Supabase sockets
    refetchInterval: 30000, 
  });

  const notifications: Notification[] = data?.data?.notifications || [];
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsReadMutation = useMutation({
    mutationFn: async (id?: string) => {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      });
      if (!res.ok) throw new Error("Failed to update notification");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={cn(
      "absolute top-0 right-0 left-0 h-16 z-40 flex justify-end items-center px-8 bg-transparent pointer-events-none transition-all duration-300",
      isSidebarCollapsed ? "md:left-[80px]" : "md:left-[256px]"
    )}>
      <div ref={dropdownRef} className="relative pointer-events-auto">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-3 rounded-full glass hover:bg-slate-50 transition-colors"
        >
          <Bell size={24} className="text-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.8)] border-2 border-background animate-pulse" />
          )}
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute top-16 right-0 w-80 sm:w-96 glass rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[500px]"
            >
              <div className="p-4 border-b border-slate-200/60 flex justify-between items-center bg-white/95 backdrop-blur-md">
                <h3 className="font-bold text-foreground">Notifications</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={() => markAsReadMutation.mutate(undefined)}
                    className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                  >
                    <Check size={14} /> Mark all read
                  </button>
                )}
              </div>

              <div className="overflow-y-auto flex-1 p-2 space-y-1 bg-slate-50/50">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-foreground/50 flex flex-col items-center justify-center">
                    <Bell size={32} className="mb-2 opacity-20" />
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n.id}
                      onClick={() => !n.isRead && markAsReadMutation.mutate(n.id)}
                      className={`p-4 rounded-xl cursor-pointer transition-all ${
                        n.isRead 
                          ? "opacity-60 hover:bg-slate-100/40" 
                          : "bg-white hover:bg-slate-50 border border-slate-200/50 border-l-2 border-l-primary shadow-sm"
                      }`}
                    >
                      <h4 className={`text-sm ${!n.isRead ? "font-bold text-primary" : "font-medium text-foreground"}`}>
                        {n.title}
                      </h4>
                      <p className="text-xs text-foreground/70 mt-1">{n.message}</p>
                      <p className="text-[10px] text-foreground/40 mt-2 flex items-center gap-1">
                        <Clock size={10} />
                        {new Date(n.createdAt).toLocaleDateString(undefined, { 
                          month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
