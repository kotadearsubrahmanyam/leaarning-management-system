"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AnimatedInput } from "@/components/ui/animated-input";
import { AnimatedButton } from "@/components/ui/animated-button";

const createCourseSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().optional(),
  level: z.enum(["Beginner", "Intermediate", "Advanced"]).default("Beginner"),
  imageUrl: z.string().url({ message: "Must be a valid URL" }).optional().or(z.literal("")),
});

type CreateCourseFormValues = z.infer<typeof createCourseSchema>;

interface CreateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: CreateCourseFormValues) => void;
  isCreating: boolean;
  error?: string | null;
}

export function CreateCourseModal({
  isOpen,
  onClose,
  onCreate,
  isCreating,
  error
}: CreateCourseModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCourseFormValues>({
    resolver: zodResolver(createCourseSchema),
    defaultValues: {
      level: "Beginner",
    }
  });

  const onSubmit = (data: CreateCourseFormValues) => {
    onCreate(data);
  };

  // Reset form when modal closes
  React.useEffect(() => {
    if (!isOpen) reset();
  }, [isOpen, reset]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: "-50%", y: "-40%" }}
            animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
            exit={{ opacity: 0, scale: 0.9, x: "-50%", y: "-40%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md"
          >
            <div className="glass rounded-3xl border border-white/20 shadow-2xl relative overflow-hidden max-h-[90vh] flex flex-col">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={20} />
              </button>

              <div className="p-8 overflow-y-auto">
                <h2 className="text-2xl font-bold text-primary mb-6">Create Course</h2>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <AnimatedInput
                  label="Course Title"
                  placeholder="e.g. Advanced TypeScript"
                  error={errors.title?.message}
                  {...register("title")}
                />
                
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-foreground/80 ml-1">
                    Description
                  </label>
                  <textarea
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground placeholder-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all min-h-[100px] resize-none"
                    placeholder="What will students learn?"
                    {...register("description")}
                  />
                  {errors.description && (
                    <span className="text-destructive text-xs ml-1 mt-1 block">
                      {errors.description.message}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-foreground/80 ml-1">
                    Difficulty Level
                  </label>
                  <select
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all"
                    {...register("level")}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>

                <AnimatedInput
                  label="Image URL (Optional)"
                  placeholder="https://example.com/image.jpg"
                  error={errors.imageUrl?.message}
                  {...register("imageUrl")}
                />

                <AnimatedButton type="submit" className="w-full mt-4" isLoading={isCreating}>
                  Publish Course
                </AnimatedButton>
              </form>
            </div>
          </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
