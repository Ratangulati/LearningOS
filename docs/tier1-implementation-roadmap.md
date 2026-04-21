# Saarthi Tier 1 Implementation Roadmap

This roadmap is optimized for a hackathon: ship the full Learning OS loop with reliable behavior before visual polish.

## Phase 1: Foundation (Done/In Progress)

### Goal
Capture student context and generate a structured semester roadmap.

### Deliverables
- Onboarding form with university-focused fields.
- Roadmap generation API with AI + fallback plan.
- Shared Learning OS utility for prompting and parsing.

### Files
- `app/onboarding/page.tsx`
- `app/api/generate-roadmap/route.ts`
- `lib/learning-os.ts`

## Phase 2: Daily Task Engine

### Goal
Generate 3-5 daily tasks from roadmap state, weak areas, and revision needs.

### Deliverables
- `POST /api/tasks/generate-today`
- `GET /api/tasks/today`
- `app/today/page.tsx` with start/complete actions
- Task schema updates for `task_type`, `priority_score`, `estimated_minutes`

### Logic
- Priority score:
  - 40% roadmap progression
  - 35% revision due
  - 25% weakness signal
- Always include at least one revision task.

## Phase 3: Learn + Notes Flow

### Goal
Each task launches a lesson, mini-quiz, and auto-notes.

### Deliverables
- `POST /api/learn/session` for explanation + quiz generation
- `POST /api/learn/evaluate` for scoring + behavior capture
- `app/learn/[taskId]/page.tsx`
- Save markdown lesson notes per completed session

### Behavior signals
- Time spent
- Hint usage
- Question skips
- Quiz score

## Phase 4: Auto-Tracking + Mastery

### Goal
Auto-log all learning events and maintain topic mastery score (0-1).

### Deliverables
- Tracking table page (`app/progress/page.tsx`)
- Mastery computation utility in `lib/`
- API endpoints:
  - `GET /api/progress/table`
  - `GET /api/progress/mastery`

### Tracking table columns
- Date
- Topic
- Task type
- Time spent
- Correct/total
- Hints used
- Skips
- Mastery delta

## Phase 5: Adaptation Loop

### Goal
Tomorrow's plan adapts automatically from today's behavior.

### Deliverables
- Recompute priorities nightly or on-demand after completion.
- Down-rank overload patterns; up-rank weak-but-critical topics.
- Mark at-risk topics for dashboard callout.

## Phase 6: Demo Hardening

### Goal
Make the product flow stable and judge-friendly.

### Deliverables
- Seed one sample user journey.
- Add empty/loading/error states across all Tier 1 pages.
- Dry-run script:
  1. Onboarding
  2. Generated roadmap
  3. Daily task completion
  4. Auto note creation
  5. Progress table + mastery change

## Build Order Checklist

1. Finish Phase 1 cleanup and schema alignment.
2. Build task generation APIs + Today page.
3. Build Learn flow and automatic note saving.
4. Add progress table and mastery bars.
5. Wire adaptation into next-day task generation.
6. Final polish and demo script rehearsal.
