import { Errors } from "@/lib/api";
import { courseRepository } from "../repositories/course.repository";
import { enrollmentRepository } from "../repositories/enrollment.repository";
import { createEnrollmentPayment, getPaymentKeyId, verifyEnrollmentPayment } from "../integrations/razorpay";

export const courseEnrollmentService = {
  async createEnrollment(userId: string, courseId: string) {
    const course = await courseRepository.findPublishedById(courseId);
    if (!course) throw Errors.notFound("Course");

    const existing = await enrollmentRepository.findByUserAndCourse(userId, courseId);
    if (existing?.status === "active") throw Errors.conflict("You are already enrolled in this course");
    if (existing?.status === "pending") {
      return {
        enrollment: existing,
        requiresPayment: true,
        payment: existing.paymentOrderId
          ? { provider: existing.paymentProvider, keyId: getPaymentKeyId(), orderId: existing.paymentOrderId, amount: Math.round(course.price * 100), currency: "INR" }
          : null,
      };
    }

    if (course.price === 0) {
      try {
        const enrollment = existing
          ? await enrollmentRepository.updateById(existing._id.toString(), {
              status: "active", paymentStatus: "paid", enrolledAt: new Date(),
            })
          : await enrollmentRepository.create({ userId, courseId, status: "active", paymentStatus: "paid" });
        return { enrollment, requiresPayment: false, status: existing ? 200 : 201 };
      } catch (error) {
        if ((error as { code?: number }).code === 11000) throw Errors.conflict("You are already enrolled in this course");
        throw error;
      }
    }

    const payment = await createEnrollmentPayment(courseId, course.price);
    try {
      const enrollment = existing
        ? await enrollmentRepository.updateById(existing._id.toString(), {
            status: "pending", paymentStatus: "pending", paymentProvider: payment.provider, paymentOrderId: payment.orderId,
          })
        : await enrollmentRepository.create({
            userId,
            courseId,
            status: "pending",
            paymentStatus: "pending",
            paymentProvider: payment.provider,
            paymentOrderId: payment.orderId,
          });
      return {
        enrollment,
        requiresPayment: true,
        payment: { provider: payment.provider, keyId: payment.keyId, orderId: payment.orderId, amount: payment.amount, currency: payment.currency },
        status: existing ? 200 : 201,
      };
    } catch (error) {
      if ((error as { code?: number }).code === 11000) throw Errors.conflict("An enrollment already exists for this course");
      throw error;
    }
  },

  async confirmPayment(userId: string, courseId: string, input: { paymentId: string; signature: string; orderId: string }) {
    const course = await courseRepository.findPublishedById(courseId);
    if (!course) throw Errors.notFound("Course");
    const enrollment = await enrollmentRepository.findByUserAndCourse(userId, courseId);
    if (!enrollment) throw Errors.notFound("Enrollment");
    if (enrollment.status === "active" && enrollment.paymentStatus === "paid") return { enrollment };
    if (enrollment.status !== "pending" || enrollment.paymentOrderId !== input.orderId) {
      throw Errors.badRequest("Enrollment is not awaiting this payment");
    }

    let verified = false;
    try {
      verified = verifyEnrollmentPayment(input);
    } catch {
      verified = false;
    }
    if (!verified) {
      enrollment.paymentStatus = "failed";
      await enrollmentRepository.save(enrollment);
      throw Errors.badRequest("Payment verification failed");
    }

    enrollment.paymentStatus = "paid";
    enrollment.status = "active";
    enrollment.paymentId = input.paymentId;
    await enrollmentRepository.save(enrollment);
    return { enrollment };
  },

  getEnrollmentStatus(userId: string, courseId: string) {
    return enrollmentRepository.findStatusForUser(userId, courseId);
  },

  listForUser(userId: string) {
    return enrollmentRepository.listForUser(userId);
  },
};
