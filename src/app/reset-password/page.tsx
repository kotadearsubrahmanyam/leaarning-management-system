"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, BookOpen, KeyRound } from "lucide-react";
import { AnimatedBackgroundPattern } from "@/components/ui/animated-background-pattern";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Reset token is missing from the URL.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to reset password.");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass w-full max-w-[480px] p-6 lg:p-8 rounded-[24px] border border-border shadow-xl bg-white/95 relative z-20 transition-all duration-300">
      <div className="text-center mb-6">
        <div className="mx-auto size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
          <KeyRound className="size-6" />
        </div>
        <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-800 mb-1 lg:mb-2">
          Reset Password
        </h1>
        <p className="text-slate-500 text-xs lg:text-sm">
          Please enter your new password below.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs text-center font-medium">
          {error}
        </div>
      )}

      {success ? (
        <div className="space-y-4 text-center">
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium">
            Password reset successfully! Redirecting you to the login page...
          </div>
          <Button
            type="button"
            onClick={() => router.push("/login")}
            className="w-full h-10 lg:h-11 font-semibold"
          >
            Go to Login
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs lg:text-sm font-semibold text-slate-700">
              New Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 lg:h-11 pr-10 bg-background border-slate-200 text-slate-800 focus:border-primary text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="size-4 lg:size-5" /> : <Eye className="size-4 lg:size-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-xs lg:text-sm font-semibold text-slate-700">
              Confirm New Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-10 lg:h-11 bg-background border-slate-200 text-slate-800 focus:border-primary text-sm"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-10 lg:h-11 text-sm lg:text-base font-semibold shadow-lg shadow-primary/20 mt-2"
            size="lg"
            disabled={loading}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </Button>
        </form>
      )}

      <div className="text-center text-xs lg:text-sm text-slate-500 mt-6">
        Remembered your password?{" "}
        <a href="/login" className="text-primary font-bold hover:underline ml-1">
          Log In
        </a>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col lg:grid lg:grid-cols-2 bg-background relative">
      {/* Left Content Section */}
      <div className="relative flex flex-col justify-between bg-primary/[0.03] border-b lg:border-b-0 lg:border-r border-slate-200/50 overflow-hidden p-6 lg:p-12 h-[35vh] lg:h-full w-full">
        <div className="relative z-20 shrink-0">
          <div className="flex items-center gap-2 text-lg lg:text-xl font-bold text-primary justify-center lg:justify-start">
            <BookOpen className="size-5 lg:size-6" />
            <span>LMS Portal</span>
          </div>
        </div>

        <div className="relative z-20 flex-1 flex flex-col items-center justify-center">
          <div className="text-center max-w-md hidden md:block">
            <h2 className="text-xl lg:text-2xl font-black tracking-tight text-slate-800">
              Recover your Account
            </h2>
            <p className="text-slate-500 mt-2 text-xs lg:text-sm leading-relaxed hidden lg:block">
              Choose a strong, secure password that you don't use elsewhere.
            </p>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute inset-0 bg-grid-primary/[0.03] bg-[size:20px_20px]" />
        <div className="absolute top-1/4 right-1/4 size-64 bg-primary/20 rounded-full blur-3xl opacity-50 animate-pulse" />
      </div>

      {/* Right Reset Section */}
      <div className="flex-1 lg:h-full flex items-center justify-center p-4 sm:p-8 bg-background relative z-10 shadow-[-20px_0_40px_-10px_rgba(0,0,0,0.05)] overflow-hidden">
        <AnimatedBackgroundPattern />
        <Suspense fallback={<div className="text-slate-500">Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
