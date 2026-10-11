import { NextRequest } from "next/server";
import { handleRouteError, jsonOk, Errors } from "@/lib/api";
import { requireAdminUser } from "@/lib/auth/admin";
import { connectDb } from "@/lib/db";
import { courseUpdateSchema, isObjectId } from "@/modules/courses/validation/course.schemas";
import { courseAdminService } from "@/modules/courses/services/course-admin.service";

async function getCourseId(params: Promise<{ courseId: string }>) {
  const { courseId } = await params;
  if (!isObjectId(courseId)) throw Errors.notFound("Course");
  return courseId;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    await requireAdminUser();
    await connectDb();
    const courseId = await getCourseId(params);
    const course = await courseAdminService.getCourse(courseId);
    return jsonOk(course);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    await requireAdminUser();
    await connectDb();
    const courseId = await getCourseId(params);
    const parsed = courseUpdateSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw Errors.badRequest("Invalid course data", parsed.error.flatten());
    }

    const course = await courseAdminService.updateCourse(courseId, parsed.data);
    return jsonOk(course);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    await requireAdminUser();
    await connectDb();
    const courseId = await getCourseId(params);
    return jsonOk(await courseAdminService.archiveCourse(courseId));
  } catch (error) {
    return handleRouteError(error);
  }
}
