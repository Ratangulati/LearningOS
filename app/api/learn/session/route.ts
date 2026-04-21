import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { AIProvider, generateAIText } from "@/lib/ai-provider";
import { getAuthenticatedUserId } from "@/lib/auth-user";

type QuizItem = {
  question: string;
  options: string[];
  answerIndex: number;
};

export async function POST(req: Request) {
  try {
    const { taskId, provider = "openai", model } = await req.json();
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

    await supabaseServer
      .from("learning_tasks")
      .update({ status: "in_progress" })
      .eq("id", taskId);

    const prompt = `You are a concise tutor.
Topic: ${task.topic}
Task type: ${task.task_type}

Return strict JSON object:
{
  "markdownLesson": "...",
  "summary": "...",
  "quiz": [
    {"question":"...", "options":["A","B","C","D"], "answerIndex":0}
  ]
}

Rules:
- Beginner-friendly.
- 180-250 words lesson.
- Exactly 3 quiz questions.
- answerIndex between 0 and 3.
- No markdown code fences in response.`;

    let markdownLesson = `## ${task.topic}\n\nThis lesson introduces the key idea in a practical way and prepares you for short retrieval practice.`;
    let summary = `Quick overview of ${task.topic}`;
    let quiz: QuizItem[] = [
      {
        question: `Which statement best describes ${task.topic}?`,
        options: ["Core concept", "Random fact", "UI style", "Database key"],
        answerIndex: 0,
      },
      {
        question: "What helps improve mastery fastest?",
        options: ["Passive reading", "Spaced practice", "Skipping quizzes", "No review"],
        answerIndex: 1,
      },
      {
        question: "What should you do after one study session?",
        options: ["Stop forever", "Review weak points", "Delete notes", "Ignore feedback"],
        answerIndex: 1,
      },
    ];

    try {
      const text = await generateAIText({
        provider: provider as AIProvider,
        prompt,
        openAIModel: model,
        geminiModel: model,
      });
      if (text) {
        const parsed = JSON.parse(text);
        if (parsed?.markdownLesson && parsed?.summary && Array.isArray(parsed?.quiz)) {
          markdownLesson = parsed.markdownLesson;
          summary = parsed.summary;
          quiz = parsed.quiz.slice(0, 3);
        }
      }
    } catch {
      // fallback already set
    }

    return NextResponse.json({
      task,
      lesson: {
        markdownLesson,
        summary,
        quiz,
      },
      provider,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Failed to create learning session." }, { status: 500 });
  }
}
