import { Types } from "mongoose";
import { Errors } from "@/lib/api";
import { requireCourseAccess } from "@/lib/enrollments/access";
import type { CreateGoalInput } from "@/modules/tasks/task.schemas";
import { goalRepository, isManualGoalRecord } from "./goal.repository";
import { goalSyncService } from "./goal-sync.service";
import type { IRoadmapDay } from "./goal.model";
import { courseLearningService } from "@/modules/courses/course-learning.service";
import { goalCompletionService } from "./goal-completion.service";
import { taskRepository } from "@/modules/tasks/task.repository";
import { dateKeyInTimezone, isValidGoalTimezone, parseGoalDateKey, validateRoadmapSchedule } from "@/lib/goals/goal-scheduling";

function normalizeRoadmap(roadmap: CreateGoalInput["roadmap"]): IRoadmapDay[] {
  if (!roadmap?.length) return [];

  return roadmap.map((day, index) => {
    return {
      dayNumber: day.dayNumber,
      dayDate: day.dayDate,
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
    if (input.roadmap?.some((day) => day.tasks.length === 0)) {
      throw Errors.badRequest("Every roadmap day must contain at least one task");
    }

    const timezone = input.timezone || "UTC";
    if (!isValidGoalTimezone(timezone)) throw Errors.badRequest("Goal timezone must be a valid IANA timezone");
    if (!Number.isInteger(input.daysPerWeek) || input.daysPerWeek < 1 || input.daysPerWeek > 7) {
      throw Errors.badRequest("Days per week must be a whole number from 1 to 7");
    }
    const now = new Date();
    if (!input.targetDate && input.roadmap?.some((day) => day.tasks.length > 0)) {
      throw Errors.badRequest("A target date is required when a Goal has scheduled roadmap tasks");
    }
    if (input.targetDate) {
      const targetDate = parseGoalDateKey(input.targetDate);
      if (!targetDate) throw Errors.badRequest("Target date must be a valid YYYY-MM-DD calendar date");
      const today = parseGoalDateKey(dateKeyInTimezone(now, timezone));
      if (!today || targetDate < today) throw Errors.badRequest("Target date must be today or later in the Goal timezone");
    }
    const scheduleErrors = input.roadmap?.some((day) => day.tasks.length > 0)
      ? validateRoadmapSchedule(input.roadmap, {
          targetDate: input.targetDate!,
          daysPerWeek: input.daysPerWeek,
          timezone,
        }, now)
      : [];
    if (scheduleErrors.length) throw Errors.badRequest("Invalid Goal schedule", { issues: scheduleErrors });

    if (input.courseId) {
      const content = await courseLearningService.loadPublishedCourseContent(input.courseId);
      await requireCourseAccess(userId, input.courseId);
      if (content.lessons.length === 0) throw Errors.badRequest("Course Goals require a course with at least one lesson");
      const courseTaskCount = input.roadmap?.reduce((total, day) => total + day.tasks.length, 0) ?? 0;
      const requestedLessonIds = input.roadmap?.flatMap((day) => day.tasks
        .map((task) => task.courseLessonId)
        .filter((lessonId): lessonId is string => Boolean(lessonId))) ?? [];
      const expectedLessonIds = content.lessons.map((lesson) => lesson.lessonId);
      if (courseTaskCount !== expectedLessonIds.length ||
          requestedLessonIds.length !== courseTaskCount ||
          requestedLessonIds.some((lessonId, index) => lessonId !== expectedLessonIds[index])) {
        throw Errors.badRequest("Course Goal roadmap must include every course lesson exactly once in curriculum order");
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
      timezone,
      courseId: input.courseId ? new Types.ObjectId(input.courseId) : undefined,
      roadmap,
      status: "active",
      completed: false,
    });

    const goalId = goal._id.toString();
    try {
      await goalSyncService.syncGoalTasks(userId, goalId);
    } catch (error) {
      // Completion can write history, analytics, or Course Lesson Progress before
      // a later sync step fails. Keep the Goal and its Tasks together once any
      // Task has been created so those durable side effects never point at data
      // removed by this compensating cleanup.
      try {
        const tasksExist = await taskRepository.existsForGoal(goalId, userId);
        if (!tasksExist) await goalRepository.deleteByIdForUser(goalId, userId);
      } catch {
        // If cleanup cannot establish that no Tasks exist, preserve the Goal.
      }
      throw error;
    }

    return { id: goalId, goal: normalizeGoal(goal) };
  },

  async getById(id: string, userId: string) {
    const goal = await goalRepository.findByIdForUser(id, userId);

    if (!goal) {
      throw Errors.notFound("Goal");
    }

    const hasManualTaskEvidence = await taskRepository.hasManualTaskEvidence(id, userId);
    return {
      ...normalizeGoal(goal),
      spreadsheetImportEligible: isManualGoalRecord(goal, hasManualTaskEvidence),
    };
  },

  async listForUser(userId: string) {
    const goals = await goalRepository.findActiveByUser(userId);
    return Promise.all(goals.map(async (goal) => ({
      ...normalizeGoal(goal),
      spreadsheetImportEligible: isManualGoalRecord(
        goal,
        await taskRepository.hasManualTaskEvidence(goal._id.toString(), userId)
      ),
    })));
  },

  async listActiveForDashboard(userId: string) {
    const goals = await goalRepository.findGoalsWithStatusByUser(userId, "active");
    return Promise.all(goals.map(async (goal) => ({
      ...normalizeGoal(goal),
      progress: await goalCompletionService.getGoalTaskProgress(goal._id.toString(), userId),
    })));
  },

  async countForUser(userId: string) {
    return goalRepository.countActiveByUser(userId);
  },

  async countActiveOnlyForUser(userId: string) {
    return goalRepository.countActiveOnlyByUser(userId);
  },
};

function normalizeGoal<T extends { toObject?: () => Record<string, unknown>; courseId?: unknown; $isDefault?: (path: string) => boolean }>(goal: T) {
  const data = goal.toObject ? goal.toObject() : goal as unknown as Record<string, unknown>;
  const legacyMissingSource = goal.$isDefault?.("planSource") ?? data.planSource === undefined;
  return { ...data, planSource: legacyMissingSource ? (data.courseId ? "course" : "manual") : data.planSource };
}
