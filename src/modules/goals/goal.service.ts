import { addDays, format, startOfDay } from "date-fns";
import { Types } from "mongoose";
import { toDateKey } from "@/lib/dates";
import { Errors } from "@/lib/api";
import { requireCourseAccess } from "@/lib/enrollments/access";
import type { CreateGoalInput } from "@/modules/tasks/task.schemas";
import { goalRepository } from "./goal.repository";
import { goalSyncService } from "./goal-sync.service";
import type { IRoadmapDay } from "./goal.model";
import { courseLearningService } from "@/modules/courses/course-learning.service";

function normalizeRoadmap(roadmap: CreateGoalInput["roadmap"]): IRoadmapDay[] {
  if (!roadmap?.length) return [];

  return roadmap.map((day, index) => {
    let dayDate: string;
    if (typeof day.dayDate === "string") {
      dayDate = /^\d{4}-\d{2}-\d{2}$/.test(day.dayDate)
        ? day.dayDate
        : toDateKey(new Date(day.dayDate));
    } else {
      dayDate = toDateKey(new Date(day.dayDate));
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dayDate)) {
      dayDate = format(
        startOfDay(addDays(new Date(), index)),
        "yyyy-MM-dd"
      );
    }

    return {
      dayNumber: day.dayNumber,
      dayDate,
      unlocked: day.unlocked ?? index === 0,
      completed: day.completed ?? false,
      tasks: day.tasks.map((t) => ({
        title: t.title,
        isCompleted: t.isCompleted ?? false,
        createdAt: new Date(),
        courseLessonId: t.courseLessonId ? new Types.ObjectId(t.courseLessonId) : undefined,
      })),
      proof: { uploaded: false },
    };
  });
}

export const goalService = {
  async create(userId: string, input: CreateGoalInput) {
    const planSource = input.planSource ?? (input.courseId ? "course" : "manual");
    if (planSource === "course" && !input.courseId) throw Errors.badRequest("Course goals require a courseId");
    if (planSource !== "course" && input.courseId) throw Errors.badRequest(`${planSource} goals cannot include a courseId`);
    if (!input.courseId && input.roadmap?.some((day) => day.tasks.some((task) => task.courseLessonId))) {
      throw Errors.badRequest("Course lesson references require a courseId");
    }

    if (input.courseId) {
      const content = await courseLearningService.loadPublishedCourseContent(input.courseId);
      await requireCourseAccess(userId, input.courseId);
      const validLessonIds = new Set(content.lessons.map((lesson) => lesson.lessonId));
      const requestedLessonIds = input.roadmap?.flatMap((day) => day.tasks
        .map((task) => task.courseLessonId)
        .filter((lessonId): lessonId is string => Boolean(lessonId))) ?? [];
      if (requestedLessonIds.some((lessonId) => !validLessonIds.has(lessonId))) {
        throw Errors.badRequest("Roadmap contains a lesson that does not belong to this course");
      }
    }

    const roadmap = normalizeRoadmap(input.roadmap);

    const goal = await goalRepository.create({
      userId,
      planSource,
      title: input.title,
      description: input.description,
      targetDate: input.targetDate,
      hoursPerDay: input.hoursPerDay,
      preferredTime: input.preferredTime,
      daysPerWeek: input.daysPerWeek,
      motivation: input.motivation,
      timezone: input.timezone,
      courseId: input.courseId ? new Types.ObjectId(input.courseId) : undefined,
      roadmap,
      status: "active",
      completed: false,
    });

    const goalId = goal._id.toString();
    await goalSyncService.syncGoalTasks(userId, goalId);

    return { id: goalId, goal: normalizeGoal(goal) };
  },

  async getById(id: string, userId: string) {
    const goal = await goalRepository.findByIdForUser(id, userId);

    if (!goal) {
      throw Errors.notFound("Goal");
    }

    return normalizeGoal(goal);
  },

  async listForUser(userId: string) {
    return (await goalRepository.findActiveByUser(userId)).map(normalizeGoal);
  },

  async countForUser(userId: string) {
    return goalRepository.countActiveByUser(userId);
  },
};

function normalizeGoal<T extends { toObject?: () => Record<string, unknown>; courseId?: unknown; $isDefault?: (path: string) => boolean }>(goal: T) {
  const data = goal.toObject ? goal.toObject() : goal as unknown as Record<string, unknown>;
  const legacyMissingSource = goal.$isDefault?.("planSource") ?? data.planSource === undefined;
  return { ...data, planSource: legacyMissingSource ? (data.courseId ? "course" : "manual") : data.planSource };
}
