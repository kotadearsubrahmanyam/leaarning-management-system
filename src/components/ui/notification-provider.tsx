"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Info, XCircle, X } from "lucide-react";

type NotificationType = "success" | "info" | "error";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
}

interface NotificationContextType {
  showNotification: (title: string, message: string, type?: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback((title: string, message: string, type: NotificationType = "info") => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications((prev) => [...prev, { id, title, message, type }]);

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  }, []);

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col space-y-3 pointer-events-none w-full max-w-sm">
        <AnimatePresence>
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={`pointer-events-auto flex items-start p-4 rounded-2xl shadow-2xl border backdrop-blur-md ${
                notification.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : notification.type === "error"
                  ? "bg-rose-50 border-rose-200 text-rose-800"
                  : "glass text-slate-800 border-slate-200"
              }`}
            >
              <div className="flex-shrink-0 mr-3 mt-0.5">
                {notification.type === "success" && <CheckCircle2 className="w-5 h-5 text-green-400" />}
                {notification.type === "error" && <XCircle className="w-5 h-5 text-red-400" />}
                {notification.type === "info" && <Info className="w-5 h-5 text-primary" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{notification.title}</p>
                <p className="text-sm opacity-80 mt-0.5 line-clamp-2">{notification.message}</p>
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="flex-shrink-0 ml-3 opacity-50 hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
}
