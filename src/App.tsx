/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { GeneratorForm } from "./components/GeneratorForm";
import { PlanResultView } from "./components/PlanResultView";
import { AdminView } from "./components/AdminView";
import { ApiPlayground } from "./components/ApiPlayground";
import { PythonCodeViewer } from "./components/PythonCodeViewer";
import { UserProfile, PlanData } from "./types";

export default function App() {
  const [activeTab, setActiveTab] = useState<
    "generator" | "result" | "admin" | "api" | "python"
  >("generator");

  const [activeUser, setActiveUser] = useState<UserProfile | null>(null);
  const [activePlan, setActivePlan] = useState<PlanData | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [isUpdatingPlan, setIsUpdatingPlan] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Load User #10 by default on initial mount so user immediately sees a working plan
  useEffect(() => {
    fetchInitialActiveUser(10);
  }, []);

  const fetchInitialActiveUser = async (userId: number) => {
    try {
      const res = await fetch("/api/view-all-users");
      const data = await res.json();
      if (data.users && data.users.length > 0) {
        const found = data.users.find((u: any) => u.id === userId) || data.users[0];
        if (found) {
          setActiveUser({
            id: found.id,
            name: found.name,
            age: found.age,
            weight: found.weight,
            goal: found.goal,
            intensity: found.intensity,
          });
          setActivePlan({
            userId: found.id,
            originalPlan: found.original_plan,
            updatedPlan:
              found.updated_plan !== "Not updated" ? found.updated_plan : null,
            nutritionTip: found.nutrition_tip,
            mealPlan: found.meal_plan,
            currentVersion: found.current_version || "v1.0",
            history: found.history || [],
          });
        }
      }
    } catch (e) {
      console.error("Initial load failed:", e);
    }
  };

  const handleGenerate = async (user: UserProfile) => {
    setIsLoading(true);
    setLoadingMessage("Generating 7-day routine, AI meal recommendations & Gemini Flash tip...");
    setGlobalError(null);

    try {
      const response = await fetch("/api/generate-workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: user.name,
          user_id: user.id,
          age: user.age,
          weight: user.weight,
          goal: user.goal,
          intensity: user.intensity,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to generate workout plan");
      }

      const data = await response.json();
      setActiveUser({
        id: data.user.id,
        name: data.user.name,
        age: data.user.age,
        weight: data.user.weight,
        goal: data.user.goal,
        intensity: data.user.intensity,
      });

      setActivePlan({
        userId: data.user.id,
        originalPlan: data.workout_plan,
        updatedPlan: null,
        nutritionTip: data.nutrition_tip,
        mealPlan: data.meal_plan,
        currentVersion: data.version || "v1.0",
        history: [],
      });

      setActiveTab("result");
    } catch (error: any) {
      console.error("Generation error:", error);
      setGlobalError(error.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  const handleFeedbackSubmit = async (userId: number, feedback: string) => {
    setIsUpdatingPlan(true);
    setGlobalError(null);

    try {
      const response = await fetch("/api/submit-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          feedback,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to revise workout plan");
      }

      const data = await response.json();

      setActivePlan((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          originalPlan: data.original_plan || prev.originalPlan,
          updatedPlan: data.updated_plan || data.workout_plan,
          nutritionTip: data.nutrition_tip || prev.nutritionTip,
          currentVersion: data.version || prev.currentVersion,
          history: [
            ...(prev.history || []),
            {
              feedback,
              plan: data.updated_plan || data.workout_plan,
              timestamp: new Date().toISOString(),
            },
          ],
        };
      });
    } catch (error: any) {
      console.error("Feedback error:", error);
      setGlobalError(error.message || "Failed to submit feedback.");
    } finally {
      setIsUpdatingPlan(false);
    }
  };

  const handleSelectUserFromAdmin = async (userId: number) => {
    await fetchInitialActiveUser(userId);
    setActiveTab("result");
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasActivePlan={!!activePlan}
      />

      {globalError && (
        <div className="bg-red-600 text-white text-xs sm:text-sm px-4 py-2.5 flex items-center justify-between">
          <span>⚠️ {globalError}</span>
          <button
            onClick={() => setGlobalError(null)}
            className="text-white hover:text-red-200 font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      <main className="flex-1">
        {activeTab === "generator" && (
          <GeneratorForm
            onGenerate={handleGenerate}
            isLoading={isLoading}
            loadingMessage={loadingMessage}
          />
        )}

        {activeTab === "result" && activeUser && activePlan && (
          <PlanResultView
            user={activeUser}
            planData={activePlan}
            onFeedbackSubmit={handleFeedbackSubmit}
            isUpdating={isUpdatingPlan}
            onBackToGenerator={() => setActiveTab("generator")}
            onViewAdmin={() => setActiveTab("admin")}
            onReloadActiveUser={fetchInitialActiveUser}
          />
        )}

        {activeTab === "admin" && (
          <AdminView
            onSelectUserForPlan={handleSelectUserFromAdmin}
            onRefreshTrigger={() => {
              if (activeUser) fetchInitialActiveUser(activeUser.id);
            }}
          />
        )}

        {activeTab === "api" && <ApiPlayground />}

        {activeTab === "python" && <PythonCodeViewer />}
      </main>

      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-xs py-4 px-6 text-center">
        <p>
          FitBuddy AI Trainer • Built with Gemini 3.8 Flash & Gemini Pro • Persistent SQLite Database • Built-in Workout Timer
        </p>
      </footer>
    </div>
  );
}
