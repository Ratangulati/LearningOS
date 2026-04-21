import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { getAuthenticatedUserId } from "@/lib/auth-user";

export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ goals: [], message: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabaseServer
      .from("goals")
      .select("id,goal_text,deadline,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ goals: [], message: error.message }, { status: 500 });
    }

    return NextResponse.json({ goals: data || [] });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ goals: [], message: "Failed to fetch goals." }, { status: 500 });
  }
}
