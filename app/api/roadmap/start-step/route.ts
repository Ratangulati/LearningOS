import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { getAuthenticatedUserId } from "@/lib/auth-user";

export async function POST(req: Request) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { stepId } = await req.json();
    if (!stepId) {
      return NextResponse.json({ message: "stepId is required." }, { status: 400 });
    }

    const { data: step, error: stepError } = await supabaseServer
      .from("roadmap")
      .select("id,step,type,session_id,difficulty")
      .eq("id", stepId)
      .single();

    if (stepError || !step) {
      return NextResponse.json({ message: "Roadmap step not found." }, { status: 404 });
    }

    const { data: session } = await supabaseServer
      .from("roadmap_sessions")
      .select("id,user_id")
      .eq("id", step.session_id)
      .single();

    if (!session || session.user_id !== userId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const today = new Date().toISOString().slice(0, 10);
    const { data: existing } = await supabaseServer
      .from("learning_tasks")
      .select("id")
      .eq("user_id", userId)
      .eq("roadmap_step_id", stepId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json({ taskId: existing[0].id });
    }

    const taskType = step.type === "practice" || step.type === "revise" ? step.type : "learn";
    const { data: inserted, error: insertError } = await supabaseServer
      .from("learning_tasks")
      .insert([
        {
          user_id: userId,
          roadmap_step_id: stepId,
          topic: step.step,
          task_type: taskType,
          status: "pending",
          priority_score: 0.8,
          estimated_minutes: taskType === "learn" ? 40 : 30,
          due_date: today,
        },
      ])
      .select("id")
      .single();

    if (insertError || !inserted) {
      return NextResponse.json({ message: insertError?.message || "Failed to create learning task." }, { status: 500 });
    }

    return NextResponse.json({ taskId: inserted.id });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Failed to start roadmap step." }, { status: 500 });
  }
}
