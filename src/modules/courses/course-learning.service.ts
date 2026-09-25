import { Types } from "mongoose";
import { Errors } from "@/lib/api";
import Course from "@/models/Course";
import CourseLesson from "@/models/CourseLesson";
import CourseModule from "@/models/CourseModule";

export type CourseLearningLesson = {
  lessonId: string;
  lessonTitle: string;
  moduleId: string;
  moduleTitle: string;
};

export const courseLearningService = {
  async loadPublishedCourseContent(courseId: string) {
    if (!Types.ObjectId.isValid(courseId)) throw Errors.notFound("Course");
    const course = await Course.findOne({ _id: courseId, status: "published" }).select("_id title description");
    if (!course) throw Errors.notFound("Course");

    const modules = await CourseModule.find({ courseId: course._id }).sort({ order: 1, createdAt: 1 });
    const lessons = await CourseLesson.find({ moduleId: { $in: modules.map((module) => module._id) } })
      .sort({ order: 1, createdAt: 1 })

    return {
      course: { courseId: course._id.toString(), title: course.title, description: course.description },
      lessons: lessons.map((lesson) => {
        const module = modules.find((item) => item._id.toString() === lesson.moduleId.toString());
        return {
          lessonId: lesson._id.toString(),
          lessonTitle: lesson.title,
          moduleId: lesson.moduleId.toString(),
          moduleTitle: module?.title ?? "",
        } satisfies CourseLearningLesson;
      }),
    };
  },

  async validateLessonForCourse(courseId: string, lessonId: string): Promise<CourseLearningLesson> {
    if (!Types.ObjectId.isValid(lessonId)) throw Errors.notFound("Lesson");
    const content = await this.loadPublishedCourseContent(courseId);
    const lesson = content.lessons.find((item) => item.lessonId === lessonId);
    if (!lesson) throw Errors.notFound("Lesson");
    return lesson;
  },
};
