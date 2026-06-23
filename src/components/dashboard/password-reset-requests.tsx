"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldAlert, CheckCircle2, UserCheck, KeyRound, Clock, Mail, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordResetRequestsProps {
  role: "TEACHER" | "ADMIN";
}

interface ResetRequest {
  id: string;
  userId: string;
  studentName?: string;
  studentEmail?: string;
  studentRollNumber?: string;
  studentSemester?: number;
  teacherName?: string;
  teacherEmail?: string;
  teacherDepartmentId?: string;
  createdAt: string;
}

export function PasswordResetRequests({ role }: PasswordResetRequestsProps) {
  const [requests, setRequests] = useState<ResetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  
  // Store temporary password inputs per request ID
  const [tempPasswords, setTempPasswords] = useState<Record<string, string>>({});
  
  // Store successfully resolved credential details to show the resolver
  const [resolvedCredential, setResolvedCredential] = useState<{
    userName: string;
    tempPass: string;
  } | null>(null);

  const apiEndpoint = role === "TEACHER" 
    ? "/api/teacher/password-requests" 
    : "/api/admin/password-requests";

  const fetchRequests = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(apiEndpoint);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch reset requests");
      }
      const fetchedRequests = data.data?.requests || [];
      setRequests(fetchedRequests);

      // Pre-fill a random temporary password for each request
      const initialTempPasswords: Record<string, string> = {};
      fetchedRequests.forEach((req: ResetRequest) => {
        const randomDigits = Math.floor(1000 + Math.random() * 9000);
        initialTempPasswords[req.id] = `Temp@${randomDigits}`;
      });
      setTempPasswords(initialTempPasswords);
    } catch (err: any) {
      setError(err.message || "Error loading requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [role]);

  const handleResolve = async (reqId: string, userName: string) => {
    const tempPass = tempPasswords[reqId];
    if (!tempPass || tempPass.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }

    setResolvingId(reqId);
    setResolvedCredential(null);

    try {
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: reqId, tempPassword: tempPass }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to resolve request.");
      }

      setResolvedCredential({
        userName,
        tempPass
      });

      // Refresh list
      await fetchRequests();
    } catch (err: any) {
      alert(err.message || "Failed to resolve password reset request");
    } finally {
      setResolvingId(null);
    }
  };

  if (loading && requests.length === 0) {
    return (
      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 shadow-sm">
        <h3 className="text-lg font-black text-[#111827] flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
          <KeyRound className="text-primary" size={20} /> Password Reset Requests
        </h3>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 shadow-sm">
        <h3 className="text-lg font-black text-[#111827] flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
          <KeyRound className="text-primary" size={20} /> Password Reset Requests
        </h3>
        
        {resolvedCredential && (
          <div className="mb-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm space-y-2">
            <div className="flex items-center gap-2 font-bold">
              <CheckCircle2 className="text-emerald-600 size-5" />
              <span>Password successfully reset for {resolvedCredential.userName}!</span>
            </div>
            <p className="text-xs">
              Give this temporary password to the user: <strong className="font-mono text-sm bg-white px-2 py-0.5 rounded border border-emerald-300 select-all">{resolvedCredential.tempPass}</strong>
            </p>
          </div>
        )}

        <div className="text-center py-6 text-slate-400 font-semibold text-sm">
          No pending password reset requests.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 shadow-sm space-y-6">
      <h3 className="text-lg font-black text-[#111827] flex items-center gap-2 border-b border-slate-100 pb-3">
        <KeyRound className="text-[#7C3AED]" size={20} /> Password Reset Requests
        <span className="ml-auto bg-primary/10 text-primary border border-primary/20 text-xs px-2.5 py-1 rounded-full font-black">
          {requests.length} Pending
        </span>
      </h3>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
          <ShieldAlert size={16} />
          {error}
        </div>
      )}

      {resolvedCredential && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm space-y-2">
          <div className="flex items-center gap-2 font-bold">
            <CheckCircle2 className="text-emerald-600 size-5" />
            <span>Password successfully reset for {resolvedCredential.userName}!</span>
          </div>
          <p className="text-xs">
            Give this temporary password to the user: <strong className="font-mono text-sm bg-white px-2 py-0.5 rounded border border-emerald-300 select-all">{resolvedCredential.tempPass}</strong>
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {requests.map((req) => {
          const name = role === "TEACHER" ? req.studentName : req.teacherName;
          const email = role === "TEACHER" ? req.studentEmail : req.teacherEmail;
          const detailLabel = role === "TEACHER" ? "Roll No" : "Dept";
          const detailValue = role === "TEACHER" ? req.studentRollNumber : req.teacherDepartmentId;

          return (
            <div 
              key={req.id} 
              className="p-5 border border-[#E5E7EB] rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-extrabold text-[#111827] text-base">{name}</h4>
                    <p className="text-xs text-slate-500 font-semibold flex items-center gap-1 mt-0.5">
                      <Mail size={12} /> {email}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                    <Clock size={10} /> {new Date(req.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex gap-4 text-xs font-semibold text-slate-600 bg-white p-2.5 rounded-xl border border-slate-100">
                  <div>
                    {detailLabel}: <span className="font-bold text-slate-800">{detailValue || "N/A"}</span>
                  </div>
                  {role === "TEACHER" && req.studentSemester && (
                    <>
                      <div className="w-1 h-1 bg-slate-300 rounded-full self-center" />
                      <div>
                        Sem: <span className="font-bold text-slate-800">{req.studentSemester}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-200/60 flex items-center gap-3">
                <div className="flex-1 space-y-1">
                  <Label htmlFor={`temp-pass-${req.id}`} className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    Temporary Password
                  </Label>
                  <Input
                    id={`temp-pass-${req.id}`}
                    type="text"
                    required
                    placeholder="Temp password"
                    value={tempPasswords[req.id] || ""}
                    onChange={(e) => setTempPasswords({
                      ...tempPasswords,
                      [req.id]: e.target.value
                    })}
                    className="h-9 text-xs font-mono font-bold bg-white border-slate-200 focus:border-primary text-slate-800"
                  />
                </div>
                
                <Button
                  onClick={() => handleResolve(req.id, name || "User")}
                  disabled={resolvingId === req.id}
                  size="sm"
                  className="h-9 font-extrabold px-4 mt-4 shadow-sm"
                >
                  {resolvingId === req.id ? "Saving..." : "Resolve"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
