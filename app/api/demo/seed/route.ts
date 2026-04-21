import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { getAuthenticatedUserId } from "@/lib/auth-user";

export async function POST() {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    }
    const today = new Date();
    const todayDate = today.toISOString().slice(0, 10);

    const { data: existingSessions } = await supabaseServer
      .from("roadmap_sessions")
      .select("id")
      .eq("user_id", userId);
    const existingSessionIds = (existingSessions || []).map((session) => session.id);

    await supabaseServer.from("lesson_notes").delete().eq("user_id", userId);
    await supabaseServer.from("learning_attempts").delete().eq("user_id", userId);
    await supabaseServer.from("topic_mastery").delete().eq("user_id", userId);
    await supabaseServer.from("learning_tasks").delete().eq("user_id", userId);
    if (existingSessionIds.length > 0) {
      await supabaseServer.from("roadmap").delete().in("session_id", existingSessionIds);
    }
    await supabaseServer.from("roadmap_sessions").delete().eq("user_id", userId);

    await supabaseServer.from("profiles").insert([
      {
        purpose: "university_learning_os",
        level: "intermediate",
        projects: "2",
        hackathons: "1",
        interest: "CSE",
        goal: "Master React Hooks and deliver one mini project this semester",
        time_commitment: "90 mins/day",
      },
    ]);

    const { data: session, error: sessionError } = await supabaseServer
      .from("roadmap_sessions")
      .insert([{ user_id: userId, level: "intermediate" }])
      .select()
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ message: "Could not create demo session." }, { status: 500 });
    }

    const roadmapRows = [
      { step: "React state and rendering fundamentals", type: "learn", domain: "Frontend", platform: "React Docs", difficulty: "intermediate", status: "completed", order_index: 0, session_id: session.id },
      { step: "useEffect patterns and side-effects", type: "learn", domain: "Frontend", platform: "YouTube", difficulty: "intermediate", status: "completed", order_index: 1, session_id: session.id },
      { step: "Custom hooks and reusable logic", type: "practice", domain: "Frontend", platform: "React Docs", difficulty: "intermediate", status: "not_started", order_index: 2, session_id: session.id },
      { step: "Performance with memoization hooks", type: "practice", domain: "Frontend", platform: "Article", difficulty: "intermediate", status: "not_started", order_index: 3, session_id: session.id },
      { step: "Hooks revision sprint", type: "revise", domain: "Frontend", platform: "Self Notes", difficulty: "intermediate", status: "not_started", order_index: 4, session_id: session.id },
      { step: "Mini project implementation", type: "practice", domain: "Frontend", platform: "GitHub", difficulty: "intermediate", status: "not_started", order_index: 5, session_id: session.id },
    ];

    const { data: roadmap, error: roadmapError } = await supabaseServer
      .from("roadmap")
      .insert(roadmapRows)
      .select("*");

    if (roadmapError || !roadmap) {
      return NextResponse.json({ message: "Could not create demo roadmap." }, { status: 500 });
    }

    const taskRows = [
      { user_id: userId, roadmap_step_id: roadmap[2].id, topic: roadmap[2].step, task_type: "practice", status: "pending", priority_score: 0.89, estimated_minutes: 40, due_date: todayDate },
      { user_id: userId, roadmap_step_id: roadmap[3].id, topic: roadmap[3].step, task_type: "practice", status: "pending", priority_score: 0.78, estimated_minutes: 35, due_date: todayDate },
      { user_id: userId, roadmap_step_id: roadmap[4].id, topic: roadmap[4].step, task_type: "revise", status: "pending", priority_score: 0.73, estimated_minutes: 25, due_date: todayDate },
      { user_id: userId, roadmap_step_id: roadmap[5].id, topic: roadmap[5].step, task_type: "learn", status: "pending", priority_score: 0.69, estimated_minutes: 45, due_date: todayDate },
    ];

    const { data: tasks, error: tasksError } = await supabaseServer
      .from("learning_tasks")
      .insert(taskRows)
      .select("*");

    if (tasksError || !tasks) {
      return NextResponse.json({ message: "Could not create demo tasks." }, { status: 500 });
    }

    await supabaseServer.from("topic_mastery").insert([
      { user_id: userId, topic: roadmap[0].step, mastery_score: 0.84, next_review_date: todayDate, updated_at: new Date().toISOString() },
      { user_id: userId, topic: roadmap[1].step, mastery_score: 0.76, next_review_date: todayDate, updated_at: new Date().toISOString() },
      { user_id: userId, topic: roadmap[2].step, mastery_score: 0.58, next_review_date: todayDate, updated_at: new Date().toISOString() },
      { user_id: userId, topic: roadmap[3].step, mastery_score: 0.44, next_review_date: todayDate, updated_at: new Date().toISOString() },
    ]);

    const completedAt = new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString();
    await supabaseServer.from("learning_attempts").insert([
      {
        task_id: tasks[0].id,
        user_id: userId,
        started_at: completedAt,
        ended_at: completedAt,
        correct_count: 2,
        total_count: 3,
        hints_used: 1,
        skipped_count: 0,
        confidence: 3,
        time_spent_minutes: 38,
        mastery_before: 0.52,
        mastery_after: 0.58,
      },
      {
        task_id: tasks[1].id,
        user_id: userId,
        started_at: completedAt,
        ended_at: completedAt,
        correct_count: 1,
        total_count: 3,
        hints_used: 2,
        skipped_count: 1,
        confidence: 2,
        time_spent_minutes: 42,
        mastery_before: 0.38,
        mastery_after: 0.44,
      },
    ]);

    await supabaseServer.from("lesson_notes").insert([
      {
        user_id: userId,
        task_id: tasks[0].id,
        topic: tasks[0].topic,
        markdown_content: "# Custom hooks\n\n- Extract repeated logic\n- Keep side effects isolated\n- Return stable interfaces",
        summary: "Custom hooks make components cleaner and reusable.",
      },
    ]);

    return NextResponse.json({
      ok: true,
      message: "Demo data created successfully.",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, message: "Failed to create demo data." }, { status: 500 });
  }
}
