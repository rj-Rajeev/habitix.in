import { NextRequest } from "next/server";
import { handleRouteError, jsonOk, Errors } from "@/lib/api";
import { requireAdminUser } from "@/lib/auth/admin";
import { connectDb } from "@/lib/db";
import { courseCreateSchema } from "@/modules/courses/validation/course.schemas";
import { courseAdminService } from "@/modules/courses/services/course-admin.service";

export async function GET() {
  try {
    await requireAdminUser();
    const courses = await courseAdminService.listCourses();
    return jsonOk(courses);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminUser();
    await connectDb();
    const parsed = courseCreateSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw Errors.badRequest("Invalid course data", parsed.error.flatten());
    }

    const course = await courseAdminService.createCourse(parsed.data);
    return jsonOk(course, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
