"use client";

import { useState } from "react";

type GeneratedTask = { task: string; status?: string };

export default function GoalForm() {
  const [goal, setGoal] = useState("");
  const [deadline, setDeadline] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!goal.trim()) return;

    setLoading(true);

    try {
      const goalRes = await fetch("/api/goals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          goalText: goal,
          deadline: deadline || null,
        }),
      });
      const goalPayload = await goalRes.json();
      if (!goalRes.ok || !goalPayload.goal) {
        alert(goalPayload?.message || "Failed to insert goal");
        setLoading(false);
        return;
      }
      const goalData = goalPayload.goal;

      // 🔹 2. Call AI API
      const res = await fetch("/api/generate-tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ goal }),
      });

      let tasks: GeneratedTask[] = [];

      try {
        const data = await res.json();
        tasks = data.tasks || [];
      } catch {
        tasks = [];
      }

      // 🔥 3. CLEAN + STRUCTURED TASK PARSING
      const taskRows = tasks
        .map((t, i: number) => {
          let cleanText = "";

          // ✅ Case 1: string
          if (typeof t === "string") {
            const trimmed = t.trim();

            // JSON-like string
            if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
              try {
                const parsed = JSON.parse(trimmed);

                if (Array.isArray(parsed)) {
                  cleanText = parsed[0]?.task || "";
                } else {
                  cleanText = parsed.task || "";
                }
              } catch {
                cleanText = trimmed;
              }
            } else {
              cleanText = trimmed;
            }
          }

          // ✅ Case 2: object
          else if (typeof t === "object" && t?.task) {
            cleanText = t.task;
          }

          return {
            goal_id: goalData.id,
            task_text: cleanText.trim(),
            status: "not_started",

            // 🔥 NEW FIELDS (for scaling)
            type: "learning",
            difficulty: "medium",

            order_index: i,
          };
        })
        .filter((row) => row.task_text.length > 0);

      // 🔹 4. Insert tasks
      if (taskRows.length > 0) {
        const taskRes = await fetch("/api/goals/tasks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            goalId: goalData.id,
            tasks: taskRows.map((row) => ({ task: row.task_text, status: row.status })),
          }),
        });
        if (!taskRes.ok) {
          const payload = await taskRes.json();
          console.error("Task insert error:", payload?.message || "Unknown error");
        }
      }

      // 🔹 5. Reset form
      setGoal("");
      setDeadline("");

      // 🔹 6. Refresh UI
      window.location.reload();
    } catch (err) {
      console.error("Unexpected error:", err);
      alert("Something went wrong");
    }

    setLoading(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-8 flex flex-col sm:flex-row gap-3"
    >
      {/* Goal Input */}
      <input
        type="text"
        placeholder="Enter your goal..."
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
        className="p-3 rounded bg-white text-black w-full sm:w-72 outline-none"
      />

      {/* Deadline */}
      <input
        type="date"
        value={deadline}
        onChange={(e) => setDeadline(e.target.value)}
        className="p-3 rounded bg-white text-black outline-none"
      />

      {/* Button */}
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 px-6 py-3 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Adding..." : "Add Goal"}
      </button>
    </form>
  );
}