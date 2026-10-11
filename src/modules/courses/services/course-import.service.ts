import mongoose from "mongoose";
import { Errors } from "@/lib/api";
import { courseRepository } from "../repositories/course.repository";
import { courseContentRepository } from "../repositories/course-content.repository";
import { validateCourseCsv, type CourseImportData } from "../validation/course-csv";

function isUnsupportedTransaction(error: unknown) {
  const candidate = error as { code?: number; message?: string };
  return [20, 263, 303].includes(candidate?.code ?? -1) ||
    /transaction numbers are only allowed|transactions are not supported|replica set member or mongos/i.test(candidate?.message ?? "");
}

async function inspectCsv(csv: string) {
  const validated = validateCourseCsv(csv);
  if (!validated.data) return { data: null, issues: validated.issues };

  if (await courseRepository.existsBySlug(validated.data.course.slug)) {
    const issue = { message: `Course slug "${validated.data.course.slug}" already exists. Choose another slug or use the existing manual builder.` };
    return { data: null, issues: [issue], duplicate: true as const };
  }

  return { data: validated.data, issues: [] as typeof validated.issues };
}

async function createWithoutTransaction(data: CourseImportData) {
  const course = await courseRepository.create({ ...data.course, status: "draft" });
  const moduleIds: mongoose.Types.ObjectId[] = [];
  try {
    for (const item of data.modules) {
      const courseModule = await courseContentRepository.createModule({
        courseId: course._id,
        title: item.title,
        description: item.description,
        order: item.order,
      });
      moduleIds.push(courseModule._id);
      for (const lesson of item.lessons) {
        await courseContentRepository.createLesson({
          moduleId: courseModule._id,
          title: lesson.title,
          description: lesson.description,
          order: lesson.order,
          markdownContent: lesson.markdownContent,
          videoUrl: lesson.videoUrl,
          pdfUrl: lesson.pdfUrl,
          isFree: lesson.isFree,
        });
      }
    }
    course.status = data.course.status;
    await course.save();
    return course;
  } catch (error) {
    await Promise.allSettled([
      courseContentRepository.deleteImportedLessons(moduleIds),
      courseContentRepository.deleteImportedModules(course._id),
      courseRepository.deleteImportedCourse(course._id),
    ]);
    throw error;
  }
}

export const courseImportService = {
  inspectCsv,

  async importCsv(data: CourseImportData) {
    const session = await mongoose.startSession();
    let importedCourse;
    try {
      try {
        await session.withTransaction(async () => {
          const course = await courseRepository.create({ ...data.course }, session);
          for (const item of data.modules) {
            const courseModule = await courseContentRepository.createModule({
              courseId: course._id,
              title: item.title,
              description: item.description,
              order: item.order,
            }, session);
            for (const lesson of item.lessons) {
              await courseContentRepository.createLesson({
                moduleId: courseModule._id,
                title: lesson.title,
                description: lesson.description,
                order: lesson.order,
                markdownContent: lesson.markdownContent,
                videoUrl: lesson.videoUrl,
                pdfUrl: lesson.pdfUrl,
                isFree: lesson.isFree,
              }, session);
            }
          }
          importedCourse = course;
        });
      } catch (error) {
        if (!isUnsupportedTransaction(error)) throw error;
        importedCourse = await createWithoutTransaction(data);
      }
    } finally {
      await session.endSession();
    }
    return importedCourse;
  },

  async validateImportCsv(csv: string) {
    const result = await inspectCsv(csv);
    if (!result.data) {
      if ("duplicate" in result && result.duplicate) {
        throw Errors.conflict(result.issues[0].message);
      }
      throw Errors.badRequest("CSV cannot be imported.", result.issues);
    }
    return result.data;
  },
};
