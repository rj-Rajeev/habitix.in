import { NextRequest, NextResponse } from "next/server";
import { getOptionalUserId } from "@/lib/auth/session";
import { connectDb } from "@/lib/db";
import { generateRoadmapSchema } from "@/modules/tasks/task.schemas";
import { aiService } from "@/services/ai/ai.service";

export async function POST(req: NextRequest) {
  const userId = await getOptionalUserId();
  if (!userId) {
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

    const roadmap = parsed.data.courseId
      ? await aiService.generateCourseRoadmap(parsed.data, userId, parsed.data.courseId)
      : await aiService.generateRoadmap(parsed.data);
    return NextResponse.json({ roadmap });
  } catch (err) {
    console.error("Gemini Error:", err);
    return NextResponse.json(
      { error: "Failed to generate roadmap" },
      { status: 500 }
    );
  }
}
