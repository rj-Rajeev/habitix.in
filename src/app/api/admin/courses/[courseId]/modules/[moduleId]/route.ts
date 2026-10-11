import { NextRequest } from "next/server";
import { handleRouteError, jsonOk, Errors } from "@/lib/api";
import { requireAdminUser } from "@/lib/auth/admin";
import { connectDb } from "@/lib/db";
import { isObjectId, moduleUpdateSchema } from "@/modules/courses/validation/course.schemas";
import { courseAdminService } from "@/modules/courses/services/course-admin.service";

async function getIds(params: Promise<{ courseId: string; moduleId: string }>) {
  const { courseId, moduleId } = await params;
  if (!isObjectId(courseId) || !isObjectId(moduleId)) throw Errors.notFound("Module");
  return { courseId, moduleId };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; moduleId: string }> }
) {
  try {
    await requireAdminUser();
    await connectDb();
    const { courseId, moduleId } = await getIds(params);
    await courseAdminService.requireModule(courseId, moduleId);
    const parsed = moduleUpdateSchema.safeParse(await request.json());
    if (!parsed.success) throw Errors.badRequest("Invalid module data", parsed.error.flatten());
    const courseModule = await courseAdminService.updateModule(courseId, moduleId, parsed.data);
    return jsonOk(courseModule);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string; moduleId: string }> }
) {
  try {
    await requireAdminUser();
    await connectDb();
    const { courseId, moduleId } = await getIds(params);
    return jsonOk(await courseAdminService.deleteModule(courseId, moduleId));
  } catch (error) {
    return handleRouteError(error);
  }
}
