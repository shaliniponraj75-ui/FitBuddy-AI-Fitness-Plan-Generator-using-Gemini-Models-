import React, { useState, useEffect } from "react";
import { Droplet, Plus, Minus, Moon, ShieldCheck, Heart, Sparkles, Check } from "lucide-react";
import { UserProfile } from "../types";

interface HydrationTrackerProps {
  user: UserProfile;
}

export const HydrationTracker: React.FC<HydrationTrackerProps> = ({ user }) => {
  const [glasses, setGlasses] = useState(0);
  const [targetLiters, setTargetLiters] = useState(3.0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Recovery checklist state
  const [recoveryChecks, setRecoveryChecks] = useState<Record<string, boolean>>({
    sleep: false,
    protein: false,
    mobility: false,
    electrolytes: false,
  });

  const GLASS_VOLUME_ML = 250; // Each glass is 250ml
  const totalGlassesGoal = Math.round((targetLiters * 1000) / GLASS_VOLUME_ML);

  // Fetch initial hydration log for user
  useEffect(() => {
    const fetchHydration = async () => {
      try {
        const res = await fetch(`/api/hydration-log/${user.id}`);
        const data = await res.json();
        if (data.glasses !== undefined) setGlasses(data.glasses);
        if (data.target_liters) setTargetLiters(data.target_liters);
      } catch (e) {
        console.error("Hydration fetch error:", e);
      }
    };
    fetchHydration();
  }, [user.id]);

  const updateGlasses = async (newVal: number) => {
    const val = Math.max(0, newVal);
    setGlasses(val);
    setIsSyncing(true);
    try {
      await fetch("/api/hydration-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          glasses: val,
          target_liters: targetLiters,
        }),
      });
    } catch (e) {
      console.error("Sync hydration error:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  const currentLiters = ((glasses * GLASS_VOLUME_ML) / 1000).toFixed(1);
  const percentage = Math.min(100, Math.round(((glasses * GLASS_VOLUME_ML) / 1000 / targetLiters) * 100));

  const toggleRecovery = (key: string) => {
    setRecoveryChecks((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200/90 p-5 sm:p-6 transition-all">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-600 flex items-center justify-center">
            <Droplet className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              Hydration & Recovery Guidance
            </h3>
            <p className="text-xs text-slate-500">
              Personalized target based on {user.weight}kg bodyweight & {user.intensity} intensity
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-semibold text-slate-500 block">Daily Intake Target</span>
          <span className="text-sm font-extrabold text-cyan-700">{targetLiters} Liters / Day</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Hydration Tracker (7 cols) */}
        <div className="md:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-black text-slate-900">{currentLiters} L</span>
              <span className="text-xs text-slate-500 ml-1.5 font-medium">
                of {targetLiters} L goal ({percentage}%)
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => updateGlasses(glasses - 1)}
                disabled={glasses === 0}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors disabled:opacity-40"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-10 text-center font-bold text-sm text-slate-800">
                {glasses}
              </span>
              <button
                onClick={() => updateGlasses(glasses + 1)}
                className="w-8 h-8 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-cyan-500 to-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Interactive Cup Grid */}
          <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 pt-1">
            {Array.from({ length: totalGlassesGoal }).map((_, idx) => {
              const isFilled = idx < glasses;
              return (
                <button
                  key={idx}
                  onClick={() => updateGlasses(idx + 1 === glasses ? idx : idx + 1)}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                    isFilled
                      ? "bg-cyan-50 border-cyan-300 text-cyan-600 shadow-xs scale-102"
                      : "bg-slate-50 border-slate-200 text-slate-300 hover:border-slate-300 hover:text-slate-400"
                  }`}
                  title={`Glass ${idx + 1} (250ml)`}
                >
                  <Droplet className={`w-4 h-4 ${isFilled ? "fill-current" : ""}`} />
                  <span className="text-[10px] font-bold mt-0.5">{idx + 1}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recovery Checklist (5 cols) */}
        <div className="md:col-span-5 bg-slate-50/80 rounded-xl p-4 border border-slate-200/80 space-y-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            Daily Recovery Checklist
          </span>

          <div className="space-y-1.5 text-xs">
            <label
              onClick={() => toggleRecovery("sleep")}
              className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-colors ${
                recoveryChecks.sleep ? "bg-emerald-50 text-emerald-900 font-semibold" : "bg-white hover:bg-slate-100 text-slate-700"
              }`}
            >
              <div
                className={`w-4 h-4 rounded border mt-0.5 flex items-center justify-center ${
                  recoveryChecks.sleep ? "bg-emerald-600 border-emerald-600 text-white" : "border-slate-300 bg-white"
                }`}
              >
                {recoveryChecks.sleep && <Check className="w-3 h-3" />}
              </div>
              <div>
                <span>7-9 Hours Sleep Target</span>
                <p className="text-[11px] text-slate-500 font-normal">Essential for GH release and tissue repair</p>
              </div>
            </label>

            <label
              onClick={() => toggleRecovery("protein")}
              className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-colors ${
                recoveryChecks.protein ? "bg-emerald-50 text-emerald-900 font-semibold" : "bg-white hover:bg-slate-100 text-slate-700"
              }`}
            >
              <div
                className={`w-4 h-4 rounded border mt-0.5 flex items-center justify-center ${
                  recoveryChecks.protein ? "bg-emerald-600 border-emerald-600 text-white" : "border-slate-300 bg-white"
                }`}
              >
                {recoveryChecks.protein && <Check className="w-3 h-3" />}
              </div>
              <div>
                <span>Post-Workout Protein Timing</span>
                <p className="text-[11px] text-slate-500 font-normal">25-35g within 45-60 min window</p>
              </div>
            </label>

            <label
              onClick={() => toggleRecovery("mobility")}
              className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-colors ${
                recoveryChecks.mobility ? "bg-emerald-50 text-emerald-900 font-semibold" : "bg-white hover:bg-slate-100 text-slate-700"
              }`}
            >
              <div
                className={`w-4 h-4 rounded border mt-0.5 flex items-center justify-center ${
                  recoveryChecks.mobility ? "bg-emerald-600 border-emerald-600 text-white" : "border-slate-300 bg-white"
                }`}
              >
                {recoveryChecks.mobility && <Check className="w-3 h-3" />}
              </div>
              <div>
                <span>Stretching & Foam Rolling</span>
                <p className="text-[11px] text-slate-500 font-normal">Reduces DOMS and improves range of motion</p>
              </div>
            </label>

            <label
              onClick={() => toggleRecovery("electrolytes")}
              className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-colors ${
                recoveryChecks.electrolytes ? "bg-emerald-50 text-emerald-900 font-semibold" : "bg-white hover:bg-slate-100 text-slate-700"
              }`}
            >
              <div
                className={`w-4 h-4 rounded border mt-0.5 flex items-center justify-center ${
                  recoveryChecks.electrolytes ? "bg-emerald-600 border-emerald-600 text-white" : "border-slate-300 bg-white"
                }`}
              >
                {recoveryChecks.electrolytes && <Check className="w-3 h-3" />}
              </div>
              <div>
                <span>Electrolytes (Na, K, Mg)</span>
                <p className="text-[11px] text-slate-500 font-normal">Prevents muscle cramps and fatigue</p>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
