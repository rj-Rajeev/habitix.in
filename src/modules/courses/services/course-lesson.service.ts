import { Types, type ClientSession } from "mongoose";
import { Errors } from "@/lib/api";
import { courseContentRepository } from "../repositories/course-content.repository";
import { normalizeSlug } from "../validation/course.schemas";

function isLessonSlugConflict(error: unknown) {
  if (!error || typeof error !== "object" || !("code" in error) || error.code !== 11000) {
    return false;
  }
  const keyPattern = "keyPattern" in error
    ? (error as { keyPattern?: Record<string, unknown> }).keyPattern
    : undefined;
  return Boolean(keyPattern && "courseId" in keyPattern && "lessonSlug" in keyPattern);
}

export const courseLessonService = {
  async createLesson(
    courseId: string | Types.ObjectId,
    moduleId: string | Types.ObjectId,
    data: Record<string, unknown>,
    session?: ClientSession,
  ) {
    const normalizedCourseId = new Types.ObjectId(courseId);
    const baseSlug = normalizeSlug(String(data.title ?? "")) || "lesson";

    for (let suffix = 1; ; suffix += 1) {
      const lessonSlug = suffix === 1 ? baseSlug : `${baseSlug}-${suffix}`;
      if (await courseContentRepository.lessonSlugExists(normalizedCourseId, lessonSlug, session)) {
        continue;
      }

      try {
        return await courseContentRepository.createLesson(
          {
            ...data,
            courseId: normalizedCourseId,
            moduleId,
            lessonSlug,
          },
          session,
        );
      } catch (error) {
        if (isLessonSlugConflict(error)) continue;
        throw error;
      }
    }

    throw Errors.conflict("Unable to create a unique lesson URL");
  },
};
