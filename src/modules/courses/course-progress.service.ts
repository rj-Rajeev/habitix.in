import { ClientSession, Types } from "mongoose";
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

async function findPublishedCourse(courseId: string, session?: ClientSession) {
  const query = Course.findOne({ _id: courseId, status: "published", delete: { $ne: true } }).select("_id");
  if (session) query.session(session);
  const course = await query;
  if (!course) throw Errors.notFound("Course");
  return course;
}

export const courseProgressService = {
  async getCourseProgress(userId: string, courseId: string, session?: ClientSession): Promise<CourseProgress> {
    const course = await findPublishedCourse(courseId, session);
    const modulesQuery = CourseModule.find({ courseId: course._id }).select("_id");
    if (session) modulesQuery.session(session);
    const modules = await modulesQuery.lean();
    const lessonsQuery = CourseLesson.find({ moduleId: { $in: modules.map((module) => module._id) } }).select("_id");
    if (session) lessonsQuery.session(session);
    const lessons = await lessonsQuery.lean();
    const lessonIds = lessons.map((lesson) => lesson._id);
    const progress = lessonIds.length
      ? await (session
          ? CourseLessonProgress.find({ userId, courseId: course._id, lessonId: { $in: lessonIds } }).session(session)
          : CourseLessonProgress.find({ userId, courseId: course._id, lessonId: { $in: lessonIds } }))
          .select("lessonId").lean()
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
    const lessonQuery = CourseLesson.findById(lessonId).select("moduleId");
    if (session) lessonQuery.session(session);
    const lesson = await lessonQuery;
    if (!lesson) throw Errors.notFound("Lesson");

    const moduleQuery = CourseModule.findOne({ _id: lesson.moduleId, courseId: course._id }).select("_id");
    if (session) moduleQuery.session(session);
    const courseModule = await moduleQuery;
    if (!courseModule) throw Errors.notFound("Lesson");

    await requireCourseAccess(userId, course._id.toString(), session);

    try {
      await CourseLessonProgress.updateOne(
        { userId: new Types.ObjectId(userId), lessonId: lesson._id },
        { $setOnInsert: { courseId: course._id, completedAt: new Date() } },
        { upsert: true, ...(session ? { session } : {}) }
      );
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
