import OpenAI from "openai";

export type AIProvider = "openai" | "gemini";

type GenerateTextInput = {
  provider: AIProvider;
  prompt: string;
  openAIModel?: string;
  geminiModel?: string;
};

export async function generateAIText(input: GenerateTextInput): Promise<string> {
  if (input.provider === "gemini") {
    return generateWithGemini(input.prompt, input.geminiModel);
  }
  return generateWithOpenAI(input.prompt, input.openAIModel);
}

function sanitizeResponse(text: string): string {
  return text.replace(/```json/g, "").replace(/```/g, "").trim();
}

async function generateWithOpenAI(prompt: string, model = "gpt-4o-mini"): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    return "";
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const response = await client.responses.create({
    model,
    input: prompt,
  });

  return sanitizeResponse(response.output_text || "");
}

async function generateWithGemini(prompt: string, model = "gemini-1.5-flash"): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    return "";
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
    }),
  });

  if (!res.ok) {
    return "";
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return sanitizeResponse(String(text));
}
