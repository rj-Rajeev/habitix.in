import { NextRequest } from "next/server";
import { handleRouteError, jsonOk, Errors } from "@/lib/api";
import { requireAdminUser } from "@/lib/auth/admin";
import { connectDb } from "@/lib/db";
import { isObjectId, lessonUpdateSchema } from "@/lib/courses";
import Course from "@/models/Course";
import CourseModule from "@/models/CourseModule";
import CourseLesson from "@/models/CourseLesson";

async function getIds(params: Promise<{ courseId: string; moduleId: string; lessonId: string }>) {
  const { courseId, moduleId, lessonId } = await params;
  if (!isObjectId(courseId) || !isObjectId(moduleId) || !isObjectId(lessonId)) {
    throw Errors.notFound("Lesson");
  }
  return { courseId, moduleId, lessonId };
}

async function requireLesson(courseId: string, moduleId: string, lessonId: string) {
  const course = await Course.findById(courseId).select("_id");
  if (!course) throw Errors.notFound("Course");
  const module = await CourseModule.findOne({ _id: moduleId, courseId }).select("_id");
  if (!module) throw Errors.notFound("Module");
  const lesson = await CourseLesson.findOne({ _id: lessonId, moduleId });
  if (!lesson) throw Errors.notFound("Lesson");
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; moduleId: string; lessonId: string }> }
) {
  try {
    await requireAdminUser();
    await connectDb();
    const { courseId, moduleId, lessonId } = await getIds(params);
    await requireLesson(courseId, moduleId, lessonId);
    const parsed = lessonUpdateSchema.safeParse(await request.json());
    if (!parsed.success) throw Errors.badRequest("Invalid lesson data", parsed.error.flatten());
    const lesson = await CourseLesson.findOneAndUpdate(
      { _id: lessonId, moduleId },
      parsed.data,
      { new: true, runValidators: true }
    );
    if (!lesson) throw Errors.notFound("Lesson");
    return jsonOk(lesson);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string; moduleId: string; lessonId: string }> }
) {
  try {
    await requireAdminUser();
    await connectDb();
    const { courseId, moduleId, lessonId } = await getIds(params);
    await requireLesson(courseId, moduleId, lessonId);
    await CourseLesson.deleteOne({ _id: lessonId, moduleId });
    return jsonOk({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
