import { handleRouteError, jsonOk } from "@/lib/api";
import { requireUserId } from "@/lib/auth/session";
import { connectDb } from "@/lib/db";
import { courseEnrollmentService } from "@/modules/courses/services/course-enrollment.service";

export async function GET() {
  try {
    const userId = await requireUserId();
    await connectDb();
    const enrollments = await courseEnrollmentService.listForUser(userId);
    return jsonOk(enrollments);
  } catch (error) {
    return handleRouteError(error);
  }
}
