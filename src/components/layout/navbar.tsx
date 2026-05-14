"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { BookOpen } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();

  const { data: authData } = useQuery({
    queryKey: ["authMe"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) throw new Error("Not logged in");
      return res.json();
    },
    retry: false,
  });

  if (pathname.startsWith("/dashboard")) return null;
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 glass rounded-none border-t-0 border-x-0 border-b border-white/20">
      <Link href="/" className="flex items-center space-x-2 text-primary">
        <BookOpen className="w-6 h-6" />
        <span className="text-xl font-bold tracking-tight">Learnin<span className="text-foreground/80 font-normal">Loop</span></span>
      </Link>
      <div className="flex items-center space-x-4">
        {authData?.data?.user ? (
          <Link href="/dashboard" className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:shadow-lg transition-all hover:scale-105">
            Go to Dashboard
          </Link>
        ) : (
          <>
            <Link href="/login" className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors">
              Sign In
            </Link>
            <Link href="/signup" className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:shadow-lg transition-all hover:scale-105">
              Get Started
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
