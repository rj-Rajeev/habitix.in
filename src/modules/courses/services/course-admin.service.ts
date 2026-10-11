import { Errors } from "@/lib/api";
import { normalizeSlug } from "../validation/course.schemas";
import { courseRepository } from "../repositories/course.repository";
import { courseContentRepository } from "../repositories/course-content.repository";

export const courseAdminService = {
  listCourses() {
    return courseRepository.listForAdmin();
  },

  async createCourse(data: Record<string, unknown>) {
    const slug = normalizeSlug(String(data.slug ?? ""));
    if (!slug) throw Errors.badRequest("Slug must contain letters or numbers");
    try {
      return await courseRepository.create({ ...data, slug, status: "draft" });
    } catch (error) {
      if ((error as { code?: number }).code === 11000) throw Errors.conflict("A course with this slug already exists");
      throw error;
    }
  },

  async getCourse(courseId: string) {
    const course = await courseRepository.findForAdmin(courseId);
    if (!course) throw Errors.notFound("Course");
    return course;
  },

  async updateCourse(courseId: string, input: Record<string, unknown>) {
    const update = { ...input };
    if (typeof update.slug === "string") {
      update.slug = normalizeSlug(update.slug);
      if (!update.slug) throw Errors.badRequest("Slug must contain letters or numbers");
    }
    try {
      const course = await courseRepository.updateById(courseId, update);
      if (!course) throw Errors.notFound("Course");
      return course;
    } catch (error) {
      if ((error as { code?: number }).code === 11000) throw Errors.conflict("A course with this slug already exists");
      throw error;
    }
  },

  async archiveCourse(courseId: string) {
    const course = await courseRepository.deleteById(courseId);
    if (!course) throw Errors.notFound("Course");
    return { deleted: true, archived: true };
  },

  async setCourseStatus(courseId: string, status: "draft" | "published") {
    const course = await courseRepository.updateStatus(courseId, status);
    if (!course) throw Errors.notFound("Course");
    return course;
  },

  async listModules(courseId: string) {
    await this.requireCourse(courseId);
    return courseContentRepository.findModulesForAdmin(courseId);
  },

  async createModule(courseId: string, data: Record<string, unknown>) {
    await this.requireCourse(courseId);
    return courseContentRepository.createModule({ ...data, courseId });
  },

  async updateModule(courseId: string, moduleId: string, data: Record<string, unknown>) {
    await this.requireModule(courseId, moduleId);
    const updated = await courseContentRepository.updateModule(courseId, moduleId, data);
    if (!updated) throw Errors.notFound("Module");
    return updated;
  },

  async deleteModule(courseId: string, moduleId: string) {
    await this.requireModule(courseId, moduleId);
    await courseContentRepository.deleteModuleAndLessons(courseId, moduleId);
    return { deleted: true };
  },

  async listLessons(courseId: string, moduleId: string) {
    await this.requireModule(courseId, moduleId);
    return courseContentRepository.findLessonsForModule(moduleId);
  },

  async createLesson(courseId: string, moduleId: string, data: Record<string, unknown>) {
    await this.requireModule(courseId, moduleId);
    return courseContentRepository.createLesson({ ...data, moduleId });
  },

  async updateLesson(courseId: string, moduleId: string, lessonId: string, data: Record<string, unknown>) {
    await this.requireLesson(courseId, moduleId, lessonId);
    const lesson = await courseContentRepository.updateLesson(moduleId, lessonId, data);
    if (!lesson) throw Errors.notFound("Lesson");
    return lesson;
  },

  async deleteLesson(courseId: string, moduleId: string, lessonId: string) {
    await this.requireLesson(courseId, moduleId, lessonId);
    await courseContentRepository.deleteLesson(moduleId, lessonId);
    return { deleted: true };
  },

  async requireCourse(courseId: string) {
    const course = await courseRepository.findForAdmin(courseId);
    if (!course) throw Errors.notFound("Course");
    return course;
  },

  async requireModule(courseId: string, moduleId: string) {
    await this.requireCourse(courseId);
    const courseModule = await courseContentRepository.findModule(courseId, moduleId);
    if (!courseModule) throw Errors.notFound("Module");
    return courseModule;
  },

  async requireLesson(courseId: string, moduleId: string, lessonId: string) {
    await this.requireModule(courseId, moduleId);
    const lesson = await courseContentRepository.findLesson(moduleId, lessonId);
    if (!lesson) throw Errors.notFound("Lesson");
    return lesson;
  },
};
