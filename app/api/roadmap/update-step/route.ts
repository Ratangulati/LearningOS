import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { getAuthenticatedUserId } from "@/lib/auth-user";

export async function POST(req: Request) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { stepId, step, type, domain, platform } = await req.json();
    if (!stepId) {
      return NextResponse.json({ message: "stepId is required." }, { status: 400 });
    }

    const { data: row, error: rowError } = await supabaseServer
      .from("roadmap")
      .select("id,session_id")
      .eq("id", stepId)
      .single();
    if (rowError || !row) {
      return NextResponse.json({ message: "Roadmap step not found." }, { status: 404 });
    }

    const { data: session } = await supabaseServer
      .from("roadmap_sessions")
      .select("id,user_id")
      .eq("id", row.session_id)
      .single();
    if (!session || session.user_id !== userId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const payload: Record<string, string> = {};
    if (typeof step === "string" && step.trim()) payload.step = step.trim();
    if (typeof type === "string" && type.trim()) payload.type = type.trim();
    if (typeof domain === "string" && domain.trim()) payload.domain = domain.trim();
    if (typeof platform === "string" && platform.trim()) payload.platform = platform.trim();

    const { data, error } = await supabaseServer
      .from("roadmap")
      .update(payload)
      .eq("id", stepId)
      .select("*")
      .single();
    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
    return NextResponse.json({ step: data });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Failed to update step." }, { status: 500 });
  }
}
