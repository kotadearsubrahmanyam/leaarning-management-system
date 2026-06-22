"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  Plus, 
  X, 
  Trash2, 
  Edit2,
  ArrowUpCircle, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  UserCheck, 
  ShieldAlert, 
  ArrowLeft, 
  Download, 
  Loader2 
} from "lucide-react";
import { AnimatedButton } from "@/components/ui/animated-button";
import { AnimatedInput } from "@/components/ui/animated-input";
import * as XLSX from "xlsx";

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"accounts" | "bulk">("accounts");
  
  // Manual User form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "STUDENT",
    departmentId: "",
    semester: "1",
    rollNumber: "",
    residentStatus: "DAYSCHOLAR_NORMAL",
    isFeeReimbursed: false,
  });
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  // Bulk Import state
  const [importRole, setImportRole] = useState<"STUDENT" | "TEACHER">("STUDENT");
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parseProgress, setParseProgress] = useState(0);
  const [parsedData, setParsedData] = useState<any[] | null>(null);
  const [validationData, setValidationData] = useState<any | null>(null);
  const [isProcessingImport, setIsProcessingImport] = useState(false);
  const [importResult, setImportResult] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Queries
  const { data: usersData, isLoading: isUsersLoading } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  const { data: deptsData } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await fetch("/api/departments");
      if (!res.ok) throw new Error("Failed to fetch departments");
      return res.json();
    },
  });
  const departments = deptsData?.data?.departments || [];

  const { data: historyData, isLoading: isHistoryLoading, refetch: refetchHistory } = useQuery({
    queryKey: ["importHistory"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users/import/history");
      if (!res.ok) throw new Error("Failed to fetch history");
      return res.json();
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to create user");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      setIsModalOpen(false);
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "STUDENT",
        departmentId: "",
        semester: "1",
        rollNumber: "",
        residentStatus: "DAYSCHOLAR_NORMAL",
        isFeeReimbursed: false,
      });
    },
    onError: (err: any) => {
      alert(err.message || "An error occurred");
    }
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, id: editingUser.id }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to update user");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      setIsModalOpen(false);
      setEditingUser(null);
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "STUDENT",
        departmentId: "",
        semester: "1",
        rollNumber: "",
        residentStatus: "DAYSCHOLAR_NORMAL",
        isFeeReimbursed: false,
      });
    },
    onError: (err: any) => {
      alert(err.message || "An error occurred");
    }
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

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setFormData({
      name: user.name || "",
      email: user.email || "",
      password: "",
      role: user.role || "STUDENT",
      departmentId: user.departmentId || "",
      semester: user.semester ? String(user.semester) : "1",
      rollNumber: user.rollNumber || "",
      residentStatus: user.residentStatus || "DAYSCHOLAR_NORMAL",
      isFeeReimbursed: !!user.isFeeReimbursed,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.role) return;
    if (!editingUser && !formData.password) return;
    
    if (editingUser) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  // Bulk Import Logic
  const handleFile = (file: File) => {
    setSelectedFile(file);
    setParseProgress(10);
    setErrorMessage(null);
    setImportResult(null);
    setParsedData(null);
    setValidationData(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        setParseProgress(40);
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        setParseProgress(70);
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        
        if (json.length === 0) {
          throw new Error("The uploaded spreadsheet is empty.");
        }
        
        setParsedData(json);
        setParseProgress(100);
        
        // Auto trigger validation
        validateData(json);
      } catch (err: any) {
        console.error(err);
        setErrorMessage(err.message || "Failed to parse spreadsheet. Ensure it is a valid Excel or CSV file.");
        setSelectedFile(null);
        setParseProgress(0);
      }
    };
    
    reader.onerror = () => {
      setErrorMessage("Error reading file.");
      setSelectedFile(null);
      setParseProgress(0);
    };

    reader.readAsBinaryString(file);
  };

  const validateData = async (rows: any[]) => {
    try {
      const res = await fetch("/api/admin/users/import/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleType: importRole, rows }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Validation failed.");
      }
      setValidationData(data.data);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to validate records with server.");
    }
  };

  const handleContinueImport = async () => {
    if (!validationData || validationData.summary.valid === 0) return;
    setIsProcessingImport(true);
    setErrorMessage(null);
    
    try {
      const validRecords = validationData.records.filter((r: any) => r.status === "valid");
      
      const res = await fetch("/api/admin/users/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleType: importRole, records: validRecords }),
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Import failed.");
      }
      
      setImportResult(data.data);
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      refetchHistory();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to complete bulk import.");
    } finally {
      setIsProcessingImport(false);
    }
  };

  const cancelUpload = () => {
    setSelectedFile(null);
    setParseProgress(0);
    setParsedData(null);
    setValidationData(null);
    setImportResult(null);
    setErrorMessage(null);
  };

  // Client-side template generator
  const downloadTemplate = (role: "STUDENT" | "TEACHER") => {
    let headers: string[] = [];
    let sampleData: any[] = [];
    
    if (role === "STUDENT") {
      headers = ["Name", "Department", "Semester"];
      sampleData = [
        {
          "Name": "John Doe",
          "Department": "CSE",
          "Semester": 3
        },
        {
          "Name": "Priya",
          "Department": "CSE",
          "Semester": 3
        }
      ];
    } else {
      headers = ["Name", "Faculty ID", "Email", "Department", "Subject"];
      sampleData = [
        {
          "Name": "Ravi Kumar",
          "Faculty ID": "T101",
          "Email": "ravi@gmail.com",
          "Department": "CSE",
          "Subject": "DBMS"
        }
      ];
    }
    
    const worksheet = XLSX.utils.json_to_sheet(sampleData, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `${role}_Template`);
    XLSX.writeFile(workbook, `${role.toLowerCase()}_template.xlsx`);
  };

  const downloadCredentials = (credentials: any[]) => {
    const data = credentials.map(c => ({
      "Roll Number": c.rollNumber,
      "Username": c.username,
      "Password": "123456"
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Credentials");
    XLSX.writeFile(workbook, "onboarded_credentials.xlsx");
  };

  const downloadErrorReport = (records: any[]) => {
    const data = records
      .filter(r => r.status === "invalid")
      .map(r => ({
        "Row Number": r.rowNumber,
        "Name": r.name,
        "Email": r.email,
        "Identifier": r.rollNumber,
        "Department": r.department,
        "Errors": r.errors.join(", ")
      }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Validation_Errors");
    XLSX.writeFile(workbook, "validation_errors_report.xlsx");
  };

  const usersList = usersData?.data?.users || [];
  const historyList = historyData?.data?.history || [];
  const stats = historyData?.data?.stats || {
    totalStudentsImported: 0,
    totalTeachersImported: 0,
    latestImportDate: null,
    totalImportsCount: 0,
  };

  return (
    <div className="max-w-6xl mx-auto pb-12 relative z-10">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-3">
            <Users size={32} /> User Management
          </h1>
          <p className="text-slate-600 font-semibold text-sm">Create, onboard, view, and remove student and teacher accounts.</p>
        </motion.div>
        
        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200 w-full md:w-auto">
          <button
            onClick={() => setActiveTab("accounts")}
            className={`flex-1 md:flex-none px-5 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === "accounts"
                ? "bg-purple-600 text-white shadow shadow-purple-600/10"
                : "text-slate-600 hover:text-slate-800 hover:bg-slate-200/50"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Users size={14} /> User Accounts
            </div>
          </button>
          <button
            onClick={() => setActiveTab("bulk")}
            className={`flex-1 md:flex-none px-5 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === "bulk"
                ? "bg-purple-600 text-white shadow shadow-purple-600/10"
                : "text-slate-600 hover:text-slate-800 hover:bg-slate-200/50"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <FileSpreadsheet size={14} /> Bulk Onboarding
            </div>
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "accounts" ? (
          // ==========================================
          // TAB 1: ACCOUNTS LEDGER VIEW
          // ==========================================
          <motion.div
            key="accounts"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center bg-white/5 p-4 border border-white/10 rounded-2xl">
              <span className="text-sm font-semibold text-foreground/80">Active Accounts: {usersList.length}</span>
              <div className="flex gap-4">
                {selectedStudents.length > 0 && (
                  <AnimatedButton 
                    onClick={() => promoteMutation.mutate(selectedStudents)} 
                    isLoading={promoteMutation.isPending} 
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <ArrowUpCircle size={18} className="mr-2 inline" /> Promote Selected ({selectedStudents.length})
                  </AnimatedButton>
                )}
                <AnimatedButton onClick={() => {
                  setEditingUser(null);
                  setFormData({
                    name: "",
                    email: "",
                    password: "",
                    role: "STUDENT",
                    departmentId: "",
                    semester: "1",
                    rollNumber: "",
                    residentStatus: "DAYSCHOLAR_NORMAL",
                    isFeeReimbursed: false,
                  });
                  setIsModalOpen(true);
                }}>
                  <Plus size={18} className="mr-2 inline" /> Add User
                </AnimatedButton>
              </div>
            </div>

            <div className="glass rounded-3xl border border-white/10 overflow-hidden shadow-xl">
              <div className="grid grid-cols-12 bg-white/5 p-4 font-semibold text-foreground/80 border-b border-white/10 text-sm">
                <div className="col-span-1 text-center">Select</div>
                <div className="col-span-4">Name & Email</div>
                <div className="col-span-3">Role / Dept</div>
                <div className="col-span-2">Joined Date</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>
              
              {isUsersLoading ? (
                <div className="p-4 space-y-4">
                  {[1, 2, 3, 4].map(i => <div key={i} className="h-12 bg-white/5 animate-pulse rounded-xl" />)}
                </div>
              ) : usersList.length === 0 ? (
                <div className="p-12 text-center text-foreground/50">No users found. Create manually or use Excel import.</div>
              ) : (
                <div className="divide-y divide-white/5 max-h-[60vh] overflow-y-auto">
                  {usersList.map((user: any, i: number) => (
                    <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      transition={{ delay: i * 0.02 }}
                      key={user.id} 
                      className="grid grid-cols-12 p-4 items-center hover:bg-white/5 transition-colors text-sm"
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
                        {user.role === 'STUDENT' && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            <span className="text-[9px] px-1.5 py-0.5 bg-purple-500/10 text-purple-400 rounded border border-purple-500/20 font-bold">
                              {user.residentStatus === 'DAYSCHOLAR_NORMAL' ? 'Day Scholar' :
                               user.residentStatus === 'DAYSCHOLAR_BUS' ? 'Day Scholar (Bus)' : 'Hosteler'}
                            </span>
                            {user.isFeeReimbursed && (
                              <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20 font-bold">
                                Scholar
                              </span>
                            )}
                          </div>
                        )}
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
                          onClick={() => handleEditUser(user)}
                          className="p-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors mr-2 inline-flex items-center justify-center"
                          title="Edit User"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => {
                            if (window.confirm("Are you sure you want to delete this user?")) {
                              deleteMutation.mutate(user.id);
                            }
                          }}
                          disabled={deleteMutation.isPending && deleteMutation.variables === user.id}
                          className="p-2 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-lg transition-colors disabled:opacity-50 inline-flex items-center justify-center"
                          title="Delete User"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          // ==========================================
          // TAB 2: BULK SPREADSHEET IMPORT VIEW
          // ==========================================
          <motion.div
            key="bulk"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-8"
          >
            
            {/* Visual Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-white border-t-4 border-t-purple-600 border-x border-b border-slate-200 p-6 rounded-2xl flex flex-col justify-between shadow-md hover:shadow-lg transition-all duration-300">
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-2">Total Students Imported</span>
                <span className="text-3xl font-black text-purple-700">{stats.totalStudentsImported}</span>
                <span className="text-[10px] text-slate-600 font-semibold mt-2">Active student imports</span>
              </div>
              <div className="bg-white border-t-4 border-t-pink-500 border-x border-b border-slate-200 p-6 rounded-2xl flex flex-col justify-between shadow-md hover:shadow-lg transition-all duration-300">
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-2">Total Teachers Imported</span>
                <span className="text-3xl font-black text-pink-600">{stats.totalTeachersImported}</span>
                <span className="text-[10px] text-slate-600 font-semibold mt-2">Active teaching faculty imports</span>
              </div>
              <div className="bg-white border-t-4 border-t-indigo-500 border-x border-b border-slate-200 p-6 rounded-2xl flex flex-col justify-between shadow-md hover:shadow-lg transition-all duration-300">
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-2">Latest Import Date</span>
                <span className="text-base font-bold text-indigo-600 mt-2">
                  {stats.latestImportDate 
                    ? new Date(stats.latestImportDate).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric"
                      })
                    : "Never"}
                </span>
                <span className="text-[10px] text-slate-600 font-semibold mt-2">ERP ledger sync date</span>
              </div>
              <div className="bg-white border-t-4 border-t-violet-500 border-x border-b border-slate-200 p-6 rounded-2xl flex flex-col justify-between shadow-md hover:shadow-lg transition-all duration-300">
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-2">Recent Batches</span>
                <span className="text-3xl font-black text-violet-700">{stats.totalImportsCount}</span>
                <span className="text-[10px] text-slate-600 font-semibold mt-2">Successfully loaded templates</span>
              </div>
            </div>

            {/* Config & Drop Zone / Preview Card */}
            <div className="bg-white border border-slate-200/80 p-8 rounded-3xl shadow-xl relative">
              
              {!selectedFile && !importResult && (
                <>
                  {/* Select Role & Downloader Header */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                    <div>
                      <h3 className="text-lg font-bold text-foreground">Bulk Spreadsheet Onboarding</h3>
                      <p className="text-slate-600 font-medium text-xs mt-1">Select the user type, download template and drop file below.</p>
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                      <div className="flex bg-slate-100 border border-slate-200 p-1 rounded-xl w-full md:w-auto">
                        <button
                          onClick={() => setImportRole("STUDENT")}
                          className={`flex-1 md:flex-none px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                            importRole === "STUDENT" ? "bg-purple-600 text-white shadow" : "text-slate-600 hover:text-slate-800"
                          }`}
                        >
                          STUDENTS
                        </button>
                        <button
                          onClick={() => setImportRole("TEACHER")}
                          className={`flex-1 md:flex-none px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                            importRole === "TEACHER" ? "bg-purple-600 text-white shadow" : "text-slate-600 hover:text-slate-800"
                          }`}
                        >
                          TEACHERS
                        </button>
                      </div>
                      <button
                        onClick={() => downloadTemplate(importRole)}
                        className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-sm text-xs px-3 py-2.5 rounded-xl transition-colors flex items-center justify-center whitespace-nowrap font-bold"
                      >
                        <Download size={14} className="mr-1.5" /> Template
                      </button>
                    </div>
                  </div>

                  {/* Drag and Drop Zone */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleFile(file);
                    }}
                    onClick={() => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = ".xlsx,.xls,.csv";
                      input.onchange = (e: any) => {
                        const file = e.target.files?.[0];
                        if (file) handleFile(file);
                      };
                      input.click();
                    }}
                    className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all cursor-pointer ${
                      dragOver
                        ? "border-purple-500 bg-purple-50 scale-[0.99] shadow-inner"
                        : "border-slate-200 bg-slate-50/50 hover:border-purple-400 hover:bg-purple-50/20"
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="p-4 bg-purple-50 rounded-2xl text-purple-600 border border-purple-100 animate-pulse">
                        <Upload size={36} />
                      </div>
                      <div>
                        <p className="text-base font-extrabold text-slate-800">Drag & drop your Excel/CSV here</p>
                        <p className="text-slate-500 text-xs mt-1 font-semibold">or click to browse from local computer</p>
                      </div>
                      <span className="text-[10px] text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 font-bold">
                        Supports .xlsx, .xls, .csv up to 5000 rows
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* Progress and File Details */}
              {selectedFile && !validationData && !errorMessage && (
                <div className="space-y-6 py-6 text-center">
                  <div className="p-4 bg-white/5 rounded-2xl inline-block text-primary">
                    <FileSpreadsheet size={36} />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground">{selectedFile.name}</h4>
                    <p className="text-xs text-foreground/50 mt-1">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <div className="w-full max-w-sm mx-auto bg-white/5 h-2 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: "0%" }}
                      animate={{ width: `${parseProgress}%` }}
                      className="bg-primary h-full"
                    />
                  </div>
                  <p className="text-xs text-foreground/60">Parsing and validating records...</p>
                </div>
              )}

              {/* Error Alert Box */}
              {errorMessage && (
                <div className="space-y-6 text-center py-6">
                  <div className="p-4 bg-destructive/10 rounded-full inline-block text-destructive">
                    <AlertCircle size={36} />
                  </div>
                  <div>
                    <h4 className="font-bold text-destructive">Error Loading File</h4>
                    <p className="text-xs text-foreground/60 max-w-md mx-auto mt-2">{errorMessage}</p>
                  </div>
                  <AnimatedButton onClick={cancelUpload} className="bg-destructive hover:bg-destructive/80 text-white text-xs px-4">
                    <ArrowLeft size={14} className="mr-1.5 inline" /> Back
                  </AnimatedButton>
                </div>
              )}

              {/* Step 3: PREVIEW & DB VALIDATION DISPLAY */}
              {selectedFile && validationData && !importResult && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  
                  {/* File Title Info */}
                  <div className="flex justify-between items-center border-b border-white/5 pb-4">
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="text-primary" size={24} />
                      <div>
                        <h4 className="font-bold text-foreground text-sm">{selectedFile.name}</h4>
                        <p className="text-[10px] text-foreground/50">Ready to onboarding as {importRole}s</p>
                      </div>
                    </div>
                    <button onClick={cancelUpload} className="text-xs font-bold text-destructive hover:underline flex items-center gap-1">
                      <Trash2 size={12} /> Clear File
                    </button>
                  </div>

                  {/* Validate Stats Row */}
                  <div className="grid grid-cols-3 gap-4 bg-white/5 p-4 border border-white/10 rounded-2xl text-center">
                    <div>
                      <p className="text-[10px] text-foreground/50 font-bold uppercase">Total Rows</p>
                      <p className="text-xl font-black text-foreground">{validationData.summary.total}</p>
                    </div>
                    <div className="border-x border-white/10">
                      <p className="text-[10px] text-foreground/50 font-bold uppercase">Valid Rows</p>
                      <p className="text-xl font-black text-green-500">{validationData.summary.valid}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-foreground/50 font-bold uppercase">Invalid Rows</p>
                      <p className="text-xl font-black text-destructive">{validationData.summary.invalid}</p>
                    </div>
                  </div>

                  {/* Errors Ledger Section */}
                  {validationData.summary.invalid > 0 && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 space-y-2">
                      <h5 className="font-bold text-destructive flex items-center gap-2 text-xs">
                        <ShieldAlert size={14} /> Validation Diagnostics ({validationData.summary.invalid} Rows Failed)
                      </h5>
                      <div className="max-h-32 overflow-y-auto divide-y divide-destructive/10 text-xs pr-2 space-y-1 pt-1 font-mono">
                        {validationData.records
                          .filter((r: any) => r.status === "invalid")
                          .map((r: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-start py-1.5 text-[11px]">
                              <span className="font-bold text-destructive/80 mr-4">Row {r.rowNumber}:</span>
                              <span className="flex-1 text-foreground/80">{r.errors.join(" | ")}</span>
                              <span className="text-foreground/40 text-[10px]">({r.name || "N/A"})</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Preview Table */}
                  <div className="border border-white/10 rounded-2xl overflow-hidden bg-black/20">
                    <div className="p-3 bg-white/5 border-b border-white/10 flex justify-between items-center">
                      <span className="text-xs font-bold text-foreground">Import Preview (Showing first 50 rows)</span>
                      <span className="text-[10px] text-foreground/40">Only valid records (green) will be imported</span>
                    </div>
                    <div className="overflow-x-auto max-h-[30vh]">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-white/5 text-foreground/60 border-b border-white/10 text-[10px] uppercase tracking-wider">
                            <th className="p-3 pl-4">Row</th>
                            <th className="p-3">Name</th>
                            <th className="p-3">Email</th>
                            <th className="p-3">{importRole === "STUDENT" ? "Roll Number" : "Faculty ID"}</th>
                            <th className="p-3">Department</th>
                            <th className="p-3">{importRole === "STUDENT" ? "Semester" : "Subject"}</th>
                            <th className="p-3 text-right pr-4">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-[11px]">
                          {validationData.records.slice(0, 50).map((r: any, idx: number) => (
                            <tr key={idx} className="hover:bg-white/5 transition-colors">
                              <td className="p-3 pl-4 text-foreground/40 font-mono">{r.rowNumber}</td>
                              <td className="p-3 font-semibold text-foreground">{r.name}</td>
                              <td className="p-3 text-foreground/60">{r.email}</td>
                              <td className="p-3 font-mono text-primary font-bold">{r.rollNumber}</td>
                              <td className="p-3 text-foreground/60">{r.department}</td>
                              <td className="p-3 text-foreground/60">
                                {importRole === "STUDENT" ? `Sem ${r.semester}` : r.subject}
                              </td>
                              <td className="p-3 text-right pr-4">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                  r.status === "valid" ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
                                }`}>
                                  {r.status === "valid" ? "Valid" : "Invalid"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Actions Drawer */}
                  <div className="flex justify-end gap-4 pt-4 border-t border-white/5">
                    <button
                      onClick={cancelUpload}
                      className="px-6 py-2.5 bg-white/5 border border-white/10 text-foreground hover:bg-white/10 rounded-xl transition-colors text-xs font-semibold"
                    >
                      Cancel Import
                    </button>
                    <AnimatedButton
                      onClick={handleContinueImport}
                      disabled={validationData.summary.valid === 0 || isProcessingImport}
                      isLoading={isProcessingImport}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 text-xs"
                    >
                      Continue Import ({validationData.summary.valid} Users)
                    </AnimatedButton>
                  </div>
                </motion.div>
              )}

              {/* Step 4: POST IMPORT SUCCESS DISPLAY */}
              {importResult && (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="py-6 text-center flex flex-col items-center justify-center space-y-6"
                >
                  <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center shadow-lg border border-green-500/30 animate-bounce">
                    <CheckCircle2 size={36} />
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Bulk Import Completed!</h3>
                    <p className="text-foreground/60 text-xs mt-1.5">
                      Accounts have been registered. Download generated logins below.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 max-w-xs w-full bg-white/5 p-4 rounded-2xl border border-white/10">
                    <div className="text-center">
                      <p className="text-2xl font-black text-green-500">{importResult.createdCount}</p>
                      <p className="text-[10px] text-foreground/50 font-bold uppercase mt-0.5">Created Successfully</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-black text-destructive">{importResult.failedCount}</p>
                      <p className="text-[10px] text-foreground/50 font-bold uppercase mt-0.5">Skipped / Failed</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 w-full justify-center max-w-md pt-2">
                    <button
                      onClick={() => downloadCredentials(importResult.credentials)}
                      className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-xl font-bold text-xs transition-colors flex items-center justify-center flex-1 gap-2"
                    >
                      <Download size={14} /> Download Credentials
                    </button>
                    {validationData && validationData.summary.invalid > 0 && (
                      <button
                        onClick={() => downloadErrorReport(validationData.records)}
                        className="bg-white/5 border border-white/10 text-foreground hover:bg-white/10 px-5 py-3 rounded-xl font-bold text-xs transition-colors flex items-center justify-center flex-1 gap-2"
                      >
                        <Download size={14} /> Download Error Report
                      </button>
                    )}
                  </div>

                  <button
                    onClick={cancelUpload}
                    className="text-primary hover:text-primary-hover font-bold text-xs underline pt-2"
                  >
                    Upload Another File
                  </button>
                </motion.div>
              )}

            </div>

            {/* Import History Ledger */}
            <div className="glass p-8 rounded-3xl border border-white/10 shadow-2xl">
              <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                <Calendar size={18} /> Import Action History
              </h3>

              {isHistoryLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <div key={i} className="h-12 bg-white/5 animate-pulse rounded-xl" />)}
                </div>
              ) : historyList.length === 0 ? (
                <div className="text-center p-8 text-foreground/40 text-xs">No previous imports found in database ledger.</div>
              ) : (
                <div className="border border-white/10 rounded-2xl overflow-hidden bg-black/10">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-white/5 text-foreground/60 border-b border-white/10 font-bold uppercase tracking-wider text-[10px]">
                          <th className="p-4 pl-6">Upload Date</th>
                          <th className="p-4">Uploaded By</th>
                          <th className="p-4">Role</th>
                          <th className="p-4">Imported Count</th>
                          <th className="p-4">Failed Records</th>
                          <th className="p-4 text-right pr-6">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {historyList.map((h: any) => (
                          <tr key={h.id} className="hover:bg-white/5 transition-colors">
                            <td className="p-4 pl-6 text-foreground/80 font-mono">
                              {new Date(h.uploadDate).toLocaleDateString("en-IN", {
                                day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                              })}
                            </td>
                            <td className="p-4 font-semibold text-foreground">{h.uploadedBy}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                h.roleType === "STUDENT" ? "bg-green-500/10 text-green-400" : "bg-pink-500/10 text-pink-400"
                              }`}>
                                {h.roleType}
                              </span>
                            </td>
                            <td className="p-4 font-bold text-foreground">{h.createdCount} Users</td>
                            <td className="p-4 text-foreground/50">{h.failedCount} Users</td>
                            <td className="p-4 text-right pr-6">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                h.status === "COMPLETED" ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
                              }`}>
                                {h.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Creation Modal */}
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
                <h2 className="text-2xl font-bold mb-6 text-primary">
                  {editingUser ? "Edit User Account" : "Create New User"}
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
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
                    label={editingUser ? "New Password (leave blank to keep current)" : "Password"}
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required={!editingUser}
                  />
                  
                  <div>
                    <label className="block text-xs font-semibold text-foreground/70 mb-1 ml-1">Role</label>
                    <select 
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:border-primary transition-colors appearance-none text-sm"
                      disabled={!!editingUser}
                    >
                      <option value="STUDENT">Student</option>
                      <option value="TEACHER">Teacher</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>

                  {formData.role === "STUDENT" && (
                    <div className="grid grid-cols-2 gap-4">
                      <AnimatedInput
                        label="Roll Number"
                        type="text"
                        value={formData.rollNumber}
                        onChange={(e) => setFormData({...formData, rollNumber: e.target.value})}
                      />
                      <div>
                        <label className="block text-xs font-semibold text-foreground/70 mb-1 ml-1">Semester</label>
                        <select
                          value={formData.semester}
                          onChange={(e) => setFormData({...formData, semester: e.target.value})}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:border-primary transition-colors appearance-none text-sm"
                        >
                          {Array.from({ length: 8 }, (_, i) => i + 1).map(sem => (
                            <option key={sem} value={String(sem)}>Semester {sem}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {(formData.role === "STUDENT" || formData.role === "TEACHER") && (
                    <div>
                      <label className="block text-xs font-semibold text-foreground/70 mb-1 ml-1">Department</label>
                      <select
                        value={formData.departmentId}
                        onChange={(e) => setFormData({...formData, departmentId: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:border-primary transition-colors appearance-none text-sm"
                      >
                        <option value="">Select Department</option>
                        {departments.map((dept: any) => (
                          <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {formData.role === "STUDENT" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-foreground/70 mb-1 ml-1">Resident Status</label>
                        <select
                          value={formData.residentStatus}
                          onChange={(e) => setFormData({...formData, residentStatus: e.target.value})}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:border-primary transition-colors appearance-none text-sm"
                        >
                          <option value="DAYSCHOLAR_NORMAL">Day Scholar (Normal)</option>
                          <option value="DAYSCHOLAR_BUS">Day Scholar (With Bus)</option>
                          <option value="HOSTELER">Hosteler</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-foreground/70 mb-1 ml-1">Fee Reimbursement</label>
                        <select
                          value={formData.isFeeReimbursed ? "true" : "false"}
                          onChange={(e) => setFormData({...formData, isFeeReimbursed: e.target.value === "true"})}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:border-primary transition-colors appearance-none text-sm"
                        >
                          <option value="false">No Scholarship</option>
                          <option value="true">Reimbursement (Yes)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 flex justify-end">
                    <AnimatedButton 
                      type="submit" 
                      isLoading={createMutation.isPending || updateMutation.isPending} 
                      className="w-full"
                    >
                      {editingUser 
                        ? (updateMutation.isPending ? "Saving..." : "Save Changes") 
                        : (createMutation.isPending ? "Creating..." : "Create Account")}
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
