import React from "react";
import { Dumbbell, Users, Terminal, Code2, Sparkles } from "lucide-react";

interface HeaderProps {
  activeTab: "generator" | "result" | "admin" | "api" | "python";
  setActiveTab: (tab: "generator" | "result" | "admin" | "api" | "python") => void;
  hasActivePlan: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  hasActivePlan,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setActiveTab("generator")}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform">
              <Dumbbell className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-white">
                  FitBuddy
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold border border-blue-400/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Gemini Flash AI
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                AI Workout & Nutrition Generator
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab("generator")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === "generator"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Dumbbell className="w-4 h-4" />
              <span>Generator</span>
            </button>

            {hasActivePlan && (
              <button
                onClick={() => setActiveTab("result")}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  activeTab === "result"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-300 hover:text-white hover:bg-slate-800"
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Active Plan</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab("admin")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === "admin"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Admin View</span>
            </button>

            <button
              onClick={() => setActiveTab("api")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === "api"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span className="hidden md:inline">API Tester</span>
              <span className="md:hidden">API</span>
            </button>

            <button
              onClick={() => setActiveTab("python")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === "python"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span className="hidden md:inline">Python Code</span>
              <span className="md:hidden">Code</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
