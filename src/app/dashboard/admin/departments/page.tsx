"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Layers, Plus } from "lucide-react";
import { AnimatedButton } from "@/components/ui/animated-button";
import { AnimatedInput } from "@/components/ui/animated-input";

export default function AdminDepartmentsPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await fetch("/api/admin/departments");
      if (!res.ok) throw new Error("Failed to fetch departments");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      if (!res.ok) throw new Error("Failed to create department");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      setName("");
      setDescription("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    createMutation.mutate();
  };

  const departments = data?.data?.departments || [];

  return (
    <div className="max-w-6xl mx-auto pb-12 relative z-10">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-3">
          <Layers size={32} /> Manage Departments
        </h1>
        <p className="text-foreground/70">Create and organize institutional departments.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 glass p-6 rounded-3xl border border-white/10 h-fit">
          <h3 className="text-xl font-bold mb-4">New Department</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatedInput
              label="Department Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Computer Science"
              required
            />
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-1 ml-1">Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors resize-none"
                rows={3}
              />
            </div>
            <AnimatedButton type="submit" isLoading={createMutation.isPending} className="w-full">
              <Plus size={18} className="mr-2 inline" /> Create Department
            </AnimatedButton>
          </form>
        </div>

        <div className="md:col-span-2 glass p-6 rounded-3xl border border-white/10">
          <h3 className="text-xl font-bold mb-4">Department List</h3>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white/5 animate-pulse rounded-xl" />)}
            </div>
          ) : departments.length === 0 ? (
            <p className="text-foreground/50 text-center py-8">No departments found.</p>
          ) : (
            <div className="space-y-3">
              {departments.map((dept: any, i: number) => (
                <motion.div
                  key={dept.id}
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                  className="p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors"
                >
                  <h4 className="font-bold text-lg text-primary">{dept.name}</h4>
                  {dept.description && <p className="text-sm text-foreground/70 mt-1">{dept.description}</p>}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
