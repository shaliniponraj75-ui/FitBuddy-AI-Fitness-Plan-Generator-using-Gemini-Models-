import React, { useState, useEffect, useRef } from "react";
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Minimize2,
  Maximize2,
  X,
  Zap,
  Flame,
  Clock,
  CheckCircle,
} from "lucide-react";

interface WorkoutTimerProps {
  initialSeconds?: number;
  isOpen: boolean;
  onClose: () => void;
  triggerKey?: number; // Changes whenever an external rest button is clicked
}

export const WorkoutTimer: React.FC<WorkoutTimerProps> = ({
  initialSeconds = 60,
  isOpen,
  onClose,
  triggerKey,
}) => {
  const [mode, setMode] = useState<"rest" | "interval" | "stopwatch">("rest");
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [totalSeconds, setTotalSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Tabata / Interval state
  const [workTime, setWorkTime] = useState(30);
  const [restTime, setRestTime] = useState(15);
  const [rounds, setRounds] = useState(8);
  const [currentRound, setCurrentRound] = useState(1);
  const [isWorkPhase, setIsWorkPhase] = useState(true);

  // Stopwatch state
  const [stopwatchElapsed, setStopwatchElapsed] = useState(0);

  const audioCtxRef = useRef<AudioContext | null>(null);

  // Sound generator using Web Audio API
  const playChime = (type: "beep" | "finish") => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      if (type === "beep") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(660, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else {
        // Double triumphant beep
        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.frequency.setValueAtTime(880, now);
        gain1.gain.setValueAtTime(0.2, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.25);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.frequency.setValueAtTime(1174.66, now + 0.25);
        gain2.gain.setValueAtTime(0.25, now + 0.25);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.25);
        osc2.stop(now + 0.6);
      }
    } catch (e) {
      // AudioContext could be blocked by browser policy until user gesture
    }
  };

  // React to trigger key changes (e.g. clicking "Rest 60s" from workout card)
  useEffect(() => {
    if (initialSeconds > 0) {
      setMode("rest");
      setTotalSeconds(initialSeconds);
      setSecondsLeft(initialSeconds);
      setIsRunning(true);
      setIsMinimized(false);
    }
  }, [triggerKey, initialSeconds]);

  // Timer Tick Hook
  useEffect(() => {
    let interval: any = null;

    if (isRunning) {
      interval = setInterval(() => {
        if (mode === "rest") {
          setSecondsLeft((prev) => {
            if (prev <= 1) {
              playChime("finish");
              setIsRunning(false);
              return 0;
            }
            if (prev <= 4) {
              playChime("beep");
            }
            return prev - 1;
          });
        } else if (mode === "interval") {
          setSecondsLeft((prev) => {
            if (prev <= 1) {
              playChime(isWorkPhase ? "beep" : "finish");
              if (isWorkPhase) {
                // Switch to Rest Phase
                setIsWorkPhase(false);
                return restTime;
              } else {
                // Rest phase finished
                if (currentRound >= rounds) {
                  // Workout complete
                  playChime("finish");
                  setIsRunning(false);
                  setCurrentRound(1);
                  setIsWorkPhase(true);
                  return workTime;
                } else {
                  setCurrentRound((r) => r + 1);
                  setIsWorkPhase(true);
                  return workTime;
                }
              }
            }
            return prev - 1;
          });
        } else if (mode === "stopwatch") {
          setStopwatchElapsed((prev) => prev + 1);
        }
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, mode, isWorkPhase, currentRound, rounds, workTime, restTime]);

  const selectRestPreset = (sec: number) => {
    setTotalSeconds(sec);
    setSecondsLeft(sec);
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    if (mode === "rest") {
      setSecondsLeft(totalSeconds);
    } else if (mode === "interval") {
      setCurrentRound(1);
      setIsWorkPhase(true);
      setSecondsLeft(workTime);
    } else {
      setStopwatchElapsed(0);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? "0" : ""}${remainder}`;
  };

  if (!isOpen) return null;

  // Minimized Widget View (floating bottom-right pill)
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-4 py-2.5 rounded-full shadow-2xl border border-blue-500/50 backdrop-blur animate-bounce-short">
        <div className="flex items-center gap-2">
          <Timer className={`w-4 h-4 ${isRunning ? "text-blue-400 animate-spin" : "text-slate-400"}`} />
          <span className="font-mono text-base font-extrabold tracking-wider">
            {mode === "stopwatch" ? formatTime(stopwatchElapsed) : formatTime(secondsLeft)}
          </span>
          {mode === "interval" && (
            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${isWorkPhase ? "bg-rose-500" : "bg-emerald-500"}`}>
              {isWorkPhase ? "Work" : "Rest"} R{currentRound}/{rounds}
            </span>
          )}
        </div>

        <button
          onClick={() => setIsRunning(!isRunning)}
          className="p-1 rounded-full bg-blue-600 hover:bg-blue-500 text-white transition-colors"
        >
          {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={() => setIsMinimized(false)}
          className="p-1 rounded-full text-slate-400 hover:text-white"
          title="Expand Timer"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onClose}
          className="p-1 rounded-full text-slate-400 hover:text-rose-400"
          title="Close Timer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // Expanded View Modal / Float Card
  return (
    <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm bg-slate-900/95 backdrop-blur-md text-white rounded-2xl shadow-2xl border border-slate-700/80 p-5 transition-all">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Timer className="w-5 h-5 text-blue-400" />
          <h3 className="font-bold text-sm tracking-wide">Workout Timer</h3>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              soundEnabled ? "text-blue-400 bg-slate-800" : "text-slate-500 hover:text-slate-300"
            }`}
            title={soundEnabled ? "Sound Enabled" : "Sound Muted"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Minimize"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="grid grid-cols-3 gap-1 bg-slate-800 p-1 rounded-xl mb-4 text-xs font-semibold">
        <button
          onClick={() => {
            setMode("rest");
            setIsRunning(false);
          }}
          className={`py-1.5 rounded-lg transition-colors ${
            mode === "rest" ? "bg-blue-600 text-white shadow-xs font-bold" : "text-slate-400 hover:text-white"
          }`}
        >
          Rest Timer
        </button>
        <button
          onClick={() => {
            setMode("interval");
            setIsRunning(false);
            setSecondsLeft(workTime);
            setIsWorkPhase(true);
            setCurrentRound(1);
          }}
          className={`py-1.5 rounded-lg transition-colors ${
            mode === "interval" ? "bg-blue-600 text-white shadow-xs font-bold" : "text-slate-400 hover:text-white"
          }`}
        >
          HIIT / Tabata
        </button>
        <button
          onClick={() => {
            setMode("stopwatch");
            setIsRunning(false);
          }}
          className={`py-1.5 rounded-lg transition-colors ${
            mode === "stopwatch" ? "bg-blue-600 text-white shadow-xs font-bold" : "text-slate-400 hover:text-white"
          }`}
        >
          Stopwatch
        </button>
      </div>

      {/* Main Display */}
      <div className="text-center py-4 bg-slate-950/70 rounded-2xl border border-slate-800/80 mb-4 relative overflow-hidden">
        {mode === "interval" && (
          <div className="flex items-center justify-center gap-2 mb-1">
            <span
              className={`text-xs uppercase font-extrabold px-2.5 py-0.5 rounded-full ${
                isWorkPhase ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              }`}
            >
              {isWorkPhase ? "🔥 WORK PHASE" : "🧘 REST PHASE"}
            </span>
            <span className="text-xs text-slate-400 font-semibold">
              Round {currentRound} of {rounds}
            </span>
          </div>
        )}

        <div className="font-mono text-5xl font-black tracking-tight text-white my-1">
          {mode === "stopwatch" ? formatTime(stopwatchElapsed) : formatTime(secondsLeft)}
        </div>

        {mode === "rest" && (
          <div className="text-xs text-slate-400 mt-1">
            {secondsLeft === 0 ? "Time's up! Start your next set 💪" : `Target Rest: ${totalSeconds}s`}
          </div>
        )}
      </div>

      {/* Rest Presets (when in rest mode) */}
      {mode === "rest" && (
        <div className="flex flex-wrap items-center justify-center gap-1.5 mb-4">
          {[30, 45, 60, 90, 120].map((sec) => (
            <button
              key={sec}
              onClick={() => selectRestPreset(sec)}
              className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-colors ${
                totalSeconds === sec
                  ? "bg-blue-600/30 border-blue-500 text-blue-300"
                  : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-750"
              }`}
            >
              {sec}s
            </button>
          ))}
        </div>
      )}

      {/* HIIT Config Inputs (when in interval mode and not running) */}
      {mode === "interval" && !isRunning && (
        <div className="grid grid-cols-3 gap-2 text-xs mb-4 text-center">
          <div className="bg-slate-800/80 p-2 rounded-lg">
            <span className="text-slate-400 block mb-1 text-[11px]">Work</span>
            <input
              type="number"
              value={workTime}
              onChange={(e) => {
                const val = Number(e.target.value) || 20;
                setWorkTime(val);
                if (isWorkPhase) setSecondsLeft(val);
              }}
              className="w-full text-center bg-slate-900 border border-slate-700 rounded py-1 font-mono text-white text-xs font-bold"
            />
          </div>
          <div className="bg-slate-800/80 p-2 rounded-lg">
            <span className="text-slate-400 block mb-1 text-[11px]">Rest</span>
            <input
              type="number"
              value={restTime}
              onChange={(e) => setRestTime(Number(e.target.value) || 10)}
              className="w-full text-center bg-slate-900 border border-slate-700 rounded py-1 font-mono text-white text-xs font-bold"
            />
          </div>
          <div className="bg-slate-800/80 p-2 rounded-lg">
            <span className="text-slate-400 block mb-1 text-[11px]">Rounds</span>
            <input
              type="number"
              value={rounds}
              onChange={(e) => setRounds(Number(e.target.value) || 5)}
              className="w-full text-center bg-slate-900 border border-slate-700 rounded py-1 font-mono text-white text-xs font-bold"
            />
          </div>
        </div>
      )}

      {/* Action Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
            isRunning
              ? "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20"
              : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30"
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-4 h-4 fill-current" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Start</span>
            </>
          )}
        </button>

        <button
          onClick={resetTimer}
          className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
          title="Reset"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
