import { ClientSession } from "mongoose";
import { Errors } from "@/lib/api";
import { requireCourseAccess } from "./course-access.service";
import { courseRepository } from "../repositories/course.repository";
import { courseContentRepository } from "../repositories/course-content.repository";
import { courseProgressRepository } from "../repositories/course-progress.repository";

type CourseProgress = {
  completedLessonIds: string[];
  completedCount: number;
  totalCount: number;
  percentage: number;
};

async function findPublishedCourse(courseId: string, session?: ClientSession) {
  const course = await courseRepository.findPublishedForAccess(courseId, session);
  if (!course) throw Errors.notFound("Course");
  return course;
}

export const courseProgressService = {
  async getCourseProgress(userId: string, courseId: string, session?: ClientSession): Promise<CourseProgress> {
    const course = await findPublishedCourse(courseId, session);
    const modules = await courseContentRepository.findModulesForProgress(course._id, session);
    const lessons = await courseContentRepository.findLessonsForProgress(modules.map((module) => module._id), session);
    const lessonIds = lessons.map((lesson) => lesson._id);
    const progress = lessonIds.length
      ? await courseProgressRepository.findForLessons(userId, course._id, lessonIds, session)
      : [];
    const completedLessonIds = progress.map((item) => item.lessonId.toString());
    const totalCount = lessonIds.length;
    const completedCount = completedLessonIds.length;

    return {
      completedLessonIds,
      completedCount,
      totalCount,
      percentage: totalCount ? Math.round((completedCount / totalCount) * 100) : 0,
    };
  },

  async completeLesson(userId: string, courseId: string, lessonId: string, session?: ClientSession): Promise<CourseProgress> {
    const course = await findPublishedCourse(courseId, session);
    const lesson = await courseContentRepository.findLessonForProgress(lessonId, session);
    if (!lesson) throw Errors.notFound("Lesson");

    const courseModule = await courseContentRepository.findModuleForProgress(course._id, lesson.moduleId, session);
    if (!courseModule) throw Errors.notFound("Lesson");

    await requireCourseAccess(userId, course._id.toString(), session);

    try {
      await courseProgressRepository.recordLessonCompletion(userId, course._id, lesson._id, session);
    } catch (error) {
      // A simultaneous idempotent upsert can race on the unique user/lesson index.
      if (session && isDuplicateKeyFor(error, ["userId", "lessonId"])) {
        throw error;
      }
      if (!session && isDuplicateKeyFor(error, ["userId", "lessonId"])) return this.getCourseProgress(userId, course._id.toString());
      throw error;
    }

    return this.getCourseProgress(userId, course._id.toString(), session);
  },
};

function isDuplicateKeyFor(error: unknown, fields: string[]): boolean {
  if (!error || typeof error !== "object" || !("code" in error) || error.code !== 11000) return false;
  const keyPattern = "keyPattern" in error
    ? (error as { keyPattern?: unknown }).keyPattern
    : undefined;
  if (!keyPattern || typeof keyPattern !== "object") return false;
  const actualFields = Object.keys(keyPattern);
  return actualFields.length === fields.length && fields.every((field) => field in keyPattern);
}
