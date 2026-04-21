import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { getAuthenticatedUserId } from "@/lib/auth-user";

export async function GET(req: Request) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ roadmap: [], message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const goalId = searchParams.get("goalId");

    let sessionQuery = supabaseServer
      .from("roadmap_sessions")
      .select("id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (goalId) {
      sessionQuery = sessionQuery.eq("goal_id", goalId);
    }
    const { data: sessions } = await sessionQuery.limit(1);

    const latestSessionId = sessions?.[0]?.id;
    if (!latestSessionId) {
      return NextResponse.json({ roadmap: [] });
    }

    const { data: roadmap, error } = await supabaseServer
      .from("roadmap")
      .select("*")
      .eq("session_id", latestSessionId)
      .order("order_index");

    if (error) {
      return NextResponse.json({ roadmap: [], message: error.message }, { status: 500 });
    }

    return NextResponse.json({ roadmap: roadmap || [] });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ roadmap: [], message: "Failed to fetch roadmap." }, { status: 500 });
  }
}
