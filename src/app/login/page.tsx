"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { AuthCard } from "@/components/ui/auth-card";
import { AnimatedInput } from "@/components/ui/animated-input";
import { AnimatedButton } from "@/components/ui/animated-button";
import { AnimatedBackground } from "@/components/ui/animated-background";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<"STUDENT" | "TEACHER" | "ADMIN">("STUDENT");

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormValues) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, expectedRole: selectedRole }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "An error occurred");
      }
      return result;
    },
    onSuccess: (data) => {
      const userRole = data.data?.user?.role || selectedRole;
      if (userRole === "ADMIN") {
        router.push("/dashboard/admin");
      } else {
        router.push("/dashboard");
      }
    },
    onError: (error: any) => {
      setError("root", { message: error.message });
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <AnimatedBackground isDark={true} />

      <div className="w-full max-w-md z-10 mt-16">
        <AuthCard>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">Welcome Back</h1>
            <p className="text-foreground/70">Sign in to access your courses</p>
          </div>

          {errors.root && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
              {errors.root.message}
            </div>
          )}

          <div className="flex bg-primary/10 p-1 rounded-xl mb-6 relative border border-primary/20">
            {["STUDENT", "TEACHER", "ADMIN"].map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setSelectedRole(role as any)}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg z-10 transition-colors ${
                  selectedRole === role ? "text-white" : "text-primary/70 hover:text-primary"
                }`}
              >
                {role.charAt(0) + role.slice(1).toLowerCase()}
              </button>
            ))}
            <motion.div
              className="absolute top-1 bottom-1 bg-primary rounded-lg z-0"
              initial={false}
              animate={{
                width: "calc(33.333% - 4px)",
                x: selectedRole === "STUDENT" ? "4px" : selectedRole === "TEACHER" ? "calc(100% + 4px)" : "calc(200% + 4px)"
              }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <AnimatedInput
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register("email")}
            />

            <div className="space-y-2">
              <AnimatedInput
                label="Password"
                type="password"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register("password")}
              />
              <div className="text-right">
                <Link href="#" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
            </div>

            <AnimatedButton type="submit" isLoading={loginMutation.isPending}>
              Sign In
            </AnimatedButton>
          </form>

          <div className="mt-6 text-center text-sm text-foreground/70">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-primary font-semibold hover:underline">
              Sign up
            </Link>
          </div>
        </AuthCard>
      </div>
    </div>
  );
}
