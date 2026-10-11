import { NextRequest } from "next/server";
import { handleRouteError, jsonOk, Errors } from "@/lib/api";
import { requireAdminUser } from "@/lib/auth/admin";
import { connectDb } from "@/lib/db";
import { isObjectId, lessonUpdateSchema } from "@/modules/courses/validation/course.schemas";
import { courseAdminService } from "@/modules/courses/services/course-admin.service";

async function getIds(params: Promise<{ courseId: string; moduleId: string; lessonId: string }>) {
  const { courseId, moduleId, lessonId } = await params;
  if (!isObjectId(courseId) || !isObjectId(moduleId) || !isObjectId(lessonId)) {
    throw Errors.notFound("Lesson");
  }
  return { courseId, moduleId, lessonId };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; moduleId: string; lessonId: string }> }
) {
  try {
    await requireAdminUser();
    await connectDb();
    const { courseId, moduleId, lessonId } = await getIds(params);
    await courseAdminService.requireLesson(courseId, moduleId, lessonId);
    const parsed = lessonUpdateSchema.safeParse(await request.json());
    if (!parsed.success) throw Errors.badRequest("Invalid lesson data", parsed.error.flatten());
    const lesson = await courseAdminService.updateLesson(courseId, moduleId, lessonId, parsed.data);
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
    return jsonOk(await courseAdminService.deleteLesson(courseId, moduleId, lessonId));
  } catch (error) {
    return handleRouteError(error);
  }
}
