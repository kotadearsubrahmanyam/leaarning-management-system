"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { User, BookOpen, Users, MapPin, Mail, Phone, Calendar, Building, Award, ShieldCheck, Sparkles, GraduationCap, Briefcase, BookMarked } from "lucide-react";
import { ChangePassword } from "@/components/profile/change-password";

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
  // Generate realistic derived academic data for the teacher
  const derivedProfile = useMemo(() => {
    return {
      departmentName: "Computer Science & Engineering",
      facultyId: `FAC-${user.id.substring(0, 6).toUpperCase()}`,
      qualification: "Ph.D. in Computer Science & Engineering (IIT Bombay)",
      experience: "12 Years of Academic and Industry Experience",
      subjectsHandling: [
        "Database Management Systems (DBMS)",
        "Advanced Web Technologies",
        "Distributed Cloud Architecture"
      ],
      phone: "+91 98452 10293",
      location: "Academic Block 3, Cabin 402",
      joinDate: user.createdAt 
        ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : "June 15, 2021",
      coursesCount: 4,
      studentsCount: 128
    };
  }, [user]);

  return (
    <div className="max-w-6xl mx-auto pb-12 relative z-10">
      
      {/* Dynamic Animated Header Card */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl overflow-hidden mb-10 shadow-lg shadow-purple-500/10"
      >
        {/* Full Card Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#7C3AED] via-[#A855F7] to-indigo-600 z-0"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay z-0"></div>
        
        {/* Animated Glowing Orbs */}
        <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
          <motion.div 
            animate={{ x: [0, 80, 0], y: [0, -30, 0], scale: [1, 1.1, 1] }} 
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="absolute -top-24 -left-24 w-[400px] h-[400px] bg-purple-400 rounded-full mix-blend-screen filter blur-[100px] opacity-30"
          ></motion.div>
          <motion.div 
            animate={{ x: [0, -80, 0], y: [0, 30, 0], scale: [1, 1.3, 1] }} 
            transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
            className="absolute top-12 -right-24 w-[400px] h-[400px] bg-indigo-400 rounded-full mix-blend-screen filter blur-[100px] opacity-30"
          ></motion.div>
        </div>

        <div className="px-6 sm:px-12 py-10 sm:py-12 relative z-10">
          <div className="flex flex-col sm:flex-row items-center gap-8">
            {/* Avatar Container */}
            <div className="w-32 h-32 rounded-full border-4 border-white/40 bg-white/10 backdrop-blur-md flex items-center justify-center overflow-hidden shadow-2xl shrink-0 transition-transform duration-300 hover:scale-105">
              <span className="text-4xl font-black text-white drop-shadow-md">
                {user.name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .substring(0, 2)
                  .toUpperCase()}
              </span>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2 drop-shadow-md">
                {user.name}
              </h1>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30 text-xs font-black uppercase tracking-wider shadow-md">
                  <ShieldCheck size={14} /> Faculty Account
                </span>
                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-white/95 border border-white/20 text-xs font-black uppercase tracking-wider shadow-md">
                  <Building size={14} /> {derivedProfile.departmentName}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Faculty Institutional Details */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-1 space-y-6"
        >
          <div className="bg-white rounded-3xl p-6 border border-[#E5E7EB] shadow-sm space-y-6">
            <h3 className="text-lg font-black text-[#111827] flex items-center gap-2 border-b border-slate-100 pb-3">
              <Building className="text-[#7C3AED]" size={20} /> Institutional Info
            </h3>
            
            <div className="space-y-4">
              <ProfileDetail icon={Award} label="Faculty ID" value={derivedProfile.facultyId} />
              <ProfileDetail icon={Mail} label="University Email" value={user.email} />
              <ProfileDetail icon={Phone} label="Contact Phone" value={derivedProfile.phone} />
              <ProfileDetail icon={MapPin} label="Office Cabin" value={derivedProfile.location} />
              <ProfileDetail icon={Calendar} label="Date of Joining" value={derivedProfile.joinDate} />
            </div>
          </div>
        </motion.div>

        {/* Right Column: Faculty Expertise & Academic Stats */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Academic Profile details */}
          <div className="bg-white rounded-3xl p-6 border border-[#E5E7EB] shadow-sm space-y-6">
            <h3 className="text-lg font-black text-[#111827] flex items-center gap-2 border-b border-slate-100 pb-3">
              <Sparkles className="text-[#7C3AED]" size={20} /> Academic Credentials & Expertise
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-purple-50 text-[#7C3AED] shrink-0">
                  <GraduationCap size={20} />
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Qualification</span>
                  <span className="text-sm font-extrabold text-[#111827] mt-1 block">{derivedProfile.qualification}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-purple-50 text-[#7C3AED] shrink-0">
                  <Briefcase size={20} />
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Teaching Experience</span>
                  <span className="text-sm font-extrabold text-[#111827] mt-1 block">{derivedProfile.experience}</span>
                </div>
              </div>

              <div className="col-span-1 md:col-span-2 p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-purple-50 text-[#7C3AED] shrink-0">
                  <BookMarked size={20} />
                </div>
                <div className="w-full">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">Subjects Handling</span>
                  <div className="flex flex-wrap gap-2">
                    {derivedProfile.subjectsHandling.map((subject, idx) => (
                      <span key={idx} className="px-3 py-1 bg-white border border-[#E5E7EB] text-[#111827] text-xs font-bold rounded-full shadow-sm">
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick stats indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4">
              <div className="group relative p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-[#7C3AED]">
                    <BookOpen size={24} />
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Active Courses</div>
                    <div className="text-2xl font-black text-[#7C3AED] mt-0.5">
                      {derivedProfile.coursesCount} Courses
                    </div>
                  </div>
                </div>
              </div>

              <div className="group relative p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-[#7C3AED]">
                    <Users size={24} />
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Enrolled</div>
                    <div className="text-2xl font-black text-[#7C3AED] mt-0.5">
                      {derivedProfile.studentsCount} Students
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

      </div>

      <div className="mt-8">
        <ChangePassword />
      </div>
    </div>
  );
}

// Custom Profile Field component for premium look
function ProfileDetail({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="group p-3 rounded-2xl border border-transparent hover:border-slate-100 hover:bg-slate-50 transition-all duration-300 flex items-start gap-4">
      <div className="mt-0.5 p-2 rounded-xl bg-slate-100 text-slate-500 group-hover:bg-purple-100 group-hover:text-[#7C3AED] transition-colors duration-300">
        <Icon size={16} />
      </div>
      <div>
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">{label}</div>
        <div className="text-[#111827] font-extrabold text-[14px]">{value}</div>
      </div>
    </div>
  );
}
