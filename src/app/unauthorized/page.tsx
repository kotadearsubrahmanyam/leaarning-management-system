"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">
      {/* Decorative background shapes */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] aspect-square rounded-full bg-purple-200/40 blur-3xl" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] aspect-square rounded-full bg-indigo-200/40 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md p-8 bg-white/70 backdrop-blur-xl rounded-3xl shadow-[0_20px_50px_rgba(109,40,217,0.1)] border border-white/80 text-center relative z-10 mx-4"
      >
        <div className="mx-auto w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center text-red-500 mb-6 shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-black text-slate-800 tracking-tight mb-3">
          Access Denied
        </h1>
        
        <p className="text-sm font-medium text-slate-600 leading-relaxed mb-8">
          You do not have the required permissions to view this resource. This feature is restricted based on user roles.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full py-3.5 px-6 rounded-xl font-bold text-white shadow-lg transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0_8px_25px_rgba(109,40,217,0.3)] flex items-center justify-center gap-2"
            style={{
              background: "linear-gradient(135deg, #6D28D9, #7C3AED)",
            }}
          >
            <ArrowLeft className="w-4 h-4" /> Go to Dashboard
          </button>
        </div>
      </motion.div>
    </div>
  );
}
