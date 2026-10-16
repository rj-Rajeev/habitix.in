import { Errors } from "@/lib/api";
import { normalizeSlug } from "../validation/course.schemas";
import { courseRepository } from "../repositories/course.repository";
import { courseContentRepository } from "../repositories/course-content.repository";
import { getCourseAccess } from "./course-access.service";

function isValidStoredSlug(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && normalizeSlug(value) === value;
}

export const courseCatalogService = {
  listPublished() {
    return courseRepository.listPublished();
  },

  async listPublishedSitemapEntries() {
    const courses = await courseCatalogService.listPublished();
    const validCourses = courses.filter((course) => isValidStoredSlug(course.slug));
    const courseSlugCounts = new Map<string, number>();
    for (const course of validCourses) {
      courseSlugCounts.set(course.slug, (courseSlugCounts.get(course.slug) ?? 0) + 1);
    }

    const unambiguousCourses = validCourses.filter(
      (course) => courseSlugCounts.get(course.slug) === 1,
    );
    const courseSlugById = new Map(
      unambiguousCourses.map((course) => [course._id.toString(), course.slug]),
    );
    if (courseSlugById.size === 0) return [];

    const modules = await courseContentRepository.findModulesForSitemap(
      unambiguousCourses.map((course) => course._id),
    );
    const moduleCourseSlugs = new Map<string, string>();
    for (const courseModule of modules) {
      const courseSlug = courseSlugById.get(courseModule.courseId.toString());
      if (courseSlug) moduleCourseSlugs.set(courseModule._id.toString(), courseSlug);
    }
    if (moduleCourseSlugs.size === 0) {
      return unambiguousCourses.map((course) => ({ courseSlug: course.slug, lessonSlugs: [] }));
    }

    const lessons = await courseContentRepository.findLessonSlugsForSitemap(
      modules.map((courseModule) => courseModule._id),
    );
    const lessonSlugCounts = new Map<string, number>();
    const lessonEntries: Array<{ courseSlug: string; lessonSlug: string }> = [];

    for (const lesson of lessons) {
      const courseSlug = moduleCourseSlugs.get(lesson.moduleId.toString());
      if (!courseSlug || !isValidStoredSlug(lesson.lessonSlug)) continue;

      const key = `${courseSlug}/${lesson.lessonSlug}`;
      lessonSlugCounts.set(key, (lessonSlugCounts.get(key) ?? 0) + 1);
      lessonEntries.push({ courseSlug, lessonSlug: lesson.lessonSlug });
    }

    const lessonSlugsByCourse = new Map<string, Set<string>>();
    for (const lesson of lessonEntries) {
      const key = `${lesson.courseSlug}/${lesson.lessonSlug}`;
      if (lessonSlugCounts.get(key) !== 1) continue;

      const slugs = lessonSlugsByCourse.get(lesson.courseSlug) ?? new Set<string>();
      slugs.add(lesson.lessonSlug);
      lessonSlugsByCourse.set(lesson.courseSlug, slugs);
    }

    return unambiguousCourses.map((course) => ({
      courseSlug: course.slug,
      lessonSlugs: [...(lessonSlugsByCourse.get(course.slug) ?? [])],
    }));
  },

  async getPublishedCourseDetail(identifier: string, userId?: string) {
    const course = await courseRepository.findPublishedBySlug(normalizeSlug(identifier));
    if (!course) throw Errors.notFound("Course");

    const { hasPaidAccess } = await getCourseAccess(course._id.toString(), userId);
    const modules = await courseContentRepository.findModulesByCourse(course._id);
    const lessons = await courseContentRepository.findLessonsForCoursePage(modules.map((module) => module._id));

    return {
      course,
      modules: modules.map((module) => ({
        ...module.toObject(),
        lessons: lessons
          .filter((lesson) => lesson.moduleId.toString() === module._id.toString())
          .map((lesson) => hasPaidAccess || lesson.isFree
            ? lesson
            : {
                _id: lesson._id,
                moduleId: lesson.moduleId,
                lessonSlug: lesson.lessonSlug,
                title: lesson.title,
                description: lesson.description,
                order: lesson.order,
                isFree: lesson.isFree,
              }),
      })),
    };
  },

  async resolvePublishedCourseId(identifier: string) {
    const course = await courseRepository.findPublishedBySlug(normalizeSlug(identifier));
    if (!course) throw Errors.notFound("Course");
    return course._id.toString();
  },
};
