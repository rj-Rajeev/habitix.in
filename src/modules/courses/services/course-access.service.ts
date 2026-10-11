import { Errors } from "@/lib/api";
import { connectDb } from "@/lib/db";
import type { ClientSession } from "mongoose";
import { courseRepository } from "../repositories/course.repository";
import { enrollmentRepository } from "../repositories/enrollment.repository";

export async function getCourseAccess(courseId: string, userId?: string, session?: ClientSession) {
  await connectDb();
  const course = await courseRepository.findPublishedForAccess(courseId, session);
  if (!course) throw Errors.notFound("Course");

  if (course.price === 0) {
    return { course, enrollment: null, hasPaidAccess: true };
  }

  const enrollment = userId
    ? await enrollmentRepository.findForUserCourse(userId, courseId, session)
    : null;
  const hasPaidAccess = enrollment?.status === "active" && enrollment.paymentStatus === "paid";
  return { course, enrollment, hasPaidAccess };
}

export async function requireCourseAccess(userId: string, courseId: string, session?: ClientSession) {
  const access = await getCourseAccess(courseId, userId, session);
  if (!access.hasPaidAccess) {
    throw Errors.forbidden();
  }
  return access.enrollment;
}
