"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { DownloadCloud, CheckCircle, Clock, FileText } from "lucide-react";

interface DownloadItem {
  id: string;
  title: string;
  courseName: string;
  size: string;
  status: "downloaded" | "downloading";
  progress?: number;
  downloadedAt: string | null;
  fileUrl?: string;
}

export default function DownloadsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["downloads"],
    queryFn: async () => {
      const res = await fetch("/api/downloads");
      if (!res.ok) throw new Error("Failed to fetch downloads");
      return res.json();
    },
  });

  const downloads: DownloadItem[] = data?.data?.downloads || [];

  return (
    <div className="max-w-5xl mx-auto pb-12 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-3">
          <DownloadCloud size={32} />
          Offline Content
        </h1>
        <p className="text-foreground/70">Manage your saved lessons for offline viewing.</p>
      </motion.div>

      {isLoading ? (
        <div className="flex flex-col space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass w-full h-24 rounded-2xl animate-pulse bg-white/20" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {downloads.length === 0 ? (
            <div className="glass p-12 rounded-3xl border border-white/10 flex flex-col items-center justify-center text-center">
              <DownloadCloud size={48} className="text-foreground/20 mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">No Offline Content</h3>
              <p className="text-foreground/60 max-w-sm">
                You haven't downloaded any lessons yet. View a course to save materials for offline access.
              </p>
            </div>
          ) : (
            downloads.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="glass p-5 rounded-2xl border border-white/10 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 border border-primary/20">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-lg leading-tight">{item.title}</h3>
                    <p className="text-sm text-foreground/60 mt-1">{item.courseName} • {item.size}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {item.status === "downloading" ? (
                    <div className="flex items-center gap-3 w-32">
                      <div className="flex-1 bg-white/10 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-orange-500 h-full rounded-full" 
                          style={{ width: `${item.progress}%` }} 
                        />
                      </div>
                      <span className="text-xs font-semibold text-orange-500">{item.progress}%</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-end gap-2 text-sm">
                      <span className="flex items-center gap-1 text-green-500 font-medium">
                        <CheckCircle size={16} />
                        Downloaded
                      </span>
                      <div className="flex items-center gap-3 mt-1">
                        {item.downloadedAt && (
                          <span className="text-xs text-foreground/40 flex items-center gap-1">
                            <Clock size={10} />
                            {new Date(item.downloadedAt).toLocaleDateString()}
                          </span>
                        )}
                        {item.fileUrl && (
                          <a
                            href={item.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold bg-primary/10 text-primary px-3 py-1 rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors"
                          >
                            View File
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
