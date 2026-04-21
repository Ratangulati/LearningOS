# Saarthi AI Demo Build — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 7 demo-critical features to the existing Saarthi AI Learning OS skeleton — auth gates, multi-step onboarding, editable roadmap with YouTube resources, AI thinking-out-loud panel, Cornell-style notes, streak calendar, and a floating chatbot.

**Architecture:** All features layer on top of existing code — no rewrites of working functionality. The existing user-1 hardcoded userId pattern is preserved throughout. New components are co-located with features that own them; shared UI components go in `/components`.

**Tech Stack:** Next.js 16 App Router, React 19, NextAuth 4 (Google OAuth + JWT), Supabase (client + server), OpenAI / Gemini via existing `lib/ai-provider.ts`, YouTube Data API v3, Tailwind CSS v4, lucide-react

---

## File Map

**Modified:**
- `middleware.ts` — add real auth redirect
- `app/page.tsx` — session-gated CTAs
- `app/onboarding/page.tsx` — 5-step wizard rewrite
- `lib/learning-os.ts` — `buildRoadmapPrompt` accepts `subjects[]`
- `app/api/generate-roadmap/route.ts` — accept `subjects[]`
- `app/api/learn/session/route.ts` — add `thoughts[]` + Cornell fields to response
- `app/roadmap/page.tsx` — edit mode + Start button + resource panel state
- `app/learn/[taskId]/page.tsx` — ThinkingPanel + Cornell layout
- `app/progress/page.tsx` — add StreakCalendar section
- `app/layout.tsx` — mount FloatingChatbot
- `app/api/learning/route.ts` — accept context + return action field

**Created:**
- `app/api/onboarding/confirm/route.ts` — AI subject validation
- `app/api/roadmap/update/route.ts` — PATCH step titles
- `app/api/roadmap/start/route.ts` — create task from roadmap step
- `app/api/resources/route.ts` — YouTube video search
- `app/api/progress/streak/route.ts` — streak + day data
- `components/ResourcePanel.tsx` — YouTube slide-over
- `components/ThinkingPanel.tsx` — AI reasoning feed
- `components/StreakCalendar.tsx` — 90-day activity calendar
- `components/FloatingChatbot.tsx` — global chatbot widget

---

## Task 1: Auth Gates

**Files:**
- Modify: `middleware.ts`
- Modify: `app/page.tsx`

- [ ] **Step 1: Fix middleware to redirect unauthenticated users**

Replace the entire content of `middleware.ts`:

```typescript
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/onboarding/:path*",
    "/roadmap/:path*",
    "/today/:path*",
    "/progress/:path*",
    "/learning/:path*",
    "/goals/:path*",
    "/upskill/:path*",
    "/calendar/:path*",
    "/credentials/:path*",
  ],
};
```

- [ ] **Step 2: Add session-gated CTAs to home page**

Replace the entire content of `app/page.tsx`:

```tsx
"use client";

import { ArrowRight } from "lucide-react";
import SplineRobot from "@/components/SplineRobot";
import { useSession, signIn } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();

  return (
    <main className="relative min-h-screen bg-[#0a0a0a] text-white overflow-hidden">
      <div className="absolute inset-0 dot-grid opacity-40" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,#0a0a0a_80%)]" />

      <div className="relative z-10 grid md:grid-cols-2 items-center min-h-screen px-6 max-w-7xl mx-auto">
        <div className="flex flex-col items-center md:items-start text-center md:text-left animate-fadeIn">
          <h1 className="text-5xl md:text-6xl font-bold mb-5 leading-tight bg-gradient-to-r from-white to-indigo-400 text-transparent bg-clip-text">
            Saarthi AI
          </h1>

          <p className="text-base text-zinc-400 max-w-md mb-8 leading-relaxed">
            Your Learning OS for university students. Set one goal and Saarthi
            generates your roadmap, daily tasks, adaptive revision, and mastery tracking.
          </p>

          <div className="flex flex-wrap gap-3 mb-8">
            {!session ? (
              <button onClick={() => signIn("google")} className="btn-primary">
                Sign in to start <ArrowRight size={16} />
              </button>
            ) : (
              <>
                <button
                  onClick={() => (window.location.href = "/onboarding")}
                  className="btn-primary"
                >
                  Start Learning OS <ArrowRight size={16} />
                </button>
                <button
                  onClick={() => (window.location.href = "/today")}
                  className="btn-ghost"
                >
                  Open Today Plan
                </button>
                <button
                  onClick={() => (window.location.href = "/progress")}
                  className="btn-ghost"
                >
                  View Progress
                </button>
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {["Roadmap", "Daily Tasks", "Auto Notes", "Mastery Score"].map((f) => (
              <span key={f} className="badge">{f}</span>
            ))}
          </div>
        </div>

        <div className="h-[500px] md:h-[600px] w-full">
          <SplineRobot />
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Verify**

Open the app in incognito. Confirm:
- Home page shows only "Sign in to start" button
- Clicking any nav link (Roadmap, Today, etc.) redirects to `/login?callbackUrl=...`
- After signing in, home page shows all 3 CTAs

- [ ] **Step 4: Commit**

```bash
git add middleware.ts app/page.tsx
git commit -m "feat: gate home CTAs and protected routes behind auth"
```

---

## Task 2: Multi-Step Onboarding

**Files:**
- Modify: `app/onboarding/page.tsx`
- Modify: `lib/learning-os.ts`
- Modify: `app/api/generate-roadmap/route.ts`
- Create: `app/api/onboarding/confirm/route.ts`

- [ ] **Step 1: Add subjects[] support to buildRoadmapPrompt in lib/learning-os.ts**

Update the `StudentProfileInput` type and `buildRoadmapPrompt` function:

```typescript
export type StudentProfileInput = {
  userId: string;
  goal: string;
  interest: string;
  currentLevel: "beginner" | "intermediate" | "advanced";
  semesterWeeks: number;
  dailyMinutes: number;
  subjects?: string[];
};
```

Replace `buildRoadmapPrompt`:

```typescript
export function buildRoadmapPrompt(profile: StudentProfileInput): string {
  const subjectsLine =
    profile.subjects && profile.subjects.length > 0
      ? `Specific topics to cover: ${profile.subjects.join(", ")}`
      : "";

  return `Create a semester roadmap for a university student.

Goal: ${profile.goal}
Interest track: ${profile.interest}
Current level: ${profile.currentLevel}
Semester duration in weeks: ${profile.semesterWeeks}
Daily study minutes: ${profile.dailyMinutes}
${subjectsLine}

Output rules:
- Return ONLY a JSON array with 6 objects.
- Each object must include:
  - step (string) — name it after one of the specific topics listed above when possible
  - type ("learn" | "practice" | "revise")
  - domain (string)
  - platform (string, suggest one source)
  - estimatedMinutes (number)
  - prerequisites (string array, can be empty)
- Order the steps for progressive learning.
- Keep names concise and student-friendly.`;
}
```

- [ ] **Step 2: Accept subjects[] in the generate-roadmap API**

In `app/api/generate-roadmap/route.ts`, update the destructuring and profile construction:

```typescript
const {
  userId,
  level,
  interest,
  goal,
  semesterWeeks,
  dailyMinutes,
  provider = "openai",
  model,
  subjects,
} = await req.json();

const profile: StudentProfileInput = {
  userId: userId || "user-1",
  goal: goal || "Semester learning plan",
  interest: interest || "General",
  currentLevel: level || "beginner",
  semesterWeeks: Number(semesterWeeks) || 16,
  dailyMinutes: Number(dailyMinutes) || 90,
  subjects: Array.isArray(subjects) ? subjects : [],
};
```

- [ ] **Step 3: Create the AI topic confirmation API**

Create `app/api/onboarding/confirm/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { generateAIText } from "@/lib/ai-provider";

export async function POST(req: Request) {
  try {
    const { subjects } = await req.json();
    if (!Array.isArray(subjects) || subjects.length === 0) {
      return NextResponse.json({ confirmed: [], suggested: [], message: "" });
    }

    const prompt = `A student wants to learn these topics: ${subjects.join(", ")}.

Return a JSON object with:
- "confirmed": the original topics array (unchanged)
- "suggested": up to 2 prerequisite or complementary topics not already listed
- "message": one friendly sentence like "I'll build your roadmap around these topics. I'd also suggest adding:"

Return ONLY the JSON object, no markdown fences.`;

    let confirmed = subjects;
    let suggested: string[] = [];
    let message = `I'll build your roadmap around: ${subjects.join(", ")}.`;

    try {
      const text = await generateAIText({
        provider: "openai",
        prompt,
        openAIModel: "gpt-4o-mini",
      });
      const parsed = JSON.parse(text);
      if (parsed.confirmed) confirmed = parsed.confirmed;
      if (Array.isArray(parsed.suggested)) suggested = parsed.suggested.slice(0, 2);
      if (parsed.message) message = parsed.message;
    } catch {
      // use defaults above
    }

    return NextResponse.json({ confirmed, suggested, message });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ confirmed: [], suggested: [], message: "" });
  }
}
```

- [ ] **Step 4: Rewrite onboarding page as 5-step wizard**

Replace the entire content of `app/onboarding/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ArrowRight, X, Plus } from "lucide-react";

type Answers = {
  fullName: string;
  branch: string;
  experience: string;
  subjects: string[];
  semesterWeeks: string;
  dailyMinutes: string;
  provider: string;
  model: string;
};

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subjectInput, setSubjectInput] = useState("");
  const [confirmed, setConfirmed] = useState<string[]>([]);
  const [suggested, setSuggested] = useState<string[]>([]);
  const [aiMessage, setAiMessage] = useState("");
  const [answers, setAnswers] = useState<Answers>({
    fullName: "",
    branch: "",
    experience: "",
    subjects: [],
    semesterWeeks: "16",
    dailyMinutes: "90",
    provider: "openai",
    model: "gpt-4o-mini",
  });

  const addSubject = () => {
    const trimmed = subjectInput.trim();
    if (trimmed && !answers.subjects.includes(trimmed) && answers.subjects.length < 10) {
      setAnswers((prev) => ({ ...prev, subjects: [...prev.subjects, trimmed] }));
      setSubjectInput("");
    }
  };

  const removeSubject = (s: string) =>
    setAnswers((prev) => ({ ...prev, subjects: prev.subjects.filter((x) => x !== s) }));

  const goToStep3 = async () => {
    if (answers.subjects.length === 0) {
      setError("Add at least one subject.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjects: answers.subjects }),
      });
      const data = await res.json();
      setConfirmed(data.confirmed || answers.subjects);
      setSuggested(data.suggested || []);
      setAiMessage(data.message || "");
    } catch {
      setConfirmed(answers.subjects);
    }
    setLoading(false);
    setStep(3);
  };

  const acceptSuggestion = (s: string) => {
    if (!answers.subjects.includes(s)) {
      setAnswers((prev) => ({ ...prev, subjects: [...prev.subjects, s] }));
    }
    setSuggested((prev) => prev.filter((x) => x !== s));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      let score = 1;
      if (answers.experience === "intermediate") score = 3;
      if (answers.experience === "advanced") score = 5;
      const level = score >= 5 ? "advanced" : score >= 3 ? "intermediate" : "beginner";

      await supabase.from("profiles").insert([{
        purpose: "university_learning_os",
        level,
        projects: "0",
        hackathons: "0",
        interest: answers.branch,
        goal: answers.subjects.join(", "),
        time_commitment: `${answers.dailyMinutes} mins/day`,
      }]);

      const res = await fetch("/api/generate-roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user-1",
          level,
          interest: answers.branch,
          goal: answers.subjects.join(", "),
          semesterWeeks: Number(answers.semesterWeeks),
          dailyMinutes: Number(answers.dailyMinutes),
          provider: answers.provider,
          model: answers.model,
          subjects: answers.subjects,
        }),
      });

      const data = await res.json();
      if (!data || !Array.isArray(data.roadmap)) {
        setError("Failed to generate roadmap. Try again.");
        setLoading(false);
        return;
      }

      localStorage.setItem("ai_provider", answers.provider);
      localStorage.setItem("ai_model", answers.model);
      window.location.href = "/roadmap";
    } catch (err) {
      console.error(err);
      setError("Something went wrong.");
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-10">
      <div className="max-w-2xl mx-auto">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border ${
                step === n ? "bg-indigo-600 border-indigo-500 text-white"
                : step > n ? "bg-indigo-900 border-indigo-700 text-indigo-300"
                : "bg-zinc-900 border-zinc-700 text-zinc-500"
              }`}>{n}</div>
              {n < 5 && <div className={`h-px w-6 ${step > n ? "bg-indigo-600" : "bg-zinc-700"}`} />}
            </div>
          ))}
          <span className="ml-2 text-sm text-zinc-400">
            {["Profile", "Subjects", "AI Review", "Schedule", "Generating"][step - 1]}
          </span>
        </div>

        <div className="card animate-fadeIn">
          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="page-header text-xl">Tell us about yourself</h2>
              <input
                placeholder="Your full name"
                value={answers.fullName}
                onChange={(e) => setAnswers({ ...answers, fullName: e.target.value })}
                className="field-input w-full"
              />
              <input
                placeholder="Branch / track (e.g. CSE, ECE, BBA)"
                value={answers.branch}
                onChange={(e) => setAnswers({ ...answers, branch: e.target.value })}
                className="field-input w-full"
              />
              <select
                value={answers.experience}
                onChange={(e) => setAnswers({ ...answers, experience: e.target.value })}
                className="field-input w-full"
              >
                <option value="">Current level</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    if (!answers.branch || !answers.experience) {
                      setError("Please fill in all fields.");
                      return;
                    }
                    setError(null);
                    setStep(2);
                  }}
                  className="btn-primary"
                >
                  Next <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="page-header text-xl">What do you want to learn?</h2>
              <p className="text-sm text-zinc-400">Type a subject and press Enter to add it. Add up to 10.</p>
              <div className="flex gap-2">
                <input
                  placeholder="e.g. React Hooks, DSA, DBMS..."
                  value={subjectInput}
                  onChange={(e) => setSubjectInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addSubject(); } }}
                  className="field-input flex-1"
                />
                <button onClick={addSubject} className="btn-ghost px-3">
                  <Plus size={16} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 min-h-[40px]">
                {answers.subjects.map((s) => (
                  <span key={s} className="flex items-center gap-1 bg-indigo-900/40 border border-indigo-700 text-indigo-300 text-sm px-3 py-1 rounded-full">
                    {s}
                    <button onClick={() => removeSubject(s)} className="hover:text-white"><X size={12} /></button>
                  </span>
                ))}
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="flex justify-between">
                <button onClick={() => setStep(1)} className="btn-ghost">Back</button>
                <button onClick={goToStep3} disabled={loading} className="btn-primary">
                  {loading ? "Checking..." : <>Next <ArrowRight size={14} /></>}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="page-header text-xl">AI Review</h2>
              {aiMessage && <p className="text-zinc-300 text-sm">{aiMessage}</p>}
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Your topics</p>
                <div className="flex flex-wrap gap-2">
                  {confirmed.map((s) => (
                    <span key={s} className="badge bg-emerald-900/30 border-emerald-700 text-emerald-300">{s}</span>
                  ))}
                </div>
              </div>
              {suggested.length > 0 && (
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Suggested additions</p>
                  <div className="flex flex-wrap gap-2">
                    {suggested.map((s) => (
                      <button
                        key={s}
                        onClick={() => acceptSuggestion(s)}
                        className="badge border-dashed border-zinc-600 text-zinc-400 hover:border-indigo-500 hover:text-indigo-300 cursor-pointer"
                      >
                        + {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-between">
                <button onClick={() => setStep(2)} className="btn-ghost">Back</button>
                <button onClick={() => setStep(4)} className="btn-primary">
                  Looks good <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="page-header text-xl">Set your schedule</h2>
              <div className="grid grid-cols-2 gap-3">
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
                  placeholder="Model (e.g. gpt-4o-mini)"
                />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="flex justify-between">
                <button onClick={() => setStep(3)} className="btn-ghost">Back</button>
                <button onClick={() => { setStep(5); handleSubmit(); }} className="btn-primary">
                  Generate Roadmap <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5 */}
          {step === 5 && (
            <div className="space-y-4 text-center py-8">
              <div className="w-12 h-12 rounded-full bg-indigo-600/20 border border-indigo-500 flex items-center justify-center mx-auto animate-pulse">
                <span className="text-2xl">🧠</span>
              </div>
              <h2 className="text-xl font-semibold">Building your personalized roadmap...</h2>
              <p className="text-zinc-400 text-sm">Analyzing your subjects, setting up spaced revision, generating 6-step plan.</p>
              {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 5: Verify**

Complete the onboarding wizard:
1. Fill Step 1 (name, branch, level) → click Next
2. Type "React Hooks", press Enter, add "DSA" → click Next
3. See AI confirmation with your topics + suggested additions
4. Accept/reject suggestions → click Looks good
5. Set schedule → click Generate Roadmap
6. Loading screen appears, then redirects to `/roadmap`

- [ ] **Step 6: Commit**

```bash
git add app/onboarding/page.tsx lib/learning-os.ts app/api/generate-roadmap/route.ts app/api/onboarding/confirm/route.ts
git commit -m "feat: multi-step onboarding with subject selection and AI confirmation"
```

---

## Task 3: Editable Roadmap + Start Button

**Files:**
- Modify: `app/roadmap/page.tsx`
- Create: `app/api/roadmap/update/route.ts`
- Create: `app/api/roadmap/start/route.ts`

- [ ] **Step 1: Create the PATCH update API**

Create `app/api/roadmap/update/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function PATCH(req: Request) {
  try {
    const { stepId, step } = await req.json();
    if (!stepId || !step) {
      return NextResponse.json({ error: "stepId and step required" }, { status: 400 });
    }

    const { error } = await supabaseServer
      .from("roadmap")
      .update({ step })
      .eq("id", stepId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create the Start task API**

Create `app/api/roadmap/start/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const { stepId, userId = "user-1" } = await req.json();
    const today = new Date().toISOString().slice(0, 10);

    const { data: existing } = await supabaseServer
      .from("learning_tasks")
      .select("id")
      .eq("roadmap_step_id", stepId)
      .eq("user_id", userId)
      .eq("due_date", today)
      .maybeSingle();

    if (existing) return NextResponse.json({ taskId: existing.id });

    const { data: stepRow } = await supabaseServer
      .from("roadmap")
      .select("step, type")
      .eq("id", stepId)
      .single();

    if (!stepRow) return NextResponse.json({ error: "Step not found" }, { status: 404 });

    const { data: task } = await supabaseServer
      .from("learning_tasks")
      .insert({
        user_id: userId,
        roadmap_step_id: stepId,
        topic: stepRow.step,
        task_type: stepRow.type || "learn",
        status: "pending",
        priority_score: 0.8,
        estimated_minutes: 40,
        due_date: today,
      })
      .select("id")
      .single();

    return NextResponse.json({ taskId: task?.id });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
```

- [ ] **Step 3: Update roadmap page with edit mode, Start button, panel state**

Replace entire `app/roadmap/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import RoadmapGraph from "@/components/RoadmapGraph";
import ResourcePanel from "@/components/ResourcePanel";
import { Pencil, Check, Play } from "lucide-react";

export default function RoadmapPage() {
  const router = useRouter();
  const [steps, setSteps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editedTitles, setEditedTitles] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [panelStep, setPanelStep] = useState<any | null>(null);
  const [startingId, setStartingId] = useState<string | null>(null);

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
        console.error(err);
        setSteps([]);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleSaveEdits = async () => {
    setSaving(true);
    const updates = Object.entries(editedTitles).map(([stepId, step]) =>
      fetch("/api/roadmap/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepId, step }),
      })
    );
    await Promise.all(updates);
    setSteps((prev) =>
      prev.map((s) => (editedTitles[s.id] ? { ...s, step: editedTitles[s.id] } : s))
    );
    setEditedTitles({});
    setEditMode(false);
    setSaving(false);
  };

  const handleStart = async (step: any) => {
    setStartingId(step.id);
    try {
      const res = await fetch("/api/roadmap/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepId: step.id, userId: "user-1" }),
      });
      const data = await res.json();
      if (data.taskId) router.push(`/learn/${data.taskId}`);
    } catch (err) {
      console.error(err);
    }
    setStartingId(null);
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="badge mb-2">Learning Path</p>
            <h1 className="text-3xl font-bold">Your AI Roadmap</h1>
          </div>
          <div className="flex gap-2">
            {editMode ? (
              <>
                <button onClick={() => { setEditMode(false); setEditedTitles({}); }} className="btn-ghost text-sm">
                  Cancel
                </button>
                <button onClick={handleSaveEdits} disabled={saving} className="btn-primary text-sm">
                  <Check size={14} /> {saving ? "Saving..." : "Save Changes"}
                </button>
              </>
            ) : (
              <button onClick={() => setEditMode(true)} className="btn-ghost text-sm">
                <Pencil size={14} /> Edit Roadmap
              </button>
            )}
          </div>
        </div>

        {loading && <p className="text-zinc-400">Loading roadmap...</p>}
        {!loading && steps.length === 0 && (
          <p className="text-zinc-500">No roadmap found. Complete onboarding first.</p>
        )}

        {!loading && steps.length > 0 && !editMode && (
          <RoadmapGraph steps={steps} onStepClick={(step) => setPanelStep(step)} />
        )}

        {/* Edit mode: flat list with inputs */}
        {!loading && steps.length > 0 && editMode && (
          <div className="space-y-3">
            {steps.map((step, idx) => (
              <div key={step.id} className="card flex items-center gap-4">
                <span className="text-zinc-500 text-sm w-6 shrink-0">{idx + 1}</span>
                <input
                  value={editedTitles[step.id] ?? step.step}
                  onChange={(e) =>
                    setEditedTitles((prev) => ({ ...prev, [step.id]: e.target.value }))
                  }
                  className="field-input flex-1"
                />
                <span className={`badge shrink-0 ${step.status === "completed" ? "border-emerald-700 text-emerald-400" : "border-zinc-700 text-zinc-400"}`}>
                  {step.status}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* View mode: step list with Start buttons */}
        {!loading && steps.length > 0 && !editMode && (
          <div className="mt-6 space-y-2">
            <h2 className="text-sm text-zinc-500 uppercase tracking-wider mb-3">Steps</h2>
            {steps.map((step, idx) => (
              <div key={step.id} className="card flex items-center gap-4 py-3">
                <span className="text-zinc-500 text-sm w-6 shrink-0">{idx + 1}</span>
                <button
                  onClick={() => setPanelStep(step)}
                  className="flex-1 text-left text-sm hover:text-indigo-300 transition"
                >
                  {step.step}
                </button>
                <span className={`badge shrink-0 text-xs ${step.status === "completed" ? "border-emerald-700 text-emerald-400" : "border-zinc-700 text-zinc-500"}`}>
                  {step.status}
                </span>
                <button
                  onClick={() => handleStart(step)}
                  disabled={startingId === step.id}
                  className="btn-primary text-xs px-3 py-1.5 shrink-0"
                >
                  <Play size={12} /> {startingId === step.id ? "..." : "Start"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {panelStep && (
        <ResourcePanel step={panelStep} onClose={() => setPanelStep(null)} />
      )}
    </main>
  );
}
```

- [ ] **Step 4: Verify**

1. Load `/roadmap` — see step list with "Start" and "Edit Roadmap" buttons
2. Click "Edit Roadmap" → inputs appear for each step title
3. Edit a title, click "Save Changes" → title persists after refresh
4. Click "Start" on any step → navigates to `/learn/[taskId]`

- [ ] **Step 5: Commit**

```bash
git add app/roadmap/page.tsx app/api/roadmap/update/route.ts app/api/roadmap/start/route.ts
git commit -m "feat: editable roadmap with start button and task creation"
```

---

## Task 4: YouTube Resources Panel

**Files:**
- Create: `app/api/resources/route.ts`
- Create: `components/ResourcePanel.tsx`

- [ ] **Step 1: Create the resources API**

Create `app/api/resources/route.ts`:

```typescript
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const topic = searchParams.get("topic") || "";

  if (!topic) return NextResponse.json({ videos: [] });

  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    const encoded = encodeURIComponent(`${topic} tutorial`);
    return NextResponse.json({
      videos: [
        {
          title: `Search YouTube: ${topic} tutorial`,
          thumbnail: null,
          videoId: null,
          url: `https://www.youtube.com/results?search_query=${encoded}`,
          views: null,
        },
      ],
    });
  }

  try {
    const searchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
        topic + " tutorial"
      )}&type=video&maxResults=5&order=viewCount&relevanceLanguage=en&key=${apiKey}`
    );
    const searchData = await searchRes.json();
    const items = searchData.items || [];
    const videoIds = items.map((i: any) => i.id.videoId).join(",");

    const statsRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${videoIds}&key=${apiKey}`
    );
    const statsData = await statsRes.json();
    const statsMap = new Map(
      (statsData.items || []).map((v: any) => [v.id, v])
    );

    const videos = items.slice(0, 3).map((item: any) => {
      const stat = statsMap.get(item.id.videoId) as any;
      const views = stat?.statistics?.viewCount
        ? Number(stat.statistics.viewCount).toLocaleString()
        : null;
      return {
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.medium.url,
        videoId: item.id.videoId,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        views,
        channel: item.snippet.channelTitle,
      };
    });

    return NextResponse.json({ videos });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ videos: [] });
  }
}
```

- [ ] **Step 2: Create the ResourcePanel component**

Create `components/ResourcePanel.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { X, ExternalLink, Play } from "lucide-react";

type Video = {
  title: string;
  thumbnail: string | null;
  videoId: string | null;
  url: string;
  views: string | null;
  channel?: string;
};

type Props = {
  step: { step: string; id: string };
  onClose: () => void;
};

export default function ResourcePanel({ step, onClose }: Props) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch_ = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/resources?topic=${encodeURIComponent(step.step)}`);
        const data = await res.json();
        setVideos(data.videos || []);
      } catch {
        setVideos([]);
      }
      setLoading(false);
    };
    fetch_();
  }, [step.step]);

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 bg-zinc-950 border border-zinc-800 rounded-t-2xl md:rounded-2xl w-full md:max-w-lg p-5 shadow-2xl animate-fadeIn">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="badge mb-1">YouTube Resources</p>
            <h3 className="font-semibold text-white">{step.step}</h3>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-zinc-900 rounded-lg animate-pulse" />
            ))}
          </div>
        )}

        {!loading && videos.length === 0 && (
          <p className="text-zinc-500 text-sm">No videos found for this topic.</p>
        )}

        {!loading && videos.length > 0 && (
          <div className="space-y-3">
            {videos.map((v, i) => (
              <a
                key={i}
                href={v.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 transition group"
              >
                {v.thumbnail ? (
                  <div className="relative shrink-0 w-20 h-14 rounded overflow-hidden">
                    <img src={v.thumbnail} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition">
                      <Play size={16} className="text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="shrink-0 w-20 h-14 rounded bg-zinc-800 flex items-center justify-center">
                    <Play size={16} className="text-zinc-500" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white line-clamp-2 leading-snug">{v.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {v.channel && <p className="text-xs text-zinc-500 truncate">{v.channel}</p>}
                    {v.views && <p className="text-xs text-zinc-600 shrink-0">{v.views} views</p>}
                  </div>
                </div>
                <ExternalLink size={14} className="text-zinc-600 group-hover:text-zinc-400 transition shrink-0" />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Click any step title in the roadmap (not the Start button) → resource panel opens with 3 YouTube videos for that topic. If `YOUTUBE_API_KEY` is not set, shows a search link instead.

- [ ] **Step 4: Commit**

```bash
git add components/ResourcePanel.tsx app/api/resources/route.ts
git commit -m "feat: YouTube resource panel on roadmap step click"
```

---

## Task 5: AI Thinking Panel

**Files:**
- Modify: `app/api/learn/session/route.ts`
- Create: `components/ThinkingPanel.tsx`
- Modify: `app/learn/[taskId]/page.tsx`

- [ ] **Step 1: Update learn session API to return thoughts[] and Cornell structure**

Replace the entire content of `app/api/learn/session/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { AIProvider, generateAIText } from "@/lib/ai-provider";

type QuizItem = {
  question: string;
  options: string[];
  answerIndex: number;
};

type CornellNote = {
  cues: string[];
  mainNotes: string;
  examples: string[];
  keyTerms: { term: string; definition: string }[];
  summary: string;
};

export async function POST(req: Request) {
  try {
    const { taskId, userId = "user-1", provider = "openai", model } = await req.json();

    const { data: task, error: taskError } = await supabaseServer
      .from("learning_tasks")
      .select("*")
      .eq("id", taskId)
      .eq("user_id", userId)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ message: "Task not found." }, { status: 404 });
    }

    await supabaseServer
      .from("learning_tasks")
      .update({ status: "in_progress" })
      .eq("id", taskId);

    // Generate thoughts based on task context
    const { data: recentAttempts } = await supabaseServer
      .from("learning_attempts")
      .select("correct_count, total_count, topic")
      .eq("user_id", userId)
      .eq("topic", task.topic)
      .order("created_at", { ascending: false })
      .limit(3);

    const totalCorrect = (recentAttempts || []).reduce((a, r) => a + (r.correct_count || 0), 0);
    const totalQ = (recentAttempts || []).reduce((a, r) => a + (r.total_count || 0), 0);
    const recentAccuracy = totalQ > 0 ? totalCorrect / totalQ : null;

    const thoughts: string[] = [
      `Analyzing your history for: ${task.topic}`,
      recentAttempts && recentAttempts.length > 0
        ? recentAccuracy !== null && recentAccuracy < 0.6
          ? `⚠ You scored ${Math.round(recentAccuracy * 100)}% recently — adding prerequisite context`
          : `✓ Recent performance looks good — building on what you know`
        : `First time with this topic — starting from foundations`,
      `Structuring lesson: ${task.task_type === "revise" ? "revision sprint" : "progressive explanation"}`,
      `Generating 3 targeted quiz questions`,
      `✅ Lesson ready`,
    ];

    const prompt = `You are a concise tutor.
Topic: ${task.topic}
Task type: ${task.task_type}
${recentAccuracy !== null && recentAccuracy < 0.6 ? `Note: Student struggled recently (${Math.round(recentAccuracy * 100)}% accuracy) — include prerequisite context.` : ""}

Return ONLY a strict JSON object (no markdown fences):
{
  "markdownLesson": "...",
  "summary": "...",
  "cues": ["Question 1?", "Question 2?", "Question 3?"],
  "mainNotes": "main lesson content in markdown",
  "examples": ["short example 1", "short example 2"],
  "keyTerms": [{"term": "...", "definition": "..."}],
  "quiz": [
    {"question":"...", "options":["A","B","C","D"], "answerIndex":0}
  ]
}

Rules:
- Beginner-friendly, 180-250 words for mainNotes.
- Exactly 3 cues (questions a student should be able to answer after this lesson).
- Exactly 3 quiz questions. answerIndex between 0 and 3.
- summary is 1-2 sentences.`;

    let markdownLesson = `## ${task.topic}\n\nThis lesson introduces the key idea in a practical way and prepares you for short retrieval practice.`;
    let summary = `Quick overview of ${task.topic}`;
    let cornell: CornellNote = {
      cues: [`What is ${task.topic}?`, "When would you use this?", "What are the key steps?"],
      mainNotes: markdownLesson,
      examples: [],
      keyTerms: [],
      summary,
    };
    let quiz: QuizItem[] = [
      { question: `Which statement best describes ${task.topic}?`, options: ["Core concept", "Random fact", "UI style", "Database key"], answerIndex: 0 },
      { question: "What helps improve mastery fastest?", options: ["Passive reading", "Spaced practice", "Skipping quizzes", "No review"], answerIndex: 1 },
      { question: "What should you do after one study session?", options: ["Stop forever", "Review weak points", "Delete notes", "Ignore feedback"], answerIndex: 1 },
    ];

    try {
      const text = await generateAIText({ provider: provider as AIProvider, prompt, openAIModel: model, geminiModel: model });
      if (text) {
        const parsed = JSON.parse(text);
        if (parsed?.markdownLesson) markdownLesson = parsed.markdownLesson;
        if (parsed?.summary) summary = parsed.summary;
        if (parsed?.quiz && Array.isArray(parsed.quiz)) quiz = parsed.quiz.slice(0, 3);
        cornell = {
          cues: Array.isArray(parsed.cues) ? parsed.cues.slice(0, 3) : cornell.cues,
          mainNotes: parsed.mainNotes || parsed.markdownLesson || cornell.mainNotes,
          examples: Array.isArray(parsed.examples) ? parsed.examples : [],
          keyTerms: Array.isArray(parsed.keyTerms) ? parsed.keyTerms : [],
          summary: parsed.summary || summary,
        };
      }
    } catch {
      // fallback already set
    }

    return NextResponse.json({
      task,
      lesson: { markdownLesson, summary, quiz, cornell },
      thoughts,
      provider,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Failed to create learning session." }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create ThinkingPanel component**

Create `components/ThinkingPanel.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";

type Props = { thoughts: string[] };

export default function ThinkingPanel({ thoughts }: Props) {
  const [visible, setVisible] = useState<number>(0);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (visible >= thoughts.length) return;
    const timer = setTimeout(() => setVisible((v) => v + 1), 420);
    return () => clearTimeout(timer);
  }, [visible, thoughts.length]);

  return (
    <div className={`border border-zinc-800 rounded-xl bg-zinc-950 transition-all ${open ? "p-4" : "p-3"}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 w-full text-left mb-3"
      >
        <span className="text-indigo-400 text-sm font-semibold">🧠 AI Reasoning</span>
        <ChevronRight size={14} className={`text-zinc-500 transition-transform ${open ? "rotate-90" : ""}`} />
      </button>

      {open && (
        <div className="space-y-2">
          {thoughts.slice(0, visible).map((t, i) => (
            <div
              key={i}
              className="flex items-start gap-2 text-xs text-zinc-400 animate-fadeIn"
            >
              <span className="mt-0.5 shrink-0 text-indigo-500">›</span>
              <span>{t}</span>
            </div>
          ))}
          {visible < thoughts.length && (
            <div className="flex gap-1 pl-4">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Update learn page with ThinkingPanel and Cornell layout**

Replace entire `app/learn/[taskId]/page.tsx`:

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import ThinkingPanel from "@/components/ThinkingPanel";

type QuizItem = { question: string; options: string[]; answerIndex: number };
type CornellNote = {
  cues: string[];
  mainNotes: string;
  examples: string[];
  keyTerms: { term: string; definition: string }[];
  summary: string;
};

export default function LearnTaskPage() {
  const params = useParams<{ taskId: string }>();
  const router = useRouter();
  const taskId = params.taskId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [topic, setTopic] = useState("");
  const [markdownLesson, setMarkdownLesson] = useState("");
  const [notesSummary, setNotesSummary] = useState("");
  const [cornell, setCornell] = useState<CornellNote | null>(null);
  const [thoughts, setThoughts] = useState<string[]>([]);
  const [quiz, setQuiz] = useState<QuizItem[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [confidence, setConfidence] = useState(3);
  const [error, setError] = useState("");
  const [sessionStart] = useState<number>(Date.now());
  const [provider, setProvider] = useState("openai");
  const [model, setModel] = useState("gpt-4o-mini");

  useEffect(() => {
    const savedProvider = localStorage.getItem("ai_provider");
    const savedModel = localStorage.getItem("ai_model");
    if (savedProvider) setProvider(savedProvider);
    if (savedModel) setModel(savedModel);
  }, []);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch("/api/learn/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taskId, userId: "user-1", provider, model }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load lesson");
        setTopic(data.task.topic);
        setMarkdownLesson(data.lesson.markdownLesson);
        setNotesSummary(data.lesson.summary);
        setCornell(data.lesson.cornell || null);
        setThoughts(data.thoughts || []);
        setQuiz(data.lesson.quiz || []);
        setSelectedAnswers(new Array((data.lesson.quiz || []).length).fill(-1));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load lesson");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [taskId, provider, model]);

  const notesMarkdown = useMemo(
    () => `# ${topic}\n\n${markdownLesson}\n\n## Key Takeaways\n- ${notesSummary}`,
    [topic, markdownLesson, notesSummary]
  );

  const handleSubmit = async () => {
    setSaving(true);
    const total = quiz.length;
    const correct = quiz.reduce((acc, q, idx) => (selectedAnswers[idx] === q.answerIndex ? acc + 1 : acc), 0);
    const timeSpentMinutes = Math.max(1, Math.round((Date.now() - sessionStart) / 60000));

    const res = await fetch("/api/learn/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskId, userId: "user-1",
        correctCount: correct, totalCount: total,
        hintsUsed, skippedCount, confidence, timeSpentMinutes,
        notesMarkdown, notesSummary,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.message || "Failed to save attempt"); return; }
    alert(`Mastery: ${data.masteryBefore} → ${data.masteryAfter}\nNext review: ${data.nextReviewDate}`);
    router.push("/today");
  };

  if (loading) return <main className="min-h-screen bg-[#0a0a0a] text-white p-8">Loading lesson...</main>;
  if (error) return <main className="min-h-screen bg-[#0a0a0a] text-red-400 p-8">{error}</main>;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <p className="badge mb-2">Learning Session</p>
        <h1 className="page-header">{topic}</h1>
        <p className="page-subheader mb-6">Read, answer the quiz, and complete the task to update mastery.</p>

        <div className="flex flex-wrap gap-3 mb-6">
          <select
            value={provider}
            onChange={(e) => {
              setProvider(e.target.value);
              const m = e.target.value === "gemini" ? "gemini-1.5-flash" : "gpt-4o-mini";
              setModel(m);
              localStorage.setItem("ai_provider", e.target.value);
              localStorage.setItem("ai_model", m);
            }}
            className="field-input max-w-[160px]"
          >
            <option value="openai">OpenAI</option>
            <option value="gemini">Gemini</option>
          </select>
          <input
            value={model}
            onChange={(e) => { setModel(e.target.value); localStorage.setItem("ai_model", e.target.value); }}
            className="field-input max-w-[200px]"
            placeholder="Model"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* LEFT: lesson + quiz */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cornell Notes Layout */}
            {cornell ? (
              <div className="card space-y-0 overflow-hidden">
                <div className="px-4 pt-4 pb-2 border-b border-zinc-800">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">Cornell Notes — {topic}</p>
                </div>
                <div className="flex divide-x divide-zinc-800">
                  {/* Cue column */}
                  <div className="w-[30%] p-4 space-y-4 bg-zinc-950">
                    <div>
                      <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Cue Questions</p>
                      <ul className="space-y-2">
                        {cornell.cues.map((cue, i) => (
                          <li key={i} className="text-xs text-indigo-300 leading-snug">→ {cue}</li>
                        ))}
                      </ul>
                    </div>
                    {cornell.keyTerms.length > 0 && (
                      <div>
                        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Key Terms</p>
                        {cornell.keyTerms.map((kt, i) => (
                          <div key={i} className="mb-2">
                            <p className="text-xs font-semibold text-white">{kt.term}</p>
                            <p className="text-xs text-zinc-400">{kt.definition}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Main notes column */}
                  <div className="flex-1 p-4 prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown>{cornell.mainNotes}</ReactMarkdown>
                    {cornell.examples.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Examples</p>
                        {cornell.examples.map((ex, i) => (
                          <pre key={i} className="text-xs bg-zinc-900 rounded p-2 mb-2 overflow-x-auto">{ex}</pre>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {/* Summary strip */}
                <div className="border-t border-zinc-800 bg-zinc-950 px-4 py-3">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Summary</p>
                  <p className="text-sm text-zinc-300">{cornell.summary}</p>
                </div>
              </div>
            ) : (
              <div className="card prose prose-invert max-w-none">
                <ReactMarkdown>{markdownLesson}</ReactMarkdown>
              </div>
            )}

            {/* Quiz */}
            <div>
              <h2 className="text-xl font-semibold mb-3">Mini Quiz</h2>
              <div className="space-y-4">
                {quiz.map((q, qIdx) => (
                  <div key={`${q.question}-${qIdx}`} className="card p-4">
                    <p className="mb-3 font-medium">{q.question}</p>
                    <div className="grid gap-2">
                      {q.options.map((opt, oIdx) => (
                        <button
                          key={`${opt}-${oIdx}`}
                          onClick={() => setSelectedAnswers((prev) => { const c = [...prev]; c[qIdx] = oIdx; return c; })}
                          className={`text-left px-3 py-2 rounded border text-sm transition ${
                            selectedAnswers[qIdx] === oIdx ? "bg-indigo-600/30 border-indigo-500 text-white" : "bg-zinc-900 border-zinc-700 hover:border-zinc-500"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tracking controls */}
            <div className="flex flex-wrap gap-3">
              <button onClick={() => setHintsUsed((v) => v + 1)} className="btn-ghost text-sm">Used Hint ({hintsUsed})</button>
              <button onClick={() => setSkippedCount((v) => v + 1)} className="btn-ghost text-sm">Skipped ({skippedCount})</button>
              <label className="px-3 py-2 bg-zinc-900 rounded border border-zinc-700 text-sm">
                Confidence:
                <select className="ml-2 bg-black border border-zinc-700 rounded px-2 py-1" value={confidence} onChange={(e) => setConfidence(Number(e.target.value))}>
                  {[1,2,3,4,5].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
            </div>

            <button onClick={handleSubmit} disabled={saving} className="btn-primary w-full md:w-auto">
              {saving ? "Saving..." : "Complete Task"}
            </button>
          </div>

          {/* RIGHT: thinking panel + stats */}
          <div className="space-y-4">
            {thoughts.length > 0 && <ThinkingPanel thoughts={thoughts} />}

            <div className="card space-y-3">
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Session Stats</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <p className="text-lg font-semibold">{hintsUsed}</p>
                  <p className="text-xs text-zinc-500">Hints</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold">{skippedCount}</p>
                  <p className="text-xs text-zinc-500">Skipped</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold">{confidence}/5</p>
                  <p className="text-xs text-zinc-500">Confidence</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Verify**

Start a learning session via `/learn/[taskId]`. Confirm:
1. Notes appear in Cornell layout (left cue column, right main notes, bottom summary)
2. Right panel shows "🧠 AI Reasoning" with thoughts revealing one by one
3. Thoughts reference the actual topic name
4. Quiz, hints, confidence still work and submitting redirects to `/today`

- [ ] **Step 5: Commit**

```bash
git add app/api/learn/session/route.ts components/ThinkingPanel.tsx app/learn/[taskId]/page.tsx
git commit -m "feat: AI thinking panel and Cornell-style notes on learn page"
```

---

## Task 6: Streak Calendar

**Files:**
- Create: `app/api/progress/streak/route.ts`
- Create: `components/StreakCalendar.tsx`
- Modify: `app/progress/page.tsx`

- [ ] **Step 1: Create the streak API**

Create `app/api/progress/streak/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

type DayData = {
  date: string;
  topics: string[];
  attempts: number;
  questionsAnswered: number;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "user-1";

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 89);
    const since = ninetyDaysAgo.toISOString().slice(0, 10);

    const { data: attempts } = await supabaseServer
      .from("learning_attempts")
      .select("created_at, correct_count, total_count")
      .eq("user_id", userId)
      .gte("created_at", since)
      .order("created_at", { ascending: true });

    const { data: tasks } = await supabaseServer
      .from("learning_tasks")
      .select("id, topic, created_at")
      .eq("user_id", userId)
      .eq("status", "completed")
      .gte("created_at", since);

    const taskMap = new Map<string, string[]>();
    (tasks || []).forEach((t) => {
      const d = t.created_at.slice(0, 10);
      if (!taskMap.has(d)) taskMap.set(d, []);
      if (!taskMap.get(d)!.includes(t.topic)) taskMap.get(d)!.push(t.topic);
    });

    const dayMap = new Map<string, DayData>();
    (attempts || []).forEach((a) => {
      const d = a.created_at.slice(0, 10);
      if (!dayMap.has(d)) {
        dayMap.set(d, {
          date: d,
          topics: taskMap.get(d) || [],
          attempts: 0,
          questionsAnswered: 0,
        });
      }
      const day = dayMap.get(d)!;
      day.attempts += 1;
      day.questionsAnswered += a.total_count || 0;
    });

    const days = Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    // Calculate streaks
    const today = new Date().toISOString().slice(0, 10);
    const activeDates = new Set(days.map((d) => d.date));
    let currentStreak = 0;
    let longestStreak = 0;
    let streak = 0;
    let checkDate = new Date();

    // Walk back from today to count current streak
    while (true) {
      const d = checkDate.toISOString().slice(0, 10);
      if (activeDates.has(d)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Walk all days to find longest streak
    let prev: string | null = null;
    for (const d of activeDates) {
      if (prev) {
        const prevDate = new Date(prev);
        prevDate.setDate(prevDate.getDate() + 1);
        if (prevDate.toISOString().slice(0, 10) === d) {
          streak++;
        } else {
          streak = 1;
        }
      } else {
        streak = 1;
      }
      longestStreak = Math.max(longestStreak, streak);
      prev = d;
    }

    return NextResponse.json({ currentStreak, longestStreak, days });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ currentStreak: 0, longestStreak: 0, days: [] });
  }
}
```

- [ ] **Step 2: Create StreakCalendar component**

Create `components/StreakCalendar.tsx`:

```tsx
"use client";

import { useState } from "react";

type DayData = {
  date: string;
  topics: string[];
  attempts: number;
  questionsAnswered: number;
};

type Props = {
  days: DayData[];
  currentStreak: number;
  longestStreak: number;
};

export default function StreakCalendar({ days, currentStreak, longestStreak }: Props) {
  const [tooltip, setTooltip] = useState<DayData | null>(null);
  const dayMap = new Map(days.map((d) => [d.date, d]));

  // Build last 90 days grid
  const cells: string[] = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    cells.push(d.toISOString().slice(0, 10));
  }

  const getColor = (date: string) => {
    const d = dayMap.get(date);
    if (!d) return "bg-zinc-900 border-zinc-800";
    if (d.attempts >= 3) return "bg-indigo-600 border-indigo-500";
    if (d.attempts >= 1) return "bg-indigo-900 border-indigo-700";
    return "bg-zinc-900 border-zinc-800";
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Study Streak</h2>
          <p className="text-sm text-zinc-400">Last 90 days of activity</p>
        </div>
        <div className="flex gap-4 text-right">
          <div>
            <p className="text-2xl font-bold text-indigo-400">🔥 {currentStreak}</p>
            <p className="text-xs text-zinc-500">Current</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-zinc-300">{longestStreak}</p>
            <p className="text-xs text-zinc-500">Longest</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(13,1fr)] gap-1">
        {cells.map((date) => (
          <button
            key={date}
            title={date}
            onMouseEnter={() => setTooltip(dayMap.get(date) || null)}
            onMouseLeave={() => setTooltip(null)}
            className={`aspect-square rounded-sm border transition-transform hover:scale-110 ${getColor(date)} ${date === today ? "ring-1 ring-white/30" : ""}`}
          />
        ))}
      </div>

      <div className="flex items-center gap-3 mt-3 text-xs text-zinc-500">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-zinc-900 border border-zinc-800" />
          <div className="w-3 h-3 rounded-sm bg-indigo-900 border border-indigo-700" />
          <div className="w-3 h-3 rounded-sm bg-indigo-600 border border-indigo-500" />
        </div>
        <span>More</span>
      </div>

      {tooltip && (
        <div className="mt-3 p-3 bg-zinc-900 rounded-lg border border-zinc-700 text-sm animate-fadeIn">
          <p className="font-medium text-white">{new Date(tooltip.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</p>
          <p className="text-zinc-400">{tooltip.attempts} session{tooltip.attempts !== 1 ? "s" : ""} · {tooltip.questionsAnswered} questions</p>
          {tooltip.topics.length > 0 && (
            <p className="text-indigo-300 mt-1">{tooltip.topics.join(", ")}</p>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Add StreakCalendar to progress page**

In `app/progress/page.tsx`:

1. Add imports at the top:
```tsx
import StreakCalendar from "@/components/StreakCalendar";
```

2. Add streak state alongside existing state:
```tsx
const [streak, setStreak] = useState<{ currentStreak: number; longestStreak: number; days: any[] }>({
  currentStreak: 0, longestStreak: 0, days: [],
});
```

3. In the `run()` function inside `useEffect`, add a third fetch alongside the existing two:
```tsx
const [tableRes, masteryRes, streakRes] = await Promise.all([
  fetch("/api/progress/table?userId=user-1", { cache: "no-store" }),
  fetch("/api/progress/mastery?userId=user-1", { cache: "no-store" }),
  fetch("/api/progress/streak?userId=user-1", { cache: "no-store" }),
]);
const tableData = await tableRes.json();
const masteryData = await masteryRes.json();
const streakData = await streakRes.json();
setRows(tableData.rows || []);
setMastery(masteryData.mastery || []);
setStreak({ currentStreak: streakData.currentStreak || 0, longestStreak: streakData.longestStreak || 0, days: streakData.days || [] });
```

4. Insert `<StreakCalendar>` just before the mastery section, inside the `{!loading && ( <>` block:
```tsx
<div className="mb-8">
  <StreakCalendar
    days={streak.days}
    currentStreak={streak.currentStreak}
    longestStreak={streak.longestStreak}
  />
</div>
```

- [ ] **Step 4: Verify**

Navigate to `/progress`. Confirm:
1. Streak calendar grid appears with 90 day cells
2. Active days show indigo shading
3. Hover over an active cell → tooltip shows topics + question count
4. Current streak and longest streak counts are correct

- [ ] **Step 5: Commit**

```bash
git add components/StreakCalendar.tsx app/api/progress/streak/route.ts app/progress/page.tsx
git commit -m "feat: streak calendar on progress page with 90-day activity grid"
```

---

## Task 7: Floating AI Chatbot

**Files:**
- Modify: `app/api/learning/route.ts`
- Create: `components/FloatingChatbot.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Update the learning API to accept context and return actions**

Replace the entire content of `app/api/learning/route.ts`:

```typescript
import { NextResponse } from "next/server";

type Message = { role: "user" | "assistant"; content: string };
type Context = { page?: string; userId?: string };

export async function POST(req: Request) {
  try {
    const { messages, context }: { messages: Message[]; context?: Context } = await req.json();
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
    const input = lastUserMessage?.content || "";
    const lower = input.toLowerCase();
    const page = context?.page || "";

    // Detect action intents
    const addRoadmapMatch = lower.match(/add\s+(.+?)\s+(to|in)\s+(my\s+)?roadmap/i);
    const askTodayTasks = lower.includes("today") && (lower.includes("study") || lower.includes("task") || lower.includes("do"));

    let reply = "";
    let action: { type: string; payload: Record<string, unknown> } | null = null;

    if (addRoadmapMatch) {
      const topic = addRoadmapMatch[1].trim();
      // Actually add the step via Supabase — return action for client to confirm
      reply = `I'll add "${topic}" to your roadmap. It'll appear as a new step the next time you load the roadmap page.`;
      action = { type: "add_roadmap_step", payload: { topic } };
    } else if (askTodayTasks) {
      reply = `Check your Today page (/today) for your generated tasks, or click the Today link in the navigation.`;
    } else {
      try {
        const systemPrompt = `You are Saarthi AI, a helpful learning assistant for university students.
Current page: ${page || "unknown"}
Keep responses concise and actionable (2-3 sentences max unless explaining a concept).
If asked to add a topic to the roadmap, confirm you will do it.`;

        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "openai/gpt-4o-mini",
            messages: [
              { role: "system", content: systemPrompt },
              ...messages.slice(-6),
            ],
          }),
        });
        const data = await res.json();
        reply = data.choices?.[0]?.message?.content || "I'm here to help with your studies!";
      } catch {
        reply = "I'm here to help! What are you studying?";
      }
    }

    return NextResponse.json({ reply, action });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ reply: "Something went wrong. Try again.", action: null });
  }
}
```

- [ ] **Step 2: Create FloatingChatbot component**

Create `components/FloatingChatbot.tsx`:

```tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { MessageSquare, X, Send, Loader2 } from "lucide-react";

type Message = { role: "user" | "assistant"; content: string };

export default function FloatingChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I'm Saarthi AI. Ask me anything, or say \"add [topic] to my roadmap\"." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/learning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          context: { page: pathname, userId: "user-1" },
        }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);

      if (data.action?.type === "add_roadmap_step") {
        await fetch("/api/roadmap/update", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic: data.action.payload.topic, append: true }),
        });
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, something went wrong." }]);
    }
    setLoading(false);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-900/40 transition-transform hover:scale-105"
        aria-label="Open AI chat"
      >
        {open ? <X size={20} /> : <MessageSquare size={20} />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 right-6 z-50 w-80 md:w-96 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fadeIn">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className="text-sm font-semibold text-white">Saarthi AI</span>
            </div>
            <span className="text-xs text-zinc-500 truncate max-w-[140px]">{pathname}</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-72">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] text-sm px-3 py-2 rounded-xl leading-relaxed ${
                  m.role === "user"
                    ? "bg-indigo-600 text-white rounded-br-sm"
                    : "bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-bl-sm"
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl rounded-bl-sm px-3 py-2">
                  <Loader2 size={14} className="text-zinc-500 animate-spin" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="p-3 border-t border-zinc-800 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Ask anything..."
              className="field-input flex-1 text-sm py-2"
              disabled={loading}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="btn-primary px-3 py-2 disabled:opacity-50"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 3: Mount FloatingChatbot in the root layout**

In `app/layout.tsx`, add the import and mount inside `<Providers>`:

```tsx
import FloatingChatbot from "@/components/FloatingChatbot";
```

Change the `<Providers>` block to:

```tsx
<Providers>
  <Navbar />
  <main className="flex-1">{children}</main>
  <FloatingChatbot />
</Providers>
```

- [ ] **Step 4: Verify**

1. Open any page — floating indigo button appears bottom-right
2. Click it — chat panel opens with greeting
3. Type "What should I study today?" — gets contextual reply
4. Type "Add Python Basics to my roadmap" — gets confirmation reply
5. Panel shows current page path in header
6. Works on roadmap, progress, learn pages simultaneously

- [ ] **Step 5: Commit**

```bash
git add components/FloatingChatbot.tsx app/layout.tsx app/api/learning/route.ts
git commit -m "feat: global floating AI chatbot with page context and roadmap actions"
```

---

## Self-Review Checklist

- [x] **Auth gates**: middleware redirects + home page session check — covered in Task 1
- [x] **Multi-step onboarding**: 5 steps, subjects[], AI confirm, generation — covered in Task 2
- [x] **Editable roadmap**: edit mode with title inputs, save to DB — covered in Task 3
- [x] **Start button**: creates task from roadmap step, redirects to learn — covered in Task 3
- [x] **YouTube resources**: ResourcePanel + /api/resources with YouTube Data API + fallback — covered in Task 4
- [x] **AI thinking panel**: ThinkingPanel component + thoughts[] in session API — covered in Task 5
- [x] **Cornell notes**: structured cues/mainNotes/keyTerms/summary from AI, Cornell layout — covered in Task 5
- [x] **Streak calendar**: StreakCalendar component + /api/progress/streak — covered in Task 6
- [x] **Floating chatbot**: FloatingChatbot component + updated learning API — covered in Task 7
- [x] **Type consistency**: `Message`, `DayData`, `CornellNote` types defined before use
- [x] **No TBDs or TODOs** in code blocks
- [x] **Fallbacks**: YouTube (no API key), AI confirm (network error), thoughts (DB query error)
