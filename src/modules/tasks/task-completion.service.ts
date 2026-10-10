import mongoose, { ClientSession, Types } from "mongoose";
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
import { connectDb } from "@/lib/db";

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

export const taskCompletionService = {
  async complete(taskId: string, userId: string, input: CompleteTaskInput) {
    await connectDb();
    const session = await mongoose.startSession();
    const now = new Date();
    try {
      return await withCompletionTransaction(session, async () => {
        const task = await taskRepository.findByIdForUser(taskId, userId, session);
        if (!task) throw Errors.notFound("Task");

        if (task.status === "completed") {
          await mirrorRoadmapCompletion(task, userId, true, session);
          return { taskId, alreadyCompleted: true };
        }

        let courseLessonProgressUnavailable = false;
        const learning = getLearningMetadata(task);
        if (learning) {
          try {
            await courseProgressService.completeLesson(
              userId,
              learning.courseId,
              learning.lessonId,
              session
            );
          } catch (error) {
            if (!(error instanceof AppError) || error.code !== "NOT_FOUND") throw error;
            courseLessonProgressUnavailable = true;
          }
        }

        const goal = await goalRepository.findByIdForUser(task.goalId.toString(), userId, session);
        const timezone = goal?.timezone || "UTC";
        const claimedTask = await taskRepository.markCompletedIfStatusMatches(
          taskId,
          userId,
          task.status,
          now,
          input.note ?? task.notes,
          session
        );
        if (!claimedTask) throw Errors.conflict("Task state changed; retry the completion request");

        await mirrorRoadmapCompletion(task, userId, true, session);
        await goalCompletionService.evaluateGoalCompletion(task.goalId.toString(), userId, session);

        if (task.type === "revision") {
          await revisionRepository.markCompletedByRevisionTaskId(taskId, session);
        }

        await new TaskHistory({
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
        }).save({ session });

        await analyticsService.recordTaskCompletion(
          userId,
          toDateKeyInTimezone(now, timezone),
          session
        );

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
            session,
            completedAt: now,
          });
        }

        return { taskId, alreadyCompleted: false, courseLessonProgressUnavailable };
      });
    } finally {
      await session.endSession();
    }
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
    await connectDb();
    const session = await mongoose.startSession();
    const now = new Date();
    try {
      return await session.withTransaction(async () => {
        const task = await taskRepository.findByIdForUser(taskId, userId, session);
        if (!task) throw Errors.notFound("Task");
        if (task.status === "pending") return { taskId };

        const transitioned = await taskRepository.markPendingIfStatusMatches(
          taskId,
          userId,
          task.status,
          session
        );
        if (!transitioned) throw Errors.conflict("Task state changed; retry the reopen request");

        await mirrorRoadmapCompletion(task, userId, false, session);
        if (task.type === "revision") {
          const goal = await goalRepository.findByIdForUser(task.goalId.toString(), userId, session);
          const fromKey = toDateKeyInTimezone(now, goal?.timezone || "UTC");
          const intervalDays = differenceInCalendarDays(
            parseDateKey(task.scheduledDate),
            parseDateKey(fromKey)
          );
          await revisionRepository.updateScheduleByRevisionTaskId(
            taskId,
            userId,
            task.scheduledDate,
            intervalDays,
            session
          );
        }
        await goalCompletionService.evaluateGoalCompletion(task.goalId.toString(), userId, session);

        await new TaskHistory({
          userId: new Types.ObjectId(userId),
          taskId: new Types.ObjectId(taskId),
          goalId: task.goalId,
          event: "rescheduled",
          payload: { action: "reopened" },
        }).save({ session });

        return { taskId };
      });
    } finally {
      await session.endSession();
    }
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

async function withCompletionTransaction<T>(session: ClientSession, operation: () => Promise<T>): Promise<T> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await session.withTransaction(operation);
    } catch (error) {
      if (!isCompletionUniqueContention(error)) throw error;
      if (attempt === 1) {
        throw Errors.conflict("Completion data changed concurrently; retry task completion");
      }
      // withTransaction aborts callback failures before rejecting. Retrying this
      // narrowly identified unique-key race starts a fresh atomic attempt.
    }
  }
  throw Errors.conflict("Completion data changed concurrently; retry task completion");
}

function isCompletionUniqueContention(error: unknown): boolean {
  return isDuplicateKeyFor(error, ["userId", "lessonId"]) ||
    isDuplicateKeyFor(error, ["userId"]);
}

function isDuplicateKeyFor(error: unknown, fields: string[]): boolean {
  if (!error || typeof error !== "object" || !("code" in error) || error.code !== 11000) return false;
  const keyPattern = "keyPattern" in error
    ? (error as { keyPattern?: unknown }).keyPattern
    : undefined;
  if (!keyPattern || typeof keyPattern !== "object") return false;
  const actualFields = Object.keys(keyPattern);
  return actualFields.length === fields.length && fields.every((field) => field in keyPattern);
}

async function mirrorRoadmapCompletion(
  task: Awaited<ReturnType<typeof taskRepository.findByIdForUser>>,
  userId: string,
  isCompleted: boolean,
  session?: ClientSession
) {
  if (!task || task.source?.type !== "roadmap_sync" ||
      !task.source.roadmapDayNumber || !task.source.legacyTaskId) return;
  await goalRepository.mirrorRoadmapTaskCompletion(
    task.goalId.toString(),
    userId,
    task.source.roadmapDayNumber,
    task.source.legacyTaskId,
    isCompleted,
    session
  );
}

function getLearningMetadata(task: NonNullable<Awaited<ReturnType<typeof taskRepository.findByIdForUser>>>) {
  if (task.type !== "execution") return undefined;
  const metadata = task.metadata as unknown;
  if (!metadata || typeof metadata !== "object" || !("learning" in metadata)) return undefined;
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
  return {
    courseId: learning.courseId,
    lessonId: learning.lessonId,
  };
}
