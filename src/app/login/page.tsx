"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Mail, Sparkles, BookOpen, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedBackgroundPattern } from "@/components/ui/animated-background-pattern";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface PupilProps {
  size?: number;
  maxDistance?: number;
  pupilColor?: string;
  forceLookX?: number;
  forceLookY?: number;
}

const Pupil = ({ 
  size = 12, 
  maxDistance = 5,
  pupilColor = "black",
  forceLookX,
  forceLookY
}: PupilProps) => {
  const [mouseX, setMouseX] = useState<number>(0);
  const [mouseY, setMouseY] = useState<number>(0);
  const pupilRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const calculatePupilPosition = () => {
    if (!pupilRef.current) return { x: 0, y: 0 };

    if (forceLookX !== undefined && forceLookY !== undefined) {
      return { x: forceLookX, y: forceLookY };
    }

    const pupil = pupilRef.current.getBoundingClientRect();
    const pupilCenterX = pupil.left + pupil.width / 2;
    const pupilCenterY = pupil.top + pupil.height / 2;

    const deltaX = mouseX - pupilCenterX;
    const deltaY = mouseY - pupilCenterY;
    const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance);

    const angle = Math.atan2(deltaY, deltaX);
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;

    return { x, y };
  };

  const pupilPosition = calculatePupilPosition();

  return (
    <div
      ref={pupilRef}
      className="rounded-full"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: pupilColor,
        transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`,
        transition: 'transform 0.1s ease-out',
      }}
    />
  );
};

interface EyeBallProps {
  size?: number;
  pupilSize?: number;
  maxDistance?: number;
  eyeColor?: string;
  pupilColor?: string;
  isBlinking?: boolean;
  forceLookX?: number;
  forceLookY?: number;
}

const EyeBall = ({ 
  size = 48, 
  pupilSize = 16, 
  maxDistance = 10,
  eyeColor = "white",
  pupilColor = "black",
  isBlinking = false,
  forceLookX,
  forceLookY
}: EyeBallProps) => {
  const [mouseX, setMouseX] = useState<number>(0);
  const [mouseY, setMouseY] = useState<number>(0);
  const eyeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const calculatePupilPosition = () => {
    if (!eyeRef.current) return { x: 0, y: 0 };

    if (forceLookX !== undefined && forceLookY !== undefined) {
      return { x: forceLookX, y: forceLookY };
    }

    const eye = eyeRef.current.getBoundingClientRect();
    const eyeCenterX = eye.left + eye.width / 2;
    const eyeCenterY = eye.top + eye.height / 2;

    const deltaX = mouseX - eyeCenterX;
    const deltaY = mouseY - eyeCenterY;
    const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance);

    const angle = Math.atan2(deltaY, deltaX);
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;

    return { x, y };
  };

  const pupilPosition = calculatePupilPosition();

  return (
    <div
      ref={eyeRef}
      className="rounded-full flex items-center justify-center transition-all duration-150 shadow-inner"
      style={{
        width: `${size}px`,
        height: isBlinking ? '2px' : `${size}px`,
        backgroundColor: eyeColor,
        overflow: 'hidden',
      }}
    >
      {!isBlinking && (
        <div
          className="rounded-full"
          style={{
            width: `${pupilSize}px`,
            height: `${pupilSize}px`,
            backgroundColor: pupilColor,
            transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`,
            transition: 'transform 0.1s ease-out',
          }}
        />
      )}
    </div>
  );
};

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<"STUDENT" | "TEACHER" | "ADMIN">("STUDENT");
  const [showPassword, setShowPassword] = useState(false);
  const [mouseX, setMouseX] = useState<number>(0);
  const [mouseY, setMouseY] = useState<number>(0);
  const [isTallBlinking, setIsTallBlinking] = useState(false);
  const [isDarkBlinking, setIsDarkBlinking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isLookingAtEachOther, setIsLookingAtEachOther] = useState(false);
  const [isTallPeeking, setIsTallPeeking] = useState(false);

  // Forgot password states
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotRole, setForgotRole] = useState<"STUDENT" | "TEACHER" | "ADMIN">("STUDENT");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccessMessage, setForgotSuccessMessage] = useState("");
  const [forgotErrorMessage, setForgotErrorMessage] = useState("");

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;

    setForgotLoading(true);
    setForgotErrorMessage("");
    setForgotSuccessMessage("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, role: forgotRole }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }
      setForgotSuccessMessage(data.data?.message || "Reset link requested successfully.");
    } catch (err: any) {
      setForgotErrorMessage(err.message || "Failed to submit request.");
    } finally {
      setForgotLoading(false);
    }
  };
  
  const tallRef = useRef<HTMLDivElement>(null);
  const darkRef = useRef<HTMLDivElement>(null);
  const lightRef = useRef<HTMLDivElement>(null);
  const tinyRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const watchPassword = watch("password", "");

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormValues) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, expectedRole: selectedRole }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "An error occurred");
      }
      return result;
    },
    onSuccess: (data) => {
      router.push("/dashboard");
    },
    onError: (error: any) => {
      setError("root", { message: error.message });
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const getRandomBlinkInterval = () => Math.random() * 4000 + 3000;
    const scheduleBlink = () => {
      const blinkTimeout = setTimeout(() => {
        setIsTallBlinking(true);
        setTimeout(() => {
          setIsTallBlinking(false);
          scheduleBlink();
        }, 150);
      }, getRandomBlinkInterval());
      return blinkTimeout;
    };
    const timeout = scheduleBlink();
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const getRandomBlinkInterval = () => Math.random() * 4000 + 3000;
    const scheduleBlink = () => {
      const blinkTimeout = setTimeout(() => {
        setIsDarkBlinking(true);
        setTimeout(() => {
          setIsDarkBlinking(false);
          scheduleBlink();
        }, 150);
      }, getRandomBlinkInterval());
      return blinkTimeout;
    };
    const timeout = scheduleBlink();
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (isTyping) {
      setIsLookingAtEachOther(true);
      const timer = setTimeout(() => {
        setIsLookingAtEachOther(false);
      }, 800);
      return () => clearTimeout(timer);
    } else {
      setIsLookingAtEachOther(false);
    }
  }, [isTyping]);

  useEffect(() => {
    if (watchPassword.length > 0 && showPassword) {
      const schedulePeek = () => {
        const peekInterval = setTimeout(() => {
          setIsTallPeeking(true);
          setTimeout(() => {
            setIsTallPeeking(false);
          }, 800);
        }, Math.random() * 3000 + 2000);
        return peekInterval;
      };
      const firstPeek = schedulePeek();
      return () => clearTimeout(firstPeek);
    } else {
      setIsTallPeeking(false);
    }
  }, [watchPassword, showPassword, isTallPeeking]);

  const calculatePosition = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (!ref.current) return { faceX: 0, faceY: 0, bodyRotation: 0, bodySkew: 0 };

    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 3;

    const deltaX = mouseX - centerX;
    const deltaY = mouseY - centerY;

    const faceX = Math.max(-15, Math.min(15, deltaX / 20));
    const faceY = Math.max(-10, Math.min(10, deltaY / 30));

    const bodySkew = Math.max(-6, Math.min(6, -deltaX / 120));

    return { faceX, faceY, bodySkew };
  };

  const tallPos = calculatePosition(tallRef);
  const darkPos = calculatePosition(darkRef);
  const lightPos = calculatePosition(lightRef);
  const tinyPos = calculatePosition(tinyRef);

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col lg:grid lg:grid-cols-2 bg-background relative">
      {/* Left Content Section */}
      <div className="relative flex flex-col justify-between bg-primary/[0.03] border-b lg:border-b-0 lg:border-r border-slate-200/50 overflow-hidden p-6 lg:p-12 h-[35vh] lg:h-full w-full">
        <div className="relative z-20 shrink-0">
          <div className="flex items-center gap-2 text-lg lg:text-xl font-bold text-primary justify-center lg:justify-start">
            <BookOpen className="size-5 lg:size-6" />
            <span>LMS Portal</span>
          </div>
        </div>

        <div className="relative z-20 flex-1 flex flex-col items-center justify-center">
          <div className="text-center max-w-md hidden md:block">
            <h2 className="text-xl lg:text-2xl font-black tracking-tight text-slate-800">
              Learn. Grow. Succeed.
            </h2>
            <p className="text-slate-500 mt-2 text-xs lg:text-sm leading-relaxed hidden lg:block">
              Access your learning pathways, courses, and interactive AI companions in one unified workspace.
            </p>
          </div>

          <div className="mt-2 lg:mt-6 w-full flex items-center justify-center">
            {/* Animated Characters (Emerald Theme Palette) */}
            <div className="scale-[0.42] sm:scale-[0.55] md:scale-[0.65] lg:scale-[0.7] xl:scale-[0.9] origin-center transform transition-transform duration-300">
              <div className="relative" style={{ width: '550px', height: '400px' }}>
                
                {/* Tall Emerald Character (Main) */}
            <div 
              ref={tallRef}
              className="absolute bottom-0 transition-all duration-700 ease-in-out shadow-lg"
              style={{
                left: '70px',
                width: '180px',
                height: (isTyping || (watchPassword.length > 0 && !showPassword)) ? '440px' : '400px',
                backgroundColor: '#A855F7', // Purple 500
                borderRadius: '10px 10px 0 0',
                zIndex: 1,
                transform: (watchPassword.length > 0 && showPassword)
                  ? `skewX(0deg)`
                  : (isTyping || (watchPassword.length > 0 && !showPassword))
                    ? `skewX(${(tallPos.bodySkew || 0) - 12}deg) translateX(40px)` 
                    : `skewX(${tallPos.bodySkew || 0}deg)`,
                transformOrigin: 'bottom center',
              }}
            >
              <div 
                className="absolute flex gap-8 transition-all duration-700 ease-in-out"
                style={{
                  left: (watchPassword.length > 0 && showPassword) ? `${20}px` : isLookingAtEachOther ? `${55}px` : `${45 + tallPos.faceX}px`,
                  top: (watchPassword.length > 0 && showPassword) ? `${35}px` : isLookingAtEachOther ? `${65}px` : `${40 + tallPos.faceY}px`,
                }}
              >
                <EyeBall 
                  size={18} pupilSize={7} maxDistance={5} 
                  isBlinking={isTallBlinking}
                  forceLookX={(watchPassword.length > 0 && showPassword) ? (isTallPeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined}
                  forceLookY={(watchPassword.length > 0 && showPassword) ? (isTallPeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined}
                />
                <EyeBall 
                  size={18} pupilSize={7} maxDistance={5} 
                  isBlinking={isTallBlinking}
                  forceLookX={(watchPassword.length > 0 && showPassword) ? (isTallPeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined}
                  forceLookY={(watchPassword.length > 0 && showPassword) ? (isTallPeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined}
                />
              </div>
            </div>

            {/* Dark Slate Character */}
            <div 
              ref={darkRef}
              className="absolute bottom-0 transition-all duration-700 ease-in-out shadow-xl"
              style={{
                left: '240px',
                width: '120px',
                height: '310px',
                backgroundColor: '#1E1B4B', // Dark Indigo
                borderRadius: '8px 8px 0 0',
                zIndex: 2,
                transform: (watchPassword.length > 0 && showPassword)
                  ? `skewX(0deg)`
                  : isLookingAtEachOther
                    ? `skewX(${(darkPos.bodySkew || 0) * 1.5 + 10}deg) translateX(20px)`
                    : (isTyping || (watchPassword.length > 0 && !showPassword))
                      ? `skewX(${(darkPos.bodySkew || 0) * 1.5}deg)` 
                      : `skewX(${darkPos.bodySkew || 0}deg)`,
                transformOrigin: 'bottom center',
              }}
            >
              <div 
                className="absolute flex gap-6 transition-all duration-700 ease-in-out"
                style={{
                  left: (watchPassword.length > 0 && showPassword) ? `${10}px` : isLookingAtEachOther ? `${32}px` : `${26 + darkPos.faceX}px`,
                  top: (watchPassword.length > 0 && showPassword) ? `${28}px` : isLookingAtEachOther ? `${12}px` : `${32 + darkPos.faceY}px`,
                }}
              >
                <EyeBall 
                  size={16} pupilSize={6} maxDistance={4} 
                  isBlinking={isDarkBlinking}
                  forceLookX={(watchPassword.length > 0 && showPassword) ? -4 : isLookingAtEachOther ? 0 : undefined}
                  forceLookY={(watchPassword.length > 0 && showPassword) ? -4 : isLookingAtEachOther ? -4 : undefined}
                />
                <EyeBall 
                  size={16} pupilSize={6} maxDistance={4} 
                  isBlinking={isDarkBlinking}
                  forceLookX={(watchPassword.length > 0 && showPassword) ? -4 : isLookingAtEachOther ? 0 : undefined}
                  forceLookY={(watchPassword.length > 0 && showPassword) ? -4 : isLookingAtEachOther ? -4 : undefined}
                />
              </div>
            </div>

            {/* Light Teal Character */}
            <div 
              ref={lightRef}
              className="absolute bottom-0 transition-all duration-700 ease-in-out shadow-md"
              style={{
                left: '0px',
                width: '240px',
                height: '200px',
                zIndex: 3,
                backgroundColor: '#14B8A6', // Electric Teal
                borderRadius: '120px 120px 0 0',
                transform: (watchPassword.length > 0 && showPassword) ? `skewX(0deg)` : `skewX(${lightPos.bodySkew || 0}deg)`,
                transformOrigin: 'bottom center',
              }}
            >
              <div 
                className="absolute flex gap-8 transition-all duration-200 ease-out bg-white py-2 px-4 rounded-full shadow-inner"
                style={{
                  left: (watchPassword.length > 0 && showPassword) ? `${50}px` : `${82 + (lightPos.faceX || 0)}px`,
                  top: (watchPassword.length > 0 && showPassword) ? `${85}px` : `${90 + (lightPos.faceY || 0)}px`,
                }}
              >
                <Pupil size={14} maxDistance={5} pupilColor="#0F172A" forceLookX={(watchPassword.length > 0 && showPassword) ? -5 : undefined} forceLookY={(watchPassword.length > 0 && showPassword) ? -4 : undefined} />
                <Pupil size={14} maxDistance={5} pupilColor="#0F172A" forceLookX={(watchPassword.length > 0 && showPassword) ? -5 : undefined} forceLookY={(watchPassword.length > 0 && showPassword) ? -4 : undefined} />
              </div>
            </div>

            {/* Tiny Mint Character */}
            <div 
              ref={tinyRef}
              className="absolute bottom-0 transition-all duration-700 ease-in-out shadow-sm"
              style={{
                left: '310px',
                width: '140px',
                height: '230px',
                backgroundColor: '#FBBF24', // Soft Gold
                borderRadius: '70px 70px 0 0',
                zIndex: 4,
                transform: (watchPassword.length > 0 && showPassword) ? `skewX(0deg)` : `skewX(${tinyPos.bodySkew || 0}deg)`,
                transformOrigin: 'bottom center',
              }}
            >
              <div 
                className="absolute flex gap-6 transition-all duration-200 ease-out bg-white py-2 px-3 rounded-full shadow-inner"
                style={{
                  left: (watchPassword.length > 0 && showPassword) ? `${20}px` : `${48 + (tinyPos.faceX || 0)}px`,
                  top: (watchPassword.length > 0 && showPassword) ? `${35}px` : `${40 + (tinyPos.faceY || 0)}px`,
                }}
              >
                <Pupil size={12} maxDistance={5} pupilColor="#0F172A" forceLookX={(watchPassword.length > 0 && showPassword) ? -5 : undefined} forceLookY={(watchPassword.length > 0 && showPassword) ? -4 : undefined} />
                <Pupil size={12} maxDistance={5} pupilColor="#0F172A" forceLookX={(watchPassword.length > 0 && showPassword) ? -5 : undefined} forceLookY={(watchPassword.length > 0 && showPassword) ? -4 : undefined} />
              </div>
              <div 
                className="absolute w-20 h-[4px] bg-[#0F172A] rounded-full transition-all duration-200 ease-out opacity-60"
                style={{
                  left: (watchPassword.length > 0 && showPassword) ? `${10}px` : `${40 + (tinyPos.faceX || 0)}px`,
                  top: (watchPassword.length > 0 && showPassword) ? `${88}px` : `${88 + (tinyPos.faceY || 0)}px`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>

        <div className="relative z-20 hidden lg:flex items-center gap-8 text-xs text-primary/60 font-medium shrink-0">
          <Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link>
          <Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link>
          <Link href="#" className="hover:text-primary transition-colors">Contact</Link>
        </div>

        {/* Decorative elements */}
        <div className="absolute inset-0 bg-grid-primary/[0.03] bg-[size:20px_20px]" />
        <div className="absolute top-1/4 right-1/4 size-64 bg-primary/20 rounded-full blur-3xl opacity-50 animate-pulse" />
      </div>

      {/* Right Login Section */}
      <div className="flex-1 lg:h-full flex items-center justify-center p-4 sm:p-8 bg-background relative z-10 shadow-[-20px_0_40px_-10px_rgba(0,0,0,0.05)] overflow-hidden">
        <AnimatedBackgroundPattern />
        
        {/* Login Card */}
        <div className="glass w-full max-w-[480px] p-6 lg:p-8 rounded-[24px] border border-border shadow-xl bg-white/95 relative z-20 transition-all duration-300">
          
          <div className="text-center mb-6">
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-800 mb-1 lg:mb-2">Welcome back!</h1>
            <p className="text-slate-500 text-xs lg:text-sm">Please sign in to your account.</p>
          </div>

          {errors.root && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs text-center font-medium">
              {errors.root.message}
            </div>
          )}

          {/* Role selector */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-6 relative border border-slate-200">
            {["STUDENT", "TEACHER", "ADMIN"].map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setSelectedRole(role as any)}
                className={`flex-1 py-1.5 text-xs lg:text-sm font-semibold rounded-lg z-10 transition-colors ${
                  selectedRole === role ? "text-white" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {role.charAt(0) + role.slice(1).toLowerCase()}
              </button>
            ))}
            <motion.div
              className="absolute top-1 bottom-1 bg-primary rounded-lg z-0 shadow-sm"
              initial={false}
              animate={{
                width: "calc(33.333% - 4px)",
                x: selectedRole === "STUDENT" ? "4px" : selectedRole === "TEACHER" ? "calc(100% + 4px)" : "calc(200% + 4px)"
              }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs lg:text-sm font-semibold text-slate-700">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="off"
                {...register("email")}
                onFocus={() => setIsTyping(true)}
                onBlur={() => setIsTyping(false)}
                className={cn("h-10 lg:h-11 bg-background border-slate-200 text-slate-800 focus:border-primary text-sm", errors.email && "border-destructive focus:border-destructive")}
              />
              {errors.email && <span className="text-xs text-destructive mt-1 block">{errors.email.message}</span>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs lg:text-sm font-semibold text-slate-700">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("password")}
                  className={cn("h-10 lg:h-11 pr-10 bg-background border-slate-200 text-slate-800 focus:border-primary text-sm", errors.password && "border-destructive focus:border-destructive")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="size-4 lg:size-5" /> : <Eye className="size-4 lg:size-5" />}
                </button>
              </div>
              {errors.password && <span className="text-xs text-destructive mt-1 block">{errors.password.message}</span>}
            </div>

            <div className="flex items-center justify-end py-1">
              <button 
                type="button"
                onClick={() => {
                  setForgotEmail("");
                  setForgotSuccessMessage("");
                  setForgotErrorMessage("");
                  setForgotRole(selectedRole);
                  setShowForgotModal(true);
                }}
                className="text-xs lg:text-sm text-primary hover:underline font-semibold"
              >
                Forgot password?
              </button>
            </div>

            <Button 
              type="submit" 
              className="w-full h-10 lg:h-11 text-sm lg:text-base font-semibold shadow-lg shadow-primary/20 mt-2" 
              size="lg" 
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Signing in..." : "Log in"}
            </Button>
          </form>

          {/* Footer Register Link */}
          <div className="text-center text-xs lg:text-sm text-slate-500 mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-primary font-bold hover:underline ml-1">
              Sign Up
            </Link>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 w-full max-w-md relative"
            >
              <button 
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="size-5" />
              </button>
              
              <h2 className="text-xl font-bold text-slate-800 mb-2">Reset Password</h2>
              <p className="text-sm text-slate-500 mb-4">
                Enter your email and select your role to request a password reset.
              </p>
              
              {forgotErrorMessage && (
                <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
                  {forgotErrorMessage}
                </div>
              )}

              {forgotSuccessMessage ? (
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                    {forgotSuccessMessage}
                  </div>
                  <Button 
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="w-full h-10 font-semibold"
                  >
                    Close
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="forgot-email" className="text-xs font-semibold text-slate-700">Email Address</Label>
                    <Input 
                      id="forgot-email"
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="h-10 border-slate-200 text-slate-800 focus:border-primary text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Your Role</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["STUDENT", "TEACHER", "ADMIN"] as const).map((role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setForgotRole(role)}
                          className={cn(
                            "py-2 text-xs font-semibold rounded-lg border transition-all",
                            forgotRole === role 
                              ? "bg-primary text-white border-primary shadow-sm" 
                              : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                          )}
                        >
                          {role.charAt(0) + role.slice(1).toLowerCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-10 font-semibold shadow-md shadow-primary/10 mt-2"
                    disabled={forgotLoading}
                  >
                    {forgotLoading ? "Sending request..." : "Send Reset Link"}
                  </Button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
