import { NextRequest } from "next/server";
import { handleRouteError, jsonOk, Errors } from "@/lib/api";
import { requireAdminUser } from "@/lib/auth/admin";
import { connectDb } from "@/lib/db";
import { isObjectId, lessonSchema } from "@/lib/courses";
import Course from "@/models/Course";
import CourseModule from "@/models/CourseModule";
import CourseLesson from "@/models/CourseLesson";

async function getIds(params: Promise<{ courseId: string; moduleId: string }>) {
  const { courseId, moduleId } = await params;
  if (!isObjectId(courseId) || !isObjectId(moduleId)) throw Errors.notFound("Module");
  return { courseId, moduleId };
}

async function requireModule(courseId: string, moduleId: string) {
  const course = await Course.findById(courseId).select("_id");
  if (!course) throw Errors.notFound("Course");
  const module = await CourseModule.findOne({ _id: moduleId, courseId }).select("_id");
  if (!module) throw Errors.notFound("Module");
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string; moduleId: string }> }
) {
  try {
    await requireAdminUser();
    await connectDb();
    const { courseId, moduleId } = await getIds(params);
    await requireModule(courseId, moduleId);
    const lessons = await CourseLesson.find({ moduleId }).sort({ order: 1, createdAt: 1 });
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
    await requireModule(courseId, moduleId);
    const parsed = lessonSchema.safeParse(await request.json());
    if (!parsed.success) throw Errors.badRequest("Invalid lesson data", parsed.error.flatten());
    const lesson = await CourseLesson.create({ ...parsed.data, moduleId });
    return jsonOk(lesson, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
