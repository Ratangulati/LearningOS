export type StudentProfileInput = {
  userId: string;
  goal: string;
  interest: string;
  currentLevel: "beginner" | "intermediate" | "advanced";
  semesterWeeks: number;
  dailyMinutes: number;
};

export type RoadmapStep = {
  step: string;
  type: "learn" | "practice" | "revise";
  domain: string;
  platform: string;
  estimatedMinutes: number;
  prerequisites: string[];
};

type RawRoadmapStep = Partial<RoadmapStep> & { step?: string };

const fallbackTopics = [
  "Prerequisite checkpoint and setup",
  "Core concept deep dive",
  "Guided coding exercise",
  "Applied mini assignment",
  "Error-fixing and edge-case drills",
  "Timed practice set",
  "Revision and memory consolidation",
  "Final project or assessment submission",
];

export function buildRoadmapPrompt(profile: StudentProfileInput): string {
  return `You are an elite learning architect inside an AI-powered "Learning OS."

Your job is to design a COMPLETE, logically correct, and fully actionable learning system for a given goal - not just a roadmap, but a system that someone can follow daily to reach real mastery.

You must think like:
- a curriculum designer (structure)
- a senior engineer (logic and correctness)
- a cognitive scientist (how people actually learn)
- a mentor (clear, practical guidance)

-------------------------------------
PRIMARY OBJECTIVE
-------------------------------------
Create a learning system that:
- starts from first principles
- includes all required prerequisites
- is perfectly sequenced
- leads to real-world capability
- can be followed step-by-step without confusion

-------------------------------------
CORE RULES
-------------------------------------
1. Do NOT use beginner/intermediate/advanced labels.
2. Do NOT assume prior knowledge.
3. Do NOT skip hidden prerequisites.
4. Avoid fluff and long explanations.
5. Everything must be actionable.
6. Prefer clarity and structure over verbosity.
7. Balance theory, practice, and application.

-------------------------------------
STEP 1: DEFINE MASTERY
-------------------------------------
Clearly define what "mastery" of the goal means:
- What should the learner be able to DO?
- What problems should they be able to solve?
- What real-world tasks should they handle?

-------------------------------------
STEP 2: IDENTIFY FULL KNOWLEDGE SYSTEM
-------------------------------------
- List all required concepts and skills.
- Include hidden prerequisites.
- Group them logically.

-------------------------------------
STEP 3: BUILD THE ROADMAP
-------------------------------------
Structure into:

PHASES -> MODULES -> TOPICS

Rules:
- Sequence strictly based on dependency
- Each phase = meaningful capability jump
- Each module = focused skill area
- Topics must flow logically

-------------------------------------
STEP 4: MODULE DESIGN (VERY IMPORTANT)
-------------------------------------
For EACH module, include:

- Module Name
- Objective (what capability it builds)
- Why it matters (practical importance)
- Prerequisites
- Topics (in exact sequence)

- Study Actions (clear daily/step tasks)
- Practice Tasks (specific exercises)
- Application (what to build/use)
- Self-Test Questions (to verify understanding)
- Time Estimate (realistic)

- Common Mistakes (where people fail)
- Completion Signal (how to know it's mastered)

RULE:
Tasks must be concrete and executable.
No vague instructions like "practice more".

-------------------------------------
STEP 5: LEARNING MECHANICS
-------------------------------------
Integrate naturally:

- repetition points
- cumulative learning (reuse past concepts)
- increasing difficulty
- active recall (testing, not just reading)
- practical reinforcement

-------------------------------------
STEP 6: EXECUTION FLOW
-------------------------------------
Provide a clear flow:

- What to do first
- What to do next
- How to progress between modules

-------------------------------------
STEP 7: CRITICAL PATH
-------------------------------------
- Identify the minimum path to functional competence
- Separate essential vs optional topics

-------------------------------------
STEP 8: FAILURE ANALYSIS
-------------------------------------
- Where learners struggle most
- Why they struggle
- How to avoid these issues

-------------------------------------
STEP 9: FINAL VALIDATION
-------------------------------------
Before finishing:

- Check if any prerequisite is missing -> insert it
- Ensure logical sequencing
- Remove redundancy
- Ensure the roadmap flows smoothly
- Ensure it is actually usable for studying

-------------------------------------
OUTPUT FORMAT
-------------------------------------

1. Mastery Definition

2. Full Roadmap
(Phases -> Modules -> Topics)

3. Module Breakdown (detailed for each)

4. Execution Plan
- How to start
- How to progress

5. Critical Path

6. Failure Points

-------------------------------------
CONSTRAINTS
-------------------------------------
- No fluff
- No generic advice
- No surface-level lists
- Must feel like a real system someone can follow

-------------------------------------
GOAL:
${profile.goal}`;
}

export function parseRoadmap(rawText: string): RoadmapStep[] {
  const normalized = rawText.replace(/```json/g, "").replace(/```/g, "").trim();

  try {
    const parsed = JSON.parse(normalized);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item, index) => normalizeRoadmapStep(item as RawRoadmapStep, index))
      .filter((item): item is RoadmapStep => item !== null);
  } catch {
    return [];
  }
}

export function fallbackRoadmap(profile: StudentProfileInput): RoadmapStep[] {
  return fallbackTopics.map((topic, index) => ({
    step: `${topic}: ${profile.goal}`,
    type: index < 3 ? "learn" : index < 6 ? "practice" : "revise",
    domain:
      index < 2 ? "Foundation" : index < 5 ? "Implementation" : index < 7 ? "Revision" : "Assessment",
    platform: index % 2 === 0 ? "YouTube" : "Official Docs",
    estimatedMinutes: Math.max(45, Math.min(180, Math.floor(profile.dailyMinutes * 1.2))),
    prerequisites: index === 0 ? [] : [fallbackTopics[index - 1]],
  }));
}

function normalizeRoadmapStep(
  step: RawRoadmapStep,
  index: number
): RoadmapStep | null {
  if (!step.step || typeof step.step !== "string") return null;

  const type = step.type === "practice" || step.type === "revise" ? step.type : "learn";

  return {
    step: step.step.trim(),
    type,
    domain: typeof step.domain === "string" && step.domain.trim().length > 0
      ? step.domain.trim()
      : "General Learning",
    platform:
      typeof step.platform === "string" && step.platform.trim().length > 0
        ? step.platform.trim()
        : "Web Search",
    estimatedMinutes:
      typeof step.estimatedMinutes === "number" && Number.isFinite(step.estimatedMinutes)
        ? Math.max(20, Math.round(step.estimatedMinutes))
        : 45 + index * 5,
    prerequisites: Array.isArray(step.prerequisites)
      ? step.prerequisites.filter((item): item is string => typeof item === "string")
      : [],
  };
}
