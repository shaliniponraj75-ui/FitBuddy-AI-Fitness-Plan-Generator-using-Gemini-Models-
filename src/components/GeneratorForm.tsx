import React, { useState } from "react";
import { Dumbbell, Sparkles, Loader2, Zap, ArrowRight, UserCheck } from "lucide-react";
import { UserProfile } from "../types";

interface GeneratorFormProps {
  onGenerate: (user: UserProfile) => Promise<void>;
  isLoading: boolean;
  loadingMessage: string;
}

export const GeneratorForm: React.FC<GeneratorFormProps> = ({
  onGenerate,
  isLoading,
  loadingMessage,
}) => {
  const [formData, setFormData] = useState({
    username: "",
    user_id: "",
    age: "",
    weight: "",
    goal: "",
    intensity: "Medium" as "Low" | "Medium" | "High",
  });

  const [formError, setFormError] = useState("");

  const quickGoals = [
    "Lose belly fat and gain muscles",
    "Weight loss & flexibility",
    "Lean bulk & upper body strength",
    "Marathon cardio & endurance",
    "Core strength & injury prevention",
  ];

  const applyPreset = (preset: "john" | "sarah" | "random") => {
    if (preset === "john") {
      setFormData({
        username: "John Doe",
        user_id: "10",
        age: "28",
        weight: "76.5",
        goal: "Lose belly fat and gain muscles",
        intensity: "Medium",
      });
    } else if (preset === "sarah") {
      setFormData({
        username: "Sarah Connor",
        user_id: "101",
        age: "34",
        weight: "62.0",
        goal: "Weight loss & flexibility",
        intensity: "High",
      });
    } else {
      const randomId = Math.floor(100 + Math.random() * 900);
      setFormData({
        username: "Alex Rivera",
        user_id: randomId.toString(),
        age: "25",
        weight: "70.0",
        goal: "Full body conditioning & athletic agility",
        intensity: "High",
      });
    }
    setFormError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.username.trim()) {
      setFormError("Please enter your name.");
      return;
    }
    const userIdNum = parseInt(formData.user_id, 10);
    if (isNaN(userIdNum) || userIdNum <= 0) {
      setFormError("Please enter a valid numeric User ID.");
      return;
    }
    const ageNum = parseInt(formData.age, 10);
    if (isNaN(ageNum) || ageNum <= 0) {
      setFormError("Please enter a valid age.");
      return;
    }
    const weightNum = parseFloat(formData.weight);
    if (isNaN(weightNum) || weightNum <= 0) {
      setFormError("Please enter a valid weight in kg.");
      return;
    }
    if (!formData.goal.trim()) {
      setFormError("Please specify your fitness goal.");
      return;
    }

    await onGenerate({
      id: userIdNum,
      name: formData.username.trim(),
      age: ageNum,
      weight: weightNum,
      goal: formData.goal.trim(),
      intensity: formData.intensity,
    });
  };

  return (
    <div
      className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-cover bg-center bg-fixed relative"
      style={{
        backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.72), rgba(15, 23, 42, 0.88)), url('/static/images/gym-bg.jpg')`,
      }}
    >
      <div className="w-full max-w-xl">
        {/* Card */}
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 transition-all">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/30 mb-3">
              <Dumbbell className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              💪 FitBuddy - AI Workout Generator
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Personalized 7-day plans with instant Gemini Flash recovery & nutrition advice
            </p>
          </div>

          {/* Quick Presets for Demo */}
          <div className="mb-6 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                Quick Test Presets
              </span>
              <span className="text-xs text-slate-400">Click to autofill</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => applyPreset("john")}
                className="text-xs px-2.5 py-1 rounded-md bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
              >
                User 10 (John Doe)
              </button>
              <button
                type="button"
                onClick={() => applyPreset("sarah")}
                className="text-xs px-2.5 py-1 rounded-md bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
              >
                User 101 (Sarah Connor)
              </button>
              <button
                type="button"
                onClick={() => applyPreset("random")}
                className="text-xs px-2.5 py-1 rounded-md bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
              >
                New Random Profile
              </button>
            </div>
          </div>

          {formError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-sm">
              {formError}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                  Name:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                  User ID:
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 10"
                  value={formData.user_id}
                  onChange={(e) =>
                    setFormData({ ...formData, user_id: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                  Age:
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 28"
                  value={formData.age}
                  onChange={(e) =>
                    setFormData({ ...formData, age: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                  Weight (kg):
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  placeholder="e.g. 76.5"
                  value={formData.weight}
                  onChange={(e) =>
                    setFormData({ ...formData, weight: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Fitness Goal:
                </label>
                <span className="text-xs text-slate-500">Specific target</span>
              </div>
              <input
                type="text"
                required
                placeholder="e.g., weight loss, flexibility or lose belly fat"
                value={formData.goal}
                onChange={(e) =>
                  setFormData({ ...formData, goal: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
              />

              {/* Goal Suggestion Chips */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {quickGoals.map((qg, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setFormData({ ...formData, goal: qg })}
                    className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900/40 dark:hover:text-blue-300 transition-colors"
                  >
                    + {qg}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                Workout Intensity:
              </label>
              <select
                value={formData.intensity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    intensity: e.target.value as "Low" | "Medium" | "High",
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
              >
                <option value="Low">Low - Gentle pace & mobility</option>
                <option value="Medium">Medium - Balanced hypertrophy & conditioning</option>
                <option value="High">High - Intense circuits & maximum output</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all transform active:scale-[0.99] disabled:opacity-75 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{loadingMessage || "Generating Plan with Gemini..."}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  <span>Generate Plan</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Feature Highlights beneath */}
        <div className="grid grid-cols-3 gap-3 mt-4 text-center">
          <div className="bg-slate-900/80 backdrop-blur rounded-xl p-2.5 border border-slate-800 text-white">
            <p className="text-xs font-bold text-blue-400">7-Day Structure</p>
            <p className="text-[11px] text-slate-400">Warm-up, Main, Cooldown</p>
          </div>
          <div className="bg-slate-900/80 backdrop-blur rounded-xl p-2.5 border border-slate-800 text-white">
            <p className="text-xs font-bold text-amber-400">Gemini Flash</p>
            <p className="text-[11px] text-slate-400">Ultra-fast Nutrition Tip</p>
          </div>
          <div className="bg-slate-900/80 backdrop-blur rounded-xl p-2.5 border border-slate-800 text-white">
            <p className="text-xs font-bold text-emerald-400">Feedback Loop</p>
            <p className="text-[11px] text-slate-400">Live AI Plan Revisions</p>
          </div>
        </div>
      </div>
    </div>
  );
};
