import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { getAuthenticatedUserId } from "@/lib/auth-user";

export async function GET(req: Request) {
  try {
    new URL(req.url);
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ rows: [], message: "Unauthorized" }, { status: 401 });
    }

    const { data: attempts, error } = await supabaseServer
      .from("learning_attempts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ rows: [], message: error.message }, { status: 500 });
    }

    const taskIds = (attempts || []).map((a) => a.task_id);
    const { data: tasks } = await supabaseServer
      .from("learning_tasks")
      .select("id,topic,task_type")
      .in("id", taskIds.length > 0 ? taskIds : [""]);

    const taskMap = new Map((tasks || []).map((task) => [task.id, task]));

    const rows = (attempts || []).map((attempt) => {
      const task = taskMap.get(attempt.task_id);
      return {
        id: attempt.id,
        date: attempt.created_at,
        topic: task?.topic || "Unknown",
        taskType: task?.task_type || "learn",
        timeSpent: attempt.time_spent_minutes,
        correct: attempt.correct_count,
        total: attempt.total_count,
        hintsUsed: attempt.hints_used,
        skipped: attempt.skipped_count,
        masteryBefore: attempt.mastery_before,
        masteryAfter: attempt.mastery_after,
        masteryGained: Number(
          (Number(attempt.mastery_after || 0) - Number(attempt.mastery_before || 0)).toFixed(3)
        ),
      };
    });

    return NextResponse.json({ rows });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ rows: [], message: "Failed to fetch progress table." }, { status: 500 });
  }
}
