"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Video, Loader2, AlertCircle, CheckCircle, Code2, PanelRightClose, PanelRightOpen, ArrowRight } from "lucide-react";
import { AnimatedButton } from "@/components/ui/animated-button";
import Editor from "@monaco-editor/react";

// Types
type Role = "user" | "model";
interface Message {
  role: Role;
  text: string;
}

interface Warning {
  time: string;
  type: string;
  message: string;
}

export default function InterviewSessionPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const topic = searchParams.get("topic") || "General";

  // States
  const [isInitializing, setIsInitializing] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [activeWarningText, setActiveWarningText] = useState<string | null>(null);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [userTranscript, setUserTranscript] = useState("");
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [code, setCode] = useState("// Write your code here\n");
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  // End of interview states
  const [isFinished, setIsFinished] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [finalFeedback, setFinalFeedback] = useState<string | null>(null);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const faceLandmarkerRef = useRef<any>(null);
  const lastVideoTimeRef = useRef(-1);
  const lastDetectionTimeRef = useRef(0);
  const animationFrameRef = useRef<number>(0);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const finalTranscriptRef = useRef("");
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioLevelRef = useRef<HTMLDivElement>(null);
  const isRecordingRef = useRef(false);
  const currentAnswerMetricsRef = useRef({ lookAwayCount: 0, voiceLevelSum: 0, voiceLevelCount: 0 });
  const isAiSpeakingRef = useRef(false);
  const currentAudioLevelRef = useRef(0);
  const lipSyncViolationCountRef = useRef(0);

  useEffect(() => {
    isAiSpeakingRef.current = isAiSpeaking;
  }, [isAiSpeaking]);

  // 1. Initialize Everything
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        // Setup Camera
        const videoId = searchParams.get("videoId");
        const audioId = searchParams.get("audioId");
        
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: videoId ? { deviceId: { exact: videoId } } : { facingMode: "user" }, 
            audio: audioId ? { deviceId: { exact: audioId } } : true 
          });
        } catch (fallbackErr) {
          console.warn("Preferred camera failed, falling back to defaults", fallbackErr);
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        }
        
        streamRef.current = stream;
        // Video assignment happens in a separate useEffect once the UI mounts!

        // Setup Audio Analyser
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;
        const analyser = audioContext.createAnalyser();
        analyserRef.current = analyser;
        const microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const checkLevel = () => {
          if (!mounted || !analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const average = sum / bufferLength;
          // Apply a noise gate to ignore background static
          const noiseFloor = 3;
          let normalized = 0;
          if (average > noiseFloor) {
            normalized = ((average - noiseFloor) / (128 - noiseFloor)) * 100;
          }
          currentAudioLevelRef.current = normalized;
          
          if (isRecordingRef.current && normalized > 0) {
            currentAnswerMetricsRef.current.voiceLevelSum += normalized;
            currentAnswerMetricsRef.current.voiceLevelCount++;
          }
          if (audioLevelRef.current) {
            audioLevelRef.current.style.width = `${Math.min(100, normalized)}%`;
          }
          requestAnimationFrame(checkLevel);
        };
        checkLevel();

        // Setup MediaPipe FaceLandmarker
        const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numFaces: 4 // Allow detecting up to 4 faces to ensure we catch friends entering the frame!
        });

        if (mounted) {
          setIsInitializing(false);
          startInterview();
        }
      } catch (err) {
        console.error("Initialization failed:", err);
        alert("Failed to initialize camera or AI. Please grant permissions.");
      }
    }

    init();

    return () => {
      mounted = false;
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (audioContextRef.current) audioContextRef.current.close();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      window.speechSynthesis.cancel();
    };
  }, []);

  // Ensure video stream connects AFTER loading screen disappears
  useEffect(() => {
    if (!isInitializing && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      startFaceTracking();
    }
  }, [isInitializing]);

  // 2. Face Tracking Loop
  const startFaceTracking = () => {
    const video = videoRef.current;
    if (!video || !faceLandmarkerRef.current) return;

    const renderLoop = () => {
      const now = performance.now();

      // Prevent crash: ensure video has valid dimensions before AI processing
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        animationFrameRef.current = requestAnimationFrame(renderLoop);
        return;
      }

      // Throttle face tracking to ~10 FPS (100ms) to massively save CPU and fix camera lag
      if (video.currentTime !== lastVideoTimeRef.current && now - lastDetectionTimeRef.current > 100) {
        lastVideoTimeRef.current = video.currentTime;
        lastDetectionTimeRef.current = now;
        const results = faceLandmarkerRef.current.detectForVideo(video, now);
        
        if (results.faceLandmarks && results.faceLandmarks.length > 0) {
          if (results.faceLandmarks.length > 1) {
            addWarning("multiple_faces", "Multiple faces detected! You must be alone.");
            if (isRecordingRef.current) currentAnswerMetricsRef.current.lookAwayCount++;
          }

          const face = results.faceLandmarks[0];
          // Simplified look-away detection
          const nose = face[1];
          const leftCheek = face[234];
          const rightCheek = face[454];

          const faceWidth = Math.abs(rightCheek.x - leftCheek.x);
          const noseRelativeX = (nose.x - leftCheek.x) / faceWidth;

          if (noseRelativeX < 0.2 || noseRelativeX > 0.8) {
            addWarning("looking_away", "You are looking away from the camera.");
            if (isRecordingRef.current) currentAnswerMetricsRef.current.lookAwayCount++;
          }
          
          // Lip sync detection: upper lip (13) and lower lip (14)
          const upperLip = face[13];
          const lowerLip = face[14];
          const mouthOpenDist = Math.abs(lowerLip.y - upperLip.y);
          
          const chin = face[152];
          const forehead = face[10];
          const faceHeight = Math.abs(chin.y - forehead.y);
          const relativeMouthOpen = mouthOpenDist / faceHeight;
          
          if (!isAiSpeakingRef.current && currentAudioLevelRef.current > 15 && relativeMouthOpen < 0.015) {
            lipSyncViolationCountRef.current++;
            // Require ~2 seconds (20 frames at 10fps) of CONTINUOUS loud voice with SEALED lips 
            // before assuming off-camera assistance. Normal speech will naturally reset this counter!
            if (lipSyncViolationCountRef.current > 20) {
              addWarning("lip_sync", "Voice detected without lip movement. Suspected off-camera assistance.");
              lipSyncViolationCountRef.current = 0;
            }
          } else {
            lipSyncViolationCountRef.current = 0;
          }
        } else {
          addWarning("no_face", "No face detected! Please stay in the camera frame.");
          if (isRecordingRef.current) currentAnswerMetricsRef.current.lookAwayCount++;
        }
      }
      animationFrameRef.current = requestAnimationFrame(renderLoop);
    };
    renderLoop();
  };

  const addWarning = (type: string, message: string) => {
    setWarnings(prev => {
      const lastWarning = prev[prev.length - 1];
      if (lastWarning && lastWarning.type === type) {
        const timeDiff = new Date().getTime() - new Date(lastWarning.time).getTime();
        if (timeDiff < 5000) return prev;
      }
      return [...prev, { time: new Date().toISOString(), type, message }];
    });

    setActiveWarningText(message);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    warningTimeoutRef.current = setTimeout(() => {
      setActiveWarningText(null);
    }, 4000);
  };

  useEffect(() => {
    if (warnings.length >= 3 && !isFinished) {
      setIsFinished(true);
      setFinalScore(0);
      setFinalFeedback("Interview automatically terminated due to excessive proctoring violations (" + warnings.length + " warnings).");
      if (mediaRecorderRef.current && isRecordingRef.current) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        isRecordingRef.current = false;
      }
    }
  }, [warnings, isFinished]);

  // Spacebar to toggle recording
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      if (e.code === "Space") {
        e.preventDefault();
        if (isAiSpeaking) return;
        
        if (isRecording) {
          stopRecording();
        } else {
          startRecording();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRecording, isAiSpeaking]);

  // 3. Interview Logic
  const startRecording = () => {
    if (!streamRef.current || isAiSpeaking || isTranscribing) return;
    try {
      // Groq handles full video/webm streams perfectly, stripping the audio track manually 
      // sometimes breaks WebM codec headers in MediaRecorder, causing API failures!
      const mediaRecorder = new MediaRecorder(streamRef.current);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await transcribeAudioAndSend(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      isRecordingRef.current = true;
      currentAnswerMetricsRef.current = { lookAwayCount: 0, voiceLevelSum: 0, voiceLevelCount: 0 };
    } catch (e) {
      console.error("MediaRecorder start failed", e);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      isRecordingRef.current = false;
    }
  };

  const transcribeAudioAndSend = async (blob: Blob) => {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append("file", blob);
      const res = await fetch("/api/ai/transcribe", {
        method: "POST",
        body: formData
      });
      if (!res.ok) throw new Error("Transcription failed");
      const data = await res.json();
      
      let finalAnswer = userTranscript;
      if (data.data && data.data.text) {
        finalAnswer = userTranscript + (userTranscript ? " " : "") + data.data.text.trim();
        setUserTranscript(finalAnswer);
      }
      submitAnswer(finalAnswer || "I am thinking...");
    } catch (e) {
      console.error(e);
      addWarning("transcription_failed", "Failed to transcribe audio automatically.");
      submitAnswer(userTranscript || "I am thinking...");
    } finally {
      setIsTranscribing(false);
    }
  };

  const startInterview = async () => {
    await sendToAI(true, "");
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUserTranscript(e.target.value);
    finalTranscriptRef.current = e.target.value; // Sync the speech API base text with manual edits
  };

  const submitAnswer = async (text: string) => {
    if (isAiSpeaking) return;
    setIsUserSpeaking(false);
    
    const fillerWords = (text.match(/\b(um|uh|like|you know)\b/gi) || []).length;
    if (fillerWords > 3) {
      addWarning("filler_words", `Used ${fillerWords} filler words (um, uh) in one answer.`);
    }

    setMessages(prev => [...prev, { role: "user", text: text.trim() }]);
    setUserTranscript("");
    finalTranscriptRef.current = "";

    const metrics = currentAnswerMetricsRef.current;
    const avgVoice = metrics.voiceLevelCount > 0 ? Math.round(metrics.voiceLevelSum / metrics.voiceLevelCount) : 0;
    const lookAways = metrics.lookAwayCount;
    
    const metaText = `\n\n[PROCTORING METRICS: The candidate used ${fillerWords} filler words. They looked away from the screen or were out of frame ${lookAways} times during this answer. Their average voice intensity was ${avgVoice}/100. Evaluate their confidence and discipline based on these metrics.]`;

    await sendToAI(false, text.trim() + metaText);
  };

  const sendToAI = async (isFirst: boolean, answer: string) => {
    try {
      const formattedHistory = messages.map(m => ({
        role: m.role === "model" ? "assistant" : "user",
        content: m.text
      }));

      const finalAnswer = showCodeEditor && code.trim() !== "// Write your code here"
        ? `${answer}\n\nHere is the code I wrote:\n${code}`
        : answer;

      const res = await fetch("/api/ai/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          history: formattedHistory,
          latestAnswer: finalAnswer,
          isFirstQuestion: isFirst
        })
      });

      if (!res.ok) throw new Error("AI Request Failed");
      
      const data = await res.json();
      const aiObj = data.data.aiResponse;

      if (aiObj.isFinished) {
        setIsFinished(true);
        setFinalScore(aiObj.finalScore);
        setFinalFeedback(aiObj.finalFeedback);
        speakText("The interview is now complete. Thank you for your time. Your evaluation is ready.");
      } else {
        const combinedText = [aiObj.feedbackOnLastAnswer, aiObj.nextQuestion].filter(Boolean).join(" ");
        setMessages(prev => [...prev, { role: "model", text: combinedText }]);
        speakText(combinedText);
      }

    } catch (error) {
      console.error(error);
      alert("Error communicating with AI");
    }
  };

  const speakText = (text: string) => {
    setIsAiSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance; // Prevent garbage collection bug
    
    const voices = window.speechSynthesis.getVoices();
    const indianVoice = voices.find(v => v.lang === "en-IN" && v.name.includes("Google")) || 
                        voices.find(v => v.lang === "en-IN") ||
                        voices.find(v => v.lang.startsWith("en-") && v.name.includes("Google")) || 
                        voices[0];
    if (indianVoice) utterance.voice = indianVoice;
    
    utterance.rate = 1.0;

    let finished = false;
    const finishSpeaking = () => {
      if (finished) return;
      finished = true;
      setIsAiSpeaking(false);
    };
    
    // Chrome bug fallback: if onend never fires, unlock after estimated time
    const words = text.split(" ").length;
    const estimatedMs = Math.max(3000, words * 400 + 1000);
    setTimeout(() => {
      if (!finished) {
        console.warn("TTS onend fallback triggered");
        finishSpeaking();
      }
    }, estimatedMs);

    utterance.onend = finishSpeaking;
    utterance.onerror = finishSpeaking;

    window.speechSynthesis.speak(utterance);
  };

  if (isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <h2 className="text-xl font-semibold">Initializing AI Proctoring...</h2>
        <p className="text-foreground/50">Loading facial recognition models & camera feed</p>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="max-w-4xl mx-auto pb-12">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass p-8 rounded-2xl text-center">
          <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Interview Complete</h1>
          <p className="text-foreground/70 mb-8">Here is your genuine AI recruiter evaluation.</p>

          <div className="grid md:grid-cols-2 gap-8 text-left mb-8">
            <div className="bg-slate-50 dark:bg-white/5 p-6 rounded-xl border border-slate-200 dark:border-white/10">
              <h3 className="text-xl font-semibold mb-4 text-primary">Final Score</h3>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-5xl font-bold">{finalScore}</span>
                <span className="text-foreground/50 pb-1">/ 100</span>
              </div>
              <p className="text-sm text-foreground/70">
                {finalScore! >= 80 ? "Excellent performance! You demonstrate strong knowledge." : 
                 finalScore! >= 60 ? "Good effort. Some areas need improvement." : 
                 "Needs practice. Don't be discouraged, keep learning!"}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-white/5 p-6 rounded-xl border border-slate-200 dark:border-white/10">
              <h3 className="text-xl font-semibold mb-4 text-orange-500">Proctoring Warnings</h3>
              {warnings.length === 0 ? (
                <p className="text-sm text-foreground/70 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" /> Perfect discipline during the interview.
                </p>
              ) : (
                <ul className="space-y-2 text-sm text-foreground/70 max-h-32 overflow-y-auto pr-2">
                  {warnings.map((w, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                      <span>{w.message}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-white/5 p-6 rounded-xl border border-slate-200 dark:border-white/10 text-left">
            <h3 className="text-xl font-semibold mb-4">Detailed Feedback</h3>
            <p className="text-foreground/80 whitespace-pre-line leading-relaxed">{finalFeedback}</p>
          </div>

          <AnimatedButton className="mt-8 px-8" onClick={() => router.push("/dashboard")}>
            Return to Dashboard
          </AnimatedButton>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full px-6 mx-auto h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex justify-between items-center mb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-primary">Technical Interview</h1>
          <p className="text-foreground/50 text-sm">Topic: {topic}</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setShowCodeEditor(!showCodeEditor)}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm hover:bg-white/10 transition-colors text-foreground"
          >
            {showCodeEditor ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
            {showCodeEditor ? "Hide Editor" : "Open Code Editor"}
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        
        {/* Left Side: Video & Status (Wider for better visibility) */}
        <div className="w-[400px] flex flex-col gap-4 flex-shrink-0 transition-all duration-300">
          
          {/* Main Video Feed */}
          <div className="relative bg-black rounded-2xl overflow-hidden shadow-lg border border-white/10 aspect-[4/3] flex-shrink-0">
            <video 
              ref={videoRef}
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover transform -scale-x-100"
            />
            
            {/* Status Overlays */}
            <div className="absolute top-4 left-4 flex gap-2">
              <div className="bg-black/50 backdrop-blur text-white px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 border border-white/10">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                Proctor
              </div>
            </div>

            <AnimatePresence>
              {activeWarningText && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute top-4 right-4 bg-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 shadow-lg max-w-[70%] z-10"
                >
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span className="truncate">{activeWarningText}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Audio Visualizer */}
          <div className="glass p-4 rounded-xl border border-white/10 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium flex items-center gap-2 text-foreground/80">
                <Mic className="w-4 h-4 text-primary" /> Mic Level
              </span>
              <span className="text-xs text-foreground/50">
                {isAiSpeaking ? "AI Speaking" : isUserSpeaking ? "Listening" : "Ready"}
              </span>
            </div>
            <div className="h-2 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
              <div 
                ref={audioLevelRef}
                className="h-full bg-primary transition-all duration-75 w-0"
              />
            </div>
          </div>
          
          {/* Big Toggle Button under Mic Level */}
          <button 
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isAiSpeaking || isTranscribing}
            className={`w-full py-4 rounded-xl transition-all flex items-center justify-center gap-3 font-medium text-lg mt-auto ${
              isRecording 
                ? "bg-red-500 text-white animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.5)] scale-[1.02]" 
                : isTranscribing
                ? "bg-amber-500 text-white shadow-md animate-pulse"
                : "bg-primary text-primary-foreground hover:bg-[#047857] shadow-md"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isRecording ? <div className="w-4 h-4 rounded-sm bg-white shrink-0" /> : <Mic className="w-6 h-6 shrink-0" />}
            {isTranscribing 
              ? "Transcribing Audio..." 
              : isRecording ? "Stop & Send (Space)" : "Tap to Speak (Space)"}
          </button>
        </div>

        {/* Middle Side: Captions Box (Fills remaining space) */}
        <div className="flex-1 glass rounded-2xl p-6 flex flex-col gap-4 border border-white/10 relative shadow-inner">
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            {messages.length === 0 && (
              <div className="text-center text-foreground/50 mt-10">
                Waiting for the interview to begin...
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-full w-full rounded-2xl px-5 py-4 text-[15px] leading-relaxed shadow-sm ${
                  m.role === "user" 
                    ? "bg-primary text-primary-foreground rounded-tr-sm" 
                    : "bg-white dark:bg-white/10 text-slate-800 dark:text-white rounded-tl-sm border border-slate-100 dark:border-white/5"
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input Bar */}
          <div className="mt-2 shrink-0 flex gap-3">
            <textarea
              value={userTranscript}
              onChange={handleTextChange}
              placeholder={isAiSpeaking ? "Waiting for AI..." : isTranscribing ? "Transcribing your audio..." : "Speak, or type your answer manually..."}
              disabled={isAiSpeaking || isTranscribing}
              className="flex-1 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-sm resize-none h-[60px] focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
            />
            <AnimatedButton 
              onClick={() => submitAnswer(userTranscript || "I am thinking...")}
              disabled={isAiSpeaking || isRecording || isTranscribing || (!userTranscript.trim() && !showCodeEditor)}
              className="!w-auto h-[60px] px-8 shrink-0 flex items-center justify-center"
            >
              Send <ArrowRight className="w-4 h-4 ml-2" />
            </AnimatedButton>
          </div>
        </div>

        {/* Right Side: Code Editor (Optional) */}
        <AnimatePresence>
          {showCodeEditor && (
            <motion.div 
              initial={{ opacity: 0, x: 50, width: 0 }}
              animate={{ opacity: 1, x: 0, width: "35%" }}
              exit={{ opacity: 0, x: 50, width: 0 }}
              className="glass rounded-2xl overflow-hidden border border-white/10 flex flex-col shadow-xl flex-shrink-0"
            >
              <div className="bg-slate-900 px-4 py-3 flex items-center gap-2 border-b border-white/10">
                <Code2 className="text-primary w-4 h-4" />
                <span className="text-sm font-mono text-white/70">Whiteboard.js</span>
              </div>
              <div className="flex-1">
                <Editor
                  height="100%"
                  defaultLanguage="javascript"
                  theme="vs-dark"
                  value={code}
                  onChange={(val) => setCode(val || "")}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    wordWrap: "on",
                    padding: { top: 16 }
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
      </div>
    </div>
  );
}
