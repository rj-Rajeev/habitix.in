import { Errors } from "@/lib/api";
import { connectDb } from "@/lib/db";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";

export async function requireCourseAccess(userId: string, courseId: string) {
  await connectDb();
  const course = await Course.findOne({ _id: courseId, status: "published", delete: { $ne: true } }).select("price status");
  if (!course) throw Errors.notFound("Course");

  if (course.price === 0) return null;

  const enrollment = await Enrollment.findOne({ userId, courseId });
  if (!enrollment || enrollment.status !== "active" || enrollment.paymentStatus !== "paid") {
    throw Errors.forbidden();
  }
  return enrollment;
}
