import { handleRouteError, jsonOk } from "@/lib/api";
import { requireUserId } from "@/lib/auth/session";
import { connectDb } from "@/lib/db";
import Enrollment from "@/models/Enrollment";

export async function GET() {
  try {
    const userId = await requireUserId();
    await connectDb();
    const enrollments = await Enrollment.find({ userId })
      .populate("courseId", "title slug thumbnail price")
      .sort({ enrolledAt: -1 });
    return jsonOk(enrollments);
  } catch (error) {
    return handleRouteError(error);
  }
}
