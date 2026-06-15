"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mic, Video, VideoOff, MicOff, Settings, Play } from "lucide-react";
import { AnimatedButton } from "@/components/ui/animated-button";

export default function InterviewSetupPage() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [hasVideo, setHasVideo] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  
  // Devices
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>("");
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const setupMedia = useCallback(async (videoId?: string, audioId?: string) => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }

      const constraints: MediaStreamConstraints = {
        video: videoId ? { deviceId: { exact: videoId } } : { facingMode: "user" },
        audio: audioId ? { deviceId: { exact: audioId } } : true,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const videoTracks = stream.getVideoTracks();
      if (videoTracks.length > 0) setHasVideo(true);

      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length > 0) {
        setHasAudio(true);
        setupAudioLevel(stream);
      }

      // Enumerate devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const vDevices = devices.filter(d => d.kind === "videoinput");
      const aDevices = devices.filter(d => d.kind === "audioinput");
      setVideoDevices(vDevices);
      setAudioDevices(aDevices);

      // Set initial selected if not provided
      if (!videoId && videoTracks.length > 0) {
        const activeVideoId = videoTracks[0].getSettings().deviceId;
        if (activeVideoId) setSelectedVideoDevice(activeVideoId);
      }
      if (!audioId && audioTracks.length > 0) {
        const activeAudioId = audioTracks[0].getSettings().deviceId;
        if (activeAudioId) setSelectedAudioDevice(activeAudioId);
      }
    } catch (err) {
      console.error("Failed to get media devices:", err);
    }
  }, []);

  useEffect(() => {
    setupMedia();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [setupMedia]);

  const setupAudioLevel = (stream: MediaStream) => {
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
      if (!analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;
      setAudioLevel(Math.min(100, (average / 128) * 100)); // Normalize to 0-100
      requestAnimationFrame(checkLevel);
    };
    checkLevel();
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    setSelectedVideoDevice(newId);
    setupMedia(newId, selectedAudioDevice);
  };

  const handleAudioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    setSelectedAudioDevice(newId);
    setupMedia(selectedVideoDevice, newId);
  };

  const handleStart = () => {
    if (!topic.trim()) return;
    let url = `/dashboard/interview/session?topic=${encodeURIComponent(topic.trim())}`;
    if (selectedVideoDevice) url += `&videoId=${selectedVideoDevice}`;
    if (selectedAudioDevice) url += `&audioId=${selectedAudioDevice}`;
    router.push(url);
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <h1 className="text-3xl font-bold text-primary mb-2">AI Interview Trainer</h1>
        <p className="text-foreground/70 max-w-2xl mx-auto">
          Prepare for your dream job with our proctored AI interviewer. Configure your topic and check your equipment below.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Left Side: Topic & Rules */}
        <div className="space-y-6">
          <div className="glass p-6 rounded-2xl">
            <h2 className="text-xl font-semibold mb-4 text-foreground">Interview Topic</h2>
            <label className="block text-sm font-medium text-foreground/70 mb-2">What would you like to be interviewed on?</label>
            <input 
              type="text" 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Data Structures, React.js, System Design"
              className="w-full bg-white/50 backdrop-blur-sm border border-slate-300 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-800"
            />
          </div>

          <div className="glass p-6 rounded-2xl border border-slate-300">
            <h2 className="text-xl font-bold mb-4 text-slate-800">Instructions & Proctoring</h2>
            <ul className="space-y-3 text-sm text-slate-600 font-medium">
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span>Speak clearly. The AI will listen and auto-submit your answer when you pause.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span>Ensure your face is visible. Our AI proctor tracks head movement and warns you if you look away.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span>Avoid filler words (um, uh). The system will analyze your confidence.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span>You can use the built-in code editor for technical questions.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Side: Media Preview */}
        <div className="space-y-6">
          <div className="glass p-6 rounded-2xl border border-slate-300">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800">
              <Settings className="w-5 h-5" /> Equipment Check
            </h2>
            
            <div className="aspect-video bg-black rounded-xl overflow-hidden relative mb-4">
              <video 
                ref={videoRef}
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover transform -scale-x-100"
              />
              {!hasVideo && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50">
                  <VideoOff className="w-12 h-12 mb-2" />
                  <p>Camera not detected</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {/* Camera Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {hasVideo ? <Video className="w-5 h-5 text-emerald-500" /> : <VideoOff className="w-5 h-5 text-red-500" />}
                    <span className="text-sm font-semibold text-slate-700">Camera</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-bold ${hasVideo ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                    {hasVideo ? 'Ready' : 'Missing'}
                  </span>
                </div>
                {videoDevices.length > 0 && (
                  <select 
                    value={selectedVideoDevice} 
                    onChange={handleVideoChange}
                    className="w-full text-sm bg-white/50 backdrop-blur-sm border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-primary text-slate-800"
                  >
                    {videoDevices.map(device => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Camera ${device.deviceId.substring(0, 5)}...`}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Audio Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {hasAudio ? <Mic className="w-5 h-5 text-emerald-500" /> : <MicOff className="w-5 h-5 text-red-500" />}
                    <span className="text-sm font-semibold text-slate-700">Microphone</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-bold ${hasAudio ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                    {hasAudio ? 'Ready' : 'Missing'}
                  </span>
                </div>
                {audioDevices.length > 0 && (
                  <select 
                    value={selectedAudioDevice} 
                    onChange={handleAudioChange}
                    className="w-full text-sm bg-white/50 backdrop-blur-sm border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-primary text-slate-800"
                  >
                    {audioDevices.map(device => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Microphone ${device.deviceId.substring(0, 5)}...`}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Audio Level Indicator */}
              {hasAudio && (
                <div>
                  <div className="flex justify-between text-xs text-foreground/50 mb-1">
                    <span>Mic Level</span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-75"
                      style={{ width: `${audioLevel}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <AnimatedButton 
            className="w-full flex items-center justify-center gap-2"
            disabled={!topic.trim() || !hasVideo || !hasAudio}
            onClick={handleStart}
          >
            <Play className="w-5 h-5" /> Start Interview
          </AnimatedButton>
        </div>
      </div>
    </div>
  );
}
