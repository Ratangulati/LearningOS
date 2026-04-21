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
      .select("id,session_id")
      .eq("id", stepId)
      .single();
    if (stepError || !step) {
      return NextResponse.json({ message: "Step not found." }, { status: 404 });
    }

    const { data: session } = await supabaseServer
      .from("roadmap_sessions")
      .select("id,user_id")
      .eq("id", step.session_id)
      .single();
    if (!session || session.user_id !== userId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabaseServer.from("roadmap").update({ status: "completed" }).eq("id", stepId);
    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Failed to update roadmap step." }, { status: 500 });
  }
}
