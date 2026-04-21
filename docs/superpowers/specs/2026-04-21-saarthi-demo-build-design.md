# Saarthi AI — Demo Build Design

**Date:** 2026-04-21  
**Deadline:** Same day  
**Context:** Saarthi AI is a Learning OS for university students. The core loop (onboarding → roadmap → daily tasks → learn+quiz → mastery) already works. This build layers 7 demo-critical features on top of the existing skeleton to make the product feel complete, intelligent, and polished for a live demo.

---

## What Already Exists (Do Not Rebuild)

- Google OAuth via NextAuth (`app/api/auth/[...nextauth]`)
- Roadmap generation + visualization (`app/roadmap`, `components/RoadmapGraph.tsx`)
- Daily task generation + priority scoring (`app/today`, `lib/tier1.ts`)
- Interactive learn session + quiz (`app/learn/[taskId]`)
- Mastery scoring formula (`lib/tier1.ts` — `updateMasteryScore`)
- Auto-tracking table on progress page (`app/progress`)
- Note saving to `lesson_notes` table
- AI provider abstraction (`lib/ai-provider.ts` — OpenAI + Gemini)
- Chat UI skeleton (`app/learning/page.tsx`, `/api/learning`)

---

## Feature 1: Auth Gates

**Problem:** The home page shows all CTAs and feature pills regardless of login state. Protected routes don't actually redirect — middleware calls `NextResponse.next()` unconditionally.

**Changes:**
- `app/page.tsx`: Use `useSession()` from next-auth/react. Logged-out state shows only a single "Sign in to start" button. Logged-in state shows all three CTAs (Open Today Plan, View Roadmap, View Progress) + feature pills.
- `middleware.ts`: Replace pass-through with actual redirect to `/login` for all protected routes: `/onboarding`, `/roadmap`, `/today`, `/progress`, `/learning`, `/goals`, `/upskill`, `/calendar`, `/credentials`.

**No new DB changes. No new API routes.**

---

## Feature 2: Multi-Step Onboarding

**Problem:** Current onboarding is a single flat form. It doesn't let users specify what subjects they want to learn, and the AI has no input on validating/expanding those topics.

**New flow — 5 steps (React state machine, no page navigation):**

**Step 1 — Profile**: Full name, branch (CSE/ECE/BBA/Other), experience level (Beginner/Intermediate/Advanced).

**Step 2 — Subjects**: Tag-style input. User types a subject and presses Enter/comma to add it as a tag. Minimum 1, maximum 10. Examples: "React Hooks", "DSA", "Operating Systems".

**Step 3 — AI Confirmation**: On entering this step, call `/api/onboarding/confirm` (new). If the call fails or times out, silently skip to Step 4. The API returns:
```json
{
  "confirmed": ["React Hooks", "DSA", "Operating Systems"],
  "suggested": ["JavaScript Fundamentals", "Data Structures Basics"],
  "message": "Got it. I'll build your roadmap around these topics. I'd also suggest adding these prerequisites:"
}
```
User sees confirmed topics + suggested additions with checkboxes. They can accept/reject each suggestion.

**Step 4 — Schedule**: Semester weeks (12/16/20), daily study minutes (60/90/120/180), AI provider (OpenAI/Gemini), model name.

**Step 5 — Generation**: Animated loading screen ("Building your personalized roadmap...") while `/api/generate-roadmap` runs. On success, redirect to `/roadmap`.

**Files changed:**
- `app/onboarding/page.tsx` — full rewrite to wizard
- `lib/learning-os.ts` — `buildRoadmapPrompt()` updated to accept `subjects: string[]` and weave them into the prompt
- `app/api/generate-roadmap/route.ts` — accept `subjects[]` in body, pass to prompt builder
- New: `app/api/onboarding/confirm/route.ts` — takes `subjects[]`, uses AI to validate + suggest additions

---

## Feature 3: Editable Roadmap + YouTube Resources

**Problem:** The roadmap is read-only. Users can't adjust topics before starting. Clicking a node opens an unimplemented stub link. There's no "Start" action per topic.

**Edit mode:**
- Toggle button ("Edit Roadmap" / "Save Changes") in page header
- In edit mode: each roadmap node shows a text input for the step title (title-edit only — no reordering, too complex for same-day build)
- "Save Changes" calls `PATCH /api/roadmap/update` — updates step titles in Supabase `roadmap` table

**Start button:**
- Each node (in view mode) has a "Start →" button
- Clicking calls `POST /api/roadmap/start` — creates a `learning_tasks` row for that step if one doesn't exist for today, then redirects to `/learn/[taskId]`

**YouTube resources panel:**
- Clicking a node title (not the Start button) opens a slide-over panel
- Panel shows 3 YouTube video cards: thumbnail, title, channel, view count
- Fetched via `GET /api/resources?topic=<step_title>`
- Implementation: YouTube Data API v3 (`search.list` + `videos.list` for view counts). If `YOUTUBE_API_KEY` is not set, falls back to constructing `https://www.youtube.com/results?search_query=<encoded_topic>` links.

**Files changed:**
- `app/roadmap/page.tsx` — edit mode toggle, Start button, panel state
- `components/RoadmapGraph.tsx` — edit mode node rendering, drag handles
- New component: `components/ResourcePanel.tsx` — slide-over with YT video cards
- New API: `app/api/roadmap/update/route.ts` — PATCH step title
- New API: `app/api/roadmap/start/route.ts` — POST create task + redirect
- Updated API: `app/api/get-link/route.ts` → replaced by `app/api/resources/route.ts`

---

## Feature 4: "AI Thinking Out Loud" Panel

**Problem:** The AI's intelligence is invisible. The biggest demo moment is showing judges that the AI is actually reasoning about the student, not just generating generic content.

**Design:**
- Right-side collapsible panel on `app/learn/[taskId]/page.tsx`
- Panel header: "🧠 AI Reasoning"
- Shows a vertical timeline of thought steps, revealed one by one (400ms stagger):

```
✦ Analyzing your topic history...
⚠  You got 3 questions on this topic wrong recently — adjusting difficulty
📚 Structuring lesson: Closures & Scope
🔗 Detected prerequisite gap: Lexical Environment — added intro section
❓ Generating 3 targeted quiz questions
✅ Lesson ready
```

**Implementation:** The `/api/learn/session` route returns a `thoughts: string[]` array alongside the lesson content. The client reveals items with `setTimeout` staggering. Thoughts are generated as part of the AI prompt — the model is instructed to return a `thoughts` field explaining its reasoning.

**Files changed:**
- `app/learn/[taskId]/page.tsx` — add `ThinkingPanel` component, staggered reveal logic
- New component: `components/ThinkingPanel.tsx`
- `app/api/learn/session/route.ts` — update prompt to include `thoughts[]` in JSON response, parse and return it

---

## Feature 5: Cornell-Style Notes

**Problem:** Notes are saved as flat markdown. The Cornell method (cues + main notes + summary) structures learning for better retention and makes notes visually distinctive in the demo.

**Prompt change:** The lesson generation prompt in `lib/learning-os.ts` is updated to return:
```json
{
  "cues": ["What is a closure?", "When does the scope chain matter?"],
  "mainNotes": "## Closures\n\nA closure is...",
  "examples": ["function outer() { ... }", "const add = (x) => (y) => x + y"],
  "keyTerms": [{"term": "Closure", "definition": "..."}, ...],
  "summary": "Closures capture variables from their enclosing scope...",
  "questions": ["What happens when...?", "Why does this work?"]
}
```

**Display:** Cornell layout on the learn page:
- Left column (30%): cue questions + key terms
- Right column (70%): main notes rendered as markdown
- Bottom strip: summary + review questions

**Storage:** `lesson_notes.markdown_content` stores the full JSON (backward-compatible since old entries are plain markdown — display layer handles both).

**Files changed:**
- `lib/learning-os.ts` — update lesson prompt schema
- `app/api/learn/session/route.ts` — parse new structured format
- `app/learn/[taskId]/page.tsx` — Cornell layout component

---

## Feature 6: Streak Calendar

**Problem:** Users have no visible sense of their study consistency. A streak calendar makes the gamification tangible.

**Design:** Added as a new section on `app/progress/page.tsx`, above the mastery bars.

- Header row: "🔥 Current streak: N days | Longest: N days"
- Calendar grid: last 90 days, 7 columns (Mon–Sun), each cell colored by activity:
  - No activity: dark empty cell
  - 1–2 tasks: light indigo
  - 3+ tasks: full indigo
- Click a day → tooltip shows: topics studied, questions answered, mastery gained
- Data: query `learning_attempts` grouped by `created_at::date`, join with task topics

**Files changed:**
- `app/progress/page.tsx` — add streak section
- New component: `components/StreakCalendar.tsx`
- New API: `app/api/progress/streak/route.ts` — returns `{ currentStreak, longestStreak, days: { date, topics[], attempts, questionsAnswered }[] }`

---

## Feature 7: Floating AI Chatbot

**Problem:** The AI is locked to specific pages. A global chatbot makes the AI feel like a companion that's always present, and enables power-user interactions like "add Python to my roadmap."

**Design:**
- Floating button: bottom-right corner, always visible, indigo circle with `MessageSquare` icon
- Opens a slide-up panel (400px tall, full-width mobile): chat history + input
- Context header: shows current page name ("You're on: Roadmap")

**Smart actions the chatbot understands:**
- "Add [topic] to my roadmap" → calls `POST /api/roadmap/update` to append a new step
- "What should I study today?" → calls `GET /api/tasks/today` and summarizes
- "Show me my progress on [topic]" → calls `GET /api/progress/mastery` and reports score
- Everything else → general learning assistant response

**Implementation:** Enhance `/api/learning/route.ts` to accept `{ messages, context: { page, userId } }`. System prompt includes page context. Response includes optional `action: { type, payload }` field — client executes the action after displaying the message.

**Files changed:**
- `app/layout.tsx` — mount `<FloatingChatbot />` inside `<Providers>`
- New component: `components/FloatingChatbot.tsx`
- `app/api/learning/route.ts` — accept context, support action responses

---

## Build Order

Execute in this order to maximize demo-readiness at every step:

1. **Auth gates** — immediate visible impact, 30 min
2. **Floating chatbot skeleton** — global, unblocks showing it in demo at any stage
3. **Multi-step onboarding** — entry point of the demo flow
4. **Editable roadmap + YT resources** — biggest visual wow moment
5. **Cornell notes + AI thinking panel** — both touch `app/learn/[taskId]/page.tsx`, do together
6. **Streak calendar** — polish the progress page last

---

## Database — No Schema Changes Required

All new features use existing tables:
- `learning_attempts` (streak calendar reads from this)
- `roadmap` (edit mode updates step titles)
- `learning_tasks` (Start button creates rows here)
- `lesson_notes` (Cornell notes stored as JSON in `markdown_content`)
- `profiles` (onboarding writes subjects array — add `subjects text[]` column)

One migration needed: `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subjects text[] DEFAULT '{}';`

---

## Environment Variables Needed

```
YOUTUBE_API_KEY=   # Optional — falls back to search URL links if not set
```

All other env vars (`OPENAI_API_KEY`, `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`) already configured.

---

## Verification Steps

After each feature:
1. **Auth gates**: Open `/` in incognito → only "Sign in" button visible. Click it → `/login`. Click nav item → redirects to `/login`.
2. **Onboarding**: Complete all 5 steps, verify roadmap created with user's subjects reflected in step titles.
3. **Roadmap**: Toggle edit mode → rename a step → save → refresh → name persists. Click Start → lands on learn page. Click topic name → YouTube panel opens with 3 videos.
4. **AI thinking panel**: Start a learn session → panel appears on right → thoughts reveal one by one.
5. **Cornell notes**: Complete a session → notes show in Cornell layout with cues on left, summary at bottom.
6. **Streak calendar**: Progress page shows calendar with today highlighted after completing a task.
7. **Chatbot**: Click floating button from any page → type "What should I study today?" → gets a relevant response. Type "Add Python to my roadmap" → roadmap gains a new step.
