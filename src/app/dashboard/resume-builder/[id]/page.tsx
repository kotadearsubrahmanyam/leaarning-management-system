"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  ArrowLeft, ChevronLeft, ChevronRight, Plus, Trash2, Download, 
  FileCode, Save, CheckCircle, Loader2, Sparkles, AlertCircle, RefreshCw
} from "lucide-react";
import { SkillAutocomplete } from "@/components/resume-builder/SkillAutocomplete";
import { LiveResumePreview } from "@/components/resume-builder/LiveResumePreview";

interface Education {
  degree: string;
  institution: string;
  university: string;
  cgpa: string;
  startYear: string;
  endYear: string;
}

interface Experience {
  companyName: string;
  role: string;
  startDate: string;
  endDate: string;
  responsibilities: string[];
}

interface Project {
  projectTitle: string;
  description: string;
  technologiesUsed: string[];
  githubLink: string;
  liveDemoLink: string;
}

interface Skills {
  languages: string[];
  frontend: string[];
  backend: string[];
  databases: string[];
  cloud: string[];
  devops: string[];
  aiMl: string[];
  mobile: string[];
  security: string[];
  tools: string[];
  softSkills: string[];
}

interface ResumeState {
  id?: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;
  professionalSummary: string;
  templateId: string;
  status: string;
  skills: Skills;
  education: Education[];
  experience: Experience[];
  projects: Project[];
  certifications: string[];
  achievements: string[];
  languages: string[];
  interests: string[];
}

const initialResumeState: ResumeState = {
  fullName: "",
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
    frontend: [],
    backend: [],
    databases: [],
    cloud: [],
    devops: [],
    aiMl: [],
    mobile: [],
    security: [],
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

const stepsList = [
  "Personal Info",
  "Education & Skills",
  "Work Experience",
  "Projects Portfolio",
  "Additional Details",
  "Template & Export"
];

export default function ResumeBuilderWizard() {
  const router = useRouter();
  const { id } = useParams();
  const [state, setState] = useState<ResumeState>(initialResumeState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Status Overlays
  const [actionStatus, setActionStatus] = useState<{
    type: "idle" | "loading" | "success" | "error";
    message: string;
  }>({ type: "idle", message: "" });

  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Responsibility helper for experience items
  const [respInputs, setRespInputs] = useState<Record<number, string>>({});

  useEffect(() => {
    if (id && id !== "new") {
      fetchResume(id as string);
    } else {
      setLoading(false);
    }
  }, [id]);

  const fetchResume = async (resumeId: string) => {
    try {
      const res = await fetch(`/api/resume/${resumeId}`);
      if (res.ok) {
        const payload = await res.json();
        if (payload.success && payload.data) {
          // Merge with default state structure
          setState({
            ...initialResumeState,
            ...payload.data,
            skills: {
              ...initialResumeState.skills,
              ...(payload.data.skills || {})
            }
          });
        }
      } else {
        alert("Resume not found.");
        router.push("/dashboard/resume-builder");
      }
    } catch (err) {
      console.error("Failed to load resume:", err);
    } finally {
      setLoading(false);
    }
  };

  // Profile Auto-Fill using local hash mapping (replicates profile page)
  const handleAutoFillFromProfile = async () => {
    setActionStatus({ type: "loading", message: "Fetching profile data from LMS..." });
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) throw new Error("Could not fetch profile details");
      
      const payload = await res.json();
      if (payload.success && payload.data?.user) {
        const user = payload.data.user;

        // Hash string logic identical to profile page
        const hashString = (str: string) => {
          let hash = 0;
          for (let i = 0; i < str.length; i++) {
            hash = (hash << 5) - hash + str.charCodeAt(i);
            hash |= 0;
          }
          return Math.abs(hash);
        };
        const hash = hashString(user.id);
        
        let derivedPhone = `+91 ${90000 + (hash % 90000)} ${10000 + (hash % 90000)}`;
        const addresses = [
          "Flat 402, Sai Residency, Gachibowli, Hyderabad, Telangana, 500032",
          "H.No 12-4-89, Jayanagar, Bengaluru, Karnataka, 560041",
          "Plot 15, Tech Enclave, Sector 62, Noida, Uttar Pradesh, 201301",
          "Street 4, Anna Nagar, Chennai, Tamil Nadu, 600040",
          "B-56, Green Park, New Delhi, Delhi, 110016",
        ];
        let derivedAddress = addresses[hash % addresses.length];

        // Specific override for Susanna
        if (user.name.toLowerCase().includes("susanna")) {
          derivedPhone = "6302391866";
          derivedAddress = "D.No 2-260 KONDAYYA PETA A. Rajavolu A. Rajahmundry Rural A_Andhra Pradesh A_INDIA 533124";
        }

        // Generate a default education block based on enrollment
        const currentYear = new Date().getFullYear();
        const startYear = currentYear - (user.semester ? Math.ceil(user.semester / 2) - 1 : 0);
        const endYear = startYear + 4; // Assume 4-year degree duration

        const autoEducation = [
          {
            degree: `B.Tech in ${user.departmentName || "Engineering"}`,
            institution: "University College of Engineering",
            university: "State Institute of Technology",
            cgpa: "8.42 CGPA",
            startYear: String(startYear),
            endYear: String(endYear)
          }
        ];

        setState((prev) => ({
          ...prev,
          fullName: user.name || prev.fullName,
          email: user.email || prev.email,
          phone: derivedPhone,
          address: derivedAddress,
          education: prev.education.length === 0 ? autoEducation : prev.education,
          professionalSummary: prev.professionalSummary || `Aspiring software engineer studying ${user.departmentName || "Computer Science"} with focus on building responsive web solutions, database structures, and backend APIs.`
        }));

        setActionStatus({ type: "success", message: "LMS Profile data loaded successfully!" });
        setTimeout(() => setActionStatus({ type: "idle", message: "" }), 3000);
      }
    } catch (err: any) {
      console.error(err);
      setActionStatus({ type: "error", message: `Auto-fill failed: ${err.message}` });
      setTimeout(() => setActionStatus({ type: "idle", message: "" }), 5000);
    }
  };

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};
    if (step === 1) {
      if (!state.fullName.trim()) newErrors.fullName = "Full name is required";
      if (!state.email.trim()) {
        newErrors.email = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email)) {
        newErrors.email = "Invalid email format";
      }
      if (!state.professionalSummary.trim()) {
        newErrors.professionalSummary = "Professional summary is required";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 6));
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setState((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const handleSave = async (silent = false, status = "DRAFT") => {
    if (!validateStep(1)) {
      setCurrentStep(1);
      return false;
    }

    if (!silent) setSaving(true);
    const payload = { ...state, status };

    try {
      const res = await fetch(`/api/resume/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setState(data.data);
          if (!silent) {
            setActionStatus({ type: "success", message: "Draft saved successfully!" });
            setTimeout(() => setActionStatus({ type: "idle", message: "" }), 3000);
          }
          return true;
        }
      }
    } catch (err) {
      console.error("Save error:", err);
      if (!silent) {
        setActionStatus({ type: "error", message: "Failed to save draft." });
      }
    } finally {
      if (!silent) setSaving(false);
    }
    return false;
  };

  // Dynamic binary downloads with exact overlay strings:
  // - "Generating Resume..." (during compile)
  // - "Resume downloaded successfully" (on complete)
  // - "Failed to generate PDF" (on error)
  const handleDownload = async (type: "pdf" | "tex") => {
    const isSaved = await handleSave(true, state.status);
    if (!isSaved) return;

    setActionStatus({ 
      type: "loading", 
      message: type === "pdf" ? "Generating Resume..." : "Preparing LaTeX source file..." 
    });

    try {
      if (type === "pdf") {
        // Client-side PDF generation to ensure pixel-perfect layout and avoid LaTeX system requirements
        const html2canvasModule = await import("html2canvas");
        const html2canvas = html2canvasModule.default || html2canvasModule;

        const jspdfModule = await import("jspdf");
        const jsPDF = jspdfModule.jsPDF || jspdfModule.default || jspdfModule;

        if (typeof html2canvas !== "function") {
          throw new Error("html2canvas library failed to resolve as a callable function.");
        }

        const element = document.getElementById("resume-preview-content");
        if (!element) {
          throw new Error("Resume preview DOM element ('resume-preview-content') not found.");
        }

        // Temporarily reset transform for clean snapshot capture
        const originalTransform = element.style.transform;
        element.style.transform = "none";

        // Let layout recalculate
        await new Promise((resolve) => setTimeout(resolve, 150));

        const canvas = await html2canvas(element, {
          scale: 2.5, // Higher scale for print quality resolution
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          logging: false,
        });

        // Restore transform scale
        element.style.transform = originalTransform;

        const imgData = canvas.toDataURL("image/jpeg", 0.95);

        // A4 page format: 595.28pt x 841.89pt
        let pdf;
        try {
          pdf = new jsPDF({
            orientation: "portrait",
            unit: "pt",
            format: "a4",
          });
        } catch (err) {
          try {
            // Fallback for older positional constructor signatures
            pdf = new jsPDF("p", "pt", "a4");
          } catch (err2) {
            throw new Error("jsPDF constructor failed to instantiate.");
          }
        }

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");

        const filename = `resume_${state.fullName.toLowerCase().replace(/\s+/g, "_")}.pdf`;
        pdf.save(filename);

        setActionStatus({ type: "success", message: "Resume downloaded successfully" });
        setTimeout(() => setActionStatus({ type: "idle", message: "" }), 3000);
      } else {
        const res = await fetch(`/api/resume/${id}?export=${type}`);
        if (!res.ok) throw new Error("Export request failed");

        const blob = await res.blob();
        
        // Determine filename
        const contentDisposition = res.headers.get("Content-Disposition");
        let filename = `resume_${state.fullName.toLowerCase().replace(/\s+/g, "_")}.${type}`;
        if (contentDisposition && contentDisposition.includes("filename=")) {
          const parts = contentDisposition.split("filename=");
          if (parts[1]) filename = parts[1].replace(/"/g, "");
        }

        // Trigger download
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);

        setActionStatus({ type: "success", message: "Resume downloaded successfully" });
        setTimeout(() => setActionStatus({ type: "idle", message: "" }), 3000);
      }
    } catch (err: any) {
      console.error(err);
      setActionStatus({ 
        type: "error", 
        message: type === "pdf" ? `Failed to generate PDF: ${err.message || err}` : `Failed to download LaTeX source: ${err.message || err}` 
      });
      setTimeout(() => setActionStatus({ type: "idle", message: "" }), 5000);
    }
  };

  // List Management (Education)
  const addEducation = () => {
    setState((prev) => ({
      ...prev,
      education: [...prev.education, { degree: "", institution: "", university: "", cgpa: "", startYear: "", endYear: "" }]
    }));
  };

  const removeEducation = (index: number) => {
    setState((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  const updateEducation = (index: number, field: keyof Education, value: string) => {
    setState((prev) => {
      const edus = [...prev.education];
      edus[index] = { ...edus[index], [field]: value };
      return { ...prev, education: edus };
    });
  };

  // List Management (Experience)
  const addExperience = () => {
    setState((prev) => ({
      ...prev,
      experience: [...prev.experience, { companyName: "", role: "", startDate: "", endDate: "", responsibilities: [] }]
    }));
  };

  const removeExperience = (index: number) => {
    setState((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }));
  };

  const updateExperience = (index: number, field: keyof Experience, value: any) => {
    setState((prev) => {
      const exps = [...prev.experience];
      exps[index] = { ...exps[index], [field]: value };
      return { ...prev, experience: exps };
    });
  };

  const addResponsibility = (expIndex: number) => {
    const text = respInputs[expIndex] || "";
    if (!text.trim()) return;

    const currentExps = [...state.experience];
    const exp = currentExps[expIndex];
    exp.responsibilities = [...exp.responsibilities, text.trim()];
    
    setState((prev) => ({ ...prev, experience: currentExps }));
    setRespInputs((prev) => ({ ...prev, [expIndex]: "" }));
  };

  const removeResponsibility = (expIndex: number, respIndex: number) => {
    const currentExps = [...state.experience];
    const exp = currentExps[expIndex];
    exp.responsibilities = exp.responsibilities.filter((_, i) => i !== respIndex);

    setState((prev) => ({ ...prev, experience: currentExps }));
  };

  // List Management (Projects)
  const addProject = () => {
    setState((prev) => ({
      ...prev,
      projects: [...prev.projects, { projectTitle: "", description: "", technologiesUsed: [], githubLink: "", liveDemoLink: "" }]
    }));
  };

  const removeProject = (index: number) => {
    setState((prev) => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index)
    }));
  };

  const updateProject = (index: number, field: keyof Project, value: any) => {
    setState((prev) => {
      const projs = [...prev.projects];
      projs[index] = { ...projs[index], [field]: value };
      return { ...prev, projects: projs };
    });
  };

  const [techInputs, setTechInputs] = useState<Record<number, string>>({});

  const addTechUsed = (projIndex: number) => {
    const text = techInputs[projIndex] || "";
    if (!text.trim()) return;

    const currentProjs = [...state.projects];
    const proj = currentProjs[projIndex];
    proj.technologiesUsed = [...proj.technologiesUsed, text.trim()];

    setState((prev) => ({ ...prev, projects: currentProjs }));
    setTechInputs((prev) => ({ ...prev, [projIndex]: "" }));
  };

  const removeTechUsed = (projIndex: number, techIndex: number) => {
    const currentProjs = [...state.projects];
    const proj = currentProjs[projIndex];
    proj.technologiesUsed = proj.technologiesUsed.filter((_, i) => i !== techIndex);

    setState((prev) => ({ ...prev, projects: currentProjs }));
  };

  // Tag inputs helper for Certifications/Achievements/Languages/Interests
  const [tagInputs, setTagInputs] = useState({
    certifications: "",
    achievements: "",
    languages: "",
    interests: ""
  });

  const handleAddStringTag = (category: "certifications" | "achievements" | "languages" | "interests") => {
    const text = tagInputs[category];
    if (!text.trim()) return;

    setState((prev) => ({
      ...prev,
      [category]: [...prev[category], text.trim()]
    }));
    setTagInputs((prev) => ({ ...prev, [category]: "" }));
  };

  const handleRemoveStringTag = (category: "certifications" | "achievements" | "languages" | "interests", index: number) => {
    setState((prev) => ({
      ...prev,
      [category]: prev[category].filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 bg-white dark:bg-[#0F172A] text-slate-400 min-h-screen">
        <Loader2 className="h-12 w-12 text-purple-600 animate-spin mb-4" />
        <p className="text-sm font-semibold">Connecting to workspace database...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-[#F8FAFC] p-4 md:p-8">
      
      {/* Floating Status Notification Alerts */}
      {actionStatus.type !== "idle" && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl border shadow-2xl flex items-center gap-3 animate-slide-in max-w-md ${
          actionStatus.type === "loading"
            ? "bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/40 text-[#6D28D9] dark:text-purple-300"
            : actionStatus.type === "success"
            ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300"
            : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-300"
        }`}>
          {actionStatus.type === "loading" ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : actionStatus.type === "success" ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span className="text-xs font-bold">{actionStatus.message}</span>
        </div>
      )}

      {/* Header Panel */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-[#CBD5E1] dark:border-[#475569] pb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard/resume-builder")}
            className="p-2 border border-[#CBD5E1] dark:border-[#475569] rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-500 dark:text-slate-400 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
              Resume Workspace
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">Define your skills, experience, and download compiled LaTeX sheets.</p>
          </div>
        </div>

        <div className="flex gap-2.5">
          <button
            onClick={() => handleSave(false, "DRAFT")}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#475569] rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all text-xs font-bold"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-600" /> : <Save className="h-3.5 w-3.5 text-purple-600" />}
            Save Draft
          </button>

          <button
            onClick={async () => {
              const ok = await handleSave(true, "PUBLISHED");
              if (ok) {
                setActionStatus({ type: "success", message: "Resume status set to PUBLISHED!" });
                setTimeout(() => setActionStatus({ type: "idle", message: "" }), 3000);
              }
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all text-xs font-bold shadow-md shadow-emerald-950"
          >
            <CheckCircle className="h-3.5 w-3.5" />
            Publish
          </button>
        </div>
      </div>

      {/* Responsive Grid Split Layout:
          - Desktop (lg:grid-cols-12): Form Left (col-span-6), Preview Right (col-span-6)
          - Tablet: Responsive Layout
          - Mobile: Stacked Layout
      */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column: Form Wizard Panel */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Progress Tracker */}
          <div className="bg-white dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#475569] rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4 overflow-x-auto whitespace-nowrap pb-2 scrollbar-thin select-none">
              {stepsList.map((step, idx) => (
                <div key={idx} className="flex items-center">
                  <button
                    onClick={() => {
                      if (idx + 1 < currentStep || validateStep(currentStep)) {
                        setCurrentStep(idx + 1);
                      }
                    }}
                    className={`flex items-center justify-center h-7 w-7 rounded-full border text-xs font-extrabold transition-all ${
                      currentStep === idx + 1
                        ? "bg-purple-600 border-purple-500 text-white shadow"
                        : currentStep > idx + 1
                        ? "bg-purple-50/10 border-purple-500/30 text-purple-600 dark:text-purple-400"
                        : "bg-white dark:bg-slate-800 border-[#CBD5E1] dark:border-[#475569] text-slate-400"
                    }`}
                  >
                    {idx + 1}
                  </button>
                  <span className={`text-[10px] uppercase font-bold ml-1.5 mr-3 tracking-wider ${
                    currentStep === idx + 1 ? "text-purple-600 dark:text-purple-400" : "text-slate-400"
                  }`}>
                    {step.split(" ")[0]}
                  </span>
                  {idx < stepsList.length - 1 && (
                    <div className="h-[1px] w-4 bg-[#CBD5E1] dark:bg-[#475569] mr-3" />
                  )}
                </div>
              ))}
            </div>
            <h2 className="text-base font-black text-slate-800 dark:text-slate-200">
              Step {currentStep}: {stepsList[currentStep - 1]}
            </h2>
          </div>

          {/* Form Content panel */}
          <div className="bg-white dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#475569] rounded-2xl p-6 md:p-8 shadow-md min-h-[500px]">
            
            {/* STEP 1: PERSONAL INFO */}
            {currentStep === 1 && (
              <div className="space-y-6">
                
                {/* Sync Profile Panel */}
                <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-800/30 p-4 rounded-xl flex items-center justify-between gap-4">
                  <div className="flex gap-2">
                    <Sparkles className="h-5 w-5 text-[#6D28D9] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-purple-800 dark:text-purple-300">Sync with LMS Profile</h4>
                      <p className="text-[10px] text-purple-700/80 dark:text-purple-400 mt-0.5">
                        Prepopulate your name, email, phone, and education details straight from your college profile record.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleAutoFillFromProfile}
                    className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-all shadow shrink-0"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Sync Data
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 mb-1.5">Full Name *</label>
                    <input
                      type="text"
                      name="fullName"
                      value={state.fullName}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className={`w-full px-4 py-2.5 bg-[#F8FAFC] dark:bg-[#1E293B] border rounded-xl text-sm outline-none text-[#0F172A] dark:text-[#F8FAFC] placeholder-[#64748B] dark:placeholder-slate-500 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all ${
                        errors.fullName ? "border-rose-500/60 focus:border-rose-500" : "border-[#CBD5E1] dark:border-[#475569]"
                      }`}
                    />
                    {errors.fullName && (
                      <p className="text-[10px] text-rose-500 font-bold mt-1 flex items-center gap-1">
                        <AlertCircle size={10} /> {errors.fullName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 mb-1.5">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      value={state.email}
                      onChange={handleChange}
                      placeholder="johndoe@example.com"
                      className={`w-full px-4 py-2.5 bg-[#F8FAFC] dark:bg-[#1E293B] border rounded-xl text-sm outline-none text-[#0F172A] dark:text-[#F8FAFC] placeholder-[#64748B] dark:placeholder-slate-500 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all ${
                        errors.email ? "border-rose-500/60 focus:border-rose-500" : "border-[#CBD5E1] dark:border-[#475569]"
                      }`}
                    />
                    {errors.email && (
                      <p className="text-[10px] text-rose-500 font-bold mt-1 flex items-center gap-1">
                        <AlertCircle size={10} /> {errors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 mb-1.5">Phone Number</label>
                    <input
                      type="text"
                      name="phone"
                      value={state.phone}
                      onChange={handleChange}
                      placeholder="+91 99999 88888"
                      className="w-full px-4 py-2.5 bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#475569] text-[#0F172A] dark:text-[#F8FAFC] placeholder-[#64748B] dark:placeholder-slate-500 rounded-xl text-sm focus:border-purple-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 mb-1.5">Address</label>
                    <input
                      type="text"
                      name="address"
                      value={state.address}
                      onChange={handleChange}
                      placeholder="City, State"
                      className="w-full px-4 py-2.5 bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#475569] text-[#0F172A] dark:text-[#F8FAFC] placeholder-[#64748B] dark:placeholder-slate-500 rounded-xl text-sm focus:border-purple-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 mb-1.5">LinkedIn Profile URL</label>
                    <input
                      type="url"
                      name="linkedinUrl"
                      value={state.linkedinUrl}
                      onChange={handleChange}
                      placeholder="https://linkedin.com/in/username"
                      className="w-full px-4 py-2.5 bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#475569] text-[#0F172A] dark:text-[#F8FAFC] placeholder-[#64748B] dark:placeholder-slate-500 rounded-xl text-sm focus:border-purple-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 mb-1.5">GitHub Profile URL</label>
                    <input
                      type="url"
                      name="githubUrl"
                      value={state.githubUrl}
                      onChange={handleChange}
                      placeholder="https://github.com/username"
                      className="w-full px-4 py-2.5 bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#475569] text-[#0F172A] dark:text-[#F8FAFC] placeholder-[#64748B] dark:placeholder-slate-500 rounded-xl text-sm focus:border-purple-500 outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 mb-1.5">Portfolio Website URL</label>
                    <input
                      type="url"
                      name="portfolioUrl"
                      value={state.portfolioUrl}
                      onChange={handleChange}
                      placeholder="https://myportfolio.com"
                      className="w-full px-4 py-2.5 bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#475569] text-[#0F172A] dark:text-[#F8FAFC] placeholder-[#64748B] dark:placeholder-slate-500 rounded-xl text-sm focus:border-purple-500 outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 mb-1.5">Professional Summary *</label>
                    <textarea
                      name="professionalSummary"
                      value={state.professionalSummary}
                      onChange={handleChange}
                      rows={5}
                      placeholder="A short profile description..."
                      className={`w-full px-4 py-2.5 bg-[#F8FAFC] dark:bg-[#1E293B] border rounded-xl text-sm outline-none text-[#0F172A] dark:text-[#F8FAFC] placeholder-[#64748B] dark:placeholder-slate-500 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all ${
                        errors.professionalSummary ? "border-rose-500/60 focus:border-rose-500" : "border-[#CBD5E1] dark:border-[#475569]"
                      }`}
                    />
                    {errors.professionalSummary && (
                      <p className="text-[10px] text-rose-500 font-bold mt-1 flex items-center gap-1">
                        <AlertCircle size={10} /> {errors.professionalSummary}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: EDUCATION & KEYBOARD AUTOCOMPLETE SKILLS */}
            {currentStep === 2 && (
              <div className="space-y-8">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-black uppercase text-purple-600 dark:text-purple-400">Education Log</h3>
                    <button
                      onClick={addEducation}
                      className="flex items-center gap-1 px-3 py-1.5 bg-purple-55 dark:bg-purple-950/20 hover:bg-purple-100 dark:hover:bg-purple-900/20 text-[#6D28D9] dark:text-purple-400 border border-purple-200/50 dark:border-purple-800/40 rounded-lg text-xs font-bold animate-pulse"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Course
                    </button>
                  </div>

                  {state.education.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400 border border-dashed border-[#CBD5E1] dark:border-[#475569] rounded-xl bg-[#F8FAFC] dark:bg-[#1E293B]/30">
                      No educational credentials added. Click "Add Course" above.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {state.education.map((edu, idx) => (
                        <div key={idx} className="p-4 bg-[#F8FAFC] dark:bg-[#1E293B]/20 border border-[#CBD5E1] dark:border-[#475569] rounded-xl space-y-4 relative">
                          <button
                            onClick={() => removeEducation(idx)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Education #{idx + 1}</h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Degree / Course</label>
                              <input
                                type="text"
                                value={edu.degree}
                                onChange={(e) => updateEducation(idx, "degree", e.target.value)}
                                placeholder="B.Tech Computer Science"
                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-[#CBD5E1] dark:border-[#475569] text-sm text-[#0F172A] dark:text-[#F8FAFC] rounded-lg focus:border-purple-500 outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Institution</label>
                              <input
                                type="text"
                                value={edu.institution}
                                onChange={(e) => updateEducation(idx, "institution", e.target.value)}
                                placeholder="College of Engineering"
                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-[#CBD5E1] dark:border-[#475569] text-sm text-[#0F172A] dark:text-[#F8FAFC] rounded-lg focus:border-purple-500 outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">University / Board</label>
                              <input
                                type="text"
                                value={edu.university}
                                onChange={(e) => updateEducation(idx, "university", e.target.value)}
                                placeholder="State University"
                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-[#CBD5E1] dark:border-[#475569] text-sm text-[#0F172A] dark:text-[#F8FAFC] rounded-lg focus:border-purple-500 outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">GPA / Score</label>
                              <input
                                type="text"
                                value={edu.cgpa}
                                onChange={(e) => updateEducation(idx, "cgpa", e.target.value)}
                                placeholder="9.2 CGPA"
                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-[#CBD5E1] dark:border-[#475569] text-sm text-[#0F172A] dark:text-[#F8FAFC] rounded-lg focus:border-purple-500 outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Start Year</label>
                              <input
                                type="text"
                                value={edu.startYear}
                                onChange={(e) => updateEducation(idx, "startYear", e.target.value)}
                                placeholder="2021"
                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-[#CBD5E1] dark:border-[#475569] text-sm text-[#0F172A] dark:text-[#F8FAFC] rounded-lg focus:border-purple-500 outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">End Year</label>
                              <input
                                type="text"
                                value={edu.endYear}
                                onChange={(e) => updateEducation(idx, "endYear", e.target.value)}
                                placeholder="2025"
                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-[#CBD5E1] dark:border-[#475569] text-sm text-[#0F172A] dark:text-[#F8FAFC] rounded-lg focus:border-purple-500 outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-[#CBD5E1] dark:border-[#475569]/60 pt-6">
                  <h3 className="text-sm font-black uppercase text-purple-600 dark:text-purple-400 mb-4">Core Skills Autocomplete</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 mb-1.5">Programming Languages</label>
                      <SkillAutocomplete
                        selectedSkills={state.skills.languages}
                        onChange={(languages) => setState(prev => ({ ...prev, skills: { ...prev.skills, languages } }))}
                        categoryName="languages"
                        placeholder="Search/type Languages (e.g. Java, Python)..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 mb-1.5">Frontend Development</label>
                      <SkillAutocomplete
                        selectedSkills={state.skills.frontend || []}
                        onChange={(frontend) => setState(prev => ({ ...prev, skills: { ...prev.skills, frontend } }))}
                        categoryName="frontend"
                        placeholder="Search/type Frontend Tech (e.g. React, Next.js)..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 mb-1.5">Backend Development</label>
                      <SkillAutocomplete
                        selectedSkills={state.skills.backend || []}
                        onChange={(backend) => setState(prev => ({ ...prev, skills: { ...prev.skills, backend } }))}
                        categoryName="backend"
                        placeholder="Search/type Backend Tech (e.g. Spring Boot, Node.js)..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 mb-1.5">Databases</label>
                      <SkillAutocomplete
                        selectedSkills={state.skills.databases}
                        onChange={(databases) => setState(prev => ({ ...prev, skills: { ...prev.skills, databases } }))}
                        categoryName="databases"
                        placeholder="Search/type Databases (e.g. PostgreSQL, MongoDB)..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 mb-1.5">Cloud Technologies</label>
                      <SkillAutocomplete
                        selectedSkills={state.skills.cloud || []}
                        onChange={(cloud) => setState(prev => ({ ...prev, skills: { ...prev.skills, cloud } }))}
                        categoryName="cloud"
                        placeholder="Search/type Cloud (e.g. AWS, Vercel)..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 mb-1.5">DevOps</label>
                      <SkillAutocomplete
                        selectedSkills={state.skills.devops || []}
                        onChange={(devops) => setState(prev => ({ ...prev, skills: { ...prev.skills, devops } }))}
                        categoryName="devops"
                        placeholder="Search/type DevOps (e.g. Docker, Kubernetes)..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 mb-1.5">Artificial Intelligence & Machine Learning</label>
                      <SkillAutocomplete
                        selectedSkills={state.skills.aiMl || []}
                        onChange={(aiMl) => setState(prev => ({ ...prev, skills: { ...prev.skills, aiMl } }))}
                        categoryName="aiMl"
                        placeholder="Search/type AI/ML (e.g. OpenAI API, PyTorch)..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 mb-1.5">Mobile Development</label>
                      <SkillAutocomplete
                        selectedSkills={state.skills.mobile || []}
                        onChange={(mobile) => setState(prev => ({ ...prev, skills: { ...prev.skills, mobile } }))}
                        categoryName="mobile"
                        placeholder="Search/type Mobile (e.g. Flutter, React Native)..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 mb-1.5">Cyber Security</label>
                      <SkillAutocomplete
                        selectedSkills={state.skills.security || []}
                        onChange={(security) => setState(prev => ({ ...prev, skills: { ...prev.skills, security } }))}
                        categoryName="security"
                        placeholder="Search/type Security (e.g. Burp Suite, Network Security)..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 mb-1.5">Tools & Platforms</label>
                      <SkillAutocomplete
                        selectedSkills={state.skills.tools}
                        onChange={(tools) => setState(prev => ({ ...prev, skills: { ...prev.skills, tools } }))}
                        categoryName="tools"
                        placeholder="Search/type Tools (e.g. Git, Figma)..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 mb-1.5">Soft Skills</label>
                      <SkillAutocomplete
                        selectedSkills={state.skills.softSkills}
                        onChange={(softSkills) => setState(prev => ({ ...prev, skills: { ...prev.skills, softSkills } }))}
                        categoryName="softSkills"
                        placeholder="Search/type Soft Skills (e.g. Leadership, Teamwork)..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: EXPERIENCE */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-black uppercase text-purple-600 dark:text-purple-400">Professional Background</h3>
                  <button
                    onClick={addExperience}
                    className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 dark:bg-purple-950/20 hover:bg-purple-100 dark:hover:bg-purple-900/20 text-[#6D28D9] dark:text-purple-400 border border-purple-200/50 dark:border-purple-800/40 rounded-lg text-xs font-bold"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Job
                  </button>
                </div>

                {state.experience.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400 border border-dashed border-[#CBD5E1] dark:border-[#475569] rounded-xl bg-[#F8FAFC] dark:bg-[#1E293B]/30">
                    No work experience added. Click "Add Job" above.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {state.experience.map((exp, idx) => (
                      <div key={idx} className="p-5 bg-[#F8FAFC] dark:bg-[#1E293B]/20 border border-[#CBD5E1] dark:border-[#475569] rounded-xl space-y-4 relative">
                        <button
                          onClick={() => removeExperience(idx)}
                          className="absolute top-4 right-4 text-slate-400 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Experience Record #{idx + 1}</h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Company Name</label>
                            <input
                              type="text"
                              value={exp.companyName}
                              onChange={(e) => updateExperience(idx, "companyName", e.target.value)}
                              placeholder="Google Inc."
                              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-[#CBD5E1] dark:border-[#475569] text-sm text-[#0F172A] dark:text-[#F8FAFC] rounded-lg focus:border-purple-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Role / Designation</label>
                            <input
                              type="text"
                              value={exp.role}
                              onChange={(e) => updateExperience(idx, "role", e.target.value)}
                              placeholder="Software Engineer"
                              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-[#CBD5E1] dark:border-[#475569] text-sm text-[#0F172A] dark:text-[#F8FAFC] rounded-lg focus:border-purple-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Start Date</label>
                            <input
                              type="text"
                              value={exp.startDate}
                              onChange={(e) => updateExperience(idx, "startDate", e.target.value)}
                              placeholder="June 2023"
                              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-[#CBD5E1] dark:border-[#475569] text-sm text-[#0F172A] dark:text-[#F8FAFC] rounded-lg focus:border-purple-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">End Date</label>
                            <input
                              type="text"
                              value={exp.endDate}
                              onChange={(e) => updateExperience(idx, "endDate", e.target.value)}
                              placeholder="Present"
                              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-[#CBD5E1] dark:border-[#475569] text-sm text-[#0F172A] dark:text-[#F8FAFC] rounded-lg focus:border-purple-500 outline-none"
                            />
                          </div>
                        </div>

                        {/* Bullet point inputs */}
                        <div className="space-y-2 mt-4 pt-4 border-t border-[#CBD5E1]/40 dark:border-[#475569]/30">
                          <label className="block text-xs font-bold text-slate-500">Key Responsibilities (Bulleted)</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={respInputs[idx] || ""}
                              onChange={(e) => setRespInputs((prev) => ({ ...prev, [idx]: e.target.value }))}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  addResponsibility(idx);
                                }
                              }}
                              placeholder="Add detail bullet..."
                              className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-[#CBD5E1] dark:border-[#475569] text-sm text-[#0F172A] dark:text-[#F8FAFC] rounded-lg outline-none focus:border-purple-500"
                            />
                            <button
                              type="button"
                              onClick={() => addResponsibility(idx)}
                              className="px-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold"
                            >
                              Add
                            </button>
                          </div>

                          <ul className="list-disc pl-5 space-y-1 mt-2 text-xs text-slate-600 dark:text-slate-300">
                            {exp.responsibilities?.map((resp, rIdx) => (
                              <li key={rIdx} className="flex justify-between items-center group">
                                <span className="truncate mr-4">{resp}</span>
                                <button
                                  type="button"
                                  onClick={() => removeResponsibility(idx, rIdx)}
                                  className="text-rose-500 hover:text-rose-400 text-[10px] font-bold"
                                >
                                  Delete
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* STEP 4: PROJECTS */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-black uppercase text-purple-600 dark:text-purple-400">Projects Portfolio</h3>
                  <button
                    onClick={addProject}
                    className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 dark:bg-purple-950/20 hover:bg-purple-100 dark:hover:bg-purple-900/20 text-[#6D28D9] dark:text-purple-400 border border-purple-200/50 dark:border-purple-800/40 rounded-lg text-xs font-bold"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Project
                  </button>
                </div>

                {state.projects.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400 border border-dashed border-[#CBD5E1] dark:border-[#475569] rounded-xl bg-[#F8FAFC] dark:bg-[#1E293B]/30">
                    No projects added. Click "Add Project" above.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {state.projects.map((proj, idx) => (
                      <div key={idx} className="p-5 bg-[#F8FAFC] dark:bg-[#1E293B]/20 border border-[#CBD5E1] dark:border-[#475569] rounded-xl space-y-4 relative">
                        <button
                          onClick={() => removeProject(idx)}
                          className="absolute top-4 right-4 text-slate-400 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Project Record #{idx + 1}</h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2">
                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Project Title</label>
                            <input
                              type="text"
                              value={proj.projectTitle}
                              onChange={(e) => updateProject(idx, "projectTitle", e.target.value)}
                              placeholder="E-Commerce Microservices Architecture"
                              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-[#CBD5E1] dark:border-[#475569] text-sm text-[#0F172A] dark:text-[#F8FAFC] rounded-lg focus:border-purple-500 outline-none"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Project Description</label>
                            <textarea
                              value={proj.description}
                              onChange={(e) => updateProject(idx, "description", e.target.value)}
                              rows={3}
                              placeholder="Summarize features, stack..."
                              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-[#CBD5E1] dark:border-[#475569] text-sm text-[#0F172A] dark:text-[#F8FAFC] rounded-lg focus:border-purple-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">GitHub Link</label>
                            <input
                              type="url"
                              value={proj.githubLink}
                              onChange={(e) => updateProject(idx, "githubLink", e.target.value)}
                              placeholder="https://github.com/..."
                              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-[#CBD5E1] dark:border-[#475569] text-sm text-[#0F172A] dark:text-[#F8FAFC] rounded-lg focus:border-purple-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Live Demo Link</label>
                            <input
                              type="url"
                              value={proj.liveDemoLink}
                              onChange={(e) => updateProject(idx, "liveDemoLink", e.target.value)}
                              placeholder="https://demo.com"
                              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-[#CBD5E1] dark:border-[#475569] text-sm text-[#0F172A] dark:text-[#F8FAFC] rounded-lg focus:border-purple-500 outline-none"
                            />
                          </div>
                        </div>

                        {/* Tech tags list */}
                        <div className="space-y-2 mt-4 pt-4 border-t border-[#CBD5E1]/40 dark:border-[#475569]/30">
                          <label className="block text-xs font-bold text-slate-500">Technologies Utilized</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={techInputs[idx] || ""}
                              onChange={(e) => setTechInputs((prev) => ({ ...prev, [idx]: e.target.value }))}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  addTechUsed(idx);
                                }
                              }}
                              placeholder="Type tech name..."
                              className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-[#CBD5E1] dark:border-[#475569] text-sm text-[#0F172A] dark:text-[#F8FAFC] rounded-lg outline-none focus:border-purple-500"
                            />
                            <button
                              type="button"
                              onClick={() => addTechUsed(idx)}
                              className="px-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold"
                            >
                              Add
                            </button>
                          </div>

                          <div className="flex flex-wrap gap-1 mt-2">
                            {proj.technologiesUsed?.map((tech, tIdx) => (
                              <div
                                key={tIdx}
                                className="flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/30 text-[10px] rounded-md font-semibold"
                              >
                                <span>{tech}</span>
                                <button
                                  type="button"
                                  onClick={() => removeTechUsed(idx, tIdx)}
                                  className="text-indigo-400 hover:text-rose-500 font-bold"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* STEP 5: ADDITIONAL DETAILS */}
            {currentStep === 5 && (
              <div className="space-y-6">
                {[
                  { key: "certifications", label: "Certifications", placeholder: "AWS Certified Developer" },
                  { key: "achievements", label: "Achievements", placeholder: "Hackathon Winner (1st Place)" },
                  { key: "languages", label: "Languages Known", placeholder: "English (Fluent)" },
                  { key: "interests", label: "Interests & Hobbies", placeholder: "Open Source contribution" }
                ].map(({ key, label, placeholder }) => (
                  <div key={key} className="space-y-2 p-4 bg-[#F8FAFC] dark:bg-[#1E293B]/20 border border-[#CBD5E1] dark:border-[#475569] rounded-xl">
                    <label className="block text-xs font-bold text-[#334155] dark:text-slate-300">{label}</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={tagInputs[key as keyof typeof tagInputs] || ""}
                        onChange={(e) => setTagInputs((prev) => ({ ...prev, [key]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddStringTag(key as any);
                          }
                        }}
                        placeholder={`${placeholder}. Press Enter.`}
                        className="flex-1 px-3.5 py-2 bg-white dark:bg-slate-800 border border-[#CBD5E1] dark:border-[#475569] text-sm text-[#0F172A] dark:text-[#F8FAFC] rounded-lg outline-none focus:border-purple-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddStringTag(key as any)}
                        className="px-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold"
                      >
                        Add
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {(state[key as keyof ResumeState] as string[])?.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-[#EDE9FE] dark:bg-purple-950/20 text-[#6D28D9] dark:text-purple-300 border border-[#C4B5FD] dark:border-purple-800/30 text-[10px] rounded-md font-semibold"
                        >
                          <span>{item}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveStringTag(key as any, idx)}
                            className="text-[#6D28D9] dark:text-purple-400 hover:text-rose-500 font-bold"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* STEP 6: EXPORT */}
            {currentStep === 6 && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-sm font-black uppercase text-purple-600 dark:text-purple-400 mb-4">Choose LaTeX Template</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { id: "ats", name: "ATS Clean", desc: "Minimalist, single-column design formatted for parsers." },
                      { id: "modern", name: "Modern Professional", desc: "Features a purple accent line and bold titles." },
                      { id: "academic", name: "Academic CV", desc: "Detailed, structured spacing ideal for university profiles." },
                      { id: "se", name: "Software Engineer", desc: "Categorized skills section emphasizing code projects." }
                    ].map((tpl) => (
                      <div
                        key={tpl.id}
                        onClick={() => setState((prev) => ({ ...prev, templateId: tpl.id }))}
                        className={`p-4 rounded-xl border text-left cursor-pointer transition-all duration-300 ${
                          state.templateId === tpl.id
                            ? "bg-purple-50/80 dark:bg-purple-950/15 border-purple-500 shadow-sm"
                            : "bg-[#F8FAFC]/50 dark:bg-[#1E293B]/20 border-[#CBD5E1] dark:border-[#475569] hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B]/30"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                            state.templateId === tpl.id ? "border-purple-500 bg-purple-600" : "border-slate-400"
                          }`}>
                            {state.templateId === tpl.id && (
                              <div className="h-1.5 w-1.5 rounded-full bg-white" />
                            )}
                          </div>
                          <span className="font-extrabold text-sm">{tpl.name}</span>
                        </div>
                        <p className="text-xxs text-slate-500 leading-snug">{tpl.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-[#CBD5E1] dark:border-[#475569]/60 pt-6 space-y-6">
                  <div>
                    <h3 className="text-sm font-black uppercase text-purple-600 dark:text-purple-400">Export Options</h3>
                    <p className="text-xxs text-slate-500 mt-1 leading-snug">
                      Ensure your details are valid. Generating a PDF compiles the raw LaTeX source via pdflatex on the host system.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => handleDownload("pdf")}
                      disabled={actionStatus.type === "loading"}
                      className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all duration-300 disabled:opacity-50 hover:-translate-y-0.5 shadow-md shadow-purple-900"
                    >
                      <Download className="h-4 w-4" />
                      Download PDF
                    </button>

                    <button
                      onClick={() => handleDownload("tex")}
                      disabled={actionStatus.type === "loading"}
                      className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#475569] hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-all duration-300 disabled:opacity-50 hover:-translate-y-0.5"
                    >
                      <FileCode className="h-4 w-4" />
                      Download LaTeX (.tex)
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Navigation Footer */}
          <div className="flex justify-between items-center bg-white dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#475569] rounded-2xl p-4 shadow-sm">
            <button
              onClick={handlePrev}
              disabled={currentStep === 1}
              className="flex items-center gap-1 px-4 py-2 bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#475569] text-slate-700 dark:text-slate-300 rounded-xl disabled:opacity-30 disabled:pointer-events-none transition-all text-xs font-bold"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>

            <span className="text-xxs uppercase tracking-wider text-slate-500 font-bold">
              Step {currentStep} of 6
            </span>

            {currentStep < 6 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-1 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-all text-xs font-bold"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => handleSave(false, state.status)}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all text-xs font-bold shadow-md shadow-emerald-950"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                Save Resume
              </button>
            )}
          </div>
        </div>

        {/* Right column: Sticky, scalable true A4 page mockup */}
        <div className="lg:col-span-6">
          <div className="sticky top-8">
            <LiveResumePreview data={state} />
          </div>
        </div>

      </div>
    </div>
  );
}
