"use client";

import React from "react";
import { motion } from "framer-motion";
import { CheckCircle, BookOpen, Clock } from "lucide-react";

export interface ActivityItem {
  id: string;
  type: "ENROLLMENT" | "LESSON_COMPLETED";
  title: string;
  subtitle: string;
  timestamp: string;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  if (!activities || activities.length === 0) {
    return (
      <div className="glass p-8 rounded-2xl flex flex-col items-center justify-center text-center h-[350px] border border-slate-200">
        <Clock size={40} className="text-foreground/30 mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-1">No Recent Activity</h3>
        <p className="text-sm text-foreground/50">Your recent courses and lessons will appear here.</p>
      </div>
    );
  }

  return (
    <div className="glass p-6 rounded-2xl border border-slate-200 h-full">
      <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
        <Clock className="text-primary" size={24} />
        Recent Activity
      </h3>
      
      <div className="relative border-l border-slate-200 ml-3 space-y-6">
        {activities.map((activity, index) => {
          const isCompletion = activity.type === "LESSON_COMPLETED";
          
          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="relative pl-6"
            >
              {/* Timeline dot/icon */}
              <div 
                className={`absolute -left-3 top-0.5 p-1 rounded-full ${
                  isCompletion 
                    ? "bg-slate-100 text-green-600 shadow-sm border border-slate-200" 
                    : "bg-slate-100 text-primary shadow-sm border border-slate-200"
                }`}
              >
                {isCompletion ? <CheckCircle size={14} /> : <BookOpen size={14} />}
              </div>
              
              <div className="bg-slate-50 hover:bg-slate-100/80 transition-colors p-3 rounded-xl border border-slate-200/60">
                <p className="text-sm font-semibold text-foreground">{activity.title}</p>
                <p className="text-xs text-foreground/70 mt-1">{activity.subtitle}</p>
                <p className="text-[10px] text-foreground/40 mt-2 uppercase tracking-wider">
                  {new Date(activity.timestamp).toLocaleDateString(undefined, { 
                    month: 'short', 
                    day: 'numeric', 
                    hour: 'numeric', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
