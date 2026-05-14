"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, ChevronLeft, Video, FileText } from "lucide-react";
import { AnimatedButton } from "@/components/ui/animated-button";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { MaterialCard, Material } from "@/components/materials/material-card";
import { UploadModal } from "@/components/materials/upload-modal";

export default function CourseDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const courseId = params.id;
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Fetch current user role
  const { data: authData } = useQuery({
    queryKey: ["authMe"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) throw new Error("Unauthorized");
      return res.json();
    },
  });

  const role = authData?.data?.user?.role;

  // Fetch materials
  const { data: materialsData, isLoading } = useQuery({
    queryKey: ["materials", courseId],
    queryFn: async () => {
      const res = await fetch(`/api/courses/${courseId}/materials`);
      if (!res.ok) {
        if (res.status === 403) {
          router.push("/dashboard/courses");
          throw new Error("Forbidden");
        }
        throw new Error("Failed to fetch materials");
      }
      return res.json();
    },
    enabled: !!role,
  });

  const materials: Material[] = materialsData?.data?.materials || [];

  const completeMutation = useMutation({
    mutationFn: async (materialId: string) => {
      const res = await fetch(`/api/materials/${materialId}/complete`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to toggle complete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials", courseId] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      queryClient.invalidateQueries({ queryKey: ["enrolledCourses"] });
    }
  });

  if (isLoading || !role) {
    return (
      <div className="flex flex-col space-y-4">
        <div className="glass w-48 h-10 rounded-xl animate-pulse bg-white/20 mb-8" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass w-full h-24 rounded-2xl animate-pulse bg-white/20" />
        ))}
      </div>
    );
  }

  const videos = materials.filter(m => m.fileType.includes("video"));
  const pdfs = materials.filter(m => m.fileType.includes("pdf"));

  const completedCount = materials.filter(m => m.isCompleted).length;
  const progressPercentage = materials.length > 0 ? Math.round((completedCount / materials.length) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <button 
        onClick={() => router.push("/dashboard/courses")}
        className="flex items-center text-sm font-medium text-foreground/70 hover:text-primary mb-6 transition-colors"
      >
        <ChevronLeft size={16} className="mr-1" />
        Back to Courses
      </button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-primary mb-2">Course Materials</h1>
          <p className="text-foreground/70">
            Access all videos and documents for this course.
          </p>
        </motion.div>

        {(role === "TEACHER" || role === "ADMIN") && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <AnimatedButton onClick={() => setIsUploadOpen(true)} className="flex items-center gap-2">
              <Upload size={18} />
              Upload Material
            </AnimatedButton>
          </motion.div>
        )}
      </div>

      {materials.length === 0 ? (
        <div className="w-full py-20 text-center text-foreground/60 glass rounded-2xl border border-white/10">
          <p className="text-lg mb-2">No materials available yet.</p>
          <p className="text-sm">Check back later for updates from the instructor.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Progress Bar for Students */}
          {role === "STUDENT" && materials.length > 0 && (
            <div className="glass p-6 rounded-2xl border border-white/10">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-foreground">Course Progress</h3>
                <span className="text-sm text-primary font-bold">{completedCount} of {materials.length} completed ({progressPercentage}%)</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="bg-primary h-full rounded-full relative"
                >
                  <div className="absolute inset-0 bg-white/20 w-full h-full animate-pulse" />
                </motion.div>
              </div>
            </div>
          )}

          {videos.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-xl font-bold text-foreground/80 mb-4">
                <Video className="text-orange-500" />
                <h2>Video Lectures</h2>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {videos.map((mat, i) => (
                  <MaterialCard 
                    key={mat.id} 
                    material={mat} 
                    index={i} 
                    onToggleComplete={role === "STUDENT" ? (id) => completeMutation.mutate(id) : undefined}
                  />
                ))}
              </div>
            </div>
          )}

          {pdfs.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-xl font-bold text-foreground/80 mb-4">
                <FileText className="text-red-500" />
                <h2>Documents & PDFs</h2>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {pdfs.map((mat, i) => (
                  <MaterialCard 
                    key={mat.id} 
                    material={mat} 
                    index={i} 
                    onToggleComplete={role === "STUDENT" ? (id) => completeMutation.mutate(id) : undefined}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        courseId={courseId}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["materials", courseId] });
        }}
      />
    </div>
  );
}
