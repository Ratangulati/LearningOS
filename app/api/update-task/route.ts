import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { getAuthenticatedUserId } from "@/lib/auth-user";

export async function POST(req: Request) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId, status } = await req.json();
    if (!taskId || !status) {
      return NextResponse.json({ error: "taskId and status are required." }, { status: 400 });
    }

    const { data: task, error: taskError } = await supabaseServer
      .from("tasks")
      .select("id,goal_id")
      .eq("id", taskId)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    const { data: goal, error: goalError } = await supabaseServer
      .from("goals")
      .select("id,user_id")
      .eq("id", task.goal_id)
      .single();

    if (goalError || !goal || goal.user_id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabaseServer.from("tasks").update({ status }).eq("id", taskId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update task." }, { status: 500 });
  }
}
