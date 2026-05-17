import { addDaysToKey, toDateKey } from "@/lib/dates";
import { taskRepository } from "@/modules/tasks/task.repository";
import { Task } from "@/modules/tasks/task.model";
import { Types } from "mongoose";

const DEFAULT_DAILY_CAP_MINUTES = 120;
const MAX_TASKS_PER_DAY = 8;

function priorityWeight(priority: string): number {
  if (priority === "high") return 3;
  if (priority === "medium") return 2;
  return 1;
}

export const schedulingService = {
  /**
   * Redistribute pending tasks from a start date using daily capacity caps.
   */
  async redistributeUserBacklog(
    userId: string,
    startDateKey: string = toDateKey(),
    dailyCapMinutes = DEFAULT_DAILY_CAP_MINUTES
  ) {
    const pending = await Task.find({
      userId: new Types.ObjectId(userId),
      status: { $in: ["pending", "in_progress"] },
      scheduledDate: { $lt: startDateKey },
    }).sort({ priority: -1, createdAt: 1 });

    if (pending.length === 0) return { updated: 0 };

    let cursor = startDateKey;
    const buckets = new Map<
      string,
      { minutes: number; count: number }
    >();

    for (const task of pending) {
      let placed = false;
      while (!placed) {
        const bucket = buckets.get(cursor) ?? { minutes: 0, count: 0 };
        const fits =
          bucket.minutes + task.estimatedMinutes <= dailyCapMinutes &&
          bucket.count < MAX_TASKS_PER_DAY;

        if (fits) {
          await Task.updateOne(
            { _id: task._id },
            {
              scheduledDate: cursor,
              rescheduleCount: (task.rescheduleCount ?? 0) + 1,
              lastRescheduledAt: new Date(),
            }
          );
          bucket.minutes += task.estimatedMinutes;
          bucket.count += 1;
          buckets.set(cursor, bucket);
          placed = true;
        } else {
          cursor = addDaysToKey(cursor, 1);
        }
      }
    }

    return { updated: pending.length };
  },

  async getWorkloadByDate(userId: string, fromKey: string, days: number) {
    const result: Record<string, { tasks: number; minutes: number }> = {};
    let cursor = fromKey;
    for (let i = 0; i < days; i++) {
      const tasks = await taskRepository.findScheduledForDate(userId, cursor);
      result[cursor] = {
        tasks: tasks.length,
        minutes: tasks.reduce((s, t) => s + t.estimatedMinutes, 0),
      };
      cursor = addDaysToKey(cursor, 1);
    }
    return result;
  },
};
