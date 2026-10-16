import type { ClientSession, Types } from "mongoose";
import CourseLesson from "../models/course-lesson.model";
import CourseModule from "../models/course-module.model";

export const courseContentRepository = {
  findModulesForSitemap(courseIds: unknown[]) {
    return CourseModule.find({ courseId: { $in: courseIds } })
      .select("_id courseId")
      .lean<Array<{ _id: Types.ObjectId; courseId: Types.ObjectId }>>();
  },

  findLessonSlugsForSitemap(moduleIds: unknown[]) {
    return CourseLesson.find({
      moduleId: { $in: moduleIds },
      lessonSlug: { $type: "string", $ne: "" },
    })
      .select("moduleId lessonSlug")
      .lean<Array<{ moduleId: Types.ObjectId; lessonSlug?: string }>>();
  },

  findModulesByCourse(courseId: unknown) {
    return CourseModule.find({ courseId }).sort({ order: 1, createdAt: 1 });
  },

  findLessonsByModuleIds(moduleIds: unknown[]) {
    return CourseLesson.find({ moduleId: { $in: moduleIds } })
      .sort({ moduleId: 1, order: 1, createdAt: 1 });
  },

  findLessonsForCoursePage(moduleIds: unknown[]) {
    return CourseLesson.find({ moduleId: { $in: moduleIds } })
      .select("-courseId")
      .sort({ order: 1, createdAt: 1 });
  },

  findModulesForProgress(courseId: unknown, session?: ClientSession) {
    const query = CourseModule.find({ courseId }).select("_id");
    if (session) query.session(session);
    return query.lean();
  },

  findLessonsForProgress(moduleIds: unknown[], session?: ClientSession) {
    const query = CourseLesson.find({ moduleId: { $in: moduleIds } }).select("_id");
    if (session) query.session(session);
    return query.lean();
  },

  findLessonForProgress(lessonId: string, session?: ClientSession) {
    const query = CourseLesson.findById(lessonId).select("moduleId");
    if (session) query.session(session);
    return query;
  },

  findModuleForProgress(courseId: unknown, moduleId: unknown, session?: ClientSession) {
    const query = CourseModule.findOne({ _id: moduleId, courseId }).select("_id");
    if (session) query.session(session);
    return query;
  },

  findModule(courseId: string, moduleId: string) {
    return CourseModule.findOne({ _id: moduleId, courseId });
  },

  findModulesForAdmin(courseId: string) {
    return CourseModule.find({ courseId }).sort({ order: 1, createdAt: 1 });
  },

  createModule(data: Record<string, unknown>, session?: ClientSession) {
    if (!session) return CourseModule.create(data);
    return CourseModule.create([data], { session }).then(([module]) => module);
  },

  updateModule(courseId: string, moduleId: string, data: Record<string, unknown>) {
    return CourseModule.findOneAndUpdate({ _id: moduleId, courseId }, data, { new: true, runValidators: true });
  },

  async deleteModuleAndLessons(courseId: string, moduleId: string) {
    await CourseLesson.deleteMany({ moduleId });
    await CourseModule.deleteOne({ _id: moduleId, courseId });
  },

  findLessonsForModule(moduleId: string) {
    return CourseLesson.find({ moduleId }).sort({ order: 1, createdAt: 1 });
  },

  findLesson(moduleId: string, lessonId: string) {
    return CourseLesson.findOne({ _id: lessonId, moduleId });
  },

  lessonSlugExists(courseId: unknown, lessonSlug: string, session?: ClientSession) {
    const query = CourseLesson.exists({ courseId, lessonSlug });
    if (session) query.session(session);
    return query;
  },

  createLesson(data: Record<string, unknown>, session?: ClientSession) {
    if (!session) return CourseLesson.create(data);
    return CourseLesson.create([data], { session }).then(([lesson]) => lesson);
  },

  updateLesson(moduleId: string, lessonId: string, data: Record<string, unknown>) {
    return CourseLesson.findOneAndUpdate({ _id: lessonId, moduleId }, data, { new: true, runValidators: true });
  },

  deleteLesson(moduleId: string, lessonId: string) {
    return CourseLesson.deleteOne({ _id: lessonId, moduleId });
  },

  deleteImportedLessons(moduleIds: unknown[]) {
    return CourseLesson.deleteMany({ moduleId: { $in: moduleIds } });
  },

  deleteImportedModules(courseId: unknown) {
    return CourseModule.deleteMany({ courseId });
  },
};
