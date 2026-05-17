import { Types } from "mongoose";
import { toDateKey } from "@/lib/dates";
import { goalRepository } from "./goal.repository";
import { taskRepository } from "@/modules/tasks/task.repository";
import type { IRoadmapDay } from "./goal.model";

function normalizeDayDate(dayDate: string | Date): string {
  if (typeof dayDate === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dayDate)) return dayDate;
    return toDateKey(new Date(dayDate));
  }
  return toDateKey(dayDate);
}

export const goalSyncService = {
  /** Sync nested roadmap tasks into Task collection (idempotent per goal). */
  async syncGoalTasks(userId: string, goalId: string): Promise<number> {
    const exists = await taskRepository.existsForGoal(goalId);
    if (exists) {
      await goalRepository.markTasksSynced(goalId);
      return 0;
    }

    const goal = await goalRepository.findByIdForUser(goalId, userId);
    if (!goal?.roadmap?.length) return 0;

    const tasks = flattenRoadmapToTasks(userId, goalId, goal.roadmap);
    await taskRepository.createMany(tasks);
    await goalRepository.markTasksSynced(goalId);
    return tasks.length;
  },

  async syncAllUserGoals(userId: string): Promise<number> {
    const goals = await goalRepository.findUnsyncedGoals(userId);
    let total = 0;
    for (const goal of goals) {
      total += await this.syncGoalTasks(userId, goal._id.toString());
    }
    return total;
  },
};

function flattenRoadmapToTasks(
  userId: string,
  goalId: string,
  roadmap: IRoadmapDay[]
) {
  const items: Parameters<typeof taskRepository.createMany>[0] = [];

  for (const day of roadmap) {
    const scheduledDate = normalizeDayDate(day.dayDate);
    day.tasks.forEach((t, index) => {
      const legacyId = t._id?.toString();
      items.push({
        userId,
        goalId,
        title: t.title,
        scheduledDate,
        scheduledOrder: index,
        status: t.isCompleted ? "completed" : "pending",
        type: "execution",
        estimatedMinutes: 30,
        source: {
          type: "roadmap_sync",
          roadmapDayNumber: day.dayNumber,
          legacyTaskId: legacyId,
        },
      });
    });
  }

  return items;
}

export async function syncRoadmapTaskCompletion(
  goalId: string,
  dayNumber: number,
  legacyTaskId: string,
  isCompleted: boolean
) {
  const { Task } = await import("@/modules/tasks/task.model");
  await Task.updateOne(
    {
      goalId: new Types.ObjectId(goalId),
      "source.roadmapDayNumber": dayNumber,
      "source.legacyTaskId": legacyTaskId,
    },
    {
      status: isCompleted ? "completed" : "pending",
      completedAt: isCompleted ? new Date() : undefined,
    }
  );
}
