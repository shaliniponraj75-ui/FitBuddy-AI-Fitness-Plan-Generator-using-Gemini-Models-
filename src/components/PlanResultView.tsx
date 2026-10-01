import React, { useState, useEffect } from "react";
import {
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  ArrowLeft,
  Flame,
  Calendar,
  CheckCircle2,
  FileText,
  Share2,
  Sliders,
  History,
  Timer,
  CheckCircle,
  Circle,
  Play,
  RotateCcw,
  Zap,
  TrendingUp,
} from "lucide-react";
import { UserProfile, PlanData } from "../types";
import { MealPlanCard } from "./MealPlanCard";
import { HydrationTracker } from "./HydrationTracker";
import { WorkoutTimer } from "./WorkoutTimer";
import { VersionHistoryModal } from "./VersionHistoryModal";

interface PlanResultViewProps {
  user: UserProfile;
  planData: PlanData;
  onFeedbackSubmit: (userId: number, feedback: string) => Promise<void>;
  isUpdating: boolean;
  onBackToGenerator: () => void;
  onViewAdmin: () => void;
  onReloadActiveUser?: (userId: number) => Promise<void>;
}

export const PlanResultView: React.FC<PlanResultViewProps> = ({
  user,
  planData,
  onFeedbackSubmit,
  isUpdating,
  onBackToGenerator,
  onViewAdmin,
  onReloadActiveUser,
}) => {
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackUserId, setFeedbackUserId] = useState(user.id.toString());
  const [activePlanTab, setActivePlanTab] = useState<"current" | "original">("current");
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"interactive" | "raw">("interactive");

  // Timer Integration
  const [timerOpen, setTimerOpen] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [timerTriggerKey, setTimerTriggerKey] = useState(0);

  // Version History Modal
  const [versionModalOpen, setVersionModalOpen] = useState(false);

  // Workout Completions state (persisted to SQLite)
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [completedDays, setCompletedDays] = useState<Set<number>>(new Set());

  // Fetch completions on mount / user change
  useEffect(() => {
    fetchCompletions();
  }, [user.id]);

  const fetchCompletions = async () => {
    try {
      const res = await fetch(`/api/workout-completions/${user.id}`);
      const data = await res.json();
      if (data.completions) {
        const setKeys = new Set<string>(
          data.completions.map((c: any) => `${c.day_number}-${c.exercise_id}`)
        );
        setCompletedExercises(setKeys);
      }
      if (data.completedDays) {
        setCompletedDays(new Set(data.completedDays));
      }
    } catch (e) {
      console.error("Failed to load completions:", e);
    }
  };

  const toggleExerciseCompletion = async (dayNumber: number, exerciseId: string) => {
    const key = `${dayNumber}-${exerciseId}`;
    const nextCompleted = !completedExercises.has(key);

    const nextSet = new Set(completedExercises);
    if (nextCompleted) {
      nextSet.add(key);
    } else {
      nextSet.delete(key);
    }
    setCompletedExercises(nextSet);

    try {
      await fetch("/api/workout-completion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          day_number: dayNumber,
          exercise_id: exerciseId,
          completed: nextCompleted,
        }),
      });
    } catch (e) {
      console.error("Error toggling completion:", e);
    }
  };

  const toggleDayCompletion = async (dayNumber: number) => {
    const nextSet = new Set(completedDays);
    const isCompleted = nextSet.has(dayNumber);
    if (isCompleted) {
      nextSet.delete(dayNumber);
    } else {
      nextSet.add(dayNumber);
    }
    setCompletedDays(nextSet);
  };

  const startRestTimer = (seconds: number) => {
    setTimerSeconds(seconds);
    setTimerTriggerKey((k) => k + 1);
    setTimerOpen(true);
  };

  const quickFeedbackSuggestions = [
    "Add 15 minutes of yoga into the daily cooldown",
    "Include more core and abdominal exercises",
    "Substitute running with low-impact rowing or cycling",
    "Focus more on hypertrophy with dumbbell movements",
    "Keep sessions strictly under 40 minutes",
  ];

  const handleFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    const uid = parseInt(feedbackUserId, 10) || user.id;
    await onFeedbackSubmit(uid, feedbackText.trim());
    setFeedbackText("");
  };

  const handleRestoreVersion = async (versionId: number) => {
    await fetch("/api/restore-plan-version", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user.id,
        version_id: versionId,
      }),
    });
    if (onReloadActiveUser) {
      await onReloadActiveUser(user.id);
    }
  };

  const currentDisplayPlan =
    activePlanTab === "original"
      ? planData.originalPlan
      : planData.updatedPlan || planData.originalPlan;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(
      `FITBUDDY WORKOUT PLAN FOR ${user.name.toUpperCase()}\n\n` +
        `User ID: ${user.id} | Goal: ${user.goal} | Intensity: ${user.intensity}\n\n` +
        `--- WORKOUT PLAN ---\n${currentDisplayPlan}\n\n` +
        `--- NUTRITION TIP ---\n${planData.nutritionTip}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to parse days for interactive view
  const parseDays = (text: string) => {
    const rawDays = text.split(/(?=Day\s+[1-7]:)/i);
    return rawDays
      .map((block) => block.trim())
      .filter((block) => block.length > 0);
  };

  const parsedDays = parseDays(currentDisplayPlan);

  // Overall Completion stats
  const totalCompletedExercises = completedExercises.size;
  const completedDaysCount = completedDays.size;
  const progressPercent = Math.min(100, Math.round((completedDaysCount / 7) * 100));

  return (
    <div
      className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 bg-cover bg-center bg-fixed pb-24"
      style={{
        backgroundImage: `linear-gradient(rgba(248, 250, 252, 0.95), rgba(248, 250, 252, 0.95)), url('/static/images/gym-bg.jpg')`,
      }}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation & Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white/90 backdrop-blur rounded-xl p-3 border border-slate-200 shadow-sm">
          <button
            onClick={onBackToGenerator}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Generate Another Plan</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setTimerOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
            >
              <Timer className="w-3.5 h-3.5 text-blue-600" />
              <span>Workout Timer</span>
            </button>

            <button
              onClick={() => setVersionModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              title="View revision history"
            >
              <History className="w-3.5 h-3.5 text-slate-600" />
              <span>Versions ({planData.currentVersion || "v1.0"})</span>
            </button>

            <button
              onClick={copyToClipboard}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Plan</span>
                </>
              )}
            </button>

            <button
              onClick={onViewAdmin}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <span>Admin / All Users</span>
            </button>
          </div>
        </div>

        {/* Title */}
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-blue-900 tracking-tight flex items-center justify-center gap-2">
            <span>🏋️</span>
            <span>Your Personalized Workout & Nutrition Plan</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Personalized 7-day routine with rest intervals, AI meal guidance, and SQLite persistence
          </p>
        </div>

        {/* User Information & Progress Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* User Info (8 cols) */}
          <div className="md:col-span-8 bg-white rounded-xl shadow-sm border border-slate-200/90 p-5 transition-all">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                User Profile
              </h2>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                User #{user.id}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2.5 gap-x-4 text-xs sm:text-sm">
              <div>
                <span className="text-slate-500 font-medium block text-xs">Name:</span>
                <span className="font-bold text-slate-900">{user.name}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block text-xs">Age:</span>
                <span className="font-bold text-slate-900">{user.age} yrs</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block text-xs">Weight:</span>
                <span className="font-bold text-slate-900">{user.weight} kg</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block text-xs">Goal:</span>
                <span className="font-bold text-blue-700 capitalize">{user.goal}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block text-xs">Intensity:</span>
                <span className="font-bold text-slate-900">{user.intensity}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block text-xs">AI Version:</span>
                <span className="font-bold text-emerald-700">{planData.currentVersion || "v1.0"}</span>
              </div>
            </div>
          </div>

          {/* Progress & Completion Ring (4 cols) */}
          <div className="md:col-span-4 bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-xl shadow-sm p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                Completion Track
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-600/30 text-blue-300 border border-blue-400/30">
                🔥 7-Day Cycle
              </span>
            </div>

            <div className="my-2">
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-2xl font-black">{completedDaysCount} / 7 Days</span>
                <span className="text-sm font-bold text-blue-400">{progressPercent}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-emerald-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="text-[11px] text-slate-300 flex items-center justify-between pt-1">
              <span>{totalCompletedExercises} exercises finished</span>
              <span className="text-emerald-400 font-semibold">SQLite Synced</span>
            </div>
          </div>
        </div>

        {/* 🥗 AI Nutrition & Meal Recommendations */}
        <MealPlanCard
          mealPlan={planData.mealPlan}
          nutritionTip={planData.nutritionTip}
        />

        {/* 💧 Hydration & Recovery Guidance */}
        <HydrationTracker user={user} />

        {/* 🏋️ Workout Plan Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/90 p-5 sm:p-6 transition-all">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Personalized 7-Day Workout Routine
              </h2>
              {planData.updatedPlan && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 mt-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Revised based on feedback ({planData.currentVersion || "v1.1"})
                </span>
              )}
            </div>

            {/* View Mode & Version Switchers */}
            <div className="flex flex-wrap items-center gap-2">
              {planData.updatedPlan && (
                <div className="bg-slate-100 p-0.5 rounded-lg flex items-center text-xs font-medium">
                  <button
                    onClick={() => setActivePlanTab("current")}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      activePlanTab === "current"
                        ? "bg-white text-blue-700 shadow-xs font-bold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Updated Plan
                  </button>
                  <button
                    onClick={() => setActivePlanTab("original")}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      activePlanTab === "original"
                        ? "bg-white text-blue-700 shadow-xs font-bold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Original Plan
                  </button>
                </div>
              )}

              <div className="bg-slate-100 p-0.5 rounded-lg flex items-center text-xs font-medium">
                <button
                  onClick={() => setViewMode("interactive")}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    viewMode === "interactive"
                      ? "bg-white text-slate-900 shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Interactive Cards
                </button>
                <button
                  onClick={() => setViewMode("raw")}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    viewMode === "raw"
                      ? "bg-white text-slate-900 shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Raw Monospace
                </button>
              </div>
            </div>
          </div>

          {/* View Content */}
          {viewMode === "raw" ? (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 sm:p-5 overflow-x-auto shadow-inner">
              <pre className="font-mono text-xs sm:text-sm text-slate-900 whitespace-pre-wrap leading-relaxed select-text">
                {currentDisplayPlan}
              </pre>
            </div>
          ) : (
            <div className="space-y-4">
              {parsedDays.map((dayText, idx) => {
                const dayNum = idx + 1;
                const isDayDone = completedDays.has(dayNum);
                const lines = dayText.split("\n");
                const titleLine = lines[0] || `Day ${dayNum}`;
                const warmUp = lines.find((l) => l.toLowerCase().startsWith("warm-up:"));
                const cooldown = lines.find((l) => l.toLowerCase().startsWith("cooldown:"));
                const mainWorkoutLines = lines.filter(
                  (l) =>
                    !l.toLowerCase().startsWith("day") &&
                    !l.toLowerCase().startsWith("warm-up:") &&
                    !l.toLowerCase().startsWith("cooldown:") &&
                    l.trim().length > 0
                );

                return (
                  <div
                    key={dayNum}
                    className={`border rounded-xl overflow-hidden transition-all bg-white shadow-xs ${
                      isDayDone
                        ? "border-emerald-300 ring-1 ring-emerald-300"
                        : "border-slate-200 hover:border-blue-300"
                    }`}
                  >
                    {/* Day Header */}
                    <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white px-4 py-2.5 flex items-center justify-between">
                      <span className="font-bold text-sm tracking-wide flex items-center gap-2">
                        <span
                          className={`w-6 h-6 rounded-md text-white text-xs flex items-center justify-center font-extrabold ${
                            isDayDone ? "bg-emerald-500" : "bg-blue-600"
                          }`}
                        >
                          {isDayDone ? "✓" : dayNum}
                        </span>
                        <span>{titleLine}</span>
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleDayCompletion(dayNum)}
                          className={`text-xs px-2.5 py-1 rounded-md font-bold flex items-center gap-1 transition-colors ${
                            isDayDone
                              ? "bg-emerald-500 text-white"
                              : "bg-slate-700/80 hover:bg-slate-700 text-slate-200"
                          }`}
                        >
                          {isDayDone ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Completed</span>
                            </>
                          ) : (
                            <>
                              <Circle className="w-3.5 h-3.5" />
                              <span>Mark Day Done</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="p-4 space-y-3 text-sm">
                      {/* Warm-up */}
                      {warmUp && (
                        <div className="bg-amber-50/70 border-l-3 border-amber-400 p-2.5 rounded-r text-slate-800 text-xs sm:text-sm">
                          <strong className="text-amber-800 font-bold block mb-0.5">
                            🔥 {warmUp.split(":")[0]}:
                          </strong>
                          <span>{warmUp.replace(/^[^:]+:\s*/, "")}</span>
                        </div>
                      )}

                      {/* Main Workout Exercises with explicit sets, reps, and rest timers */}
                      <div className="bg-slate-50/90 p-3.5 rounded-xl border border-slate-200/70 space-y-2">
                        <strong className="text-slate-900 font-bold block text-xs sm:text-sm text-blue-900">
                          💪 Main Workout Exercises:
                        </strong>

                        <div className="space-y-2">
                          {mainWorkoutLines.map((line, exIdx) => {
                            const cleanLine = line.replace(/^-\s*/, "");
                            const exerciseId = `ex-${exIdx}`;
                            const isExCompleted = completedExercises.has(`${dayNum}-${exerciseId}`);

                            // Extract rest interval if available (e.g. Rest: 60s)
                            const restMatch = cleanLine.match(/rest:\s*(\d+)\s*s?/i);
                            const restSeconds = restMatch ? parseInt(restMatch[1], 10) : 60;

                            return (
                              <div
                                key={exIdx}
                                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg border transition-all ${
                                  isExCompleted
                                    ? "bg-emerald-50/60 border-emerald-200 text-emerald-900"
                                    : "bg-white border-slate-200/90 text-slate-800 hover:border-slate-300"
                                }`}
                              >
                                <div className="flex items-start gap-2.5 flex-1">
                                  <button
                                    onClick={() => toggleExerciseCompletion(dayNum, exerciseId)}
                                    className={`w-4 h-4 rounded border mt-0.5 flex items-center justify-center transition-colors ${
                                      isExCompleted
                                        ? "bg-emerald-600 border-emerald-600 text-white"
                                        : "border-slate-300 bg-white hover:border-blue-500"
                                    }`}
                                  >
                                    {isExCompleted && <Check className="w-3 h-3 stroke-3" />}
                                  </button>

                                  <div className="text-xs sm:text-sm">
                                    <span
                                      className={`leading-snug ${
                                        isExCompleted ? "line-through text-slate-500" : "font-medium"
                                      }`}
                                    >
                                      {cleanLine}
                                    </span>
                                  </div>
                                </div>

                                {/* Start Rest Timer Quick Action */}
                                <div className="flex items-center gap-1.5 pl-6 sm:pl-0">
                                  <button
                                    onClick={() => startRestTimer(restSeconds)}
                                    className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/80 flex items-center gap-1 transition-colors whitespace-nowrap shadow-xs"
                                    title={`Start ${restSeconds}s Rest Timer`}
                                  >
                                    <Timer className="w-3 h-3 text-blue-600" />
                                    <span>Rest: {restSeconds}s</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Cooldown */}
                      {cooldown && (
                        <div className="bg-emerald-50/70 border-l-3 border-emerald-400 p-2.5 rounded-r text-slate-800 text-xs sm:text-sm">
                          <strong className="text-emerald-800 font-bold block mb-0.5">
                            🧘 {cooldown.split(":")[0]}:
                          </strong>
                          <span>{cooldown.replace(/^[^:]+:\s*/, "")}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 📝 Share Your Feedback Section (Adaptive Updates) */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/90 p-5 sm:p-6 transition-all">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🔄</span>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Adaptive Feedback Revisions</h3>
              <p className="text-xs text-slate-500">
                Submit modifications to refine your workout plan. Gemini assigns a new version label (v1.1, v1.2) stored in SQLite.
              </p>
            </div>
          </div>

          <form onSubmit={handleFeedback} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Your Unique User ID:
              </label>
              <input
                type="number"
                required
                value={feedbackUserId}
                onChange={(e) => setFeedbackUserId(e.target.value)}
                placeholder="Enter the same User ID used to generate your plan"
                className="w-full sm:w-64 px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Your Feedback / Adjustments:
                </label>
                <span className="text-xs text-slate-400">Powered by Gemini AI</span>
              </div>
              <textarea
                rows={3}
                required
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="e.g. 'Add yoga in cooldown', 'Focus more on core and abs', 'Substitute high-impact jumping'..."
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              />

              {/* Suggestions */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {quickFeedbackSuggestions.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setFeedbackText(item)}
                    className="text-xs px-2.5 py-1 rounded-md bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-800 transition-colors text-left"
                  >
                    + "{item}"
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isUpdating || !feedbackText.trim()}
              className="w-full py-3 px-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Adapting Plan with Gemini AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Submit Feedback & Adapt Plan</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Built-in Workout Timer Component */}
      <WorkoutTimer
        initialSeconds={timerSeconds}
        isOpen={timerOpen}
        onClose={() => setTimerOpen(false)}
        triggerKey={timerTriggerKey}
      />

      {/* Version History Modal */}
      <VersionHistoryModal
        userId={user.id}
        isOpen={versionModalOpen}
        onClose={() => setVersionModalOpen(false)}
        onRestoreVersion={handleRestoreVersion}
        currentVersion={planData.currentVersion}
      />
    </div>
  );
};
