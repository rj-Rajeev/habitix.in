import { NextRequest } from "next/server";
import { handleRouteError, jsonOk, Errors } from "@/lib/api";
import { requireAdminUser } from "@/lib/auth/admin";
import { connectDb } from "@/lib/db";
import { isObjectId, lessonSchema } from "@/modules/courses/validation/course.schemas";
import { courseAdminService } from "@/modules/courses/services/course-admin.service";

async function getIds(params: Promise<{ courseId: string; moduleId: string }>) {
  const { courseId, moduleId } = await params;
  if (!isObjectId(courseId) || !isObjectId(moduleId)) throw Errors.notFound("Module");
  return { courseId, moduleId };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string; moduleId: string }> }
) {
  try {
    await requireAdminUser();
    await connectDb();
    const { courseId, moduleId } = await getIds(params);
    const lessons = await courseAdminService.listLessons(courseId, moduleId);
    return jsonOk(lessons);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; moduleId: string }> }
) {
  try {
    await requireAdminUser();
    await connectDb();
    const { courseId, moduleId } = await getIds(params);
    const parsed = lessonSchema.safeParse(await request.json());
    if (!parsed.success) throw Errors.badRequest("Invalid lesson data", parsed.error.flatten());
    const lesson = await courseAdminService.createLesson(courseId, moduleId, parsed.data);
    return jsonOk(lesson, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
