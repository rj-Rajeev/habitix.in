import { NextRequest } from "next/server";
import { handleRouteError, jsonOk, Errors } from "@/lib/api";
import { requireAdminUser } from "@/lib/auth/admin";
import { connectDb } from "@/lib/db";
import { isObjectId, moduleSchema } from "@/modules/courses/validation/course.schemas";
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
    const modules = await courseAdminService.listModules(courseId);
    return jsonOk(modules);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    await requireAdminUser();
    await connectDb();
    const courseId = await getCourseId(params);
    const parsed = moduleSchema.safeParse(await request.json());
    if (!parsed.success) throw Errors.badRequest("Invalid module data", parsed.error.flatten());
    const courseModule = await courseAdminService.createModule(courseId, parsed.data);
    return jsonOk(courseModule, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
