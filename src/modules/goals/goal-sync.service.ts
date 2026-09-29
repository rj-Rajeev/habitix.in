import { toDateKey } from "@/lib/dates";
import { Errors } from "@/lib/api";
import { goalRepository } from "./goal.repository";
import { taskRepository } from "@/modules/tasks/task.repository";
import type { IRoadmapDay } from "./goal.model";
import { courseLearningService } from "@/modules/courses/course-learning.service";
import { goalCompletionService } from "./goal-completion.service";
import { taskCompletionService } from "@/modules/tasks/task-completion.service";

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
    const exists = await taskRepository.existsForGoal(goalId, userId);
    if (exists) {
      await goalRepository.markTasksSynced(goalId, userId);
      return 0;
    }

    const goal = await goalRepository.findByIdForUser(goalId, userId);
    if (!goal?.roadmap?.length) return 0;

    const roadmap = goal.roadmap as unknown as IRoadmapDay[];
    const initiallyCompletedTaskKeys = new Set(
      roadmap.flatMap((day: IRoadmapDay) =>
        day.tasks.flatMap((task, index) =>
          task.isCompleted ? [`${day.dayNumber}:${index}`] : []
        )
      )
    );
    const tasks = await flattenRoadmapToTasks(userId, goalId, goal.courseId?.toString(), roadmap);
    const createdTasks = await taskRepository.createMany(tasks);
    await goalRepository.markTasksSynced(goalId, userId);
    for (const [index, task] of tasks.entries()) {
      const completionKey = `${task.source?.roadmapDayNumber}:${task.scheduledOrder}`;
      if (initiallyCompletedTaskKeys.has(completionKey)) {
        await taskCompletionService.complete(createdTasks[index]._id.toString(), userId, {
          scheduleRevision: "none",
        });
      }
    }
    await goalCompletionService.evaluateGoalCompletion(goalId, userId);
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

async function flattenRoadmapToTasks(
  userId: string,
  goalId: string,
  courseId: string | undefined,
  roadmap: IRoadmapDay[]
) {
  const items: Parameters<typeof taskRepository.createMany>[0] = [];
  const hasLessonReferences = roadmap.some((day) => day.tasks.some((task) => task.courseLessonId));
  if (hasLessonReferences && !courseId) {
    throw Errors.badRequest("Course lesson reference requires a course-linked goal");
  }
  const courseContent = hasLessonReferences && courseId
    ? await courseLearningService.loadPublishedCourseContent(courseId)
    : undefined;
  const lessonsById = new Map(courseContent?.lessons.map((lesson) => [lesson.lessonId, lesson]));

  for (const day of roadmap) {
    const scheduledDate = normalizeDayDate(day.dayDate);
    for (const [index, t] of day.tasks.entries()) {
      const legacyId = t._id?.toString();
      const learning = t.courseLessonId ? lessonsById.get(t.courseLessonId.toString()) : undefined;
      if (t.courseLessonId && !learning) throw Errors.notFound("Lesson");
      items.push({
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
      });
    }
  }

  return items;
}
