import { Errors } from "@/lib/api";
import { normalizeSlug } from "../validation/course.schemas";
import { courseRepository } from "../repositories/course.repository";
import { courseContentRepository } from "../repositories/course-content.repository";
import { getCourseAccess } from "./course-access.service";

export const courseCatalogService = {
  listPublished() {
    return courseRepository.listPublished();
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
