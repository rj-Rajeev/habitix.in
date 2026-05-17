import { handleRouteError, jsonOk } from "@/lib/api";
import { requireUserId } from "@/lib/auth/session";
import { connectDb } from "@/lib/db";
import { analyticsService } from "@/modules/analytics/analytics.service";
import { goalService } from "@/modules/goals/goal.service";
import { taskRepository } from "@/modules/tasks/task.repository";

export async function GET() {
  try {
    await connectDb();
    const userId = await requireUserId();
    const [analytics, activeGoals, completedCount] = await Promise.all([
      analyticsService.getSummary(userId),
      goalService.countForUser(userId),
      taskRepository.countByStatus(userId, "completed"),
    ]);

    return jsonOk({
      ...analytics,
      activeGoals,
      completedTasks: completedCount,
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
