import { NextRequest } from "next/server";
import { handleRouteError, jsonOk, Errors } from "@/lib/api";
import { requireUserId } from "@/lib/auth/session";
import { connectDb } from "@/lib/db";
import { generateRoadmapSchema } from "@/modules/tasks/task.schemas";
import { aiService } from "@/services/ai/ai.service";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    await requireUserId();
    const body = await req.json();
    const parsed = generateRoadmapSchema.safeParse(body);
    if (!parsed.success) {
      throw Errors.badRequest("Invalid input", parsed.error.flatten());
    }

    const roadmap = await aiService.generateRoadmap(parsed.data);
    return jsonOk({ roadmap });
  } catch (err) {
    return handleRouteError(err);
  }
}
