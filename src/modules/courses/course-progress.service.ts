import { Types } from "mongoose";
import { Errors } from "@/lib/api";
import { requireCourseAccess } from "@/lib/enrollments/access";
import Course from "@/models/Course";
import CourseLesson from "@/models/CourseLesson";
import CourseModule from "@/models/CourseModule";
import CourseLessonProgress from "@/models/CourseLessonProgress";

type CourseProgress = {
  completedLessonIds: string[];
  completedCount: number;
  totalCount: number;
  percentage: number;
};

async function findPublishedCourse(courseId: string) {
  const course = await Course.findOne({ _id: courseId, status: "published", delete: { $ne: true } }).select("_id");
  if (!course) throw Errors.notFound("Course");
  return course;
}

export const courseProgressService = {
  async getCourseProgress(userId: string, courseId: string): Promise<CourseProgress> {
    const course = await findPublishedCourse(courseId);
    const modules = await CourseModule.find({ courseId: course._id }).select("_id").lean();
    const lessons = await CourseLesson.find({ moduleId: { $in: modules.map((module) => module._id) } })
      .select("_id")
      .lean();
    const lessonIds = lessons.map((lesson) => lesson._id);
    const progress = lessonIds.length
      ? await CourseLessonProgress.find({ userId, courseId: course._id, lessonId: { $in: lessonIds } })
          .select("lessonId")
          .lean()
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

  async completeLesson(userId: string, courseId: string, lessonId: string): Promise<CourseProgress> {
    const course = await findPublishedCourse(courseId);
    const lesson = await CourseLesson.findById(lessonId).select("moduleId");
    if (!lesson) throw Errors.notFound("Lesson");

    const courseModule = await CourseModule.findOne({ _id: lesson.moduleId, courseId: course._id }).select("_id");
    if (!courseModule) throw Errors.notFound("Lesson");

    await requireCourseAccess(userId, course._id.toString());

    try {
      await CourseLessonProgress.updateOne(
        { userId: new Types.ObjectId(userId), lessonId: lesson._id },
        { $setOnInsert: { courseId: course._id, completedAt: new Date() } },
        { upsert: true }
      );
    } catch (error) {
      // A simultaneous idempotent upsert can race on the unique user/lesson index.
      if (!(error && typeof error === "object" && "code" in error && error.code === 11000)) throw error;
    }

    return this.getCourseProgress(userId, course._id.toString());
  },
};
