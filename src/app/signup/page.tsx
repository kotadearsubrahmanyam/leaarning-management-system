"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { AuthCard } from "@/components/ui/auth-card";
import { AnimatedInput } from "@/components/ui/animated-input";
import { AnimatedButton } from "@/components/ui/animated-button";
import { AnimatedBackground } from "@/components/ui/animated-background";

const signupSchema = z.object({
  name: z.string().min(2, { message: "Name is required" }),
  email: z.string().trim().toLowerCase().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  role: z.enum(["ADMIN", "TEACHER", "STUDENT"]).default("STUDENT"),
  departmentId: z.string().optional(),
  semester: z.string().optional(), // Using string for easy select input, will parse to int
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
}).refine((data) => {
  if (data.role === "STUDENT") {
    return !!data.departmentId && !!data.semester;
  }
  return true;
}, {
  message: "Branch and Semester are required for students",
  path: ["departmentId"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { role: "STUDENT" }
  });

  const selectedRole = watch("role");

  const { data: departmentsData } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await fetch("/api/departments");
      if (!res.ok) throw new Error("Failed to fetch departments");
      return res.json();
    },
  });

  const departments = departmentsData?.data?.departments || [];

  const signupMutation = useMutation({
    mutationFn: async (data: SignupFormValues) => {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "An error occurred");
      }
      return result;
    },
    onSuccess: () => {
      router.push("/dashboard");
    },
    onError: (error: any) => {
      setError("root", { message: error.message });
    },
  });

  const onSubmit = (data: SignupFormValues) => {
    const payload = {
      ...data,
      semester: data.semester ? parseInt(data.semester, 10) : undefined
    };
    signupMutation.mutate(payload as any);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <AnimatedBackground />
      
      <div className="w-full max-w-md z-10 mt-16">
        <AuthCard>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">Create Account</h1>
            <p className="text-foreground/70">Join our learning platform today</p>
          </div>

          {errors.root && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
              {errors.root.message}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <AnimatedInput
              label="Full Name"
              type="text"
              placeholder="John Doe"
              error={errors.name?.message}
              {...register("name")}
            />

            <AnimatedInput
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register("email")}
            />
            
            <AnimatedInput
              label="Password"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register("password")}
            />

            <AnimatedInput
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />

            <div className="space-y-2 pb-2">
              <label className="block text-sm font-medium text-foreground/80 ml-1">I am a...</label>
              <div className="flex gap-4 ml-1">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="radio" value="STUDENT" {...register("role")} className="accent-primary" />
                  <span className="text-sm text-foreground/80">Student</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="radio" value="TEACHER" {...register("role")} className="accent-primary" />
                  <span className="text-sm text-foreground/80">Teacher</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="radio" value="ADMIN" {...register("role")} className="accent-primary" />
                  <span className="text-sm text-foreground/80">Admin</span>
                </label>
              </div>
            </div>

            {selectedRole === "STUDENT" && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-4 pt-2">
                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-1 ml-1">Branch (Department) *</label>
                  <select 
                    {...register("departmentId")}
                    className={`w-full bg-white border ${errors.departmentId ? 'border-destructive' : 'border-slate-200'} rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:border-primary transition-colors appearance-none shadow-sm`}
                  >
                    <option value="">Select Branch</option>
                    {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  {errors.departmentId && <p className="text-destructive text-xs mt-1 ml-1">{errors.departmentId.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-1 ml-1">Semester *</label>
                  <select 
                    {...register("semester")}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:border-primary transition-colors appearance-none shadow-sm"
                  >
                    <option value="">Select Semester</option>
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s.toString()}>Semester {s}</option>)}
                  </select>
                </div>
              </motion.div>
            )}

            <AnimatedButton type="submit" className="mt-2" isLoading={signupMutation.isPending}>
              Sign Up
            </AnimatedButton>
          </form>

          <div className="mt-6 text-center text-sm text-foreground/70">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Sign in
            </Link>
          </div>
        </AuthCard>
      </div>
    </div>
  );
}
