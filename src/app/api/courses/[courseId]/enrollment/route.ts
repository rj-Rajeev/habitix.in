import { NextRequest } from "next/server";
import { Errors, handleRouteError, jsonOk } from "@/lib/api";
import { requireUserId } from "@/lib/auth/session";
import { connectDb } from "@/lib/db";
import { isObjectId } from "@/lib/courses";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const userId = await requireUserId();
    await connectDb();
    const { courseId } = await params;
    if (!isObjectId(courseId)) throw Errors.notFound("Course");
    const course = await Course.findOne({ _id: courseId, status: "published" }).select("_id");
    if (!course) throw Errors.notFound("Course");
    const enrollment = await Enrollment.findOne({ userId, courseId }).select("status paymentStatus enrolledAt");
    if (!enrollment) return jsonOk({ enrolled: false });
    return jsonOk({ enrolled: true, status: enrollment.status, paymentStatus: enrollment.paymentStatus, enrolledAt: enrollment.enrolledAt });
  } catch (error) {
    return handleRouteError(error);
  }
}
