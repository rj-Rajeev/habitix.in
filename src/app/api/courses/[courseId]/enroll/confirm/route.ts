import { NextRequest } from "next/server";
import { Errors, handleRouteError, jsonOk } from "@/lib/api";
import { requireUserId } from "@/lib/auth/session";
import { connectDb } from "@/lib/db";
import { isObjectId } from "@/lib/courses";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";
import { verifyEnrollmentPayment } from "@/lib/payments/razorpay";

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

    const course = await Course.findOne({ _id: courseId, status: "published" }).select("_id price");
    if (!course) throw Errors.notFound("Course");
    const enrollment = await Enrollment.findOne({ userId, courseId });
    if (!enrollment) throw Errors.notFound("Enrollment");
    if (enrollment.status === "active" && enrollment.paymentStatus === "paid") return jsonOk({ enrollment });
    if (enrollment.status !== "pending" || enrollment.paymentOrderId !== orderId) {
      throw Errors.badRequest("Enrollment is not awaiting this payment");
    }

    let verified = false;
    try {
      verified = verifyEnrollmentPayment({ orderId, paymentId, signature });
    } catch {
      verified = false;
    }
    if (!verified) {
      enrollment.paymentStatus = "failed";
      await enrollment.save();
      throw Errors.badRequest("Payment verification failed");
    }

    enrollment.paymentStatus = "paid";
    enrollment.status = "active";
    enrollment.paymentId = paymentId;
    await enrollment.save();
    return jsonOk({ enrollment });
  } catch (error) {
    return handleRouteError(error);
  }
}
