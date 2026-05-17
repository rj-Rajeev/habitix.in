import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDb } from "@/lib/db";
import { generateRoadmapSchema } from "@/modules/tasks/task.schemas";
import { aiService } from "@/services/ai/ai.service";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDb();
    const body = await req.json();
    const parsed = generateRoadmapSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const roadmap = await aiService.generateRoadmap(parsed.data);
    return NextResponse.json({ roadmap });
  } catch (err) {
    console.error("Gemini Error:", err);
    return NextResponse.json(
      { error: "Failed to generate roadmap" },
      { status: 500 }
    );
  }
}
