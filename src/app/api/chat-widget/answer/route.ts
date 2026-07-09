import { NextResponse } from "next/server";
import { answerChatQuestion } from "@/chatbot/answer";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const question = typeof body?.question === "string" ? body.question : "";
    const result = await answerChatQuestion(question);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Chat answer route error:", error);
    return NextResponse.json({
      answer: "Sorry, I had trouble answering that. You can still book here or speak to our team.",
      provider: "fallback",
    });
  }
}
