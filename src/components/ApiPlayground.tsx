import React, { useState } from "react";
import { Terminal, Play, Loader2, CheckCircle2, AlertCircle, Copy, Check } from "lucide-react";

interface ApiEndpoint {
  method: "GET" | "POST";
  path: string;
  title: string;
  description: string;
  defaultPayload?: any;
  defaultParams?: Record<string, string>;
}

export const ApiPlayground: React.FC = () => {
  const endpoints: ApiEndpoint[] = [
    {
      method: "POST",
      path: "/api/generate-workout/gemini",
      title: "1. Generate Workout via Gemini",
      description: "Generates a structured 7-day workout plan based on fitness goal and intensity.",
      defaultPayload: {
        goal: "Lose belly fat and gain muscles",
        intensity: "Medium",
      },
    },
    {
      method: "GET",
      path: "/api/nutrition-tip",
      title: "2. Generate Nutrition Tip via Gemini Flash",
      description: "Generates a quick, practical recovery or nutrition tip using the Gemini Flash model.",
      defaultParams: {
        goal: "weight loss, flexibility",
      },
    },
    {
      method: "POST",
      path: "/api/generate-plan",
      title: "3. Save User & Generate Full Plan",
      description: "Persists user profile to database and generates a personalized workout plan.",
      defaultPayload: {
        user_id: 42,
        username: "Alex Morgan",
        age: 26,
        weight: 68.5,
        goal: "5k marathon cardio endurance",
        intensity: "High",
      },
    },
    {
      method: "POST",
      path: "/api/update-plan/10",
      title: "4. Update Workout Plan via User Feedback",
      description: "Takes existing plan for user_id and updates it with feedback via Gemini.",
      defaultPayload: {
        feedback: "Add 15 minutes of core yoga in cooldown",
      },
    },
    {
      method: "GET",
      path: "/api/view-all-users",
      title: "5. Admin View All Users & Plans",
      description: "Fetches list of all registered users with their original and revised plans.",
    },
  ];

  const [activeEndpointIndex, setActiveEndpointIndex] = useState(0);
  const [requestBody, setRequestBody] = useState(
    JSON.stringify(endpoints[0].defaultPayload, null, 2)
  );
  const [queryParams, setQueryParams] = useState<Record<string, string>>(
    endpoints[0].defaultParams || {}
  );
  const [responseOutput, setResponseOutput] = useState<any>(null);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [copied, setCopied] = useState(false);

  const selectEndpoint = (index: number) => {
    setActiveEndpointIndex(index);
    const ep = endpoints[index];
    if (ep.defaultPayload) {
      setRequestBody(JSON.stringify(ep.defaultPayload, null, 2));
    } else {
      setRequestBody("");
    }
    setQueryParams(ep.defaultParams || {});
    setResponseOutput(null);
    setResponseStatus(null);
  };

  const handleExecute = async () => {
    const ep = endpoints[activeEndpointIndex];
    setIsExecuting(true);
    setResponseOutput(null);
    setResponseStatus(null);
    const startTime = performance.now();

    try {
      let url = ep.path;
      if (ep.method === "GET" && queryParams) {
        const search = new URLSearchParams(queryParams).toString();
        if (search) url += `?${search}`;
      }

      const options: RequestInit = {
        method: ep.method,
        headers: {
          "Content-Type": "application/json",
        },
      };

      if (ep.method === "POST" && requestBody) {
        options.body = requestBody;
      }

      const res = await fetch(url, options);
      const duration = Math.round(performance.now() - startTime);
      setResponseTime(duration);
      setResponseStatus(res.status);

      const json = await res.json();
      setResponseOutput(json);
    } catch (err: any) {
      setResponseStatus(500);
      setResponseOutput({ error: err.message || "Failed to execute request" });
    } finally {
      setIsExecuting(false);
    }
  };

  const currentEp = endpoints[activeEndpointIndex];

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 bg-slate-900 text-slate-100">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Terminal className="w-6 h-6 text-blue-400" />
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                FastAPI Interactive Endpoint Playground
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 font-semibold border border-emerald-800">
                Swagger / OpenAPI Mirror
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Test all backend routes from Activity 2.2 with live Gemini integration and real JSON responses.
            </p>
          </div>
        </div>

        {/* 2-column layout: Left sidebar list, Right execution panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Endpoint selector list */}
          <div className="lg:col-span-4 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1 mb-2">
              Available Endpoints
            </h3>
            {endpoints.map((ep, idx) => (
              <button
                key={idx}
                onClick={() => selectEndpoint(idx)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                  activeEndpointIndex === idx
                    ? "bg-slate-800 border-blue-500 shadow-md shadow-blue-500/10 text-white"
                    : "bg-slate-850/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                      ep.method === "POST"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                    }`}
                  >
                    {ep.method}
                  </span>
                  <span className="font-mono text-xs text-slate-300 truncate">
                    {ep.path}
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-200 truncate">
                  {ep.title}
                </div>
              </button>
            ))}
          </div>

          {/* Execution & Output Panel */}
          <div className="lg:col-span-8 space-y-4">
            {/* Request Card */}
            <div className="bg-slate-850 border border-slate-800 rounded-xl p-5 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-extrabold px-2.5 py-1 rounded ${
                      currentEp.method === "POST"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                    }`}
                  >
                    {currentEp.method}
                  </span>
                  <code className="font-mono text-sm text-blue-300">
                    {currentEp.path}
                  </code>
                </div>

                <button
                  onClick={handleExecute}
                  disabled={isExecuting}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/30 disabled:opacity-60 transition-colors"
                >
                  {isExecuting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending to Gemini...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Execute Request</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-slate-400 mb-4">
                {currentEp.description}
              </p>

              {/* Query Parameters if GET */}
              {currentEp.method === "GET" && currentEp.defaultParams && (
                <div className="space-y-2 mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                    Query Parameters:
                  </span>
                  {Object.entries(queryParams).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="font-mono text-xs text-blue-400 w-20">
                        {key}:
                      </span>
                      <input
                        type="text"
                        value={val}
                        onChange={(e) =>
                          setQueryParams({ ...queryParams, [key]: e.target.value })
                        }
                        className="flex-1 px-3 py-1.5 text-xs rounded bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* JSON Payload if POST */}
              {currentEp.method === "POST" && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                    JSON Body:
                  </span>
                  <textarea
                    rows={6}
                    value={requestBody}
                    onChange={(e) => setRequestBody(e.target.value)}
                    className="w-full font-mono text-xs p-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}
            </div>

            {/* Response Card */}
            <div className="bg-slate-850 border border-slate-800 rounded-xl p-5 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                <div className="flex items-center gap-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Response Output
                  </h4>
                  {responseStatus !== null && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-bold ${
                        responseStatus >= 200 && responseStatus < 300
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                          : "bg-red-950 text-red-300 border border-red-800"
                      }`}
                    >
                      Status: {responseStatus}
                    </span>
                  )}
                  {responseTime !== null && (
                    <span className="text-xs text-slate-400">
                      Time: {responseTime}ms
                    </span>
                  )}
                </div>

                {responseOutput && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        JSON.stringify(responseOutput, null, 2)
                      );
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? "Copied" : "Copy JSON"}</span>
                  </button>
                )}
              </div>

              {responseOutput ? (
                <pre className="font-mono text-xs text-emerald-300 bg-slate-950 p-4 rounded-lg overflow-x-auto max-h-96 leading-relaxed">
                  {JSON.stringify(responseOutput, null, 2)}
                </pre>
              ) : (
                <div className="py-12 text-center text-slate-500 text-xs">
                  Click "Execute Request" above to trigger endpoint and view response from Gemini.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
