import { createHash } from "node:crypto";
import { Types } from "mongoose";
import { Errors } from "@/lib/api";
import { goalRepository } from "./goal.repository";
import { taskRepository } from "@/modules/tasks/task.repository";
import type { IRoadmapDay } from "./goal.model";
import { courseLearningService } from "@/modules/courses/course-learning.service";
import { goalCompletionService } from "./goal-completion.service";
import { taskCompletionService } from "@/modules/tasks/task-completion.service";

export const goalSyncService = {
  /** Reconcile nested roadmap entries with Tasks and process initial completion state. */
  async syncGoalTasks(userId: string, goalId: string): Promise<number> {
    const goal = await goalRepository.findByIdForUser(goalId, userId);
    if (!goal?.roadmap?.length) return 0;

    const roadmap = goal.roadmap as unknown as IRoadmapDay[];
    const tasks = await flattenRoadmapToTasks(userId, goalId, goal.courseId?.toString(), roadmap);

    let existing = await taskRepository.findRoadmapSyncTasks(goalId, userId);
    let matches = matchRoadmapTasks(tasks, existing);
    let missing = tasks.filter((_, index) => !matches[index]);
    let createdCount = 0;
    let insertAttempts = 0;

    // Deterministic Task _ids use Mongo's built-in unique _id index to make
    // concurrent sync attempts converge. insertMany can partially succeed, so
    // reconcile after duplicate-key errors and insert only entries still absent.
    while (missing.length > 0) {
      insertAttempts += 1;
      if (insertAttempts > tasks.length + 1) {
        throw new Error("Could not finish reconciling Goal roadmap Tasks after concurrent inserts");
      }
      try {
        const created = await taskRepository.createMany(missing.map((entry) => entry.task));
        createdCount += created.length;
      } catch (error) {
        if (!isDuplicateKeyError(error)) throw error;
      }

      existing = await taskRepository.findRoadmapSyncTasks(goalId, userId);
      matches = matchRoadmapTasks(tasks, existing);
      missing = tasks.filter((_, index) => !matches[index]);
    }

    for (const [index, task] of tasks.entries()) {
      const existingTask = matches[index];
      if (!goal.tasksSyncedAt && task.initiallyCompleted) {
        if (!existingTask) {
          throw new Error("Goal roadmap Task was not present after reconciliation");
        }
        if (existingTask.status !== "completed") {
          await taskCompletionService.complete(existingTask._id.toString(), userId, {
            scheduleRevision: "none",
          });
        }
      }
    }

    await goalCompletionService.evaluateGoalCompletion(goalId, userId);
    await goalRepository.markTasksSynced(goalId, userId);
    return createdCount;
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

async function flattenRoadmapToTasks(
  userId: string,
  goalId: string,
  courseId: string | undefined,
  roadmap: IRoadmapDay[]
) {
  const items: Array<{ task: Parameters<typeof taskRepository.createMany>[0][number];
    initiallyCompleted: boolean;
    courseLessonId?: string;
  }> = [];
  const hasLessonReferences = roadmap.some((day) => day.tasks.some((task) => task.courseLessonId));
  if (hasLessonReferences && !courseId) {
    throw Errors.badRequest("Course lesson reference requires a course-linked goal");
  }
  const courseContent = hasLessonReferences && courseId
    ? await courseLearningService.loadPublishedCourseContent(courseId)
    : undefined;
  const lessonsById = new Map(courseContent?.lessons.map((lesson) => [lesson.lessonId, lesson]));

  for (const day of roadmap) {
    const scheduledDate = day.dayDate;
    for (const [index, t] of day.tasks.entries()) {
      const legacyId = t._id?.toString();
      const courseLessonId = t.courseLessonId?.toString();
      const entryIdentity = courseLessonId
        ? `course-lesson:${courseLessonId}`
        : legacyId
          ? `roadmap-task:${legacyId}`
          : undefined;
      if (!entryIdentity) {
        throw Errors.badRequest("Roadmap task is missing a stable persisted identifier");
      }
      const learning = t.courseLessonId ? lessonsById.get(t.courseLessonId.toString()) : undefined;
      if (t.courseLessonId && !learning) throw Errors.notFound("Lesson");
      items.push({
        task: {
        _id: deterministicTaskId(goalId, entryIdentity),
        userId,
        goalId,
        title: t.title,
        scheduledDate,
        scheduledOrder: index,
        status: "pending",
        type: "execution",
        estimatedMinutes: 30,
        source: {
          type: "roadmap_sync",
          roadmapDayNumber: day.dayNumber,
          legacyTaskId: legacyId,
        },
        metadata: learning
          ? {
              learning: {
                courseId: courseId as string,
                moduleId: learning.moduleId,
                lessonId: learning.lessonId,
                lessonTitle: learning.lessonTitle,
              },
            }
          : undefined,
        },
        initiallyCompleted: t.isCompleted,
        courseLessonId,
      });
    }
  }

  return items;
}

type RoadmapTaskToCreate = Awaited<ReturnType<typeof flattenRoadmapToTasks>>[number];
type ExistingRoadmapTask = Awaited<ReturnType<typeof taskRepository.findRoadmapSyncTasks>>[number];

function deterministicTaskId(goalId: string, identity: string): string {
  return createHash("sha256")
    .update(`${goalId}:${identity}`)
    .digest("hex")
    .slice(0, 24);
}

function matchRoadmapTasks(
  roadmapTasks: RoadmapTaskToCreate[],
  existingTasks: ExistingRoadmapTask[]
): Array<ExistingRoadmapTask | undefined> {
  const usedTaskIds = new Set<string>();
  return roadmapTasks.map((roadmapTask) => {
    const deterministicId = roadmapTask.task._id?.toString();
    const lessonId = roadmapTask.courseLessonId;
    const legacyTaskId = roadmapTask.task.source?.legacyTaskId;
    const candidates = existingTasks.filter((task) => {
      const taskId = task._id.toString();
      const taskLessonId = getLearningLessonId(task.metadata);
      return taskId === deterministicId ||
        (lessonId ? taskLessonId === lessonId : false) ||
        (legacyTaskId ? task.source?.legacyTaskId === legacyTaskId : false);
    });
    if (candidates.length > 1) {
      throw new Error("Multiple persisted Tasks match one Goal roadmap entry");
    }

    const match = candidates[0];
    if (match) {
      const taskId = match._id.toString();
      if (usedTaskIds.has(taskId)) {
        throw new Error("One persisted Task matches multiple Goal roadmap entries");
      }
      usedTaskIds.add(taskId);
    }
    return match;
  });
}

function getLearningLessonId(metadata: unknown): string | undefined {
  if (!metadata || typeof metadata !== "object" || !("learning" in metadata)) return undefined;
  const learning = metadata.learning;
  if (!learning || typeof learning !== "object" || !("lessonId" in learning)) return undefined;
  const lessonId = learning.lessonId;
  return typeof lessonId === "string"
    ? lessonId
    : lessonId instanceof Types.ObjectId
      ? lessonId.toString()
      : undefined;
}

function isDuplicateKeyError(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === 11000);
}
