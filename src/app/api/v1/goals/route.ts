import { NextRequest } from "next/server";
import { handleRouteError, jsonOk, Errors } from "@/lib/api";
import { requireUserId } from "@/lib/auth/session";
import { connectDb } from "@/lib/db";
import { createGoalSchema } from "@/modules/tasks/task.schemas";
import { goalService } from "@/modules/goals/goal.service";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const userId = await requireUserId();
    const body = await req.json();
    const parsed = createGoalSchema.safeParse(body);
    if (!parsed.success) {
      throw Errors.badRequest("Invalid goal data", parsed.error.flatten());
    }

    const { id } = await goalService.create(userId, parsed.data);
    return jsonOk({ id }, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function GET() {
  try {
    await connectDb();
    const userId = await requireUserId();
    const goals = await goalService.listForUser(userId);
    return jsonOk(goals);
  } catch (err) {
    return handleRouteError(err);
  }
}
