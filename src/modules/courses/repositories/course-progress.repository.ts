import { Types, type ClientSession } from "mongoose";
import CourseLessonProgress from "../models/course-lesson-progress.model";

export const courseProgressRepository = {
  findForLessons(userId: string, courseId: unknown, lessonIds: unknown[], session?: ClientSession) {
    const query = CourseLessonProgress.find({ userId, courseId, lessonId: { $in: lessonIds } });
    if (session) query.session(session);
    return query.select("lessonId").lean();
  },

  recordLessonCompletion(userId: string, courseId: unknown, lessonId: unknown, session?: ClientSession) {
    return CourseLessonProgress.updateOne(
      { userId: new Types.ObjectId(userId), lessonId },
      { $setOnInsert: { courseId, completedAt: new Date() } },
      { upsert: true, ...(session ? { session } : {}) }
    );
  },
};
