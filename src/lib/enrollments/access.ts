import { Errors } from "@/lib/api";
import { connectDb } from "@/lib/db";
import { ClientSession } from "mongoose";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";

export async function requireCourseAccess(userId: string, courseId: string, session?: ClientSession) {
  await connectDb();
  const courseQuery = Course.findOne({ _id: courseId, status: "published", delete: { $ne: true } }).select("price status");
  if (session) courseQuery.session(session);
  const course = await courseQuery;
  if (!course) throw Errors.notFound("Course");

  if (course.price === 0) return null;

  const enrollmentQuery = Enrollment.findOne({ userId, courseId });
  if (session) enrollmentQuery.session(session);
  const enrollment = await enrollmentQuery;
  if (!enrollment || enrollment.status !== "active" || enrollment.paymentStatus !== "paid") {
    throw Errors.forbidden();
  }
  return enrollment;
}
