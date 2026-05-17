import { handleRouteError, jsonOk, Errors } from "@/lib/api";
import { requireUserId } from "@/lib/auth/session";
import { connectDb } from "@/lib/db";
import { goalRepository } from "@/modules/goals/goal.repository";
import { taskRepository } from "@/modules/tasks/task.repository";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDb();
    const userId = await requireUserId();
    const { id } = await params;

    const goal = await goalRepository.findByIdForUser(id, userId);
    if (!goal) {
      throw Errors.notFound("Goal");
    }

    const tasks = await taskRepository.findByGoalForUser(id, userId);
    return jsonOk(tasks);
  } catch (err) {
    return handleRouteError(err);
  }
}
