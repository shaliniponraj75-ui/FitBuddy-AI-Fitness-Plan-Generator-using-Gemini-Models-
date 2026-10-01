import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Filter,
  RefreshCw,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Eye,
  CheckCircle2,
  Database,
  History,
  CheckCircle,
  HardDrive,
} from "lucide-react";
import { UserSummaryItem } from "../types";
import { VersionHistoryModal } from "./VersionHistoryModal";

interface AdminViewProps {
  onSelectUserForPlan: (userId: number) => void;
  onRefreshTrigger?: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  onSelectUserForPlan,
  onRefreshTrigger,
}) => {
  const [users, setUsers] = useState<UserSummaryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [intensityFilter, setIntensityFilter] = useState<string>("All");
  const [selectedModalUser, setSelectedModalUser] = useState<UserSummaryItem | null>(null);

  // Version modal state
  const [historyModalUserId, setHistoryModalUserId] = useState<number | null>(null);

  // DB stats
  const [dbStats, setDbStats] = useState<any>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/view-all-users");
      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
      }

      const statsRes = await fetch("/api/db-stats");
      const statsData = await statsRes.json();
      setDbStats(statsData);
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = async (id: number) => {
    if (!confirm(`Delete User #${id} and all related plans from SQLite?`)) return;
    try {
      await fetch(`/api/users/${id}`, { method: "DELETE" });
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      console.error("Failed to delete user:", err);
    }
  };

  const handleResetData = async () => {
    if (!confirm("Re-initialize SQLite database to clean default seed?")) return;
    try {
      setIsLoading(true);
      await fetch("/api/reset-data", { method: "POST" });
      await fetchUsers();
      if (onRefreshTrigger) onRefreshTrigger();
    } catch (err) {
      console.error("Failed to reset:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.id.toString().includes(searchQuery) ||
      u.goal.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesIntensity =
      intensityFilter === "All" || u.intensity === intensityFilter;
    return matchesSearch && matchesIntensity;
  });

  const revisedCount = users.filter(
    (u) => u.updated_plan && u.updated_plan !== "Not updated"
  ).length;

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                📋 FitBuddy - All Users & Workout Plans
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200 flex items-center gap-1">
                <Database className="w-3 h-3" />
                SQLite File: fitbuddy.db
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Admin Overview: Inspect persistent SQLite data, AI plan revisions, exercise completions, and nutrition profiles.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchUsers}
              disabled={isLoading}
              className="px-3.5 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleResetData}
              className="px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-colors"
              title="Reset sample seed users"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset SQLite Data</span>
            </button>
          </div>
        </div>

        {/* Database & Table Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Users
            </span>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              {users.length}
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5">table `users`</span>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active Plans
            </span>
            <div className="text-2xl font-extrabold text-blue-600 mt-1">
              {users.filter((u) => u.original_plan !== "N/A").length}
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5">table `workout_plans`</span>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Plan Versions
            </span>
            <div className="text-2xl font-extrabold text-emerald-600 mt-1">
              {dbStats?.tables?.plan_versions || revisedCount + users.length}
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5">table `plan_versions`</span>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Database Engine
            </span>
            <div className="text-sm font-bold text-slate-900 dark:text-white mt-1.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              SQLite (fitbuddy.db)
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              Size: {dbStats?.fileSizeBytes ? `${Math.round(dbStats.fileSizeBytes / 1024)} KB` : "Active"}
            </span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, ID, or goal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Intensity:
            </span>
            <select
              value={intensityFilter}
              onChange={(e) => setIntensityFilter(e.target.value)}
              className="text-sm px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
            >
              <option value="All">All Intensities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
        </div>

        {/* Table Container - matching Screenshot 7 */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-[#1976d2] text-white">
                  <th className="py-3.5 px-4 font-bold border-b border-blue-600 whitespace-nowrap">
                    User ID
                  </th>
                  <th className="py-3.5 px-4 font-bold border-b border-blue-600 whitespace-nowrap">
                    Name
                  </th>
                  <th className="py-3.5 px-4 font-bold border-b border-blue-600 whitespace-nowrap">
                    Age
                  </th>
                  <th className="py-3.5 px-4 font-bold border-b border-blue-600 whitespace-nowrap">
                    Weight (kg)
                  </th>
                  <th className="py-3.5 px-4 font-bold border-b border-blue-600 whitespace-nowrap">
                    Goal
                  </th>
                  <th className="py-3.5 px-4 font-bold border-b border-blue-600 whitespace-nowrap">
                    Intensity
                  </th>
                  <th className="py-3.5 px-4 font-bold border-b border-blue-600 min-w-[280px]">
                    Original Plan
                  </th>
                  <th className="py-3.5 px-4 font-bold border-b border-blue-600 min-w-[280px]">
                    Updated Plan & Versions
                  </th>
                  <th className="py-3.5 px-4 font-bold border-b border-blue-600 text-center whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-slate-800 dark:text-slate-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                        <span>Loading user records from SQLite...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500">
                      No users match your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user, idx) => (
                    <tr
                      key={user.id}
                      className={
                        idx % 2 === 0
                          ? "bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
                          : "bg-slate-50/70 dark:bg-slate-850 hover:bg-slate-100/70 dark:hover:bg-slate-750 transition-colors"
                      }
                    >
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white align-top whitespace-nowrap">
                        #{user.id}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white align-top whitespace-nowrap">
                        {user.name}
                      </td>
                      <td className="py-3 px-4 align-top whitespace-nowrap">
                        {user.age}
                      </td>
                      <td className="py-3 px-4 align-top whitespace-nowrap">
                        {user.weight} kg
                      </td>
                      <td className="py-3 px-4 align-top text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-400 capitalize max-w-[160px]">
                        {user.goal}
                      </td>
                      <td className="py-3 px-4 align-top whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                            user.intensity === "High"
                              ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                              : user.intensity === "Medium"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                              : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                          }`}
                        >
                          {user.intensity}
                        </span>
                      </td>

                      {/* Original Plan Column */}
                      <td className="py-3 px-4 align-top">
                        <div className="bg-slate-100 dark:bg-slate-900/80 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 max-h-56 overflow-y-auto w-full">
                          <pre className="font-mono text-xs text-slate-800 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                            {user.original_plan}
                          </pre>
                        </div>
                      </td>

                      {/* Updated Plan & Version Column */}
                      <td className="py-3 px-4 align-top">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 font-mono">
                              {user.current_version || "v1.0"}
                            </span>

                            <button
                              onClick={() => setHistoryModalUserId(user.id)}
                              className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 flex items-center gap-1"
                            >
                              <History className="w-3 h-3" />
                              <span>History ({user.versions_count})</span>
                            </button>
                          </div>

                          <div
                            className={`p-2.5 rounded-lg border max-h-52 overflow-y-auto w-full ${
                              user.updated_plan !== "Not updated"
                                ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50"
                                : "bg-slate-100 dark:bg-slate-900/80 border-slate-200 dark:border-slate-700"
                            }`}
                          >
                            <pre
                              className={`font-mono text-xs whitespace-pre-wrap leading-relaxed ${
                                user.updated_plan !== "Not updated"
                                  ? "text-emerald-950 dark:text-emerald-200"
                                  : "text-slate-500 italic"
                              }`}
                            >
                              {user.updated_plan}
                            </pre>
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 align-top text-center whitespace-nowrap">
                        <div className="flex flex-col gap-1.5 items-center">
                          <button
                            onClick={() => onSelectUserForPlan(user.id)}
                            className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
                            title="Load plan into view"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View Plan</span>
                          </button>

                          <button
                            onClick={() => setSelectedModalUser(user)}
                            className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
                          >
                            Inspect
                          </button>

                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-500 hover:text-red-700 p-1 text-xs transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal for User Detailed Inspection */}
        {selectedModalUser && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800">
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    User #{selectedModalUser.id}: {selectedModalUser.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedModalUser.goal} • {selectedModalUser.intensity} Intensity • {selectedModalUser.weight}kg • Active Version: {selectedModalUser.current_version}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedModalUser(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 flex items-center justify-center text-slate-500 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4 text-sm">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-1">
                    💡 Gemini Flash Nutrition Tip:
                  </h4>
                  <p className="p-3 bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-500 rounded text-slate-800 dark:text-slate-200 text-xs leading-relaxed">
                    {selectedModalUser.nutrition_tip}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Original Plan (v1.0):
                    </h4>
                    <div className="bg-slate-100 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800 max-h-72 overflow-y-auto">
                      <pre className="font-mono text-xs text-slate-800 dark:text-slate-300 whitespace-pre-wrap">
                        {selectedModalUser.original_plan}
                      </pre>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1">
                      Current Active Plan ({selectedModalUser.current_version}):
                    </h4>
                    <div className="bg-slate-100 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800 max-h-72 overflow-y-auto">
                      <pre className="font-mono text-xs text-slate-800 dark:text-slate-300 whitespace-pre-wrap">
                        {selectedModalUser.updated_plan}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  onClick={() => {
                    onSelectUserForPlan(selectedModalUser.id);
                    setSelectedModalUser(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                >
                  Open in Active Plan Viewer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Version History Modal */}
        {historyModalUserId && (
          <VersionHistoryModal
            userId={historyModalUserId}
            isOpen={true}
            onClose={() => setHistoryModalUserId(null)}
            onRestoreVersion={async (versionId) => {
              await fetch("/api/restore-plan-version", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  user_id: historyModalUserId,
                  version_id: versionId,
                }),
              });
              await fetchUsers();
            }}
          />
        )}
      </div>
    </div>
  );
};
