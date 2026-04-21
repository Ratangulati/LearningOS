import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { getAuthenticatedUserId } from "@/lib/auth-user";

type IncomingTask = { task: string; status?: string };

export async function POST(req: Request) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { goalId, tasks } = await req.json();
    const incomingTasks = (tasks || []) as IncomingTask[];
    if (!goalId || !Array.isArray(incomingTasks)) {
      return NextResponse.json({ message: "goalId and tasks are required." }, { status: 400 });
    }

    const { data: goal, error: goalError } = await supabaseServer
      .from("goals")
      .select("id,user_id")
      .eq("id", goalId)
      .single();

    if (goalError || !goal || goal.user_id !== userId) {
      return NextResponse.json({ message: "Goal not found for this user." }, { status: 404 });
    }

    const rows = incomingTasks
      .map((task, index) => ({
        goal_id: goalId,
        task_text: String(task.task || "").trim(),
        status: task.status || "not_started",
        type: "learning",
        difficulty: "medium",
        order_index: index,
      }))
      .filter((row) => row.task_text.length > 0);

    if (rows.length === 0) {
      return NextResponse.json({ tasks: [] });
    }

    const { data, error } = await supabaseServer.from("tasks").insert(rows).select("*");
    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
    return NextResponse.json({ tasks: data || [] });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Failed to create goal tasks." }, { status: 500 });
  }
}
