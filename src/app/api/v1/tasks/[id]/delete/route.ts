import { NextRequest } from "next/server";
import { handleRouteError } from "@/lib/api/handle-route";
import { jsonOk } from "@/lib/api/response";
import { requireUserId } from "@/lib/auth/session";
import { connectDb } from "@/lib/db";
import { taskRepository } from "@/modules/tasks/task.repository";
import { goalCompletionService } from "@/modules/goals/goal-completion.service";
import { goalRepository, isCourseGoalRecord } from "@/modules/goals/goal.repository";
import { Errors } from "@/lib/api";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDb();
    const userId = await requireUserId();
    const { id } = await params;

    const existing = await taskRepository.findByIdForUser(id, userId);
    if (!existing) return new Response(JSON.stringify({ success: false, error: { message: "Not found" } }), { status: 404 });

    if (existing.type === "execution") {
      const goal = await goalRepository.findByIdForUser(existing.goalId.toString(), userId);
      if (isCourseGoalRecord(goal)) {
        throw Errors.forbidden();
      }
    }

    await existing.deleteOne();
    await goalCompletionService.evaluateGoalCompletion(existing.goalId.toString(), userId);

    return jsonOk({ success: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
