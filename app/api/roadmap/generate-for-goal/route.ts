import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { getAuthenticatedUserId } from "@/lib/auth-user";
import { buildRoadmapPrompt, fallbackRoadmap, parseRoadmap, StudentProfileInput } from "@/lib/learning-os";
import { AIProvider, generateAIText } from "@/lib/ai-provider";

export async function POST(req: Request) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ roadmap: [], message: "Unauthorized" }, { status: 401 });
    }

    const {
      goalId,
      level = "beginner",
      interest = "General",
      semesterWeeks = 16,
      dailyMinutes = 90,
      provider = "openai",
      model,
    } = await req.json();

    if (!goalId) {
      return NextResponse.json({ roadmap: [], message: "goalId is required." }, { status: 400 });
    }

    const { data: goal, error: goalError } = await supabaseServer
      .from("goals")
      .select("id,goal_text,user_id")
      .eq("id", goalId)
      .single();
    if (goalError || !goal || goal.user_id !== userId) {
      return NextResponse.json({ roadmap: [], message: "Goal not found." }, { status: 404 });
    }

    const profile: StudentProfileInput = {
      userId,
      goal: goal.goal_text,
      interest,
      currentLevel: level,
      semesterWeeks: Number(semesterWeeks),
      dailyMinutes: Number(dailyMinutes),
    };
    const prompt = buildRoadmapPrompt(profile);

    let roadmap = fallbackRoadmap(profile);
    try {
      const text = await generateAIText({
        provider: provider as AIProvider,
        prompt,
        openAIModel: model,
        geminiModel: model,
      });
      const parsed = parseRoadmap(text);
      if (parsed.length > 0) roadmap = parsed;
    } catch {
      // fallback
    }

    const { data: session, error: sessionError } = await supabaseServer
      .from("roadmap_sessions")
      .insert([{ user_id: userId, level, goal_id: goalId }])
      .select()
      .single();
    if (sessionError || !session) {
      return NextResponse.json({ roadmap: [], message: "Failed to create roadmap session." }, { status: 500 });
    }

    const rows = roadmap.map((s, index) => ({
      step: s.step,
      type: s.type,
      domain: s.domain,
      platform: s.platform,
      difficulty: level,
      status: "not_started",
      order_index: index,
      session_id: session.id,
    }));

    if (rows.length > 0) {
      await supabaseServer.from("roadmap").insert(rows);
    }

    return NextResponse.json({ roadmap, goalId, provider });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ roadmap: [], message: "Failed to generate roadmap." }, { status: 500 });
  }
}
