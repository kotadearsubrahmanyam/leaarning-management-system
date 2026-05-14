"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CreditCard, Plus, CheckCircle, Clock, Download, DollarSign } from "lucide-react";
import { AnimatedButton } from "@/components/ui/animated-button";
import { AnalyticsCard } from "@/components/ui/analytics-card";

export default function PaymentsPage() {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");

  const { data: authData } = useQuery({
    queryKey: ["authMe"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) throw new Error("Unauthorized");
      return res.json();
    },
  });
  const role = authData?.data?.user?.role;

  const { data, isLoading } = useQuery({
    queryKey: ["payments", role],
    queryFn: async () => {
      const endpoint = role === "ADMIN" ? "/api/admin/payments" : "/api/student/payments";
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error("Failed to fetch payments");
      return res.json();
    },
  });

  const payMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const res = await fetch("/api/student/payments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId }),
      });
      if (!res.ok) throw new Error("Payment failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments", role] });
    },
  });

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
    },
  });

  const payments = data?.data?.payments || [];

  const TOTAL_FEE = payments.reduce((sum: number, p: any) => sum + p.amount, 0);
  const paidFee = payments
    .filter((p: any) => p.status === "PAID" || p.status === "VERIFIED" || p.status === "COMPLETED")
    .reduce((sum: number, p: any) => sum + p.amount, 0);
  const remainingFee = TOTAL_FEE - paidFee;

  const handleDownloadReceipt = (payment: any) => {
    const receiptText = `=================================
       PAYMENT RECEIPT
=================================
Date: ${new Date(payment.date).toLocaleDateString()}
Amount: $${payment.amount}
Status: ${payment.status}
Transaction ID: ${payment.id}
=================================
Thank you for your payment.`;
    const blob = new Blob([receiptText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Receipt_${payment.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto pb-12 relative z-10">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-3">
          <CreditCard size={32} /> Payments
        </h1>
        <p className="text-foreground/70">Manage your course fees and payment history.</p>
      </motion.div>

      {role === "STUDENT" && !isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <AnalyticsCard 
            title="Total Semester Fee" 
            value={`$${TOTAL_FEE}`} 
            icon={<DollarSign size={24} className="text-foreground/50" />} 
            delay={0.1} 
          />
          <AnalyticsCard 
            title="Total Paid" 
            value={`$${paidFee}`} 
            icon={<CheckCircle size={24} className="text-green-500" />} 
            delay={0.2} 
          />
          <AnalyticsCard 
            title="Remaining Balance" 
            value={`$${remainingFee}`} 
            icon={<Clock size={24} className={remainingFee > 0 ? "text-orange-500" : "text-green-500"} />} 
            delay={0.3} 
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 mb-8">
        <div className="glass p-6 rounded-3xl border border-white/10">
          <h3 className="text-xl font-bold mb-4">Payment History</h3>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white/5 animate-pulse rounded-xl" />)}
            </div>
          ) : payments.length === 0 ? (
            <p className="text-foreground/50 text-center py-8">No payments recorded.</p>
          ) : (
            <div className="space-y-3">
              {payments.map((p: any, i: number) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/20 p-3 rounded-full text-primary">
                      <CreditCard size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold">${p.amount}</p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-500 font-bold">
                          {p.feeType || "TUITION"}
                        </span>
                      </div>
                      {role === "ADMIN" ? (
                        <p className="text-xs text-foreground/50">{p.studentName} • {new Date(p.date).toLocaleDateString()}</p>
                      ) : (
                        <p className="text-xs text-foreground/50">{new Date(p.date).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-1 text-sm font-semibold px-3 py-1 rounded-full ${p.status === 'PAID' || p.status === 'VERIFIED' || p.status === 'COMPLETED' ? 'bg-green-500/20 text-green-500' : 'bg-orange-500/20 text-orange-500'}`}>
                      {p.status === 'PAID' || p.status === 'VERIFIED' || p.status === 'COMPLETED' ? <CheckCircle size={14} /> : <Clock size={14} />}
                      {p.status}
                    </div>
                    {role === "ADMIN" && (p.status === "PAID" || p.status === "COMPLETED") && (
                      <AnimatedButton onClick={() => verifyMutation.mutate(p.id)} isLoading={verifyMutation.isPending}>
                        Verify
                      </AnimatedButton>
                    )}
                    {role === "STUDENT" && p.status === "PENDING" && (
                      <AnimatedButton 
                        onClick={() => payMutation.mutate(p.id)} 
                        isLoading={payMutation.isPending}
                      >
                        Pay
                      </AnimatedButton>
                    )}
                    {role === "STUDENT" && (p.status === "PAID" || p.status === "VERIFIED" || p.status === "COMPLETED") && (
                      <button 
                        onClick={() => handleDownloadReceipt(p)}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-foreground/70 hover:text-primary flex items-center gap-2 text-sm"
                        title="Download Receipt"
                      >
                        <Download size={16} /> Receipt
                      </button>
                    )}
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
