import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { getAuthenticatedUserId } from "@/lib/auth-user";

export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ groups: [], message: "Unauthorized" }, { status: 401 });
    }

    const { data: goals, error: goalError } = await supabaseServer
      .from("goals")
      .select("id,goal_text,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (goalError) {
      return NextResponse.json({ groups: [], message: goalError.message }, { status: 500 });
    }

    const groups = [];
    for (const goal of goals || []) {
      const { data: sessions } = await supabaseServer
        .from("roadmap_sessions")
        .select("id,created_at")
        .eq("user_id", userId)
        .eq("goal_id", goal.id)
        .order("created_at", { ascending: false })
        .limit(1);

      const latestSessionId = sessions?.[0]?.id;
      let roadmap: unknown[] = [];
      if (latestSessionId) {
        const { data: steps } = await supabaseServer
          .from("roadmap")
          .select("*")
          .eq("session_id", latestSessionId)
          .order("order_index");
        roadmap = steps || [];
      }

      groups.push({
        goal,
        sessionId: latestSessionId || null,
        roadmap,
      });
    }

    return NextResponse.json({ groups });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ groups: [], message: "Failed to fetch all roadmaps." }, { status: 500 });
  }
}
