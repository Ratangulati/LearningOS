"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Onboarding() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [goalInput, setGoalInput] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [answers, setAnswers] = useState({
    fullName: "",
    branch: "",
    semesterWeeks: "16",
    dailyMinutes: "90",
    experience: "",
    provider: "openai",
    model: "gpt-4o-mini",
  });

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      if (goals.length === 0 || !answers.branch || !answers.experience) {
        setError("Please add at least one goal, plus branch and current level.");
        setLoading(false);
        return;
      }

      let score = 1;
      if (answers.experience === "beginner") score += 1;
      if (answers.experience === "intermediate") score += 2;
      if (answers.experience === "advanced") score += 3;

      let level = "beginner";
      if (score >= 3 && score <= 4) level = "intermediate";
      if (score > 4) level = "advanced";

      await supabase.from("profiles").insert([
        {
          purpose: "university_learning_os",
          level,
          projects: "0",
          hackathons: "0",
          interest: answers.branch,
          goal: goals[0],
          time_commitment: `${answers.dailyMinutes} mins/day`,
        },
      ]);

      const createdGoalIds: string[] = [];
      for (const goalText of goals) {
        const goalRes = await fetch("/api/goals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ goalText }),
        });
        const goalPayload = await goalRes.json();
        if (!goalRes.ok || !goalPayload.goal?.id) {
          throw new Error(goalPayload?.message || "Failed to create goals.");
        }
        createdGoalIds.push(goalPayload.goal.id);

        const roadmapRes = await fetch("/api/roadmap/generate-for-goal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            goalId: goalPayload.goal.id,
            level,
            interest: answers.branch,
            semesterWeeks: Number(answers.semesterWeeks),
            dailyMinutes: Number(answers.dailyMinutes),
            provider: answers.provider,
            model: answers.model,
          }),
        });
        const roadmapPayload = await roadmapRes.json();
        if (!roadmapRes.ok || !Array.isArray(roadmapPayload.roadmap)) {
          throw new Error(roadmapPayload?.message || `Failed to generate roadmap for "${goalText}".`);
        }
      }

      localStorage.setItem("ai_provider", answers.provider);
      localStorage.setItem("ai_model", answers.model);
      const firstGoal = createdGoalIds[0];
      window.location.href = firstGoal ? `/roadmap?goalId=${firstGoal}` : "/roadmap";
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Something went wrong while creating your plans.");
    }

    setLoading(false);
  };

  const addGoal = () => {
    const clean = goalInput.trim();
    if (!clean) return;
    if (goals.includes(clean)) {
      setGoalInput("");
      return;
    }
    setGoals((prev) => [...prev, clean]);
    setGoalInput("");
  };

  const removeGoal = (goal: string) => {
    setGoals((prev) => prev.filter((g) => g !== goal));
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-10">
      <div className="max-w-4xl mx-auto grid gap-6 md:grid-cols-3">
        <section className="md:col-span-1 card h-fit">
          <p className="badge mb-3">Learning OS Setup</p>
          <h1 className="page-header text-2xl">Student Profile</h1>
          <p className="page-subheader mb-4">
            One-time setup to generate your semester roadmap and daily plan.
          </p>
          <ul className="text-sm text-zinc-400 space-y-2">
            <li>1. Define your semester goal</li>
            <li>2. Set your study capacity</li>
            <li>3. Generate adaptive roadmap</li>
          </ul>
        </section>

        <section className="md:col-span-2 card animate-fadeIn">
          <div className="grid gap-4">
            <input
              placeholder="Your full name"
              onChange={(e) => setAnswers({ ...answers, fullName: e.target.value })}
              className="field-input"
            />

            <div className="grid gap-2">
              <label className="text-sm text-zinc-300">Add one or more goals</label>
              <div className="flex gap-2">
                <input
                  placeholder="e.g. Learn React Hooks and score A grade"
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  className="field-input"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addGoal();
                    }
                  }}
                />
                <button type="button" className="btn-ghost" onClick={addGoal}>
                  Add
                </button>
              </div>
              {goals.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {goals.map((goal) => (
                    <button
                      type="button"
                      key={goal}
                      onClick={() => removeGoal(goal)}
                      className="badge cursor-pointer hover:bg-zinc-700"
                      title="Remove goal"
                    >
                      {goal} ×
                    </button>
                  ))}
                </div>
              )}
            </div>

            <input
              placeholder="Branch / track (e.g. CSE, ECE, BBA)"
              onChange={(e) => setAnswers({ ...answers, branch: e.target.value })}
              className="field-input"
            />

            <div className="grid md:grid-cols-3 gap-3">
              <select
                onChange={(e) => setAnswers({ ...answers, experience: e.target.value })}
                className="field-input"
              >
                <option value="">Current level</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>

              <select
                value={answers.semesterWeeks}
                onChange={(e) => setAnswers({ ...answers, semesterWeeks: e.target.value })}
                className="field-input"
              >
                <option value="12">12-week semester</option>
                <option value="16">16-week semester</option>
                <option value="20">20-week semester</option>
              </select>

              <select
                value={answers.dailyMinutes}
                onChange={(e) => setAnswers({ ...answers, dailyMinutes: e.target.value })}
                className="field-input"
              >
                <option value="60">60 mins/day</option>
                <option value="90">90 mins/day</option>
                <option value="120">120 mins/day</option>
                <option value="180">180 mins/day</option>
              </select>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <select
                value={answers.provider}
                onChange={(e) =>
                  setAnswers((prev) => ({
                    ...prev,
                    provider: e.target.value,
                    model: e.target.value === "gemini" ? "gemini-1.5-flash" : "gpt-4o-mini",
                  }))
                }
                className="field-input"
              >
                <option value="openai">OpenAI</option>
                <option value="gemini">Gemini</option>
              </select>
              <input
                value={answers.model}
                onChange={(e) => setAnswers({ ...answers, model: e.target.value })}
                className="field-input"
                placeholder="Model (e.g. gpt-4o-mini / gemini-1.5-flash)"
              />
            </div>
          </div>

          {error && <p className="text-red-400 mt-4">{error}</p>}

          <div className="mt-6 flex items-center justify-between">
            <p className="text-xs text-zinc-500">Takes less than 30 seconds</p>
            <button onClick={handleSubmit} disabled={loading} className="btn-primary">
              {loading ? "Generating..." : "Generate Semester Roadmap"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}