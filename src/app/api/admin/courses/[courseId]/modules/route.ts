import { NextRequest } from "next/server";
import { handleRouteError, jsonOk, Errors } from "@/lib/api";
import { requireAdminUser } from "@/lib/auth/admin";
import { connectDb } from "@/lib/db";
import { isObjectId, moduleSchema } from "@/lib/courses";
import Course from "@/models/Course";
import CourseModule from "@/models/CourseModule";

async function getCourseId(params: Promise<{ courseId: string }>) {
  const { courseId } = await params;
  if (!isObjectId(courseId)) throw Errors.notFound("Course");
  return courseId;
}

async function requireCourse(courseId: string) {
  const course = await Course.findById(courseId).select("_id");
  if (!course) throw Errors.notFound("Course");
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    await requireAdminUser();
    await connectDb();
    const courseId = await getCourseId(params);
    await requireCourse(courseId);
    const modules = await CourseModule.find({ courseId }).sort({ order: 1, createdAt: 1 });
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
    await requireCourse(courseId);
    const parsed = moduleSchema.safeParse(await request.json());
    if (!parsed.success) throw Errors.badRequest("Invalid module data", parsed.error.flatten());
    const module = await CourseModule.create({ ...parsed.data, courseId });
    return jsonOk(module, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
