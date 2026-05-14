"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, X, Trash2, ArrowUpCircle } from "lucide-react";
import { AnimatedButton } from "@/components/ui/animated-button";
import { AnimatedInput } from "@/components/ui/animated-input";

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "STUDENT",
  });
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  const { data: usersData, isLoading } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to create user");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      setIsModalOpen(false);
      setFormData({ name: "", email: "", password: "", role: "STUDENT" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/users?id=${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete user");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    },
  });

  const promoteMutation = useMutation({
    mutationFn: async (studentIds: string[]) => {
      const res = await fetch("/api/admin/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentIds }),
      });
      if (!res.ok) throw new Error("Failed to promote students");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      setSelectedStudents([]);
      alert(`Promoted ${data.data?.promotedCount || 0} students. Failed: ${data.data?.failedCount || 0}`);
    },
  });

  const handleSelectStudent = (id: string) => {
    setSelectedStudents(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password || !formData.role) return;
    createMutation.mutate();
  };

  const usersList = usersData?.data?.users || [];

  return (
    <div className="max-w-6xl mx-auto pb-12 relative z-10">
      <div className="flex justify-between items-end mb-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-3">
            <Users size={32} /> User Management
          </h1>
          <p className="text-foreground/70">Create, view, and remove system users.</p>
        </motion.div>
        <div className="flex gap-4">
          {selectedStudents.length > 0 && (
            <AnimatedButton onClick={() => promoteMutation.mutate(selectedStudents)} isLoading={promoteMutation.isPending} className="bg-green-600 hover:bg-green-700">
              <ArrowUpCircle size={18} className="mr-2 inline" /> Promote Selected ({selectedStudents.length})
            </AnimatedButton>
          )}
          <AnimatedButton onClick={() => setIsModalOpen(true)}>
            <Plus size={18} className="mr-2 inline" /> Add User
          </AnimatedButton>
        </div>
      </div>

      <div className="glass rounded-3xl border border-white/10 overflow-hidden">
        <div className="grid grid-cols-12 bg-white/5 p-4 font-semibold text-foreground/80 border-b border-white/10 text-sm">
          <div className="col-span-1 text-center">Select</div>
          <div className="col-span-4">Name & Email</div>
          <div className="col-span-3">Role / Dept</div>
          <div className="col-span-2">Joined Date</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[1,2,3,4].map(i => <div key={i} className="h-12 bg-white/5 animate-pulse rounded-xl" />)}
          </div>
        ) : usersList.length === 0 ? (
          <div className="p-8 text-center text-foreground/50">No users found.</div>
        ) : (
          <div className="divide-y divide-white/5 max-h-[60vh] overflow-y-auto">
            {usersList.map((user: any, i: number) => (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                key={user.id} className="grid grid-cols-12 p-4 items-center hover:bg-white/5 transition-colors text-sm"
              >
                <div className="col-span-1 flex justify-center">
                  {user.role === "STUDENT" && (
                    <input 
                      type="checkbox" 
                      checked={selectedStudents.includes(user.id)}
                      onChange={() => handleSelectStudent(user.id)}
                      className="w-4 h-4 rounded border-white/20 bg-black/40 text-primary focus:ring-primary"
                    />
                  )}
                </div>
                <div className="col-span-4 flex flex-col">
                  <span className="font-bold text-primary">{user.name} {user.rollNumber && `(${user.rollNumber})`}</span>
                  <span className="text-foreground/50 text-xs">{user.email}</span>
                </div>
                <div className="col-span-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    user.role === 'ADMIN' ? 'bg-red-500/20 text-red-500' :
                    user.role === 'TEACHER' ? 'bg-blue-500/20 text-blue-500' :
                    'bg-green-500/20 text-green-500'
                  }`}>
                    {user.role}
                  </span>
                  {(user.role === 'STUDENT' || user.role === 'TEACHER') && user.departmentName && (
                    <p className="text-[10px] text-foreground/50 mt-1.5">{user.departmentName} {user.role === 'STUDENT' ? `(Sem ${user.semester})` : ''}</p>
                  )}
                </div>
                <div className="col-span-2 text-foreground/70">{new Date(user.createdAt).toLocaleDateString()}</div>
                <div className="col-span-2 text-right">
                  <button 
                    onClick={() => {
                      if (window.confirm("Are you sure you want to delete this user?")) {
                        deleteMutation.mutate(user.id);
                      }
                    }}
                    disabled={deleteMutation.isPending && deleteMutation.variables === user.id}
                    className="p-2 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Creation Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: "10%" }} animate={{ opacity: 1, scale: 1, y: "-50%" }} exit={{ opacity: 0, scale: 0.95, y: "10%" }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 z-50 w-full max-w-md"
            >
              <div className="glass p-8 rounded-3xl border border-white/20 shadow-2xl relative">
                <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                  <X size={20} />
                </button>
                <h2 className="text-2xl font-bold mb-6 text-primary">Create New User</h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <AnimatedInput
                    label="Full Name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                  <AnimatedInput
                    label="Email Address"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                  <AnimatedInput
                    label="Password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                  />
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground/70 mb-1 ml-1">Role</label>
                    <select 
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors appearance-none"
                    >
                      <option value="STUDENT">Student</option>
                      <option value="TEACHER">Teacher</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <AnimatedButton type="submit" isLoading={createMutation.isPending} className="w-full">
                      Create Account
                    </AnimatedButton>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
