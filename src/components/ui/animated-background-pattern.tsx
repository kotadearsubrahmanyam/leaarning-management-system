"use client";

export function AnimatedBackgroundPattern() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none opacity-40 dark:opacity-20 mix-blend-overlay">
      <svg
        className="absolute w-[200vw] h-[200vh] -top-[50vh] -left-[50vw] animate-float-slow"
        viewBox="0 0 1000 1000"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="aura-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
            <stop offset="50%" stopColor="hsl(var(--secondary))" stopOpacity="0.1" />
            <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.2" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="10" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <g stroke="url(#aura-grad)" fill="none" strokeWidth="2" filter="url(#glow)">
          {/* Topographical / Tribal lines */}
          <path d="M-200,200 Q250,-100 500,250 T1200,300" className="animate-pulse-glow" />
          <path d="M-100,400 Q350,100 600,450 T1300,500" className="animate-pulse-glow" style={{ animationDelay: '0.5s' }} />
          <path d="M-50,600 Q450,300 700,650 T1400,700" className="animate-pulse-glow" style={{ animationDelay: '1s' }} />
          <path d="M-150,800 Q300,500 550,850 T1250,900" className="animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
          
          <path d="M200,-200 Q-100,250 250,500 T300,1200" className="animate-pulse-glow" style={{ animationDelay: '2s' }} />
          <path d="M400,-100 Q100,350 450,600 T500,1300" className="animate-pulse-glow" style={{ animationDelay: '2.5s' }} />
          <path d="M600,-50 Q300,450 650,700 T700,1400" className="animate-pulse-glow" style={{ animationDelay: '3s' }} />
          <path d="M800,-150 Q500,300 850,550 T900,1250" className="animate-pulse-glow" style={{ animationDelay: '3.5s' }} />
        </g>
      </svg>
      {/* Background blobs for depth */}
      <div className="absolute top-[20%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-primary/10 blur-[100px] animate-blob mix-blend-multiply dark:mix-blend-lighten" />
      <div className="absolute top-[40%] right-[20%] w-[30vw] h-[30vw] rounded-full bg-secondary/10 blur-[100px] animate-blob animation-delay-2000 mix-blend-multiply dark:mix-blend-lighten" />
      <div className="absolute bottom-[20%] left-[40%] w-[35vw] h-[35vw] rounded-full bg-accent/10 blur-[100px] animate-blob animation-delay-4000 mix-blend-multiply dark:mix-blend-lighten" />
    </div>
  );
}
