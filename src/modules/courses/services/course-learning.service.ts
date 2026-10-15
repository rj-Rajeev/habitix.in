import { Types } from "mongoose";
import { Errors } from "@/lib/api";
import { courseRepository } from "../repositories/course.repository";
import { courseContentRepository } from "../repositories/course-content.repository";

export type CourseLearningLesson = {
  lessonId: string;
  lessonTitle: string;
  moduleId: string;
  moduleTitle: string;
};

export const courseLearningService = {
  async loadPublishedCourseContent(courseId: string) {
    if (!Types.ObjectId.isValid(courseId)) throw Errors.notFound("Course");
    const course = await courseRepository.findPublishedById(courseId);
    if (!course) throw Errors.notFound("Course");

    const modules = await courseContentRepository.findModulesByCourse(course._id);
    const lessonDocuments = await courseContentRepository.findLessonsByModuleIds(modules.map((module) => module._id));
    const lessons = modules.flatMap((module) =>
      lessonDocuments.filter((lesson) => lesson.moduleId.toString() === module._id.toString())
    );

    return {
      course: { courseId: course._id.toString(), title: course.title, description: course.description },
      modules: modules.map((module) => ({ moduleId: module._id.toString(), moduleTitle: module.title })),
      lessons: lessons.map((lesson) => {
        const courseModule = modules.find((item) => item._id.toString() === lesson.moduleId.toString());
        return {
          lessonId: lesson._id.toString(),
          lessonTitle: lesson.title,
          moduleId: lesson.moduleId.toString(),
          moduleTitle: courseModule?.title ?? "",
        } satisfies CourseLearningLesson;
      }),
    };
  },

};
