import { Types } from "mongoose";
import { differenceInCalendarDays } from "date-fns";
import { Errors } from "@/lib/api";
import { parseDateKey, toDateKeyInTimezone } from "@/lib/dates";
import type { CompleteTaskInput } from "./task.schemas";
import { taskRepository } from "./task.repository";
import { revisionService } from "@/modules/revisions/revision.service";
import { revisionRepository } from "@/modules/revisions/revision.repository";
import { TaskHistory } from "./task-history.model";
import { analyticsService } from "@/modules/analytics/analytics.service";
import type { RevisionPreset } from "@/lib/dates";
import { courseProgressService } from "@/modules/courses/course-progress.service";
import { goalCompletionService } from "@/modules/goals/goal-completion.service";
import { goalRepository } from "@/modules/goals/goal.repository";
import { AppError } from "@/lib/api/errors";

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

export const taskCompletionService = {
  async complete(taskId: string, userId: string, input: CompleteTaskInput) {
    const task = await taskRepository.findByIdForUser(taskId, userId);
    if (!task) throw Errors.notFound("Task");

    if (task.status === "completed") {
      await mirrorRoadmapCompletion(task, userId, true);
      return { taskId, alreadyCompleted: true };
    }

    let courseLessonProgressUnavailable = false;
    const metadata = task.metadata as unknown;
    if (task.type === "execution" && metadata && typeof metadata === "object" && "learning" in metadata) {
      const learning = metadata.learning as unknown;
      if (
        !learning ||
        typeof learning !== "object" ||
        !("courseId" in learning) ||
        !("moduleId" in learning) ||
        !("lessonId" in learning) ||
        typeof learning.courseId !== "string" ||
        !OBJECT_ID_PATTERN.test(learning.courseId) ||
        typeof learning.moduleId !== "string" ||
        !OBJECT_ID_PATTERN.test(learning.moduleId) ||
        typeof learning.lessonId !== "string" ||
        !OBJECT_ID_PATTERN.test(learning.lessonId) ||
        ("lessonTitle" in learning && learning.lessonTitle !== undefined && typeof learning.lessonTitle !== "string")
      ) {
        throw Errors.badRequest("Invalid course learning metadata");
      }

      try {
        await courseProgressService.completeLesson(userId, learning.courseId, learning.lessonId);
      } catch (error) {
        if (!(error instanceof AppError) || error.code !== "NOT_FOUND") throw error;
        courseLessonProgressUnavailable = true;
      }
    }

    const now = new Date();
    const goal = await goalRepository.findByIdForUser(task.goalId.toString(), userId);
    const timezone = goal?.timezone || "UTC";
    const claimedTask = await taskRepository.markCompletedIfNotCompleted(
      taskId,
      userId,
      now,
      input.note ?? task.notes
    );
    if (!claimedTask) {
      await mirrorRoadmapCompletion(task, userId, true);
      return { taskId, alreadyCompleted: true };
    }
    await mirrorRoadmapCompletion(task, userId, true);
    await goalCompletionService.evaluateGoalCompletion(task.goalId.toString(), userId);

    if (task.type === "revision") {
      await revisionRepository.markCompletedByRevisionTaskId(taskId);
    }

    await TaskHistory.create({
      userId: new Types.ObjectId(userId),
      taskId: new Types.ObjectId(taskId),
      goalId: task.goalId,
      event: "completed",
      payload: {
        note: input.note,
        ...(courseLessonProgressUnavailable
          ? { courseLessonProgress: "not_updated_source_unavailable" }
          : {}),
      },
    });

    await analyticsService.recordTaskCompletion(userId, toDateKeyInTimezone(now, timezone));

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
        timezone,
      });
    }

    return { taskId, alreadyCompleted: false, courseLessonProgressUnavailable };
  },

  async skip(taskId: string, userId: string, reason?: string) {
    const task = await taskRepository.findByIdForUser(taskId, userId);
    if (!task) throw Errors.notFound("Task");

    await taskRepository.updateById(taskId, userId, {
      status: "skipped",
      skippedAt: new Date(),
      completedAt: undefined,
    });
    await mirrorRoadmapCompletion(task, userId, false);
    if (task.type === "revision") {
      await revisionRepository.markCancelledByRevisionTaskId(taskId, userId);
    }
    await goalCompletionService.evaluateGoalCompletion(task.goalId.toString(), userId);

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

    await taskRepository.updateById(taskId, userId, {
      status: "pending",
      completedAt: undefined,
      skippedAt: undefined,
    });
    await mirrorRoadmapCompletion(task, userId, false);
    if (task.type === "revision") {
      const goal = await goalRepository.findByIdForUser(task.goalId.toString(), userId);
      const fromKey = toDateKeyInTimezone(new Date(), goal?.timezone || "UTC");
      const intervalDays = differenceInCalendarDays(
        parseDateKey(task.scheduledDate),
        parseDateKey(fromKey)
      );
      await revisionRepository.updateScheduleByRevisionTaskId(
        taskId,
        userId,
        task.scheduledDate,
        intervalDays
      );
    }
    await goalCompletionService.evaluateGoalCompletion(task.goalId.toString(), userId);

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

    await taskRepository.updateById(taskId, userId, {
      scheduledDate,
      status: "pending",
      rescheduleCount: (task.rescheduleCount ?? 0) + 1,
      lastRescheduledAt: new Date(),
      completedAt: undefined,
      skippedAt: undefined,
    });
    await mirrorRoadmapCompletion(task, userId, false);
    if (task.type === "revision") {
      const goal = await goalRepository.findByIdForUser(task.goalId.toString(), userId);
      const fromKey = toDateKeyInTimezone(new Date(), goal?.timezone || "UTC");
      const intervalDays = differenceInCalendarDays(
        parseDateKey(scheduledDate),
        parseDateKey(fromKey)
      );
      await revisionRepository.updateScheduleByRevisionTaskId(
        taskId,
        userId,
        scheduledDate,
        intervalDays
      );
    }
    await goalCompletionService.evaluateGoalCompletion(task.goalId.toString(), userId);

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

async function mirrorRoadmapCompletion(
  task: Awaited<ReturnType<typeof taskRepository.findByIdForUser>>,
  userId: string,
  isCompleted: boolean
) {
  if (!task || task.source?.type !== "roadmap_sync" ||
      !task.source.roadmapDayNumber || !task.source.legacyTaskId) return;
  await goalRepository.mirrorRoadmapTaskCompletion(
    task.goalId.toString(),
    userId,
    task.source.roadmapDayNumber,
    task.source.legacyTaskId,
    isCompleted
  );
}
