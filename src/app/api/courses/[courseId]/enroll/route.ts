import { NextRequest } from "next/server";
import { Errors, handleRouteError, jsonOk } from "@/lib/api";
import { requireUserId } from "@/lib/auth/session";
import { connectDb } from "@/lib/db";
import { isObjectId } from "@/modules/courses/validation/course.schemas";
import { courseEnrollmentService } from "@/modules/courses/services/course-enrollment.service";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const userId = await requireUserId();
    await connectDb();
    const { courseId } = await params;
    if (!isObjectId(courseId)) throw Errors.notFound("Course");

    const result = await courseEnrollmentService.createEnrollment(userId, courseId);
    const { status, ...body } = result;
    return jsonOk(body, { status: status ?? 200 });
  } catch (error) {
    return handleRouteError(error);
  }
}
