import { NextRequest } from "next/server";
import { handleRouteError, jsonOk, Errors } from "@/lib/api";
import { requireAdminUser } from "@/lib/auth/admin";
import { connectDb } from "@/lib/db";
import { isObjectId, moduleUpdateSchema } from "@/lib/courses";
import Course from "@/models/Course";
import CourseModule from "@/models/CourseModule";
import CourseLesson from "@/models/CourseLesson";

async function getIds(params: Promise<{ courseId: string; moduleId: string }>) {
  const { courseId, moduleId } = await params;
  if (!isObjectId(courseId) || !isObjectId(moduleId)) throw Errors.notFound("Module");
  return { courseId, moduleId };
}

async function requireModule(courseId: string, moduleId: string) {
  const course = await Course.findOne({ _id: courseId, delete: { $ne: true } }).select("_id");
  if (!course) throw Errors.notFound("Course");
  const module = await CourseModule.findOne({ _id: moduleId, courseId });
  if (!module) throw Errors.notFound("Module");
  return module;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; moduleId: string }> }
) {
  try {
    await requireAdminUser();
    await connectDb();
    const { courseId, moduleId } = await getIds(params);
    await requireModule(courseId, moduleId);
    const parsed = moduleUpdateSchema.safeParse(await request.json());
    if (!parsed.success) throw Errors.badRequest("Invalid module data", parsed.error.flatten());
    const module = await CourseModule.findOneAndUpdate(
      { _id: moduleId, courseId },
      parsed.data,
      { new: true, runValidators: true }
    );
    if (!module) throw Errors.notFound("Module");
    return jsonOk(module);
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
    await requireModule(courseId, moduleId);
    await CourseLesson.deleteMany({ moduleId });
    await CourseModule.deleteOne({ _id: moduleId, courseId });
    return jsonOk({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
