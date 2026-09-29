import { NextRequest } from "next/server";
import { handleRouteError, jsonOk } from "@/lib/api";
import { requireUserId } from "@/lib/auth/session";
import { connectDb } from "@/lib/db";
import { analyticsService } from "@/modules/analytics/analytics.service";
import { goalService } from "@/modules/goals/goal.service";
import { taskRepository } from "@/modules/tasks/task.repository";

export async function GET(request: NextRequest) {
  try {
    await connectDb();
    const userId = await requireUserId();
    const includeActiveGoalCount = request.nextUrl.searchParams.get("includeActiveGoalCount") === "true";
    const [analytics, activeGoals, completedCount, activeGoalCount] = await Promise.all([
      analyticsService.getSummary(userId),
      goalService.countForUser(userId),
      taskRepository.countByStatus(userId, "completed"),
      includeActiveGoalCount
        ? goalService.countActiveOnlyForUser(userId)
        : Promise.resolve(undefined),
    ]);

    return jsonOk({
      ...analytics,
      activeGoals,
      completedTasks: completedCount,
      ...(includeActiveGoalCount ? { activeGoalCount } : {}),
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
