import React, { useState } from "react";
import { Utensils, Flame, Sparkles, Copy, Check, ChevronDown, ChevronUp, Clock, Scale } from "lucide-react";
import { MealPlanData } from "../types";

interface MealPlanCardProps {
  mealPlan?: MealPlanData | null;
  nutritionTip: string;
}

export const MealPlanCard: React.FC<MealPlanCardProps> = ({
  mealPlan,
  nutritionTip,
}) => {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  if (!mealPlan) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/90 p-5 sm:p-6 transition-all">
        <div className="flex items-center gap-2 mb-2">
          <Utensils className="w-5 h-5 text-emerald-600" />
          <h3 className="text-lg font-bold text-slate-900">🥗 Nutrition & Recovery Advice</h3>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed pl-7">{nutritionTip}</p>
      </div>
    );
  }

  const handleCopy = () => {
    let text = `FITBUDDY NUTRITION & MEAL PLAN\n\nEstimated Calories: ${mealPlan.calories}\n` +
      `Macros: Protein: ${mealPlan.macros.protein} | Carbs: ${mealPlan.macros.carbs} | Fats: ${mealPlan.macros.fats}\n` +
      `Hydration: ${mealPlan.hydrationTarget}\n\n` +
      `--- DAILY MEALS ---\n` +
      mealPlan.meals.map((m) => `• ${m.meal}: ${m.items}`).join("\n") +
      `\n\n--- RECOVERY TIP ---\n${nutritionTip}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200/90 p-5 sm:p-6 transition-all space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              🥗 AI Nutrition & Meal Recommendations
            </h3>
            <p className="text-xs text-slate-500">
              Personalized caloric breakdown & daily nutrient timing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Plan</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Calories & Macro Breakdown Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 rounded-xl p-3 text-center">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block flex items-center justify-center gap-1">
            <Flame className="w-3 h-3 text-amber-600" />
            Calories
          </span>
          <span className="text-lg sm:text-xl font-extrabold text-amber-950 mt-0.5 block">
            {mealPlan.calories}
          </span>
        </div>

        <div className="bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-200/80 rounded-xl p-3 text-center">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800 block">
            Protein (30%)
          </span>
          <span className="text-lg sm:text-xl font-extrabold text-rose-950 mt-0.5 block">
            {mealPlan.macros.protein}
          </span>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/80 rounded-xl p-3 text-center">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 block">
            Carbs (40%)
          </span>
          <span className="text-lg sm:text-xl font-extrabold text-blue-950 mt-0.5 block">
            {mealPlan.macros.carbs}
          </span>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-xl p-3 text-center">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">
            Healthy Fats (30%)
          </span>
          <span className="text-lg sm:text-xl font-extrabold text-emerald-950 mt-0.5 block">
            {mealPlan.macros.fats}
          </span>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-4 pt-2">
          {/* Daily Meals List */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Recommended Daily Meals
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {mealPlan.meals.map((m, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50/90 border border-slate-200/70 hover:border-emerald-300 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded">
                      {m.meal}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-snug pl-0.5">{m.items}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Guidance Callout */}
          {mealPlan.hydrationAdvice && (
            <div className="p-3 bg-cyan-50/70 border-l-3 border-cyan-500 rounded-r text-xs text-slate-700">
              <strong className="text-cyan-900 font-bold block mb-0.5">Hydration Timing:</strong>
              {mealPlan.hydrationAdvice}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
