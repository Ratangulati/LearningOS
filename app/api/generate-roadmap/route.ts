import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import {
  buildRoadmapPrompt,
  fallbackRoadmap,
  parseRoadmap,
  StudentProfileInput,
} from "@/lib/learning-os";
import { AIProvider, generateAIText } from "@/lib/ai-provider";
import { getAuthenticatedUserId } from "@/lib/auth-user";

export async function POST(req: Request) {
  try {
    const {
      level,
      interest,
      goal,
      semesterWeeks,
      dailyMinutes,
      provider = "openai",
      model,
    } = await req.json();
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ roadmap: [], message: "Unauthorized" }, { status: 401 });
    }

    const profile: StudentProfileInput = {
      userId,
      goal: goal || "Semester learning plan",
      interest: interest || "General",
      currentLevel: level || "beginner",
      semesterWeeks: Number(semesterWeeks) || 16,
      dailyMinutes: Number(dailyMinutes) || 90,
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
      const parsedRoadmap = parseRoadmap(text);
      if (parsedRoadmap.length > 0) {
        roadmap = parsedRoadmap;
      }
    } catch {
      // Keep fallback roadmap
    }

    // 🧾 2. CREATE SESSION
    const { data: session } = await supabase
      .from("roadmap_sessions")
      .insert([
        {
          user_id: profile.userId,
          level: profile.currentLevel,
        },
      ])
      .select()
      .single();

    // 🧱 3. INSERT STEPS
    const rows = roadmap.map((s, i: number) => ({
      step: s.step,
      type: s.type,
      domain: s.domain,
      platform: s.platform,
      difficulty: profile.currentLevel,
      status: "not_started",
      order_index: i,
      session_id: session.id,
    }));

    if (rows.length > 0) {
      await supabase.from("roadmap").insert(rows);
    }

    // ✅ 4. RETURN ROADMAP
    return NextResponse.json({ roadmap, provider });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ roadmap: [] });
  }
}