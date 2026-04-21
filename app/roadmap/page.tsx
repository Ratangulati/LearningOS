"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import RoadmapGraph from "@/components/RoadmapGraph";

type Session = { id: string; subject: string; level: string; created_at: string };

export default function RoadmapPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stepsLoading, setStepsLoading] = useState(false);

  // Fetch all sessions for the user
  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from("roadmap_sessions")
          .select("id, subject, level, created_at")
          .order("created_at", { ascending: true });

        const list = (data || []) as Session[];
        setSessions(list);
        if (list.length > 0) setActiveSessionId(list[0].id);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchSessions();
  }, []);

  // Fetch steps for the active session
  useEffect(() => {
    if (!activeSessionId) return;
    const fetchSteps = async () => {
      setStepsLoading(true);
      const { data } = await supabase
        .from("roadmap")
        .select("*")
        .eq("session_id", activeSessionId)
        .order("order_index");
      setSteps(data || []);
      setStepsLoading(false);
    };
    fetchSteps();
  }, [activeSessionId]);

  const handleStepClick = async (step: any) => {
    try {
      const res = await fetch("/api/get-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: step.platform, difficulty: step.difficulty, stepText: step.step }),
      });
      const data = await res.json();
      if (!data.link) return;
      window.open(data.link, "_blank");
      await supabase.from("roadmap").update({ status: "completed" }).eq("id", step.id);
      setSteps((prev) => prev.map((s) => s.id === step.id ? { ...s, status: "completed" } : s));
    } catch (err) {
      console.error(err);
    }
  };

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const completedCount = steps.filter((s) => s.status === "completed").length;
  const progress = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <p className="badge mb-2">Learning Path</p>
        <h1 className="text-3xl font-bold mb-6">Your AI Roadmap</h1>

        {loading && <p className="text-zinc-400">Loading roadmaps...</p>}

        {!loading && sessions.length === 0 && (
          <p className="text-zinc-500">No roadmap found. Complete onboarding first.</p>
        )}

        {!loading && sessions.length > 0 && (
          <>
            {/* Subject tabs */}
            <div className="flex flex-wrap gap-2 mb-6 border-b border-zinc-800 pb-4">
              {sessions.map((session) => {
                const isActive = session.id === activeSessionId;
                return (
                  <button
                    key={session.id}
                    onClick={() => setActiveSessionId(session.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      isActive
                        ? "bg-indigo-600/20 border-indigo-500 text-indigo-300"
                        : "bg-transparent border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white"
                    }`}
                  >
                    {session.subject || "General"}
                  </button>
                );
              })}
            </div>

            {/* Progress bar for active subject */}
            {activeSession && (
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-zinc-400">{activeSession.subject}</span>
                  <span className="text-zinc-400">{completedCount}/{steps.length} steps · {progress}%</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-2 bg-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Steps graph */}
            {stepsLoading && <p className="text-zinc-400">Loading steps...</p>}
            {!stepsLoading && steps.length > 0 && (
              <RoadmapGraph steps={steps} onStepClick={handleStepClick} />
            )}
          </>
        )}
      </div>
    </main>
  );
}
