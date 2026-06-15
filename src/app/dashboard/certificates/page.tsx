"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Award, Download, ExternalLink } from "lucide-react";
import { AnimatedButton } from "@/components/ui/animated-button";

export default function StudentCertificatesPage() {
  const { data: certsData, isLoading } = useQuery({
    queryKey: ["studentCertificates"],
    queryFn: async () => {
      const res = await fetch("/api/student/certificates");
      if (!res.ok) throw new Error("Failed to fetch certificates");
      return res.json();
    },
  });

  const certificates = certsData?.data?.certificates || [];

  return (
    <div className="max-w-5xl mx-auto pb-12 relative z-10">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-3">
          <Award size={32} /> My Certificates
        </h1>
        <p className="text-foreground/70">View and download your official course completion certificates.</p>
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-48 glass border border-slate-300 rounded-3xl animate-pulse bg-white/50" />)}
        </div>
      ) : certificates.length === 0 ? (
        <div className="glass p-12 rounded-3xl border border-slate-300 text-center">
          <Award size={48} className="mx-auto text-slate-300 mb-4" />
          <h2 className="text-xl font-bold mb-2">No Certificates Yet</h2>
          <p className="text-foreground/50">Complete courses and wait for faculty evaluation to earn certificates.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((cert: any, i: number) => (
            <motion.div
              key={cert.id}
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              transition={{ delay: i * 0.1 }}
              className="glass p-6 rounded-3xl border border-slate-300 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4 border border-primary/20">
                  <Award size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2 leading-tight">
                  {cert.courseName}
                </h3>
                <p className="text-sm text-slate-400 font-bold mb-6">
                  Issued on {new Date(cert.issuedDate).toLocaleDateString()}
                </p>
              </div>
              
              <div className="pt-4 border-t border-slate-200">
                <AnimatedButton 
                  onClick={() => {
                    // For now, alert that PDF generation is mocked
                    alert("Certificate PDF is ready for download! (Mocked functionality)");
                  }}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <Download size={16} /> Download PDF
                </AnimatedButton>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
