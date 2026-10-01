import React, { useState, useEffect } from "react";
import { History, GitCommit, Check, RotateCcw, X, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { PlanVersionItem } from "../types";

interface VersionHistoryModalProps {
  userId: number;
  isOpen: boolean;
  onClose: () => void;
  onRestoreVersion: (versionId: number) => Promise<void>;
  currentVersion?: string;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  userId,
  isOpen,
  onClose,
  onRestoreVersion,
  currentVersion,
}) => {
  const [versions, setVersions] = useState<PlanVersionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<PlanVersionItem | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchVersions();
    }
  }, [isOpen, userId]);

  const fetchVersions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/plan-versions/${userId}`);
      const data = await res.json();
      if (data.versions) {
        setVersions(data.versions);
        if (data.versions.length > 0) {
          setSelectedVersion(data.versions[0]);
        }
      }
    } catch (e) {
      console.error("Fetch versions error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async (versionId: number) => {
    if (!confirm(`Restore this version to your active routine?`)) return;
    setIsRestoring(true);
    try {
      await onRestoreVersion(versionId);
      onClose();
    } catch (e) {
      console.error("Restore error:", e);
    } finally {
      setIsRestoring(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                📜 AI Plan Version History
              </h3>
              <p className="text-xs text-slate-500">
                Track and restore every AI-generated modification and feedback revision
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 flex items-center justify-center text-slate-500 text-sm font-bold"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body (2 Columns) */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden">
          {/* Version List Sidebar */}
          <div className="md:col-span-4 border-r border-slate-200 dark:border-slate-800 p-4 overflow-y-auto space-y-2 bg-slate-50 dark:bg-slate-950">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Revision Timeline ({versions.length})
            </h4>

            {isLoading ? (
              <div className="py-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span>Loading versions...</span>
              </div>
            ) : versions.length === 0 ? (
              <div className="text-xs text-slate-500 py-6 text-center">
                No revisions found yet.
              </div>
            ) : (
              versions.map((ver) => {
                const isCurrent = currentVersion === ver.version_label;
                const isSelected = selectedVersion?.id === ver.id;
                return (
                  <button
                    key={ver.id}
                    onClick={() => setSelectedVersion(ver)}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${
                      isSelected
                        ? "bg-white dark:bg-slate-800 border-blue-500 shadow-sm"
                        : "bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-blue-700 dark:text-blue-400 font-mono text-sm">
                        {ver.version_label}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 font-medium truncate">
                      "{ver.feedback || "Initial Generation"}"
                    </p>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      {new Date(ver.created_at).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {/* Version Preview Pane */}
          <div className="md:col-span-8 p-5 overflow-y-auto flex flex-col space-y-4">
            {selectedVersion ? (
              <>
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <span className="text-xs font-semibold text-slate-500">Selected Revision:</span>
                    <h4 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="font-mono text-blue-600">{selectedVersion.version_label}</span>
                      <span className="text-xs font-normal text-slate-500">
                        • {new Date(selectedVersion.created_at).toLocaleString()}
                      </span>
                    </h4>
                    {selectedVersion.feedback && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 italic">
                        Prompt: "{selectedVersion.feedback}"
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => handleRestore(selectedVersion.id)}
                    disabled={isRestoring || currentVersion === selectedVersion.version_label}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRestoring ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {currentVersion === selectedVersion.version_label
                        ? "Active Version"
                        : "Restore This Version"}
                    </span>
                  </button>
                </div>

                {/* Plan Content */}
                <div className="bg-slate-100 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex-1 overflow-y-auto max-h-[50vh]">
                  <pre className="font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {selectedVersion.plan_text}
                  </pre>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
                Select a version from the timeline on the left to preview.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
