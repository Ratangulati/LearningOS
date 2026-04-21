import { NextResponse } from "next/server";
import { generateAIText } from "@/lib/ai-provider";
import { getAuthenticatedUserId } from "@/lib/auth-user";
import { supabaseServer } from "@/lib/supabaseServer";
import { buildRoadmapPrompt, fallbackRoadmap, parseRoadmap, StudentProfileInput } from "@/lib/learning-os";

type AssistantDecision = {
  reply: string;
  action: "none" | "create_goal" | "generate_roadmap" | "generate_today_tasks" | "show_progress";
  params?: {
    goalText?: string;
  };
};

export async function POST(req: Request) {
  try {
    const { input, provider = "openai", model } = await req.json();
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ explanation: "Please sign in first to use Saarthi assistant." }, { status: 401 });
    }

    const userMessage = String(input || "").trim();
    if (!userMessage) {
      return NextResponse.json({ explanation: "Tell me what you want to do." });
    }

    const plannerPrompt = `You are Saarthi AI action planner.
User message: "${userMessage}"

Return ONLY valid JSON:
{
  "reply": "short helpful response",
  "action": "none | create_goal | generate_roadmap | generate_today_tasks | show_progress",
  "params": {
    "goalText": "only when relevant"
  }
}

Rules:
- Pick create_goal when user asks to add a new goal.
- Pick generate_roadmap when user asks to create plan/roadmap for a specific goal.
- Pick generate_today_tasks when user asks for today tasks.
- Pick show_progress when user asks progress/mastery.
- If unclear, action=none.
- Keep reply concise.`;

    let decision: AssistantDecision = {
      reply: "I can help create goals, roadmaps, tasks, and progress updates.",
      action: "none",
    };

    try {
      const decisionText = await generateAIText({
        provider,
        prompt: plannerPrompt,
        openAIModel: model,
        geminiModel: model,
      });
      const parsed = JSON.parse(decisionText) as AssistantDecision;
      if (parsed?.reply && parsed?.action) {
        decision = parsed;
      }
    } catch {
      // keep fallback decision
    }

    const result = await executeAction(userId, decision, provider, model);
    const explanation = result.message ? `${decision.reply}\n\n${result.message}` : decision.reply;

    return NextResponse.json({
      intent: "assistant",
      topic: userMessage,
      explanation,
      action: decision.action,
      actionResult: result.data,
      videos: [],
      steps: [],
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({
      intent: "general",
      topic: "",
      explanation: "Something went wrong",
      videos: [],
      steps: [],
    });
  }
}

async function executeAction(
  userId: string,
  decision: AssistantDecision,
  provider: string,
  model?: string
): Promise<{ message: string; data?: unknown }> {
  switch (decision.action) {
    case "create_goal": {
      const goalText = (decision.params?.goalText || "").trim();
      if (!goalText) {
        return { message: "I need a clear goal text to create it." };
      }
      const { data, error } = await supabaseServer
        .from("goals")
        .insert([{ user_id: userId, goal_text: goalText }])
        .select()
        .single();
      if (error || !data) {
        return { message: `Could not create goal: ${error?.message || "unknown error"}` };
      }
      return { message: `Goal created: "${data.goal_text}"`, data };
    }
    case "generate_roadmap": {
      const goalText = (decision.params?.goalText || "").trim();
      if (!goalText) {
        return { message: "Please specify which goal I should build a roadmap for." };
      }
      const { data: goalRow, error: goalError } = await supabaseServer
        .from("goals")
        .insert([{ user_id: userId, goal_text: goalText }])
        .select()
        .single();
      if (goalError || !goalRow) {
        return { message: `Could not create goal for roadmap: ${goalError?.message || "unknown error"}` };
      }

      const { data: profile } = await supabaseServer
        .from("profiles")
        .select("level,interest,time_commitment")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const dailyMinutes = parseDailyMinutes(profile?.time_commitment || "");
      const student: StudentProfileInput = {
        userId,
        goal: goalText,
        interest: profile?.interest || "General",
        currentLevel: (profile?.level as "beginner" | "intermediate" | "advanced") || "beginner",
        semesterWeeks: 16,
        dailyMinutes,
      };

      const prompt = buildRoadmapPrompt(student);
      let roadmap = fallbackRoadmap(student);
      try {
        const text = await generateAIText({
          provider: provider === "gemini" ? "gemini" : "openai",
          prompt,
          openAIModel: model,
          geminiModel: model,
        });
        const parsed = parseRoadmap(text);
        if (parsed.length > 0) roadmap = parsed;
      } catch {
        // fallback stays
      }

      const { data: session, error: sessionError } = await supabaseServer
        .from("roadmap_sessions")
        .insert([{ user_id: userId, level: student.currentLevel, goal_id: goalRow.id }])
        .select()
        .single();
      if (sessionError || !session) {
        return { message: `Could not create roadmap session: ${sessionError?.message || "unknown error"}` };
      }

      const rows = roadmap.map((step, index) => ({
        step: step.step,
        type: step.type,
        domain: step.domain,
        platform: step.platform,
        difficulty: student.currentLevel,
        status: "not_started",
        order_index: index,
        session_id: session.id,
      }));
      await supabaseServer.from("roadmap").insert(rows);
      return { message: `Roadmap generated for "${goalText}" with ${rows.length} steps.`, data: { goalId: goalRow.id } };
    }
    case "generate_today_tasks": {
      const today = new Date().toISOString().slice(0, 10);
      const { data: sessions } = await supabaseServer
        .from("roadmap_sessions")
        .select("id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1);
      const sessionId = sessions?.[0]?.id;
      if (!sessionId) return { message: "No roadmap found yet. Ask me to generate a roadmap first." };
      const { data: steps } = await supabaseServer
        .from("roadmap")
        .select("id,step,type")
        .eq("session_id", sessionId)
        .order("order_index")
        .limit(5);
      if (!steps || steps.length === 0) return { message: "Roadmap has no steps yet." };
      const rows = steps.map((s, i) => ({
        user_id: userId,
        roadmap_step_id: s.id,
        topic: s.step,
        task_type: s.type === "practice" || s.type === "revise" ? s.type : "learn",
        status: "pending",
        priority_score: Number((0.9 - i * 0.1).toFixed(2)),
        estimated_minutes: 35,
        due_date: today,
      }));
      await supabaseServer.from("learning_tasks").insert(rows);
      return { message: `Generated ${rows.length} tasks for today.`, data: { count: rows.length } };
    }
    case "show_progress": {
      const { data } = await supabaseServer
        .from("topic_mastery")
        .select("topic,mastery_score")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(5);
      if (!data || data.length === 0) {
        return { message: "No progress data yet. Complete a learning task first." };
      }
      const summary = data.map((item) => `${item.topic}: ${item.mastery_score}`).join(" | ");
      return { message: `Recent mastery -> ${summary}`, data };
    }
    default:
      return { message: "" };
  }
}

function parseDailyMinutes(timeCommitment: string): number {
  const match = timeCommitment.match(/\d+/);
  if (!match) return 90;
  const first = Number(match[0]);
  if (!Number.isFinite(first)) return 90;
  if (timeCommitment.includes("hour")) {
    return first * 60;
  }
  return first;
}