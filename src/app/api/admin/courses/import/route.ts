import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { handleRouteError, jsonOk, Errors } from "@/lib/api";
import { requireAdminUser } from "@/lib/auth/admin";
import { connectDb } from "@/lib/db";
import { validateCourseCsv } from "@/lib/course-csv";
import Course from "@/models/Course";
import CourseModule from "@/models/CourseModule";
import CourseLesson from "@/models/CourseLesson";

function isUnsupportedTransaction(error: unknown) {
  const candidate = error as { code?: number; message?: string };
  return [20, 263, 303].includes(candidate?.code ?? -1) ||
    /transaction numbers are only allowed|transactions are not supported|replica set member or mongos/i.test(candidate?.message ?? "");
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminUser();
    await connectDb();
    const body = await request.json().catch(() => null) as { csv?: unknown; action?: unknown } | null;
    if (typeof body?.csv !== "string" || body.csv.length === 0) throw Errors.badRequest("Choose a non-empty CSV file.");
    if (body.csv.length > 10_000_000) throw Errors.badRequest("CSV file must be smaller than 10 MB.");
    if (body.action !== "preview" && body.action !== "import") throw Errors.badRequest("Unsupported import action.");

    const validated = validateCourseCsv(body.csv);
    if (!validated.data) {
      if (body.action === "import") throw Errors.badRequest("CSV cannot be imported.", validated.issues);
      return jsonOk({ data: null, issues: validated.issues });
    }
    const data = validated.data;
    if (await Course.exists({ slug: data.course.slug })) {
      const issue = { message: `Course slug "${data.course.slug}" already exists. Choose another slug or use the existing manual builder.` };
      if (body.action === "import") throw Errors.conflict(issue.message);
      return jsonOk({ data: null, issues: [issue] });
    }
    if (body.action === "preview") return jsonOk({ data, issues: [] });

    const createWithoutTransaction = async () => {
      const course = await Course.create({ ...data.course, status: "draft" });
      const moduleIds: mongoose.Types.ObjectId[] = [];
      try {
        for (const item of data.modules) {
          const module = await CourseModule.create({ courseId: course._id, title: item.title, description: item.description, order: item.order });
          moduleIds.push(module._id);
          for (const lesson of item.lessons) {
            await CourseLesson.create({
              moduleId: module._id,
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
          CourseLesson.deleteMany({ moduleId: { $in: moduleIds } }),
          CourseModule.deleteMany({ courseId: course._id }),
          Course.deleteOne({ _id: course._id }),
        ]);
        throw error;
      }
    };

    let importedCourse;
    const session = await mongoose.startSession();
    try {
      try {
        await session.withTransaction(async () => {
          const [course] = await Course.create([{ ...data.course }], { session });
          for (const item of data.modules) {
            const [module] = await CourseModule.create([{
              courseId: course._id,
              title: item.title,
              description: item.description,
              order: item.order,
            }], { session });
            for (const lesson of item.lessons) {
              await CourseLesson.create([{
                moduleId: module._id,
                title: lesson.title,
                description: lesson.description,
                order: lesson.order,
                markdownContent: lesson.markdownContent,
                videoUrl: lesson.videoUrl,
                pdfUrl: lesson.pdfUrl,
                isFree: lesson.isFree,
              }], { session });
            }
          }
          importedCourse = course;
        });
      } catch (error) {
        if (!isUnsupportedTransaction(error)) throw error;
        importedCourse = await createWithoutTransaction();
      }
    } finally {
      await session.endSession();
    }

    return jsonOk({
      course: importedCourse,
      moduleCount: data.modules.length,
      lessonCount: data.lessonCount,
      freeLessonCount: data.freeLessonCount,
    }, { status: 201 });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      return handleRouteError(Errors.conflict("A course with this slug already exists. Choose another slug or use the existing manual builder."));
    }
    return handleRouteError(error);
  }
}
