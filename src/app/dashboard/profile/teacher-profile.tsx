"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { User, BookOpen, Users, MapPin, Mail, Phone, Calendar, Building, Award, ShieldCheck, Sparkles } from "lucide-react";
import { DashboardCard, ProfileFieldCard } from "@/components/ui/student-portal-cards";

// Reusing the same interface from the student profile for consistency
interface UserProfileProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt?: string;
  };
}

export function TeacherProfileView({ user }: UserProfileProps) {
  // Generate some realistic-looking derived data for the teacher
  const derivedProfile = useMemo(() => {
    return {
      departmentName: "Computer Science and Engineering",
      facultyId: `FAC-${user.id.substring(0, 6).toUpperCase()}`,
      phone: "+91 98765 43210",
      location: "A. Rajahmundry Rural, AP",
      joinDate: user.createdAt 
        ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : "August 12, 2023",
      coursesCount: 1, // Dynamically fetched in the dashboard, but hardcoded 1 for the profile presentation
      studentsCount: 20
    };
  }, [user]);

  return (
    <div className="max-w-6xl mx-auto pb-12 relative z-10">
      
      {/* Dynamic Animated Header Card */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl overflow-hidden mb-10 shadow-xl shadow-fuchsia-500/10"
      >
        {/* Full Card Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-700 via-fuchsia-600 to-orange-500 z-0"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay z-0"></div>
        
        {/* Animated Glowing Orbs */}
        <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
          <motion.div 
            animate={{ x: [0, 100, 0], y: [0, -50, 0], scale: [1, 1.2, 1] }} 
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute -top-24 -left-24 w-[500px] h-[500px] bg-fuchsia-400 rounded-full mix-blend-screen filter blur-[120px] opacity-40"
          ></motion.div>
          <motion.div 
            animate={{ x: [0, -100, 0], y: [0, 50, 0], scale: [1, 1.5, 1] }} 
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-12 -right-24 w-[500px] h-[500px] bg-violet-400 rounded-full mix-blend-screen filter blur-[120px] opacity-40"
          ></motion.div>
        </div>

        <div className="px-6 sm:px-12 py-10 sm:py-14 relative z-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-center gap-8">
            
            {/* Glassmorphism Avatar Container */}
            <div className="relative group shrink-0">
              <div className="absolute inset-0 bg-white rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
              <div className="w-36 h-36 sm:w-40 sm:h-40 rounded-3xl border-4 border-white/40 bg-white/10 backdrop-blur-md flex items-center justify-center overflow-hidden shadow-2xl relative z-10 transition-transform duration-500 group-hover:scale-105">
                <User size={72} className="text-white drop-shadow-md" />
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4 flex items-center justify-center sm:justify-start gap-3 drop-shadow-md">
                    {user.name}
                    <ShieldCheck className="text-blue-300 drop-shadow-md" size={32} />
                  </h1>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                    <span className="px-5 py-2 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30 text-sm font-bold flex items-center gap-2 shadow-lg">
                      <Award size={18} /> Distinguished Faculty
                    </span>
                    <span className="px-5 py-2 rounded-full bg-white/10 backdrop-blur-md text-white/90 border border-white/20 text-sm font-bold flex items-center gap-2 shadow-lg">
                      <Building size={18} /> {derivedProfile.departmentName}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Personal Info */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-1 space-y-8"
        >
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-300">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-3 mb-8">
              <div className="p-2.5 rounded-xl bg-violet-50 text-violet-600">
                <User size={22} />
              </div>
              Personal Info
            </h3>
            <div className="space-y-5">
              <ProfileDetail icon={Award} label="Faculty ID" value={derivedProfile.facultyId} />
              <ProfileDetail icon={Mail} label="University Email" value={user.email} />
              <ProfileDetail icon={Phone} label="Contact Number" value={derivedProfile.phone} />
              <ProfileDetail icon={MapPin} label="Office Location" value={derivedProfile.location} />
              <ProfileDetail icon={Calendar} label="Date of Joining" value={derivedProfile.joinDate} />
            </div>
          </div>
        </motion.div>

        {/* Right Column: Bio & Stats */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 space-y-8"
        >
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-300">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-fuchsia-50 text-fuchsia-600">
                <Sparkles size={22} />
              </div>
              Professional Summary
            </h3>
            
            <div className="relative p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200/60 overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 group-hover:opacity-80 transition-opacity duration-500"></div>
              <p className="text-slate-600 leading-relaxed font-medium text-lg relative z-10">
                <span className="font-bold text-slate-800">{user.name}</span> is a distinguished faculty member in the <span className="text-violet-600 font-bold">{derivedProfile.departmentName}</span> department, 
                specializing in delivering high-quality education and managing advanced technical courses. 
                They actively monitor student progress, coordinate syllabus completion, and ensure absolute academic excellence.
              </p>
            </div>
            
            {/* Premium Stat Cards */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
              
              <div className="group relative p-6 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-50/50 to-fuchsia-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10 flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 p-[1px] shadow-lg shadow-violet-200">
                    <div className="w-full h-full bg-white rounded-2xl flex items-center justify-center">
                      <BookOpen className="text-violet-600" size={28} />
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Active Courses</div>
                    <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600">
                      {derivedProfile.coursesCount}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="group relative p-6 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10 flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 p-[1px] shadow-lg shadow-emerald-200">
                    <div className="w-full h-full bg-white rounded-2xl flex items-center justify-center">
                      <Users className="text-emerald-500" size={28} />
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Total Enrolled</div>
                    <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-600">
                      {derivedProfile.studentsCount}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// Custom Profile Field component for premium look
function ProfileDetail({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="group p-4 rounded-2xl border border-transparent hover:border-slate-100 hover:bg-slate-50 transition-all duration-300 flex items-start gap-4">
      <div className="mt-0.5 p-2 rounded-xl bg-slate-100 text-slate-500 group-hover:bg-violet-100 group-hover:text-violet-600 transition-colors duration-300">
        <Icon size={18} />
      </div>
      <div>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</div>
        <div className="text-slate-800 font-semibold text-[15px]">{value}</div>
      </div>
    </div>
  );
}
