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
  const [typeOfEducation, setTypeOfEducation] = useState("B.Tech");
  const [totalSemesters, setTotalSemesters] = useState(8);

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
        body: JSON.stringify({ name, description, typeOfEducation, totalSemesters }),
      });
      if (!res.ok) throw new Error("Failed to create department");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      setName("");
      setDescription("");
      setTypeOfEducation("B.Tech");
      setTotalSemesters(8);
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
              <label className="block text-sm font-medium text-foreground/70 mb-1 ml-1">Type of Education / Degree</label>
              <select
                value={typeOfEducation}
                onChange={(e) => setTypeOfEducation(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors appearance-none"
              >
                <option value="B.Tech" className="bg-white text-slate-900">B.Tech (Bachelor of Technology)</option>
                <option value="B.Pharmacy" className="bg-white text-slate-900">B.Pharmacy (Bachelor of Pharmacy)</option>
                <option value="Agriculture" className="bg-white text-slate-900">Agriculture</option>
                <option value="BBA" className="bg-white text-slate-900">BBA (Bachelor of Business Administration)</option>
                <option value="MBA" className="bg-white text-slate-900">MBA (Master of Business Administration)</option>
                <option value="B.Sc" className="bg-white text-slate-900">B.Sc (Bachelor of Science)</option>
              </select>
            </div>
            <AnimatedInput
              label="Total Semesters"
              type="number"
              min={1}
              max={12}
              value={totalSemesters}
              onChange={(e) => setTotalSemesters(parseInt(e.target.value) || 8)}
              placeholder="e.g. 8"
              required
            />
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
                  className="p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors flex justify-between items-start"
                >
                  <div>
                    <h4 className="font-bold text-lg text-primary">{dept.name}</h4>
                    {dept.description && <p className="text-sm text-foreground/70 mt-1">{dept.description}</p>}
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary/15 text-primary border border-primary/20">
                      {dept.typeOfEducation || "B.Tech"}
                    </span>
                    <span className="text-xs text-foreground/50 font-bold">
                      {dept.totalSemesters || 8} Semesters
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
