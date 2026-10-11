import { NextRequest } from "next/server";
import { Errors, handleRouteError, jsonOk } from "@/lib/api";
import { requireUserId } from "@/lib/auth/session";
import { connectDb } from "@/lib/db";
import { isObjectId } from "@/modules/courses/validation/course.schemas";
import { courseEnrollmentService } from "@/modules/courses/services/course-enrollment.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const userId = await requireUserId();
    await connectDb();
    const { courseId } = await params;
    if (!isObjectId(courseId)) throw Errors.notFound("Course");
    const enrollment = await courseEnrollmentService.getEnrollmentStatus(userId, courseId);
    if (!enrollment) return jsonOk({ enrolled: false });
    return jsonOk({ enrolled: true, status: enrollment.status, paymentStatus: enrollment.paymentStatus, enrolledAt: enrollment.enrolledAt });
  } catch (error) {
    return handleRouteError(error);
  }
}
