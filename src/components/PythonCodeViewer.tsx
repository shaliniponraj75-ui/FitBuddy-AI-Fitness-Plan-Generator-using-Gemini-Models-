import React, { useState } from "react";
import { Code2, Copy, Check, Download, FileCode, Layers } from "lucide-react";
import { PYTHON_FILES, PythonFileItem } from "../data/pythonFiles";

export const PythonCodeViewer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<PythonFileItem>(PYTHON_FILES[0]);
  const [copied, setCopied] = useState(false);

  const categories = [
    "Activity 2.1 - Core Functions",
    "Activity 2.2 - FastAPI Backend",
    "Activity 4.2 & 5.2 - Templates & Config",
  ] as const;

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([selectedFile.code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = selectedFile.filename.split("/").pop() || "code.py";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 bg-slate-900 text-slate-100">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Code2 className="w-6 h-6 text-blue-400" />
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                Python & FastAPI Source Code Repository
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-900/60 text-blue-300 font-semibold border border-blue-700">
                FitBuddy Architecture
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Browse, copy, or download the exact Python backend modules and Jinja2 templates developed for Activities 2.1, 2.2, 4.2, and 5.2.
            </p>
          </div>
        </div>

        {/* 2-Column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* File Explorer Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            {categories.map((cat, cIdx) => (
              <div key={cIdx} className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 flex items-center gap-1.5">
                  <Layers className="w-3 h-3 text-blue-400" />
                  {cat}
                </span>
                <div className="space-y-1">
                  {PYTHON_FILES.filter((f) => f.category === cat).map((file, fIdx) => (
                    <button
                      key={fIdx}
                      onClick={() => setSelectedFile(file)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono transition-colors flex items-center gap-2 ${
                        selectedFile.filename === file.filename
                          ? "bg-blue-600 text-white font-bold shadow-sm"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                      }`}
                    >
                      <FileCode className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{file.filename}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Code Viewer */}
          <div className="lg:col-span-8 bg-slate-850 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col">
            {/* Header info of selected file */}
            <div className="bg-slate-800/90 px-5 py-3 border-b border-slate-700/80 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="font-mono text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                  <FileCode className="w-4 h-4 text-blue-400" />
                  {selectedFile.filename}
                </span>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedFile.description}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownload}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            {/* Code Box */}
            <div className="p-4 bg-slate-950 overflow-x-auto max-h-[70vh]">
              <pre className="font-mono text-xs text-slate-200 whitespace-pre leading-relaxed select-text">
                {selectedFile.code}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
