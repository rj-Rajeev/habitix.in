import { Types } from "mongoose";
import { goalRepository } from "@/modules/goals/goal.repository";
import { taskRepository } from "./task.repository";
import { taskHistoryRepository } from "./task-history.repository";

export type RecentActivityDto = {
  id: string;
  label: string;
  taskTitle: string;
  occurredAt: string;
  goalHref: string | null;
};

function eventLabel(event: string, action: unknown): string {
  switch (event) {
    case "completed": return "Task completed";
    case "skipped": return "Task skipped";
    case "rescheduled": return action === "reopened" ? "Task reopened" : "Task rescheduled";
    case "revision_scheduled": return "Revision scheduled";
    case "created": return "Task created";
    case "note_added": return "Note added";
    default: return "Task activity";
  }
}

export const taskHistoryService = {
  async listRecentForUser(userId: string): Promise<RecentActivityDto[]> {
    const events = await taskHistoryRepository.findRecentEventsForUser(userId);
    const taskIds = events.map((event) => event.taskId?.toString() ?? "");
    const goalIds = events.map((event) => event.goalId?.toString() ?? "");
    const [tasks, goals] = await Promise.all([
      taskRepository.findDisplayDetailsByIdsForUser(taskIds, userId),
      goalRepository.findIdsForUser(goalIds, userId),
    ]);

    const taskById = new Map(tasks.map((task) => [task._id.toString(), task]));
    const ownedGoalIds = new Set(goals.map((goal) => goal._id.toString()));

    return events.flatMap((event) => {
      const id = event._id?.toString();
      const occurredAt = event.createdAt;
      if (!id || !(occurredAt instanceof Date) || !Number.isFinite(occurredAt.getTime())) return [];

      const taskId = event.taskId?.toString();
      const goalId = event.goalId?.toString();
      const task = taskId ? taskById.get(taskId) : undefined;
      const taskTitle = typeof task?.topic === "string" && task.topic.trim()
        ? task.topic.trim()
        : "Task no longer available";

      return [{
        id,
        label: eventLabel(event.event, event.payload?.action),
        taskTitle,
        occurredAt: occurredAt.toISOString(),
        goalHref: goalId && Types.ObjectId.isValid(goalId) && ownedGoalIds.has(goalId)
          ? `/goals/${goalId}`
          : null,
      }];
    });
  },
};
