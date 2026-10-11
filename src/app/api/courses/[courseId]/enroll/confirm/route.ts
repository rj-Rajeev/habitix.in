import { NextRequest } from "next/server";
import { Errors, handleRouteError, jsonOk } from "@/lib/api";
import { requireUserId } from "@/lib/auth/session";
import { connectDb } from "@/lib/db";
import { isObjectId } from "@/modules/courses/validation/course.schemas";
import { courseEnrollmentService } from "@/modules/courses/services/course-enrollment.service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const userId = await requireUserId();
    await connectDb();
    const { courseId } = await params;
    if (!isObjectId(courseId)) throw Errors.notFound("Course");

    const body = await request.json().catch(() => null);
    const paymentId = typeof body?.paymentId === "string" ? body.paymentId : "";
    const signature = typeof body?.signature === "string" ? body.signature : "";
    const orderId = typeof body?.orderId === "string" ? body.orderId : "";
    if (!paymentId || !signature || !orderId) throw Errors.badRequest("Payment confirmation is incomplete");

    return jsonOk(await courseEnrollmentService.confirmPayment(userId, courseId, { paymentId, orderId, signature }));
  } catch (error) {
    return handleRouteError(error);
  }
}
