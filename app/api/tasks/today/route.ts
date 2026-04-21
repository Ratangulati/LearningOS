import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { getAuthenticatedUserId } from "@/lib/auth-user";

export async function GET(req: Request) {
  try {
    new URL(req.url);
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ tasks: [], message: "Unauthorized" }, { status: 401 });
    }
    const today = new Date().toISOString().slice(0, 10);

    const { data, error } = await supabaseServer
      .from("learning_tasks")
      .select("*")
      .eq("user_id", userId)
      .eq("due_date", today)
      .order("priority_score", { ascending: false });

    if (error) {
      return NextResponse.json({ tasks: [], message: error.message }, { status: 500 });
    }

    return NextResponse.json({ tasks: data || [] });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ tasks: [], message: "Failed to fetch tasks." }, { status: 500 });
  }
}
