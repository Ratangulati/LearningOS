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
  const mernHint =
    /mern|mongo|express|react|node/i.test(profile.goal) ||
    /mern|mongo|express|react|node/i.test(profile.interest)
      ? `\nSpecial prerequisite rule for MERN-like goals:
- First 2 steps must explicitly cover HTML, CSS, and JavaScript fundamentals.
- Add one prerequisite step for Git/GitHub basics before backend/API work.\n`
      : "";

  return `You are an academic planner creating a high-quality actionable roadmap for a university student.

Goal: ${profile.goal}
Interest track: ${profile.interest}
Current level: ${profile.currentLevel}
Semester duration in weeks: ${profile.semesterWeeks}
Daily study minutes: ${profile.dailyMinutes}

Output rules:
- Return ONLY a JSON array with 8 objects.
- Each object must include:
  - step (string, clear and specific; no vague titles)
  - type ("learn" | "practice" | "revise")
  - domain (string, one of: Foundation, Core, Implementation, Revision, Assessment)
  - platform (string, realistic source like "Official Docs", "YouTube", "LeetCode", "Kaggle", "GitHub")
  - estimatedMinutes (number)
  - prerequisites (string array, can be empty)
- Order the steps from fundamentals to outcome.
- Include at least:
  - 3 learn steps
  - 3 practice steps
  - 1 revise step
  - 1 assessment/project step
- Keep each step measurable (student should know when it is done).
- estimatedMinutes should be between 45 and 180.
- prerequisites should reference earlier step titles when needed.
- Avoid generic words like "understand topic", "explore concepts", "research".
${mernHint}

Bad examples: "Learn basics", "Practice more", "Revise all".
Good examples: "Build a custom hooks library with useFetch and useDebounce".`;
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
