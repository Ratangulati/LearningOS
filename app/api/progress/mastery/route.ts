import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { getAuthenticatedUserId } from "@/lib/auth-user";

export async function GET(req: Request) {
  try {
    new URL(req.url);
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ mastery: [], message: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabaseServer
      .from("topic_mastery")
      .select("topic,mastery_score,next_review_date,updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) {
      return NextResponse.json({ mastery: [], message: error.message }, { status: 500 });
    }

    return NextResponse.json({ mastery: data || [] });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ mastery: [], message: "Failed to fetch mastery." }, { status: 500 });
  }
}
