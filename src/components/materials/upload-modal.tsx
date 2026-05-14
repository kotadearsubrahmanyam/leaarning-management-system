"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UploadCloud, File, CheckCircle2 } from "lucide-react";
import { AnimatedButton } from "@/components/ui/animated-button";
import { AnimatedInput } from "@/components/ui/animated-input";
import { createClient } from "@supabase/supabase-js";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  onSuccess: () => void;
}

export function UploadModal({ isOpen, onClose, courseId, onSuccess }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      if (!title) {
        // Auto-fill title from filename without extension
        setTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ""));
      }
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file first");
      return;
    }
    if (!title) {
      setError("Please provide a title");
      return;
    }

    setIsUploading(true);
    setProgress(10);
    setError(null);

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error("Supabase credentials not found in environment variables.");
      }

      const supabase = createClient(supabaseUrl, supabaseKey);

      // 1. Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${courseId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      setProgress(40);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('materials')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      setProgress(70);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('materials')
        .getPublicUrl(fileName);

      // Format file size
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
      const sizeStr = `${sizeInMB} MB`;

      // 2. Save metadata to API
      const metadataRes = await fetch(`/api/courses/${courseId}/materials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          fileUrl: publicUrl,
          fileType: file.type || "unknown",
          size: sizeStr,
        }),
      });

      if (!metadataRes.ok) {
        const errorData = await metadataRes.json();
        throw new Error(errorData.message || "Failed to save metadata");
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: "-50%", y: "-40%" }}
            animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
            exit={{ opacity: 0, scale: 0.9, x: "-50%", y: "-40%" }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md"
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
                <h2 className="text-2xl font-bold text-primary mb-6">Upload Material</h2>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
                  {error}
                </div>
              )}

              <div className="space-y-6">
                {!file ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-white/20 rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group"
                  >
                    <UploadCloud size={48} className="text-foreground/40 group-hover:text-primary transition-colors mb-4" />
                    <p className="text-sm font-medium text-foreground/80 mb-1">Click to browse files</p>
                    <p className="text-xs text-foreground/50 text-center">Supports PDF, MP4, WebM (Max 50MB recommended for demo)</p>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      className="hidden" 
                      accept="video/*,application/pdf"
                    />
                  </div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="glass p-4 rounded-xl flex items-center space-x-4 border border-primary/20 bg-primary/5 relative"
                  >
                    <File className="text-primary flex-shrink-0" size={32} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{file.name}</p>
                      <p className="text-xs text-foreground/50">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                    {!isUploading && (
                      <button onClick={() => setFile(null)} className="text-foreground/50 hover:text-destructive transition-colors">
                        <X size={16} />
                      </button>
                    )}
                  </motion.div>
                )}

                <AnimatedInput
                  label="Material Title"
                  placeholder="e.g. Chapter 1 Introduction"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isUploading}
                />

                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-foreground/70 font-medium">
                      <span>Uploading...</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-gradient-to-r from-red-600 to-orange-500"
                      />
                    </div>
                  </div>
                )}

                <AnimatedButton 
                  onClick={handleUpload} 
                  className="w-full" 
                  disabled={!file || !title || isUploading}
                >
                  {isUploading ? "Uploading..." : "Upload File"}
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
