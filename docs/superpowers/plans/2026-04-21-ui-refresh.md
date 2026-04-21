# UI Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Full UI refresh of Saarthi AI to a clean, professional SaaS aesthetic (Linear/Vercel-style) across all pages.

**Architecture:** Component-by-component refresh — globals first, then shared components, then pages. No changes to API routes, Supabase logic, or authentication. All existing functionality preserved.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, Framer Motion (installed), lucide-react (to install), TypeScript

---

## Files Modified

| File | Change |
|------|--------|
| `package.json` | Add `lucide-react` |
| `app/globals.css` | Add card, btn, badge, page-header, dot-grid utilities |
| `components/Navbar.tsx` | Icons, pill active state, outlined auth button |
| `app/page.tsx` | Dot grid bg, cleaner gradient, feature pills, arrow CTA |
| `app/onboarding/page.tsx` | Centered card, progress bar, styled inputs, spinner |
| `app/goals/page.tsx` | Card layout, indigo accent border |
| `components/GoalForm.tsx` | Dark styled inputs |
| `components/TaskItem.tsx` | Indigo checkbox, styled layout |
| `app/roadmap/page.tsx` | page-header, progress bar |
| `app/learning/page.tsx` | Dark chat bubbles, styled input bar, header |
| `app/upskill/page.tsx` | Remove blobs, add dot grid, indigo gradient heading |
| `components/SkillCard.tsx` | Indigo gradient, zinc border |
| `app/calendar/page.tsx` | Dark theme (currently white bg), zinc cards |
| `app/credentials/page.tsx` | Indigo filter pills, consistent card style |
| `app/about/page.tsx` | Minimal — already uses Framer Motion well, just align colors |

---

## Task 1: Install lucide-react

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install the package**

Run: `npm install lucide-react`
Expected: Package added to `node_modules`, `package.json` updated with `"lucide-react": "^x.x.x"`

- [ ] **Step 2: Verify install**

Run: `node -e "require('lucide-react'); console.log('ok')"`
Expected: `ok`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install lucide-react for nav icons"
```

---

## Task 2: Global CSS utilities

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Replace globals.css content**

Replace the entire file with:

```css
@import "tailwindcss";

:root {
  --background: #0a0a0a;
  --foreground: #ffffff;
  --surface: #111111;
  --border: #222222;
  --accent: #6366f1;
  --text-secondary: #a1a1aa;
  --text-muted: #52525b;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans), Arial, Helvetica, sans-serif;
  font-size: 16px;
  line-height: 1.6;
}

/* ── Dot grid background ── */
.dot-grid {
  background-image: radial-gradient(circle, #333 1px, transparent 1px);
  background-size: 28px 28px;
}

/* ── Card ── */
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 0.75rem;
  padding: 1.5rem;
}

/* ── Buttons ── */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--accent);
  color: #fff;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: opacity 0.15s, transform 0.15s;
}
.btn-primary:hover {
  opacity: 0.9;
  transform: scale(1.02);
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  color: var(--text-secondary);
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  border: 1px solid #333;
  font-weight: 500;
  transition: background 0.15s, color 0.15s;
}
.btn-ghost:hover {
  background: #1a1a1a;
  color: #fff;
}

/* ── Badge ── */
.badge {
  display: inline-block;
  background: #1a1a1a;
  color: var(--text-secondary);
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  border: 1px solid var(--border);
}

/* ── Page header ── */
.page-header {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.2;
  color: #fff;
  margin-bottom: 0.5rem;
}
.page-subheader {
  color: var(--text-secondary);
  font-size: 0.95rem;
  margin-bottom: 2rem;
}

/* ── Form fields ── */
.field-input {
  width: 100%;
  background: #0f0f0f;
  border: 1px solid #333;
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  color: #fff;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.15s;
}
.field-input:focus {
  border-color: var(--accent);
}
.field-input::placeholder {
  color: var(--text-muted);
}

/* ── Animations ── */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-fadeIn {
  animation: fadeIn 0.35s ease both;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-8px); }
}

/* ── Progress bar ── */
.progress-bar-track {
  width: 100%;
  height: 6px;
  background: #1a1a1a;
  border-radius: 9999px;
  overflow: hidden;
}
.progress-bar-fill {
  height: 100%;
  background: var(--accent);
  border-radius: 9999px;
  transition: width 0.4s ease;
}
```

- [ ] **Step 2: Commit**

```bash
git add app/globals.css
git commit -m "style: add global design tokens, utilities, and animations"
```

---

## Task 3: Navbar

**Files:**
- Modify: `components/Navbar.tsx`

- [ ] **Step 1: Replace Navbar content**

```tsx
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import {
  Home, Target, Map, BookOpen, Zap, Calendar, Award, Info
} from "lucide-react";

const navItems = [
  { name: "Home",        path: "/",           icon: Home },
  { name: "My Goals",    path: "/goals",      icon: Target },
  { name: "Roadmap",     path: "/roadmap",    icon: Map },
  { name: "Learning",    path: "/learning",   icon: BookOpen },
  { name: "Upskill",     path: "/upskill",    icon: Zap },
  { name: "Calendar",    path: "/calendar",   icon: Calendar },
  { name: "Credentials", path: "/credentials",icon: Award },
  { name: "About",       path: "/about",      icon: Info },
];

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <nav className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">

        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
          <span className="text-base font-semibold text-white tracking-tight">
            Saarthi AI
          </span>
        </div>

        {/* Nav Links */}
        <div className="flex gap-1 text-sm">
          {navItems.map(({ name, path, icon: Icon }) => {
            const isActive = pathname === path;
            return (
              <Link
                key={name}
                href={path}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors duration-150
                  ${isActive
                    ? "bg-indigo-600/20 text-indigo-400"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                  }`}
              >
                <Icon size={14} />
                {name}
              </Link>
            );
          })}
        </div>

        {/* Auth */}
        <div className="flex items-center gap-3">
          {session?.user ? (
            <>
              <img
                src={session.user.image || ""}
                alt="profile"
                className="w-8 h-8 rounded-full border border-zinc-700 hover:ring-2 hover:ring-indigo-500 transition"
              />
              <button
                onClick={() => signOut()}
                className="text-sm text-zinc-400 hover:text-white transition"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={() => signIn("google")}
              className="text-sm border border-zinc-700 text-white px-4 py-1.5 rounded-lg hover:bg-zinc-800 transition"
            >
              Sign in
            </button>
          )}
        </div>

      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/Navbar.tsx
git commit -m "style: restyle navbar with icons, indigo active pill, outlined auth"
```

---

## Task 4: Landing Page

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Replace page.tsx content**

```tsx
"use client";

import { ArrowRight } from "lucide-react";
import SplineRobot from "@/components/SplineRobot";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-[#0a0a0a] text-white overflow-hidden">

      {/* Dot grid */}
      <div className="absolute inset-0 dot-grid opacity-40" />
      {/* Radial fade over grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,#0a0a0a_80%)]" />

      <div className="relative z-10 grid md:grid-cols-2 items-center min-h-screen px-6 max-w-7xl mx-auto">

        {/* LEFT */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left animate-fadeIn">

          <h1 className="text-5xl md:text-6xl font-bold mb-5 leading-tight bg-gradient-to-r from-white to-indigo-400 text-transparent bg-clip-text">
            Saarthi AI
          </h1>

          <p className="text-base text-zinc-400 max-w-md mb-8 leading-relaxed">
            Your AI-powered career guide that builds personalized roadmaps,
            tracks your progress, and helps you grow step by step.
          </p>

          <div className="flex flex-wrap gap-3 mb-8">
            <button
              onClick={() => (window.location.href = "/onboarding")}
              className="btn-primary"
            >
              Get Started <ArrowRight size={16} />
            </button>
            <button
              onClick={() => (window.location.href = "/about")}
              className="btn-ghost"
            >
              See how it works
            </button>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2">
            {["AI Roadmaps", "Progress Tracking", "Resource Links"].map((f) => (
              <span key={f} className="badge">{f}</span>
            ))}
          </div>
        </div>

        {/* RIGHT */}
        <div className="h-[500px] md:h-[600px] w-full">
          <SplineRobot />
        </div>

      </div>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/page.tsx
git commit -m "style: refresh landing page with dot grid, indigo gradient, feature pills"
```

---

## Task 5: Onboarding Page

**Files:**
- Modify: `app/onboarding/page.tsx`

- [ ] **Step 1: Replace onboarding page content**

```tsx
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Loader2 } from "lucide-react";

const STEPS = ["Background", "Interests", "Goals"];

export default function Onboarding() {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);

  const [answers, setAnswers] = useState({
    purpose: "",
    experience: "",
    projects: "",
    hackathons: "",
    interest: "",
    goal: "",
    time: "",
  });

  const set = (key: string, val: string) =>
    setAnswers((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let score = 0;
      if (answers.experience === "beginner") score += 1;
      if (answers.experience === "intermediate") score += 2;
      if (answers.experience === "advanced") score += 3;
      if (answers.projects === "0") score += 1;
      if (answers.projects === "1-3") score += 2;
      if (answers.projects === "4+") score += 3;
      if (answers.hackathons === "0") score += 1;
      if (answers.hackathons === "1-2") score += 2;
      if (answers.hackathons === "3+") score += 3;

      let level = "beginner";
      if (score >= 6 && score <= 8) level = "intermediate";
      if (score > 8) level = "advanced";

      await supabase.from("profiles").insert([{
        purpose: answers.purpose,
        level,
        projects: answers.projects,
        hackathons: answers.hackathons,
        interest: answers.interest,
        goal: answers.goal,
        time_commitment: answers.time,
      }]);

      const res = await fetch("/api/generate-roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user-1",
          level,
          interest: answers.interest,
          goal: answers.goal,
          time_commitment: answers.time,
        }),
      });

      const data = await res.json();
      if (!data || !Array.isArray(data.roadmap)) {
        alert("Failed to generate roadmap");
        setLoading(false);
        return;
      }
      window.location.href = "/roadmap";
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
    setLoading(false);
  };

  const selectClass = "field-input";
  const labelClass = "block text-sm text-zinc-400 mb-1.5";

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-4 py-16">
      <div className="card w-full max-w-2xl animate-fadeIn">

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-zinc-500 mb-2">
            {STEPS.map((s, i) => (
              <span key={s} className={i <= step ? "text-indigo-400" : ""}>{s}</span>
            ))}
          </div>
          <div className="progress-bar-track">
            <div
              className="progress-bar-fill"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        <h1 className="page-header mb-1">Let's personalize your journey</h1>
        <p className="page-subheader">Answer a few questions so we can build your roadmap.</p>

        {/* Step 0: Background */}
        {step === 0 && (
          <div className="space-y-5 animate-fadeIn">
            <div>
              <label className={labelClass}>Why are you using Saarthi AI?</label>
              <select value={answers.purpose} onChange={(e) => set("purpose", e.target.value)} className={selectClass}>
                <option value="">Select a reason</option>
                <option value="learn">To learn new skills</option>
                <option value="placement">For placements</option>
                <option value="explore">To explore tech</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Your experience level</label>
              <select value={answers.experience} onChange={(e) => set("experience", e.target.value)} className={selectClass}>
                <option value="">Select level</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Number of projects built</label>
              <select value={answers.projects} onChange={(e) => set("projects", e.target.value)} className={selectClass}>
                <option value="">Select range</option>
                <option value="0">0</option>
                <option value="1-3">1–3</option>
                <option value="4+">4+</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Hackathons participated in</label>
              <select value={answers.hackathons} onChange={(e) => set("hackathons", e.target.value)} className={selectClass}>
                <option value="">Select range</option>
                <option value="0">0</option>
                <option value="1-2">1–2</option>
                <option value="3+">3+</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 1: Interests */}
        {step === 1 && (
          <div className="space-y-5 animate-fadeIn">
            <div>
              <label className={labelClass}>Your interest area</label>
              <input
                value={answers.interest}
                onChange={(e) => set("interest", e.target.value)}
                placeholder="e.g. Web Dev, AI, DSA"
                className={selectClass}
              />
            </div>
          </div>
        )}

        {/* Step 2: Goals */}
        {step === 2 && (
          <div className="space-y-5 animate-fadeIn">
            <div>
              <label className={labelClass}>Your goal (optional)</label>
              <input
                value={answers.goal}
                onChange={(e) => set("goal", e.target.value)}
                placeholder="e.g. Get a job at a product company"
                className={selectClass}
              />
            </div>
            <div>
              <label className={labelClass}>Daily time commitment</label>
              <select value={answers.time} onChange={(e) => set("time", e.target.value)} className={selectClass}>
                <option value="">Select hours</option>
                <option value="1-2">1–2 hrs/day</option>
                <option value="3-4">3–4 hrs/day</option>
                <option value="5+">5+ hrs/day</option>
              </select>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="btn-ghost disabled:opacity-30"
          >
            Back
          </button>

          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep((s) => s + 1)} className="btn-primary">
              Continue
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading} className="btn-primary w-full justify-center">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Generating...</> : "Generate My Roadmap"}
            </button>
          )}
        </div>

      </div>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/onboarding/page.tsx
git commit -m "style: redesign onboarding with card layout, step progress, and styled inputs"
```

---

## Task 6: Goals Page + GoalForm + TaskItem

**Files:**
- Modify: `app/goals/page.tsx`
- Modify: `components/GoalForm.tsx`
- Modify: `components/TaskItem.tsx`

- [ ] **Step 1: Update GoalForm.tsx**

```tsx
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Plus, Loader2 } from "lucide-react";

export default function GoalForm() {
  const [goal, setGoal] = useState("");
  const [deadline, setDeadline] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim()) return;
    setLoading(true);

    try {
      const { data: goalData, error } = await supabase
        .from("goals")
        .insert([{ goal_text: goal, deadline: deadline || null }])
        .select()
        .single();

      if (error || !goalData) {
        alert(error?.message || "Failed to insert goal");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/generate-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal }),
      });

      let tasks: any[] = [];
      try {
        const data = await res.json();
        tasks = data.tasks || [];
      } catch { tasks = []; }

      const taskRows = tasks
        .map((t: any, i: number) => {
          let cleanText = "";
          if (typeof t === "string") {
            const trimmed = t.trim();
            if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
              try {
                const parsed = JSON.parse(trimmed);
                cleanText = Array.isArray(parsed) ? parsed[0]?.task || "" : parsed.task || "";
              } catch { cleanText = trimmed; }
            } else { cleanText = trimmed; }
          } else if (typeof t === "object" && t?.task) {
            cleanText = t.task;
          }
          return { goal_id: goalData.id, task_text: cleanText.trim(), status: "not_started", type: "learning", difficulty: "medium", order_index: i };
        })
        .filter((row) => row.task_text.length > 0);

      if (taskRows.length > 0) {
        const { error: taskError } = await supabase.from("tasks").insert(taskRows);
        if (taskError) console.error("Task insert error:", taskError);
      }

      setGoal("");
      setDeadline("");
      window.location.reload();
    } catch (err) {
      console.error("Unexpected error:", err);
      alert("Something went wrong");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 mb-8">
      <input
        type="text"
        placeholder="Enter your goal..."
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
        className="field-input flex-1"
      />
      <input
        type="date"
        value={deadline}
        onChange={(e) => setDeadline(e.target.value)}
        className="field-input w-auto"
      />
      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
        {loading ? "Adding..." : "Add Goal"}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Update TaskItem.tsx**

```tsx
"use client";

import { useState } from "react";

export default function TaskItem({ task }: any) {
  const [status, setStatus] = useState(task.status);

  const toggleStatus = async () => {
    const newStatus = status === "completed" ? "not_started" : "completed";
    setStatus(newStatus);

    const res = await fetch("/api/update-task", {
      method: "POST",
      body: JSON.stringify({ taskId: task.id, status: newStatus }),
    });
    const data = await res.json();
    if (data.error) {
      alert("Failed to update");
      setStatus(task.status);
    }
  };

  const done = status === "completed";

  return (
    <li
      onClick={toggleStatus}
      className="flex items-center gap-2.5 py-1 cursor-pointer group"
    >
      <span className={`w-4 h-4 rounded flex-shrink-0 border flex items-center justify-center transition
        ${done ? "bg-indigo-600 border-indigo-600" : "border-zinc-600 group-hover:border-indigo-500"}`}
      >
        {done && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </span>
      <span className={`text-sm transition ${done ? "line-through text-zinc-600" : "text-zinc-300 group-hover:text-white"}`}>
        {task.task_text}
      </span>
    </li>
  );
}
```

- [ ] **Step 3: Update goals/page.tsx**

```tsx
import { supabase } from "@/lib/supabaseClient";
import GoalForm from "@/components/GoalForm";
import TaskItem from "@/components/TaskItem";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const { data, error } = await supabase
    .from("goals")
    .select("*, tasks(*)")
    .order("created_at", { ascending: false });

  if (error) console.error("Error fetching data:", error);

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white px-6 py-10 max-w-3xl mx-auto">
      <h1 className="page-header">My Goals</h1>
      <p className="page-subheader">Set goals and track AI-generated tasks.</p>

      <GoalForm />

      {data?.length === 0 && (
        <p className="text-zinc-500 text-sm">No goals yet. Add one above.</p>
      )}

      <div className="space-y-4">
        {data?.map((goal: any) => (
          <div key={goal.id} className="card border-l-4 border-l-indigo-600">
            <p className="font-semibold text-white mb-1">{goal.goal_text}</p>
            {goal.deadline && (
              <span className="badge mb-3 inline-block">Due: {goal.deadline}</span>
            )}
            {goal.tasks?.length > 0 && (
              <ul className="mt-3 space-y-0.5">
                {goal.tasks.map((task: any) => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add app/goals/page.tsx components/GoalForm.tsx components/TaskItem.tsx
git commit -m "style: refresh goals page, GoalForm inputs, and TaskItem checkbox"
```

---

## Task 7: Roadmap Page

**Files:**
- Modify: `app/roadmap/page.tsx`

- [ ] **Step 1: Replace roadmap page content**

```tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import RoadmapGraph from "@/components/RoadmapGraph";

export default function RoadmapPage() {
  const [steps, setSteps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: sessions } = await supabase
          .from("roadmap_sessions")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(1);

        if (!sessions || sessions.length === 0) { setSteps([]); setLoading(false); return; }

        const { data: roadmap } = await supabase
          .from("roadmap")
          .select("*")
          .eq("session_id", sessions[0].id)
          .order("order_index");

        setSteps(roadmap || []);
      } catch (err) {
        console.error("Fetch error:", err);
        setSteps([]);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleStepClick = async (step: any) => {
    if (activeId === step.id) return;
    setActiveId(step.id);
    try {
      const res = await fetch("/api/get-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: step.platform, difficulty: step.difficulty, stepText: step.step }),
      });
      const data = await res.json();
      if (!data.link) { alert("No resource found"); setActiveId(null); return; }
      window.open(data.link, "_blank");
      await supabase.from("roadmap").update({ status: "completed" }).eq("id", step.id);
      setSteps((prev) => prev.map((s) => s.id === step.id ? { ...s, status: "completed" } : s));
    } catch (err) {
      console.error("Click error:", err);
      alert("Something went wrong");
    }
    setActiveId(null);
  };

  const completed = steps.filter((s) => s.status === "completed").length;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white px-6 py-10">
      <div className="max-w-7xl mx-auto">
        <h1 className="page-header">Your AI Roadmap</h1>
        <p className="page-subheader">Click any step to open the best learning resource.</p>

        {/* Progress summary */}
        {!loading && steps.length > 0 && (
          <div className="mb-8">
            <div className="flex justify-between text-sm text-zinc-400 mb-2">
              <span>{completed} of {steps.length} steps completed</span>
              <span>{Math.round((completed / steps.length) * 100)}%</span>
            </div>
            <div className="progress-bar-track">
              <div className="progress-bar-fill" style={{ width: `${(completed / steps.length) * 100}%` }} />
            </div>
          </div>
        )}

        {loading && <p className="text-zinc-500">Loading roadmap...</p>}
        {!loading && steps.length === 0 && (
          <p className="text-zinc-500">No roadmap found. Complete onboarding first.</p>
        )}
        {!loading && steps.length > 0 && (
          <RoadmapGraph steps={steps} onStepClick={handleStepClick} />
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/roadmap/page.tsx
git commit -m "style: refresh roadmap page with progress bar and page-header"
```

---

## Task 8: Learning Page

**Files:**
- Modify: `app/learning/page.tsx`

- [ ] **Step 1: Replace learning page content**

```tsx
"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import Visualizer from "@/components/Visualizer";
import { Mic, Send } from "lucide-react";

export default function LearningPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [isVoiceInput, setIsVoiceInput] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getRoadmapLink = (topic: string) => {
    const t = (topic || "").toLowerCase();
    if (t.includes("data") || t.includes("algorithm")) return "https://roadmap.sh/datastructures-and-algorithms";
    if (t.includes("web")) return "https://roadmap.sh/frontend";
    if (t.includes("backend")) return "https://roadmap.sh/backend";
    if (t.includes("ai")) return "https://roadmap.sh/machine-learning";
    return "https://roadmap.sh";
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { alert("Speech recognition not supported"); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.start();
    setListening(true);
    recognition.onresult = (e: any) => {
      setInput(e.results[0][0].transcript);
      setIsVoiceInput(true);
      setListening(false);
    };
    recognition.onerror = () => setListening(false);
  };

  const speakInChunks = (text: string) => {
    const clean = text.replace(/#+\s/g, "").replace(/\*\*/g, "").replace(/[-•]/g, "").replace(/`/g, "").replace(/[\p{Emoji}]/gu, "").replace(/\s+/g, " ").trim();
    const sentences = clean.split(/(?<=[.!?])\s+/);
    let i = 0;
    const speakNext = () => {
      if (i >= sentences.length) return;
      const speech = new SpeechSynthesisUtterance(sentences[i]);
      speech.rate = 1; speech.pitch = 1;
      speech.onend = () => { i++; speakNext(); };
      window.speechSynthesis.speak(speech);
    };
    window.speechSynthesis.cancel();
    speakNext();
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    window.speechSynthesis.cancel();
    const userMsg = { role: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/learning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });
      const data = await res.json();
      const botMsg = { role: "bot", text: "", topic: data.topic, videos: data.videos, steps: data.steps };
      setMessages((prev) => [...prev, botMsg]);
      const fullText = data.explanation || "";
      if (isVoiceInput) { speakInChunks(fullText); setIsVoiceInput(false); }
      let i = 0;
      const interval = setInterval(() => {
        i++;
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1].text = fullText.slice(0, i);
          return updated;
        });
        if (i >= fullText.length) clearInterval(interval);
      }, 10);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  return (
    <main className="h-[calc(100vh-57px)] bg-[#0a0a0a] text-white flex flex-col">

      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-800 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
        <span className="font-semibold text-white">Learning Assistant</span>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[70%] px-4 py-3 text-sm rounded-2xl
              ${msg.role === "user"
                ? "bg-indigo-600 rounded-br-md text-white"
                : "bg-zinc-900 border border-zinc-800 rounded-bl-md text-zinc-200"}`}
            >
              <ReactMarkdown>{msg.text}</ReactMarkdown>

              {msg.videos?.length > 0 && (
                <div className="flex gap-3 mt-3 overflow-x-auto">
                  {msg.videos.map((v: any, idx: number) => (
                    <div key={idx} onClick={() => setActiveVideo(v.videoId)}
                      className="cursor-pointer min-w-[200px] bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden hover:border-indigo-500 transition">
                      <img src={v.thumbnail} />
                      <p className="text-xs p-2 text-zinc-300">{v.title}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeVideo && (
                <div className="mt-3">
                  <button onClick={() => setActiveVideo(null)}
                    className="text-xs text-zinc-400 hover:text-white mb-2 underline">
                    Close video
                  </button>
                  <iframe width="100%" height="200" src={`https://www.youtube.com/embed/${activeVideo}`} />
                </div>
              )}

              {msg.topic && msg.topic.length > 3 && (
                <div className="mt-3">
                  <button onClick={() => window.open(getRoadmapLink(msg.topic), "_blank")}
                    className="btn-ghost text-xs py-1.5 px-3">
                    View Roadmap
                  </button>
                </div>
              )}

              {msg.steps?.length > 0 && <Visualizer steps={msg.steps} />}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-zinc-900 border border-zinc-800 px-4 py-3 rounded-2xl rounded-bl-md flex gap-1">
              {[0, 150, 300].map((d) => (
                <span key={d} className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: `${d}ms` }} />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-4 border-t border-zinc-800 flex gap-2">
        <button onClick={startListening}
          className={`p-3 rounded-lg border transition ${listening ? "bg-red-600 border-red-600 text-white" : "border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500"}`}>
          <Mic size={16} />
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder={listening ? "Listening..." : "Ask anything..."}
          className="field-input flex-1"
        />
        <button onClick={handleSend} className="btn-primary px-5">
          <Send size={15} />
        </button>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/learning/page.tsx
git commit -m "style: refresh learning chat page with dark bubbles, indigo accents, icon buttons"
```

---

## Task 9: Upskill Page + SkillCard

**Files:**
- Modify: `app/upskill/page.tsx`
- Modify: `components/SkillCard.tsx`

- [ ] **Step 1: Update SkillCard.tsx**

```tsx
"use client";

import { useRef } from "react";

export default function SkillCard({ skill, onClick }: any) {
  const ref = useRef<HTMLDivElement | null>(null);

  const handleMouseMove = (e: any) => {
    const card = ref.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rotateX = (y / rect.height - 0.5) * 8;
    const rotateY = (x / rect.width - 0.5) * -8;
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    card.style.setProperty("--x", `${x}px`);
    card.style.setProperty("--y", `${y}px`);
  };

  const reset = () => {
    const card = ref.current;
    if (!card) return;
    card.style.transform = "perspective(1000px) rotateX(0) rotateY(0) scale(1)";
  };

  const getIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes("ai") || t.includes("machine")) return "AI";
    if (t.includes("cloud")) return "CL";
    if (t.includes("data")) return "DA";
    if (t.includes("web") || t.includes("full")) return "WD";
    if (t.includes("security") || t.includes("cyber")) return "SC";
    return "SK";
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={reset}
      onClick={onClick}
      className="cursor-pointer rounded-xl p-5 border border-zinc-800 bg-zinc-950 hover:border-indigo-500/50 transition-all duration-200"
      style={{ transition: "transform 0.1s ease, border-color 0.2s ease" }}
    >
      <div className="flex flex-col justify-between h-full gap-3">
        <div className="w-8 h-8 rounded-md bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-[10px] font-bold text-indigo-400">
          {getIcon(skill.title)}
        </div>
        <h2 className="text-sm font-semibold text-white leading-snug">{skill.title}</h2>
        <p className="text-xs text-zinc-500 line-clamp-3">{skill.description}</p>
        <span className="text-[10px] text-indigo-400 font-medium">Trending</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update upskill/page.tsx**

```tsx
"use client";

import { useEffect, useState } from "react";
import SkillCard from "@/components/SkillCard";

type Skill = {
  title: string;
  description: string;
  roadmap?: { title: string; link: string }[];
};

export default function UpskillPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selected, setSelected] = useState<Skill | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const res = await fetch("/api/upskill");
        const data = await res.json();
        setSkills(data.skills.slice(0, 12));
      } catch (err) {
        console.error("Error fetching skills:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSkills();
  }, []);

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white relative">
      <div className="absolute inset-0 dot-grid opacity-30" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_60%,#0a0a0a_90%)]" />

      <div className="relative z-10 px-6 py-10 max-w-7xl mx-auto">
        <h1 className="page-header bg-gradient-to-r from-white to-indigo-400 text-transparent bg-clip-text inline-block">
          Upskill for the Future
        </h1>
        <p className="page-subheader max-w-2xl">
          Discover in-demand skills shaping today's tech industry. Explore curated learning paths and start building real-world expertise.
        </p>

        {loading ? (
          <div className="flex justify-center items-center h-[40vh] text-zinc-500">Loading skills...</div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {skills.map((skill, i) => (
              <SkillCard key={i} skill={skill} onClick={() => setSelected(skill)} />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="card w-full max-w-lg animate-fadeIn">
            <h2 className="text-lg font-semibold text-white mb-2">{selected.title}</h2>
            <p className="text-zinc-400 text-sm mb-5">{selected.description}</p>
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Learning Path</h3>
            <ul className="space-y-2 mb-6">
              {selected.roadmap?.map((step, i) => (
                <li key={i}>
                  <a href={step.link} target="_blank" rel="noopener noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 text-sm underline underline-offset-2">
                    {step.title}
                  </a>
                </li>
              ))}
            </ul>
            <button onClick={() => setSelected(null)} className="btn-ghost w-full justify-center">Close</button>
          </div>
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/upskill/page.tsx components/SkillCard.tsx
git commit -m "style: refresh upskill page and SkillCard with zinc/indigo theme"
```

---

## Task 10: Calendar Page

**Files:**
- Modify: `app/calendar/page.tsx`

- [ ] **Step 1: Replace calendar page content**

```tsx
"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [calendar, setCalendar] = useState<any>({});
  const [currentDate, setCurrentDate] = useState(new Date());
  const [toast, setToast] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    fetch("/api/events")
      .then((res) => res.json())
      .then((data) => setEvents(data.events));
  }, []);

  const addToAppCalendar = (event: any) => {
    setCalendar((prev: any) => ({ ...prev, [event.date]: event }));
    setToast("Added to your calendar");
    setTimeout(() => setToast(null), 2000);
  };

  const addToGoogleCalendar = (event: any) => {
    const startDate = new Date(event.date);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${fmt(startDate)}/${fmt(endDate)}&details=${encodeURIComponent("Hackathon Event")}&location=${encodeURIComponent(event.type)}&sf=true&output=xml`;
    window.open(url, "_blank");
  };

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const days: any[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const fullDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    days.push({ day: d, fullDate });
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white px-6 py-10 max-w-5xl mx-auto">

      <h1 className="page-header">Calendar</h1>
      <p className="page-subheader">Track hackathons and learning milestones.</p>

      {/* Month nav */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
          className="p-2 border border-zinc-700 rounded-lg text-zinc-400 hover:text-white hover:border-zinc-500 transition">
          <ChevronLeft size={16} />
        </button>
        <span className="font-semibold text-white">
          {currentDate.toLocaleString("default", { month: "long" })} {year}
        </span>
        <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
          className="p-2 border border-zinc-700 rounded-lg text-zinc-400 hover:text-white hover:border-zinc-500 transition">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Upcoming hackathons */}
      {events.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Upcoming Hackathons</h2>
          <div className="space-y-2">
            {events.map((e) => (
              <div key={e.id} className="card flex justify-between items-center py-3 px-4">
                <div>
                  <p className="font-medium text-white text-sm">{e.title}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{e.date}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => addToAppCalendar(e)} className="btn-ghost text-xs py-1 px-3">
                    Add to Saarthi
                  </button>
                  <button onClick={() => addToGoogleCalendar(e)} className="btn-primary text-xs py-1 px-3">
                    Google Cal
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekDays.map((d) => (
          <div key={d} className="text-center text-xs text-zinc-500 py-2 font-medium">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((item, i) => (
          <div key={i} className={`h-20 border rounded-lg p-1.5 relative ${item ? "border-zinc-800 bg-zinc-950 hover:border-zinc-600 transition" : "border-transparent"}`}>
            {item && (
              <>
                <span className="text-xs text-zinc-500 absolute top-1.5 right-2">{item.day}</span>
                {calendar[item.fullDate] && (
                  <div className="mt-5 bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded truncate">
                    {calendar[item.fullDate].title}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-zinc-900 border border-zinc-700 text-white px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 animate-fadeIn text-sm">
          <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" /> {toast}
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/calendar/page.tsx
git commit -m "style: convert calendar to dark theme with zinc/indigo design"
```

---

## Task 11: Credentials Page

**Files:**
- Modify: `app/credentials/page.tsx`

- [ ] **Step 1: Update only the JSX/className portions**

Replace the `return (...)` block of `app/credentials/page.tsx` with:

```tsx
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white px-6 py-10 max-w-6xl mx-auto">

      <h1 className="page-header bg-gradient-to-r from-white to-indigo-400 text-transparent bg-clip-text inline-block">
        Build Credibility with Verified Credentials
      </h1>
      <p className="page-subheader max-w-2xl">
        Skills are valued globally. Showcase your expertise with certificates from Google and IBM.
      </p>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className={`px-4 py-1.5 rounded-full text-sm border transition
              ${active === cat
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-transparent text-zinc-400 border-zinc-700 hover:border-zinc-500 hover:text-white"
              }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="space-y-4">
        {filtered.map((cred) => (
          <div key={cred.title} className="card grid md:grid-cols-2 gap-6 items-center hover:border-zinc-600 transition">
            <a
              href={cred.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-zinc-800/50 transition"
            >
              <img
                src={cred.image}
                alt={`${cred.provider} logo`}
                className="w-12 h-12 object-contain opacity-90"
                loading="lazy"
              />
              <div>
                <h2 className="font-semibold text-white text-base">{cred.title}</h2>
                <p className="text-xs text-zinc-500 mt-0.5">{cred.provider}</p>
              </div>
            </a>
            <div className="text-sm space-y-1.5">
              <p className="text-zinc-300">{cred.description}</p>
              <p className="text-zinc-500">Duration: <span className="text-zinc-300">{cred.hours}</span></p>
              <p className="text-zinc-500">Benefits: <span className="text-zinc-300">{cred.benefits}</span></p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
```

- [ ] **Step 2: Commit**

```bash
git add app/credentials/page.tsx
git commit -m "style: refresh credentials page with indigo filter pills and zinc cards"
```

---

## Task 12: About Page (minor alignment)

**Files:**
- Modify: `app/about/page.tsx`

- [ ] **Step 1: Update card classNames to use zinc/indigo palette**

In `app/about/page.tsx`, find and replace these className strings:

1. `"bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-xl"` → `"card"`

2. `"p-6 bg-white/5 border border-white/10 rounded-xl backdrop-blur-md"` → `"card hover:border-zinc-600 transition"`

3. `"rounded-2xl overflow-hidden border border-white/10 shadow-2xl"` → `"rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl"`

4. `"text-5xl md:text-7xl font-semibold tracking-tight"` → `"text-5xl md:text-7xl font-semibold tracking-tight text-white"`

- [ ] **Step 2: Commit**

```bash
git add app/about/page.tsx
git commit -m "style: align about page cards with zinc/indigo design system"
```

---

## Task 13: Run dev server and verify

- [ ] **Step 1: Start dev server**

Run: `npm run dev`
Expected: Server starts on `http://localhost:3000` with no build errors.

- [ ] **Step 2: Verify each route visually**

Check these routes for regressions and correct styling:
- `http://localhost:3000/` — dot grid, indigo headline, feature pills
- `http://localhost:3000/onboarding` — centered card, progress bar, styled selects
- `http://localhost:3000/goals` — dark card with indigo left border, indigo checkboxes
- `http://localhost:3000/roadmap` — progress bar, page header
- `http://localhost:3000/learning` — dark chat, indigo user bubbles, icon buttons
- `http://localhost:3000/upskill` — zinc skill cards, indigo hover border
- `http://localhost:3000/calendar` — dark grid, zinc event cards
- `http://localhost:3000/credentials` — indigo filter pills, zinc cards
- `http://localhost:3000/about` — zinc cards aligned

- [ ] **Step 3: Fix any TypeScript / build errors**

Run: `npm run build`
Expected: Exit code 0 with no errors.
