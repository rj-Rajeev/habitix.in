import { NextRequest } from "next/server";
import { handleRouteError, jsonOk } from "@/lib/api";
import { requireUserId } from "@/lib/auth/session";
import { connectDb } from "@/lib/db";
import { analyticsService } from "@/modules/analytics/analytics.service";
import { goalService } from "@/modules/goals/goal.service";
import { taskRepository } from "@/modules/tasks/task.repository";

function isValidTimezone(value: string | null): value is string {
  if (!value) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDb();
    const userId = await requireUserId();
    const requestedTimezone = request.nextUrl.searchParams.get("timezone");
    const timezone = isValidTimezone(requestedTimezone) ? requestedTimezone : "UTC";
    const includeActiveGoalCount = request.nextUrl.searchParams.get("includeActiveGoalCount") === "true";
    const [analytics, weeklyActivity, activeGoals, completedCount, activeGoalCount] = await Promise.all([
      analyticsService.getSummary(userId),
      analyticsService.getWeeklyActivity(userId, timezone),
      goalService.countForUser(userId),
      taskRepository.countByStatus(userId, "completed"),
      includeActiveGoalCount
        ? goalService.countActiveOnlyForUser(userId)
        : Promise.resolve(undefined),
    ]);

    return jsonOk({
      ...analytics,
      weeklyActivity: weeklyActivity.days,
      weeklyActivityTimezone: weeklyActivity.timezone,
      weeklyActivityHistoryCoverage: weeklyActivity.historyCoverage,
      activeGoals,
      completedTasks: completedCount,
      ...(includeActiveGoalCount ? { activeGoalCount } : {}),
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
