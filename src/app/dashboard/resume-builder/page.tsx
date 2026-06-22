"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Plus, Edit2, Trash2, Download, FileCode, Calendar, Loader2 } from "lucide-react";
import { LiveResumePreview } from "@/components/resume-builder/LiveResumePreview";

interface Resume {
  id: string;
  fullName: string;
  templateId: string;
  status: string;
  updatedAt: string;
}

export default function ResumeBuilderDashboard() {
  const router = useRouter();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [exportingResume, setExportingResume] = useState<any | null>(null);

  const fetchResumes = async () => {
    try {
      const res = await fetch("/api/resume");
      if (res.ok) {
        const payload = await res.json();
        if (payload.success) {
          setResumes(payload.data || []);
        }
      }
    } catch (err) {
      console.error("Failed to load resumes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleCreateNew = async () => {
    setCreating(true);
    const defaultResume = {
      fullName: "New Resume",
      email: "",
      phone: "",
      address: "",
      linkedinUrl: "",
      githubUrl: "",
      portfolioUrl: "",
      professionalSummary: "",
      templateId: "ats",
      status: "DRAFT",
      skills: {
        languages: [],
        frameworks: [],
        databases: [],
        tools: [],
        softSkills: []
      },
      education: [],
      experience: [],
      projects: [],
      certifications: [],
      achievements: [],
      languages: [],
      interests: []
    };

    try {
      const res = await fetch("/api/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(defaultResume),
      });

      if (res.ok) {
        const payload = await res.json();
        if (payload.success && payload.data?.id) {
          router.push(`/dashboard/resume-builder/${payload.data.id}`);
        }
      }
    } catch (err) {
      console.error("Failed to create new resume:", err);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this resume?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/resume/${id}`, { method: "DELETE" });
      if (res.ok) {
        setResumes(resumes.filter((r) => r.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete resume:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleExport = async (id: string, type: "pdf" | "tex", e: React.MouseEvent) => {
    e.stopPropagation();
    if (type === "tex") {
      try {
        window.open(`/api/resume/${id}?export=tex`, "_blank");
      } catch (err) {
        console.error("Failed to download LaTeX:", err);
      }
      return;
    }

    // PDF client-side export fallback to avoid host LaTeX dependencies
    try {
      setCreating(true); // display loader during fetch/generation
      const res = await fetch(`/api/resume/${id}`);
      if (!res.ok) throw new Error("Failed to fetch resume details");
      const payload = await res.json();
      if (!payload.success || !payload.data) throw new Error("Resume not found");

      const resumeData = payload.data;
      setExportingResume(resumeData);

      // Wait for offscreen DOM element to render
      await new Promise((resolve) => setTimeout(resolve, 300));

      const element = document.getElementById("hidden-resume-preview");
      if (!element) throw new Error("Hidden preview element not found");

      const previewContent = element.querySelector("#resume-preview-content") as HTMLElement;
      if (!previewContent) throw new Error("Preview content element not found");

      const html2canvasModule = await import("html2canvas");
      const html2canvas = html2canvasModule.default || html2canvasModule;

      const jspdfModule = await import("jspdf");
      const jsPDF = jspdfModule.jsPDF || jspdfModule.default || jspdfModule;

      // Temporarily reset transform for clean capture
      const originalTransform = previewContent.style.transform;
      previewContent.style.transform = "none";

      await new Promise((resolve) => setTimeout(resolve, 150));

      const canvas = await html2canvas(previewContent, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      previewContent.style.transform = originalTransform;

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      
      let pdf;
      try {
        pdf = new jsPDF({
          orientation: "portrait",
          unit: "pt",
          format: "a4",
        });
      } catch (err) {
        try {
          pdf = new jsPDF("p", "pt", "a4");
        } catch (err2) {
          throw new Error("jsPDF constructor failed to instantiate.");
        }
      }

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");

      const filename = `resume_${resumeData.fullName.toLowerCase().replace(/\s+/g, "_")}.pdf`;
      pdf.save(filename);

    } catch (err) {
      console.error("Client-side PDF generation failed, falling back to backend:", err);
      // Fallback: Open backend endpoint in new tab
      window.open(`/api/resume/${id}?export=pdf`, "_blank");
    } finally {
      setExportingResume(null);
      setCreating(false);
    }
  };

  const formatTemplateName = (id: string) => {
    switch (id) {
      case "modern": return "Modern Professional";
      case "academic": return "Academic CV";
      case "se": return "Software Engineer";
      default: return "ATS Clean";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-[#F8FAFC]">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-[#CBD5E1] dark:border-[#475569]/60 pb-5">
        <div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
            Resume Builder
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Build, structure, and compile professional ATS-friendly LaTeX CVs and download compiled PDFs.
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          disabled={creating}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all duration-300 shadow-md shadow-purple-950 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
        >
          {creating ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="h-5 w-5" />
              Create New Resume
            </>
          )}
        </button>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="h-12 w-12 text-purple-600 animate-spin mb-4" />
          <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold">Loading resumes...</p>
        </div>
      ) : resumes.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-12 bg-[#F8FAFC] dark:bg-[#1E293B]/20 border border-[#CBD5E1] dark:border-[#475569]/60 rounded-2xl max-w-xl mx-auto shadow-sm">
          <div className="h-16 w-16 bg-purple-500/10 border border-purple-500/20 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 mb-6">
            <FileText className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold mb-2">No resumes found</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm max-w-sm">
            Get started by creating a new resume. You can choose from multiple professional templates and compile them directly.
          </p>
          <button
            onClick={handleCreateNew}
            disabled={creating}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all shadow-md shadow-purple-900"
          >
            Create Your First Resume
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resumes.map((resume) => (
            <div
              key={resume.id}
              onClick={() => router.push(`/dashboard/resume-builder/${resume.id}`)}
              className="group relative flex flex-col justify-between p-6 bg-white dark:bg-[#1E293B]/20 border border-[#CBD5E1] dark:border-[#475569]/60 rounded-2xl hover:border-purple-500/50 dark:hover:border-purple-500/50 hover:bg-slate-50 dark:hover:bg-[#1E293B]/40 transition-all duration-300 cursor-pointer shadow-md hover:-translate-y-1"
            >
              {/* Top Row info */}
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="h-10 w-10 bg-purple-500/10 border border-purple-500/25 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:bg-purple-500/20 transition-all">
                    <FileText className="h-5 w-5" />
                  </div>
                  <span className={`px-2.5 py-1 text-xxs font-extrabold tracking-wide uppercase rounded-full ${
                    resume.status === "PUBLISHED"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                  }`}>
                    {resume.status}
                  </span>
                </div>
                <h3 className="text-base font-black truncate group-hover:text-purple-600 dark:text-purple-300 transition-colors">
                  {resume.fullName || "Untitled Resume"}
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider font-bold">
                  Template: <span className="text-purple-600 dark:text-purple-400">{formatTemplateName(resume.templateId)}</span>
                </p>
              </div>

              {/* Bottom Row Action and Date */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-[#475569]/20 flex flex-col gap-3">
                <div className="flex items-center text-slate-400 dark:text-slate-500 text-xs gap-1.5 font-semibold">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>
                    Updated: {new Date(resume.updatedAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>

                <div className="flex justify-between gap-2 mt-2">
                  <div className="flex gap-1.5">
                    <button
                      onClick={(e) => handleExport(resume.id, "pdf", e)}
                      title="Download PDF"
                      className="p-2 bg-slate-50 dark:bg-slate-800 border border-[#CBD5E1] dark:border-[#475569] hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-all"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => handleExport(resume.id, "tex", e)}
                      title="Download LaTeX source"
                      className="p-2 bg-slate-50 dark:bg-slate-800 border border-[#CBD5E1] dark:border-[#475569] hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-all"
                    >
                      <FileCode className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/dashboard/resume-builder/${resume.id}`);
                      }}
                      title="Edit Resume"
                      className="p-2 bg-purple-50 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-800/40 hover:bg-purple-100 dark:hover:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg transition-all"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(resume.id, e)}
                      disabled={deletingId === resume.id}
                      title="Delete Resume"
                      className="p-2 bg-rose-50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-800/40 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg transition-all disabled:opacity-50"
                    >
                      {deletingId === resume.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Hidden preview container for client-side PDF generation from dashboard */}
      {exportingResume && (
        <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }} id="hidden-resume-preview">
          <LiveResumePreview data={exportingResume} />
        </div>
      )}
    </div>
  );
}
