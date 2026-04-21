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
      .select("*, tasks(*)")
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

export async function POST(req: Request) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { goalText, deadline } = await req.json();
    if (!goalText || String(goalText).trim().length === 0) {
      return NextResponse.json({ message: "Goal text is required." }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from("goals")
      .insert([
        {
          user_id: userId,
          goal_text: goalText.trim(),
          deadline: deadline || null,
        },
      ])
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ message: error?.message || "Failed to create goal." }, { status: 500 });
    }

    return NextResponse.json({ goal: data });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Failed to create goal." }, { status: 500 });
  }
}
