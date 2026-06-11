"use client";

import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trophy, Award, Code, MonitorPlay, Star, UploadCloud, X, File as FileIcon } from "lucide-react";
import { AnimatedButton } from "@/components/ui/animated-button";
import { AnimatedInput } from "@/components/ui/animated-input";
import { createClient } from "@supabase/supabase-js";

const ACTIVITY_TYPES = [
  { value: "CERTIFICATION", label: "Certification", icon: Award, color: "text-blue-500", bg: "bg-blue-500/10" },
  { value: "HACKATHON", label: "Hackathon", icon: Code, color: "text-purple-500", bg: "bg-purple-500/10" },
  { value: "CONTEST", label: "Contest", icon: Trophy, color: "text-amber-500", bg: "bg-amber-500/10" },
  { value: "WORKSHOP", label: "Workshop", icon: MonitorPlay, color: "text-green-500", bg: "bg-green-500/10" },
  { value: "OTHER", label: "Other", icon: Star, color: "text-foreground", bg: "bg-white/10" },
];

export default function ActivitiesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["studentActivities"],
    queryFn: async () => {
      const res = await fetch("/api/student/activities");
      if (!res.ok) throw new Error("Failed to fetch activities");
      return res.json();
    },
  });

  const activities = data?.data?.activities || [];

  return (
    <div className="max-w-6xl mx-auto pb-12 relative z-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-3">
            <Trophy size={32} /> Day-to-Day Activities
          </h1>
          <p className="text-foreground/70">
            Log your certifications, hackathons, and other academic achievements.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <AnimatedButton onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
            <Plus size={20} /> Log New Activity
          </AnimatedButton>
        </motion.div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-40 glass rounded-3xl animate-pulse" />)}
        </div>
      ) : activities.length === 0 ? (
        <div className="glass p-12 rounded-3xl border border-white/10 text-center">
          <Award size={48} className="mx-auto text-foreground/20 mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">No Activities Yet</h3>
          <p className="text-foreground/50">Start logging your achievements to build your portfolio!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activities.map((activity: any, i: number) => {
            const typeConfig = ACTIVITY_TYPES.find(t => t.value === activity.type) || ACTIVITY_TYPES[4];
            const Icon = typeConfig.icon;
            
            return (
              <motion.div 
                key={activity.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="glass p-6 rounded-3xl border border-white/10 relative overflow-hidden group hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full ${typeConfig.bg} blur-3xl -mr-10 -mt-10 opacity-50 group-hover:opacity-100 transition-opacity`} />
                
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-2xl ${typeConfig.bg} ${typeConfig.color}`}>
                      <Icon size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">{activity.title}</h3>
                      <p className="text-xs text-foreground/50">{new Date(activity.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold border border-current ${typeConfig.color} ${typeConfig.bg}`}>
                    {typeConfig.label}
                  </div>
                </div>

                <div className="mt-4 relative z-10">
                  <p className="text-foreground/80 text-sm line-clamp-3">{activity.description}</p>
                </div>

                {activity.proofUrl && (
                  <div className="mt-6 pt-4 border-t border-white/10 relative z-10">
                    <a 
                      href={activity.proofUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-primary hover:text-white transition-colors"
                    >
                      <FileIcon size={16} /> View Certificate / Proof
                    </a>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}

      <AddActivityModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["studentActivities"] })} 
      />
    </div>
  );
}

function AddActivityModal({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("CERTIFICATION");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!title.trim() || !description.trim() || !date.trim()) {
      alert("All fields (Title, Date, and Description) must be filled out! Please complete all fields before logging the activity.");
      setError("Please fill in all text fields.");
      return;
    }

    setIsUploading(true);
    setProgress(10);
    setError(null);

    try {
      let publicUrl = "";

      if (file) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
          throw new Error("Supabase credentials not found.");
        }

        const supabase = createClient(supabaseUrl, supabaseKey);
        const fileExt = file.name.split('.').pop();
        const fileName = `activities/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        setProgress(40);

        const { error: uploadError } = await supabase.storage
          .from('materials') // Reusing existing bucket
          .upload(fileName, file, { cacheControl: '3600', upsert: false });

        if (uploadError) throw uploadError;

        setProgress(70);

        const { data } = supabase.storage.from('materials').getPublicUrl(fileName);
        publicUrl = data.publicUrl;
      } else {
        setProgress(70); // Jump progress if no file
      }

      // Save metadata to API
      const res = await fetch(`/api/student/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          type,
          description,
          date,
          proofUrl: publicUrl || null,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to save activity");
      }

      setProgress(100);
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 500);

    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "An error occurred during upload");
      setIsUploading(false);
      setProgress(0);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setFile(null);
      setTitle("");
      setDescription("");
      setType("CERTIFICATION");
      setProgress(0);
      setError(null);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: "-50%", y: "-40%" }}
            animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
            exit={{ opacity: 0, scale: 0.9, x: "-50%", y: "-40%" }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg"
          >
            <div className="glass rounded-3xl border border-white/20 shadow-2xl relative overflow-hidden max-h-[90vh] flex flex-col">
              <button
                onClick={handleClose}
                disabled={isUploading}
                className="absolute top-4 right-4 z-10 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors disabled:opacity-50"
              >
                <X size={20} />
              </button>

              <div className="p-8 overflow-y-auto">
                <h2 className="text-2xl font-bold text-primary mb-6">Log Activity</h2>

                {error && (
                  <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <AnimatedInput label="Activity Title" placeholder="e.g. AWS Cloud Practitioner" value={title} onChange={(e) => setTitle(e.target.value)} disabled={isUploading} />
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/80 ml-1">Activity Type</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      disabled={isUploading}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    >
                      {ACTIVITY_TYPES.map(t => (
                        <option key={t.value} value={t.value} className="bg-white text-slate-900">{t.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/80 ml-1">Date</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      disabled={isUploading}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/80 ml-1">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={isUploading}
                      placeholder="Briefly describe what you learned or achieved..."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none h-24"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/80 ml-1">Proof / Certificate (Optional)</label>
                    {!file ? (
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-white/20 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group"
                      >
                        <UploadCloud size={32} className="text-foreground/40 group-hover:text-primary transition-colors mb-2" />
                        <p className="text-sm font-medium text-foreground/80">Click to upload file</p>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,application/pdf" />
                      </div>
                    ) : (
                      <div className="glass p-4 rounded-xl flex items-center space-x-4 border border-primary/20 bg-primary/5">
                        <FileIcon className="text-primary flex-shrink-0" size={24} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground truncate">{file.name}</p>
                        </div>
                        {!isUploading && (
                          <button onClick={() => setFile(null)} className="text-foreground/50 hover:text-destructive transition-colors">
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {isUploading && (
                    <div className="space-y-2 pt-2">
                      <div className="flex justify-between text-xs text-foreground/70 font-medium">
                        <span>Saving...</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-gradient-to-r from-red-600 to-orange-500" />
                      </div>
                    </div>
                  )}

                  <AnimatedButton onClick={handleUpload} className="w-full mt-4" disabled={isUploading}>
                    {isUploading ? "Saving..." : "Log Activity"}
                  </AnimatedButton>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
