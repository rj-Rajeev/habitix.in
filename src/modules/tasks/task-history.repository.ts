import { Types } from "mongoose";
import { TaskHistory } from "./task-history.model";

export type TaskCompletionEvent = { createdAt: Date };

export type RecentTaskHistoryEvent = {
  _id: Types.ObjectId;
  taskId?: Types.ObjectId;
  goalId?: Types.ObjectId;
  event: string;
  createdAt: Date;
  payload?: { action?: unknown };
};

export const taskHistoryRepository = {
  async findRecentEventsForUser(userId: string): Promise<RecentTaskHistoryEvent[]> {
    return TaskHistory.find({ userId: new Types.ObjectId(userId) })
      .select("_id taskId goalId event createdAt payload.action")
      .sort({ createdAt: -1, _id: -1 })
      .limit(25)
      .lean<RecentTaskHistoryEvent[]>();
  },

  async findCompletionEventsForUserInRange(
    userId: string,
    start: Date,
    end: Date,
    limit: number
  ): Promise<{ events: TaskCompletionEvent[]; truncated: boolean }> {
    const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(Math.floor(limit), 5000)) : 5000;
    const events = await TaskHistory.find({
      userId: new Types.ObjectId(userId),
      event: "completed",
      createdAt: { $gte: start, $lt: end },
    })
      .select("createdAt")
      .sort({ createdAt: -1 })
      .limit(safeLimit + 1)
      .lean<TaskCompletionEvent[]>();

    return {
      events: events.slice(0, safeLimit),
      truncated: events.length > safeLimit,
    };
  },
};
