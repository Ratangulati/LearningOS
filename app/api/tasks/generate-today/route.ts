import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { calculatePriority } from "@/lib/tier1";
import { getAuthenticatedUserId } from "@/lib/auth-user";

type RoadmapStep = {
  id: string;
  step: string;
  type: "learn" | "practice" | "revise";
  status: string;
  order_index: number;
};

type TaskInsertRow = {
  user_id: string;
  roadmap_step_id: string;
  topic: string;
  task_type: "learn" | "practice" | "revise";
  status: "pending";
  priority_score: number;
  estimated_minutes: number;
  due_date: string;
};

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ tasks: [], message: "Unauthorized" }, { status: 401 });
    }
    const today = new Date().toISOString().slice(0, 10);
    const forceRegenerate = Boolean(body?.force);

    if (forceRegenerate) {
      await supabaseServer
        .from("learning_tasks")
        .delete()
        .eq("user_id", userId)
        .eq("due_date", today);
    }

    const { data: existing, error: existingError } = await supabaseServer
      .from("learning_tasks")
      .select("*")
      .eq("user_id", userId)
      .eq("due_date", today)
      .order("priority_score", { ascending: false });

    if (!existingError && existing && existing.length > 0) {
      return NextResponse.json({ tasks: existing });
    }

    const { data: sessions } = await supabaseServer
      .from("roadmap_sessions")
      .select("id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1);

    const sessionId = sessions?.[0]?.id;
    if (!sessionId) {
      return NextResponse.json({ tasks: [], message: "No roadmap session found." });
    }

    const { data: roadmap } = await supabaseServer
      .from("roadmap")
      .select("id,step,type,status,order_index")
      .eq("session_id", sessionId)
      .order("order_index");

    const steps = (roadmap || []) as RoadmapStep[];
    if (steps.length === 0) {
      return NextResponse.json({ tasks: [], message: "No roadmap steps found." });
    }

    const { data: masteryRows } = await supabaseServer
      .from("topic_mastery")
      .select("topic,mastery_score,next_review_date")
      .eq("user_id", userId);

    const masteryMap = new Map(
      (masteryRows || []).map((row) => [String(row.topic).toLowerCase(), row])
    );

    const yesterdayStart = new Date();
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    yesterdayStart.setHours(0, 0, 0, 0);
    const yesterdayEnd = new Date(yesterdayStart);
    yesterdayEnd.setHours(23, 59, 59, 999);

    const { data: yesterdayAttempts } = await supabaseServer
      .from("learning_attempts")
      .select("task_id,correct_count,total_count,hints_used,skipped_count,time_spent_minutes")
      .eq("user_id", userId)
      .gte("created_at", yesterdayStart.toISOString())
      .lte("created_at", yesterdayEnd.toISOString());

    const yesterdayTaskIds = (yesterdayAttempts || []).map((a) => a.task_id);
    const { data: yesterdayTasks } = await supabaseServer
      .from("learning_tasks")
      .select("id,topic,estimated_minutes")
      .in("id", yesterdayTaskIds.length > 0 ? yesterdayTaskIds : [""]);

    const yesterdayTaskMap = new Map((yesterdayTasks || []).map((t) => [t.id, t]));
    const yesterdayPerformanceByTopic = new Map<string, number>();
    for (const attempt of yesterdayAttempts || []) {
      const task = yesterdayTaskMap.get(attempt.task_id);
      if (!task?.topic) continue;
      const topicKey = String(task.topic).toLowerCase();
      const total = Number(attempt.total_count || 0);
      const accuracy = total > 0 ? Number(attempt.correct_count || 0) / total : 0;
      const hintsPenalty = Math.min(0.2, Number(attempt.hints_used || 0) * 0.04);
      const skipPenalty = Math.min(0.25, Number(attempt.skipped_count || 0) * 0.08);
      const overtime =
        Number(task.estimated_minutes || 30) > 0 &&
        Number(attempt.time_spent_minutes || 0) > Number(task.estimated_minutes || 30) * 1.3
          ? 0.05
          : 0;
      const performance = Math.max(0, Math.min(1, accuracy - hintsPenalty - skipPenalty - overtime));
      const prev = yesterdayPerformanceByTopic.get(topicKey);
      yesterdayPerformanceByTopic.set(topicKey, prev === undefined ? performance : (prev + performance) / 2);
    }

    const firstPendingIndex = steps.findIndex((step) => step.status === "not_started");
    const nextSteps = steps.slice(Math.max(0, firstPendingIndex), Math.max(0, firstPendingIndex) + 4);
    const candidates = nextSteps.length > 0 ? nextSteps : steps.slice(0, 4);

    const taskRows: TaskInsertRow[] = candidates.map((step, idx) => {
      const mastery = masteryMap.get(step.step.toLowerCase());
      const reviewDue = mastery?.next_review_date
        ? mastery.next_review_date <= today
        : false;
      const weakness = mastery ? 1 - Number(mastery.mastery_score || 0) : 0.5;
      const score = calculatePriority({
        isRoadmapNext: idx < 2,
        reviewDue,
        weaknessScore: weakness,
      });
      const yesterdayPerformance = yesterdayPerformanceByTopic.get(step.step.toLowerCase());
      const yesterdayWeakness =
        yesterdayPerformance === undefined ? 0 : Number((1 - yesterdayPerformance).toFixed(3));
      const adjustedScore = Number(
        Math.min(1, score + yesterdayWeakness * 0.2 + (reviewDue ? 0.05 : 0)).toFixed(3)
      );
      const inferredType = reviewDue ? "revise" : step.type || "learn";

      return {
        user_id: userId,
        roadmap_step_id: step.id,
        topic: step.step,
        task_type: inferredType as "learn" | "practice" | "revise",
        status: "pending",
        priority_score: adjustedScore,
        estimated_minutes: inferredType === "learn" ? 40 : 25,
        due_date: today,
      };
    });

    // If mastery is weak, inject prerequisite review task from previous roadmap step.
    const prerequisiteRows: TaskInsertRow[] = [];
    for (const step of candidates) {
      const mastery = masteryMap.get(step.step.toLowerCase());
      if (!mastery || Number(mastery.mastery_score ?? 1) >= 0.5) continue;
      const previous = steps.find((s) => s.order_index === step.order_index - 1);
      if (!previous) continue;
      prerequisiteRows.push({
        user_id: userId,
        roadmap_step_id: previous.id,
        topic: `${previous.step} (Prerequisite Review)`,
        task_type: "revise",
        status: "pending",
        priority_score: 0.98,
        estimated_minutes: 20,
        due_date: today,
      });
    }

    const uniqueRows = [...prerequisiteRows, ...taskRows]
      .filter((row, index, arr) => arr.findIndex((x) => x.topic === row.topic) === index)
      .sort((a, b) => b.priority_score - a.priority_score);

    // Guarantee a practical daily plan of at least 3 tasks when roadmap has capacity.
    if (uniqueRows.length < 3) {
      const existingStepIds = new Set(uniqueRows.map((row) => row.roadmap_step_id));
      const fallbackRows = steps
        .filter((step) => !existingStepIds.has(step.id))
        .slice(0, 3 - uniqueRows.length)
        .map((step, idx) => ({
          user_id: userId,
          roadmap_step_id: step.id,
          topic: step.step,
          task_type: (step.type || "learn") as "learn" | "practice" | "revise",
          status: "pending" as const,
          priority_score: Number((0.55 - idx * 0.02).toFixed(3)),
          estimated_minutes: step.type === "learn" ? 40 : 25,
          due_date: today,
        }));
      uniqueRows.push(...fallbackRows);
    }

    const finalRows = uniqueRows.slice(0, 5);

    const { data: inserted, error: insertError } = await supabaseServer
      .from("learning_tasks")
      .insert(finalRows)
      .select("*");

    if (insertError) {
      return NextResponse.json(
        { tasks: [], message: `Failed to persist tasks: ${insertError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ tasks: inserted || [] });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ tasks: [], message: "Could not generate tasks." }, { status: 500 });
  }
}
