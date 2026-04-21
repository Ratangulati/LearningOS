import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { nextRevisionDate, updateMasteryScore } from "@/lib/tier1";
import { getAuthenticatedUserId } from "@/lib/auth-user";

export async function POST(req: Request) {
  try {
    const {
      taskId,
      correctCount,
      totalCount,
      answeredCount,
      hintsUsed,
      skippedCount,
      confidence,
      timeSpentMinutes,
      notesMarkdown,
      notesSummary,
      reflectionCanExplain,
      reflectionBlocker,
    } = await req.json();
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { data: task, error: taskError } = await supabaseServer
      .from("learning_tasks")
      .select("*")
      .eq("id", taskId)
      .eq("user_id", userId)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ message: "Task not found." }, { status: 404 });
    }

    const total = Number(totalCount || 0);
    const answered = Number(answeredCount || 0);
    if (total <= 0) {
      return NextResponse.json(
        { message: "Quiz is missing for this task. Please reload and try again." },
        { status: 400 }
      );
    }
    if (answered < total) {
      return NextResponse.json(
        { message: "Please answer all quiz questions before completing the task." },
        { status: 400 }
      );
    }

    const { data: masteryRow } = await supabaseServer
      .from("topic_mastery")
      .select("id,mastery_score,next_review_date")
      .eq("user_id", userId)
      .eq("topic", task.topic)
      .maybeSingle();

    const currentMastery = Number(masteryRow?.mastery_score || 0.35);
    const updatedMastery = updateMasteryScore({
      current: currentMastery,
      correct: Number(correctCount || 0),
      total,
      hintsUsed: Number(hintsUsed || 0),
      skippedCount: Number(skippedCount || 0),
      timeSpentMinutes: Number(timeSpentMinutes || 0),
      estimatedMinutes: Number(task.estimated_minutes || 30),
    });

    const reviewDate = nextRevisionDate(
      masteryRow ? { mastery_score: currentMastery, next_review_date: masteryRow.next_review_date } : null,
      updatedMastery
    );
    const behaviorImpact = {
      hintsUsed: Number(hintsUsed || 0),
      skippedCount: Number(skippedCount || 0),
      timeSpentMinutes: Number(timeSpentMinutes || 0),
      estimatedMinutes: Number(task.estimated_minutes || 30),
      confidence: Number(confidence || 3),
    };

    await supabaseServer.from("learning_attempts").insert([
      {
        task_id: taskId,
        user_id: userId,
        started_at: new Date(Date.now() - Number(timeSpentMinutes || 0) * 60000).toISOString(),
        ended_at: new Date().toISOString(),
        correct_count: Number(correctCount || 0),
        total_count: total,
        hints_used: Number(hintsUsed || 0),
        skipped_count: Number(skippedCount || 0),
        confidence: Number(confidence || 3),
        time_spent_minutes: Number(timeSpentMinutes || 0),
        mastery_before: currentMastery,
        mastery_after: updatedMastery,
      },
    ]);

    await supabaseServer
      .from("topic_mastery")
      .upsert(
        [
          {
            user_id: userId,
            topic: task.topic,
            mastery_score: updatedMastery,
            last_reviewed_at: new Date().toISOString(),
            next_review_date: reviewDate,
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: "user_id,topic" }
      );

    await supabaseServer.from("lesson_notes").insert([
      {
        user_id: userId,
        task_id: taskId,
        topic: task.topic,
        markdown_content: notesMarkdown,
        summary: notesSummary,
      },
    ]);

    // Best-effort reflection + adaptation events.
    await Promise.allSettled([
      supabaseServer.from("learning_reflections").insert([
        {
          user_id: userId,
          task_id: taskId,
          topic: task.topic,
          confidence: Number(confidence || 3),
          can_explain: Boolean(reflectionCanExplain),
          blocker_text: reflectionBlocker || null,
        },
      ]),
      supabaseServer.from("learning_events").insert([
        {
          user_id: userId,
          event_type: "task_completed",
          topic: task.topic,
          task_id: taskId,
          metadata: {
            correctCount: Number(correctCount || 0),
            totalCount: total,
            answeredCount: answered,
            ...behaviorImpact,
          },
        },
        {
          user_id: userId,
          event_type: "behavior_profile_updated",
          topic: task.topic,
          task_id: taskId,
          metadata: {
            masteryBefore: currentMastery,
            masteryAfter: updatedMastery,
            nextReviewDate: reviewDate,
            ...behaviorImpact,
          },
        },
      ]),
    ]);

    await supabaseServer.from("learning_tasks").update({ status: "completed" }).eq("id", taskId);
    if (task.roadmap_step_id) {
      await supabaseServer.from("roadmap").update({ status: "completed" }).eq("id", task.roadmap_step_id);
    }

    return NextResponse.json({
      masteryBefore: currentMastery,
      masteryAfter: updatedMastery,
      nextReviewDate: reviewDate,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Failed to evaluate attempt." }, { status: 500 });
  }
}
