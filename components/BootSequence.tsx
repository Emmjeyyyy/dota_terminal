import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const BOOT_LOGS = [
  "INITIALIZING ON POTATO HARDWARE...",
  "CONNECTING TO SEA SERVER (PRAYING FOR LOW PING)...",
  "LOADING HERO POOL YOU NEVER ACTUALLY PLAY...",
  "BANNING INVOKER...",
  "SCANNING FOR POS 5 WHO FORGOT WARDS...",
  "DETECTING SMURFS AND QUESTIONABLE MATCHES...",
  "RECALIBRATING MMR AFTER LAST NIGHT'S LOSING STREAK...",
  "LOADING TEAM COMMUNICATION MODULE (ERROR: DISCONNECTED SUPPORT)...",
  "CHECKING INVENTORY FOR UNBUILT BLACK KING BAR...",
  "ANALYZING MINIMAP IGNORE RATE...",
  "WARNING: SUPPORT HAS ENTERED CORE FARMING MODE...",
  "LOADING HIGH RISK HIGH COPIUM STRATEGIES...",
  "RENDERING EXCUSES FOR LAST MATCH PERFORMANCE...",
  "SCANNING TEAM FOR GLYPH BUTTON PANIC PRESSER...",
  "PATCHING EXISTENTIAL REGRET FROM LAST TEAMFIGHT...",
  "FINALIZING MATCH PARAMETERS...",
  "SYSTEM READY. GOOD LUCK, YOU'LL NEED IT."
];

interface BootSequenceProps {
  onComplete: () => void;
}

const renderLog = (log: string) => {
  if (!log) return null;
  const errorMatch = log.match(/(\(ERROR:[^)]+\)(?:\.\.\.)?)/);
  if (errorMatch) {
    const parts = log.split(errorMatch[1]);
    return (
      <>
        {parts[0]}
        <span className="text-red-500 font-bold">{errorMatch[1]}</span>
        {parts[1]}
      </>
    );
  }

  if (log.includes("WARNING:")) {
    const parts = log.split("WARNING:");
    return (
      <>
        {parts[0]}
        <span className="text-yellow-400 font-bold">WARNING:{parts[1]}</span>
      </>
    );
  }

  return log;
};

const BootSequence: React.FC<BootSequenceProps> = ({ onComplete }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false);

  useEffect(() => {
    let currentLogIndex = 0;
    let timeouts: ReturnType<typeof setTimeout>[] = [];

    const addNextLog = () => {
      if (currentLogIndex < BOOT_LOGS.length) {
        setLogs(prev => [...prev, BOOT_LOGS[currentLogIndex]]);
        currentLogIndex++;
        // Random delay between logs for realism (150ms to 400ms)
        const delay = Math.random() * 250 + 150;
        timeouts.push(setTimeout(addNextLog, delay));
      } else {
        setShowProgress(true);
      }
    };

    // Start sequence after a small delay
    timeouts.push(setTimeout(addNextLog, 500));

    return () => timeouts.forEach(clearTimeout);
  }, []);

  // Handle Progress Bar
  useEffect(() => {
    if (!showProgress) return;

    let currentProgress = 0;
    const progressInterval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 12 + 8);
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(progressInterval);
        setProgress(100);
        // Delay slightly before transitioning
        setTimeout(() => onComplete(), 600);
      } else {
        setProgress(currentProgress);
      }
    }, 120);

    return () => clearInterval(progressInterval);
  }, [showProgress, onComplete]);

  return (
    <div className="fixed inset-0 z-[1000] bg-black text-theme font-mono p-4 sm:p-8 flex flex-col justify-end overflow-hidden select-none">
      <div className="absolute inset-0 scanlines pointer-events-none" />
      <div className="absolute inset-0 crt-overlay pointer-events-none" />

      <div className="flex-1 overflow-hidden flex flex-col justify-end max-w-5xl mx-auto w-full relative z-10 pb-12 sm:pb-24">
        <div className="space-y-2 md:space-y-3 mb-6">
          {logs.map((log, i) => (
            <div key={i} className="text-sm sm:text-base md:text-xl lg:text-2xl opacity-80 glow-text break-all">
              <span className="text-theme-dim mr-2">{'>'}</span> {renderLog(log)}
            </div>
          ))}
          {/* Active typing cursor */}
          {!showProgress && (
            <div className="text-sm sm:text-base md:text-xl lg:text-2xl glow-text">
              <span className="text-theme-dim mr-2">{'>'}</span><span className="animate-blink">█</span>
            </div>
          )}
        </div>

        {showProgress && (
          <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-2 text-sm sm:text-base md:text-xl lg:text-2xl glow-text">
            <span>[</span>
            <span className="font-bold tracking-[0.2em]">{Array(40).fill(0).map((_, i) => i < (progress / 2.5) ? '█' : '\u00A0').join('')}</span>
            <span>]</span>
            <span className="ml-2">{progress}%</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default BootSequence;
