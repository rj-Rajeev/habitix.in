import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Persona from "@/models/PersonaChat/Persona";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.GEMINI_API_KEY!,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ personaId: string }> }
) {
  await dbConnect();
  const {personaId}= await params;
  const { message } = await request.json();

  const persona = await Persona.findById(personaId);
  if (!persona) {
    return NextResponse.json({ error: "Persona not found" }, { status: 404 });
  }

  const response = await openai.chat.completions.create({
    model: "gemini-2.0-flash",
    messages: [
      { role: "system", content: persona.systemPrompt || "" },
      { role: "user", content: message },
    ],
  });

  const reply = response.choices[0].message?.content || "No reply";

  return NextResponse.json({ reply });
}
