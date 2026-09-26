import { NextRequest } from "next/server";
import { Errors, handleRouteError, jsonOk } from "@/lib/api";
import { requireUserId } from "@/lib/auth/session";
import { connectDb } from "@/lib/db";
import { isObjectId } from "@/lib/courses";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";
import { createEnrollmentPayment, getPaymentKeyId } from "@/lib/payments/razorpay";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const userId = await requireUserId();
    await connectDb();
    const { courseId } = await params;
    if (!isObjectId(courseId)) throw Errors.notFound("Course");

    const course = await Course.findOne({ _id: courseId, status: "published", delete: { $ne: true } });
    if (!course) throw Errors.notFound("Course");

    const existing = await Enrollment.findOne({ userId, courseId });
    if (existing?.status === "active") throw Errors.conflict("You are already enrolled in this course");
    if (existing?.status === "pending") {
      return jsonOk({
        enrollment: existing,
        requiresPayment: true,
        payment: existing.paymentOrderId
          ? { provider: existing.paymentProvider, keyId: getPaymentKeyId(), orderId: existing.paymentOrderId, amount: Math.round(course.price * 100), currency: "INR" }
          : null,
      });
    }

    if (course.price === 0) {
      let enrollment;
      try {
        enrollment = existing
          ? await Enrollment.findOneAndUpdate(
              { _id: existing._id },
              { status: "active", paymentStatus: "paid", enrolledAt: new Date() },
              { new: true }
            )
          : await Enrollment.create({ userId, courseId, status: "active", paymentStatus: "paid" });
      } catch (error) {
        if ((error as { code?: number }).code === 11000) throw Errors.conflict("You are already enrolled in this course");
        throw error;
      }
      return jsonOk({ enrollment, requiresPayment: false }, { status: existing ? 200 : 201 });
    }

    const payment = await createEnrollmentPayment(courseId, course.price);
    let enrollment;
    try {
      enrollment = existing
        ? await Enrollment.findOneAndUpdate(
            { _id: existing._id },
            { status: "pending", paymentStatus: "pending", paymentProvider: payment.provider, paymentOrderId: payment.orderId },
            { new: true }
          )
        : await Enrollment.create({
            userId,
            courseId,
            status: "pending",
            paymentStatus: "pending",
            paymentProvider: payment.provider,
            paymentOrderId: payment.orderId,
          });
    } catch (error) {
      if ((error as { code?: number }).code === 11000) throw Errors.conflict("An enrollment already exists for this course");
      throw error;
    }

    return jsonOk({
      enrollment,
      requiresPayment: true,
      payment: { provider: payment.provider, keyId: payment.keyId, orderId: payment.orderId, amount: payment.amount, currency: payment.currency },
    }, { status: existing ? 200 : 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
