import { Types } from "mongoose";
import { Errors } from "@/lib/api";
import { toDateKey } from "@/lib/dates";
import type { CompleteTaskInput } from "./task.schemas";
import { taskRepository } from "./task.repository";
import { revisionService } from "@/modules/revisions/revision.service";
import { revisionRepository } from "@/modules/revisions/revision.repository";
import { TaskHistory } from "./task-history.model";
import { analyticsService } from "@/modules/analytics/analytics.service";
import type { RevisionPreset } from "@/lib/dates";

export const taskCompletionService = {
  async complete(taskId: string, userId: string, input: CompleteTaskInput) {
    const task = await taskRepository.findByIdForUser(taskId, userId);
    if (!task) throw Errors.notFound("Task");

    if (task.status === "completed") {
      return { taskId, alreadyCompleted: true };
    }

    const now = new Date();
    await taskRepository.updateById(taskId, {
      status: "completed",
      completedAt: now,
      notes: input.note ?? task.notes,
    });

    if (task.type === "revision") {
      await revisionRepository.markCompletedByRevisionTaskId(taskId);
    }

    await TaskHistory.create({
      userId: new Types.ObjectId(userId),
      taskId: new Types.ObjectId(taskId),
      goalId: task.goalId,
      event: "completed",
      payload: { note: input.note },
    });

    await analyticsService.recordTaskCompletion(userId, toDateKey(now));

    if (
      input.scheduleRevision &&
      input.scheduleRevision !== "none" &&
      task.type === "execution"
    ) {
      await revisionService.scheduleFromCompletedTask({
        userId,
        sourceTaskId: taskId,
        goalId: task.goalId.toString(),
        title: task.title,
        preset: input.scheduleRevision as RevisionPreset,
        customRevisionDate: input.customRevisionDate,
      });
    }

    return { taskId, alreadyCompleted: false };
  },

  async skip(taskId: string, userId: string, reason?: string) {
    const task = await taskRepository.findByIdForUser(taskId, userId);
    if (!task) throw Errors.notFound("Task");

    await taskRepository.updateById(taskId, {
      status: "skipped",
      skippedAt: new Date(),
    });

    await TaskHistory.create({
      userId: new Types.ObjectId(userId),
      taskId: new Types.ObjectId(taskId),
      goalId: task.goalId,
      event: "skipped",
      payload: { reason },
    });

    return { taskId };
  },

  async reopen(taskId: string, userId: string) {
    const task = await taskRepository.findByIdForUser(taskId, userId);
    if (!task) throw Errors.notFound("Task");

    await taskRepository.updateById(taskId, {
      status: "pending",
      completedAt: undefined,
      skippedAt: undefined,
    });

    await TaskHistory.create({
      userId: new Types.ObjectId(userId),
      taskId: new Types.ObjectId(taskId),
      goalId: task.goalId,
      event: "rescheduled",
      payload: { action: "reopened" },
    });

    return { taskId };
  },

  async reschedule(
    taskId: string,
    userId: string,
    scheduledDate: string
  ) {
    const task = await taskRepository.findByIdForUser(taskId, userId);
    if (!task) throw Errors.notFound("Task");

    await taskRepository.updateById(taskId, {
      scheduledDate,
      status: "pending",
      rescheduleCount: (task.rescheduleCount ?? 0) + 1,
      lastRescheduledAt: new Date(),
      skippedAt: undefined,
    });

    await TaskHistory.create({
      userId: new Types.ObjectId(userId),
      taskId: new Types.ObjectId(taskId),
      goalId: task.goalId,
      event: "rescheduled",
      payload: { scheduledDate },
    });

    return { taskId, scheduledDate };
  },
};
