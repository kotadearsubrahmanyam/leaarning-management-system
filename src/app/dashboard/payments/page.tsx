"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  Plus,
  CheckCircle,
  Clock,
  Download,
  DollarSign,
  AlertTriangle,
  Calendar,
  FileText,
  Printer,
  ChevronRight,
  User,
  Sliders,
  Trash2,
  Edit2,
  X,
  Search,
  Check,
  TrendingUp,
  RefreshCw
} from "lucide-react";
import { AnimatedButton } from "@/components/ui/animated-button";
import { AnalyticsCard } from "@/components/ui/analytics-card";

const FEE_TYPE_LABELS: Record<string, string> = {
  TUITION: "Tuition Fee",
  BUS: "Bus/Transport Fee",
  HOSTEL: "Hostel Fee",
  EXAM: "Examination Fee",
  LAB: "Laboratory Fee",
  LIBRARY: "Library Fee",
  PLACEMENT: "Training & Placement Fee",
  MATERIAL: "Course Material Fee",
  CERTIFICATION: "Certification Fee",
  MISC: "Miscellaneous Charges",
};

const FEE_CATEGORIES = [
  { value: "TUITION", label: "Tuition Fee" },
  { value: "BUS", label: "Bus/Transport Fee" },
  { value: "HOSTEL", label: "Hostel Fee" },
  { value: "EXAM", label: "Examination Fee" },
  { value: "LAB", label: "Laboratory Fee" },
  { value: "LIBRARY", label: "Library Fee" },
  { value: "PLACEMENT", label: "Training & Placement Fee" },
  { value: "MATERIAL", label: "Course Material Fee" },
  { value: "CERTIFICATION", label: "Certification Fee" },
  { value: "MISC", label: "Miscellaneous Charges" },
];

export default function PaymentsPage() {
  const queryClient = useQueryClient();
  
  // Student View State
  const [selectedSemester, setSelectedSemester] = useState<number>(1);
  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState<any | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedFeeToPay, setSelectedFeeToPay] = useState<any | null>(null);
  const [payAmountInput, setPayAmountInput] = useState("");

  // Admin View State
  const [adminTab, setAdminTab] = useState<"verify" | "manage">("verify");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [adminSelectedSemester, setAdminSelectedSemester] = useState<number>(1);
  const [studentSearchTerm, setStudentSearchTerm] = useState("");
  
  // Admin Create/Edit Fee Modal
  const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
  const [editingFee, setEditingFee] = useState<any | null>(null);
  const [feeFormData, setFeeFormData] = useState({
    feeType: "TUITION",
    amount: "",
    dueDate: "",
    lateFee: "0",
  });

  // Fetch logged in user
  const { data: authData } = useQuery({
    queryKey: ["authMe"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) throw new Error("Unauthorized");
      return res.json();
    },
  });
  const role = authData?.data?.user?.role;
  const currentStudentName = authData?.data?.user?.name || "Student";
  const currentStudentRoll = authData?.data?.user?.rollNumber || "N/A";

  // Fetch payments list based on role
  const { data: paymentsData, isLoading: isPaymentsLoading } = useQuery({
    queryKey: ["payments", role],
    queryFn: async () => {
      const endpoint = role === "ADMIN" ? "/api/admin/payments" : "/api/student/payments";
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error("Failed to fetch payments");
      return res.json();
    },
    enabled: !!role,
  });

  // Fetch students for admin lookup
  const { data: usersData } = useQuery({
    queryKey: ["adminUsersPayments"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
    enabled: role === "ADMIN",
  });

  // Reset admin selected semester if it exceeds the selected student's total department semesters
  useEffect(() => {
    if (selectedStudentId && usersData?.data?.users) {
      const selectedStudent = usersData.data.users.find((u: any) => u.id === selectedStudentId);
      const maxSemesters = selectedStudent?.totalSemesters || 8;
      if (adminSelectedSemester > maxSemesters) {
        setAdminSelectedSemester(1);
      }
    }
  }, [selectedStudentId, usersData, adminSelectedSemester]);

  // Fetch fee structures for the selected student & semester (Admins only)
  const { data: adminFeesData, isLoading: isAdminFeesLoading } = useQuery({
    queryKey: ["adminFees", selectedStudentId, adminSelectedSemester],
    queryFn: async () => {
      const res = await fetch(`/api/admin/fees?userId=${selectedStudentId}&semester=${adminSelectedSemester}`);
      if (!res.ok) throw new Error("Failed to fetch admin fees");
      return res.json();
    },
    enabled: role === "ADMIN" && !!selectedStudentId,
  });

  const studentsList = (usersData?.data?.users || []).filter((u: any) => u.role === "STUDENT");
  const filteredStudents = studentsList.filter((s: any) => 
    s.name.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
    (s.rollNumber || "").toLowerCase().includes(studentSearchTerm.toLowerCase())
  );

  const payments = paymentsData?.data?.payments || [];
  const studentFees = paymentsData?.data?.fees || [];
  const adminFees = adminFeesData?.data?.fees || [];

  // Pay mutation for student
  const payMutation = useMutation({
    mutationFn: async (payload: { feeStructureId: string; amount: number }) => {
      const res = await fetch("/api/student/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Payment failed");
      return res.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["payments", role] });
      setIsPayModalOpen(false);
      setSelectedFeeToPay(null);
      setPayAmountInput("");
      alert(`Payment of ₹${variables.amount.toLocaleString()} processed successfully!`);
    },
    onError: (err: any) => {
      alert(err.message || "Payment process failed.");
    }
  });

  // Verify payment mutation for admin
  const verifyMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const res = await fetch("/api/admin/payments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, status: "VERIFIED" }),
      });
      if (!res.ok) throw new Error("Failed to verify payment");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments", role] });
      alert("Payment receipt verified successfully!");
    },
  });

  // Admin Fee CRUD actions
  const saveFeeMutation = useMutation({
    mutationFn: async (payload: any) => {
      const url = "/api/admin/fees";
      const method = editingFee ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to save fee structure");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminFees", selectedStudentId, adminSelectedSemester] });
      setIsFeeModalOpen(false);
      setEditingFee(null);
      setFeeFormData({ feeType: "TUITION", amount: "", dueDate: "", lateFee: "0" });
    },
    onError: (err: any) => {
      alert(err.message);
    }
  });

  const deleteFeeMutation = useMutation({
    mutationFn: async (feeId: string) => {
      const res = await fetch(`/api/admin/fees?id=${feeId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete fee");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminFees", selectedStudentId, adminSelectedSemester] });
    },
  });

  // Calculations for Student Selected Semester
  const currentSemesterFees = studentFees.filter((f: any) => f.semester === selectedSemester);
  const totalSemesterFee = currentSemesterFees.reduce((sum: number, f: any) => sum + f.amount, 0);
  const paidSemesterFee = currentSemesterFees.reduce((sum: number, f: any) => sum + (f.paidAmount || 0), 0);
  
  const paymentProgress = totalSemesterFee > 0 ? Math.round((paidSemesterFee / totalSemesterFee) * 100) : 0;

  // Global calculations for Student stats (across all semesters)
  const globalTotalFee = studentFees.reduce((sum: number, f: any) => sum + f.amount, 0);
  const globalPaidFee = studentFees.reduce((sum: number, f: any) => sum + (f.paidAmount || 0), 0);
  const globalPendingFee = globalTotalFee - globalPaidFee;

  // Specific categorised amounts for display card (Tuition, Bus, Hostel, Exam, Placement, Other Charges)
  const tuitionAmount = currentSemesterFees.filter((f: any) => f.feeType === "TUITION").reduce((sum: number, f: any) => sum + f.amount, 0);
  const busAmount = currentSemesterFees.filter((f: any) => f.feeType === "BUS").reduce((sum: number, f: any) => sum + f.amount, 0);
  const hostelAmount = currentSemesterFees.filter((f: any) => f.feeType === "HOSTEL").reduce((sum: number, f: any) => sum + f.amount, 0);
  const examAmount = currentSemesterFees.filter((f: any) => f.feeType === "EXAM").reduce((sum: number, f: any) => sum + f.amount, 0);
  const placementAmount = currentSemesterFees.filter((f: any) => f.feeType === "PLACEMENT").reduce((sum: number, f: any) => sum + f.amount, 0);
  const otherChargesAmount = currentSemesterFees.filter((f: any) => !["TUITION", "BUS", "HOSTEL", "EXAM", "PLACEMENT"].includes(f.feeType)).reduce((sum: number, f: any) => sum + f.amount, 0);

  // Late fees & Overdues alert details
  const overdueFeesList = currentSemesterFees.filter((f: any) => f.status === "OVERDUE");
  const upcomingFeesList = currentSemesterFees.filter((f: any) => f.status === "PENDING").sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  // Receipt Download
  const handleDownloadReceipt = (payment: any) => {
    const label = FEE_TYPE_LABELS[payment.feeType] || payment.feeType;
    const text = `================================================
            UNIVERSITY FEE PAYMENT RECEIPT
================================================
Date:            ${new Date(payment.date).toLocaleDateString()}
Transaction ID:  ${payment.id}
Student Name:    ${currentStudentName}
Roll Number:     ${currentStudentRoll}
Fee Category:    ${label}
Amount Paid:     ₹${payment.amount.toLocaleString()}
Payment Status:  ${payment.status}
Payment Mode:    ONLINE CREDIT/DEBIT
================================================
Thank you for your payment. Keep this copy for records.`;

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Fee_Receipt_${payment.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Receipt Print
  const handlePrintReceipt = (payment: any) => {
    const label = FEE_TYPE_LABELS[payment.feeType] || payment.feeType;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${payment.id}</title>
          <style>
            body { font-family: monospace; padding: 40px; color: #333; line-height: 1.6; }
            .container { border: 2px solid #ccc; padding: 20px; max-width: 600px; margin: auto; }
            .header { text-align: center; border-bottom: 2px dashed #ccc; padding-bottom: 10px; margin-bottom: 20px; }
            .row { display: flex; justify-content: space-between; margin: 10px 0; }
            .footer { border-top: 2px dashed #ccc; padding-top: 10px; margin-top: 20px; text-align: center; font-size: 12px; color: #666; }
            @media print { body { padding: 0; } .container { border: none; } }
          </style>
        </head>
        <body onload="window.print()">
          <div class="container">
            <div class="header">
              <h2>EXCELSIOR UNIVERSITY</h2>
              <h3>OFFICIAL FEE RECEIPT</h3>
            </div>
            <div class="row"><strong>Date:</strong> <span>${new Date(payment.date).toLocaleDateString()}</span></div>
            <div class="row"><strong>Transaction ID:</strong> <span>${payment.id}</span></div>
            <div class="row"><strong>Student Name:</strong> <span>${currentStudentName}</span></div>
            <div class="row"><strong>Roll Number:</strong> <span>${currentStudentRoll}</span></div>
            <div class="row"><strong>Fee Category:</strong> <span>${label}</span></div>
            <div class="row"><strong>Amount Paid:</strong> <span><strong>₹${payment.amount.toLocaleString()}</strong></span></div>
            <div class="row"><strong>Status:</strong> <span>${payment.status}</span></div>
            <div class="row"><strong>Payment Mode:</strong> <span>ONLINE</span></div>
            <div class="footer">
              <p>This is a computer-generated receipt. No signature required.</p>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Open Payment Confirmation Modal
  const openPayModal = (fee: any) => {
    setSelectedFeeToPay(fee);
    setPayAmountInput(String(fee.amount - fee.paidAmount));
    setIsPayModalOpen(true);
  };

  // Process Student Payment Submit
  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFeeToPay) return;
    const amountToPay = parseInt(payAmountInput);
    if (isNaN(amountToPay) || amountToPay <= 0) {
      alert("Please enter a valid positive payment amount.");
      return;
    }
    const maxPayable = selectedFeeToPay.amount - selectedFeeToPay.paidAmount;
    if (amountToPay > maxPayable) {
      alert(`Max payable pending amount is ₹${maxPayable.toLocaleString()}.`);
      return;
    }
    payMutation.mutate({
      feeStructureId: selectedFeeToPay.id,
      amount: amountToPay,
    });
  };

  // Open Admin Fee Modal (Create)
  const openCreateFeeModal = () => {
    setEditingFee(null);
    setFeeFormData({
      feeType: "TUITION",
      amount: "",
      dueDate: "",
      lateFee: "0",
    });
    setIsFeeModalOpen(true);
  };

  // Open Admin Fee Modal (Edit)
  const openEditFeeModal = (fee: any) => {
    setEditingFee(fee);
    setFeeFormData({
      feeType: fee.feeType,
      amount: String(fee.amount),
      dueDate: new Date(fee.dueDate).toISOString().split("T")[0],
      lateFee: String(fee.lateFee || 0),
    });
    setIsFeeModalOpen(true);
  };

  // Handle Admin Fee Form Submit
  const handleSaveFee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return;
    const payload: any = {
      userId: selectedStudentId,
      semester: adminSelectedSemester,
      feeType: feeFormData.feeType,
      amount: parseInt(feeFormData.amount),
      dueDate: new Date(feeFormData.dueDate),
      lateFee: parseInt(feeFormData.lateFee),
    };
    if (editingFee) {
      payload.id = editingFee.id;
    }
    saveFeeMutation.mutate(payload);
  };

  const handleDeleteFee = (feeId: string) => {
    if (!confirm("Are you sure you want to delete this fee item?")) return;
    deleteFeeMutation.mutate(feeId);
  };

  // --- ADMIN RENDER ---
  if (role === "ADMIN") {
    return (
      <div className="max-w-6xl mx-auto pb-12 relative z-10">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2 flex items-center gap-3">
              <CreditCard className="text-[#10B981]" size={32} /> Fees & Payments Admin
            </h1>
            <p className="text-slate-500">Verify student payments, audit transactions, and create semester fee structures.</p>
          </div>
        </motion.div>

        {/* Admin Tabs */}
        <div className="flex border-b border-slate-200 mb-6 gap-6">
          <button
            onClick={() => setAdminTab("verify")}
            className={`pb-3 font-bold text-sm transition-all border-b-2 flex items-center gap-2 ${
              adminTab === "verify"
                ? "border-[#10B981] text-[#10B981]"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <CheckCircle size={18} /> Verify Student Payments
          </button>
          <button
            onClick={() => setAdminTab("manage")}
            className={`pb-3 font-bold text-sm transition-all border-b-2 flex items-center gap-2 ${
              adminTab === "manage"
                ? "border-[#10B981] text-[#10B981]"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <Sliders size={18} /> Manage Student Fees
          </button>
        </div>

        {/* TAB 1: Verify Student Payments */}
        {adminTab === "verify" && (
          <div className="glass rounded-2xl border border-slate-300 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100 bg-slate-50/40 backdrop-blur-sm font-bold text-slate-700">
              Recent Transactions Ledger
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
                    <th className="p-4 pl-6">Roll Number</th>
                    <th className="p-4">Student</th>
                    <th className="p-4">Fee Category</th>
                    <th className="p-4 text-center">Amount Paid</th>
                    <th className="p-4 text-center">Date</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 pr-6 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                  {isPaymentsLoading ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">Loading ledger records...</td>
                    </tr>
                  ) : payments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">No payment transactions found.</td>
                    </tr>
                  ) : (
                    payments.map((p: any) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 pl-6 font-mono text-xs font-semibold text-slate-500">{p.studentRollNumber || "N/A"}</td>
                        <td className="p-4 font-bold text-slate-800">{p.studentName || "Unknown"}</td>
                        <td className="p-4 font-medium text-slate-700">{FEE_TYPE_LABELS[p.feeType] || p.feeType}</td>
                        <td className="p-4 text-center font-bold text-slate-800">₹{p.amount.toLocaleString()}</td>
                        <td className="p-4 text-center text-slate-400">{new Date(p.date).toLocaleDateString()}</td>
                        <td className="p-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                            p.status === "VERIFIED"
                              ? "bg-green-50 text-green-600 border-green-200"
                              : p.status === "PAID" || p.status === "COMPLETED"
                              ? "bg-blue-50 text-blue-600 border-blue-200"
                              : "bg-amber-50 text-amber-600 border-amber-200"
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="p-4 pr-6 text-center">
                          {(p.status === "PAID" || p.status === "COMPLETED") ? (
                            <button
                              onClick={() => verifyMutation.mutate(p.id)}
                              className="px-3.5 py-1.5 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold rounded-lg shadow-sm transition-all"
                            >
                              Verify Receipt
                            </button>
                          ) : (
                            <span className="text-xs text-slate-300 font-medium">No actions</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: Manage Student Fees */}
        {adminTab === "manage" && (
          <div className="space-y-6">
            {/* Student Search and Semester Selection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 glass p-6 rounded-2xl border border-slate-300 shadow-sm">
              <div className="relative col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Select Student (Search by Name or Roll Number)
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Type to filter, click below to select..."
                    value={studentSearchTerm}
                    onChange={(e) => setStudentSearchTerm(e.target.value)}
                    className="pl-10 w-full border border-slate-300 rounded-xl px-4 py-2.5 text-slate-700 focus:outline-none focus:border-[#10B981] text-sm"
                  />
                </div>
                {/* Autocomplete selector dropdown */}
                {studentSearchTerm && filteredStudents.length > 0 && (
                  <div className="absolute left-0 right-0 bg-white border border-slate-300 mt-1 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto divide-y divide-slate-100">
                    {filteredStudents.map((s: any) => (
                      <div
                        key={s.id}
                        onClick={() => {
                          setSelectedStudentId(s.id);
                          setStudentSearchTerm(s.name);
                        }}
                        className={`p-3 text-sm cursor-pointer hover:bg-slate-50 flex items-center justify-between ${
                          selectedStudentId === s.id ? "bg-[#10B981]/10 font-bold" : ""
                        }`}
                      >
                        <div>
                          <div className="font-bold text-slate-800">{s.name}</div>
                          <div className="text-xs text-slate-400 font-mono">{s.rollNumber || "No Roll No."}</div>
                        </div>
                        <ChevronRight size={16} className="text-slate-400" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Semester
                </label>
                <select
                  value={adminSelectedSemester}
                  onChange={(e) => setAdminSelectedSemester(parseInt(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-700 focus:outline-none focus:border-[#10B981] text-sm h-[42px]"
                >
                  {Array.from({
                    length: (usersData?.data?.users || []).find((u: any) => u.id === selectedStudentId)?.totalSemesters || 8
                  }, (_, i) => i + 1).map(s => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Fee Items Table for Selected Student */}
            {selectedStudentId ? (
              <div className="glass rounded-2xl border border-slate-300 overflow-hidden shadow-sm">
                <div className="p-5 border-b border-slate-100 bg-slate-50/40 backdrop-blur-sm flex items-center justify-between">
                  <div className="font-bold text-slate-700 flex items-center gap-2">
                    <User size={18} className="text-[#10B981]" />
                    Semester {adminSelectedSemester} Fee Items Structure
                  </div>
                  <button
                    onClick={openCreateFeeModal}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#10B981] to-[#059669] text-white font-bold text-xs rounded-xl shadow-sm hover:scale-[1.02] transition-transform"
                  >
                    <Plus size={14} /> Assign Fee Category
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
                        <th className="p-4 pl-6">Fee Category</th>
                        <th className="p-4 text-center">Amount Due</th>
                        <th className="p-4 text-center">Paid Amount</th>
                        <th className="p-4 text-center">Pending Balance</th>
                        <th className="p-4 text-center">Due Date</th>
                        <th className="p-4 text-center">Late Fee Penalty</th>
                        <th className="p-4 text-center">Status</th>
                        <th className="p-4 pr-6 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                      {isAdminFeesLoading ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-400">Loading student fee items...</td>
                        </tr>
                      ) : adminFees.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-400">
                            No fees assigned for this semester. Click "Assign Fee Category" to assign.
                          </td>
                        </tr>
                      ) : (
                        adminFees.map((f: any) => (
                          <tr key={f.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4 pl-6 font-bold text-slate-800">{FEE_TYPE_LABELS[f.feeType] || f.feeType}</td>
                            <td className="p-4 text-center font-bold text-slate-700">₹{f.amount.toLocaleString()}</td>
                            <td className="p-4 text-center text-green-600 font-bold">₹{f.paidAmount.toLocaleString()}</td>
                            <td className="p-4 text-center text-slate-500 font-semibold">₹{(f.amount - f.paidAmount).toLocaleString()}</td>
                            <td className="p-4 text-center text-slate-400">{new Date(f.dueDate).toLocaleDateString()}</td>
                            <td className="p-4 text-center text-red-500 font-medium">₹{f.lateFee.toLocaleString()}</td>
                            <td className="p-4 text-center">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                f.status === "PAID"
                                  ? "bg-green-50 text-green-600 border-green-200"
                                  : f.status === "OVERDUE"
                                  ? "bg-red-50 text-red-600 border-red-200"
                                  : "bg-amber-50 text-amber-600 border-amber-200"
                              }`}>
                                {f.status}
                              </span>
                            </td>
                            <td className="p-4 pr-6 text-center">
                              <div className="flex items-center justify-center gap-2.5">
                                <button
                                  onClick={() => openEditFeeModal(f)}
                                  className="p-1 text-slate-400 hover:text-[#10B981] transition-colors"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteFee(f.id)}
                                  className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="glass border border-slate-300 rounded-2xl p-12 text-center text-slate-400 shadow-sm">
                <Search size={48} className="mx-auto text-slate-200 mb-4" />
                <h3 className="font-bold text-slate-700 text-lg mb-1">No Student Selected</h3>
                <p className="text-sm">Please search and select a student above to review or configure their fee schedules.</p>
              </div>
            )}
          </div>
        )}

        {/* MODAL: Add/Edit Fee Item */}
        <AnimatePresence>
          {isFeeModalOpen && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl border border-slate-300 w-full max-w-md overflow-hidden shadow-2xl"
              >
                <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-bold text-lg text-slate-800">
                    {editingFee ? "Edit Fee Item" : "Assign Fee Item"}
                  </h3>
                  <button onClick={() => setIsFeeModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleSaveFee} className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Fee Category
                    </label>
                    <select
                      value={feeFormData.feeType}
                      onChange={(e) => setFeeFormData({ ...feeFormData, feeType: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-700 focus:outline-none focus:border-[#10B981] text-sm"
                    >
                      {FEE_CATEGORIES.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Fee Amount (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      placeholder="e.g. 50000"
                      value={feeFormData.amount}
                      onChange={(e) => setFeeFormData({ ...feeFormData, amount: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-700 focus:outline-none focus:border-[#10B981] text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Due Date
                      </label>
                      <input
                        type="date"
                        required
                        value={feeFormData.dueDate}
                        onChange={(e) => setFeeFormData({ ...feeFormData, dueDate: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-700 focus:outline-none focus:border-[#10B981] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Late Fee Charge (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 500"
                        value={feeFormData.lateFee}
                        onChange={(e) => setFeeFormData({ ...feeFormData, lateFee: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-700 focus:outline-none focus:border-[#10B981] text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsFeeModalOpen(false)}
                      className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saveFeeMutation.isPending}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-[#10B981] to-[#059669] text-white font-bold rounded-xl text-sm shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center"
                    >
                      {saveFeeMutation.isPending ? "Saving..." : "Save Fee"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // --- STUDENT RENDER ---
  return (
    <div className="max-w-6xl mx-auto pb-12 relative z-10">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2 flex items-center gap-3">
          <CreditCard className="text-[#10B981]" size={32} /> Fees & Payments Portal
        </h1>
        <p className="text-slate-500 font-medium">Verify your itemized semester billing, view overdue alerts, and download official receipts.</p>
      </motion.div>

      {/* Semester Specific Overview Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <AnalyticsCard 
          title={`Semester ${selectedSemester} Total Fees`} 
          value={`₹${totalSemesterFee.toLocaleString()}`} 
          icon={<DollarSign size={24} className="text-[#10B981]" />} 
          delay={0.1} 
        />
        <AnalyticsCard 
          title={`Semester ${selectedSemester} Paid Balance`} 
          value={`₹${paidSemesterFee.toLocaleString()}`} 
          icon={<CheckCircle size={24} className="text-green-500" />} 
          delay={0.2} 
        />
        <AnalyticsCard 
          title={`Semester ${selectedSemester} Pending Due`} 
          value={`₹${(totalSemesterFee - paidSemesterFee).toLocaleString()}`} 
          icon={<Clock size={24} className={(totalSemesterFee - paidSemesterFee) > 0 ? "text-red-500" : "text-green-500"} />} 
          delay={0.3} 
        />
      </div>

      {/* Semester Selection Bar */}
      <div className="flex gap-2.5 overflow-x-auto pb-3 mb-6 scrollbar-thin select-none">
        {Array.from({ length: paymentsData?.data?.totalSemesters || 8 }, (_, i) => i + 1).map((sem) => {
          const semFees = studentFees.filter((f: any) => f.semester === sem);
          const hasOverdue = semFees.some((f: any) => f.status === "OVERDUE");
          return (
            <button
              key={sem}
              onClick={() => setSelectedSemester(sem)}
              className={`relative px-6 py-3 rounded-full font-extrabold transition-all whitespace-nowrap text-sm flex items-center gap-2 border ${
                selectedSemester === sem
                  ? "bg-[#10B981] text-white shadow-[0_4px_15px_rgba(16,185,129,0.35)] scale-[1.03] border-transparent"
                  : "bg-white/50 backdrop-blur-sm text-slate-600 border-slate-300 hover:bg-slate-50/70"
              }`}
            >
              Semester {sem}
              {hasOverdue && (
                <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" title="Has Overdue Fees!" />
              )}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8 items-start">
        {/* LEFT COLUMN: Breakdown & alerts (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Alerts Banner Container */}
          {overdueFeesList.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-start gap-3 shadow-sm"
            >
              <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
              <div className="text-sm">
                <h4 className="font-bold mb-1">Overdue Payments Notice!</h4>
                <div className="leading-relaxed text-red-600/90 text-xs">
                  You have overdue fees for Semester {selectedSemester}. 
                  {overdueFeesList.map((f: any) => (
                    <span key={f.id} className="block mt-1 font-semibold">
                      • {FEE_TYPE_LABELS[f.feeType] || f.feeType}: ₹{(f.amount - f.paidAmount).toLocaleString()} was due on {new Date(f.dueDate).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-')}. Late fee of ₹{f.lateFee} applied.
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {overdueFeesList.length === 0 && upcomingFeesList.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl flex items-start gap-3 shadow-sm">
              <Calendar className="text-amber-600 shrink-0 mt-0.5" size={20} />
              <div className="text-sm">
                <h4 className="font-bold mb-0.5">Upcoming Payments Due</h4>
                <p className="text-amber-700/90 text-xs leading-relaxed">
                  Upcoming category <strong>{FEE_TYPE_LABELS[upcomingFeesList[0].feeType] || upcomingFeesList[0].feeType}</strong> of <strong>₹{(upcomingFeesList[0].amount - upcomingFeesList[0].paidAmount).toLocaleString()}</strong> is due on {new Date(upcomingFeesList[0].dueDate).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-')}.
                </p>
              </div>
            </div>
          )}

          {currentSemesterFees.length > 0 && overdueFeesList.length === 0 && upcomingFeesList.length === 0 && (
            <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-2xl flex items-center gap-3 shadow-sm">
              <CheckCircle className="text-green-500 shrink-0" size={20} />
              <div className="text-sm font-bold">
                Excellent! All fees for Semester {selectedSemester} have been successfully cleared.
              </div>
            </div>
          )}

          {/* Progress Visualization */}
          <div className="glass p-6 rounded-2xl border border-slate-300 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Semester Payment Progress</span>
              <span className="text-sm font-black text-slate-950">{paymentProgress}% Paid</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${paymentProgress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="bg-[#10B981] h-full rounded-full shadow-[0_0_12px_rgba(16,185,129,0.4)]"
              />
            </div>
            <div className="flex justify-between text-sm text-slate-700 mt-2.5 font-bold">
              <span>Paid: <span className="text-green-600 font-extrabold">₹{paidSemesterFee.toLocaleString()}</span></span>
              <span>Total: <span className="text-slate-950 font-extrabold">₹{totalSemesterFee.toLocaleString()}</span></span>
            </div>
          </div>

          {/* Fee Status Indicators Grid */}
          {currentSemesterFees.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider">Fee Status Indicators</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {currentSemesterFees.map((f: any) => {
                  const pending = f.amount - f.paidAmount;
                  return (
                    <div key={f.id} className="glass p-5 rounded-2xl border border-slate-300 shadow-sm flex flex-col justify-between space-y-3 hover:shadow-md transition-shadow">
                      <div>
                        <div className="text-xs font-black text-slate-800 uppercase tracking-wider">{FEE_TYPE_LABELS[f.feeType] || f.feeType}</div>
                        <div className="text-lg font-black text-slate-950 mt-1">₹{f.amount.toLocaleString()}</div>
                      </div>
                      <div className="text-xs space-y-1.5 text-slate-800 font-bold border-t border-slate-100 pt-2">
                        <div>Paid: <span className="text-green-600 font-extrabold">₹{f.paidAmount.toLocaleString()}</span></div>
                        <div>Pending: <span className={pending > 0 ? "text-red-500 font-extrabold" : "text-slate-900 font-extrabold"}>₹{pending.toLocaleString()}</span></div>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className="text-slate-600 font-bold">Status:</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            f.status === "PAID"
                              ? "bg-green-50 text-green-600 border-green-200"
                              : f.status === "OVERDUE"
                              ? "bg-red-50 text-red-600 border-red-200"
                              : "bg-amber-50 text-amber-600 border-amber-200"
                          }`}>
                            {f.status === "PAID" ? "Paid" : f.status === "OVERDUE" ? "Overdue" : "Pending"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Itemized Fee Breakdown Table */}
          <div className="glass rounded-2xl border border-slate-300 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100 bg-slate-50/40 backdrop-blur-sm font-extrabold text-slate-900">
              Breakdown Details Table
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[650px]">
                <thead>
                  <tr className="bg-slate-50/40 text-slate-800 font-black text-[11px] uppercase tracking-wider border-b border-slate-300">
                    <th className="p-4 pl-6">Fee Category</th>
                    <th className="p-4 text-center">Allocated Amount</th>
                    <th className="p-4 text-center">Paid Amount</th>
                    <th className="p-4 text-center">Pending Amount</th>
                    <th className="p-4 text-center">Due Date</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 pr-6 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-800">
                  {currentSemesterFees.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-600 font-bold">
                        No billing parameters assigned for Semester {selectedSemester}.
                      </td>
                    </tr>
                  ) : (
                    currentSemesterFees.map((f: any) => (
                      <tr key={f.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 pl-6 font-extrabold text-slate-950">{FEE_TYPE_LABELS[f.feeType] || f.feeType}</td>
                        <td className="p-4 text-center font-extrabold text-slate-900">₹{f.amount.toLocaleString()}</td>
                        <td className="p-4 text-center text-green-700 font-extrabold">₹{f.paidAmount.toLocaleString()}</td>
                        <td className="p-4 text-center text-slate-950 font-extrabold">₹{(f.amount - f.paidAmount).toLocaleString()}</td>
                        <td className="p-4 text-center text-slate-800 font-bold text-xs">
                          {new Date(f.dueDate).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-')}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                            f.status === "PAID"
                              ? "bg-green-50 text-green-600 border-green-200"
                              : f.status === "OVERDUE"
                              ? "bg-red-50 text-red-600 border-red-200"
                              : "bg-amber-50 text-amber-600 border-amber-200"
                          }`}>
                            {f.status === "PAID" ? "Paid" : f.status === "OVERDUE" ? "Overdue" : "Pending"}
                          </span>
                        </td>
                        <td className="p-4 pr-6 text-center">
                          {f.status !== "PAID" ? (
                            <button
                              onClick={() => openPayModal(f)}
                              className="px-4 py-1.5 bg-gradient-to-r from-[#10B981] to-[#059669] text-white text-xs font-bold rounded-lg shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                              Pay Now
                            </button>
                          ) : (
                            <span className="text-xs text-green-600 font-extrabold flex items-center justify-center gap-1">
                              <Check size={12} /> Cleared
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Fee Categories breakdown card & receipts */}
        <div className="space-y-6">
          {/* Detailed Fee Structure Card */}
          <div className="glass p-6 rounded-2xl border border-slate-300 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#10B981]/10 to-transparent rounded-full -mr-8 -mt-8" />
            <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
              <FileText className="text-[#10B981]" size={18} />
              Semester {selectedSemester} Fee Structure
            </h3>

            <div className="space-y-3 font-sans text-sm text-slate-800">
              <div className="flex items-center justify-between">
                <span className="whitespace-nowrap font-medium text-slate-700">Tuition Fee</span>
                <span className="border-b border-dotted border-slate-300 flex-grow mx-2 h-4" />
                <span className="font-extrabold text-slate-950 whitespace-nowrap">₹{tuitionAmount.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="whitespace-nowrap font-medium text-slate-700">Bus Fee</span>
                <span className="border-b border-dotted border-slate-300 flex-grow mx-2 h-4" />
                <span className="font-extrabold text-slate-950 whitespace-nowrap">₹{busAmount.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="whitespace-nowrap font-medium text-slate-700">Hostel Fee</span>
                <span className="border-b border-dotted border-slate-300 flex-grow mx-2 h-4" />
                <span className="font-extrabold text-slate-950 whitespace-nowrap">₹{hostelAmount.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="whitespace-nowrap font-medium text-slate-700">Exam Fee</span>
                <span className="border-b border-dotted border-slate-300 flex-grow mx-2 h-4" />
                <span className="font-extrabold text-slate-950 whitespace-nowrap">₹{examAmount.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="whitespace-nowrap font-medium text-slate-700">Placement Fee</span>
                <span className="border-b border-dotted border-slate-300 flex-grow mx-2 h-4" />
                <span className="font-extrabold text-slate-950 whitespace-nowrap">₹{placementAmount.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="whitespace-nowrap font-medium text-slate-700">Other Charges</span>
                <span className="border-b border-dotted border-slate-300 flex-grow mx-2 h-4" />
                <span className="font-extrabold text-slate-950 whitespace-nowrap">₹{otherChargesAmount.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-base font-sans font-bold text-slate-950">
                <span className="whitespace-nowrap">Total Fee</span>
                <span className="border-b border-dotted border-slate-300 flex-grow mx-2 h-4" />
                <span className="text-[#10B981] font-black whitespace-nowrap text-lg">₹{totalSemesterFee.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Pending Payments Breakdown Section */}
          <div className="glass p-6 rounded-2xl border border-slate-300 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <AlertTriangle className="text-amber-500" size={18} /> Pending Payments
            </h3>
            <div className="space-y-4">
              {currentSemesterFees.filter((f: any) => f.amount > f.paidAmount).length === 0 ? (
                <p className="text-slate-400 text-xs py-4 text-center">✓ All fees cleared for this semester.</p>
              ) : (
                currentSemesterFees.filter((f: any) => f.amount > f.paidAmount).map((f: any) => {
                  let emoji = "💳";
                  if (f.feeType === "TUITION") emoji = "🎓";
                  if (f.feeType === "BUS") emoji = "🚌";
                  if (f.feeType === "HOSTEL") emoji = "🏠";
                  if (f.feeType === "EXAM") emoji = "📚";
                  if (f.feeType === "PLACEMENT") emoji = "💼";
                  
                  return (
                    <div key={f.id} className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl space-y-1">
                      <div className="font-extrabold text-slate-950 text-sm flex items-center gap-1.5">
                        <span>{emoji}</span> {FEE_TYPE_LABELS[f.feeType] || f.feeType}
                      </div>
                      <div className="text-xs text-slate-800 font-bold">
                        Amount Pending: <span className="font-black text-red-600">₹{(f.amount - f.paidAmount).toLocaleString()}</span>
                      </div>
                      <div className="text-[10px] text-slate-600 font-extrabold">
                        Due Date: {new Date(f.dueDate).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-')}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Payment History ledger */}
          <div className="glass p-5 rounded-2xl border border-slate-300 shadow-sm">
            <h3 className="font-bold text-slate-800 text-sm mb-4">Paid Transaction Ledger</h3>
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {payments.filter((p: any) => p.status === "PAID" || p.status === "VERIFIED" || p.status === "COMPLETED").length === 0 ? (
                <p className="text-slate-400 text-xs py-4 text-center">No successful payments made.</p>
              ) : (
                payments.filter((p: any) => p.status === "PAID" || p.status === "VERIFIED" || p.status === "COMPLETED").map((p: any, i: number) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-800">₹{p.amount.toLocaleString()}</div>
                      <div className="text-slate-400 font-medium text-[10px] mt-0.5">
                        {FEE_TYPE_LABELS[p.feeType] || p.feeType}
                      </div>
                      <div className="text-slate-300 text-[9px] font-mono mt-0.5">{new Date(p.date).toLocaleDateString()}</div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedPaymentForReceipt(p);
                        setIsReceiptModalOpen(true);
                      }}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold rounded-lg transition-colors flex items-center gap-1 text-[10px] shadow-sm"
                    >
                      <Printer size={10} /> Invoice
                    </button>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: Checkout / Pay Confirmation */}
      <AnimatePresence>
        {isPayModalOpen && selectedFeeToPay && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-300 w-full max-w-sm overflow-hidden shadow-2xl"
            >
              <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-lg text-slate-800">
                  Confirm Fee Payment
                </h3>
                <button onClick={() => setIsPayModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleProcessPayment} className="p-6 space-y-4">
                <div className="text-xs space-y-1.5">
                  <div className="text-slate-400">Payment Category:</div>
                  <div className="font-bold text-slate-800 text-sm">
                    {FEE_TYPE_LABELS[selectedFeeToPay.feeType] || selectedFeeToPay.feeType}
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-100 text-slate-500">
                    <span>Total Category Due:</span>
                    <span className="font-bold text-slate-800">₹{selectedFeeToPay.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-500">
                    <span>Amount Already Paid:</span>
                    <span className="font-bold text-green-600">₹{selectedFeeToPay.paidAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center font-bold text-slate-700">
                    <span>Remaining Balance:</span>
                    <span>₹{(selectedFeeToPay.amount - selectedFeeToPay.paidAmount).toLocaleString()}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Amount to Pay (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={selectedFeeToPay.amount - selectedFeeToPay.paidAmount}
                    value={payAmountInput}
                    onChange={(e) => setPayAmountInput(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-[#10B981] text-sm font-bold"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsPayModalOpen(false)}
                    className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={payMutation.isPending}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-[#10B981] to-[#059669] text-white font-bold rounded-xl text-sm shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center"
                  >
                    {payMutation.isPending ? "Paying..." : "Confirm Pay"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Invoice Receipt Details */}
      <AnimatePresence>
        {isReceiptModalOpen && selectedPaymentForReceipt && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-300 w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-5 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <FileText className="text-[#10B981]" size={20} />
                  Fee Invoice Receipt
                </h3>
                <button onClick={() => setIsReceiptModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Official Bill Invoice Header */}
                <div className="text-center pb-4 border-b border-dashed border-slate-200">
                  <h4 className="font-black text-[#10B981] text-lg tracking-wider">EXCELSIOR UNIVERSITY</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Official Student Billing Document</p>
                </div>

                {/* Receipt Details Block */}
                <div className="space-y-3.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold">Receipt Date</span>
                    <span className="text-slate-700 font-semibold">{new Date(selectedPaymentForReceipt.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold">Transaction Reference</span>
                    <span className="text-slate-700 font-mono text-[10px] select-all bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-lg">{selectedPaymentForReceipt.id}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold">Student Name</span>
                    <span className="text-slate-700 font-semibold">{currentStudentName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold">Roll Number</span>
                    <span className="text-slate-700 font-mono font-semibold">{currentStudentRoll}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold">Billing Category</span>
                    <span className="text-slate-700 font-semibold">{FEE_TYPE_LABELS[selectedPaymentForReceipt.feeType] || selectedPaymentForReceipt.feeType}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold">Payment Method</span>
                    <span className="text-slate-700 font-semibold">Online Credit/Debit</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-slate-100 pt-3.5 font-bold">
                    <span className="text-slate-500 text-sm">Amount Cleared</span>
                    <span className="text-[#10B981] text-base font-black">₹{selectedPaymentForReceipt.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold">Verification Status</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      selectedPaymentForReceipt.status === "VERIFIED"
                        ? "bg-green-50 text-green-600 border-green-200"
                        : "bg-blue-50 text-blue-600 border-blue-200"
                    }`}>
                      {selectedPaymentForReceipt.status}
                    </span>
                  </div>
                </div>

                {/* Print and Download Actions */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handlePrintReceipt(selectedPaymentForReceipt)}
                    className="flex items-center justify-center gap-1.5 px-4 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                  >
                    <Printer size={14} /> Print Receipt
                  </button>
                  <button
                    onClick={() => handleDownloadReceipt(selectedPaymentForReceipt)}
                    className="flex items-center justify-center gap-1.5 px-4 py-3 bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-xl text-xs shadow-md transition-all hover:scale-[1.01]"
                  >
                    <Download size={14} /> Download TXT
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
