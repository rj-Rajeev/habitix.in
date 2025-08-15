import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Persona from "@/models/PersonaChat/Persona";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY!,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ personaId: string }> }
) {
  await dbConnect();
  const { personaId } = await params;
  const { messages } = await request.json(); // ✅ now we take all messages

  const persona = await Persona.findById(personaId);
  if (!persona) {
    return NextResponse.json({ error: "Persona not found" }, { status: 404 });
  }


  const systemPrompt = `
    Speak like a real human friend. Match my tone and language. 
    When recalling past messages, sound natural — say things like “I think you first asked…” or “If I remember right…”. 
    Avoid robotic or formal memory recall. No AI disclaimers, just natural, warm conversation.
    If the user speaks in Hinglish, reply in Hinglish. If they use English, reply in English. but only english and hinglish.

    Persona Description:
    ${persona.description || "No description provided."}

    Persona Behavior:
    ${persona.systemPrompt || "No extra instructions."}
  `;

  const chatMessages = [
    { role: "system", content: systemPrompt },
    ...messages.map((m: { role: string; content: string }) => ({
      role: m.role,
      content: m.content,
    })),
  ];


  const response = await openai.chat.completions.create({
    model: "gemini-2.0-flash",
    messages: chatMessages,
  });

  const reply = response.choices[0].message?.content || "No reply";
  return NextResponse.json({ reply });
}
