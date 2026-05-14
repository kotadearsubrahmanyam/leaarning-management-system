"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { User, Mail, Save, ShieldCheck } from "lucide-react";
import { AnimatedInput } from "@/components/ui/animated-input";
import { AnimatedButton } from "@/components/ui/animated-button";

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data: authData, isLoading } = useQuery({
    queryKey: ["authMe"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) throw new Error("Unauthorized");
      return res.json();
    },
  });

  useEffect(() => {
    if (authData?.data?.user) {
      setName(authData.data.user.name);
      setEmail(authData.data.user.email);
    }
  }, [authData]);

  const updateMutation = useMutation({
    mutationFn: async (payload: { name: string; email: string }) => {
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update profile");
      return data;
    },
    onSuccess: () => {
      setSuccess("Profile updated successfully!");
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["authMe"] });
      
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (err: Error) => {
      setError(err.message);
      setSuccess(null);
    },
  });

  const { data: paymentsData } = useQuery({
    queryKey: ["payments", "STUDENT"],
    queryFn: async () => {
      const res = await fetch("/api/student/payments");
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!authData?.data?.user && authData.data.user.role === "STUDENT",
  });

  const { data: coursesData } = useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const res = await fetch("/api/courses");
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!authData?.data?.user && authData.data.user.role === "STUDENT",
  });

  const { data: resultsData } = useQuery({
    queryKey: ["results"],
    queryFn: async () => {
      const res = await fetch("/api/student/results");
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!authData?.data?.user && authData.data.user.role === "STUDENT",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({ name, email });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const role = authData?.data?.user?.role || "USER";

  return (
    <div className="max-w-4xl mx-auto pb-12 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-primary mb-2">My Profile</h1>
        <p className="text-foreground/70">Manage your account details and personal information.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-1"
        >
          <div className="glass p-8 rounded-3xl border border-white/10 flex flex-col items-center text-center">
            <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-primary to-orange-500 p-1 mb-4 shadow-[0_0_30px_rgba(153,27,27,0.3)]">
              <div className="w-full h-full bg-background rounded-full flex items-center justify-center overflow-hidden">
                <User size={48} className="text-primary/50" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-foreground">{authData?.data?.user?.name}</h2>
            <p className="text-foreground/60 mb-4">{authData?.data?.user?.email}</p>
            
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm font-semibold">
              <ShieldCheck size={16} />
              {role}
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-2"
        >
          <div className="glass p-8 rounded-3xl border border-white/10">
            <h3 className="text-xl font-bold text-foreground mb-6">Edit Details</h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <AnimatedInput
                  id="name"
                  type="text"
                  label="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  icon={<User size={18} />}
                  required
                />
                
                <AnimatedInput
                  id="email"
                  type="email"
                  label="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={<Mail size={18} />}
                  required
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 text-sm">
                  {success}
                </div>
              )}

              <div className="flex justify-end pt-4">
                <AnimatedButton 
                  type="submit" 
                  className="flex items-center gap-2"
                  isLoading={updateMutation.isPending}
                >
                  <Save size={18} />
                  Save Changes
                </AnimatedButton>
              </div>
            </form>
          </div>
        </motion.div>
      </div>

      {role === "STUDENT" && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 space-y-8"
        >
          <div className="glass p-8 rounded-3xl border border-white/10">
            <h3 className="text-2xl font-bold text-foreground mb-6">Academic Record</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <p className="text-sm text-foreground/50 mb-1">Roll Number</p>
                <p className="text-xl font-bold text-primary">{authData?.data?.user?.rollNumber || "N/A"}</p>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <p className="text-sm text-foreground/50 mb-1">Semester</p>
                <p className="text-xl font-bold text-primary">{authData?.data?.user?.semester || "N/A"}</p>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <p className="text-sm text-foreground/50 mb-1">Resident Status</p>
                <p className="text-xl font-bold text-primary">{authData?.data?.user?.residentStatus?.replace("_", " ") || "N/A"}</p>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <p className="text-sm text-foreground/50 mb-1">Enrolled Courses</p>
                <p className="text-xl font-bold text-primary">{coursesData?.data?.courses?.length || 0}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-lg font-bold mb-4">Fee Breakdown</h4>
                {paymentsData?.data?.payments ? (
                  <div className="space-y-3">
                    {paymentsData.data.payments.map((p: any) => (
                      <div key={p.id} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                        <div>
                          <p className="font-bold">{p.feeType}</p>
                          <p className="text-xs text-foreground/50">{p.status}</p>
                        </div>
                        <p className="font-bold">${p.amount}</p>
                      </div>
                    ))}
                    <div className="flex justify-between items-center p-3 bg-primary/10 rounded-xl border border-primary/20 mt-4">
                      <p className="font-bold text-primary">Total Paid</p>
                      <p className="font-bold text-primary">
                        ${paymentsData.data.payments.filter((p: any) => p.status === "PAID" || p.status === "VERIFIED" || p.status === "COMPLETED").reduce((acc: number, p: any) => acc + p.amount, 0)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-foreground/50">Loading fees...</p>
                )}
              </div>

              <div>
                <h4 className="text-lg font-bold mb-4">Latest Results</h4>
                {resultsData?.data?.results ? (
                  <div className="space-y-3">
                    {resultsData.data.results.slice(0, 5).map((r: any) => (
                      <div key={r.id} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                        <div>
                          <p className="font-bold truncate max-w-[200px]">{r.courseName}</p>
                          <p className="text-xs text-foreground/50">Marks: {r.marks}/100</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center shrink-0">
                          {r.grade}
                        </div>
                      </div>
                    ))}
                    {resultsData.data.results.length === 0 && (
                      <p className="text-sm text-foreground/50">No results published yet.</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-foreground/50">Loading results...</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
