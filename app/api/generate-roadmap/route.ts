import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { buildRoadmapPrompt, parseRoadmap, fallbackRoadmap } from "@/lib/learning-os";
import { generateAIText } from "@/lib/ai-provider";

export async function POST(req: Request) {
  try {
    const {
      userId,
      level,
      interest,
      goal,
      semesterWeeks,
      dailyMinutes,
      provider,
      model,
      subjects,
    } = await req.json();

    const currentLevel =
      level === "intermediate" || level === "advanced" ? level : "beginner";

    const profile = {
      userId: userId || "user-1",
      goal: goal || interest || "general learning",
      interest: interest || "general",
      currentLevel,
      semesterWeeks: Number(semesterWeeks) || 16,
      dailyMinutes: Number(dailyMinutes) || 90,
      subjects: Array.isArray(subjects) ? subjects : [],
    };

    const prompt = buildRoadmapPrompt(profile);

    let roadmap = fallbackRoadmap(profile);

    try {
      const text = await generateAIText({
        provider: provider === "gemini" ? "gemini" : "openai",
        prompt,
        openAIModel: model || "gpt-4o-mini",
        geminiModel: model || "gemini-1.5-flash",
      });
      const parsed = parseRoadmap(text);
      if (parsed.length > 0) roadmap = parsed;
    } catch {
      // use fallback roadmap
    }

    // Create session
    const { data: session } = await supabase
      .from("roadmap_sessions")
      .insert([{ user_id: profile.userId, level: currentLevel }])
      .select()
      .single();

    // Insert steps
    const rows = roadmap.map((s, i) => ({
      step: s.step,
      type: s.type,
      domain: s.domain,
      platform: s.platform,
      difficulty: currentLevel,
      status: "not_started",
      order_index: i,
      session_id: session?.id,
    }));

    if (rows.length > 0) {
      await supabase.from("roadmap").insert(rows);
    }

    return NextResponse.json({ roadmap });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ roadmap: [] });
  }
}
